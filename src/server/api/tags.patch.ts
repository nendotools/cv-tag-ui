import { defineEventHandler, H3Event, readBody } from "h3";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { path, add, remove } = await readBody(event);
  if (!path) {
    setResponseStatus(event, 400);
    setResponseHeader(event, "Content-Type", "application/json");
    return { error: "No path provided" };
  }

  if (path instanceof Array) {
    for (const p of path) {
      const res = await editTags(event, p, add, remove);
      if (getResponseStatus(event) !== 200) {
        return { error: res };
      }
    }
  } else {
    const res = await editTags(event, path, add, remove);
    if (getResponseStatus(event) !== 200) {
      return { error: res };
    }
  }
});

const editTags = async (
  event: H3Event,
  path: string,
  add: string[],
  remove: string[],
) => {
  // load .txt file and .json file
  const txtPath = path.replace(/\.(jpg|jpeg|png|bmp)$/i, ".txt");
  const jsonPath = path.replace(/\.(jpg|jpeg|png|bmp)$/i, ".json");

  const txtExists = fs.existsSync(txtPath);
  const jsonExists = fs.existsSync(jsonPath);

  if (!txtExists) {
    setHeader(event, "Status", "400");
    return "No .txt file found";
  }
  const tags = new Set(
    fs
      .readFileSync(txtPath, "utf-8")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ""),
  );

  // This should actually be a non-fatal error, but we'll return a 400 status code for now
  if (!jsonExists) {
    setHeader(event, "Status", "400");
    return "No .json file found";
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // add tags should be added to the .txt file and high_tags in the .json file and removed from low_tags in the .json file
  for (const tag of add) {
    tags.add(tag);
    json.high[tag] = json.low[tag] ?? 0;
    delete json.low[tag];
  }
  // remove tags should be removed from the .txt file and high_tags in the .json file and added to low_tags in the .json file
  for (const tag of remove) {
    tags.delete(tag);
    json.low[tag] = json.high[tag] ?? 0;
    delete json.high[tag];
  }

  // write the updated tags to the .txt file
  fs.writeFileSync(txtPath, Array.from(tags).join(","));

  // write the updated tags to the .json file
  fs.writeFileSync(jsonPath, JSON.stringify(json));
};
