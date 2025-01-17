import { spawn } from "child_process";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", () => {
    console.log('starting python server from request hook');
    // tie a python server to the app object
    let { app } = nitro as (typeof nitro & { app: { py: any } });
    if (!app) {
      app = { py: null };
      // force the app object to be global and force typescript to accept it
      (nitro as typeof nitro & { app: { py: any } }).app = app;
    }

    if (app.py) {
      return;
    }
    const pythonUtilPath = process.env.PYTHON_UTIL_PATH;
    const cmdArr = [`${pythonUtilPath}/app.py`];
    app.py = spawn(`python`, cmdArr);

    app.py.stdout.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    app.py.stderr.on("data", (data: Buffer) => {
      console.log(String(data));
    });

    app.py.stdout.on("end", () => {
      console.log("Python server closed");
    });
  });

  nitro.hooks.hook("close", () => {
    let { app } = nitro as (typeof nitro & { app: { py: any } });
    if (app && app?.py) {
      app.py.kill();
    }
  });
});
