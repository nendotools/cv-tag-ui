import { defineStore } from "pinia";

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
      for (const directory of this.relatedDirectories) {
        const res = await $fetch<ImageDirectory>(`/api/directories`, {
          params: { path: encodeURIComponent(`${this.workingDirectory}/${directory}`) },
        });
        this.subDirectories[directory] = res;
      }
    },

    async setDirectory(path: string, asKohya: boolean = false) {
      this.activeDirectory = "";
      this.baseDirectory = path;
      if (asKohya) {
        await this.fetchDirectories(this.workingDirectory, true);
        await this.scanDirectories();
      }
    },
  },
});
