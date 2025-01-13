import { defineEventHandler, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event) => {
  const { path } = await readBody(event);
  var isValid = false;

  const parentDir = path.substring(0, path.lastIndexOf("/"));
  if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
    isValid = true;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  }

  setResponseStatus(event, isValid ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  return {
    path,
    isValid,
  };
});
