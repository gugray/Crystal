import * as THREE from "three";
import {Vector3} from "three";
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

import {mulberry32, setRandomGenerator, rand, shuffle} from "./random.js";
import createVoroPP from "./voropp-module.js";
import Audio from "./audio.js";
import {Graphics} from "./graphics.js";
import * as Sharder from "./sharder.js";
import * as Builder from "./bodyBuilder.js"
import {elmVideo} from "./bgVideo.js";
import {initReceiver} from "./receiver.js";
import {createParam, updateParams} from "./smoothParams.js";

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

const director = {

  // Global options
  showEqualizer: false,
  animating: true,
  useShadow: true,
  particleGap: 0.2,
  renderMode: "shards-wf", // boxes, shards, shards-wf, hedron, hedron-wf

  // Audio config
  audioScale: 0.05,
  audioBeatThreshold: 20,

  // Control parameters
  scaleFactor: createParam(1),
  yRotSpeed: createParam(0.0003),
  xRotSpeed: createParam(0),
  insetHeaveSpeed: createParam(0.0009),
  insetHeaveGain: createParam(0.02), // 0.01
  displaceHeaveSpeed: createParam(0.0007),
  displaceHeaveGain: createParam(3), // 3
  displaceBeatVal: createParam(0),

  // Animation state
  scale: 0,
  yRotTime: 0,
  xRotTime: 0,
  insetHeaveTime: 0,
  insetVal: 0.01,
  displaceHeaveTime: 0,
  displaceVal: 1,
};

let updateAnimation = (director, audio, elapsedMsec, particles) => {
  const d = director;
  d.scale = d.scaleFactor.get();
  d.yRotTime += elapsedMsec * d.yRotSpeed.get();
  d.xRotTime += elapsedMsec * d.xRotSpeed.get();
  d.insetHeaveTime += elapsedMsec * d.insetHeaveSpeed.get();
  d.displaceHeaveTime += elapsedMsec * d.displaceHeaveSpeed.get();
  d.insetVal = d.insetHeaveGain.get() *
    (0.1 + 0.45 * (Math.sin(d.insetHeaveTime) + 1));
  d.displaceVal = d.displaceHeaveGain.get() *
    (0.1 + 0.45 * (Math.sin(d.displaceHeaveTime) + 1));
  // d.displaceVal += audio.volSmooth * .05;
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
  }
}

let seed = Math.round(Math.random() * 65535);
seed = 0;

const volume = [-1, 1, -1, 1, -1, 1];
const walls = Sharder.genTetraWalls();
const particles = [];

let G;
let voroMod;
let audio;
let elmCanvas, w, h;
let elmEq, elmFrameIx;

let frameIx = 0;
let lastMsec = 0;

setTimeout(init, 50);

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

  audio = new Audio({ scale: director.audioScale, volSamples: 5 });
  audio.beat.threshold = director.audioBeatThreshold;
  setTimeout(() => {
    elmEq.querySelector("#beat .lamp").classList.remove("on");
  }, 1000);

  elmEq = document.getElementById("equalizer");
  if (director.showEqualizer) elmEq.classList.add("visible");
  elmFrameIx = document.getElementById("lblFrameIx");

  elmCanvas = document.getElementById("webgl-canvas");
  resizeCanvas();
  G = new Graphics(elmCanvas, "blurred-berries", true, false, director.useShadow);
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  document.getElementById("fullscreen").addEventListener("click", () => {
    void document.documentElement.requestFullscreen();
  });

  particles.push(...Sharder.genRegularParticles(director.particleGap));
  setParticleColors();
  console.log(`Particle count: ${particles.length}`);
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
    if (director.useShadow) {
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
  for (let i = 0; i < particles.length; ++i) {
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
  particles.forEach(p => points.push(p.pos));
  const voro = Sharder.genVoro(voroMod, volume, walls, points, director.insetVal);

  const shards = [];
  for (const cellData of voro) {
    if (cellData.volume < 5e-6) continue;
    let displaceVal = director.displaceVal;
    const shard = new Sharder.Shard(cellData, displaceVal);
    shards.push(shard);
  }

  if (director.renderMode == "boxes")
    Builder.rebuildParticleBoxes(G, threeCache, director, particles, shards)
  else if (director.renderMode == "shards")
    Builder.rebuildShardBodies(G, threeCache, director, particles, shards)
  else if (director.renderMode == "shards-wf")
    Builder.rebuildShardWFBodies(G, threeCache, director, particles, shards)
  else if (director.renderMode == "hedron")
    Builder.rebuildHedronSolid(G, threeCache, director, particles);
  else if (director.renderMode == "hedron-wf")
    Builder.rebuildHedronWF(G, threeCache, director, particles);
}

function setParticleColors() {

  // shuffle(palette);

  for (let i = 0; i < particles.length; ++i) {
    const p = particles[i];
    const colorHSLStr = palette[i%palette.length];
    p.color = new THREE.Color(colorHSLStr);
  }
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
  if (!director.showEqualizer) return;
  elmEq.querySelector("#vol .val").style.height = `${audio.vol}%`;
  elmEq.querySelector("#vol2 .val").style.height = `${audio.volSmooth}%`;
  elmEq.querySelector("#f0 .val").style.height = `${audio.fft[0]}%`;
  elmEq.querySelector("#f1 .val").style.height = `${audio.fft[1]}%`;
  elmEq.querySelector("#f2 .val").style.height = `${audio.fft[2]}%`;
  elmEq.querySelector("#f3 .val").style.height = `${audio.fft[3]}%`;
  if (audio.isBeat) elmEq.querySelector("#beat .lamp").classList.add("on");
  else elmEq.querySelector("#beat .lamp").classList.remove("on");
}

let onBeat = (director, audio, particles) => {
  director.displaceBeatVal.set(audio.volSmooth * .05);
  director.displaceBeatVal.lerpTo(0, 500);
  // particles.length = 0;
  // particles.push(...Sharder.genRegularParticles(director.particleGap));
  // setParticleColors();
  // clearGeosAndMaterials();
}

function frame(msec) {

  audio.tick();

  let delta = msec - lastMsec;
  if (lastMsec != -1) {
    updateParams(delta);
    updateAnimation(director, audio, delta, particles);
    if (audio.isBeat) onBeat(director, audio, particles);
  }
  if (director.animating) lastMsec = msec;
  elmFrameIx.innerText = frameIx.toString();

  updateEqualizer();

  if (!G) return;
  rebuildBodies();

  G.render();

  if (director.animating) requestAnimationFrame(frame);
  ++frameIx;
}

const commandContext = {
  director: director,
  setShowEqualizer: function(val) {
    if (director.showEqualizer == val) return;
    director.showEqualizer = val;
    if (val) elmEq.classList.add("visible");
    else elmEq.classList.remove("visible");
  },
  audioConfig: function(scale, beatThreshold) {
    director.audioScale = scale;
    audio.setScale(director.audioScale);
    audio.beat.threshold = director.audioBeatThreshold = beatThreshold;
  },
  setAnimating: function(val) {
    if (director.animating == val) return;
    director.animating = val;
    if (!director.animating) lastMsec = -1;
    if (director.animating) requestAnimationFrame(frame);
  },
  graphicsConfig: function(background, vignette, dither, useShadow) {
    G.config(background, vignette, dither, useShadow);
    director.useShadow = useShadow;
  },
  setRenderMode: function(mode) {
    if (director.renderMode == mode) return;
    director.renderMode = mode;
    clearGeosAndMaterials();
  },
  setUpdateAnimation: function(fun) {
    updateAnimation = fun;
  },
  setOnBeat: function(fun) {
    onBeat = fun;
  },
};

function runCommand(cmd) {
  const evalCommand = new Function('ctxt', `with(ctxt) { ${cmd}; }`);
  evalCommand(commandContext);
}
