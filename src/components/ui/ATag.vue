<template>
  <div
    class="flex flex-row justify-between align-center items-center gap-2 text-zinc-50 bg-teal-50/20 border rounded-full pl-3 px-1 py-1 text-sm"
  >
    <div class="w-max cursor-default select-none">
      {{ label }}
    </div>
    <UButton
      v-if="exists"
      icon="fluent:dismiss-12-filled"
      color="red"
      variant="solid"
      size="2xs"
      :ui="{
        rounded: 'rounded-full',
        padding: { '2xs': 'px-1 py-1' },
        icon: { '2xs': 'w-1 h-1' },
      }"
      @click="$emit('delete')"
    />
    <UButton
      v-if="!exists"
      icon="fluent:add-12-filled"
      color="emerald"
      variant="solid"
      size="2xs"
      :ui="{
        rounded: 'rounded-full',
        padding: { '2xs': 'px-1 py-1' },
        icon: { '2xs': 'w-1 h-1' },
      }"
      @click="$emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  exists: boolean;
}>();

defineEmits(["add", "delete"]);
</script>
