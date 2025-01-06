import { defineStore } from "pinia";

interface State {
  directory: string;
  files: ImageFile[];
  loadingMedia: boolean;
}

export const useFiles = defineStore("files", {
  state: (): State => ({
    directory: "",
    files: [],
    loadingMedia: false,
  }),
  actions: {
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
  },
});
