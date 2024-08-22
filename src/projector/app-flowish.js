import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {OrbitControls} from "three/addons";
import {mulberry32, setRandomGenerator, rand, shuffle} from "./random.js";
import {SimplexNoise} from "./simplex-noise.js";

const animating = true;
// "hsl(360, 100%, 39%)",

let simplex1;
let seed = Math.round(Math.random() * 65535);
// seed = 48923;

let elmCanvas, ar;
let scene, camera, renderer, composer, controls;
let group;

setTimeout(init, 50);

async function init() {

  console.log(`Seed: ${seed}`);
  setRandomGenerator(mulberry32(seed));
  simplex1 = new SimplexNoise(rand());

  elmCanvas = document.getElementById("webgl-canvas");
  initThree();
  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  document.getElementById("fullscreen").addEventListener("click", () => {
    void document.documentElement.requestFullscreen();
  });

  buildScene();
  requestAnimationFrame(frame);
}

function initThree() {

  ar = elmCanvas.clientWidth / elmCanvas.clientHeight;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);
  camera.position.set(0, 0, 15);

  renderer = new THREE.WebGLRenderer({
    canvas: elmCanvas,
    preserveDrawingBuffer: true,
  });
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
}

function calcPoints1() {
  const nSegs = 200;
  const points = [];
  for (let i = 0; i <= nSegs; ++i) {
    const t = i / nSegs;
    points.push(new THREE.Vector3(
      3 * Math.sin(4 * Math.PI * t),
      10 * t - 5,
      3 * Math.cos(4 * Math.PI * t)));
  }
  return points;
}

function calcPoints2(startX, startZ) {
  const points = [];
  const nSegs = 200;
  const height = 10;
  const mvGain = 10 / nSegs;
  const spiralGain = 10 / nSegs;
  const noiseFreq = 0.4;
  let x = startX, z = startZ;
  for (let i = 0; i <= nSegs; ++i) {
    const tt = 2 * (i / nSegs - 0.5); // [-1, 1]
    const y = height * tt * 0.5;
    points.push(new THREE.Vector3(x, y,z));
    const nx = x * noiseFreq, ny = y * noiseFreq, nz = z * noiseFreq;
    const angle = Math.PI * simplex1.noise3D(nx, ny, nz);
    x += spiralGain * Math.sin(2 * tt * Math.PI);
    z += spiralGain * Math.cos(2 * tt * Math.PI);
    x += mvGain * Math.sin(angle);
    z += mvGain * Math.cos(angle);
  }
  return points;
}

function buildScene() {

  group = new THREE.Group();
  scene.add(group);

  const mat = new THREE.MeshPhongMaterial({
    color: "hsl(360, 100%, 50%)",
  });

  const addCurve = (startX, startZ) => {
    const points = calcPoints2(startX, startZ);
    const crCurve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(crCurve, 200, 0.05, 8, false);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }
  for (let x = -2; x <= 2; x += 0.5) {
    for (let z = -2; z <= 2; z += 0.5) {
      addCurve(x, z);
    }
  }

  function makeDirLight(x, y, z, intensity) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(x, y, z);
    return light;
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight1 = makeDirLight(-10, 5, 10, 2);
  scene.add(dirLight1);

  const dirLight2 = makeDirLight(0, 10, -10, 2);
  scene.add(dirLight2);
}


function resizeCanvas() {

  // Resize WebGL canvas
  let elmWidth = window.innerWidth;
  let elmHeight = window.innerHeight;
  elmCanvas.style.width = elmWidth + "px";
  elmCanvas.style.height = elmHeight + "px";
  elmCanvas.width = Math.round(elmWidth * devicePixelRatio);
  elmCanvas.height = Math.round(elmHeight * devicePixelRatio);

  const w = elmCanvas.clientWidth;
  const h = elmCanvas.clientHeight;
  ar = w / h;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = ar;
  camera.updateProjectionMatrix();
}

function frame(time) {
  group.rotation.set(0, time * 0.0002, 0, "XYZ");
  controls.update();
  composer.render();
  if (animating) requestAnimationFrame(frame);
}