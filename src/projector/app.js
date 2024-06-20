import * as THREE from "three";
import {mulberry32, rand, setRandomGenerator} from "./random.js";
import createVoroPP from "./voropp-module.js";
import {Graphics} from "./graphics.js";
import * as Sharder from "./sharder.js";

const animating = true;
const useShadow = true;
const rotSpeed = 0.0001;
const heaveSpeed = 0.0006;
const renderParticles = false;

let seed = Math.round(Math.random() * 65535);
// seed = 48923;

/**
 * @type {Graphics}
 */
let G;
let voroMod;
let elmCanvas, w, h;

setTimeout(init, 50);

const model = {
  particles: [],
  yRot: 0,
  heave: 1,
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
  model.particles.push(...Sharder.genRegularParticles(0.2));
  setParticleColors();
  console.log(`Particle count: ${model.particles.length}`);
  initWorld();
  requestAnimationFrame(frame);
}

function buildWorld() {

  clearTemporaryObjects();
  const rg = threeCache.rg;
  rg.rotation.set(0, model.yRot, 0);

  const walls = Sharder.genTetraWalls();
  const points = [];
  model.particles.forEach(p => points.push(p.pos));
  const voro = Sharder.genVoro(voroMod, [-1, 1, -1, 1, -1, 1], walls, points);

  const shards = [];
  for (const cellData of voro) {
    if (cellData.volume < 5e-6) continue;
    const shard = new Sharder.Shard(cellData, model.heave);
    shards.push(shard);
    shard.triVerts = [];
    shard.appendTriangles(shard.triVerts)
  }

  if (renderParticles) {
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
  else {
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

  threeCache.rg = new THREE.Group();
  G.scene.add(threeCache.rg);

  for (let i = 0; i < model.particles.length; ++i) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: model.particles[i].color,
      metalness: 0,
      roughness: 0,
      reflectivity: 0.5,
      sheen: 0,
      specularIntensity: 1,
      // transmission: 0.9,
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
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
    p.color = new THREE.Color();
    p.color.setHSL(hashToRandom(i), 0.77, 0.45);
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
  model.heave = 0.1 + 0.8 * (Math.sin(time * heaveSpeed) + 1);
  for (const p of model.particles) p.update(time);
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
  buildWorld();
  G.render();

  if (animating) requestAnimationFrame(frame);
}