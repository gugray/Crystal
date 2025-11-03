// ========================================================================
// Initial setup
// Calibrate audio
// Don't forget full screen :)
// In source code, start with:
// ========================================================================
graphicsConfig("blurred-berries", true, false, true);
setRenderMode("hedron-wf");
director.scaleFactor.set(0);

setShowEqualizer(true);

// Scale, beat threshold
// Scale bigger: less sensitive
audioConfig(0.1, 27);
audioConfig(0.1, 17);

setShowEqualizer(false);

// ========================================================================
// 01: Ease in WF hedron
// ========================================================================

director.scaleFactor.lerpTo(1, 40000);

director.xRotSpeed.lerpTo(0.0001, 5000);

director.xRotSpeed.lerpTo(0.0003, 5000);

director.scaleFactor.lerpTo(0, 10000);

director.xRotSpeed.set(0);
director.xRotTime = 0;

// ========================================================================
// 02: Fixed fracture
// ========================================================================

setRenderMode("shards-wf");
// 1: nice red
// 7: yello
director.uniformColorIx = 1;
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
  const d = director;
  d.scale = d.scaleFactor.get();
  d.yRotTime += elapsedMsec * d.yRotSpeed.get();
  d.xRotTime += elapsedMsec * d.xRotSpeed.get();
  d.insetHeaveTime += elapsedMsec * d.insetHeaveSpeed.get();
  d.displaceHeaveTime += elapsedMsec * d.displaceHeaveSpeed.get();
  // d.insetVal = d.insetHeaveGain.get() *
  //   (0.1 + 0.45 * (Math.sin(d.insetHeaveTime) + 1));
  // d.displaceVal = d.displaceHeaveGain.get() *
  //   (0.1 + 0.45 * (Math.sin(d.displaceHeaveTime) + 1));
  // d.displaceVal += audio.volSmooth * .05;
  d.insetVal = 0.01;
  d.displaceVal = 0.1;
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
    p.pos = p.orig.clone();
  }
});

// Bring it in
director.scaleFactor.lerpTo(1, 40000);

// Start to heave
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
  // d.insetVal = 0.01;
  // d.displaceVal = 0.1;
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
    p.pos = p.orig.clone();
  }
});


// Rotate if you want
director.xRotSpeed.lerpTo(0.0001, 5000);

director.xRotSpeed.lerpTo(0.0003, 5000);

// Edit animation updater for audioreactivity
// ...

// Play with color
director.uniformColorIx = 7;

// Make it disappear
director.scaleFactor.lerpTo(0, 10000);

director.xRotSpeed.set(0);
director.xRotTime = 0;


// ========================================================================
// 03: Heaving voro WF fracture
// ========================================================================

setRenderMode("shards-wf");
director.uniformColorIx = -1;
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
});

// Bring it in
director.scaleFactor.lerpTo(1, 40000);

// Play with audioreactivity
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
  // d.displaceVal += audio.volSmooth * .05; // Work up from here
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
  }
});

setOnBeat((director, audio, particles) => {
  director.displaceBeatVal.set(audio.volSmooth * .05);
  director.displaceBeatVal.lerpTo(0, 500);
  // director.yRotTime += .3;
  // if (rand() < 0.9) randomizeParticleVisibility(.6);
});

// Fun to be had ~~
// Beat displacement
// Volume displacement
// yRotTime jump
// Particle visibility
// Scale up
// Single shard mode

director.scaleFactor.lerpTo(5, 5000);

randomizeParticleVisibility(1);

// Make it disappear
director.scaleFactor.lerpTo(0, 10000);


// ========================================================================
// 04: Heaving voro solid fracture, dithered
// ========================================================================

graphicsConfig(null, false, true, true);
setRenderMode("shards");
director.uniformColorIx = -1;
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
});

setOnBeat((director, audio, particles) => {
  // director.displaceBeatVal.set(audio.volSmooth * .05);
  // director.displaceBeatVal.lerpTo(0, 800);
  // director.yRotTime += .3;
  // if (rand() < 0.9) randomizeParticleVisibility(.6);
});

// Bring it in
director.scaleFactor.lerpTo(1.2, 40000);

// Fun to be had ~~
// Beat displacement
// Volume displacement
// yRotTime jump
// Particle visibility
// Single shard mode

director.scaleFactor.lerpTo(5, 5000);

randomizeParticleVisibility(1);

// Make it disappear
director.scaleFactor.lerpTo(0, 10000);


// ========================================================================
// 05: Crystal watching dithered scary movie
// ========================================================================

graphicsConfig("video", false, true, false);
setRenderMode("shards");

setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
  // director.xOfs = -1.5 - audio.volSmooth * 0.01;
});

setOnBeat((director, audio, particles) => {
  // director.displaceBeatVal.set(audio.volSmooth * .05);
  // director.displaceBeatVal.lerpTo(0, 800);
  director.yRotTime += .3;
  // if (rand() < 0.9) randomizeParticleVisibility(.6);
  // director.scaleFactor.set(3);
  // director.scaleFactor.lerpTo(2, 500);
});

director.xOfs = -1.5;
// Bring it in
director.scaleFactor.lerpTo(1, 20000);

// Play around:
// Volume displacement
// Volume xOfs
// Partial visibility


// ====> WF mode, thick! Also close up, ...
setRenderMode("shards-wf");
director.wfLineWidth = 15;
director.xOfs = 0;
director.scaleFactor.lerpTo(2, 5000);

randomizeParticleVisibility(1);
director.wfLineWidth = 20;
director.scaleFactor.set(6);

// Make it disappear, cutting out video
graphicsConfig(null, false, true, false);
director.scaleFactor.lerpTo(0, 15000);

// Re-center
director.xOfs = 0;


// ========================================================================
// 06: Final, nice solid cutscene, boxes => shards
// ========================================================================

graphicsConfig("blurred-berries", true, false, true);
setRenderMode("boxes");
director.scaleFactor.set(0);
director.uniformColorIx = -1;

setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
});

// Bring it in
director.scaleFactor.lerpTo(1.5, 40000);

// Maybe rotate around x?
director.xRotSpeed.lerpTo(0.0003, 2000);

// Stop the X rotation (this is a rought one but NVM)
director.xRotSpeed.set(0);
director.xRotTime = 0;

// Switch to proper shards
setRenderMode("shards");

setOnBeat((director, audio, particles) => {
  // director.displaceBeatVal.set(audio.volSmooth * .05);
  // director.displaceBeatVal.lerpTo(0, 500);
  // director.yRotTime += .3;
  // if (rand() < 0.9) randomizeParticleVisibility(.6);
});

// Play, or wrap up
// Beat displacement
// Volume displacement
// yRotTime jump
// Particle visibility
// Scale up
// Single shard mode


// Play with audioreactivity
setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
  // d.displaceVal += audio.volSmooth * .05; // Work up from here
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
  }
});

setOnBeat((director, audio, particles) => {
  director.displaceBeatVal.set(audio.volSmooth * .05);
  director.displaceBeatVal.lerpTo(0, 500);
  // director.yRotTime += .3;
  // if (rand() < 0.9) randomizeParticleVisibility(.6);
});



// ========================================================================
// Misc fun, playing around, developing sketch
// ========================================================================

// Play movie, no vignette, dither, no shadows
graphicsConfig("video", false, true, false);

// No movie, no vignette, dither, no shadows
graphicsConfig(null, false, true, false);

// Blurred berries, vignette, no dither, shadows
graphicsConfig("blurred-berries", true, false, true);

// No BG, dither, shadows
graphicsConfig(null, false, true, true);

// boxes, shards, shards-wf, hedron, hedron-wf
setRenderMode("boxes");

setRenderMode("shards");

setRenderMode("shards-wf");

setRenderMode("hedron");

setRenderMode("hedron-wf");

director.yRotSpeed.lerpTo(0.0003, 5000);

director.xRotSpeed.lerpTo(0.0000, 5000);

director.xRotSpeed.set(0.0005);


director.displaceHeaveGain.lerpTo(3, 5000);

director.insetHeaveGain.lerpTo(0.02, 2000);

director.scaleFactor.set(3);

director.scaleFactor.lerpTo(3, 5000);

director.scaleFactor.lerpTo(1, 1000);

setUpdateAnimation((director, audio, elapsedMsec, particles) => {
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
  d.displaceVal += audio.volSmooth * .05;
  // d.insetVal = 0.01;
  // d.displaceVal = 0.1;
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
    // p.pos = p.orig.clone();
  }
});

setOnBeat((director, audio, particles) => {
  // director.displaceBeatVal.set(audio.volSmooth * .01);
  // director.displaceBeatVal.lerpTo(0, 500);
  if (rand() < 0.9) randomizeParticleVisibility(.6);
});

// 1: nice red
// 7: yello
director.uniformColorIx = -1;

director.displaceHeaveGain.set(1);

randomizeParticleVisibility(1);
director.scaleFactor.set(4);

randomizeParticleVisibility(-1);

advanceHedronColorIx();


randomizeParticleVisibility(1);

graphicsConfig("video", false, true, true);
setWFLineWidth(20);
director.yRotTime += .3;
director.scaleFactor.set(6);

randomizeParticleVisibility(-1);
graphicsConfig("video", false, true, true);
setRenderMode("shards");
director.scaleFactor.set(1.5);

director.scaleFactor.set(2);

director.xOfs = -1.5;




// ========================================================================
// Misc stuff, not needed normally
// ========================================================================
setAnimating(true);
setAnimating(false);


// ========================================================================
// Not committing during perf! Here to give me autocomplete lol
// ========================================================================
const director = {

  // Global options
  showEqualizer: false,
  animating: true,
  useShadow: true,
  particleGap: 0.2,
  renderMode: "hedron-wf", // boxes, shards, shards-wf, hedron, hedron-wf
  wfLineWidth: 3,

  // Audio config
  audioScale: 0.05,
  audioBeatThreshold: 20,

  // Control parameters
  scaleFactor: createParam(0),
  yRotSpeed: createParam(0.0003),
  xRotSpeed: createParam(0),
  insetHeaveSpeed: createParam(0.0009),
  insetHeaveGain: createParam(0.02), // 0.01
  displaceHeaveSpeed: createParam(0.0007),
  displaceHeaveGain: createParam(3), // 3
  displaceBeatVal: createParam(0),

  // Animation state
  xOfs: 0,
  scale: 1,
  yRotTime: 0,
  xRotTime: 0,
  insetHeaveTime: 0,
  insetVal: 0.01,
  displaceHeaveTime: 0,
  displaceVal: 1,
  hedronColorIx: 1,
  uniformColorIx: -1,
};

function randomizeParticleVisibility(nVisible) {}
function advanceHedronColorIx() {}
function setShowEqualizer(val) {}
function audioConfig(scale, beatThreshold) {}
function graphicsConfig(background, vignette, dither, useShadow) {}
function setRenderMode(mode) {}
function setWFLineWidth(val) {}
function setUpdateAnimation(fun) {}
function setOnBeat(fun) {}
