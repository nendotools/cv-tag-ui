import { defineEventHandler, H3Event } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { path, result, replace } = await readBody(event);
  // validate path and result
  if (!fs.existsSync(path)) {
    setResponseStatus(event, 404);
    return { error: "invalid path" };
  }
  if (!fs.existsSync(result)) {
    setResponseStatus(event, 400);
    return { error: "invalid result" };
  }

  // handle discarding the result
  if (!replace) {
    fs.unlinkSync(result);
    return { success: true };
  } else {
    fs.unlinkSync(path);
    fs.renameSync(result, path);
  }
  return { success: true };
});
