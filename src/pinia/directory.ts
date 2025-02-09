import { defineStore } from "pinia";
import { Prefixes, useLoaders } from "./loaders";

export const KOHYA_FOLDER_PATTERN: RegExp = /^\d+[_]\w+[ ]\w+$/i;
export const KOHYA_FOLDER_REGEX: RegExp = /(\d+)[_](\w+)[ ](\w+)/i;

interface State {
  kohyaConfig: string | null;
  baseDirectory: string;
  activeDirectory: string;
  relatedDirectories: {
    path: string;
    isKohya: boolean;
  }[];
  subDirectories: Record<string, ImageDirectory>;
}

export const useDirectory = defineStore("directory", {
  state: (): State => ({
    kohyaConfig: null, // Kohya config file
    baseDirectory: "", // root directory [from input or kohya config]
    activeDirectory: "", // current directory, relative to baseDirectory
    relatedDirectories: [], // directories in the same level as activeDirectory
    subDirectories: {}, // directories inside activeDirectory
  }),

  getters: {
    workingDirectory(state: State) {
      if (state.baseDirectory === "") return "";
      if (state.activeDirectory === "") return state.baseDirectory;
      return `${state.baseDirectory}/${state.activeDirectory}`;
    },
    isKohyaFolder(state: State) {
      return KOHYA_FOLDER_PATTERN.test(state.activeDirectory);
    },
    kohyaSettings(state: State) {
      if (!state.activeDirectory) return null;
      if (!KOHYA_FOLDER_PATTERN.test(state.activeDirectory)) return null;
      const match = state.activeDirectory.match(KOHYA_FOLDER_REGEX);
      return {
        repeats: parseInt(match![1]),
        newClassName: match![2],
        className: match![3],
      };
    },
    containsKohyaFolder(state: State) {
      return state.relatedDirectories.some((dir) => dir.isKohya);
    },
  },

  actions: {
    async fetchDirectories(path: string, save: boolean = false) {
      if (path === "") {
        return [];
      }

      const directories = await $fetch<{
        path: string;
        isValid: boolean;
        isKohya: boolean;
        innerDirectories: string[];
        kohyaDirectories: string[];
      }>(`/api/directories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
      const dirs = directories.innerDirectories.map((dir) => ({
        path: dir,
        isKohya: directories.kohyaDirectories.includes(dir),
      }));
      if (save) {
        this.relatedDirectories = dirs;
        return dirs;
      }
      return dirs;
    },

    async scanDirectories() {
      const loader = useLoaders();
      for (const directory of this.relatedDirectories) {
        loader.enqueue(`${Prefixes.DIRSCAN}${directory.path}`);
      }

      for (const directory of this.relatedDirectories) {
        loader.dequeue(`${Prefixes.DIRSCAN}${directory.path}`);
        loader.start(`${Prefixes.DIRSCAN}${directory.path}`);
        const res = await $fetch<ImageDirectory>(`/api/directories`, {
          params: {
            path: encodeURIComponent(`${this.baseDirectory}/${directory.path}`),
          },
        });
        this.subDirectories[directory.path] = res;
        loader.end(`${Prefixes.DIRSCAN}${directory.path}`);
      }
    },

    async setDirectory(path: string, asKohya: boolean = false) {
      this.activeDirectory = "";
      this.baseDirectory = path;
      this.relatedDirectories = [];
      this.subDirectories = {};
      if (asKohya) {
        await this.fetchDirectories(this.workingDirectory, true);
        await this.scanDirectories();
      }
    },

    async setFromConfig(configDir: string) {
      // call api to get the kohya config, set the base directory from training data dir
      const res = await $fetch<Record<string, any>>(`/api/directories/kohya`, {
        headers: {
          "Content-Type": "application/json",
        },
        query: {
          path: encodeURIComponent(configDir),
        },
      });

      if (res.kohya) {
        this.kohyaConfig = res.configPath;
        this.setDirectory(res.kohya.train_data_dir, true); // @ts-ignore @eslint-ignore
      }
      return res.configPath;
    },

    async setKohyaConfig(configPath: string) {
      // call api to get the kohya config, set the base directory from training data dir
      const res = await $fetch<Record<string, any>>(`/api/directories/kohya`, {
        headers: {
          "Content-Type": "application/json",
        },
        query: {
          path: encodeURIComponent(configPath),
        },
      });

      if (res.kohya) {
        this.kohyaConfig = configPath;
        this.setDirectory(res.kohya.train_data_dir, true); // @ts-ignore @eslint-ignore
      }
    },

    async createDirectory(name: string) {
      await $fetch(`/api/directories/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: `${this.baseDirectory}/${name}` }),
      });
      this.setDirectory(this.baseDirectory, true);
    },

    async removeDirectory(path: string) {
      await $fetch(`/api/directories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });

      const cache = this.activeDirectory;
      this.setDirectory(this.baseDirectory, true);
      this.activeDirectory = cache;
    },

    async cleanDirectory(path?: string) {
      if (!path) path = this.workingDirectory;
      const res = await $fetch<{
        count: number;
      }>(`/api/directories/clean`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
      return res.count;
    },

    async dedupeDirectory(path?: string) {
      if (!path) path = this.workingDirectory;
      const res = await $fetch<{
        status: string;
        count: number;
        pruned_files: string[];
      }>(`/inferrence/dedupe_files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dir: path }),
      });
      return {
        count: res.count,
        prunedFiles: res.pruned_files,
      };
    },
  },
});
