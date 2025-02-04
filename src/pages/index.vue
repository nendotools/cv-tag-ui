<template>
  <AHeader>
    <template #left>
      <h1>Image Tagger</h1>
    </template>

    <div class="flex flex-row gap-4">
      <UButton
        :color="mode === 'view' ? 'primary' : 'white'"
        variant="link"
        @click="mode = 'view'"
      >
        View
      </UButton>
      <UButton
        :color="mode === 'tag' ? 'primary' : 'white'"
        variant="link"
        @click="mode = 'tag'"
      >
        Tag
      </UButton>
    </div>

    <template #right>
      <div class="flex flex-row gap-4 portrait:hidden">
        <UButton size="xs" variant="outline" @click="openDirectoryModal">
          Change Directory
        </UButton>
        <UButton
          size="xs"
          variant="solid"
          icon="fluent:options-20-regular"
          @click="openTagPanel"
        >
          Options
        </UButton>
      </div>
      <UDropdown
        class="landscape:hidden"
        :items="collapsedHeaderMenu"
        :popper="{ placement: 'bottom-start' }"
      >
        <UButton color="white" icon="fluent:more-horizontal-20-regular" />
      </UDropdown>
    </template>

    <template #subheader>
      <UTabs
        :defaultIndex="1"
        :items="[
          {
            label: 'Rank',
            icon: 'fluent:crown-20-filled',
            active: fileStore.sort === 'rank',
            click: () => console.log('Rank'),
          },
          {
            label: 'Name',
            icon: 'fluent:text-20-filled',
            active: fileStore.sort === 'name',
          },
          {
            label: 'Unscanned',
            icon: 'fluent:tag-search-20-regular',
            active: fileStore.sort === 'unscanned',
          },
        ]"
      >
        <template #default="{ item, selected }">
          <span v-if="selected" class="capitalize">
            {{ fileStore.sort = item.label.toLowerCase() }}
          </span>
        </template>
      </UTabs>
    </template>
  </AHeader>

  <div class="grid grid-cols-1 gap-4 pt-16">
    <div
      ref="media-list"
      class="h-dvh flex flex-col justify-start items-stretch p-8 gap-4 overflow-y-auto pb-48"
    >
      <UCard v-for="file in visibleFiles" :key="file.name">
        <div
          class="grid items-center landscape:grid-cols-5 portrait:grid-cols-1 grid-rows-auto"
        >
          <!-- Image and Image tools -->
          <div
            class="relative flex flex-col items-center justify-center overflow-hidden col-span-1"
          >
            <img
              :src="file.resource"
              style="height: 100%; width: 100%; object-fit: contain"
            />
          </div>

          <!-- File Details -->
          <div
            class="flex flex-col self-start ml-4 landscape:col-start-2 landscape:col-span-3 gap-2"
          >
            <p class="text-sm font-semibold">{{ file.name }}</p>
            <p class="text-xs text-gray-500">{{ file.path }}</p>
            <div>
              <UHorizontalNavigation
                :links="[
                  {
                    label: 'Rank',
                    icon: 'fluent:crown-20-filled',
                    badge: {
                      label:
                        ((file?.confidenceScore || 0) * 100).toFixed(1) + '%',
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
                    active:
                      getTagOptCache(file.name) === OptCategories.ASSIGNED,
                    click: () =>
                      setMenuOptCache(file.name, OptCategories.ASSIGNED),
                  },
                  {
                    label: 'Excluded Tags',
                    icon: 'fluent:tag-multiple-16-regular',
                    badge: {
                      label: file.lowConfidenceTags.length,
                      color: 'rose',
                      variant: 'soft',
                    },
                    active:
                      getTagOptCache(file.name) === OptCategories.EXCLUDED,
                    click: () =>
                      setMenuOptCache(file.name, OptCategories.EXCLUDED),
                  },
                  {
                    label: 'Tools',
                    icon: 'fluent:developer-board-lightning-toolbox-20-regular',
                    active: getTagOptCache(file.name) === OptCategories.TOOLS,
                    click: () =>
                      setMenuOptCache(file.name, OptCategories.TOOLS),
                  },
                  {
                    label: 'Scan',
                    avatar: {
                      icon:
                        loaders.hasActiveLoaders(
                          Prefixes.ANALYZE + file.name,
                        ) ||
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
                  v-for="tag in file.highConfidenceTags.length
                    ? file.highConfidenceTags
                    : file.tags"
                  :key="tag"
                  :label="tag"
                  :exists="true"
                  :simple="mode !== 'tag'"
                  :class="{ 'cursor-pointer': mode === 'view' }"
                  @delete="fileStore.removeTag(file, [tag])"
                  @click.stop="setFocusTag(tag)"
                />

                <div
                  v-if="!file.tags.length && !file?.highConfidenceTags?.length"
                >
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
                  @click.stop="setFocusTag(tag)"
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
                  @click="attemptMakeSquare(file)"
                >
                  Make Square
                </UButton>
                <UButton
                  icon="fluent:crop-16-regular"
                  color="emerald"
                  class="rounded-full p-2"
                  variant="solid"
                  size="xs"
                  @click="cropTarget = file"
                >
                  Crop Image
                </UButton>
                <UButton
                  icon="fluent:delete-16-regular"
                  color="red"
                  class="rounded-full p-2"
                  variant="solid"
                  size="xs"
                  @click="deleteFile(file)"
                >
                  Delete Image
                </UButton>
              </div>
            </div>
          </div>

          <SendMenu :file="file" />
        </div>
      </UCard>
    </div>
  </div>

  <!-- Bottom Rounded Toolbar -->
  <div
    class="w-full fixed flex flex-col-reverse justify-center items-center bottom-6 gap-2 pointer-events-none"
  >
    <!-- Navigation -->
    <div
      v-if="visibleFiles.length"
      class="flex justify-center gap-8 pointer-events-none"
    >
      <div
        class="p-2 bg-slate-800/95 flex items-center justify-center gap-2 rounded-full shadow-lg shadow-black/25 z-10 pointer-events-auto border-none"
      >
        <UButton
          icon="fluent:arrow-previous-16-filled"
          variant="ghost"
          size="sm"
          color="white"
          class="rounded-full p-2"
          :style="{ opacity: fileStore.page === 1 ? 0.2 : 1 }"
          :disabled="fileStore.page === 1"
          @click="setPage(1)"
        />
        <UButton
          icon="fluent:chevron-left-16-filled"
          variant="ghost"
          size="sm"
          color="white"
          class="rounded-full p-2"
          :style="{ opacity: fileStore.page === 1 ? 0.2 : 1 }"
          :disabled="fileStore.page === 1"
          @click="setPage(fileStore.page - 1)"
        />
        <span class="text-md text-center"
          >{{ fileStore.page }}/{{ fileStore.pages }}</span
        >
        <UButton
          icon="fluent:chevron-right-16-filled"
          variant="ghost"
          size="sm"
          color="white"
          class="rounded-full p-2"
          :style="{ opacity: fileStore.page === fileStore.pages ? 0.2 : 1 }"
          :disabled="fileStore.page === fileStore.pages"
          @click="setPage(fileStore.page + 1)"
        />
        <UButton
          icon="fluent:arrow-next-16-filled"
          variant="ghost"
          size="sm"
          color="white"
          class="rounded-full p-2"
          :style="{ opacity: fileStore.page === fileStore.pages ? 0.2 : 1 }"
          :disabled="fileStore.page === fileStore.pages"
          @click="setPage(fileStore.pages)"
        />
      </div>
    </div>

    <!-- Batch Tools -->
    <div
      v-if="directoryStore.workingDirectory !== ''"
      class="flex justify-center gap-12 pointer-events-none"
    >
      <div
        class="p-2 bg-slate-950/90 rounded-full shadow-lg shadow-black/25 z-10 pointer-events-auto border-none"
        :class="[activityEffect]"
        :style="animationEffect"
      >
        <div class="flex justify-center items-center gap-4">
          <UTooltip
            text="Upload Images"
            :popper="{ arrow: true, placement: 'top' }"
          >
            <UButton
              icon="fluent:image-add-32-light"
              variant="solid"
              color="indigo"
              class="rounded-full p-2"
              :disabled="showActivity"
              size="lg"
              :ui="{ icon: { size: { lg: 'w-8 h-8' } } }"
              @click="uploadFiles"
            />
          </UTooltip>
          <UTooltip
            text="Make All Square"
            :popper="{ arrow: true, placement: 'top' }"
          >
            <UButton
              icon="fluent:color-background-20-regular"
              variant="solid"
              :color="fileStore.hasNonSquareFiles ? 'emerald' : 'white'"
              :disabled="!fileStore.hasNonSquareFiles || showActivity"
              class="rounded-full p-2"
              size="lg"
              :ui="{ icon: { size: { lg: 'w-8 h-8' } } }"
              @click="makeAllSquare"
            />
          </UTooltip>
          <UTooltip
            text="Scan Directory"
            :popper="{ arrow: true, placement: 'top' }"
          >
            <UButton
              icon="fluent:slide-multiple-search-20-regular"
              variant="solid"
              size="lg"
              class="rounded-full p-2"
              :disabled="
                loaders.hasActiveLoaders(Prefixes.ANALYZE) ||
                loaders.hasQueuedLoaders(Prefixes.ANALYZE) ||
                showActivity
              "
              :ui="{ icon: { size: { lg: 'w-8 h-8' } } }"
              @click="analyzeDirectory"
            />
          </UTooltip>
        </div>
      </div>
    </div>
  </div>

  <UModals />
  <USlideovers />
  <CropModal
    :open="!!cropTarget"
    :image="cropTarget"
    :save-callback="resolveImageEdit"
    @close="closeCropModal"
  />
  <TagPreviewer
    :open="!!focusTag"
    :tag="focusTag"
    @close="() => (focusTag = null)"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import ATag from "~/components/ui/ATag.vue";
import SendMenu from "~/components/ui/SendMenu.vue";
import AHeader from "~/components/ui/AHeader.vue";
import CropModal from "~/components/ui/CropModal.vue";
import TagPreviewer from "~/components/ui/TagPreviewer.vue";
import DirectoryModal from "~/components/ui/DirectoryModal.vue";

import { useLoaders, Prefixes } from "~/pinia/loaders";
const loaders = useLoaders();

import { useTags } from "~/pinia/tags";
const tagStore = useTags();

import { useRecall } from "~/pinia/recall";
const { recall } = useRecall();

import { useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();

import { useFiles } from "@/pinia/files";
const fileStore = useFiles();
const { visibleFiles } = storeToRefs(fileStore);

import { useMakeSquare } from "~/composables/useMakeSquare";
import OptionsSlideover from "~/components/ui/OptionsSlideover.vue";
import TagInput from "~/components/ui/TagInput.vue";
const { makeSquare } = useMakeSquare();

const mediaRef = useTemplateRef("media-list");

const mode = ref<"view" | "tag">("view");
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

const cropTarget = ref<ImageFile | null>(null);
const closeCropModal = () => {
  cropTarget.value = null;
};

const focusTag = ref<string | null>(null);
const setFocusTag = (tag: string) => {
  if (mode.value === "tag") return;
  focusTag.value = tag;
};

const moveSelection = ref<Set<string>>(new Set());
const toggleSelection = (file: ImageFile) => {
  if (moveSelection.value.has(file.hash)) {
    moveSelection.value.delete(file.hash);
  } else {
    moveSelection.value.add(file.hash);
  }
};

const modal = useModal();
const openDirectoryModal = () => {
  modal.open(DirectoryModal, {
    onSave: () => {
      modal.close();
      setPage();
    },
  });
};

const slideover = useSlideover();
const openTagPanel = () => {
  slideover.open(OptionsSlideover, {
    onFilter: () => {
      setPage();
    },
    onClose: () => {
      slideover.close();
    },
  });
};

onMounted(async () => {
  tagStore.fetchModels();
  const directory = recall("directory");
  const threshold = recall("threshold");
  if (threshold) fileStore.setThreshold(threshold);

  if (directory && directoryStore.baseDirectory === "") {
    directoryStore.setDirectory(directory, true);
  }
  openDirectoryModal();
  animateRotation();
});

// valid square ratios should either 1:1, 0.75:1, 1.33:1
const isSquare = (file: ImageFile) =>
  file.dimensions.width === file.dimensions.height ||
  (file.dimensions.width / file.dimensions.height).toFixed(2) === "0.75" ||
  (file.dimensions.width / file.dimensions.height).toFixed(2) === "1.33";

const deleteFile = (file: ImageFile) => {
  fileStore.deleteFile(file.path);
};

const analyzeDirectory = async () => {
  setAnimation("scan-media-effect");
  await fileStore.analyzeDirectory();
  stopAnimation();
};

const setPage = async (page: number = 1) => {
  if (mediaRef.value) mediaRef.value.scrollTop = 0;
  fileStore.setPage(page);
};

const attemptMakeSquare = (file: ImageFile) => {
  makeSquare(file, resolveImageEdit);
};
const makeAllSquare = async () => {
  setAnimation("make-square-effect");
  await new Promise((resolve) => setTimeout(resolve, 100));
  for (const file of fileStore.files) {
    if (!isSquare(file)) {
      await makeSquare(file, resolveImageEdit);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  console.log("done");
  stopAnimation();
};

const resolveImageEdit = async (dataUrl: string, file: ImageFile) => {
  const blob = await fetch(dataUrl).then((res) => res.blob());
  await fileStore.updateFile(file, blob);

  const index = visibleFiles.value.findIndex((f) => f.path === file.path);
  if (index === -1) return;
  visibleFiles.value[index].dimensions = file.dimensions;
  visibleFiles.value[index].resource =
    `${visibleFiles.value[index].resource}?cb=${Date.now()}`;
};

const uploadFiles = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/png, image/jpeg, image/jpg, image/webp, image/bmp";
  input.webkitdirectory = false;

  setAnimation("upload-media-effect");
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      await fileStore.uploadFiles(files);
      if (mediaRef.value) mediaRef.value.scrollTop = 0;
    }
    stopAnimation();
  };
  input.oncancel = stopAnimation;
  input.click();
};

const rotation = ref(0);
const animationEffect = computed(() => {
  return {
    "--rotation": `${rotation.value}deg`,
  };
});
const showActivity = ref(false);
const activityEffect = ref<string>("");
const setAnimation = (effect: string) => {
  activityEffect.value = effect;
  showActivity.value = true;
  animateRotation();
};
const stopAnimation = () => {
  activityEffect.value = "";
  showActivity.value = false;
};
const animateRotation = () => {
  rotation.value = (rotation.value + 5) % 360;
  if (showActivity.value) requestAnimationFrame(animateRotation);
};

const collapsedHeaderMenu = ref<any[]>([
  [
    {
      label: "Change Directory",
      icon: "fluent:folder-open-20-regular",
      click: openDirectoryModal,
    },
    {
      label: "Options",
      icon: "fluent:options-20-regular",
      click: openTagPanel,
    },
  ],
]);
</script>

<style scoped>
.make-square-effect {
  background:
    linear-gradient(rgb(2 6 23 / 0.9), rgb(2 6 23 / 0.9)) padding-box,
    linear-gradient(var(--rotation), rgb(52 211 153), black) border-box;
  border-radius: 50em;
  border: 2px solid transparent;
}
.scan-media-effect {
  background:
    linear-gradient(rgb(2 6 23 / 0.9), rgb(2 6 23 / 0.9)) padding-box,
    linear-gradient(var(--rotation), rgb(var(--color-primary-400)), black)
      border-box;
  border-radius: 50em;
  border: 2px solid transparent;
}
.upload-media-effect {
  background:
    linear-gradient(rgb(2 6 23 / 0.9), rgb(2 6 23 / 0.9)) padding-box,
    linear-gradient(var(--rotation), rgb(129 140 248), black) border-box;
  border-radius: 50em;
  border: 2px solid transparent;
}
</style>
