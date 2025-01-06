<template>
  <UModal v-model="open">
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <h2 class="text-lg font-semibold text-center">
          Select Image Directory
        </h2>
      </template>

      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Select the directory where your images are stored:
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <UInputMenu
          class="flex-1"
          placeholder="Directory path"
          :options="options"
          v-model="current"
          v-model:query="current"
          @input="onInput"
        />
        <UButton
          color="gray"
          variant="solid"
          @click="() => console.log('clicked')"
        >
          Browse
        </UButton>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton @click="onSave">Save</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { useRecall } from "~/pinia/recall";
const { store } = useRecall();

import { useFiles } from "@/pinia/files";
const files = useFiles();
defineProps({
  show: Boolean,
});

const emit = defineEmits(["save"]);

const open = ref(true);
const current = ref<string>("");
const options = ref<string[]>([]);

// on input, if the value ends in a slash, update the current value and fetch directories from the server
const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  current.value = target.value;

  if (current.value.endsWith("/")) {
    files.fetchDirectories(current.value).then((res: string[]) => {
      const opts: string[] = [];
      res.forEach((dir) => {
        opts.push(current.value + dir);
      });
      options.value = opts;
    });
  }
};

const onSave = async () => {
  await files.setDirectory(current.value);
  store("directory", current.value);

  emit("save");
  open.value = false;
};
</script>
