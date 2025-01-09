<template>
  <UModal :ui="{container: 'items-center' }">
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
          :disabled="loading"
          @click="() => console.log('clicked')"
        >
          Browse
        </UButton>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton :loading="loading" :disabled="loading" @click="onSave">
            Save
          </UButton>
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

const props = defineProps<{
  directory: string;
}>();
const emit = defineEmits(["save"]);
onMounted(() => {
  loading.value = false;
  current.value = props.directory;
  updateDirectoryList();
});

const open = ref(false);
const current = ref<string>("");
const options = ref<string[]>([]);
const loading = ref(false);

const updateDirectoryList = async () => {
  // determine the current directory by splitting the current value to the last slash
  const dir = current.value.split("/").slice(0, -1).join("/");

  // fetch directories from the server based on the current value
  // and update the options
  files.fetchDirectories(dir).then((res: string[]) => {
    const opts: string[] = [];
    res.forEach((inner) => {
      opts.push(`${dir}/${inner}`);
    });
    options.value = opts;
  });
};

// on input, if the value ends in a slash, update the current value and fetch directories from the server
const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  current.value = target.value;

  if (current.value.endsWith("/")) {
    updateDirectoryList();
  }
};

const onSave = async () => {
  loading.value = true;
  await files.setDirectory(current.value);
  store("directory", current.value);

  emit("save");
  open.value = false;
};
</script>
