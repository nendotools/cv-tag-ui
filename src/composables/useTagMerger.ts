export const useTagMerger = () => {
  const rootTags: string[] = [
    "sky",
    "hairband",
    "pubic hair",
    "hair",
    "hair bun",
    "braids",
    "braid",
    "scrunchie",
    "eyes",
    "smile",
    "mouth",
    "lips",
    "nose",
    "ears",
    "legs",
    "breasts",
    "choker",
    "ribbon",
    "shirt",
    "skirt",
    "shorts",
    "pants",
    "bra",
    "panties",
    "socks",
    "pantyhose",
    "thighhighs",
    "shoes",
    "footwear",
    "heels",
    "dress",
    "swimsuit",
    "leotard",
    "bandeau",
    "tube top",
    "bikini bottom",
    "bikini",
    "lingerie",
    "gloves",
    "sleeves",
    "hat",
    "hoodie",
    "coat",
    "vest",
    "uniform",
    "tie",
    "bowtie",
    "collar",
    "jacket",
    "sweater",
    "sweatshirt",
    "sweatpants",
    "sweatshorts",
    "clothes",
    "camisole",
    "tank top",
    "bow",
    "necklace",
    "earrings",
    "bracelet",
    "ring",
    "belt",
    "scarf",
    "glasses",
    "nude",
    "naked",
    "freckles",
    "tattoo",
    "piercing",
    "cameltoe",
    "camera",
    "background",
    "inset",
    "v",
    "bag",
    "backpack",
    "purse",
    "stairs",
    "bed",
    "chair",
    "bench",
    "border",
    "sunlight",
  ];

  const categories = {
    colors: [
      "black",
      "blue",
      "brown",
      "gray",
      "green",
      "orange",
      "pink",
      "purple",
      "red",
      "white",
      "yellow",
      "multicolored",
      "monochrome",
      "transparent",
      "silver",
      "gold",
    ],
    length: ["long", "medium", "short"],
  };

  const byCategory = (a: string, b: string) => {
    if (a === b) return 0;
    if (categories.length.includes(a)) return -1;
    if (categories.length.includes(b)) return 1;
    if (categories.colors.includes(a)) return -1;
    if (categories.colors.includes(b)) return 1;
    // sort alphabetically
    return a.localeCompare(b);
  };

  const mergeTags = (
    tags: string[],
  ): { newTags: string[]; removedTags: string[] } => {
    const removedTags: string[] = [];
    const mergedTags: Record<string, string> = {};

    for (const word of rootTags) {
      for (const tag of tags) {
        if (tag.endsWith(word)) {
          if (tag !== word && !tag.includes(" " + word)) continue;
          if (tag.endsWith(`on ${word}`)) continue;
          if (tag.endsWith(`ing ${word}`)) continue;
          const tagWords = tag.split(word)[0].split(" ").filter(Boolean);
          const existingTag = (mergedTags[word] || "")
            .split(" ")
            .filter(Boolean);
          const wordSet = new Set([...tagWords, ...existingTag]);
          mergedTags[word] = [...wordSet].sort(byCategory).join(" ");

          removedTags.push(tag);
        }
      }
    }

    const newTags: string[] = [];
    for (const word in mergedTags) {
      newTags.push(`${mergedTags[word]} ${word}`.trim());
    }

    const sharedTags = removedTags.filter((tag) => newTags.includes(tag));
    return {
      newTags: [...newTags.filter((t) => !sharedTags.includes(t))],
      removedTags: [...removedTags.filter((t) => !sharedTags.includes(t))],
    };
  };

  return { mergeTags };
};
