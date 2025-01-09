import { defineEventHandler, H3Event } from "h3";
import { spawn } from "child_process";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { pythonUtilPath } = useRuntimeConfig(event);
  const pythonPath = `${pythonUtilPath}/venv/bin/python`;
  const pathArgs = ["--list-tags"];
  setHeader(event, "Content-Type", "application/json");
  // set header to cache for 1 day
  setHeader(event, "Cache-Control", "public, max-age=86400");

  // ensure python script exists
  const pythonExists = fs.existsSync(pythonPath);
  if (!pythonExists) {
    setResponseStatus(event, 500);
    return { error: "Python not found" };
  }

  const fileExists = fs.existsSync(`${pythonUtilPath}/tag.py`);
  if (!fileExists) {
    setResponseStatus(event, 500);
    return { error: "Python script not found" };
  }

  let tagFilePath = "";
  const runPython = new Promise((resolve) => {
    const cmdArr = [`${pythonUtilPath}/tag.py`, ...pathArgs];
    console.log("Running python script with args: ", cmdArr.join(" "));
    const py = spawn("python", cmdArr);
    py.stdout.on("data", (data: Buffer) => {
      const output = String(data).split("\n");
      output.forEach((line) => {
        if (line.startsWith("tag_file: ")) {
          tagFilePath = line.replace("tag_file: ", "");
        }
      });
    });
    py.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });
    py.stdout.on("end", () => {
      resolve(true);
    });
  });

  await runPython;
  if (tagFilePath) {
    const tagCSV = fs.readFileSync(tagFilePath, "utf-8");
    // Parse the tags into an array from CSV: id,tag,category,count
    // For now, we just want the tags and category
    const tags = tagCSV
      .split("\n")
      .slice(1)
      .filter((line) => line !== "")
      .map((line) => ({
        label: line.split(",")[1].replaceAll("_", " "),
        category: Number(line.split(",")[2]),
      }))
      .filter((tag) => tag.label !== "");
    return { tags };
  }
  return { tags: [] };
});
