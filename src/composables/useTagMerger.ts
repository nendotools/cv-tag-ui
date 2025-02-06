export const useTagMerger = () => {
  const rootTags: string[] = [
    "pubic hair",
    "hair",
    "eyes",
    "mouth",
    "nose",
    "ears",
    "breasts",
    "shirt",
    "skirt",
    "shorts",
    "pants",
    "bra",
    "panties",
    "socks",
    "shoes",
    "dress",
    "swimsuit",
    "bikini",
    "lingerie",
    "gloves",
    "hat",
    "coat",
    "jacket",
    "sweater",
    "sweatshirt",
    "sweatpants",
    "sweatshorts",
    "clothes",
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
  ];

  // Need a way to merge tags based on the last word/words.
  // It should accept a list of tags and return a list of tags {newTags: string[], removedTags: string[]}
  // If the last word of a tag is in the rootTags, it should be added to a merged tag (e.g. "blue eyes" -> {'eyes': 'blue'}, "large eyes" => {'eyes': 'large blue'})
  // after merging, the tag should be removed from the list of tags
  // If a tag exactly matches a rootTag, it should be removed from the list of tags and added to the merged tag if not present already (e.g. {"eyes": ''})
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

    // remove tags that are in both removedTags and newTags
    const sharedTags = removedTags.filter((tag) => newTags.includes(tag));
    return {
      newTags: [...newTags.filter((t) => !sharedTags.includes(t))],
      removedTags: [...removedTags.filter((t) => !sharedTags.includes(t))],
    };
  };

  return { mergeTags };
};
