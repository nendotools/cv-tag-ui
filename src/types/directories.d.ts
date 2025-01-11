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
}
