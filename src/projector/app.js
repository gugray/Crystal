import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {OrbitControls} from "three/addons";
import {mulberry32, setRandomGenerator, rand, shuffle, randn_bm} from "./random.js";
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

function getSpiralPoints(btmAngle, btmRadius, climb) {
  const points = [];
  const nSegs = 200;
  const height = 10;
  for (let i = 0; i <= nSegs; ++i) {
    const t = i / nSegs; // [0, 1]
    // If climb is 1, two full twists. More climb means less twists.
    const twistAngle = t * 2 * Math.PI / climb;
    const x = btmRadius * Math.sin(btmAngle + twistAngle);
    const z = btmRadius * Math.cos(btmAngle + twistAngle);
    const y = (t - 0.5) * height;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

function buildScene() {

  group = new THREE.Group();
  scene.add(group);

  const mat = new THREE.MeshPhongMaterial({ color: "hsl(89,68%,33%)" });

  const addCurve = points => {
    const crCurve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(crCurve, 200, 0.05, 8, false);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  const nSpirals = 500;
  const avgRadius = 3;
  const radVar = 2;
  for (let i = 0; i < nSpirals; ++i) {
    const angle = 2 * Math.PI * rand();
    const btmRad = randn_bm(avgRadius - radVar, avgRadius + radVar);
    const climb = randn_bm(0.125, 4);
    const points = getSpiralPoints(angle, btmRad, climb);
    addCurve(points);
  }

  function makeDirLight(x, y, z, intensity) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(x, y, z);
    return light;
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight1 = makeDirLight(-10, 5, -10, 3);
  scene.add(dirLight1);

  const dirLight2 = makeDirLight(1, 10, 1, 3);
  scene.add(dirLight2);
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
  // group.rotation.set(0, time * 0.0002, 0, "XYZ");
  controls.update();
  composer.render();
  if (animating) requestAnimationFrame(frame);
}