import { defineEventHandler, H3Event, readBody } from "h3";
import imageSize from "image-size";
import * as fs from "fs";

export default defineEventHandler(async (event: H3Event) => {
  const { path } = await readBody(event);
  var isValid = false;
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    isValid = stats.isDirectory();
  });
  console.log(`Fetching files from ${path}`);

  // format the files to be returned
  const files: Record<string, ImageFile> = {};
  const dFiles = fs.readdirSync(path, { withFileTypes: true });
  console.log("found files:", dFiles.length);
  for (const file of dFiles) {
    // skip directories and hidden files
    if (file.isDirectory() || file.name.startsWith(".")) {
      console.log(`Skipping ${file.name}`);
      continue;
    }

    // skip non-image and non-txt files
    if (!file.name.toLowerCase().match(/\.(jpg|jpeg|png|bmp|txt)$/)) {
      console.log(`Skipping ${file.name}`);
      continue;
    }

    const type = file.name.split(".").pop();
    const baseName = file.name.replace(/\.(jpg|jpeg|png|bmp|txt)$/i, "");
    const image: ImageFile = files[baseName] ?? {
      path: `${path}/${file.name}`,
      name: type === "txt" ? "" : file.name,
      dimensions: { width: 0, height: 0 },
      tags: [],
    };

    // parse the txt file as an array from CSV
    if (file.name.endsWith(".txt")) {
      const tags = fs.readFileSync(`${path}/${file.name}`, "utf-8").split(",");
      for (const tag of tags) {
        if (tag === "") {
          tags.splice(tags.indexOf(tag), 1);
        } else {
          tags[tags.indexOf(tag)] = tag.trim();
        }
      }
      image.tags = tags;
    } else {
      try {
        const dims = imageSize(`${path}/${file.name}`);
        image.dimensions = {
          width: dims.width || 0,
          height: dims.height || 0,
        };
      } catch (e) {
        image.dimensions = {
          width: 0,
          height: 0,
        };
      }
      image.resource = `/resource${path}/${file.name}`;
    }

    files[baseName] = image;
  }

  return {
    path,
    isValid,
    files: Object.values(files),
  };
});
