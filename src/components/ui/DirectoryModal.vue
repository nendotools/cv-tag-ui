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
          option-attribute="id"
          :search-attributes="['id']"
          :popper="{
              placement: 'top-end',
          }"
          v-model="current"
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
      <div v-if="subdirectories" class="flex flex-col gap-2 mt-4">
        <div v-for="opt, index in directoryStore.subDirectories" :key="index" class="w-full grid grid-cols-5 gap-2 items-center">
          <div class="col-span-2 flex flex-row gap-1 align-enter">
          <UButton color="rose" size="xs" icon="fluent:delete-20-regular" :disabled="isActive(opt)" @click="onRemove(opt)"/>
          <UButton
            class="flex-1"
            :icon="folderIcon(opt)"
            :color="isActive(opt) ? 'emerald' : 'gray'"
            @click="directoryStore.activeDirectory = opt.name" >
            {{ opt.name }}
          </UButton>
          </div>
          <UBadge
            class="w-full select-none"
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:image-20-regular">
            {{ opt.images }}
          </UBadge>
          <UTooltip
            text="TXT Tag Files"
            :popper="{ arrow: true, placement: 'top' }"
          >
          <UBadge
            class="w-full select-none"
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:tag-20-regular">
            {{ opt.tags }}
          </UBadge>
          </UTooltip>
          <UTooltip
            text="Cached Inferrence Results" 
            :popper="{ arrow: true, placement: 'top' }"
          >
          <UBadge
            class="w-full select-none"
            :variant="isActive(opt) ? 'subtle' : 'solid'" 
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:book-database-20-regular">
            {{ opt.scans }}
          </UBadge>
          </UTooltip>
        </div>
        <div v-if="subdirectories && !showCreate" class="tw-full grid grid-cols-5 gap-2 items-center">
          <UButton class="col-span-2" icon="fluent:folder-add-20-regular" @click="startCreate">
            Create Directory
          </UButton>
        </div>
        <div v-if="subdirectories && showCreate" class="tw-full grid grid-cols-5 gap-2 items-center">
          <UButton icon="fluent:folder-prohibited-20-regular" color="rose" @click="cancelCreate">
            Cancel
          </UButton>
          <UButton icon="fluent:folder-add-20-regular" @click="saveCreate">
            Create
          </UButton>
          <UInput 
            class="col-span-3"
            placeholder="New Directory Name"
            v-model="newDirname"
            @input="validateName">
            <template #trailing>
              <UBadge
              v-if="isKohya"
                :color="isValidTarget ? 'emerald' : 'rose'"
                :variant="isValidTarget ? 'subtle' : 'solid'"
                icon="fluent:tag-20-regular">
                {{ kohyaTarget }}
              </UBadge>
              <div v-else></div>
            </template>
          </UInput>
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

import { useTags } from "~/pinia/tags";
const { rawTags } = storeToRefs(useTags());

const emit = defineEmits(["save"]);
onMounted(() => {
  loading.value = false;
  current.value = directoryStore.baseDirectory;
  updateDirectoryList(parentDir.value);

  if(directoryStore.relatedDirectories.length) {
    directoryStore.scanDirectories();
  }
});

const showCreate = ref(false);
const isKohya = ref(false);
const kohyaTarget = ref<string>("");
const newDirname = ref<string>("");
const isValidTarget = computed(() => {
  if (isKohya.value) {
    return rawTags.value.includes(kohyaTarget.value);
  }
  return true;
});
const startCreate = () => {
  showCreate.value = true;
};
const cancelCreate = () => {
  showCreate.value = false;
  kohyaTarget.value = "";
  newDirname.value = "";
  isKohya.value = false;
};
const saveCreate = async () => {
  if (isKohya.value && isValidTarget.value) {
    await directoryStore.createDirectory(newDirname.value);
    showCreate.value = false;
    kohyaTarget.value = "";
    newDirname.value = "";
    isKohya.value = false;
  }
};
const validateName = (e: Event) => {
  const target = e.target as HTMLInputElement;
  isKohya.value = KOHYA_FOLDER_PATTERN.test(target.value);
  if(isKohya.value) {
    kohyaTarget.value = target.value.split(" ")[1];
  }
};

const current = ref<string>("");
const options = ref<{id:string, label:string}[]>([]);
const loading = ref(false);

const subdirectories = computed(() => {
  return directoryStore.relatedDirectories;
});
const refocusing = computed(() => {
  return current.value !== directoryStore.baseDirectory;
});
const parentDir = computed(() => current.value.split("/").slice(0, -1).join("/"));
const kohyaParent = computed(() => {
  if (!options.value.length) return false;
  return options.value.some((opt) => KOHYA_FOLDER_PATTERN.test(opt.id.split("/").pop() || ""));
});

const updateDirectoryList = async (targetDir: string) => {
  // fetch directories from the server based on the current value
  // and update the options
  directoryStore.fetchDirectories(targetDir).then((res: string[]) => {
    const opts:{id:string, label:string}[] = [];
    res.forEach((inner) => {
      opts.push({
        id: `${targetDir}/${inner}`,
        label: inner,
      });
    });
    options.value = opts;
  });
};

// on input, if the value ends in a slash, update the current value and fetch directories from the server
const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;

  if (target.value.endsWith("/")) {
    updateDirectoryList(target.value.slice(0, -1));
  }
};

const onSave = async () => {
  files.setDirectory(directoryStore.workingDirectory);
  emit("save");
};

const onSaveCurrent = async () => {
  loading.value = true;
  await directoryStore.setDirectory(current.value);
  store("directory", current.value);
  loading.value = false;
};

const onSaveParent = async () => {
  loading.value = true;
  options.value = [];
  current.value = current.value.slice(0, current.value.lastIndexOf('/'))
  updateDirectoryList(parentDir.value);
  await directoryStore.setDirectory(current.value, true);
  store("directory", current.value);
  loading.value = false;
};

const onRemove = async (dir: ImageDirectory) => {
  await directoryStore.removeDirectory(dir.path);
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
