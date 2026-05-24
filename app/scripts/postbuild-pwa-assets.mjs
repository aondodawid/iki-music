import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const distDir = join(projectRoot, "dist");
const distAssetsDir = join(distDir, "assets");

mkdirSync(distAssetsDir, { recursive: true });

const filesToMirror = [
  "manifest.webmanifest",
  "favicon.svg",
  "favicon.ico",
  "icons.svg",
  "pwa-192x192.png",
  "pwa-512x512.png",
  "pwa-maskable.png",
  "screenshot-wide.png",
  "screenshot-mobile.png",
  "offline.html",
  "sw.js",
];

for (const filename of filesToMirror) {
  const sourcePath = join(distDir, filename);
  if (!existsSync(sourcePath)) {
    continue;
  }

  const destinationPath = join(distAssetsDir, filename);
  cpSync(sourcePath, destinationPath);
}
