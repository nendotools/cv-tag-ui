<template>
  <UModal
    :modelValue="open"
    fullscreen
    :ui="{
      fullscreen: 'w-3/4 h-3/4',
      container: 'items-center',
    }"
  >
    <UCard
      :ui="{
        base: 'max-h-3/4',
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <h2 class="text-lg font-semibold text-center">Crop Image</h2>
      </template>

      <div class="flex flex-col items-center gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Cropping image: {{ image?.name || "Untitled" }}
        </p>
        <Cropper
          v-if="image"
          ref="cropper"
          class="measured-size"
          :src="image.resource"
          :default-size="image.dimensions"
          :options="{ aspectRatio: 1 }"
          :stencil-props="{
              aspectRatio
            }"
        />

        <div class="w-full flex justify-center gap-4">
          <UButton
            v-for="ratio in Object.keys(ratioOptions)"
            :key="ratio"
            variant="soft"
            :color="aspectRatio === ratioOptions[ratio as keyof typeof ratioOptions] ? 'primary' : 'black'"
            @click="setAspectRatio(ratio as keyof typeof ratioOptions)">
            {{ ratio }}
          </UButton>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton color="gray" @click="$emit('close')">Cancel</UButton>
          <UButton color="primary" @click="handleSave">Save</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const cropper = useTemplateRef("cropper");
const props = defineProps<{
  open: boolean;
  image?: ImageFile | null;
  saveCallback?: (dataUrl: string, file: ImageFile) => void;
}>();

const emit = defineEmits(["close"]);
const aspectRatio = ref<null | number>(null);
const ratioOptions = {
  free: null,
  square: 1,
  portrait: 0.75,
  landscape: 1.33,
};
const setAspectRatio = (ratio: keyof typeof ratioOptions) => {
  aspectRatio.value = ratioOptions[ratio];
};

const handleSave = () => {
  if (cropper.value) {
    const canvas = cropper.value.getResult();
    const dataUrl = canvas.canvas?.toDataURL();
    if (!dataUrl || !props.saveCallback) return;

    props.saveCallback(dataUrl, {
      ...props.image!,
      dimensions: {
        width: canvas.canvas!.width,
        height: canvas.canvas!.height,
      },
    });
  }
  emit("close");
};
</script>

<style>
.vue-simple-handler {
  background-color: rgb(var(--color-primary-400) / var(--tw-bg-opacity, 1));
}
</style>

<style scoped>
.measured-size {
  height: calc(65dvh);
  width: calc(75dvw);
}
</style>
