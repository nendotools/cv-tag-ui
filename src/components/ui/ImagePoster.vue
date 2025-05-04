<template>
  <UCard :ui="{ ring, base: 'h-full', body: { base: 'h-full' } }" @click="() => $emit('expand')">
    <div class="flex flex-col justify-between gap-2 h-full">
      <img :src="file.resource" />
      <div class="flex gap-2">
        <UBadge icon="fluent:tag-multiple-16-filled" variant="soft" size="xs" color="emerald">
          {{ file.tags.length }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    file: ImageFile;
    pending?: boolean;
    active?: boolean;
  }>(),
  {
    pending: false,
    active: false
  });

defineEmits(['expand']);
const ring = computed(() => {
  if (props.active) return 'ring-1 ring-primary-200 dark:ring-primary-400';
  if (props.pending) return 'ring-1 ring-amber-200 dark:ring-amber-400';
  return 'ring-1 ring-gray-200 dark:ring-gray-800';
});
</script>
