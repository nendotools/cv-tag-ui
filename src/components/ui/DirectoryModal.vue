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

      <div class="flex flex-col gap-2 space-x-2">
        <UInputMenu
          class="flex-1"
          placeholder="Directory path"
          :options="options"
          value-attribute="id"
          option-attribute="label"
          :search-attributes="['id']"
          :popper="{
              placement: 'top-end',
          }"
          v-model="current"
          v-model:query="current"
          @input="onInput"
        />
        <div class="w-full flex flex-row justify-end gap-2">
        <UButton v-if="kohyaParent && refocusing" color="emerald" :loading="loading" :disabled="loading" @click="onSaveParent">
          Use Parent
        </UButton>
        <UButton v-if="refocusing" :loading="loading" :disabled="loading" @click="onSaveCurrent">
          Use Current
        </UButton>
        </div>
      </div>
      <div v-if="directoryStore.relatedDirectories" class="flex flex-col gap-2 mt-4">
        <div v-for="opt, index in directoryStore.subDirectories" :key="index" class="w-full grid grid-cols-5 gap-2 items-center">
          <UButton
            class="col-span-2" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            :icon="folderIcon(opt)"
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

import { Prefixes, useLoaders } from "~/pinia/loaders";
const loader = useLoaders();

import { useFiles } from "@/pinia/files";
const files = useFiles();

import { KOHYA_FOLDER_PATTERN, useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();

const emit = defineEmits(["save"]);
onMounted(() => {
  loading.value = false;
  current.value = directoryStore.baseDirectory;
  updateDirectoryList();

  if(directoryStore.relatedDirectories.length) {
    directoryStore.scanDirectories();
  }
});

const current = ref<string>("");
const options = ref<{id:string, label:string}[]>([]);
const loading = ref(false);

const refocusing = computed(() => {
  return current.value !== directoryStore.baseDirectory;
});
const parentDir = computed(() => current.value.split("/").slice(0, -1).join("/"));
const kohyaParent = computed(() => {
  if (!options.value.length) return false;
  return options.value.some((opt) => KOHYA_FOLDER_PATTERN.test(opt.id.split("/").pop() || ""));
});

const updateDirectoryList = async () => {
  // fetch directories from the server based on the current value
  // and update the options
  directoryStore.fetchDirectories(parentDir.value).then((res: string[]) => {
    const opts:{id:string, label:string}[] = [];
    res.forEach((inner) => {
      opts.push({
        id: `${parentDir.value}/${inner}`,
        label: inner,
      });
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

const onSaveCurrent = async () => {
  loading.value = true;
  await directoryStore.setDirectory(current.value, true);
  store("directory", current.value);
  loading.value = false;
};

const onSaveParent = async () => {
  loading.value = true;
  current.value = parentDir.value;
  await directoryStore.setDirectory(current.value, true);
  store("directory", current.value);
  loading.value = false;
};

const isActive = (dir: ImageDirectory) => {
  return directoryStore.activeDirectory === dir.name;
};

const folderIcon = (dir: ImageDirectory) => {
  const activeState = isActive(dir) ? 'filled' : 'regular';
  const scanState = loader.isLoading(`${Prefixes.DIRSCAN}${dir.name}`) ? '-search' : loader.isQueued(`${Prefixes.DIRSCAN}${dir.name}`) ? '-sync' : '';
  const icon = `fluent:folder${scanState }-20-${activeState}`;
  return icon;
};
</script>
