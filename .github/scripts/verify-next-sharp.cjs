const { createRequire } = require("node:module");
const { resolve } = require("node:path");

const packageRequire = createRequire(resolve(process.cwd(), "package.json"));
const { detectContentType, getSharp, optimizeImage } = packageRequire(
  "next/dist/server/image-optimizer",
);

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const verifyNextSharp = async () => {
  const sharp = getSharp(undefined);

  if (!sharp.versions.sharp.startsWith("0.35.")) {
    throw new Error(
      `Next loaded vulnerable sharp ${sharp.versions.sharp}; expected the secured 0.35.x resolution.`,
    );
  }

  const optimizedImage = await optimizeImage({
    buffer: onePixelPng,
    contentType: "image/png",
    quality: 75,
    width: 1,
  });
  const contentType = await detectContentType(optimizedImage);
  if (contentType !== "image/png") {
    throw new Error(
      `Next image optimization returned ${contentType ?? "an unknown format"} instead of image/png.`,
    );
  }
};

void verifyNextSharp().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
