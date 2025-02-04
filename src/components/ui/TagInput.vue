<template>
  <UInputMenu
    class="flex-1"
    placeholder="Search tags"
    v-model="tagSearch"
    :search="queryTags"
    @keydown.enter="addTag"
  >
    <template #option="{ option }">
      <div class="flex flex-row justify-between gap-2">
        <span class="text-primary"
          >[{{
            aggregateTags[option] || (rawTags.includes(option) ? 0 : "new")
          }}]</span
        >
        <span>{{ option }}</span>
      </div>
    </template>
  </UInputMenu>
  <UButton class="shrink-1" @click="addTag">Append Tag</UButton>
</template>

<script setup lang="ts">
import { useFiles } from "~/pinia/files";
import { useTags } from "~/pinia/tags";
const fileStore = useFiles();
const tagStore = useTags();
const { aggregateTags } = storeToRefs(fileStore);
const { rawTags } = storeToRefs(tagStore);

const tagSearch = ref("");
const props = withDefaults(
  defineProps<{
    label?: string;
    tags?: string[];
  }>(),
  {
    tags: () => [],
    label: "Append Tag",
  },
);

const emits = defineEmits<{
  (event: "add", tag: string): void;
}>();

const queryTags = async (q: string) => {
  // if empty, return top 10 known tags
  if (q.length < 1) {
    // return top 10 results from aggregated tags list on fileStore
    // need to sort Record<string, number> by value and return the keys
    return Object.keys(fileStore.aggregateTags)
      .filter((tag) => !props.tags.includes(tag))
      .sort((a, b) => fileStore.aggregateTags[b] - fileStore.aggregateTags[a])
      .slice(0, 10);
  }
  console.log(rawTags.value.length);
  const filteredTags = rawTags.value.filter((tag) => tag.includes(q));
  console.log(filteredTags);
  return [
    ...new Set([
      q,
      ...rawTags.value
        .filter((tag) => tag.includes(q))
        // sort by exact match, then by occurrence, then by length, then by alphabetical order
        .sort((a, b) => {
          if (a === q) return -1;
          if (b === q) return 1;
          const aRank = fileStore.aggregateTags[a] || 0;
          const bRank = fileStore.aggregateTags[b] || 0;
          if (aRank !== bRank) return bRank - aRank;
          if (a.startsWith(q) && !b.startsWith(q)) return -1;
          if (b.startsWith(q) && !a.startsWith(q)) return 1;
          if (a.length === b.length) return a.localeCompare(b);
          return a.length - b.length;
        })
        .slice(0, 20),
    ]),
  ];
};

const addTag = () => {
  if (tagSearch.value.length < 1) return;
  emits("add", tagSearch.value);
  tagSearch.value = "";
};
</script>
