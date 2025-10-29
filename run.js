import * as esbuild from "esbuild"
import glsl from "./glsl-plugin.js"
import { livereloadPlugin } from "@jgoz/esbuild-plugin-livereload"

const projectorPort = 8081;

const args = (argList => {
  let res = {};
  let opt, thisOpt, curOpt;
  for (let i = 0; i < argList.length; i++) {
    thisOpt = argList[i].trim();
    opt = thisOpt.replace(/^\-+/, "");
    if (opt === thisOpt) {
      // argument value
      if (curOpt) res[curOpt] = opt;
      curOpt = null;
    } else {
      // argument name
      curOpt = opt;
      res[curOpt] = true;
    }
  }
  return res;
})(process.argv);


async function runProjector() {
  const entryPoints = [
    "src/projector/app.css",
    "src/projector/app.js",
    "src/projector/index.html",
    "src/projector/voropp-module.wasm",
    "src/projector/static/*",
  ];
  const plugins = [
    glsl(),
    livereloadPlugin({port: 53001}),
  ];
  const context = await esbuild.context({
    entryPoints: entryPoints,
    outdir: "public/projector",
    bundle: true,
    format: "esm",
    sourcemap: true,
    loader: {
      ".html": "copy",
      ".css": "copy",
      ".svg": "copy",
      ".jpg": "copy",
      ".aiff": "copy",
      ".woff2": "copy",
      ".wasm": "copy",
      ".mp4": "copy",
    },
    write: true,
    metafile: true,
    plugins: plugins,
  });

  await context.watch();
  await context.serve({port: projectorPort});
  console.log(`Serving projector on port ${projectorPort}`);
}

void runProjector();

