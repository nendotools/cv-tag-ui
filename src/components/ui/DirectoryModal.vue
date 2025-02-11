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

      <FileBrowser
        v-if="mode === 'edit'"
        :current="directoryStore.baseDirectory"
        @cancel="() => (mode = 'view')"
        @save="onSaveCurrent"
        @loadConfig="onSaveKohya"
      />

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

      <div
        v-if="mode === 'view' && subdirectories"
        class="flex flex-col gap-2 mt-4"
      >
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
      </div>

      <template v-if="mode === 'view'" #footer>
        <div class="flex justify-between gap-4">
          <div
            v-if="subdirectories && !showCreate"
            class="tw-full grid gap-2 items-center"
          >
            <UButton icon="fluent:folder-add-20-regular" @click="startCreate">
              Create Directory
            </UButton>
          </div>
          <div
            v-if="subdirectories && showCreate"
            class="tw-full flex gap-2 items-center"
          >
            <UButton
              icon="fluent:folder-prohibited-20-regular"
              color="rose"
              @click="cancelCreate"
            />
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
          <UButton v-if="!showCreate" @click="onSave"> Save </UButton>
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
  updateDirectoryList(current.value);

  if (directoryStore.relatedDirectories.length) {
    directoryStore.scanDirectories();
  }
});

const mode = ref<"edit" | "view">("view");
const isKohya = ref(false);
const showCreate = ref(false);
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

const setActive = (dirname: string) => {
  directoryStore.activeDirectory = dirname;
  store("activeDirectory", dirname);
};

const onSave = async () => {
  files.setDirectory(directoryStore.workingDirectory);
  emit("save");
};

const onSaveCurrent = async (path: string) => {
  loading.value = true;
  // remove trailing slash
  path = path.replace(/\/$/, "");
  directoryStore.setDirectory(path, true);
  updateDirectoryList(path);
  store("directory", path);
  remove("kohyaConfig");
  mode.value = "view";
  loading.value = false;
};

const onSaveKohya = async (config: string) => {
  loading.value = true;
  await directoryStore.setFromConfig(config);
  const configDir = config.split("/").slice(0, -1).join("/");
  store("directory", configDir);
  store("kohyaConfig", config);
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
