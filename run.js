import * as esbuild from "esbuild"
import glsl from "./glsl-plugin.js"
// import * as server from "./src/server.js"
import { livereloadPlugin } from "@jgoz/esbuild-plugin-livereload"

const composerPort = 8080;
const projectorPort = 8081;
const serverPort = 8090;

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

async function runComposer() {
  const entryPoints = [
    "src/composer/index.html",
    "src/composer/app.css",
    "src/composer/app.js",
    "src/composer/static/*",
  ];
  const plugins = [
    glsl(),
    livereloadPlugin({port: 53000}),
  ];
  const context = await esbuild.context({
    entryPoints: entryPoints,
    outdir: "public/composer",
    bundle: true,
    format: "esm",
    sourcemap: true,
    loader: {
      ".html": "copy",
      ".css": "copy",
      ".svg": "copy",
      ".aiff": "copy",
      ".woff2": "copy",
    },
    write: true,
    metafile: true,
    plugins: plugins,
  });

  await context.watch();
  await context.serve({port: composerPort});
  console.log(`Serving composer on port ${projectorPort}`);

  // If only building
  // await context.rebuild();
  // await context.dispose();
  // process.exit(0);
}

async function runProjector() {
  const entryPoints = [
    "src/projector/index.html",
    "src/projector/app.css",
    "src/projector/app.js",
    "src/projector/static/*"
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
      ".aiff": "copy",
      ".woff2": "copy",
      ".wasm": "copy",
    },
    write: true,
    metafile: true,
    plugins: plugins,
  });

  await context.watch();
  await context.serve({port: projectorPort});
  console.log(`Serving projector on port ${projectorPort}`);
}

// void server.run(serverPort);
// void runComposer();
void runProjector();

