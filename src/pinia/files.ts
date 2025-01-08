import { defineStore } from "pinia";

interface State {
  directory: string;
  files: ImageFile[];
  loadingMedia: boolean;
  visibilityLimit: number;
}

export const useFiles = defineStore("files", {
  state: (): State => ({
    directory: "",
    files: [],
    loadingMedia: false,
    visibilityLimit: 20,
  }),

  getters: {
    visibleFiles(state: State) {
      return state.files.slice(0, state.visibilityLimit);
    },
    hasNonSquareFiles(state: State) {
      return state.files.some(
        (f) => f.dimensions.width !== f.dimensions.height,
      );
    },
  },

  actions: {
    async resetFiles() {
      this.files = [];
      this.visibilityLimit = 20;
    },
    async expandVisibility() {
      this.visibilityLimit += 20;
    },
    async fetchDirectories(path: string) {
      // use POST method to send data to the server
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
      await this.fetchFiles();
    },
    async fetchFiles() {
      this.loadingMedia = true;
      const files = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: this.directory }),
      }).then((res) => res.json());
      this.files = files.files;

      this.loadingMedia = false;
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
      console.log(`Analyzing image: ${file.path}`);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: file.path }),
      });
      const json = await response.json();
      file.highConfidenceTags = Object.keys(json[file.path].high_tags);
      file.lowConfidenceTags = Object.keys(json[file.path].low_tags);
      file.tags = [...file.highConfidenceTags];

      const fileIndex = this.files.findIndex((f) => f.path === file.path);
      if (fileIndex !== -1) {
        this.files[fileIndex] = file;
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
    },

    async analyzeDirectory() {
      console.log("Analyzing all images");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath: this.directory }),
      });
      const json: Record<string, any> = await response.json();
      for (const item in json) {
        const fileId = this.files.findIndex((f) => f.path === item);
        this.files[fileId].highConfidenceTags = Object.keys(
          json[item].high_tags,
        );
        this.files[fileId].lowConfidenceTags = Object.keys(json[item].low_tags);
      }
    },
  },
});
