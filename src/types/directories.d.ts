export { ImageDirectory };

declare global {
  // Store path and summary data
  interface ImageDirectory {
    name: string;
    path: string;
    images: number;
    tags: number;
    scans: number;
  }

  interface FSItem {
    type: "directory" | "file";
    fullPath: string;
    hidden?: boolean;
    name: string;
  }

  interface FSDirectory extends FSItem {
    type: "directory";
  }

  interface FSFile extends FSItem {
    type: "file";
    extension: string;
    isKohya: boolean;
  }
}
