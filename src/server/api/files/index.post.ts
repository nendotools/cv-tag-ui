import { defineEventHandler, H3Event, readBody } from "h3";
import { createHash } from "crypto";
import imageSize from "image-size";
import * as fs from "fs";

const Extensions = ["jpg", "jpeg", "png", "bmp", "webp"] as const;

export default defineEventHandler(async (event: H3Event) => {
  const { path } = await readBody(event);
  var isValid = false;
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    isValid = stats.isDirectory();
  });
  console.log(`Fetching files from ${path}`);

  // format the files to be returned
  const files: Record<string, ImageFile> = {};
  const dFiles = fs.readdirSync(path, { withFileTypes: true });
  for (const file of dFiles) {
    // skip files with wronge extensions
    if (
      !Extensions.includes(
        (file.name.split(".").pop() || "") as (typeof Extensions)[number],
      )
    ) {
      continue;
    }

    const { image } = prepareFile(path, file.name);
    if (image) {
      files[image.hash] = image;
    }
  }

  return {
    path,
    isValid,
    files: Object.values(files),
  };
});

const prepareFile = (
  dir: string,
  fileName: string,
): { image: ImageFile; error?: null } | { image?: null; error: string } => {
  const path = `${dir}/${fileName}`;
  // load the file
  if (!fs.existsSync(path)) {
    return { error: "File not found" };
  }

  const type = fileName.split(".").pop()?.toLowerCase();
  if (!type || !["jpg", "jpeg", "png", "bmp"].includes(type)) {
    return { error: "Invalid file type" };
  }

  let checkpoint = "dims";
  // get the dimensions
  imageSize(path, (err, _) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  const dims = { width: 0, height: 0, type: "ERROR" };
  try {
    const { width, height, type } = imageSize(path);
    dims.width = width || 0;
    dims.height = height || 0;
    dims.type = type || "ERROR";
  } catch (e) {
    console.log(e);
  }

  // create hash ID from file data
  checkpoint = "hash";
  const file = fs.readFileSync(path);
  const hash = createHash("sha256").update(file).digest("hex");
  const name = fileName.replace(/\.(jpg|jpeg|png|bmp)$/i, "");

  checkpoint = "build image";
  const image: ImageFile = {
    hash,
    name,
    path,
    resource: `/resource${dir}/${fileName}`,
    dimensions: { width: dims.width || 0, height: dims.height || 0 },
    mimeType:
      dims.type ?? MIME_TYPES[type.toUpperCase() as keyof typeof MIME_TYPES],
    highConfidenceTags: [],
    lowConfidenceTags: [],
    tags: [],
    confidenceScore: 0,
    confidenceKeys: {},
  };

  checkpoint = "tags";
  if (fs.existsSync(`${dir}/${name}.txt`)) {
    const tags = fs
      .readFileSync(`${dir}/${name}.txt`, "utf-8")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    image.tags = tags;
  }

  checkpoint = "confidence";
  if (fs.existsSync(`${dir}/${name}.json`)) {
    const json = JSON.parse(fs.readFileSync(`${dir}/${name}.json`, "utf-8"));
    console.log(name, json);
    image.highConfidenceTags = Object.keys(json.high);
    image.lowConfidenceTags = Object.keys(json.low);
    // combine and sort tags, high confidence tags first, select the top 5 as ConfidenceKeys and calculate the confidence score
    const allTags: Record<string, number> = { ...json.high, ...json.low };
    const sortedTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]);
    const confidenceKeys: Record<string, number> = {};
    let confidenceScore = 0;
    for (const [tag, score] of sortedTags) {
      if (Object.keys(confidenceKeys).length < 5) {
        confidenceKeys[tag] = score;
        confidenceScore += score;
      }
    }
    confidenceScore /= Object.keys(confidenceKeys).length;
    image.confidenceKeys = confidenceKeys;
    image.confidenceScore = confidenceScore;
  }
  return { image };
};
