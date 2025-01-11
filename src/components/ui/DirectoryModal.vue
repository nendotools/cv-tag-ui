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
          :popper="{
              placement: 'top-end',
          }"
          v-model="current"
          v-model:query="current"
          @input="onInput"
        />
        <UButton v-if="kohyaParent" color="emerald" :loading="loading" :disabled="loading" @click="onSaveParent">
          Use Parent
        </UButton>
      </div>
      <div v-if="directoryStore.relatedDirectories" class="flex flex-col gap-2 mt-4">
        <div v-for="opt, index in directoryStore.subDirectories" :key="index" class="w-full grid grid-cols-5 gap-2 items-center">
          <UButton
            class="col-span-2" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            :icon="isActive(opt) ? 'fluent:folder-20-filled' : 'fluent:folder-20-regular'"
            @click="directoryStore.activeDirectory = opt.name" >
            {{ opt.name }}
          </UButton>
          <UBadge
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:image-20-regular">
            {{ opt.images }}
          </UBadge>
          <UBadge
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:tag-20-regular">
            {{ opt.tags }}
          </UBadge>
          <UBadge
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:book-database-20-regular">
            {{ opt.scans }}
          </UBadge>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton @click="onSave">
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

import { KOHYA_FOLDER_PATTERN, useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();

const emit = defineEmits(["save"]);
onMounted(() => {
  loading.value = false;
  current.value = directoryStore.baseDirectory;
  updateDirectoryList();
});

const current = ref<string>("");
const options = ref<string[]>([]);
const loading = ref(false);
const parentDir = computed(() => current.value.split("/").slice(0, -1).join("/"));
const kohyaParent = computed(() => {
  if (!options.value.length) return false;
  return options.value.some((opt) => KOHYA_FOLDER_PATTERN.test(opt.split("/").pop() || ""));
});

const updateDirectoryList = async () => {
  // fetch directories from the server based on the current value
  // and update the options
  directoryStore.fetchDirectories(parentDir.value).then((res: string[]) => {
    const opts: string[] = [];
    res.forEach((inner) => {
      opts.push(`${parentDir.value}/${inner}`);
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
  files.setDirectory(directoryStore.workingDirectory);
  emit("save");
};

const onSaveParent = async () => {
  loading.value = true;
  current.value = parentDir.value;
  await directoryStore.setDirectory(current.value, true);
  store("directory", current.value);

  //emit("save");
};

const isActive = (dir: ImageDirectory) => {
  return directoryStore.activeDirectory === dir.name;
};
</script>
