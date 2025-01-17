<template>
  <USlideover v-model="isOpen">
    <div class="h-full menu">
      <UHorizontalNavigation
        :links="links"
        class="row-span-1 col-span-1 border-b border-gray-200 dark:border-gray-800"
      />

      <!-- Settings, Model Options, Cleanup Tools -->
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
          <div class="text-2xs text-slate-300/60 break-all">
            path: {{ directoryStore.workingDirectory }}
          </div>
          <div class="flex flex-col text-sm text-gray-500 dark:text-gray-400">
          <UButton class="justify-center" color="rose" :disabled="removedFiles != null" @click="handleDedup">Remove Duplicates</UButton>
            <span class="pl-4">{{ removedFiles != null ? `Removed ${removedFiles} files` : "" }}</span>
          </div>
          <div class="flex flex-col text-sm text-gray-500 dark:text-gray-400">
          <UButton class="justify-center" color="rose" :disabled="removedTags != null" @click="handleClean">Remove Orphaned Tags</UButton>
            <span class="pl-4">{{ removedTags != null ? `Removed ${removedTags} files` : "" }}</span>
          </div>
        </div>
      </div>

      <!-- Tag Tools, Batch Add/Remove, Quick Filters -->
      <div v-if="mode === 'tags'" class="p-4 row-span-1 col-span-1">
        <h2 class="text-lg p-2">Kohya Tags</h2>
        <div class="pl-4 gap-2 flex flex-col gap-1 text-xs text-slate-300/60">
          When the working directory appears to be a Kohya directory, applicable tags can be quickly managed here.
          <div class="grid grid-cols-2 items-center gap-2">
            <span class="text-primary">New Class: {{ kohyaSettings?.newClassName || 'none' }}</span>
            <UButton class="flex-1 justify-center" color="emerald" :disabled="!kohyaSettings" @click="fileStore.bulkAddTag([kohyaSettings!.newClassName])">
              Add [{{ kohyaSettings ? fileStore.files.length - (fileStore.appliedTags[kohyaSettings?.newClassName] || 0) : 0 }}] Class Tags
            </UButton>
          </div>
          <div class="grid grid-cols-2 items-center gap-2">
            <span class="text-primary">Origin Class: {{ kohyaSettings?.className || 'none' }}</span>
            <UButton class="flex-1 justify-center" color="rose" :disabled="!kohyaSettings" @click="fileStore.bulkRemoveTag([kohyaSettings!.className])">
              Remove [{{ kohyaSettings ? fileStore.appliedTags[kohyaSettings?.className] || 0 : 0 }}] Class Tags
            </UButton>
          </div>
        </div>

        <h2 class="text-lg p-2 mt-4">Batch Add/Remove</h2>
        <div class="pl-4 gap-2 flex flex-col gap-1 text-xs text-slate-300/60">
          Create a list of tags to add or remove from all files in the working directory.
          <div class="w-full flex flex-row gap-2">
          <UInputMenu class="flex-1" placeholder="Search tags" v-model="tagSearch" :search="queryTags">
            <template #option="{ option }">
              <div class="flex flex-row justify-between gap-2">
                <span class="text-primary">[{{ aggregateTags[option] || (rawTags.includes(option) ? 0 : 'new') }}]</span>
                <span>{{ option }}</span>
              </div>
            </template>
          </UInputMenu>
          <UButton class="shrink-1" @click="setTag">Append Tag</UButton>
          </div>
          <div v-if="bulkTagList.size" class="w-full flex flex-row gap-2">
            <div class="flex flex-col flex-1 gap-2">
              <div class="flex flex-row flex-wrap gap-2 border border-slate-600 p-2 rounded-lg">
                <ATag v-for="tag in bulkTagList" :key="tag" :label="tag" :exists="true" @delete="removeTag(tag)" />
              </div>
              <div class="flex flex-row justify-between">
                <UButton color="rose" @click="bulkAction('remove')">Remove All</UButton>
                <UButton color="emerald" @click="bulkAction('add')">Add All</UButton>
              </div>
            </div>

            <div class="flex flex-col">
              <UButton :icon="previewTags ? 'fluent:eye-20-filled' : 'fluent:eye-off-20-filled'" color="gray" variant="link" @click="togglePreview" />
            </div>
          </div>
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
import ATag from "./ATag.vue";
const directoryStore = useDirectory();
const { kohyaSettings } = storeToRefs(directoryStore);
const fileStore = useFiles();
const tagStore = useTags();
const { aggregateTags } = storeToRefs(fileStore);
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

const emits = defineEmits(["filter","close"]);
onMounted(() => {
  threshold.value = fileStore.threshold*100;
  removedFiles.value = null;
  removedFiles.value = null;

  if (fileStore.filterPreview.size) {
    bulkTagList.value = new Set(fileStore.filterPreview);
  }
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

const tagSearch = ref<string>("");
const previewTags = ref<boolean>(true);
const bulkTagList = ref<Set<string>>(new Set());
const bulkTagAction = ref<"add" | "remove">("add");
const queryTags = async (q:string) => {
  // if empty, return top 10 known tags
  if (q.length < 1) {
    // return top 10 results from aggregated tags list on fileStore
    // need to sort Record<string, number> by value and return the keys
    return Object.keys(fileStore.aggregateTags)
      .sort((a, b) => fileStore.aggregateTags[b] - fileStore.aggregateTags[a])
      .slice(0, 10);
  }
  return [...new Set([q, ...rawTags.value
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
    .slice(0, 20)])];
};
const togglePreview = () => {
  previewTags.value = !previewTags.value;
  if (previewTags.value) {
    fileStore.setPreview(bulkTagList.value);
  } else {
    fileStore.setPreview();
  }
};
const bulkAction = (mode: "add" | "remove") => {
  if (mode === "add") {
    fileStore.bulkAddTag(Array.from(bulkTagList.value));
  } else {
    fileStore.bulkRemoveTag(Array.from(bulkTagList.value));
  }
  bulkTagList.value.clear();
  fileStore.setPreview();
};
const removeTag = (tag: string)=> {
  bulkTagList.value.delete(tag);
  if (previewTags.value) {
    fileStore.setPreview(bulkTagList.value);
  }
};
const setTag = (_: KeyboardEvent) => {
  console.log(tagSearch.value);
  if (tagSearch.value.length < 1) return;
    bulkTagList.value.add(tagSearch.value);
  if (previewTags.value) {
    fileStore.setPreview(bulkTagList.value);
  }

  tagSearch.value = "";
};

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

const isOpen = ref<boolean>(false);
const close = () => {
  isOpen.value = false;
  emits("close");
};
const mode = ref<"settings" | "tags" | "store" | "browse">("settings");
const links = computed(() => [
  {
    label: "",
    icon: "fluent:chevron-right-20-filled",
    click: close,
  },
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
