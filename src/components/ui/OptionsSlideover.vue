<template>
  <USlideover>
    <div class="h-full w-full menu">
      <UHorizontalNavigation
        :links="links"
        class="row-span-1 col-span-1 border-b border-gray-200 dark:border-gray-800"
      />

      <!-- Settings, Create Filter, Store Tags, Browse Tags -->
      <div v-if="mode === 'settings'" class="p-4 row-span-1 col-span-1">
        <h2 class="text-lg p-2">Analysis Settings</h2>
        <div class="pl-4 py-2 gap-2 flex flex-col gap-1">
          <span class="text-sm">Recognition Model:</span>
          <UInputMenu :options="tagStore.models" v-model="tagStore.activeModel" />
        </div>
        <div class="pl-4 py-2 flex flex-col gap-1">
          <span class="text-sm">Tag Confidence: <span class="text-primary">{{ threshold }}%</span></span>
          <URange :min="0" :max="100" v-model="threshold" @change="setThreshold" />
        </div>
        <h2 class="text-lg p-2">Clean-up</h2>
        <div class="flex flex-col gap-2 pl-4">
          <div class="text-2xs text-slate-300/60">
            path: {{ directoryStore.workingDirectory }}
          </div>
          <div class="flex flex-col text-sm text-gray-500 dark:text-gray-400">
          <UButton color="rose" :disabled="removedFiles != null" @click="handleDedup">Remove Duplicates</UButton>
            <span class="pl-4">{{ removedFiles != null ? `Removed ${removedFiles} files` : "" }}</span>
          </div>
          <div class="flex flex-col text-sm text-gray-500 dark:text-gray-400">
          <UButton color="rose" :disabled="removedTags != null" @click="handleClean">Remove Orphaned Tags</UButton>
            <span class="pl-4">{{ removedTags != null ? `Removed ${removedTags} files` : "" }}</span>
          </div>
        </div>
      </div>

      <div v-if="mode === 'tags'" class="p-4 row-span-1 col-span-1">
        <h2 class="text-lg p-2">Bulk Add/Remove</h2>
        <div class="pl-4 gap-2 flex flex-col gap-1 text-xs text-slate-300/60">
          Create a list of tags to add or remove from all files in the working directory.
          <UInputMenu placeholder="Search tags" v-model="tagSearch" :options="queryTags">
            <template #option="{ option }">
              <div class="flex flex-row justify-between gap-2">
                <span class="text-primary">[{{ fileStore.aggregateTags[option] }}]</span>
                <span>{{ option }}</span>
              </div>
            </template>
          </UInputMenu>
        </div>

        <h2 class="text-lg p-2">Quick Filters</h2>
        <div class="flex flex-row gap-2">
          <UInput placeholder="Filter Name" v-model="newFilter" @keypress.enter="createFilter" />
          <UButton @click="createFilter">Add Filter</UButton>
        </div>

        <UInputMenu v-if="activeFilter.length" placeholder="Search tags" v-model="search" :search="suggestedTags" @keypress.enter="addFilterTag" />

        <div v-for="(filter, name) in fileStore.filters" :key="name">
          {{ name }}
        </div>
      </div>
      <div v-if="mode === 'browse'" class="p-4 row-span-1 col-span-1">
        <UInput placeholder="Search tags" v-model="search" />
        <div class="flex flex-row gap-4">
          <UButton
            v-for="(index, category) of availableCategories"
            :key="index"
            :color="activeCategory === index ? 'primary' : 'gray'"
            variant="link"
            @click="activeCategory = index"
            :ui="{
              rounded: 'rounded-full',
              padding: { base: 'px-2 py-1' },
            }"
          >
            {{ category }}
          </UButton>
          <UButton
            v-if="filteredCustomTags.size"
            :color="activeCategory === 6 ? 'primary' : 'gray'"
            variant="link"
            @click="activeCategory = 6"
            :ui="{
              rounded: 'rounded-full',
              padding: { base: 'px-2 py-1' },
            }"
          >
            Custom
          </UButton>
          <UButton
            v-if="otherTags.length"
            :color="activeCategory === 5 ? 'primary' : 'gray'"
            variant="link"
            @click="activeCategory = 5"
            :ui="{
              rounded: 'rounded-full',
              padding: { base: 'px-2 py-1' },
            }"
          >
            Other
          </UButton>
        </div>
        <div
          class="h-full flex flex-wrap content-baseline gap-4 overflow-y-auto overflow-x-hidden"
        >
          <span
            v-for="tag in computedTags.filter((tag) => tag.includes(search))"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ tag }}
          </span>
        </div>

        <div
          class="border-indigo-400 border-emerald-400 border-amber-400 border-fuschia-400 border-rose-400 border-slate-400"
        ></div>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import { useDirectory } from "~/pinia/directory";
import { useFiles } from "~/pinia/files";
import { useTags } from "~/pinia/tags";
const directoryStore = useDirectory();
const fileStore = useFiles();
const tagStore = useTags();
const {
  rawTags,
  generalTags,
  artistTags,
  copyrightTags,
  characterTags,
  styleTags,
  otherTags,
  availableCategories,
  customTags,
  categoryColors,
} = storeToRefs(tagStore);

const emits = defineEmits(["filter"]);
onMounted(() => {
  threshold.value = fileStore.threshold*100;
  removedFiles.value = null;
  removedFiles.value = null;
});

const threshold = ref<number>(0);
const setThreshold = () => {
  fileStore.setThreshold(threshold.value);
};
const removedTags = ref<number | null>(null);
const removedFiles = ref<number | null>(null);
const handleDedup = async () => {
  const { count }= await directoryStore.dedupeDirectory();
  removedFiles.value = count;
};
const handleClean = async () => {
  const count = await directoryStore.cleanDirectory();
  removedTags.value = count;
};

const bulkTagList = ref<Set<string>>(new Set());
const tagSearch = ref<string>("");
const bulkTagAction = ref<"add" | "remove">("add");
const queryTags = computed(() => {
  // if empty, return top 10 known tags
  if (tagSearch.value.length < 1) {
    // return top 10 results from aggregated tags list on fileStore
    // need to sort Record<string, number> by value and return the keys
    return Object.keys(fileStore.aggregateTags)
      .sort((a, b) => fileStore.aggregateTags[b] - fileStore.aggregateTags[a])
      .slice(0, 10);
  }
  return rawTags.value
    .filter((tag) => tag.includes(tagSearch.value))
    // sort by exact match, then by length, then by alphabetical order
    .sort((a, b) => {
      if (a === tagSearch.value) return -1;
      if (b === tagSearch.value) return 1;
      if (a.length === b.length) return a.localeCompare(b);
      return a.length - b.length;
    })
    .slice(0, 20);
});

const newFilter = ref<string>("");
const activeFilter = ref<string>("");
const createFilter = (_: KeyboardEvent) => {
  if (newFilter.value.length < 1) return;
  fileStore.createFilter(newFilter.value, 'and');
  activeFilter.value = newFilter.value;
  newFilter.value = "";
};

const search = ref<string>("");
const suggestedTags = (q: string) => {
  if (q.length < 1) return [];
  return rawTags.value
    .filter((tag) => tag.includes(q))
    // sort by exact match, then by length, then by alphabetical order
    .sort((a, b) => {
      if (a === q) return -1;
      if (b === q) return 1;
      if (a.length === b.length) return a.localeCompare(b);
      return a.length - b.length;
    })
    .slice(0, 10);
};
const addFilterTag = (_: KeyboardEvent) => {
  if (search.value.length < 1) return;
  if(!rawTags.value.includes(search.value)) return;
  emits("filter");

  fileStore.addFilterTag(activeFilter.value, search.value);
  search.value = "";
};

const mode = ref<"settings" | "tags" | "store" | "browse">("settings");
const links = computed(() => [
  {
    label: "Settings",
    click: () => (mode.value = "settings"),
    active: mode.value === "settings",
  },
  {
    label: "Tag Tools",
    click: () => (mode.value = "tags"),
    active: mode.value === "tags",
  },
  {
    label: "Store Tags",
    click: () => (mode.value = "store"),
    active: mode.value === "store",
  },
  {
    label: "Browse Tags",
    click: () => (mode.value = "browse"),
    active: mode.value === "browse",
  },
]);

const filteredCustomTags = computed(() => {
  const customKnownTags = fileStore.knownTags.filter(
    (tag) => !rawTags.value.includes(tag),
  );
  return new Set([...customTags.value.map((tag)=>tag.name), ...customKnownTags]);
});
const activeCategory = ref<number>(0);
const computedTags = computed(() => {
  switch (activeCategory.value) {
    case 0:
      return generalTags.value;
    case 1:
      return artistTags.value;
    case 2:
      return copyrightTags.value;
    case 3:
      return characterTags.value;
    case 4:
      return styleTags.value;
    case 5:
      return otherTags.value;
    case 6:
      return Array.from(filteredCustomTags.value);
    default:
      return [];
  }
});
</script>

<style scoped>
.menu {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content minmax(0, 1fr);
  gap: 0.4rem;
}
</style>
