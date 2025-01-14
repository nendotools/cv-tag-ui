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
    if (!Extensions.includes((file.name.split(".").pop() || "") as typeof Extensions[number])) {
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

const prepareFile = (dir: string, fileName: string): { image: ImageFile, error?: null } | { image?: null, error: string } => {
  // load the file
  if (!fs.existsSync(`${dir}/${fileName}`)) {
    return { error: "File not found" }
  }

  const type = fileName.split(".").pop();
  if (!type || !["jpg", "jpeg", "png", "bmp"].includes(type)) {
    return { error: "Invalid file type" }
  }
  // get the dimensions
  const dims = imageSize(`${dir}/${fileName}`);

  // create hash ID from file data
  const file = fs.readFileSync(`${dir}/${fileName}`);
  const hash = createHash("sha256").update(file).digest("hex");
  const name = fileName.replace(/\.(jpg|jpeg|png|bmp)$/i, "");

  const image: ImageFile = {
    hash,
    name,
    path: `${dir}/${fileName}`,
    resource: `/resource${dir}/${fileName}`,
    dimensions: { width: dims.width || 0, height: dims.height || 0 },
    mimeType: dims.type ?? MIME_TYPES[type.toUpperCase() as keyof typeof MIME_TYPES],
    highConfidenceTags: [],
    lowConfidenceTags: [],
    tags: [],
  };

  if (fs.existsSync(`${dir}/${name}.txt`)) {
    const tags = fs.readFileSync(`${dir}/${name}.txt`, "utf-8").split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");
    image.tags = tags;
  }

  if (fs.existsSync(`${dir}/${name}.json`)) {
    const json = JSON.parse(fs.readFileSync(`${dir}/${name}.json`, "utf-8"));
    image.highConfidenceTags = Object.keys(json.high_tags);
    image.lowConfidenceTags = Object.keys(json.low_tags);
  }

  return { image }
}
