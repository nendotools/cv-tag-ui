import { defineEventHandler, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event) => {
  const { path } = await readBody(event);
  var isValid = fs.statSync(path).isDirectory();

  const contents: string[] = [];
  const kohyaDirs: string[] = [];
  const isKohya = scanConfigs(path);
  const files = fs.readdirSync(path, { withFileTypes: true });
  for (const file of files) {
    // verify has access to file
    try {
      fs.accessSync(`${path}/${file.name}`, fs.constants.R_OK);
    } catch (err) {
      continue;
    }

    if (file.isDirectory()) {
      contents.push(file.name);
      if (scanConfigs(`${path}/${file.name}`)) {
        kohyaDirs.push(file.name);
      }
    }
  }

  setResponseStatus(event, isValid ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return {
    path,
    isValid,
    isKohya,
    innerDirectories: contents,
    kohyaDirectories: kohyaDirs,
  };
});

const scanConfigs = (path: string) => {
  const files = fs.readdirSync(path, { withFileTypes: true });
  for (const file of files) {
    if (["json"].includes(file.name.split(".").pop() || "")) {
      const isKohya = detectKohya(`${path}/${file.name}`);
      if (isKohya) return true;
    }
  }
  return false;
};

// load file and scan for kohya indicators in JSON
const detectKohya = (path: string) => {
  try {
    const data = fs.readFileSync(path, "utf8");
    const json = JSON.parse(data);
    if (
      json.hasOwnProperty("LoRA_type") &&
      json.hasOwnProperty("epoch") &&
      json.hasOwnProperty("output_name") &&
      json.hasOwnProperty("train_data_dir")
    ) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
};
