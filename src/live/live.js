animating(true);

animating(false);

// Play movie, no vignette, dither, no shadows
graphicsConfig("video", false, true, false);

// Blurred berries, vignette, no dither, shadows
graphicsConfig("blurred-berries", true, false, true);

// No BG, dither, shadows
graphicsConfig(null, false, true, true);

// boxes, shards, shards-wf, hedron, hedron-wf
renderMode("boxes");

renderMode("shards");

renderMode("shards-wf");

renderMode("hedron");

renderMode("hedron-wf");

params.yRotSpeed.lerpTo(0.0003, 15000);

params.xRotSpeed.lerpTo(0.0000, 5000);

params.scaleFactor.lerpTo(3, 5000);

params.scaleFactor.lerpTo(1, 1000);
