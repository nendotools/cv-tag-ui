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
        <h2 class="text-lg font-semibold text-center">Remove Background</h2>
      </template>

      <div class="flex flex-col items-center gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Image: {{ image?.path.split("/").pop() || "Untitled" }}
        </p>
        <div class="image-frame">
          <div class="measured-size">
            <img :src="image?.resource" class="h-full w-full object-contain" />
          </div>
          <div class="measured-size overlay" :style="overlayCSS">
            <img :src="preview || ''" class="h-full w-full object-contain" />
          </div>
        </div>

        <div
          class="w-3/4 flex justify-center content-center align-center gap-4 mx-12"
        >
          <UButton
            variant="outline"
            :color="opacity === 0 ? 'primary' : 'black'"
            @click="setShowResult(false)"
          >
            Original
          </UButton>
          <div class="w-full flex-2">
            <URange
              v-model="opacity"
              :min="0"
              :max="100"
              class="top-1/2 -translate-y-1/2"
            />
          </div>
          <UButton
            variant="outline"
            :color="opacity === 100 ? 'primary' : 'black'"
            @click="setShowResult(true)"
          >
            Removed
          </UButton>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton color="gray" @click="$emit('discard')">Cancel</UButton>
          <UButton color="primary" @click="$emit('save')">Save</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import "vue-advanced-cropper/dist/style.css";

defineProps<{
  open: boolean;
  preview?: string | null;
  image?: ImageFile | null;
}>();

const emit = defineEmits(["save", "discard"]);
const opacity = ref(80);

const setShowResult = (value: boolean) => (opacity.value = value ? 100 : 0);
const overlayCSS = computed(() => {
  return {
    "--overlay": opacity.value / 100,
  };
});
</script>

<style>
.vue-simple-handler {
  background-color: rgb(var(--color-primary-400) / var(--tw-bg-opacity, 1));
}
</style>

<style scoped>
.image-frame {
  position: relative;
  height: calc(65dvh);
  width: calc(75dvw);
  .measured-size {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }
}

.overlay {
  opacity: var(--overlay);
}
</style>
