export { MIME_TYPES, Extensions, ImageExtensions, ImageFile };

declare global {
  enum MIME_TYPES {
    WEBP = "image/webp",
    JPEG = "image/jpeg",
    JPG = "image/jpg",
    PNG = "image/png",
    BMP = "image/bmp",
  }
  enum ImageExtensions {
    JPG = ".jpg",
    JPEG = ".jpeg",
    WEBP = ".webp",
    PNG = ".png",
    BMP = ".bmp",
  }
  Extionsions = [".jpg", ".jpeg", ".webp", ".png", ".bmp"];
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
    confidenceScore: number;
    confidenceKeys: Record<string, number>;
  }
}
