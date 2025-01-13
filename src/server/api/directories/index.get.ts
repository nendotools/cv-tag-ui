import { defineEventHandler, H3Event } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  let { path } = getQuery<{ path: string }>(event);
  path = decodeURIComponent(path);
  var isValid = false;
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    isValid = stats.isDirectory();
  });
  let [images, tags, scans] = [0, 0, 0];
  const files = fs.readdirSync(path);
  const imageFiles = files.filter((file) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(file));
  for (const file of imageFiles) {
    const fileBase = file.split(".")[0];
    images += 1;
    if (fs.existsSync(`${path}/${fileBase}.txt`)) {
      tags += 1;
    }
    if (fs.existsSync(`${path}/${fileBase}.json`)) {
      scans += 1;
    }
  }


  setHeader(event, "Status", isValid ? "200" : "400");
  setHeader(event, "Content-Type", "application/json");
  return {
    path,
    name: path.split("/").pop(),
    images,
    tags,
    scans,
  };
});
