import { defineEventHandler, H3Event } from "h3";

export default defineEventHandler((event: H3Event) => {
  if (event.node.req.url?.startsWith("/inferrence/")) {
    // handle the request by validating the target file exists, is a file, and is an image, then return the file
    const path = decodeURIComponent(
      event.node.req.url.replace("/inferrence", ""),
    );

    // proxy requests to port 5000, where the python server is running
    return proxyRequest(event, `http://127.0.0.1:5000${path}`);
  }
});
