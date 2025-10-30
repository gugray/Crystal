import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {vignetteShader} from "./vignette-shader.js";
import {ditherShader} from "./dither-shader.js";
import {initBgVideo, renderVideoToTx, updateBgVideoSize, videoTexture} from "./bgVideo.js";

const initVideo = false;
const blurredBerriesUrl = "static/berries-blur.jpg";
let bgTxBlurredBerries;

export class Graphics {

  constructor(elmCanvas, background, vignette, dither, useShadow) {

    this.elmCanvas = elmCanvas;
    this.background = background;
    this.vignette = vignette;
    this.dither = dither;
    this.useShadow = useShadow;

    const loader = new THREE.TextureLoader();
    loader.load(blurredBerriesUrl, tx => bgTxBlurredBerries = tx);

    const ar = elmCanvas.clientWidth / elmCanvas.clientHeight;
    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.FogExp2(0xffffff, 0.095);
    this.camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);

    this.camPanGroup = new THREE.Group();
    this.camPanGroup.position.z = 2;
    this.camPanGroup.add(this.camera);
    this.camAltitudeGroup = new THREE.Group();
    this.camAltitudeGroup.add(this.camPanGroup);
    this.camAzimuthGroup = new THREE.Group();
    this.camAzimuthGroup.add(this.camAltitudeGroup);
    this.scene.add(this.camAzimuthGroup);

    this.renderer = new THREE.WebGLRenderer({
      canvas: elmCanvas,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    this.renderer.shadowMap.enabled = this.useShadow;
    // this.renderer.setPixelRatio(window.devicePixelRatio);

    this.rebuildComposer();

    if (initVideo) initBgVideo(elmCanvas, "/static/swing-sin.mp4");
  }

  rebuildComposer() {
    if (this.composer) this.composer.dispose();

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    if (this.vignette) {
      this.vignettePass = new ShaderPass(vignetteShader);
      this.vignettePass.uniforms["resolution"].value = new THREE.Vector2(
        this.elmCanvas.clientWidth,
        this.elmCanvas.clientHeight);
      this.vignettePass.uniforms["radius"].value = 1.4;
      this.vignettePass.uniforms["softness"].value = 0.5;
      this.vignettePass.uniforms["gain"].value = 0.95;
      this.composer.addPass(this.vignettePass);
    }

    if (this.dither) {
      this.ditherPass = new ShaderPass(ditherShader);
      this.composer.addPass(this.ditherPass);
    }

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  config(background, vignette, dither, useShadow) {
    this.background = background;
    this.vignette = vignette;
    this.dither = dither;
    this.useShadow = useShadow;
    this.rebuildComposer();
    this.renderer.shadowMap.enabled = this.useShadow;
  }

  updateSize() {
    const w = this.elmCanvas.clientWidth;
    const h = this.elmCanvas.clientHeight
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.vignettePass)
      this.vignettePass.uniforms["resolution"].value = new THREE.Vector2(w, h);

    if (initVideo) updateBgVideoSize();
  }

  getResolution(vec) {
    const w = this.elmCanvas.clientWidth;
    const h = this.elmCanvas.clientHeight
    vec.set(w, h);
  }

  render() {

    if (this.background == "video") {
      this.scene.background = renderVideoToTx(this.renderer);
    }
    else if (this.background == "blurred-berries") {
      this.scene.background = bgTxBlurredBerries;
      this.scene.backgroundIntensity = 0.04;
    }
    else {
      this.scene.background = null;
    }

    this.composer.render();
  }
}
