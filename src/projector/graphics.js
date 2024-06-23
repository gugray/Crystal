import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {vignetteShader} from "./vignette-shader.js";
import {win} from "codemirror/src/util/dom.js";

export class Graphics {

  constructor(elmCanvas, useShadow) {

    const ar = elmCanvas.clientWidth / elmCanvas.clientHeight;

    this.elmCanvas = elmCanvas;
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
    this.renderer.autoClear = false;
    if (useShadow) this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.vignettePass = new ShaderPass(vignetteShader);
    this.vignettePass.uniforms[ "resolution" ].value = new THREE.Vector2(
      elmCanvas.clientWidth * window.devicePixelRatio,
      elmCanvas.clientHeight * window.devicePixelRatio);
    this.vignettePass.uniforms["radius"].value = 1.4;
    this.vignettePass.uniforms["softness"].value = 0.5;
    this.vignettePass.uniforms["gain"].value = 0.95;
    this.composer.addPass(this.vignettePass);
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

  }

  updateSize() {
    const w = this.elmCanvas.clientWidth;
    const h = this.elmCanvas.clientHeight
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.vignettePass.uniforms[ "resolution" ].value = new THREE.Vector2(w, h);
  }

  render() {
    this.composer.render();
  }
}
