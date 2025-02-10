import { defineEventHandler, H3Event, getQuery } from "h3";
import * as fs from "fs";

// list all files in a directory and detect kohya config
export default defineEventHandler(async (event: H3Event) => {
  // get path from query
  const q = getQuery<{ path: string }>(event);
  const path = decodeURIComponent(q.path);
  var isValid = fs.existsSync(path);
  var isDir = fs.statSync(path).isDirectory();
  if (!isDir) {
    setResponseStatus(event, 400);
    return {
      error: "Path is not a directory",
    };
  }
  const p = path === "/" ? "" : path;
  console.log(`Listing directory: ${p}`);

  const dirMap: (FSDirectory | FSFile)[] = [];
  const files = fs.readdirSync(path, { withFileTypes: true });
  for (const file of files) {
    // check permission and skip if not accessible
    try {
      fs.accessSync(`${p}/${file.name}`, fs.constants.W_OK);
    } catch (err) {
      if (file.name !== "home") {
        continue;
      }
    }

    const fullPath = `${p}/${file.name}`;
    if (file.isDirectory()) {
      dirMap.push({
        type: "directory",
        fullPath,
        name: file.name,
        hidden: file.name.startsWith("."),
      });
    } else if (file.isFile()) {
      const isKohya = detectKohya(fullPath);
      const extension = file.name.split(".").pop() || "";
      dirMap.push({
        type: "file",
        fullPath,
        name: file.name,
        extension,
        hidden: file.name.startsWith("."),
        isKohya,
      });
    }
  }

  setResponseStatus(event, isValid ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  setHeader(event, "Cache-Control", "no-cache");
  return {
    contents: dirMap,
  };
});

// load file and scan for kohya indicators in JSON
const detectKohya = (path: string) => {
  try {
    // only check json files
    if (!path.endsWith(".json")) {
      return false;
    }
    // check file size, if too large, skip
    const stats = fs.statSync(path);
    if (stats.size > 1024 * 1024) {
      return false;
    }
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
