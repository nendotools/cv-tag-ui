<template>
  <UModal fullscreen :model-value="!!file">
    <UCard :ui="{
      base: 'h-full flex flex-col',
      rounded: '',
      divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      body: {
        base: 'grow overflow-auto'
      }
    }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ file?.name ?? '' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
            @click="$emit('close')" />
        </div>
      </template>

      <div v-if="!!file" class="grid h-full w-full portrait:grid-rows-2 landscape:grid-cols-2">
        <div class="flex flex-col gap-2 content-center">
          <img v-if="file" :src="file.resource" class="h-full object-contain m-auto bg-gray-400/10"
            :class="isPortrait ? 'h-full' : 'w-full'" />
          <div v-if="file" class="text-sm text-gray-400">
            <h4 class="text-gray-300">File Properties</h4>
            <div class="text-xs flex flex-row items-center">
              <div>
                Dimensions:
                <span :class="[sizeColor.text]">
                  {{ file.dimensions.width }} x {{ file.dimensions.height }}
                </span>
              </div>
              <OrientationDisplay :dimensions="file.dimensions" />
            </div>
          </div>
          <div class="flex flex-row justify-center gap-4">
            <UButton icon="tabler:chevron-left" color="gray" />
            <UButton icon="tabler:chevron-right" color="gray" />
          </div>
        </div>

        <div class="ml-4 grid grid-flow-row grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-min gap-2 m-4">
          <ATag v-for="tag in [...file?.highConfidenceTags]" :key="tag" :label="tag" :exists="true" :simple="false"
            :highlight="duplicateTags.includes(tag.split(' ').pop() || '')"
            @delete="fileStore.removeTag(file, [tag])" />

          <div class="col-start-1 col-span-full flex flex-row gap-2 mt-4">
            <h4>Add Tags</h4>
            <TagInput :tags="file.highConfidenceTags" @add="addTag" />
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
import ATag from './ATag.vue';
import TagInput from './TagInput.vue';
import OrientationDisplay from './OrientationDisplay.vue';
import { useFiles } from "@/pinia/files";
const fileStore = useFiles();

const { imageDuplicateTags } = storeToRefs(fileStore);
const { isSquare, isSmall, isMedium, isLarge } = useMakeSquare();
const props = withDefaults(
  defineProps<{
    file?: ImageFile | null;
    pending?: boolean;
    active?: boolean;
  }>(),
  {
    file: null,
    pending: false,
    active: false
  });

defineEmits(['close']);
const isPortrait = computed(() => {
  if (!props.file) return true;
  return props.file?.dimensions.width < props.file?.dimensions.height
});

const duplicateTags = computed(() => {
  if (!props.file) return []
  return imageDuplicateTags.value[props?.file.hash] || [];
});

const sizeColor = computed(() => {
  if (!props.file) return { text: '', border: '', bg: '' }
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

const addTag = (tag: string) => {
  if (!props.file) return
  fileStore.addTag(props?.file, [tag])
}
</script>
