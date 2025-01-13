import { defineEventHandler, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event) => {
  const { path } = await readBody(event);
  var isValid = false;

  if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
    isValid = true;

    fs.rmdirSync(path, { recursive: true });
  }

  setResponseStatus(event, isValid ? 200 : 400);
  setHeader(event, "Content-Type", "application/json");
  return {
    path,
    isValid,
  };
});
