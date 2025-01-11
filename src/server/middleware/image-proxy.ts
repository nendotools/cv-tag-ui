import { defineEventHandler, H3Event } from "h3";
import * as fs from "fs";

export default defineEventHandler((event: H3Event) => {
  if (event.node.req.url?.startsWith("/resource/")) {
    // handle the request by validating the target file exists, is a file, and is an image, then return the file
    const path = decodeURIComponent(
      event.node.req.url.replace("/resource", ""),
    );
    const isValid =
      fs.existsSync(path) &&
      fs.statSync(path).isFile() &&
      path.match(/\.(jpg|jpeg|png)$/i);
    if (!isValid) {
      setHeader(event, "Status", "404");
      return "File not found";
    }

    // load the file and return it as a response
    const file = fs.readFileSync(path);
    setHeader(event, "Content-Type", "image/jpeg");
    setHeader(event, "Content-Length", file.length);
    setHeader(event, "Cache-Control", "public, max-age=300");
    return file;
  }
});
