<template>
          <div class="h-full flex flex-col justify-start gap-2">
            <UHorizontalNavigation color="indigo" :links="[
              { label: 'Send', icon: 'fluent:image-arrow-forward-20-regular', active: mode === 'send', click: () => mode = 'send' },
              { label: 'Copy', icon: 'fluent:image-copy-20-regular', active: mode === 'copy', click: () => mode = 'copy' },
            ]" />
            <div v-if="mode === 'send'" class="h-full flex flex-col justify-start gap-2">
            <UButton
              v-for="dir in directoryStore.relatedDirectories" 
              :key="dir" 
              color="indigo" 
              :disabled="dir === directoryStore.activeDirectory"
              @click="filesStore.moveFiles(file, directoryStore.baseDirectory + '/' + dir)"
              >
            Send to {{ dir }}
            </UButton>
            </div>
            <div v-if="mode === 'copy'" class="h-full flex flex-col justify-start gap-2">
            <UButton 
              v-for="dir in directoryStore.relatedDirectories" 
              :key="dir" 
              color="indigo" 
              :disabled="dir === directoryStore.activeDirectory"
              @click="filesStore.moveFiles(file, directoryStore.baseDirectory + '/' + dir, true)"
              >
            Copy to {{ dir }}
            </UButton>
          </div>
          </div>
</template>

<script lang="ts" setup>
import { useDirectory } from "~/pinia/directory";
const directoryStore = useDirectory();
import { useFiles } from "~/pinia/files";
const filesStore = useFiles();

const mode = ref('send');
defineProps<{
  file: ImageFile,
}>();
</script>
