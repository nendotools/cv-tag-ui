export { ImageTag, AndFilter, OrFilter };

declare global {
  interface ImageTag {
    label: string;
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
