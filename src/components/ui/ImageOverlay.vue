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
            Modal: {{ isPortrait }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
            @click="$emit('close')" />
        </div>
      </template>

      <div class="grid h-full w-full portrait:grid-rows-2 landscape:grid-cols-2">
        <img v-if="file" :src="file.resource" class="object-contain m-auto" :class="isPortrait ? 'h-full' : 'w-full'" />
      </div>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
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
</script>
