import { spawn } from "child_process";

let py: any;
export default defineNitroPlugin(() => {
  if (py) {
    py.kill();
  }
  const pythonUtilPath = process.env.PYTHON_UTIL_PATH;
  const cmdArr = [`${pythonUtilPath}/app.py`];
  py = spawn(`python`, cmdArr);

  py.stdout.on("data", (data: Buffer) => {
    console.log(String(data));
  });

  py.stderr.on("data", (data: Buffer) => {
    console.log(String(data));
  });

  py.stdout.on("end", () => {
    console.log("Python server closed");
  });
});
