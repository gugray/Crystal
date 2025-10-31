setShowEqualizer(true);

setShowEqualizer(false);

// Scale, beat threshold
audioConfig(0.05, 50);

setAnimating(true);

setAnimating(false);

// Play movie, no vignette, dither, no shadows
graphicsConfig("video", false, true, false);

// N movie, no vignette, dither, no shadows
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

director.displaceHeaveGain.lerpTo(3, 5000);

director.insetHeaveGain.lerpTo(0.02, 2000);

director.scaleFactor.set(2);

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
  // d.displaceVal += audio.volSmooth * .05;
  d.displaceVal += d.displaceBeatVal.get();
  for (const p of particles) {
    p.animTime += elapsedMsec * p.animSpeed * 0.0001;
    const animVal = Math.sin((p.animTime + p.animOfs) * 2 * Math.PI);
    p.pos = p.orig.clone().add(p.axis.clone().multiplyScalar(animVal));
  }
});

setOnBeat((director, audio, particles) => {
  director.displaceBeatVal.set(audio.volSmooth * .01);
  director.displaceBeatVal.lerpTo(0, 500);
  // particles.length = 0;
  // particles.push(...Sharder.genRegularParticles(director.particleGap));
  // setParticleColors();
  // clearGeosAndMaterials();
});
