<template>
  <USlideover>
    <UCard
      class="flex flex-col flex-1"
      :ui="{
        body: { base: 'flex-1' },
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <h2 class="text-lg font-semibold text-center">Manage Tags</h2>
      </template>

      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Some data about tags here.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">footer</div>
      </template>
    </UCard>
  </USlideover>
</template>

<script setup lang="ts"></script>
