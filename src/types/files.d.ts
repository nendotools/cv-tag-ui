export { MIME_TYPES, ImageFile };

declare global {
  enum MIME_TYPES {
    WEBP = "image/webp",
    JPEG = "image/jpeg",
    JPG = "image/jpg",
    PNG = "image/png",
    BMP = "image/bmp",
  }
  interface ImageFile {
    path: string;
    name: string;
    hash: string;
    mimeType: MimeType;
    resource: string;
    dimensions: {
      width: number;
      height: number;
    };
    tags: string[];
    highConfidenceTags: string[];
    lowConfidenceTags: string[];
  }
}
