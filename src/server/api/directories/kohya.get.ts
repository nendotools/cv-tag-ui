import { defineEventHandler, H3Event, getQuery } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  // get path from query
  const q = getQuery<{ path: string }>(event);
  const path = decodeURIComponent(q.path);
  var isValid = fs.existsSync(path);
  var isDir = fs.statSync(path).isDirectory();

  let configPath = "";
  let kohyaConfig: Record<string, any> | null = null;
  if (isDir) {
    for (const file of fs.readdirSync(path)) {
      if (file.endsWith(".json")) {
        const isKohya = detectKohya(`${path}/${file}`);
        if (isKohya) {
          configPath = `${path}/${file}`;
          kohyaConfig = isKohya;
          break;
        }
      }
    }
  } else {
    const isKohya = detectKohya(path);
    if (isKohya) {
      configPath = path;
      kohyaConfig = isKohya;
    }
  }

  setResponseStatus(event, isValid && !!kohyaConfig ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return {
    configPath,
    kohya: { ...kohyaConfig },
  };
});

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
      return json;
    }
  } catch (err) {
    return false;
  }
  return false;
};
