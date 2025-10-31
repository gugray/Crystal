import * as THREE from "three";
import {LineSegmentsGeometry} from "three/addons/lines/LineSegmentsGeometry.js";
import {Vector3} from "three";
import {Line2} from "three/addons/lines/Line2.js";
import {LineMaterial} from "three/addons/lines/LineMaterial.js";
import * as Sharder from "./sharder.js";

const wfLineWidth = 3;
const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);

function makeSolidMaterial(color) {
  const mat = new THREE.MeshLambertMaterial({
    color: color,
    transparent: false,
    // opacity: 0.5,
    // blending: THREE.AdditiveBlending,
  });
  return mat;
}

function makeWFMaterial(color) {
  return new LineMaterial({
    color: color,
    linewidth: wfLineWidth,
  });
}
export function rebuildParticleBoxes(G, threeCache, director, particles, shards) {

  for (let i = 0; i < shards.length; ++i) {

    const shard = shards[i];
    const body = threeCache.bodies[shard.id];

    const sz = 0.05;
    if (!body.geo) {
      body.geo = new THREE.BoxGeometry(sz, sz, sz, 1, 1, 1);
    }

    if (!body.mat || body.mat.type != "MeshLambertMaterial")
      body.mat = makeSolidMaterial(particles[shard.id].color);

    const mesh = new THREE.Mesh(body.geo, body.mat);
    mesh.position.set(shard.offset.x, shard.offset.y, -shard.offset.z);
    mesh.position.applyAxisAngle(yAxis, director.yRotTime);
    mesh.position.applyAxisAngle(xAxis, director.xRotTime);
    if (director.useShadow) mesh.castShadow = mesh.receiveShadow = true;
    threeCache.rootGroup.add(mesh);
  }
}

function offsetShardVertexes(arr, offset, vec) {
  for (let i = 0; i < arr.length / 3; ++i) {
    vec.set(arr[3 * i], arr[3 * i + 1], arr[3 * i + 2]);
    vec.add(offset);
    arr[3*i] = vec.x;
    arr[3*i+1] = vec.y;
    arr[3*i+2] = vec.z;
  }
}

function rotateObject(arr, vec, director) {
  for (let i = 0; i < arr.length / 3; ++i) {
    vec.set(arr[3 * i], arr[3 * i + 1], arr[3 * i + 2]);
    vec.z = -vec.z;
    vec.applyAxisAngle(yAxis, director.yRotTime);
    vec.applyAxisAngle(xAxis, director.xRotTime);
    arr[3 * i] = vec.x;
    arr[3 * i + 1] = vec.y;
    arr[3 * i + 2] = vec.z;
  }
}

function scaleObject(arr, vec, scale) {
  for (let i = 0; i < arr.length / 3; ++i) {
    vec.set(arr[3 * i], arr[3 * i + 1], arr[3 * i + 2]);
    vec.multiplyScalar(scale);
    arr[3 * i] = vec.x;
    arr[3 * i + 1] = vec.y;
    arr[3 * i + 2] = vec.z;
  }
}

function updateBufferGeo(body) {
  const recreateGeo = !body.geo || body.geo.type != "BufferGeometry" ||
    body.geo.getAttribute("position").count != body.arr.length / 3;
  if (recreateGeo) {
    if (body.geo) body.geo.dispose();
    body.geo = new THREE.BufferGeometry();
  }

  const positionAttr = body.geo.getAttribute("position");
  if (!positionAttr) body.geo.setAttribute("position", new THREE.BufferAttribute(body.arr, 3));
  else {
    positionAttr.array.set(body.arr);
    positionAttr.needsUpdate = true;
  }
  body.geo.computeVertexNormals();
}

function updateLineSegmentGeo(body, vertexCountChanged) {
  const recreateGeo = vertexCountChanged || !body.geo || body.geo.type != "LineSegmentsGeometry";
  if (recreateGeo) {
    if (body.geo) body.geo.dispose();
    body.geo = new LineSegmentsGeometry();
  }

  const startAttr = body.geo.getAttribute('instanceStart');
  const endAttr = body.geo.getAttribute('instanceEnd');

  if (!startAttr || startAttr.array.length != body.arr.length) {
    body.geo.setPositions(body.arr);
  }
  else {
    for (let i = 0; i < body.arr.length; ++i) {
      startAttr.array[i] = body.arr[i];
      endAttr.array[i] = body.arr[i];
    }
    startAttr.needsUpdate = true;
    endAttr.needsUpdate = true;
  }
}

export function rebuildShardBodies(G, threeCache, director, particles, shards) {
  const vec = new Vector3();

  // Add shards
  for (let i = 0; i < shards.length; ++i) {

    const shard = shards[i];
    const body = threeCache.bodies[shard.id];

    const arrSz = shard.triVerts.length * 3;
    if (!body.arr || body.arr.length != arrSz)
      body.arr = new Float32Array(arrSz);

    for (let j = 0, ix = 0; j < shard.triVerts.length; ++j) {
      const v = shard.triVerts[j];
      body.arr[ix++] = v.x; body.arr[ix++] = v.y; body.arr[ix++] = v.z;
    }
    offsetShardVertexes(body.arr, shard.offset, vec);
    scaleObject(body.arr, vec, director.scale);
    rotateObject(body.arr, vec, director);

    updateBufferGeo(body);

    if (!body.mat || body.mat.type != "MeshLambertMaterial") {
      if (body.mat) body.mat.dispose();
      body.mat = makeSolidMaterial(particles[shard.id].color);
    }

    const mesh = new THREE.Mesh(body.geo, body.mat);
    if (director.useShadow) mesh.castShadow = mesh.receiveShadow = true;
    threeCache.rootGroup.add(mesh);
  }
}

export function rebuildShardWFBodies(G, threeCache, director, particles, shards) {
  const vec = new Vector3();
  const res = new Vector3();
  G.getResolution(res);

  // Add shards
  for (let i = 0; i < shards.length; ++i) {

    const shard = shards[i];
    const body = threeCache.bodies[shard.id];

    const oldArr = body.arr;
    body.arr = shard.makeWFLines(body.arr);

    // Offset, Z, rotate
    offsetShardVertexes(body.arr, shard.offset, vec);
    scaleObject(body.arr, vec, director.scale);
    rotateObject(body.arr, vec, director);

    updateLineSegmentGeo(body, !oldArr || oldArr.length != body.arr.length);

    if (!body.mat || body.mat.type != "LineMaterial")
      body.mat = makeWFMaterial(particles[shard.id].color);
    body.mat.color = particles[shard.id].color;
    body.mat.res = res;

    const mesh = new Line2(body.geo, body.mat);

    threeCache.rootGroup.add(mesh);
  }
}

export function rebuildHedronWF(G, threeCache, director, particles) {
  const vec = new Vector3();
  const res = new Vector3();
  G.getResolution(res);

  // Only one body
  const body = threeCache.hbody;

  // Add along middle corners
  const arrSz = 12 * 2 * 3;
  const oldArr = body.arr;
  if (!body.arr || body.arr.length != arrSz) body.arr = new Float32Array(arrSz);
  let ix = 0;
  for (let i = 0; i < 4; ++i) {
    const j = (i+1)%4;
    const v1 = Sharder.hedronCorners[i];
    const v2 = Sharder.hedronCorners[j];
    body.arr[ix++] = v1.x; body.arr[ix++] = v1.y; body.arr[ix++] = v1.z;
    body.arr[ix++] = v2.x; body.arr[ix++] = v2.y; body.arr[ix++] = v2.z;
    const t1 = Sharder.hedronTips[0];
    body.arr[ix++] = v1.x; body.arr[ix++] = v1.y; body.arr[ix++] = v1.z;
    body.arr[ix++] = t1.x; body.arr[ix++] = t1.y; body.arr[ix++] = t1.z;
    const t2 = Sharder.hedronTips[1];
    body.arr[ix++] = v1.x; body.arr[ix++] = v1.y; body.arr[ix++] = v1.z;
    body.arr[ix++] = t2.x; body.arr[ix++] = t2.y; body.arr[ix++] = t2.z;
  }

  // Rotate, invert z
  rotateObject(body.arr, vec, director);
  scaleObject(body.arr, vec, director.scale);

  updateLineSegmentGeo(body, !oldArr || oldArr.length != body.arr.length);

  if (!body.mat || body.mat.type != "LineMaterial")
    body.mat = makeWFMaterial(particles[1].color);
  body.mat.color = particles[1].color;
  body.mat.res = res;
  // Update color here if u want

  const mesh = new Line2(body.geo, body.mat);
  threeCache.rootGroup.add(mesh);
}

export function rebuildHedronSolid(G, threeCache, director, particles) {
  const vec = new Vector3();

  // Only one body
  const body = threeCache.hbody;

  // Four top and bottom triangles
  const arrSz = 8 * 3 * 3;
  if (!body.arr || body.arr.length != arrSz) body.arr = new Float32Array(arrSz);
  let ix = 0;
  for (let i = 0; i < 4; ++i) {
    const j = (i+1)%4;
    const v1 = Sharder.hedronCorners[i];
    const v2 = Sharder.hedronCorners[j];
    const t1 = Sharder.hedronTips[0];
    const t2 = Sharder.hedronTips[1];
    body.arr[ix++] = v2.x; body.arr[ix++] = v2.y; body.arr[ix++] = v2.z;
    body.arr[ix++] = v1.x; body.arr[ix++] = v1.y; body.arr[ix++] = v1.z;
    body.arr[ix++] = t1.x; body.arr[ix++] = t1.y; body.arr[ix++] = t1.z;
    body.arr[ix++] = t2.x; body.arr[ix++] = t2.y; body.arr[ix++] = t2.z;
    body.arr[ix++] = v1.x; body.arr[ix++] = v1.y; body.arr[ix++] = v1.z;
    body.arr[ix++] = v2.x; body.arr[ix++] = v2.y; body.arr[ix++] = v2.z;
  }
  // Rotate, invert z
  for (let i = 0; i < body.arr.length / 3; ++i) {
    vec.set(body.arr[3*i], body.arr[3*i+1], body.arr[3*i+2]);
    vec.z = -vec.z;
    vec.applyAxisAngle(yAxis, director.yRotTime);
    vec.applyAxisAngle(xAxis, director.xRotTime);
    body.arr[3*i] = vec.x;
    body.arr[3*i+1] = vec.y;
    body.arr[3*i+2] = vec.z;
  }
  scaleObject(body.arr, vec, director.scale);

  updateBufferGeo(body);

  if (!body.mat || body.mat.type != "MeshLambertMaterial")
    body.mat = makeSolidMaterial(particles[1].color);
  body.mat.color = particles[1].color;
  // Set color if you want

  const mesh = new THREE.Mesh(body.geo, body.mat);
  if (director.useShadow) mesh.castShadow = mesh.receiveShadow = true;
  threeCache.rootGroup.add(mesh);
}
