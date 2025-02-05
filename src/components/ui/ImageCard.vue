<template>
  <UCard>
    <div
      class="grid items-center landscape:grid-cols-5 portrait:grid-cols-1 grid-rows-auto"
    >
      <!-- Image and Image tools -->
      <div
        class="relative flex flex-col items-stretch justify-center overflow-hidden col-span-2"
      >
        <img :src="file.resource" />
      </div>

      <!-- File Details -->
      <div
        class="flex flex-col self-start ml-4 landscape:col-start-3 landscape:col-end-6 gap-2"
      >
        <p class="text-sm font-semibold">{{ file.name }}</p>
        <p class="text-xs text-gray-500">{{ file.path }}</p>
        <div class="text-xs flex flex-row items-center">
          <div>
            Dimensions:
            <span :class="[sizeColor.text]">
              {{ file.dimensions.width }} x {{ file.dimensions.height }}
            </span>
          </div>
          <OrientationDisplay :dimensions="file.dimensions" />
        </div>
        <div>
          <UHorizontalNavigation
            :links="[
              {
                label: 'Rank',
                icon: 'fluent:crown-20-filled',
                badge: {
                  label: ((file?.confidenceScore || 0) * 100).toFixed(1) + '%',
                  color: 'amber',
                  variant: 'soft',
                },
                active: getTagOptCache(file.name) === OptCategories.RANK,
                click: () => setMenuOptCache(file.name, OptCategories.RANK),
              },
              {
                label: 'Applied Tags',
                icon: 'fluent:tag-multiple-16-filled',
                badge: {
                  label: file.highConfidenceTags.length,
                  color: 'emerald',
                  variant: 'soft',
                },
                active: getTagOptCache(file.name) === OptCategories.ASSIGNED,
                click: () => setMenuOptCache(file.name, OptCategories.ASSIGNED),
              },
              {
                label: 'Excluded Tags',
                icon: 'fluent:tag-multiple-16-regular',
                badge: {
                  label: file.lowConfidenceTags.length,
                  color: 'rose',
                  variant: 'soft',
                },
                active: getTagOptCache(file.name) === OptCategories.EXCLUDED,
                click: () => setMenuOptCache(file.name, OptCategories.EXCLUDED),
              },
              {
                label: 'Tools',
                icon: 'fluent:developer-board-lightning-toolbox-20-regular',
                active: getTagOptCache(file.name) === OptCategories.TOOLS,
                click: () => setMenuOptCache(file.name, OptCategories.TOOLS),
              },
              {
                label: 'Scan',
                avatar: {
                  icon:
                    loaders.hasActiveLoaders(Prefixes.ANALYZE + file.name) ||
                    loaders.hasQueuedLoaders(Prefixes.ANALYZE + file.name)
                      ? 'fluent:tag-search-20-filled'
                      : 'fluent:tag-search-20-regular',
                  chipColor: loaders.hasQueuedLoaders(
                    Prefixes.ANALYZE + file.name,
                  )
                    ? 'amber'
                    : loaders.hasActiveLoaders(Prefixes.ANALYZE + file.name)
                      ? 'rose'
                      : undefined,
                },
                disabled:
                  [...file.highConfidenceTags, ...file.lowConfidenceTags]
                    .length > 0,
                click: () => fileStore.analyzeImage(file),
              },
            ]"
          />
          <div
            v-show="getTagOptCache(file.name) === OptCategories.RANK"
            class="ml-4 flex flex-col gap-2 m-4"
          >
            <ATag
              v-for="(score, tag) in file.confidenceKeys"
              :key="tag"
              :label="`${tag} (${(score * 100).toFixed(1)}%)`"
              :exists="true"
              :simple="true"
            />

            <div v-if="!file.tags.length && !file?.confidenceKeys?.length">
              <p class="text-zinc-50/25">None</p>
            </div>
          </div>
          <div
            v-show="getTagOptCache(file.name) === OptCategories.ASSIGNED"
            class="ml-4 grid grid-rows-5 grid-cols-5 gap-2 m-4"
          >
            <ATag
              v-for="tag in [...file?.highConfidenceTags]"
              :key="tag"
              :label="tag"
              :exists="true"
              :simple="mode !== 'tag'"
              :duplicates="imageDuplicateTags[file.hash]"
              :class="{ 'cursor-pointer': mode === 'view' }"
              @delete="fileStore.removeTag(file, [tag])"
              @click.stop="$emit('set-focus-tag', tag)"
            />

            <div v-if="!file.tags.length && !file?.highConfidenceTags?.length">
              <p class="text-zinc-50/25">None</p>
            </div>

            <div class="col-start-1 col-span-full flex flex-row gap-2 mt-4">
              <h4>Add Tags</h4>
              <TagInput
                :tags="file.highConfidenceTags"
                @add="(tag: string) => fileStore.addTag(file, [tag])"
              />
            </div>
          </div>
          <div
            v-show="getTagOptCache(file.name) === OptCategories.EXCLUDED"
            class="ml-4 grid grid-rows-5 grid-cols-5 gap-2 m-4"
          >
            <ATag
              v-for="tag in [...file?.lowConfidenceTags]"
              :key="tag"
              :label="tag"
              :exists="false"
              :simple="mode !== 'tag'"
              :class="{ 'cursor-pointer': mode === 'view' }"
              @add="fileStore.addTag(file, [tag])"
              @click.stop="$emit('set-focus-tag', tag)"
            />

            <div v-if="!file?.lowConfidenceTags?.length">
              <p class="text-zinc-50/25">None</p>
            </div>
          </div>
          <div
            v-show="getTagOptCache(file.name) === OptCategories.TOOLS"
            class="ml-4 grid grid-flow-col grid-rows-5 grid-cols-3 gap-2 m-4"
          >
            <UButton
              icon="fluent:image-search-20-regular"
              color="primary"
              class="rounded-full p-2"
              variant="solid"
              size="xs"
              :loading="loaders.isLoading(Prefixes.ANALYZE + file.name)"
              :disabled="
                loaders.isLoading(Prefixes.ANALYZE + file.name) ||
                loaders.isQueued(Prefixes.ANALYZE + file.name)
              "
              @click="fileStore.analyzeImage(file)"
            >
              Analyze Image
            </UButton>
            <UButton
              icon="fluent:color-background-20-regular"
              :color="isSquare(file) ? 'white' : 'emerald'"
              class="rounded-full p-2"
              variant="solid"
              size="xs"
              :disabled="isSquare(file)"
              @click="$emit('make-square', file)"
            >
              Make Square
            </UButton>
            <UButton
              icon="fluent:crop-16-regular"
              color="emerald"
              class="rounded-full p-2"
              variant="solid"
              size="xs"
              @click="$emit('crop-file', file)"
            >
              Crop Image
            </UButton>
            <UButton
              icon="fluent:delete-16-regular"
              color="red"
              class="rounded-full p-2"
              variant="solid"
              size="xs"
              @click="$emit('delete-file', file)"
            >
              Delete Image
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import ATag from "~/components/ui/ATag.vue";
import TagInput from "~/components/ui/TagInput.vue";

import { useMakeSquare } from "~/composables/useMakeSquare";
const { isSquare, isSmall, isMedium, isLarge, isPortrait, isLandscape } =
  useMakeSquare();

import { useLoaders, Prefixes } from "~/pinia/loaders";
const loaders = useLoaders();

import { useFiles } from "@/pinia/files";
import OrientationDisplay from "./OrientationDisplay.vue";
const fileStore = useFiles();

const { imageDuplicateTags } = storeToRefs(fileStore);

const props = defineProps<{
  mode: string;
  file: ImageFile;
}>();

defineEmits<{
  (event: "crop-file", file: ImageFile): void;
  (event: "delete-file", file: ImageFile): void;
  (event: "set-focus-tag", tag: string): void;
  (event: "make-square", file: ImageFile): void;
}>();
enum OptCategories {
  RANK = "rank",
  ASSIGNED = "assigned",
  EXCLUDED = "excluded",
  TOOLS = "tools",
}
const tagOptCache = ref<Record<string, OptCategories>>({});
const setMenuOptCache = (tag: string, value: OptCategories) => {
  tagOptCache.value[tag] = value;
};
const getTagOptCache = (tag: string) =>
  tagOptCache.value[tag] || OptCategories.ASSIGNED;

const unOptimized = (file: ImageFile) => {
  // if the high confidence tags are empty, then return true
  if (!file.highConfidenceTags.length) return true;

  // if the high confidence tags are not empty, then return true if the tags include no duplicate words in all tags
  const words = file.highConfidenceTags
    .map((word) => (word.split(" ").pop() || "").toLowerCase())
    .filter((word) => word.length > 0);
  return new Set(words).size === words.length;
};

const sizeColor = computed(() => {
  if (isSmall(props.file.dimensions))
    return {
      text: "text-rose-500",
      border: "border-rose-500",
      bg: "bg-rose-500/10",
    };
  if (isMedium(props.file.dimensions))
    return {
      text: "text-amber-500",
      border: "border-amber-500",
      bg: "bg-amber-500/10",
    };
  if (isLarge(props.file.dimensions))
    return {
      text: "text-emerald-500",
      border: "border-emerald-500",
      bg: "bg-emerald-500/10",
    };
  return {
    text: "text-zinc-500",
    border: "border-zinc-500",
    bg: "bg-zinc-500/10",
  };
});
</script>
