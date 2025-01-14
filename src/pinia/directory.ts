import { defineStore } from "pinia";
import { Prefixes, useLoaders } from "./loaders";

export const KOHYA_FOLDER_PATTERN: RegExp = /^\d+[_]\w+[ ]\w+$/i;

interface State {
  baseDirectory: string;
  activeDirectory: string;
  relatedDirectories: string[];
  subDirectories: Record<string, ImageDirectory>;
}

export const useDirectory = defineStore("directory", {
  state: (): State => ({
    baseDirectory: "", // root directory
    activeDirectory: "", // current directory, relative to baseDirectory
    relatedDirectories: [], // directories in the same level as activeDirectory
    subDirectories: {}, // directories inside activeDirectory
  }),

  getters: {
    workingDirectory(state: State) {
      if (state.baseDirectory === "") return '';
      if (state.activeDirectory === "") return state.baseDirectory;
      return `${state.baseDirectory}/${state.activeDirectory}`;
    },
    isKohyaFolder(state: State) {
      return KOHYA_FOLDER_PATTERN.test(state.activeDirectory);
    },
    containsKohyaFolder(state: State) {
      return state.relatedDirectories.some((dir) => KOHYA_FOLDER_PATTERN.test(dir));
    }
  },

  actions: {
    async fetchDirectories(path: string, save: boolean = false) {
      if (path === "") {
        return [];
      }

      const directories = await $fetch<{
        path: string;
        isValid: boolean;
        innerDirectories: string[];
      }>(`/api/directories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });
      if (save) {
        this.relatedDirectories = directories.innerDirectories;
        return directories.innerDirectories;
      }
      return directories.innerDirectories;
    },

    async scanDirectories() {
      const loader = useLoaders();
      for (const directory of this.relatedDirectories) {
        loader.enqueue(`${Prefixes.DIRSCAN}${directory}`);
      }

      for (const directory of this.relatedDirectories) {
        loader.dequeue(`${Prefixes.DIRSCAN}${directory}`);
        loader.start(`${Prefixes.DIRSCAN}${directory}`);
        const res = await $fetch<ImageDirectory>(`/api/directories`, {
          params: { path: encodeURIComponent(`${this.baseDirectory}/${directory}`) },
        });
        this.subDirectories[directory] = res;
        loader.end(`${Prefixes.DIRSCAN}${directory}`);
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
        prunedFiles: res.pruned_files
      };
    },
  },
});
