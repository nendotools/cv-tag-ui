import { defineEventHandler, H3Event, readBody } from "h3";
import { createHash } from "crypto";
import imageSize from "image-size";
import * as fs from "fs";

const Extensions = ["jpg", "jpeg", "png", "bmp", "webp"] as const;

export default defineEventHandler(async (event: H3Event) => {
  const { path } = await readBody(event);
  var isValid = false;
  if (!fs.existsSync(path)) {
    setResponseStatus(event, 404);
    return { path, isValid, error: "File not found" };
  };

  let count = 0;
  const rootFilenames = new Set();
  const rootImagenames = new Set();
  for (const file in fs.readdirSync(path)) {
    // ignore all files except txt and json
    if (![".txt", ".json"].includes(file.split(".").pop() || '')) {
      if (Extensions.includes((file.split(".").pop() || "") as typeof Extensions[number])) {
        rootImagenames.add(file.slice(0, file.lastIndexOf(".")));
      }
      continue;
    }

    // get the base filename without extension
    rootFilenames.add(file.slice(0, file.lastIndexOf(".")));
  }

  // prune all files in rootFilenames that are not in rootImagenames
  for (const rootName of rootFilenames) {
    if (!rootImagenames.has(rootName)) {
      if (fs.existsSync(`${path}/${rootName}.txt`)) {
        fs.unlinkSync(`${path}/${rootName}.txt`);
        count++;
      }
      if (fs.existsSync(`${path}/${rootName}.json`)) {
        fs.unlinkSync(`${path}/${rootName}.json`);
        count++;
      }
    }
  }


  return {
    count
  };
});
