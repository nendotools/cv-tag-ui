export const useTagMerger = () => {
  const rootTags: string[] = [
    "sky",
    "hairband",
    "pubic hair",
    "hair",
    "hair bun",
    "hair ornament",
    "braids",
    "braid",
    "twintails",
    "ponytail",
    "scrunchie",
    "eyes",
    "eyewear",
    "smile",
    "mouth",
    "lips",
    "nose",
    "ears",
    "legs",
    "feet",
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
    "boots",
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
    "necktie",
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
    "neckerchief",
    "wings",
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
    "fence",
    "border",
    "sunlight",
    "flower",
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
    complexity: ["simple", "detailed"],
    state: ["open", "closed"],
  };

  const byCategory = (a: string, b: string) => {
    if (a === b) return 0;
    if (categories.complexity.includes(a)) return -1;
    if (categories.complexity.includes(b)) return 1;
    if (categories.length.includes(a)) return -1;
    if (categories.length.includes(b)) return 1;
    if (categories.colors.includes(a)) return -1;
    if (categories.colors.includes(b)) return 1;
    if (categories.colors.map((c) => `${c}-`).includes(a)) return -1;
    if (categories.colors.map((c) => `${c}-`).includes(b)) return 1;
    // state should be last
    if (categories.state.includes(a)) return 1;
    if (categories.state.includes(b)) return -1;
    // sort alphabetically
    return a.localeCompare(b);
  };

  const hasRootTag = (tag: string) => {
    for (const word of rootTags) {
      if (tag.endsWith(word)) {
        if (tag !== word && !tag.includes(" " + word)) continue;
        if (tag.endsWith(` on ${word}`)) continue;
        if (tag.endsWith(`ing ${word}`)) continue;
        if (tag.endsWith(` with ${word}`)) continue;
        if (tag.endsWith(` own ${word}`)) continue;
        return true;
      }
    }
    return false;
  };

  const mergeActionDescriptors = (tags: string[]) => {
    // remove loose rootTags that are also part of descriptors (eg: 'on couch', 'adjusting hair')
    const foundTags: Record<string, boolean> = {};
    for (const word of rootTags) {
      for (const tag of tags) {
        if (tag.endsWith(word)) {
          // add existing rootTag word to list if found
          if (tag === word) {
            foundTags[word] = foundTags[word] || false;
            continue;
          }

          // add existing rootTag word to list if found as part of a descriptor
          if (
            tag.endsWith(` on ${word}`) ||
            tag.endsWith(`ing ${word}`) ||
            tag.endsWith(` with ${word}`) ||
            tag.endsWith(` own ${word}`)
          ) {
            foundTags[word] = true;
            continue;
          }
        }
      }
    }

    // remove rootTags that are part of descriptors from the list and return it
    const removedTags: string[] = Object.keys(foundTags).reduce(
      (acc: string[], word: string) => {
        return acc.concat(foundTags[word] ? word : []);
      },
      [],
    );
    return {
      removedTags,
    };
  };

  // TODO: keep paired words together (eg: 'very long', 'mole above')
  const mergeTags = (
    tags: string[],
  ): { newTags: string[]; removedTags: string[] } => {
    const removedTags: string[] = [];
    const mergedTags: Record<string, string> = {};

    for (const word of rootTags) {
      for (const tag of tags) {
        if (tag.endsWith(word)) {
          // if the tag matches a different word, skip it
          if (rootTags.indexOf(tag) > -1 && tag !== word) continue;
          if (tag !== word && !tag.includes(" " + word)) continue;
          if (tag.endsWith(` on ${word}`)) continue;
          if (tag.endsWith(`ing ${word}`)) continue;
          if (tag.endsWith(` with ${word}`)) continue;
          if (tag.endsWith(` own ${word}`)) continue;
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

    // remove loose rootTags that are also part of descriptors (eg: 'on couch', 'adjusting hair')
    const { removedTags: descriptors } = mergeActionDescriptors(tags);

    const sharedTags = removedTags.filter((tag) => newTags.includes(tag));
    return {
      newTags: [...newTags.filter((t) => !sharedTags.includes(t))],
      removedTags: [
        ...removedTags
          .filter((t) => !sharedTags.includes(t))
          .concat(descriptors),
      ],
    };
  };

  return { mergeTags, hasRootTag };
};
