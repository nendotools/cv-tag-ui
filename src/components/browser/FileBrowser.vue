<template>
  <div ref="header" class="text-sm sm:text-md flex justify-between select-none">
    <div class="flex gap-4 items-center p-1">
      <UIcon name="fluent:folder-open-20-regular" />
      <div>
        {{ shortPath }}
      </div>
    </div>

    <div class="flex gap-2">
      <UButton
        color="white"
        icon="fluent:folder-arrow-up-20-regular"
        :disabled="topLevel"
        @click="navigateUp"
      />
    </div>
  </div>

  <div
    ref="folder-contents"
    class="text-sm sm:text-md my-2 overflow-x-hidden min-h-36 h-full max-h-[35dvh] relative rounded-md border-solid border-2 border-slate-400/40"
    :class="{
      'overflow-hidden': loading,
      'overflow-y-auto': !loading,
    }"
  >
    <div v-if="loading" class="absolute w-full h-full bg-gray-800/50 z-50">
      <div class="absolute w-full h-full flex items-center justify-center">
        <UIcon
          name="fluent:spinner-ios-20-regular"
          class="animate-spin absolute"
        />
      </div>
    </div>
    <div
      v-for="item in filteredContents"
      :key="item.name"
      class="flex gap-1 items-center p-1 cursor-pointer select-none"
      :class="{
        'text-purple-300': item.name === selected,
        'bg-gray-800': item.name === selected,
        'even:bg-gray-800/30': item.name !== selected,
        'odd:bg-gray-800/50': item.name !== selected,
        'hover:bg-gray-600/30': item.name !== selected,
        sticky: item.name === selected,
        'top-0': item.name === selected,
        'z-10': item.name === selected,
        'z-0': item.name !== selected,
        'bottom-0': item.name === selected,
      }"
      @click="() => selectItem(item)"
    >
      <UIcon
        v-if="item.type === 'directory'"
        name="fluent:folder-20-regular"
        class="z-1"
      />
      <UIcon
        v-else
        :name="getIcon(item)"
        class="z-1"
        :class="{
          'text-gray-400/50': item.type === 'file' && !item.isKohya,
        }"
      />
      <div
        class="z-1"
        :class="{
          'text-gray-400/50': item.type === 'file' && !item.isKohya,
        }"
      >
        {{ item.name }}
      </div>
      <div
        v-if="item.name === selected"
        class="absolute w-full h-full bg-purple-400/10 hover:bg-purple-400/20 z-0"
      ></div>
    </div>
  </div>

  <div class="flex justify-end gap-2 my-2">
    <UButton color="gray" @click="() => console.log('cance')"> Cancel </UButton>
    <UButton v-if="selectedConfig" @click="() => console.log(selected)">
      Load Config
    </UButton>
    <UButton
      v-else
      :variant="selected ? 'solid' : 'outline'"
      :disabled="!selected"
      @click="() => console.log(selected)"
    >
      Use Directory
    </UButton>
  </div>
</template>

<script lang="ts" setup>
// requirements: current path at top, navivate up, create new dir,
// list files, highlight configs, use directory, use selected config
import { useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();

const topLevel = computed(() => activePath.value === "/");
const loading = ref<boolean>(false);
const showHidden = ref<boolean>(false);

const activePath = ref<string>("/");
const shortPath = computed(() => {
  // path over 3 folders deep should shorten beyond parent to 1 letter
  const parts = activePath.value.split("/");
  if (parts.length <= 3) {
    return activePath.value;
  }
  const short = parts.map((part, index) => {
    if (index >= parts.length - 3) {
      return part;
    }
    return part[0];
  });
  return short.join("/");
});

const selected = ref<string | null>(null);
const selectedConfig = computed(() => {
  if (!selected.value) {
    return false;
  }
  const item = folderContents.value.find(
    (item) => item.name === selected.value,
  );
  return item?.type === "file" && item.isKohya ? true : false;
});

const folderContents = ref<(FSDirectory | FSFile)[]>([]);
const filteredContents = computed(() => {
  return folderContents.value
    .filter((item) => {
      if (item.name.startsWith(".") && !showHidden.value) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // sort directories first
      if (a.type === "directory" && b.type === "file") {
        return -1;
      } else if (a.type === "file" && b.type === "directory") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
});
onMounted(async () => {
  folderContents.value = await directoryStore.listDirectory(activePath.value);
});

const Extensions = ["jpg", "jpeg", "png", "webp", "bmp"];
const getIcon = (item: FSDirectory | FSFile) => {
  if (item.type === "directory") {
    return "fluent:folder-20-regular";
  }
  // image
  if (Extensions.includes(item.extension)) {
    return "fluent:image-20-regular";
  }
  // file
  return "fluent:document-20-regular";
};

const navigateUp = async () => {
  activePath.value = activePath.value.split("/").slice(0, -1).join("/") || "/";
  loading.value = true;
  folderContents.value = await directoryStore.listDirectory(activePath.value);
  loading.value = false;
};

let activeClick: boolean = false;
const selectItem = async (item: FSDirectory | FSFile) => {
  if (item.type === "file" && !item.isKohya) {
    return;
  }

  if (activeClick && item.name === selected.value) {
    activePath.value = item.fullPath;
    loading.value = true;
    folderContents.value = await directoryStore.listDirectory(activePath.value);
    loading.value = false;
    selected.value = null;
    return;
  }

  selected.value = item.name;
  activeClick = true;

  setTimeout(() => {
    if (activeClick) {
      activeClick = false;
      return;
    }
  }, 350);
};
</script>
