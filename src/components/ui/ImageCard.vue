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
          <UHorizontalNavigation :links="links" />
          <div
            v-show="getTagOptCache() === OptCategories.RANK"
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
            v-show="getTagOptCache() === OptCategories.ASSIGNED"
            class="ml-4 grid grid-rows-1 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 m-4"
          >
            <div
              v-if="file?.highConfidenceTags.length"
              class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 grid-rows-5 col-span-1 md:col-span-2 lg:col-span-3 gap-2"
            >
              <ATag
                v-for="tag in [...file?.highConfidenceTags]"
                :key="tag"
                :label="tag"
                :exists="true"
                :simple="!editMode"
                :highlight="duplicateTags.includes(tag.split(' ').pop() || '')"
                :class="{ 'cursor-pointer': mode === 'view' }"
                @delete="fileStore.removeTag(file, [tag])"
                @click.stop="emitFocusTag(tag)"
              />

              <div class="col-start-1 col-span-full flex flex-row gap-2 mt-4">
                <h4>Add Tags</h4>
                <TagInput
                  :tags="file.highConfidenceTags"
                  @add="(tag: string) => fileStore.addTag(file, [tag])"
                />
              </div>
            </div>
            <div class="flex flex-col items-stretch gap-2 m-4">
              <h3 class="text-sm font-semibold text-center">Tagging</h3>
              <UButton
                icon="fluent:image-search-20-regular"
                color="primary"
                class="rounded-full p-2"
                variant="solid"
                size="xs"
                :loading="loaders.isLoading(Prefixes.ANALYZE + file.name)"
                :disabled="
                  loaders.isLoading(Prefixes.ANALYZE + file.name) ||
                  loaders.isQueued(Prefixes.ANALYZE + file.name) ||
                  editMode
                "
                @click="$emit('analyze-image', file)"
              >
                Analyze Image
              </UButton>
              <UButton
                icon="fluent:arrow-join-20-regular"
                color="primary"
                class="rounded-full p-2"
                variant="solid"
                size="xs"
                :disabled="!hasDuplicates || editMode"
                :loading="loaders.isLoading(Prefixes.TAGMERGE + file.name)"
                @click="attemptMergeTags"
              >
                Merge Tags
              </UButton>
              <UButton
                icon="fluent:edit-line-horizontal-3-20-regular"
                color="primary"
                class="rounded-full p-2"
                variant="solid"
                size="xs"
                :disabled="!file.highConfidenceTags.length"
                :loading="loaders.isLoading(Prefixes.TAGMERGE + file.name)"
                @click="toggleEditMode"
              >
                Edit Tags
              </UButton>
              <h3 class="mt-3 text-sm font-semibold text-center">Edit Image</h3>
              <UButton
                icon="fluent:video-background-effect-20-regular"
                color="emerald"
                class="rounded-full p-2"
                variant="solid"
                size="xs"
                :disabled="removingBackground || editMode"
                :loading="removingThisBackground"
                @click="$emit('remove-bg', file)"
              >
                Remove Background
              </UButton>
              <UButton
                icon="fluent:color-background-20-regular"
                color="emerald"
                class="rounded-full p-2"
                variant="solid"
                size="xs"
                :disabled="isSquare(file) || editMode"
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
                :disabled="editMode"
                @click="$emit('crop-file', file)"
              >
                Crop Image
              </UButton>
              <hr class="w-1/2 self-center my-4" />
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

          <div
            v-show="getTagOptCache() === OptCategories.EXCLUDED"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 grid-rows-5 gap-2"
          >
            <ATag
              v-for="tag in [...file?.lowConfidenceTags]"
              :key="tag"
              :label="tag"
              :exists="false"
              :simple="!editMode"
              :class="{ 'cursor-pointer': mode === 'view' }"
              @add="fileStore.addTag(file, [tag])"
              @click.stop="emitFocusTag(tag)"
            />

            <div v-if="!file?.lowConfidenceTags?.length">
              <p class="text-zinc-50/25">None</p>
            </div>
          </div>

          <div
            v-show="getTagOptCache() === OptCategories.MOVE"
            class="m-4 flex flex-col max-w-xs gap-2"
          >
            <UButton
              v-for="(opt, index) in adjacentFolders"
              :key="index"
              icon="fluent:folder-20-regular"
              color="indigo"
              class="rounded-full p-2"
              variant="solid"
              size="xs"
              @click="fileStore.moveFiles(file, opt.path)"
            >
              Move to {{ opt.name }}
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
import OrientationDisplay from "./OrientationDisplay.vue";

import { useMakeSquare } from "~/composables/useMakeSquare";
const { isSquare, isSmall, isMedium, isLarge } = useMakeSquare();

import { useLoaders, Prefixes } from "~/pinia/loaders";
const loaders = useLoaders();

import { useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();
const adjacentFolders = computed(() => {
  const dirs = {
    ...directoryStore.subDirectories,
  };
  delete dirs[directoryStore.activeDirectory];
  return dirs;
});

import { useFiles } from "@/pinia/files";
const fileStore = useFiles();

const { imageDuplicateTags } = storeToRefs(fileStore);

const props = defineProps<{
  mode: string;
  file: ImageFile;
}>();

const emits = defineEmits<{
  (event: "analyze-image", file: ImageFile): void;
  (event: "crop-file", file: ImageFile): void;
  (event: "delete-file", file: ImageFile): void;
  (event: "set-focus-tag", tag: string): void;
  (event: "make-square", file: ImageFile): void;
  (event: "remove-bg", file: ImageFile): void;
}>();

const editMode = ref(false);
const toggleEditMode = () => {
  editMode.value = !editMode.value;
};

const emitFocusTag = (tag: string) => {
  if (editMode.value) return;
  emits("set-focus-tag", tag);
};

const removingBackground = computed(() => {
  return loaders.hasActiveLoaders(Prefixes.REMOVEBG);
});
const removingThisBackground = computed(() => {
  return loaders.hasActiveLoaders(Prefixes.REMOVEBG + props.file.name);
});

enum OptCategories {
  RANK = "rank",
  ASSIGNED = "assigned",
  EXCLUDED = "excluded",
  MOVE = "move",
}
const tagOptCache = ref<OptCategories>(OptCategories.ASSIGNED);
const setMenuOptCache = (value: OptCategories) => {
  tagOptCache.value = value;
};
const getTagOptCache = () => tagOptCache.value || OptCategories.ASSIGNED;
const duplicateTags = computed(() => {
  return imageDuplicateTags.value[props.file.hash] || [];
});

const attemptMergeTags = async () => {
  fileStore.mergeTags(props.file);
};

const hasDuplicates = computed(() => {
  return !!fileStore.strictDuplicateTags[props.file.hash]?.length || false;
});

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

const links = computed(() => [
  {
    label: "Rank",
    icon: "fluent:crown-20-filled",
    badge: {
      label: ((props.file?.confidenceScore || 0) * 100).toFixed(1) + "%",
      color: "amber",
      variant: "soft",
    },
    active: getTagOptCache() === OptCategories.RANK,
    click: () => setMenuOptCache(OptCategories.RANK),
  },
  {
    label: "Applied Tags",
    icon: "fluent:tag-multiple-16-filled",
    badge: {
      label: props.file.highConfidenceTags.length,
      color: "emerald",
      variant: "soft",
    },
    active: getTagOptCache() === OptCategories.ASSIGNED,
    click: () => setMenuOptCache(OptCategories.ASSIGNED),
  },
  {
    label: "Excluded Tags",
    icon: "fluent:tag-multiple-16-regular",
    badge: {
      label: props.file.lowConfidenceTags.length,
      color: "rose",
      variant: "soft",
    },
    active: getTagOptCache() === OptCategories.EXCLUDED,
    click: () => setMenuOptCache(OptCategories.EXCLUDED),
  },
  {
    label: "Move",
    icon: "fluent:folder-move-20-regular",
    active: getTagOptCache() === OptCategories.MOVE,
    click: () => setMenuOptCache(OptCategories.MOVE),
  },
  {
    label: "Scan",
    avatar: {
      icon:
        loaders.hasActiveLoaders(Prefixes.ANALYZE + props.file.name) ||
        loaders.hasQueuedLoaders(Prefixes.ANALYZE + props.file.name)
          ? "fluent:tag-search-20-filled"
          : "fluent:tag-search-20-regular",
      chipColor: loaders.hasQueuedLoaders(Prefixes.ANALYZE + props.file.name)
        ? "amber"
        : loaders.hasActiveLoaders(Prefixes.ANALYZE + props.file.name)
          ? "rose"
          : undefined,
    },
    disabled:
      [...props.file.highConfidenceTags, ...props.file.lowConfidenceTags]
        .length > 0,
    click: () => emits("analyze-image", props.file),
  },
]);
</script>
