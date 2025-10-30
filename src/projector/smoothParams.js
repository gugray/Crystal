
let lastMsec = 0;
const params = [];

class Animation {

  constructor(type, startVal, targetVal, durationMsec) {
    this.type = type;
    this.startVal = startVal;
    this.targetVal = targetVal;
    this.durationMsec = durationMsec;
    this.elapsedMsec = 0;
    this.currentVal = startVal;
  }

  timePassed(delta) {
    this.elapsedMsec += delta;
    if (this.elapsedMsec >= this.durationMsec) this.currentVal = this.targetVal;
    else {
      this.currentVal = this.startVal + (this.targetVal - this.startVal) * this.elapsedMsec / this.durationMsec;
    }
  }

  isFinished() {
    return this.elapsedMsec >= this.durationMsec;
  }
}

export class SmoothParam {

  constructor(value) {
    this.value = value;
    this.animation = null;
  }

  get() {
    if (!this.animation) return this.value;
    else return this.animation.currentVal;
  }

  set(value) {
    this.value = value;
    this.animation = null;
  }

  lerpTo(target, inMsec) {
    this.animation = new Animation("lerp", this.get(), target, inMsec);
  }

  timePassed(delta) {
    if (!this.animation) return;
    this.animation.timePassed(delta);
    if (this.animation.isFinished()) {
      this.value = this.animation.targetVal;
      this.animation = null;
    }
  }
}

export function createParam(value) {
  const param = new SmoothParam(value);
  params.push(param);
  return param;
}

export function updateParams(elapsedMsec) {
  for (const p of params) p.timePassed(elapsedMsec);
}

