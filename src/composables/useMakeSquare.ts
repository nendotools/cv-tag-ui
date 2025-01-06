export const useMakeSquare = () => {
  const makeSquare = (
    image: ImageFile,
    callback: (dataURI: string, image: ImageFile) => void,
  ) => {
    // load the image in a canvas, centered, expand the canvas to make it square and fill the rest with white
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (size - img.width) / 2, (size - img.height) / 2);

      callback(canvas.toDataURL("image/jpeg"), {
        ...image,
        dimensions: { width: size, height: size },
      });
    };

    img.src = image.resource;
  };

  return { makeSquare };
};
