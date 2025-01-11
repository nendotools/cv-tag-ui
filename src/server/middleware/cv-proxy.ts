import { defineEventHandler, H3Event } from "h3";

// need to benchmark
export default defineEventHandler(async (event: H3Event) => {
  if (event.node.req.url?.startsWith("/inferrence/")) {
    setHeader(event, "Cache-Control", "public, max-age=300");
    const path = decodeURIComponent(
      event.node.req.url.replace("/inferrence", ""),
    );

    // proxy requests to port 5000, where the python server is running
    return proxyRequest(event, `http://127.0.0.1:5000${path}`);
  }
});
