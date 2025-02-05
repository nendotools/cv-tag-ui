export const useMakeSquare = () => {
  const queue: Set<string> = new Set();
  const makeSquare = async (
    image: ImageFile,
    callback: (dataURI: string, image: ImageFile) => void,
  ) => {
    while (queue.size) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    queue.add(image.hash);

    // load the image in a canvas, centered, expand the canvas to make it square and fill the rest with white
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.width, img.height);
      const ratio = img.width / img.height;
      if (ratio > 1.2) {
        // 4:3
        canvas.width = size;
        canvas.height = Math.round(size * 0.75);
      } else if (ratio < 0.8) {
        // 3:4
        canvas.height = size;
        canvas.width = Math.round(size * 0.75);
      } else {
        // 1:1
        canvas.width = size;
        canvas.height = size;
      }

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        (canvas.width - img.width) / 2,
        (canvas.height - img.height) / 2,
      );

      callback(canvas.toDataURL("image/jpeg"), {
        ...image,
        dimensions: {
          width: canvas.width,
          height: canvas.height,
        },
      });
      // remove canvas and image from memory, remove from queue
      canvas.remove();
      queue.delete(image.hash);
    };

    img.src = image.resource;
  };

  // valid square ratios should either 1:1, 3:4, or 4:3
  const isSquare = (file: ImageFile) =>
    file.dimensions.width === file.dimensions.height ||
    (file.dimensions.width / file.dimensions.height).toFixed(2) === "0.75" ||
    (file.dimensions.width / file.dimensions.height).toFixed(2) === "1.33";

  const isPortrait = (file: ImageFile) =>
    file.dimensions.width < file.dimensions.height;
  const isLandscape = (file: ImageFile) =>
    file.dimensions.width > file.dimensions.height;

  const isSmall = (dimensions: { width: number; height: number }) => {
    return dimensions.width + dimensions.height < 513;
  };

  const isMedium = (dimensions: { width: number; height: number }) => {
    return dimensions.width + dimensions.height < 2048;
  };

  const isLarge = (dimensions: { width: number; height: number }) => {
    return dimensions.width + dimensions.height > 2047;
  };

  return {
    makeSquare,
    isLarge,
    isMedium,
    isSmall,
    isSquare,
    isPortrait,
    isLandscape,
  };
};
