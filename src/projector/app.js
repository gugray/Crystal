import * as THREE from "three";
import {Vector3} from "three";
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

import {mulberry32, setRandomGenerator, rand, shuffle} from "./random.js";
import createVoroPP from "./voropp-module.js";
import {TK} from "./time.js";
import Audio from "./audio.js";
import {Graphics} from "./graphics.js";
import * as Sharder from "./sharder.js";
import * as Builder from "./bodyBuilder.js"
import {elmVideo} from "./bgVideo.js";
import {initReceiver} from "./receiver.js";
import {createParam, updateParams} from "./smoothParams.js";

const showEqualizer = false;
let animating = true;
let useShadow = true;

const particleGap = 0.2;
let renderMode = "shards-wf"; // boxes, shards, shards-wf, hedron, hedron-wf

const scaleFactor = createParam(1);
const yRotSpeed = createParam(0.0003);
const xRotSpeed = createParam(0);
const insetHeaveSpeed = 0.0009;
const insetBy = 0.02; // 0.01
const displaceHeaveSpeed = 0.0007;
const displaceBy = 3; // 3

const audioReactive = false;
const audioBeatThreshold = 20;
const audioDisplayFactor = 0.15;

let frameIx = 0;
let lastMsec = 0;

const palette = [
  "hsl(47, 95%, 16%)",
  "hsl(360, 100%, 39%)",
  "hsl(0, 100%, 50%)",
  "hsl(67, 91%, 27%)",
  "hsl(222, 87%, 74%)",
  "hsl(236, 17%, 81%)",
  "hsl(65, 96%, 19%)",
  "hsl(34, 100%, 49%)",
];

let seed = Math.round(Math.random() * 65535);
seed = 0;

/**
 * @type {Graphics}
 */
let G;
let voroMod;
let audio;
let elmCanvas, w, h;
let elmEq, elmFrameIx;

const volume = [-1, 1, -1, 1, -1, 1];
const walls = Sharder.genTetraWalls();

setTimeout(init, 50);

const model = {
  particles: [],
  yRot: 0,
  xRot: 0,
  insetHeave: 1,
  displaceHeave: 0,
};

const threeCache = {
  rootGroup: null,
  // For each shard: material, geometry, position array (for use if geo is buffer)
  bodies: [],
  // Hedron body
  hbody: {},
}

async function init() {

  console.log(`Seed: ${seed}`);
  setRandomGenerator(mulberry32(seed));

  voroMod = await createVoroPP();
  initReceiver(runCommand);

  audio = new Audio({ scale: 0.05, volSamples: 5 });
  audio.beat.threshold = audioBeatThreshold;
  setTimeout(() => {
    elmEq.querySelector("#beat .lamp").classList.remove("on");
  }, 1000);

  elmEq = document.getElementById("equalizer");
  if (showEqualizer) elmEq.classList.add("visible");
  elmFrameIx = document.getElementById("lblFrameIx");

  elmCanvas = document.getElementById("webgl-canvas");
  resizeCanvas();
  G = new Graphics(elmCanvas, "blurred-berries", true, false, useShadow);
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  document.getElementById("fullscreen").addEventListener("click", () => {
    void document.documentElement.requestFullscreen();
  });

  model.particles.push(...Sharder.genRegularParticles(particleGap));
  setParticleColors();
  console.log(`Particle count: ${model.particles.length}`);
  initScene();
  requestAnimationFrame(frame);
}

function initScene() {

  threeCache.rootGroup = new THREE.Group();
  G.scene.add(threeCache.rootGroup);

  clearGeosAndMaterials();

  const shadowMapSz = 1024;
  const shadowCamDim = 1;

  function makeDirLight(x, y, z, intensity) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(x, y, z);
    if (useShadow) {
      light.shadow.camera.top = shadowCamDim;
      light.shadow.camera.left = -shadowCamDim;
      light.shadow.camera.bottom = -shadowCamDim;
      light.shadow.camera.right = shadowCamDim;
      light.shadow.camera.near = 10;
      light.shadow.camera.far = 500;
      light.shadow.mapSize.set(shadowMapSz, shadowMapSz);
      light.shadow.radius = 0.1;
      light.castShadow = true;
    }
    return light;
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  G.scene.add(ambientLight);

  const dirLight1 = makeDirLight(-10, 5, 10, 3.8);
  G.scene.add(dirLight1);
  // G.scene.add(new THREE.CameraHelper(dirLight1.shadow.camera));

  const dirLight2 = makeDirLight(0, 10, -1, 1.6);
  G.scene.add(dirLight2);
  // G.scene.add(new THREE.CameraHelper(dirLight2.shadow.camera));
}

function clearGeosAndMaterials() {

  threeCache.bodies.forEach(body => {
    if (body.geo) body.geo.dispose();
    if (body.mat) body.mat.dispose();
  });
  threeCache.bodies.length = 0;
  for (let i = 0; i < model.particles.length; ++i) {
    threeCache.bodies.push({
      mat: null,
      geo: null,
      arr: null,
    });
  }

  if (threeCache.hbody.geo) threeCache.hbody.geo.dispose();
  if (threeCache.hbody.mat) threeCache.hbody.mat.dispose();
  threeCache.hbody = {
    mat: null,
    geo: null,
    arr: null,
  };
}

function rebuildBodies() {

  threeCache.rootGroup.clear();

  const points = [];
  model.particles.forEach(p => points.push(p.pos));
  const voro = Sharder.genVoro(voroMod, volume, walls, points, model.insetHeave * insetBy);

  const shards = [];
  for (const cellData of voro) {
    if (cellData.volume < 5e-6) continue;
    let displaceVal = model.displaceHeave * displaceBy;
    if (audioReactive) displaceVal += audioDisplayFactor * audio.volSmooth;
    const shard = new Sharder.Shard(cellData, displaceVal);
    shards.push(shard);
  }

  if (renderMode == "boxes")
    Builder.rebuildParticleBoxes(G, threeCache, model, shards)
  else if (renderMode == "shards")
    Builder.rebuildShardBodies(G, threeCache, model, shards)
  else if (renderMode == "shards-wf")
    Builder.rebuildShardWFBodies(G, threeCache, model, shards)
  else if (renderMode == "hedron")
    Builder.rebuildHedronSolid(G, threeCache, model);
  else if (renderMode == "hedron-wf")
    Builder.rebuildHedronWF(G, threeCache, model);
}

function setParticleColors() {

  // shuffle(palette);

  for (let i = 0; i < model.particles.length; ++i) {
    const p = model.particles[i];
    const colorHSLStr = palette[i%palette.length];
    p.color = new THREE.Color(colorHSLStr);
  }
}

function updateModel(elapsedMsec) {
  model.yRot += elapsedMsec * yRotSpeed.get();
  model.xRot += elapsedMsec * xRotSpeed.get();
  model.insetHeave = 0.1 + 0.45 * (Math.sin(TK.stable * insetHeaveSpeed) + 1);
  model.displaceHeave = 0.1 + 0.45 * (Math.sin(TK.stable * displaceHeaveSpeed) + 1);
  for (const p of model.particles) p.update(TK.stable);
}

function resizeCanvas() {

  // Resize WebGL canvas
  let elmWidth = window.innerWidth;
  let elmHeight = window.innerHeight;
  elmCanvas.style.width = elmWidth + "px";
  elmCanvas.style.height = elmHeight + "px";
  w = elmCanvas.width = Math.round(elmWidth);
  h = elmCanvas.height = Math.round(elmHeight);
  if (G) G.updateSize();
}

function updateEqualizer() {
  if (!showEqualizer) return;
  elmEq.querySelector("#vol .val").style.height = `${audio.vol}%`;
  elmEq.querySelector("#vol2 .val").style.height = `${audio.volSmooth}%`;
  elmEq.querySelector("#f0 .val").style.height = `${audio.fft[0]}%`;
  elmEq.querySelector("#f1 .val").style.height = `${audio.fft[1]}%`;
  elmEq.querySelector("#f2 .val").style.height = `${audio.fft[2]}%`;
  elmEq.querySelector("#f3 .val").style.height = `${audio.fft[3]}%`;
  if (audio.isBeat) elmEq.querySelector("#beat .lamp").classList.add("on");
  else elmEq.querySelector("#beat .lamp").classList.remove("on");
}

function frame(msec) {

  audio.tick();
  TK.rate1 = 0.5 + audio.vol / 20;
  TK.rate3 = 0.5 + audio.fft[3] / 20;
  TK.rate3 = 0.5 + audio.fft[3] / 20;

  let delta = msec - lastMsec;
  if (lastMsec != -1) {
    TK.addMsec(delta);
    updateParams(delta);
    updateModel(delta);
  }
  if (animating) lastMsec = msec;
  elmFrameIx.innerText = frameIx.toString();


  if (audioReactive && audio.isBeat) {
    // model.particles.length = 0;
    // model.particles.push(...Sharder.genRegularParticles(particleGap));
    // setParticleColors();
    clearGeosAndMaterials();
  }

  updateEqualizer();

  if (!G) return;
  rebuildBodies();

  G.render();

  if (animating) requestAnimationFrame(frame);
  ++frameIx;
}

const commandContext = {
  params: {
    scaleFactor: scaleFactor,
    yRotSpeed: yRotSpeed,
    xRotSpeed: xRotSpeed,
  },
  animating: function(val) {
    if (animating == val) return;
    animating = val;
    if (!animating) lastMsec = -1;
    if (animating) requestAnimationFrame(frame);
  },
  graphicsConfig: function(background, vignette, dither, useShadow) {
    G.config(background, vignette, dither, useShadow);
  },
  renderMode: function(mode) {
    if (renderMode == mode) return;
    renderMode = mode;
    clearGeosAndMaterials();
  }
};

function runCommand(cmd) {
  const evalCommand = new Function('ctxt', `with(ctxt) { ${cmd}; }`);
  evalCommand(commandContext);
}
