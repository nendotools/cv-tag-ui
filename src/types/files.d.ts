export { ImageFile };

declare global {
  interface ImageFile {
    path: string;
    name: string;
    resource: string;
    dimensions: {
      width: number;
      height: number;
    };
    tags: string[];
  }
}
