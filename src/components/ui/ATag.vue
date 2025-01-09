<template>
  <div
    class="flex flex-row justify-between align-center items-center gap-1 text-zinc-50 rounded-full pl-2 pr-1 p-0.5 text-xs"
    :class="[
      `border-${colorBorderClass}-400`,
      exists ? 'hover:border-rose-400' : 'hover:border-emerald-400',
      !simple ? ['bg-teal-50/10', 'border', 'border-teal-50/20'] : '',
    ]"
  >
    <div class="w-max cursor-default select-none">
      {{ label }}
    </div>
    <UButton
      v-if="exists && !simple"
      icon="fluent:dismiss-12-filled"
      color="red"
      variant="solid"
      size="xs"
      class="p-0.5"
      :ui="{
        rounded: 'rounded-full',
        icon: { size: { xs: 'h-2 w-2' } },
      }"
      @click="$emit('delete')"
    />
    <UButton
      v-if="!exists && !simple"
      icon="fluent:add-12-filled"
      color="emerald"
      variant="solid"
      size="xs"
      class="p-0.5"
      :ui="{
        rounded: 'rounded-full',
        icon: { size: { xs: 'h-2 w-2' } },
      }"
      @click="$emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
import { useTags } from "~/pinia/tags";
const tagStore = useTags();

const props = withDefaults(
defineProps<{
  label: string;
  simple?: boolean;
  exists: boolean;
}>(),
{
  simple: false,
});

defineEmits(["add", "delete"]);
const colorBorderClass = computed(() => {
  return tagStore.tagColors[props.label] ?? "slate";
});
</script>
