import { defineStore } from "pinia";
import { useLoaders, Prefixes } from "./loaders";
const worker = new Worker(new URL("../assets/workers/file.worker.ts", import.meta.url), { type: "module" });

interface State {
  directory: string;
  kohyaDirs: string[];
  files: ImageFile[];
  kohyaFiles: Record<string, ImageFile[]>;
  loadingMedia: boolean;
  page: number;
  pageSize: number;
  refreshing: boolean;
  filters: Record<string, AndFilter | OrFilter>;
  appliedFilters: Set<string>;
}

export const useFiles = defineStore("files", {
  state: (): State => ({
    directory: "",
    files: [],
    kohyaDirs: [],
    kohyaFiles: {},
    loadingMedia: false,
    page: 1,
    pageSize: 20,
    refreshing: false,
    filters: {},
    appliedFilters: new Set<string>(),
  }),

  getters: {
    knownTags(state: State) {
      return Array.from(
        state.files.reduce((acc: Set<string>, file: ImageFile) => {
          const tags = file.tags.map((t) => t.replaceAll("\\", "").replaceAll("_", " "));
          return new Set([...acc, ...tags]);
        }, new Set()),
      );
    },
    visibleFiles(state: State) {
      // if the filter is an "and" filter, all tags must be present
      // if the filter is an "or" filter, at least one tag must be present
      // multiple filters are combined with "and" (all ANDs must be true, each OR must have at least one true)
      let allAnds = new Set<string>();
      const orGroups: Set<string>[] = [];
      for (const filter of state.appliedFilters) {
        if (state.filters[filter].type === "and") {
          allAnds = new Set([...allAnds, ...state.filters[filter].tags]);
        } else {
          orGroups.push(state.filters[filter].tags);
        }
      }
      const filtered = state.files.filter((f) => {
        for (const tag of allAnds) {
          if (!f.tags.includes(tag)) {
            return false;
          }
        }
        for (const orGroup of orGroups) {
          if (!orGroup.keys().some((tag) => f.tags.includes(tag))) {
            return false;
          }
        }

        return true;
      });
      return filtered.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
    },
    pages(state: State) {
      let allAnds = new Set<string>();
      const orGroups: Set<string>[] = [];
      for (const filter of state.appliedFilters) {
        if (state.filters[filter].type === "and") {
          allAnds = new Set([...allAnds, ...state.filters[filter].tags]);
        } else {
          orGroups.push(state.filters[filter].tags);
        }
      }
      const filtered = state.files.filter((f) => {
        for (const tag of allAnds) {
          if (!f.tags.includes(tag)) {
            return false;
          }
        }
        for (const orGroup of orGroups) {
          if (!orGroup.keys().some((tag) => f.tags.includes(tag))) {
            return false;
          }
        }

        return true;
      });
      return Math.ceil(filtered.length / state.pageSize);
    },
    hasNonSquareFiles(state: State) {
      return state.files.some(
        (f) => f.dimensions.width !== f.dimensions.height,
      );
    },
  },

  actions: {
    async applyFilter(name: string) {
      this.appliedFilters.add(name);
    },
    async removeFilter(name: string) {
      this.appliedFilters.delete(name);
    },
    async createFilter(name: string, type: "and" | "or") {
      this.filters[name] = { type, tags: new Set() };
    },
    async addFilterTag(name: string, tag: string) {
      this.filters[name].tags.add(tag);
    },
    async removeFilterTag(name: string, tag: string) {
      this.filters[name].tags.delete(tag);
    },
    async resetFiles() {
      this.files = [];
      this.setPage();
    },
    async setPage(page: number = 1) {
      this.page = Math.max(1, Math.min(page, Math.ceil(this.files.length / this.pageSize)));
    },
    async fetchDirectories(path: string) {
      const directories = await $fetch<{
        path: string;
        isValid: boolean;
        innerDirectories: string[];
      }>("/api/directories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });

      return directories.innerDirectories;
    },
    async setDirectory(path: string) {
      this.directory = path;
      await this.workerFetchFiles();
      this.files = [];
    },

    async workerFetchFiles() {
      // Send the API URL to the worker
      worker.postMessage(this.directory);

      // Listen for messages from the worker
      worker.onmessage = this.setFiles;
    },

    setFiles(event: any) {
      const { success, data, error } = event.data;
      if (success) {
        this.files.push(...data);
      } else {
        console.error('Error fetching data:', error);
      }
    },

    async updateFile(file: ImageFile, data: Blob) {
      // upload the file to the server
      const formData = new FormData();
      formData.append("file", data);
      formData.append("path", file.path);
      const response = await fetch("/api/files", {
        method: "PUT",
        body: formData,
      });
      return response;
    },

    async addTag(file: ImageFile, tag: string) {
      const fileIndex = this.files.findIndex((f) => f.path === file.path);
      if (fileIndex !== -1) {
        this.files[fileIndex].highConfidenceTags.push(tag);
        this.files[fileIndex].lowConfidenceTags = this.files[
          fileIndex
        ].lowConfidenceTags.filter((t) => t !== tag);
      }
      console.log("Adding tag", tag, "to", file.path);

      // update server
      await $fetch("/api/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: { path: file.path, add: [tag], remove: [] },
      });
    },

    async removeTag(file: ImageFile, tag: string) {
      const fileIndex = this.files.findIndex((f) => f.path === file.path);
      if (fileIndex !== -1) {
        this.files[fileIndex].highConfidenceTags = this.files[
          fileIndex
        ].highConfidenceTags.filter((t) => t !== tag);
        this.files[fileIndex].lowConfidenceTags.push(tag);
      }
      console.log("Removing tag", tag, "from", file.path);

      // update server
      await $fetch("/api/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: { path: file.path, add: [], remove: [tag] },
      });
    },

    async deleteFile(filePath: string) {
      this.files = this.files.filter((f) => f.path !== filePath);
      await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: filePath }),
      });
    },

    async analyzeImage(file: ImageFile) {
      const loaders = useLoaders();
      while (loaders.hasActiveLoaders(Prefixes.ANALYZE)) {
        loaders.enqueue(`${Prefixes.ANALYZE}${file.name}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      loaders.dequeue(`${Prefixes.ANALYZE}${file.name}`);

      loaders.start(`${Prefixes.ANALYZE}${file.name}`);
      console.log(`Analyzing image: ${file.path}`);
      const json = await $fetch<{ high_tags: string[], low_tags: string[] }>("/inferrence/process_file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file: file.path }),
      }).catch(async (_) => {
        // retry once after a delay
        await new Promise((resolve) => setTimeout(resolve, 250));
        return await $fetch<{ high_tags: string[], low_tags: string[] }>("/inferrence/process_file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file: file.path }),
        });
      });
      console.log(json);

      file.highConfidenceTags = Object.keys(json.high_tags);
      file.lowConfidenceTags = Object.keys(json.low_tags);
      file.tags = [...file.highConfidenceTags];

      const fileIndex = this.files.findIndex((f) => f.path === file.path);
      if (fileIndex !== -1) {
        this.files[fileIndex] = file;
      }
      loaders.end(`${Prefixes.ANALYZE}${file.name}`);
    },

    async analyzeDirectory() {
      const loaders = useLoaders();
      console.log("Analyzing all images");
      // visually queue all files for analysis
      for (const file of this.files) {
        loaders.enqueue(`${Prefixes.ANALYZE}${file.name}`);
      }
      for (const file of this.files) {
        await this.analyzeImage(file);
      }
    },

    async uploadFiles(files: FileList) {
      const formData = new FormData();
      formData.append("path", this.directory);
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const response = await $fetch<{ files: ImageFile[] }>("/api/upload", {
        method: "POST",
        body: formData,
      });

      for (const file of response.files) {
        this.files.unshift(file);
      }

      for (const file of response.files) {
        await this.analyzeImage(file);
      }
      this.pageSize = 20 + files.length;
    },
  },
});
