import { defineStore } from "pinia";

interface State {
  models: string[];
  activeModel: string;
  modelTags: Record<string, string[]>;
}

const DEFAULT_MODEL = "wd-eva02-large-tagger-v3";

export const useTags = defineStore("tags", {
  state: (): State => ({
    models: [],
    activeModel: DEFAULT_MODEL,
    modelTags: {},
  }),

  actions: {
    async fetchModels() {
      const models = await fetch("/api/models");
      this.models = await models.json();
      this.fetchTags();
    },
    async fetchTags() {
      const { tags } = await $fetch<{ tags: string[]; error: string }>(
        `/api/tags`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          query: {
            model: this.activeModel,
          },
        },
      );
      if (tags) {
        this.modelTags[this.activeModel] = tags;
      }
    },
    async setActiveModel(model: string) {
      this.activeModel = model;
      await this.fetchTags();
    },
  },
});
