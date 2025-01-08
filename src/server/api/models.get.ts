import { defineEventHandler, H3Event } from "h3";
import { spawn } from "child_process";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { pythonUtilPath } = useRuntimeConfig(event);
  const pythonPath = `${pythonUtilPath}/venv/bin/python`;
  const pathArgs = ["--list-models"];

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

  const models: string[] = [];
  const runPython = new Promise((resolve) => {
    const cmdArr = [`${pythonUtilPath}/tag.py`, ...pathArgs];
    console.log("Running python script with args: ", cmdArr.join(" "));
    const py = spawn("python", cmdArr);
    py.stdout.on("data", (data: Buffer) => {
      models.push(
        ...String(data)
          .split("\n")
          .filter((model) => model.trim() !== ""),
      );
    });
    py.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });
    py.stdout.on("end", () => {
      resolve(true);
    });
  });

  await runPython;
  return { models };
});
