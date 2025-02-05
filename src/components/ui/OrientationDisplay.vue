<template>
  <div class="icon-stack relative h-5 w-6 -bottom-1 scale-50">
    <div
      class="w-8 h-8 left-0 bottom-0 absolute"
      :class="[
        ...orientationCSSClasses,
        orientation === Orientation.SQUARE
          ? activeOrientationCSSClasses
          : inactiveOrientationCSSClasses,
      ]"
    />
    <div
      class="w-10 h-6 left-0 bottom-0 absolute"
      :class="[
        ...orientationCSSClasses,
        orientation === Orientation.LANDSCAPE
          ? activeOrientationCSSClasses
          : inactiveOrientationCSSClasses,
      ]"
    />
    <div
      class="w-6 h-10 left-0 bottom-0 absolute"
      :class="[
        ...orientationCSSClasses,
        orientation === Orientation.PORTRAIT
          ? activeOrientationCSSClasses
          : inactiveOrientationCSSClasses,
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
import { useMakeSquare } from "~/composables/useMakeSquare";
const { isSmall, isMedium, isLarge, isPortrait, isLandscape } = useMakeSquare();

const props = defineProps<{
  dimensions: { width: number; height: number };
}>();

const sizeColor = computed(() => {
  if (isSmall(props.dimensions))
    return {
      text: "text-rose-500",
      border: "border-rose-500",
      bg: "bg-rose-500/10",
    };
  if (isMedium(props.dimensions))
    return {
      text: "text-amber-500",
      border: "border-amber-500",
      bg: "bg-amber-500/10",
    };
  if (isLarge(props.dimensions))
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
const enum Orientation {
  SQUARE = "square",
  PORTRAIT = "portrait",
  LANDSCAPE = "landscape",
}
const orientation = computed(() => {
  if (isLandscape(props.dimensions)) return Orientation.LANDSCAPE;
  if (isPortrait(props.dimensions)) return Orientation.PORTRAIT;
  return Orientation.SQUARE;
});
const orientationCSSClasses = ["border-2", "rounded-md"];
const activeOrientationCSSClasses = ["z-10", sizeColor.value.border];
const inactiveOrientationCSSClasses = ["z-1 opacity-15"];
</script>
