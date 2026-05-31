// extension/build.js
// Bundles the extension source files for Chrome MV3

import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

const watch = process.argv.includes("--watch");

const sharedOptions = {
  bundle: true,
  format: "esm",
  target: "chrome120",
  outdir: "dist",
  minify: !watch,
};

// Copy static files to dist
function copyStatics() {
  fs.mkdirSync("dist", { recursive: true });
  fs.mkdirSync("dist/icons", { recursive: true });

  // manifest
  fs.copyFileSync("manifest.json", "dist/manifest.json");

  // popup HTML — rewrite script src to point to dist
  let html = fs.readFileSync("src/popup.html", "utf8");
  html = html.replace('src="popup.js"', 'src="popup.js"');
  fs.writeFileSync("dist/popup.html", html);

  // icons (generate simple SVG icons if PNGs don't exist)
  for (const size of [16, 48, 128]) {
    const iconPath = `icons/icon${size}.png`;
    const destPath = `dist/icons/icon${size}.png`;
    if (fs.existsSync(iconPath)) {
      fs.copyFileSync(iconPath, destPath);
    } else {
      // Write a placeholder SVG icon as PNG alternative
      // Real icons should be placed in extension/icons/
      const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#7c3aed"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${size * 0.55}" font-weight="bold" fill="white">L</text>
</svg>`;
      fs.writeFileSync(destPath.replace(".png", ".svg"), svgIcon);
      // Update manifest to use SVGs if PNGs are missing
    }
  }

  console.log("✓ Static files copied to dist/");
}

async function build() {
  copyStatics();

  const contexts = await Promise.all([
    esbuild.context({
      ...sharedOptions,
      entryPoints: ["src/background.js"],
      format: "esm",
    }),
    esbuild.context({
      ...sharedOptions,
      entryPoints: ["src/content.js"],
      format: "iife", // content scripts must be IIFE
    }),
    esbuild.context({
      ...sharedOptions,
      entryPoints: ["src/popup.js"],
      format: "esm",
    }),
  ]);

  if (watch) {
    await Promise.all(contexts.map(ctx => ctx.watch()));
    console.log("👀 Watching for changes…");
  } else {
    await Promise.all(contexts.map(ctx => ctx.rebuild().then(() => ctx.dispose())));
    console.log("✅ Extension built to dist/");
    console.log("   Load dist/ as an unpacked extension in chrome://extensions");
  }
}

build().catch(e => { console.error(e); process.exit(1); });
