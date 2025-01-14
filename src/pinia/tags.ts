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
      state.modelTags[state.activeModel].map((tag) => tag.name.replaceAll("_", " ")),
    generalTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 0)
        .map((tag) => tag.name),
    artistTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 1)
        .map((tag) => tag.name),
    copyrightTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 2)
        .map((tag) => tag.name),
    characterTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 3)
        .map((tag) => tag.name),
    styleTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category === 4)
        .map((tag) => tag.name),
    otherTags: (state) =>
      state.modelTags[state.activeModel]
        .filter((tag) => tag.category > 4)
        .map((tag) => tag.name),
    tagColors: (state) => {
      if (!state.modelTags[state.activeModel]) {
        return {};
      }
      return state.modelTags[state.activeModel].reduce(
        (acc, tag) => {
          return { ...acc, [tag.name]: state.categoryColors[tag.category] };
        },
        {} as Record<string, string>,
      );
    },
  },

  actions: {
    async fetchModels() {
      const models = await $fetch<string[]>("/inferrence/models");
      this.models = models;
      this.fetchTags();
    },
    async fetchTags() {
      const model = this.models.includes(this.activeModel) ? this.activeModel : this.models[0];
      const tags = await $fetch<{ name: string; category: number }[]>(`/inferrence/tags`, {
        headers: {
          "Content-Type": "application/json",
        },
        query: {
          model,
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
