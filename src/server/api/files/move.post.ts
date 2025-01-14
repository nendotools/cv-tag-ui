import { defineEventHandler, H3Event, readBody } from "h3";
import { createHash } from "crypto";
import imageSize from "image-size";
import * as fs from "fs";

const Extensions = ["jpg", "jpeg", "png", "bmp", "webp"] as const;

export default defineEventHandler(async (event: H3Event) => {
  const { path, target, preserve } = await readBody(event);
  var isValid = false;
  // validate file path
  if (!fs.existsSync(path)) {
    return { path, isValid, error: "File not found" };
  }
  const fileName: string = path.split("/").pop();
  const baseFileName = fileName.split(".").shift();
  const basePath = path.replace(fileName, "");

  // validate target path
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return { path, isValid, error: "Destination not found" };
  }

  // if target path contains file from path, return error exists
  if (fs.existsSync(`${target}/${fileName}`)) {
    return { path, isValid, error: "File already exists" };
  }

  // if preserve is true, copy file to target path
  if (preserve) {
    fs.copyFileSync(path, `${target}/${fileName}`);
  } else {
    // else, move file to target path
    fs.renameSync(path, `${target}/${fileName}`);
    // handle .txt and .json files
    if (fs.existsSync(`${target}/${fileName}.txt`)) {
      fs.renameSync(`${basePath + baseFileName}.txt`, `${target}/${baseFileName}.txt`);
    }
    if (fs.existsSync(`${target}/${fileName}.json`)) {
      fs.renameSync(`${basePath + baseFileName}.json`, `${target}/${baseFileName}.json`);
    }
  }

  return {
    path: `${target}/${fileName}`,
    isValid,
  };
});
