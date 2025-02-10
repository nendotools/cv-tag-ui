<template>
  <UModal :ui="{ container: 'items-center' }">
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

      <FileBrowser />

      <div v-if="mode === 'view'" class="flex flex-col gap-2 space-x-2">
        <div v-if="directoryStore.kohyaConfig" class="flex flex-col">
          <div class="flex flex-row justify-between">
            <h3 class="text-md font-semibold">Active Config</h3>
            <UButton
              color="white"
              icon="fluent:folder-open-20-regular"
              :disabled="loading"
              @click="mode = 'edit'"
            />
          </div>
          <div class="text-sm grow-2 align-text-bottom">
            {{ directoryStore.kohyaConfig }}
          </div>
        </div>
        <div v-else class="flex flex-col">
          <div class="flex flex-row justify-between">
            <h3 class="text-md font-semibold">Active Directory</h3>
            <UButton
              color="white"
              icon="fluent:folder-open-20-regular"
              :disabled="loading"
              @click="mode = 'edit'"
            />
          </div>
          <div class="text-sm grow-2 align-text-bottom">
            {{ directoryStore.baseDirectory }}
          </div>
        </div>
      </div>
      <div v-if="mode === 'edit'" class="flex flex-col gap-2 space-x-2">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Select the directory where your images are stored:
          </p>
        </div>
        <UInputMenu
          class="flex-1"
          placeholder="Directory path"
          :options="[...options, { id: 'cur', label: current }]"
          value-attribute="id"
          option-attribute="id"
          :search-attributes="['id']"
          :popper="{
            placement: 'top-end',
          }"
          v-model="current"
          @input="onInput"
        >
          <template #option="{ option: dir }">
            <UIcon
              v-if="dir.isKohya"
              name="fluent:tag-20-regular"
              class="mr-2"
            />
            <span class="truncate">{{ dir.label }}</span>
          </template>
        </UInputMenu>
        <div class="w-full flex flex-row justify-end gap-2">
          <UButton
            v-if="currentInputKohya"
            color="teal"
            :loading="loading"
            :disabled="loading"
            @click="onSaveKohya"
          >
            Load Kohya Config
          </UButton>
          <UButton
            v-if="kohyaParent && refocusing"
            color="emerald"
            :loading="loading"
            :disabled="loading"
            @click="onSaveParent"
          >
            Use Parent
          </UButton>
          <UButton
            v-if="refocusing"
            :loading="loading"
            :disabled="loading"
            @click="onSaveCurrent"
          >
            Use Current
          </UButton>
          <UButton
            v-if="createNew"
            :loading="loading"
            :disabled="loading"
            @click="startCreate"
          >
            Create New
          </UButton>
        </div>
      </div>
      <div v-if="subdirectories" class="flex flex-col gap-2 mt-4">
        <div
          v-for="(opt, index) in directoryStore.subDirectories"
          :key="index"
          class="w-full grid grid-cols-5 gap-2 items-center"
        >
          <div class="col-span-2 flex flex-row gap-1 align-enter">
            <UButton
              color="rose"
              size="xs"
              icon="fluent:delete-20-regular"
              :disabled="isActive(opt)"
              @click="onRemove(opt)"
            />
            <UButton
              class="flex-1"
              :icon="folderIcon(opt)"
              :color="isActive(opt) ? 'emerald' : 'gray'"
              @click="setActive(opt.name)"
            >
              {{ opt.name }}
            </UButton>
          </div>
          <UBadge
            class="w-full select-none"
            :variant="isActive(opt) ? 'subtle' : 'solid'"
            :color="isActive(opt) ? 'emerald' : 'gray'"
            icon="fluent:image-20-regular"
          >
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
              icon="fluent:tag-20-regular"
            >
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
              icon="fluent:book-database-20-regular"
            >
              {{ opt.scans }}
            </UBadge>
          </UTooltip>
        </div>
        <div
          v-if="subdirectories && !showCreate"
          class="tw-full grid grid-cols-5 gap-2 items-center"
        >
          <UButton
            class="col-span-2"
            icon="fluent:folder-add-20-regular"
            @click="startCreate"
          >
            Create Directory
          </UButton>
        </div>
        <div
          v-if="subdirectories && showCreate"
          class="tw-full grid grid-cols-5 gap-2 items-center"
        >
          <UButton
            icon="fluent:folder-prohibited-20-regular"
            color="rose"
            @click="cancelCreate"
          >
            Cancel
          </UButton>
          <UButton icon="fluent:folder-add-20-regular" @click="saveCreate">
            Create
          </UButton>
          <UInput
            class="col-span-3"
            placeholder="New Directory Name"
            v-model="newDirname"
            @input="validateName"
          >
            <template #trailing>
              <UBadge
                v-if="isKohya"
                :color="isValidTarget ? 'emerald' : 'rose'"
                :variant="isValidTarget ? 'subtle' : 'solid'"
                icon="fluent:tag-20-regular"
              >
                {{ kohyaTarget }}
              </UBadge>
              <div v-else></div>
            </template>
          </UInput>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton @click="onSave"> Save </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { useRecall } from "~/pinia/recall";
const { store, remove } = useRecall();

import { Prefixes, useLoaders } from "~/pinia/loaders";
const loader = useLoaders();

import { useFiles } from "@/pinia/files";
const files = useFiles();

import { KOHYA_FOLDER_PATTERN, useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();

import { useTags } from "~/pinia/tags";
import FileBrowser from "../browser/FileBrowser.vue";
const { rawTags } = storeToRefs(useTags());

const emit = defineEmits(["save"]);
onMounted(() => {
  loading.value = false;
  current.value = directoryStore.baseDirectory;
  updateDirectoryList(parentDir.value);

  if (directoryStore.relatedDirectories.length) {
    directoryStore.scanDirectories();
  }
});

const mode = ref<"edit" | "view">("view");
const isKohya = ref(false);
const showCreate = ref(false);
const kohyaTarget = ref<string>("");
const newDirname = ref<string>("");
const currentInputKohya = computed(() => {
  if (directoryStore.baseDirectory === current.value) return false;
  return (
    options.value.find((opt) => opt.id === current.value)?.isKohya || false
  );
});
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
  await directoryStore.createDirectory(newDirname.value);
  showCreate.value = false;
  kohyaTarget.value = "";
  newDirname.value = "";
  isKohya.value = false;
};
const validateName = (e: Event) => {
  const target = e.target as HTMLInputElement;
  isKohya.value = KOHYA_FOLDER_PATTERN.test(target.value);
  if (isKohya.value) {
    kohyaTarget.value = target.value.split(" ")[1];
  }
};

const current = ref<string>("");
const options = ref<{ id: string; label: string; isKohya: boolean }[]>([]);
const loading = ref(false);

const subdirectories = computed(() => {
  return directoryStore.relatedDirectories;
});
const refocusing = computed(() => {
  return current.value !== directoryStore.baseDirectory && !createNew.value;
});
const parentDir = computed(() =>
  current.value.split("/").slice(0, -1).join("/"),
);
const kohyaParent = computed(() => {
  if (!options.value.length) return false;
  return options.value.some((opt) =>
    KOHYA_FOLDER_PATTERN.test(opt.id.split("/").pop() || ""),
  );
});

const updateDirectoryList = async (targetDir: string) => {
  // fetch directories from the server based on the current value
  // and update the options
  if (targetDir === "") targetDir = "/";
  directoryStore
    .fetchDirectories(targetDir)
    .then((res: { path: string; isKohya: boolean }[]) => {
      const opts: { id: string; label: string; isKohya: boolean }[] = [];
      res.forEach((inner) => {
        opts.push({
          id: `${targetDir === "/" ? "" : targetDir}/${inner.path}`,
          label: inner.path,
          isKohya: inner.isKohya,
        });
      });
      options.value = opts;
    });
};

watch(
  () => current.value,
  (val) => {
    if (val === "") {
      current.value = "/";
    }
    const latest = current.value.split("/").pop();

    createNew.value = false;
    if (
      latest &&
      latest.length > 0 &&
      !options.value.map((v) => v.label).includes(latest)
    ) {
      createNew.value = true;
    }
  },
);

const createNew = ref(false);
// on input, if the value ends in a slash, update the current value and fetch directories from the server
const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;

  if (target.value.endsWith("/")) {
    updateDirectoryList(target.value.slice(0, -1));
  }

  const latest = current.value.split("/").pop();
  if (
    latest &&
    latest.length > 0 &&
    !options.value.map((v) => v.id).includes(latest)
  ) {
    createNew.value = true;
  }
};

const setActive = (dirname: string) => {
  directoryStore.activeDirectory = dirname;
  store("activeDirectory", dirname);
};

const onSave = async () => {
  files.setDirectory(directoryStore.workingDirectory);
  emit("save");
};

const onSaveCurrent = async () => {
  loading.value = true;
  await directoryStore.setDirectory(current.value);
  store("directory", current.value);
  remove("kohyaConfig");
  mode.value = "view";
  loading.value = false;
};

const onSaveKohya = async () => {
  loading.value = true;
  const configPath = await directoryStore.setFromConfig(current.value);
  store("directory", current.value);
  store("kohyaConfig", configPath);
  mode.value = "view";
  loading.value = false;
};

const onSaveParent = async () => {
  loading.value = true;
  options.value = [];
  current.value = current.value.slice(0, current.value.lastIndexOf("/"));
  updateDirectoryList(parentDir.value);
  await directoryStore.setDirectory(current.value, true);
  store("directory", current.value);
  remove("kohyaConfig");
  mode.value = "view";
  loading.value = false;
};

const onRemove = async (dir: ImageDirectory) => {
  await directoryStore.removeDirectory(dir.path);
};

const isActive = (dir: ImageDirectory) => {
  return directoryStore.activeDirectory === dir.name;
};

const folderIcon = (dir: ImageDirectory) => {
  const activeState = isActive(dir) ? "filled" : "regular";
  const scanState = loader.isLoading(`${Prefixes.DIRSCAN}${dir.name}`)
    ? "-search"
    : loader.isQueued(`${Prefixes.DIRSCAN}${dir.name}`)
      ? "-sync"
      : "";
  const icon = `fluent:folder${scanState}-20-${activeState}`;
  return icon;
};
</script>
