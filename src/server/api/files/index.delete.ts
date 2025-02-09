import { defineEventHandler, H3Event, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { path } = await readBody(event);
  var isValid = false;
  const stats = fs.statSync(path);
  isValid = stats.isFile() && path.match(/\.(jpg|jpeg|png|bmp)$/i);

  if (!isValid) {
    setHeader(event, "Status", "400");
    return "Failed";
  }

  fs.rmSync(path);
  const txtPath = path.replace(/\.(jpg|jpeg|png|bmp)$/i, ".txt");
  if (fs.existsSync(txtPath)) {
    fs.rmSync(txtPath);
  }
  const jsonPath = path.replace(/\.(jpg|jpeg|png|bmp)$/i, ".json");
  if (fs.existsSync(jsonPath)) {
    fs.rmSync(jsonPath);
  }

  setHeader(event, "Status", "200");
  return "success";
});
