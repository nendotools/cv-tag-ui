import { defineStore } from "pinia";
interface State {
  data: Record<string, any>;
}

export const useRecall = defineStore("recall", {
  state: (): State => ({
    data: {},
  }),
  actions: {
    store(key: string, value: any) {
      this.data[key] = value;
      localStorage.setItem(key, JSON.stringify(value));
    },
    recall(key: string) {
      if (this.data[key]) {
        return this.data[key];
      }
      const value = localStorage.getItem(key);
      if (value && value !== "undefined") {
        this.data[key] = JSON.parse(value);
        return this.data[key];
      }
      return null;
    },
    remove(key: string) {
      delete this.data[key];
      localStorage.removeItem(key);
    },
    clear() {
      this.data = {};
      localStorage.clear();
    },
  },
});
