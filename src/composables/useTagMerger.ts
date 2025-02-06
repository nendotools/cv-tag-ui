export const useTagMerger = () => {
  const rootTags: string[] = [
    "sky",
    "hairband",
    "pubic hair",
    "hair",
    "hair bun",
    "braids",
    "braid",
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
    "thighhighs",
    "shoes",
    "footwear",
    "heels",
    "dress",
    "swimsuit",
    "bikini",
    "lingerie",
    "gloves",
    "hat",
    "hoodie",
    "coat",
    "vest",
    "uniform",
    "jacket",
    "sweater",
    "sweatshirt",
    "sweatpants",
    "sweatshorts",
    "clothes",
    "camisole",
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
  ];

  const mergeTags = (
    tags: string[],
  ): { newTags: string[]; removedTags: string[] } => {
    const removedTags: string[] = [];
    const mergedTags: Record<string, string> = {};

    for (const word of rootTags) {
      for (const tag of tags) {
        if (tag.endsWith(word)) {
          if (tag !== word && !tag.includes(" " + word)) continue;
          const tagWords = tag.split(word)[0].split(" ").filter(Boolean);
          const existingTag = (mergedTags[word] || "")
            .split(" ")
            .filter(Boolean);
          const wordSet = new Set([...tagWords, ...existingTag]);
          mergedTags[word] = [...wordSet].join(" ");

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
