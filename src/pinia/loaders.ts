import { defineStore } from "pinia";

interface State {
  queue: Set<string>;
  loaders: Set<string>;
}

export enum Prefixes {
  ANALYZE = "analyze:",
  DIRSCAN = "scan-dir:",
  TAGMERGE = "tag-merge:",
  REMOVEBG = "remove-bg:",
}

export const useLoaders = defineStore("loaders", {
  state: (): State => ({
    queue: new Set(),
    loaders: new Set(),
  }),

  actions: {
    start(loader: string) {
      this.loaders.add(loader);
    },
    end(loader: string) {
      this.loaders.delete(loader);
    },
    enqueue(queue: string) {
      this.queue.add(queue);
    },
    dequeue(queue: string) {
      this.queue.delete(queue);
    },
    hasActiveLoaders(category: string) {
      return Array.from(this.loaders).some((loader) =>
        loader.startsWith(category),
      );
    },
    hasQueuedLoaders(category: string) {
      return Array.from(this.queue).some((queue) => queue.startsWith(category));
    },
    isLoading(loader: string) {
      return this.loaders.has(loader) ?? false;
    },
    isQueued(queue: string) {
      return this.queue.has(queue) ?? false;
    },
  },
});
