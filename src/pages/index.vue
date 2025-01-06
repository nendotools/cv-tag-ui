<template>
  <AHeader>
    <h1>Image Tagger</h1>
  </AHeader>
  <div class="flex flex-col justify-start items-stretch h-100 p-8 gap-4">
    <UCard v-for="file in visibleFiles" :key="file.name">
      <div class="flex items-center justify-between overflow-scroll">
        <div class="flex items-center">
          <div
            class="relative flex flex-col items-center justify-center h-72 w-72 min-w-72 overflow-hidden"
          >
            <img
              :src="file.resource"
              style="height: 100%; width: 100%; object-fit: contain"
            />
            <div
              id="hover-menu"
              class="absolute w-full h-full bg-zinc-900/40 opacity-0 hover:opacity-100 flex flex-row gap-2 items-center justify-center transition ease-in-out duration-300"
            >
              <UTooltip text="Make Square">
                <UButton
                  :color="isSquare(file) ? 'white' : 'emerald'"
                  class="rounded-full p-4"
                  variant="solid"
                  :disabled="isSquare(file)"
                  @click="attemptMakeSquare(file)"
                >
                  <UIcon
                    name="fluent:color-background-24-filled"
                    class="w-6 h-6"
                  />
                </UButton>
              </UTooltip>
              <UTooltip text="Crop Image">
                <UButton
                  color="emerald"
                  class="rounded-full p-4"
                  variant="solid"
                  @click="cropTarget = file"
                >
                  <UIcon name="fluent:crop-16-regular" class="w-6 h-6" />
                </UButton>
              </UTooltip>
              <UTooltip text="Delete Image">
                <UButton
                  color="red"
                  class="rounded-full p-4"
                  variant="solid"
                  @click="deleteFile(file)"
                >
                  <UIcon name="fluent:delete-16-regular" class="w-6 h-6" />
                </UButton>
              </UTooltip>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-semibold">{{ file.name }}</p>
            <p class="text-xs text-gray-500">{{ file.path }}</p>
            <h4>Accepted Tags</h4>
            <div class="ml-4 flex flex-row flex-wrap gap-4 m-4">
              <div
                v-for="tag in file.tags"
                :key="tag"
                class="text-zinc-900 bg-teal-50 rounded-full px-2 py-1 text-xs w-max"
              >
                {{ tag }}
              </div>

              <div v-if="!file.tags.length">
                <p class="text-zinc-50/25">None</p>
              </div>
            </div>
            <h4>Rejected Tags</h4>
            <div class="ml-4 flex flex-row flex-wrap gap-4 m-4">
              <p class="text-zinc-50/25">None</p>
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
  </div>

  <DirectoryModal :show="showDirectoryModal" @save="resetPage" />
  <CropModal
    :open="!!cropTarget"
    :image="cropTarget"
    :save-callback="resolveImageEdit"
    @close="closeCropModal"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import AHeader from "~/components/ui/AHeader.vue";
import CropModal from "~/components/ui/CropModal.vue";
import DirectoryModal from "~/components/ui/DirectoryModal.vue";

import { useRecall } from "~/pinia/recall";
const { recall } = useRecall();

import { useFiles } from "@/pinia/files";
const fileStore = useFiles();
const { files } = storeToRefs(fileStore);

import { useMakeSquare } from "#build/imports";
const { makeSquare } = useMakeSquare();

const cropTarget = ref<ImageFile | null>(null);
const closeCropModal = () => {
  cropTarget.value = null;
  console.log("closed");
};

const showDirectoryModal = ref(false);
onMounted(async () => {
  const directory = recall("directory");
  if (directory) {
    await fileStore.setDirectory(directory);
    resetPage();
  } else {
    showDirectoryModal.value = true;
  }
});

const observing = ref(false);
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
  visibleFiles.value = visibleFiles.value.filter((f) => f.path !== file.path);
};

const visibleFiles = ref<ImageFile[]>([]);
const resetPage = async () => {
  visibleFiles.value = [];
  bindPage();
};

const bindPage = () => {
  console.log(files.value.length);
  if (files.value.length > 0) {
    visibleFiles.value.push(
      ...files.value.slice(
        visibleFiles.value.length,
        visibleFiles.value.length + 20,
      ),
    );
  }

  if (visibleFiles.value.length === files.value.length) {
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

const resolveImageEdit = async (dataUrl: string, file: ImageFile) => {
  const blob = await fetch(dataUrl).then((res) => res.blob());
  await fileStore.updateFile(file, blob);

  const index = visibleFiles.value.findIndex((f) => f.path === file.path);
  visibleFiles.value[index].dimensions = file.dimensions;
  visibleFiles.value[index].resource = dataUrl;
};
</script>
