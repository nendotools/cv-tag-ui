import { defineEventHandler, H3Event, readBody } from "h3";
import { spawn } from "child_process";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { pythonUtilPath } = useRuntimeConfig(event);
  const pythonPath = `${pythonUtilPath}/venv/bin/python`;
  const { filePath, folderPath } = await readBody(event);
  if (!filePath && !folderPath) {
    setHeader(event, "Status", "400");
    return "Failed";
  }

  const pathArgs = filePath ? ["--file", filePath] : ["--dir", folderPath];
  if (filePath) {
    // if .json file exists, return the cached tags
    const jsonPath = filePath.replace(/\.(jpg|jpeg|png|bmp)$/i, ".json");
    if (fs.existsSync(jsonPath)) {
      const jsonStr = fs.readFileSync(jsonPath, "utf-8");
      const json = JSON.parse(jsonStr);
      setHeader(event, "Content-Type", "application/json");
      return json;
    }
  }

  // ensure python script exists
  const pythonExists = fs.existsSync(pythonPath);
  if (!pythonExists) {
    setHeader(event, "Status", "500");
    return "Python not found";
  }

  const fileExists = fs.existsSync(`${pythonUtilPath}/tag.py`);
  if (!fileExists) {
    setHeader(event, "Status", "500");
    return "Python script not found";
  }

  const filePaths = [];
  if (filePath) {
    filePaths.push(filePath);
  } else {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|bmp)$/i)) {
        filePaths.push(`${folderPath}/${file}`);
      }
    }
  }
  const runPython = new Promise((resolve) => {
    const cmdArr = [`${pythonUtilPath}/tag.py`, ...pathArgs];
    console.log("Running python script with args: ", cmdArr.join(" "));
    const py = spawn("python", cmdArr);
    py.stdout.on("data", (data: Buffer) => {
      console.log(String(data));
    });
    py.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });
    py.stdout.on("end", () => {
      resolve(true);
    });
  });

  await runPython;
  // return the tags from the .json files
  const results: Record<string, any> = {};
  for (const path of filePaths) {
    const jsonPath = path.replace(/\.(jpg|jpeg|png|bmp)$/i, ".json");
    if (fs.existsSync(jsonPath)) {
      const jsonStr = fs.readFileSync(jsonPath, "utf-8");
      const json = JSON.parse(jsonStr);
      setHeader(event, "Content-Type", "application/json");
      results[path] = json;
    }
  }
  return results;
});
