import { defineEventHandler, H3Event, readFormData } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const formData = await readFormData(event);
  const path = String(formData.get("path"));
  const file = formData.get("file") as unknown as File;
  if (!path || !file) {
    setHeader(event, "Status", "400");
    return "Failed";
  }

  var isValid = false;
  const stats = fs.statSync(path);
  isValid = Boolean(stats.isFile() && path.match(/\.(jpg|jpeg|png|bmp)$/i));
  if (!isValid) {
    setHeader(event, "Status", "400");
    return "Failed";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path, buffer);
  setHeader(event, "Status", "201");
  return "success";
});
