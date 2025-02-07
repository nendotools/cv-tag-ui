import { defineEventHandler, H3Event, readFormData } from "h3";
import imageSize from "image-size";
import * as fs from "fs";
import { createHash } from "crypto";

export default defineEventHandler(async (event: H3Event) => {
  const formData = await readFormData(event);
  const path = String(formData.get("path"));
  const files = formData.getAll("files") as unknown as File[];
  if (!path || !files) {
    setResponseStatus(event, 400);
    return { error: "invalid files" };
  }

  const createdPaths: ImageFile[] = [];
  for (const file of files) {
    console.log(`Finding file at ${path}`);
    if (fs.existsSync(`${path}/${file.name}`)) {
      console.log(`File already exists at ${path}/${file.name}`);
      continue;
    }

    console.log(`Uploading file to ${path}/${file.name}`);
    fs.writeFileSync(
      `${path}/${file.name}`,
      Buffer.from(await file.arrayBuffer()),
    );
    const fileData = fs.readFileSync(`${path}/${file.name}`);

    const image: ImageFile = {
      path: `${path}/${file.name}`,
      resource: `/resource${path}/${file.name}`,
      name: file.name,
      hash: createHash("sha256").update(fileData).digest("hex"),
      dimensions: {
        width: 0,
        height: 0,
      },
      tags: [],
      highConfidenceTags: [],
      lowConfidenceTags: [],
      confidenceKeys: {},
      confidenceScore: 0,
      mimeType: file.type,
    };
    try {
      const dims = imageSize(`${path}/${file.name}`);
      image.dimensions = {
        width: dims.width || 0,
        height: dims.height || 0,
      };
    } catch (e) {
      image.dimensions = {
        width: 0,
        height: 0,
      };
    }

    createdPaths.push(image);
  }

  setHeader(event, "Content-Type", "application/json");
  return { files: createdPaths };
});
