<template>
  <UModal :modelValue="open" :ui="{ container: 'items-center' }">
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <div class="flex flex-row justify-between">
        <h2 class="text-lg font-semibold text-center">Tag Preview</h2>
        <UButton @click="$emit('close')" color="gray">Close</UButton>
      </div>
      <p class="text-sm">
        Preview of files with tag:
        <span class="text-primary font-bold">{{ props.tag }}</span>
      </p>
      <div>Total files with tag: {{ taggedFiles.length }}</div>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="file in previewFiles" :key="file.hash">
          <img
            :src="file.resource"
            :alt="file.name"
            class="w-full h-full object-contain center bg-gray-800"
          />
          <div class="flex flex-row justify-center gap-8 relative bottom-10">
            <UButton
              icon="fluent:checkmark-circle-20-regular"
              color="emerald"
              size="xs"
              @click="filter(file.hash)"
            />
            <UButton
              icon="fluent:subtract-circle-20-regular"
              color="rose"
              size="xs"
              @click="remove(file)"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-row justify-between mt-6">
        <UButton @click="applyAll" color="emerald">Apply to All</UButton>
        <div class="text-primary">
          {{ tag }}
        </div>
        <UButton @click="removeAll" color="rose">Remove from All</UButton>
      </div>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
import { useFiles } from "~/pinia/files";
const fileStore = useFiles();
const { files } = storeToRefs(fileStore);

const props = defineProps<{
  open: boolean;
  tag: string | null;
}>();

const filterHashes = ref<Set<string>>(new Set());
onMounted(() => {
  filterHashes.value.clear();
});
watch(
  () => props.open,
  (open) => {
    if (!open) {
      filterHashes.value.clear();
    }
  },
);

const filter = (hash: string) => {
  filterHashes.value.add(hash);
};
const remove = (file: ImageFile) => {
  fileStore.removeTag(file, [props.tag as string]);
};

const taggedFiles = computed(() => {
  if (!props.tag) return [];
  return files.value.filter(
    (file) =>
      file.highConfidenceTags.includes(props.tag as string) &&
      !filterHashes.value.has(file.hash),
  );
});
const previewFiles = computed(() => {
  return taggedFiles.value.slice(0, 6);
});

const removeAll = () => {
  if (!props.tag) return [];
  fileStore.bulkRemoveTag([props.tag]);
};

const applyAll = () => {
  if (!props.tag) return [];
  fileStore.bulkAddTag([props.tag]);
};
</script>
