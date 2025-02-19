<template>
  <div
    class="h-min flex flex-row justify-between align-center items-center gap-2 text-zinc-50 rounded-2xl pl-2 pr-1 p-0.5 text-xs border-slate-400"
    :class="[
      exists ? 'hover:border-rose-400' : 'hover:border-emerald-400',
      !simple ? ['bg-teal-50/10', 'border', 'border-teal-50/20'] : '',
      'colorize',
      { highlight },
    ]"
    :style="colorCSS"
  >
    <div class="text-md w-max select-none">
      {{ label }}
    </div>
    <UButton
      v-if="exists && !simple"
      icon="fluent:dismiss-12-filled"
      color="red"
      variant="solid"
      size="sm"
      class="p-0.5"
      :ui="{
        rounded: 'rounded-full',
        icon: { size: { sm: 'h-3 w-3' } },
      }"
      @click="$emit('delete')"
    />
    <UButton
      v-if="!exists && !simple"
      icon="fluent:add-12-filled"
      color="emerald"
      variant="solid"
      size="sm"
      class="p-0.5"
      :ui="{
        rounded: 'rounded-full',
        icon: { size: { sm: 'h-3 w-3' } },
      }"
      @click="$emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    simple?: boolean;
    exists: boolean;
    highlight?: boolean;
  }>(),
  {
    simple: false,
    highlight: false,
    duplicates: () => [],
  },
);

defineEmits(["add", "delete"]);
const colorCSS = computed(() => {
  // convert last word of label to hsl color using modulo
  const lastWord = props.label.split(" ").pop() || "empty";
  const hash = lastWord
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    "--color": `hsl(${hash % 360}, 100%, 70%)`,
  };
});
</script>

<style lang="scss" scoped>
.colorize {
  color: hsl(0, 95%, 100%, 0.8);
}
.highlight {
  color: var(--color);
}
</style>
