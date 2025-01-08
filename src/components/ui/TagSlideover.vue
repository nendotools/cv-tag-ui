<template>
  <USlideover>
    <div class="h-full w-full menu">
      <UHorizontalNavigation
        :links="links"
        class="row-span-1 col-span-1 border-b border-gray-200 dark:border-gray-800"
      />

      <!-- Create Filter, Store Tags, Browse Tags -->
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
import { useTags } from "~/pinia/tags";
const tagStore = useTags();
const {
  tags,
  generalTags,
  artistTags,
  copyrightTags,
  characterTags,
  styleTags,
  otherTags,
  availableCategories,
  categoryColors,
} = storeToRefs(tagStore);

const search = ref<string>("");
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
