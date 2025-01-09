<template>
  <USlideover>
    <div class="h-full w-full menu">
      <UHorizontalNavigation
        :links="links"
        class="row-span-1 col-span-1 border-b border-gray-200 dark:border-gray-800"
      />

      <!-- Create Filter, Store Tags, Browse Tags -->
      <div v-if="mode === 'create'" class="p-4 row-span-1 col-span-1">
        <h3>New Filter</h3>
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
import { useFiles } from "~/pinia/files";
import { useTags } from "~/pinia/tags";
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

const newFilter = ref<string>("");
const activeFilter = ref<string>("");
const createFilter = (_: KeyboardEvent) => {
  if (newFilter.value.length < 1) return;
  fileStore.createFilter(newFilter.value, 'and', new Set());
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
  fileStore.addFilterTag('or', search.value);
  search.value = "";
};

const mode = ref<"create" | "store" | "browse">("browse");
const links = computed(() => [
  {
    label: "Create Filter",
    click: () => (mode.value = "create"),
    active: mode.value === "create",
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
  return new Set([...customTags.value.map((tag)=>tag.label), ...customKnownTags]);
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
