<template>
  <div
    class="flex flex-row justify-between items-center px-8 py-4 border-b border-slate-300/10 sticky top-0 bg-slate-900 shadow-lg shadow-black/25 z-20"
  >
    <div class="flex flex-row items-center">
      <slot name="left" />
    </div>

    <div class="flex flex-row items-center">
      <slot />
    </div>

    <div class="flex flex-row items-center">
      <slot name="right" />
    </div>
  </div>
</template>
