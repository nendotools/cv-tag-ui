import { defineEventHandler, H3Event, getQuery } from "h3";
import * as fs from "fs";

// list all files in a directory and detect kohya config
export default defineEventHandler(async (event: H3Event) => {
  // get path from query
  const q = getQuery<{ path: string }>(event);
  const path = decodeURIComponent(q.path);
  const isValid = fs.existsSync(path);
  const isDir = fs.statSync(path).isDirectory();
  if (!isDir) {
    setResponseStatus(event, 400);
    return {
      error: "Path is not a directory",
    };
  }
  const p = path === "/" ? "" : path;

  const dirMap: (FSDirectory | FSFile)[] = [];
  const realP = fs.realpathSync(p || '/')
  const files = fs.readdirSync(realP, { withFileTypes: true });
  for (const file of files) {
    // check permission and skip if not accessible
    const sub = `${p}/${file.name}`;
    try {
      if (['tmp'].includes(file.name)) continue
      fs.accessSync(sub, fs.constants.W_OK);
    } catch {
      // Darwin, allow /Users
      // Linux, allow /home
      if (process.platform === 'darwin' && !['/Users', '/Volumes'].includes(sub)) {
        continue
      } else if (process.platform === 'linux' && sub !== '/home') {
        continue
      } else if (!['darwin', 'linux'].includes(process.platform)) {
        continue
      }
    }

    const fullPath = `${p}/${file.name}`;
    // need to detect if file is a symlink
    if (file.isSymbolicLink()) {
      // detect if symlink is a directory or file and set type accordingly
      console.log(`Symlink detected: ${fullPath}`);
      console.log(`link evaluated to: ${fs.realpathSync(fullPath)}`);
      const linkPath = fs.realpathSync(fullPath);
      if (fs.existsSync(linkPath)) {
        const stats = fs.lstatSync(linkPath);
        if (stats.isDirectory()) {
          dirMap.push({
            type: "directory",
            fullPath,
            name: file.name,
            hidden: file.name.startsWith("."),
          });
        } else if (stats.isFile()) {
          const isKohya = detectKohya(linkPath);
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
    }
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
      ["LoRA_type", "epoch", "output_name", "train_data_dir"].every(p => Object.getOwnPropertyDescriptor(json, p))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
