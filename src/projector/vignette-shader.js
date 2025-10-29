// Vignette shader by Gabor L Ugray, 2024
// Based on the work of KAPITAN! http://kapitan.fi
// https://github.com/lmparppei/VignetteShader/blob/master/VignetteShader.js
// Based on the work of Matt DesLaurie's ShaderLessons and alteredq's sepia shader

import * as THREE from "three";

export const vignetteShader = {

  uniforms: {
    "tDiffuse": {type: "t", value: null},
    "resolution": {type: "v2", value: new THREE.Vector2()},
    "gain": {type: "f", value: 0.9},
    "radius": {type: "f", value: 0.75},
    "softness": {type: "f", value: 0.3},
  },

  vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,

  fragmentShader: `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float gain;
uniform float radius;
uniform float softness;
varying vec2 vUv;

void main() {
  vec3 clr = texture2D(tDiffuse, vUv).rgb;
  vec2 position = gl_FragCoord.xy / resolution.xy - vec2(1.);
  float len = length(position) * gain;
  gl_FragColor.rgb = clr * vec3(smoothstep(radius, radius - softness, len));
  gl_FragColor.a = 1.0;
}
`
};
