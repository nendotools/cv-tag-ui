import { defineEventHandler, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event) => {
  const { path } = await readBody(event);
  var isValid = false;
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    isValid = stats.isDirectory();
  });

  const contents: string[] = [];
  const files = fs.readdirSync(path, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      contents.push(file.name);
    }
  }

  setHeader(event, "Status", isValid ? "200" : "400");
  return {
    path,
    isValid,
    innerDirectories: contents,
  };
});
