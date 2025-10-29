// Dither shader by Gabor L Ugray, 2025
//
// Based on the work of Chad Hillary: https://chadhillary.com/Projects/1bit.html
// https://github.com/chadxhillary/1bit-shader/blob/master/1-Bit%20Demo/customShaders.js
// Based on the work of Lucas Pope

export const ditherShader = {

  uniforms: {
    "tDiffuse": { type: "t", value: null },
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
varying vec2 vUv;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec3 color = texture2D( tDiffuse, vUv ).rgb;
  vec4 fragPos = gl_FragCoord;

  vec3 hsv = rgb2hsv(color);
  
  // Converting to less colors (grayscale) using Gamma formula
  float grey = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  grey = grey / 0.039;
  grey = floor(grey + 0.5);
  grey = grey * 0.039;

  // get dithering threshold
  int x = int(mod(fragPos.x, 32.0) / 4.0);
  int y = int(mod(fragPos.y, 32.0) / 4.0);

  // glsl doesen't let me use a matrix so we're gonna have to hard code
  int index = (x * 8) + y; // index of pseudomatrix
  float dither;

  if (index <= 0) dither = 0.0;
  if (index == 1) dither = 48.0;
  if (index == 2) dither = 12.0;
  if (index == 3) dither = 60.0;
  if (index == 4) dither = 3.0;
  if (index == 5) dither = 51.0;
  if (index == 6) dither = 15.0;
  if (index == 7) dither = 61.0;
  if (index == 8) dither = 32.0;
  if (index == 9) dither = 16.0;
  if (index == 10) dither = 44.0;
  if (index == 11) dither = 28.0;
  if (index == 12) dither = 35.0;
  if (index == 13) dither = 19.0;
  if (index == 14) dither = 47.0;
  if (index == 15) dither = 31.0;
  if (index == 16) dither = 8.0;
  if (index == 17) dither = 56.0;
  if (index == 18) dither = 4.0;
  if (index == 19) dither = 52.0;
  if (index == 20) dither = 11.0;
  if (index == 21) dither = 59.0;
  if (index == 22) dither = 7.0;
  if (index == 23) dither = 55.0;
  if (index == 24) dither = 40.0;
  if (index == 25) dither = 24.0;
  if (index == 26) dither = 36.0;
  if (index == 27) dither = 20.0;
  if (index == 28) dither = 43.0;
  if (index == 29) dither = 27.0;
  if (index == 30) dither = 39.0;
  if (index == 31) dither = 23.0;
  if (index == 32) dither = 2.0;
  if (index == 33) dither = 50.0;
  if (index == 34) dither = 14.0;
  if (index == 35) dither = 62.0;
  if (index == 36) dither = 1.0;
  if (index == 37) dither = 49.0;
  if (index == 38) dither = 13.0;
  if (index == 39) dither = 61.0;
  if (index == 40) dither = 34.0;
  if (index == 41) dither = 18.0;
  if (index == 42) dither = 46.0;
  if (index == 43) dither = 30.0;
  if (index == 44) dither = 33.0;
  if (index == 45) dither = 17.0;
  if (index == 46) dither = 45.0;
  if (index == 47) dither = 29.0;
  if (index == 48) dither = 10.0;
  if (index == 49) dither = 58.0;
  if (index == 50) dither = 6.0;
  if (index == 51) dither = 54.0;
  if (index == 52) dither = 9.0;
  if (index == 53) dither = 57.0;
  if (index == 54) dither = 5.0;
  if (index == 55) dither = 53.0;
  if (index == 56) dither = 42.0;
  if (index == 57) dither = 26.0;
  if (index == 58) dither = 38.0;
  if (index == 59) dither = 22.0;
  if (index == 60) dither = 41.0;
  if (index == 61) dither = 25.0;
  if (index == 62) dither = 37.0;
  if (index >= 63) dither = 21.0;

  dither *= (1.0 / 64.0); // matrix math

  // The Threshold
  gl_FragColor.a = 1.0;
  if(grey > dither) {
    // gl_FragColor.rgb = vec3(1.0); // White
    gl_FragColor.rgb = hsv2rgb(vec3(hsv[0], hsv[1] * 0.9, 1.0)); // Input color-ish
  }
  else
    gl_FragColor.rgb = vec3(0.0); // Black
  // gl_FragColor = vec4(0.17,0.25,0.09,1.0); //Dark Green
  // gl_FragColor = vec4(0.09,0.15,0.32,1.0); //Dark Blue
}
`
};
