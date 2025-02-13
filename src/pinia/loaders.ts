import { defineStore } from "pinia";

interface State {
  queue: Set<string>;
  loaders: Set<string>;

  max: Record<Prefixes, number>;
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
    max: {
      [Prefixes.ANALYZE]: 0,
      [Prefixes.DIRSCAN]: 0,
      [Prefixes.TAGMERGE]: 0,
      [Prefixes.REMOVEBG]: 0,
    },
  }),

  getters: {
    analyzeQueue(state: State) {
      return Array.from(state.queue).filter((queue) =>
        queue.startsWith(Prefixes.ANALYZE),
      ).length;
    },
  },

  actions: {
    start(loader: string) {
      this.loaders.add(loader);
    },
    end(loader: string) {
      this.loaders.delete(loader);
    },
    enqueue(queue: string) {
      this.queue.add(queue);
      if (queue.startsWith(Prefixes.ANALYZE)) {
        this.max[Prefixes.ANALYZE]++;
      }
    },
    dequeue(queue: string) {
      this.queue.delete(queue);

      if (queue.startsWith(Prefixes.ANALYZE)) {
        if (!this.hasQueuedLoaders(Prefixes.ANALYZE)) {
          this.max[Prefixes.ANALYZE] = 0;
        }
      }
    },
    hasActiveLoaders(category: string) {
      return Array.from(this.loaders).some((loader) =>
        loader.startsWith(category),
      );
    },
    hasQueuedLoaders(category: string) {
      return Array.from(this.queue).some((queue) => queue.startsWith(category));
    },

    getMax(category: Prefixes) {
      return this.max[category];
    },

    isLoading(loader: string) {
      return this.loaders.has(loader) ?? false;
    },
    isQueued(queue: string) {
      return this.queue.has(queue) ?? false;
    },
  },
});
