import {Vector3} from "three";
import {rand, rand_range} from "./random.js";

const wallA = 1;
const wallB = 0.4;
const wallD = 0.4;

export const hedronCorners = [
  new Vector3(-0.4, 0, 0.4),
  new Vector3(0.4, 0, 0.4),
  new Vector3(0.4, 0, -0.4),
  new Vector3(-0.4, 0, -0.4),
];
export const hedronTips = [
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
];

export class Particle {

  constructor(pos, axis, cyclesPerLoop, cycleOfs) {
    this.orig = pos.clone();
    this.pos = pos.clone();
    this.axis = axis.clone();
    this.cyclesPerLoop = cyclesPerLoop;
    this.cycleOfs = cycleOfs;

    this.update(0);
  }

  update(msec) {
    const cycle = this.cycleOfs + this.cyclesPerLoop * msec * 0.0001;
    const animGain = Math.sin(cycle * 2 * Math.PI);
    this.pos = this.orig.clone().add(this.axis.clone().multiplyScalar(animGain));
  }
}

export function genRegularParticles(gap) {

  const res = []
  for (let y = -1.5 * gap; y <= 1.5 * gap; y += 1.5*gap) {
    const q = Math.abs(y);
    const xzGap = gap * Math.pow(2, q * 2);
    for (let x = 0; x <= 1; x += xzGap) {
      for (let z = 0; z <= 1; z += xzGap) {
        let animp = makeAnimParams(xzGap);
        let p = new Particle(new Vector3(x, y, z), ...animp);
        res.push(p);
        if (x != 0 && z != 0) {
          animp = makeAnimParams(xzGap);
          p = new Particle(new Vector3(-x, y, z), ...animp);
          res.push(p);
          animp = makeAnimParams(xzGap);
          p = new Particle(new Vector3(-x, y, -z), ...animp);
          res.push(p);
          animp = makeAnimParams(xzGap);
          p = new Particle(new Vector3(x, y, -z), ...animp);
          res.push(p);
        }
      }
    }
  }
  return res;

  function makeAnimParams(xzGap) {

    let axis;

    // let tilt = rand_range(20, 70);
    // tilt = tilt / 180 * Math.PI;
    // let rot = rand_range(0, 180);
    // rot = rot / 180 * Math.PI;
    // let ampl = rand_range(0.05, xzGap * 0.9);
    // axis = new Vector3(1, 0, 0);
    // axis.applyAxisAngle(new Vector3(0, 0, 1), tilt);
    // axis.applyAxisAngle(new Vector3(0, 1, 0), rot);
    // axis.multiplyScalar(ampl);

    axis = new Vector3(0, 0.1, 0);

    let cyclesPerLoop = 1;
    if (rand() < 0.5) cyclesPerLoop = 2;
    let cycleOfs = rand();
    return [axis, cyclesPerLoop, cycleOfs];
  }
}

export class Shard {

  constructor(data, displacement) {

    this.id = data.id;
    this.particlePos = data.particle;
    this.vertsRel = data.insetVertices;
    this.faceVerts = data.insetFaceVertIxs;
    this.offset = this.particlePos.clone();

    // Offset shards ("heave")
    if (displacement != 0) {
      const pnorm = this.particlePos.clone();
      pnorm.y = 0;
      pnorm.normalize();
      pnorm.multiplyScalar(0.05 * displacement);
      this.offset.add(pnorm);
      this.offset.y *=  (1 + 0.2 * displacement);
    }

    // Calculate all of this shard's surface triangles
    this.triVerts = calcTriangles(this.faceVerts, this.vertsRel);
  }

  makeWFLines(arr) {
    let nLines = 0;
    for (const fv of this.faceVerts) nLines += fv.length;
    const arrSz = nLines * 2 * 3;
    if (!arr || arr.length != arrSz) arr = new Float32Array(arrSz);
    let ix = 0;
    for (const indexes of this.faceVerts) {
      for (let i = 0; i < indexes.length; ++i) {
        const j = (i+1)%indexes.length;
        const v1 = this.vertsRel[indexes[i]];
        const v2 = this.vertsRel[indexes[j]];
        arr[ix++] = v1.x; arr[ix++] = v1.y; arr[ix++] = v1.z;
        arr[ix++] = v2.x; arr[ix++] = v2.y; arr[ix++] = v2.z;
      }
    }
    return arr;
  }
}

function calcTriangles(faceVerts, verts) {
  const triVerts = [];
  for (let faceIx = 0; faceIx < faceVerts.length; ++faceIx) {
    const indexes = faceVerts[faceIx];
    if (indexes.length == 3) {
      triVerts.push(verts[indexes[0]], verts[indexes[1]], verts[indexes[2]]);
      continue;
    }
    const center = calcCenter(verts, indexes);
    for (let i = 0; i < indexes.length; ++i) {
      const j = (i+1)%indexes.length;
      triVerts.push(center, verts[indexes[i]], verts[indexes[j]]);
    }
  }
  return triVerts;
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
    new WallPlane(new Vector3(-wallA, wallB, 0), wallD),
    new WallPlane(new Vector3(0, wallB, wallA), wallD),
    new WallPlane(new Vector3(0, -wallB, wallA), wallD),
    new WallPlane(new Vector3(0, -wallB, -wallA), wallD),
    new WallPlane(new Vector3(0, wallB, -wallA), wallD),
  ];
}

// export function genHedron(mod, volume, wallPlanes) {
//   const points = [new Vector3(0, 0, 0)];
//   const voro = genVoro(mod, volume, wallPlanes, points, 0);
//
//   const shard = new Shard(voro[0], 0);
//   console.log(shard);
// }

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