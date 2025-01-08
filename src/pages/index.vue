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
      <div class="flex flex-row gap-4">
        <UButton @click="openDirectoryModal" variant="outline">
          Change Directory
        </UButton>
        <UButton @click="openTagPanel" variant="solid"> Tag Panel </UButton>
      </div>
    </template>
  </AHeader>

  <div
    ref="media-list"
    class="pt-20 h-dvh flex flex-col justify-start items-stretch h-100 p-8 gap-4 overflow-y-auto"
  >
    <UCard v-for="file in visibleFiles" :key="file.name">
      <div class="grid items-center grid-cols-4">
        <div
          class="relative flex flex-col items-center justify-center overflow-hidden col-span-1"
        >
          <img
            :src="file.resource"
            style="height: 100%; width: 100%; object-fit: contain"
          />
          <div
            id="hover-menu"
            class="absolute w-full h-full bg-zinc-900/40 opacity-0 hover:opacity-100 flex flex-row gap-2 items-center justify-center transition ease-in-out duration-300"
          >
            <UTooltip text="Analyze Image">
              <UButton
                icon="fluent:image-search-20-regular"
                color="primary"
                class="rounded-full p-4"
                variant="solid"
                @click="fileStore.analyzeImage(file)"
              />
            </UTooltip>
            <UTooltip text="Make Square">
              <UButton
                icon="fluent:color-background-24-regular"
                :color="isSquare(file) ? 'white' : 'emerald'"
                class="rounded-full p-4"
                variant="solid"
                :disabled="isSquare(file)"
                @click="attemptMakeSquare(file)"
              />
            </UTooltip>
            <UTooltip text="Crop Image">
              <UButton
                icon="fluent:crop-16-regular"
                color="emerald"
                class="rounded-full p-4"
                variant="solid"
                @click="cropTarget = file"
              />
            </UTooltip>
            <UTooltip text="Delete Image">
              <UButton
                icon="fluent:delete-16-regular"
                color="red"
                class="rounded-full p-4"
                variant="solid"
                @click="deleteFile(file)"
              />
            </UTooltip>
          </div>
        </div>

        <!-- File Details -->
        <div class="flex flex-col ml-4 col-start-2 col-span-3 gap-2">
          <p class="text-sm font-semibold">{{ file.name }}</p>
          <p class="text-xs text-gray-500">{{ file.path }}</p>
          <div v-if="mode === 'tag'">
            <h4>Accepted Tags</h4>
            <div class="ml-4 flex flex-row flex-wrap gap-4 m-4">
              <ATag
                v-for="tag in file.highConfidenceTags.length
                  ? file.highConfidenceTags
                  : file.tags"
                :key="tag"
                :label="tag"
                :exists="true"
                @delete="fileStore.removeTag(file, tag)"
              />

              <div
                v-if="!file.tags.length && !file?.highConfidenceTags?.length"
              >
                <p class="text-zinc-50/25">None</p>
              </div>
            </div>
            <h4>Excluded Tags</h4>
            <div class="ml-4 flex flex-row flex-wrap gap-4 m-4">
              <ATag
                v-for="tag in [...file?.lowConfidenceTags]"
                :key="tag"
                :label="tag"
                :exists="false"
                @add="fileStore.addTag(file, tag)"
              />

              <div v-if="!file?.lowConfidenceTags?.length">
                <p class="text-zinc-50/25">None</p>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col">
            <h3>
              Tags
              <span class="text-primary text-xs text-gray-500">
                {{ file.tags.length }}
              </span>
            </h3>
            <div class="flex flex-row flex-wrap gap-2">
              <span
                v-for="tag in file.tags"
                :key="tag"
                class="text-xs text-gray-500 max-content"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
    <div
      v-show="observing"
      ref="page-binder"
      class="flex justify-center items-center"
    >
      <UIcon
        ref="page-binder"
        name="fluent:chevron-down-12-filled"
        class="w-5 h-5 text-primary-500"
      />
    </div>

    <!-- Bottom Rounded Toolbar -->
    <div class="fixed flex justify-center gap-8 bottom-6 left-0 right-0">
      <div
        class="p-2 bg-slate-950/90 rounded-full shadow-lg shadow-black/25 z-10"
      >
        <div class="flex justify-center items-center gap-4">
          <UTooltip
            text="Upload Images"
            :popper="{ arrow: true, placement: 'top' }"
          >
            <UButton
              icon="fluent:image-add-32-light"
              variant="solid"
              size="xl"
              color="indigo"
              class="rounded-full p-4"
              @click="uploadFiles"
            />
          </UTooltip>
          <UTooltip
            text="Make All Square"
            :popper="{ arrow: true, placement: 'top' }"
          >
            <UButton
              icon="fluent:color-background-24-regular"
              variant="solid"
              size="xl"
              :color="fileStore.hasNonSquareFiles ? 'emerald' : 'white'"
              :disabled="!fileStore.hasNonSquareFiles"
              class="rounded-full p-4"
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
              size="xl"
              class="rounded-full p-4"
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
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import ATag from "~/components/ui/ATag.vue";
import AHeader from "~/components/ui/AHeader.vue";
import CropModal from "~/components/ui/CropModal.vue";
import DirectoryModal from "~/components/ui/DirectoryModal.vue";

import { useTags } from "~/pinia/tags";
const tagStore = useTags();

import { useRecall } from "~/pinia/recall";
const { recall } = useRecall();

import { useFiles } from "@/pinia/files";
const fileStore = useFiles();
const { files, visibleFiles } = storeToRefs(fileStore);

import { useMakeSquare } from "#build/imports";
import TagSlideover from "~/components/ui/TagSlideover.vue";
const { makeSquare } = useMakeSquare();

const mode = ref<"view" | "tag">("view");
const cropTarget = ref<ImageFile | null>(null);
const closeCropModal = () => {
  cropTarget.value = null;
  console.log("closed");
};

const modal = useModal();
const openDirectoryModal = () => {
  modal.open(DirectoryModal, {
    directory: fileStore.directory,
    onSave: () => {
      modal.close();
      resetPage();
    },
  });
};

const slideover = useSlideover();
const openTagPanel = () => {
  slideover.open(TagSlideover);
};

onMounted(async () => {
  tagStore.fetchModels();
  const directory = recall("directory");
  if (directory) {
    await fileStore.setDirectory(directory);
    resetPage();
  } else {
    openDirectoryModal();
  }
});

const observing = ref(false);
const mediaRef = useTemplateRef("media-list");
const pageBinder = useTemplateRef("page-binder");
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    bindPage();
  }
});

const isSquare = (file: ImageFile) =>
  file.dimensions.width === file.dimensions.height;

const deleteFile = (file: ImageFile) => {
  fileStore.deleteFile(file.path);
};

const analyzeDirectory = async () => {
  await fileStore.analyzeDirectory();
};

const resetPage = async () => {
  console.log(mediaRef.value);
  if (mediaRef.value) mediaRef.value.scrollTo({ top: 0, behavior: "smooth" });
  fileStore.visibilityLimit = 20;
  bindPage();
};

const bindPage = () => {
  if (files.value.length > 0) {
    fileStore.expandVisibility();
  }

  if (visibleFiles.value.length >= files.value.length) {
    observer.unobserve(pageBinder.value as unknown as Element);
    observing.value = false;
  }

  if (!observing.value && pageBinder.value) {
    observer.observe(pageBinder.value as unknown as Element);
    observing.value = true;
  }
};

const attemptMakeSquare = (file: ImageFile) => {
  makeSquare(file, resolveImageEdit);
};
const makeAllSquare = () => {
  fileStore.files.forEach((file) => {
    if (!isSquare(file)) {
      makeSquare(file, resolveImageEdit);
    }
  });
};

const resolveImageEdit = async (dataUrl: string, file: ImageFile) => {
  const blob = await fetch(dataUrl).then((res) => res.blob());
  await fileStore.updateFile(file, blob);

  const index = visibleFiles.value.findIndex((f) => f.path === file.path);
  visibleFiles.value[index].dimensions = file.dimensions;
  visibleFiles.value[index].resource = dataUrl;
};

const uploadFiles = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/png, image/jpeg, image/jpg, image/webp, image/bmp";
  input.webkitdirectory = false;

  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      await fileStore.uploadFiles(files);
      if (mediaRef.value) mediaRef.value.scrollTop = 0;
    }
  };
  input.click();
};
</script>
