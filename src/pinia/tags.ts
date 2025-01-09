import { defineStore } from "pinia";

interface State {
  models: string[];
  activeModel: string;
  modelTags: Record<string, ImageTag[]>;
  customTags: ImageTag[];
  categories: string[];
  categoryColors: string[];
}

const DEFAULT_MODEL = "wd-eva02-large-tagger-v3";
const CATEGORIES = ["General", "Artist", "Copyright", "Style", "Character"];
const CATEGORY_COLOR_CLASSES = [
  "indigo",
  "emerald",
  "amber",
  "fuchsia",
  "rose",
  "slate",
  "lime",
];

export const useTags = defineStore("tags", {
  state: (): State => ({
    models: [],
    activeModel: DEFAULT_MODEL,
    modelTags: {},
    customTags: [],
    categories: CATEGORIES,
    categoryColors: CATEGORY_COLOR_CLASSES,
  }),

  getters: {
    tags: (state) => state.modelTags[state.activeModel] || [],
    availableCategories: (state) => {
      // Filter out categories that have no tags
      const categories: Record<string, number> = {};
      state.categories.forEach((category, id) => {
        if (
          state.modelTags[state.activeModel].some((tag) => tag.category === id)
        ) {
          categories[category] = state.categories.findIndex(
            (c) => c === category,
          );
        }
      });
      return categories;
    },
    rawTags: (state) =>
      state.modelTags[state.activeModel].map((tag) => tag.label),
    generalTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 0)
        .map((tag) => tag.label),
    artistTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 1)
        .map((tag) => tag.label),
    copyrightTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 2)
        .map((tag) => tag.label),
    characterTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 3)
        .map((tag) => tag.label),
    styleTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 4)
        .map((tag) => tag.label),
    otherTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category > 4)
        .map((tag) => tag.label),
    tagColors: (state) => {
      if (!state.modelTags[state.activeModel]) {
        return {};
      }
      return state.modelTags[state.activeModel].reduce(
        (acc, tag) => {
          return { ...acc, [tag.label]: state.categoryColors[tag.category] };
        },
        {} as Record<string, string>,
      );
    },
  },

  actions: {
    async fetchModels() {
      const models = await fetch("/api/models");
      this.models = await models.json();
      this.fetchTags();
    },
    async fetchTags() {
      const { tags } = await $fetch<{
        tags: { label: string; category: number }[];
        error: string;
      }>(`/api/tags`, {
        headers: {
          "Content-Type": "application/json",
        },
        query: {
          model: this.activeModel,
        },
      });
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
