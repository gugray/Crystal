import * as THREE from "three";
import {mulberry32, rand, setRandomGenerator} from "./random.js";
import createVoroPP from "./voropp-module.js";
import {Graphics} from "./graphics.js";
import * as Sharder from "./sharder.js";

const animating = true;
const useShadow = true;
const rotSpeed = 0.0003;
const insetHeaveSpeed = 0.0009;
const insetBy = 0.01;
const displaceHeaveSpeed = 0.0007;
const displaceBy = 3;
const particleGap = 0.1;
const bgUrl = "static/berries-blur.jpg";
const renderMode = "solids"; // particles, solids

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
// seed = 48923;

/**
 * @type {Graphics}
 */
let G;
let voroMod;
let elmCanvas, w, h;

let volume = [-1, 1, -1, 1, -1, 1];
let walls;
let volumeTester;

setTimeout(init, 50);

const model = {
  particles: [],
  yRot: 0,
  insetHeave: 1,
  displaceHeave: 0,
};

const threeCache = {
  rg: null,
  materials: [],
  geos: [],
}

async function init() {

  console.log(`Seed: ${seed}`);
  setRandomGenerator(mulberry32(seed));
  voroMod = await createVoroPP();
  walls = Sharder.genTetraWalls();
  volumeTester = new Sharder.VolumeTester(voroMod, volume, walls);

  elmCanvas = document.getElementById("webgl-canvas");
  resizeCanvas();
  G = new Graphics(elmCanvas, useShadow);
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  document.getElementById("fullscreen").addEventListener("click", () => {
    void document.documentElement.requestFullscreen();
  });

  // model.particles.push(...Sharder.genRandomParticles(120));
  model.particles.push(...Sharder.genRegularParticles(particleGap));
  setParticleColors();
  console.log(`Particle count: ${model.particles.length}`);
  initWorld();
  requestAnimationFrame(frame);
}

function buildWorld() {

  clearTemporaryObjects();
  const rg = threeCache.rg;

  const points = [];
  model.particles.forEach(p => points.push(p.pos));
  const voro = Sharder.genVoro(voroMod, volume, walls, points, model.insetHeave * insetBy);

  const shards = [];
  for (const cellData of voro) {
    if (cellData.volume < 5e-6) continue;
    const shard = new Sharder.Shard(cellData, model.displaceHeave * displaceBy);
    shards.push(shard);
    shard.triVerts = [];
    shard.appendTriangles(shard.triVerts)
  }

  if (renderMode == "particles") {
    // Diag: Add particles as tiny cubes
    for (let i = 0; i < model.particles.length; ++i) {
      const p = model.particles[i];
      const sz = 0.05;
      const geo = new THREE.BoxGeometry(sz, sz, sz, 1, 1, 1);
      const mesh = new THREE.Mesh(geo, threeCache.materials[i]);
      mesh.position.set(p.pos.x, p.pos.y, p.pos.z);
      if (useShadow) {
        mesh.castShadow = mesh.receiveShadow = true;
      }
      rg.add(mesh);
      threeCache.geos.push(geo);
    }
  }
  else if (renderMode == "solids") {
    // Add shards
    for (const shard of shards) {
      const geo = new THREE.BufferGeometry();
      const vertBuf = new Float32Array(shard.triVerts.length * 3);
      for (let i = 0; i < shard.triVerts.length; ++i) {
        vertBuf[3 * i] = shard.triVerts[i].x;
        vertBuf[3 * i + 1] = shard.triVerts[i].y;
        vertBuf[3 * i + 2] = -shard.triVerts[i].z;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(vertBuf, 3));
      geo.computeVertexNormals();
      const mat = threeCache.materials[shard.id];
      const mesh = new THREE.Mesh(geo, mat);
      if (useShadow) {
        mesh.castShadow = mesh.receiveShadow = true;
      }
      rg.add(mesh);
      threeCache.geos.push(geo);
    }
  }
}

function clearTemporaryObjects() {
  threeCache.rg.clear();
  threeCache.geos.forEach(g => g.dispose());
  threeCache.geos.length = 0;
}

function initWorld() {

  const loader = new THREE.TextureLoader();
  loader.load(bgUrl, tx => {
    G.scene.background = tx;
    G.scene.backgroundIntensity = 0.04;
  });

  threeCache.rg = new THREE.Group();
  G.scene.add(threeCache.rg);

  for (let i = 0; i < model.particles.length; ++i) {
    // const mat = new THREE.MeshPhysicalMaterial({
    //   color: model.particles[i].color,
    //   metalness: 0,
    //   roughness: 0,
    //   reflectivity: 0.5,
    //   sheen: 0,
    //   specularIntensity: 1,
    //   // transmission: 0.9,
    // });
    const mat = new THREE.MeshLambertMaterial({
      color: model.particles[i].color,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    threeCache.materials.push(mat);
  }

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

function setParticleColors() {

  for (let i = 0; i < model.particles.length; ++i) {
    const p = model.particles[i];
    const colorHSLStr = palette[i%palette.length];
    p.color = new THREE.Color(colorHSLStr);
    // p.color = new THREE.Color();
    // p.color.setHSL(hashToRandom(i), 0.77, 0.45);
  }

  function hashToRandom(input) {
    // Ensure the input is a positive integer
    input = Math.floor(input);

    // Bitwise manipulation for hashing
    input = ((input >> 16) ^ input) * 0x45d9f3b;
    input = ((input >> 16) ^ input) * 0x45d9f3b;
    input = (input >> 16) ^ input;

    // Normalize the result to a number between 0 and 1
    return (input >>> 0) / 0xFFFFFFFF;
  }
}

function updateModel(time) {
  model.yRot = time * rotSpeed;
  model.insetHeave = 0.1 + 0.45 * (Math.sin(time * insetHeaveSpeed) + 1);
  model.displaceHeave = 0.1 + 0.45 * (Math.sin(time * displaceHeaveSpeed) + 1);
  for (const p of model.particles) p.update(time, volumeTester);
}

function resizeCanvas() {

  // Resize WebGL canvas
  let elmWidth = window.innerWidth;
  let elmHeight = window.innerHeight;
  elmCanvas.style.width = elmWidth + "px";
  elmCanvas.style.height = elmHeight + "px";
  w = elmCanvas.width = Math.round(elmWidth * devicePixelRatio);
  h = elmCanvas.height = Math.round(elmHeight * devicePixelRatio);
  if (G) G.updateSize();
}

function frame(time) {
  if (!G) return;
  updateModel(time);
  threeCache.rg.rotation.set(0, model.yRot, 0);
  buildWorld();
  G.render();

  if (animating) requestAnimationFrame(frame);
}