import * as THREE from "three";

export let elmVideo;
export let videoTexture;
let elmMainCanvas;
let renderTarget;
let videoMaterial, bgScene, bgCamera;

const videoShader = {
uniforms: {
  tVideo: {type: "t", value: null},
  // time: {value: 0}
}, vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`, fragmentShader: `
uniform sampler2D tVideo;
// uniform float time;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tVideo, vUv).rgb;
  
  // Example effect: grayscale
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  
  // Example effect: add some color tint
  vec3 tint = vec3(1.0, 0.8, 0.6);
  
  gl_FragColor = vec4(vec3(gray) * tint, 1.0);
}
`
}

export function initBgVideo(mainCanvas, videoUrl) {

  elmMainCanvas = mainCanvas;

  elmVideo = document.createElement('video');
  elmVideo.src = videoUrl;
  elmVideo.crossOrigin = "anonymous";
  elmVideo.loop = true;
  elmVideo.muted = true;
  void elmVideo.play();
  videoTexture = new THREE.VideoTexture(elmVideo);

  renderTarget = new THREE.WebGLRenderTarget(elmMainCanvas.clientWidth, elmMainCanvas.clientHeight, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat
  });

  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  videoMaterial = new THREE.ShaderMaterial(videoShader);
  const videoPlane = new THREE.Mesh(planeGeometry, videoMaterial);
  bgScene = new THREE.Scene();
  bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  bgCamera.position.z = 1;
  bgScene.add(videoPlane);
}

export function renderVideoToTx(renderer) {
  videoMaterial.uniforms.tVideo.value = videoTexture;
  const prevRenderTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(renderTarget);
  renderer.render(bgScene, bgCamera);
  renderer.setRenderTarget(prevRenderTarget);
  return renderTarget.texture;
}

export function updateBgVideoSize() {
  const w = elmMainCanvas.clientWidth;
  const h = elmMainCanvas.clientHeight
  bgCamera.aspect = w / h;
  bgCamera.updateProjectionMatrix();
  renderTarget.setSize(w, h);
}
