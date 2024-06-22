import {Vector3} from "three";
import {rand, rand_range} from "./random.js";

const wallA = 1;
const wallB = 0.4;
const wallD = 0.4;

export class Particle {

  constructor(pos) {
    this.pos = pos.clone();
    this.orig = pos.clone();
    this.velo = new Vector3();
  }

  update(time, volumeTester) {

    const particleRandomGain = 0.0001;

    this.pos.add(this.velo);
    if (volumeTester && !volumeTester.isPointInside(this.pos.x, this.pos.y, this.pos.z)) {
      this.pos.sub(this.velo);
      this.velo.set(0, 0, 0);
    }

    this.velo.x += particleRandomGain * (rand() - 0.5);
    this.velo.y += particleRandomGain * (rand() - 0.5);
    this.velo.z += particleRandomGain * (rand() - 0.5);
    const vec = this.pos.clone().sub(this.orig);
    const dist = vec.length();
    vec.normalize();
    vec.multiplyScalar(Math.pow(dist, 6));
    this.velo.sub(vec);
    if (this.velo.length() > 0.0001) this.velo.multiplyScalar(0.999);
  }
}

export function genRandomParticles(count) {

  const res = []
  let i = 0;
  while (i < count) {
    const x = genVal();
    const z = genVal();
    let y = rand();
    y = Math.pow(y, 3);
    if (rand() < 0.5) y *= -1;
    y *= 0.5;
    const pos = new Vector3(x, y, z);
    res.push(new Particle(pos));
    ++i;
  }
  return res;

  function genVal() {
    let val = rand_range(-1, 1);
    val = Math.round(val * 100) / 100;
    return val;
  }
}

export function genRegularParticles(gap) {

  const res = []
  for (let y = -1; y <= 1; y += gap) {
    const q = Math.abs(y);
    const xzGap = gap * Math.pow(2, q * 2);
    for (let x = 0; x <= 1; x += xzGap) {
      for (let z = 0; z <= 1; z += xzGap) {
        let p = new Particle(new Vector3(x, y, z));
        rndMove(p, xzGap);
        res.push(p);
        if (x != 0 && z != 0) {
          p = new Particle(new Vector3(-x, y, z));
          rndMove(p, xzGap);
          res.push(p);
          p = new Particle(new Vector3(-x, y, -z));
          rndMove(p, xzGap);
          res.push(p);
          p = new Particle(new Vector3(x, y, -z));
          rndMove(p, xzGap);
          res.push(p);
        }
      }
    }
  }
  return res;

  function rndMove(part, gain) {
    const mul = 0.2;
    part.pos.x += mul * gain * (rand() - 0.5);
    part.pos.y += mul * (rand() - 0.5);
    part.pos.z += mul * (rand() - 0.5);
  }
}

export class Shard {

  constructor(data, displacement) {

    this.id = data.id;
    this.particle = data.particle;
    this.vertsRel = data.insetVertices;
    this.vertsAbs = [];
    this.faceVerts = data.insetFaceVertIxs;

    // Offset shards ("heave")
    if (displacement != 0) {
      const pnorm = this.particle.clone();
      pnorm.y = 0;
      pnorm.normalize();
      pnorm.multiplyScalar(0.05 * displacement);
      this.particle.add(pnorm);
      this.particle.y *= (1 + 0.2 * displacement);
      // this.particle.multiplyScalar(1.3);
    }

    // Calculate absolute vertex positiions
    this.vertsRel.forEach(v => this.vertsAbs.push(v.clone().add(this.particle)));
  }

  getFacePts(faceIx) {
    const vertIxs = this.faceVerts[faceIx];
    const res = [];
    for (const vertIx of vertIxs) {
      res.push(this.vertsAbs[vertIx].clone());
    }
    return res;
  }

  appendTriangles(triVerts) {
    for (let faceIx = 0; faceIx < this.faceVerts.length; ++faceIx) {
      const indexes = this.faceVerts[faceIx];
      if (indexes.length == 3) {
        triVerts.push(this.vertsAbs[indexes[0]], this.vertsAbs[indexes[1]], this.vertsAbs[indexes[2]]);
        continue;
      }
      const center = calcCenter(this.vertsAbs, indexes);
      for (let i = 0; i < indexes.length; ++i) {
        const j = (i+1)%indexes.length;
        triVerts.push(center, this.vertsAbs[indexes[i]], this.vertsAbs[indexes[j]]);
      }
    }
  }
}

function calcCenter(verts, indexes) {
  const v = verts[indexes[0]].clone();
  for (let i = 1; i < indexes.length; ++i)
    v.add(verts[indexes[i]]);
  return v.multiplyScalar(1 / indexes.length);
}

export class WallPlane {
  constructor(norm, displacement) {
    this.norm = norm;
    this.displacement = displacement;
  }
}

export class CellData {
  constructor(id, particle, volume, vertices, faceVertIxs, insetVertices, insetFaceVertIxs) {
    this.id = id;
    this.particle = particle;
    this.volume = volume;
    this.vertices = vertices;
    this.faceVertIxs = faceVertIxs;
    this.insetVertices = insetVertices;
    this.insetFaceVertIxs = insetFaceVertIxs;
  }
}

export function genTetraWalls() {
  return [
    new WallPlane(new Vector3(wallA, wallB, 0), wallD),
    new WallPlane(new Vector3(wallA, -wallB, 0), wallD),
    new WallPlane(new Vector3(-wallA, -wallB, 0), wallD),
    new WallPlane(new Vector3(-wallA, wallB, 0, wallD), wallD),
    new WallPlane(new Vector3(0, wallB, wallA), wallD),
    new WallPlane(new Vector3(0, -wallB, wallA), wallD),
    new WallPlane(new Vector3(0, -wallB, -wallA), wallD),
    new WallPlane(new Vector3(0, wallB, -wallA), wallD),
  ];
}

export function genVoro(mod, volume, wallPlanes, particles, insetBy) {

  const cellDataArr = [];

  const szInput =
    6 + // Space bounds
    1 + wallPlanes.length * 4 + // Wall planes
    1 + particles.length * 4; // Particles

  const pInput = mod._malloc(szInput * 8);
  const input = new Float64Array(mod.HEAPU8.buffer, pInput, szInput);
  let ip = 0;
  for (let i = 0; i < 6; ++i)
    input[ip++] = volume[i];

  input[ip++] = wallPlanes.length;
  for (let i = 0; i < wallPlanes.length; ++i) {
    input[ip++] = wallPlanes[i].norm.x;
    input[ip++] = wallPlanes[i].norm.y;
    input[ip++] = wallPlanes[i].norm.z;
    input[ip++] = wallPlanes[i].displacement;
  }

  input[ip++] = particles.length;
  for (let i = 0; i < particles.length; ++i) {
    input[ip++] = i;
    input[ip++] = particles[i].x;
    input[ip++] = particles[i].y;
    input[ip++] = particles[i].z;
  }

  const pRes = mod._calculate_voronoi(pInput, insetBy);
  const dummyArr = new Float64Array(mod.HEAPU8.buffer, pRes, 1);
  const resSize = dummyArr[0];
  const resArr = new Float64Array(mod.HEAPU8.buffer, pRes, resSize);
  let nCells = resArr[1];
  let pos = 2;

  for (let cix = 0; cix < nCells; ++cix) {

    const id = resArr[pos++];
    const particle = new Vector3(resArr[pos++], resArr[pos++], resArr[pos++]);
    const volume = resArr[pos++];

    const vertices = [];
    const faceVertIxs = [];

    const nVerts = resArr[pos++];
    for (let i = 0; i < nVerts; ++i) {
      vertices.push(new Vector3(resArr[pos++], resArr[pos++], resArr[pos++]));
    }

    let nFaces = resArr[pos++];
    while (nFaces > 0) {
      --nFaces;
      let nVertsInFace = resArr[pos++];
      const vertIxs = [];
      while (nVertsInFace > 0) {
        --nVertsInFace;
        vertIxs.push(resArr[pos++]);
      }
      faceVertIxs.push(vertIxs);
    }

    const insetVertices = [];
    const insetFaceVertIxs = [];
    const nInsetVerts = resArr[pos++];
    if (nInsetVerts == 0) {
      insetVertices.push(...vertices);
      insetFaceVertIxs.push(...faceVertIxs);
    }
    else {
      for (let i = 0; i < nInsetVerts; ++i) {
        insetVertices.push(new Vector3(resArr[pos++], resArr[pos++], resArr[pos++]));
      }
      let nFaces = resArr[pos++];
      while (nFaces > 0) {
        --nFaces;
        let nVertsInFace = resArr[pos++];
        const vertIxs = [];
        while (nVertsInFace > 0) {
          --nVertsInFace;
          vertIxs.push(resArr[pos++]);
        }
        insetFaceVertIxs.push(vertIxs);
      }
    }

    cellDataArr.push(new CellData(id, particle, volume, vertices, faceVertIxs, insetVertices, insetFaceVertIxs));
  }

  mod._free(pRes);
  mod._free(pInput);

  return cellDataArr;
}

export class VolumeTester {

  constructor(mod, volume, wallPlanes) {
    this.mod = mod;

    const szInput =
      6 + // Space bounds
      1 + wallPlanes.length * 4; // Wall planes
    const pInput = mod._malloc(szInput * 8);
    const input = new Float64Array(mod.HEAPU8.buffer, pInput, szInput);
    let ip = 0;
    for (let i = 0; i < 6; ++i)
      input[ip++] = volume[i];
    input[ip++] = wallPlanes.length;
    for (let i = 0; i < wallPlanes.length; ++i) {
      input[ip++] = wallPlanes[i].norm.x;
      input[ip++] = wallPlanes[i].norm.y;
      input[ip++] = wallPlanes[i].norm.z;
      input[ip++] = wallPlanes[i].displacement;
    }
    this.pTester = this.mod._create_volume_tester(pInput)
    this.mod._free(pInput);
  }

  dispose() {
    this.mod._delete_volume_tester(this.pTester);
  }

  isPointInside(x, y, z) {
    return this.mod._is_point_inside(this.pTester, x, y, z);
  }
}