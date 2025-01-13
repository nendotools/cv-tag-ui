import { defineEventHandler, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event) => {
  const { path } = await readBody(event);
  var isValid = fs.statSync(path).isDirectory();

  const contents: string[] = [];
  const files = fs.readdirSync(path, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      contents.push(file.name);
    }
  }

  setResponseStatus(event, isValid ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return {
    path,
    isValid,
    innerDirectories: contents,
  };
});
