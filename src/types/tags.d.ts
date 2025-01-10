export { ImageTag, AndFilter, OrFilter };

declare global {
  interface ImageTag {
    name: string;
    category: number;
  }

  interface AndFilter {
    type: "and";
    tags: Set<string>;
  }

  interface OrFilter {
    type: "or";
    tags: Set<string>;
  }
}
