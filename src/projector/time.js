export class TimeKeeper {

  constructor() {
    this.stable = 0;
    this.t1 = 0;
    this.rate1 = 1;
    this.t2 = 0;
    this.rate2 = 1;
    this.t3 = 0;
    this.rate3 = 1;
  }

  addMsec(delta) {
    this.stable += delta;
    this.t1 += this.rate1 * delta;
    this.t2 += this.rate2 * delta;
    this.t3 += this.rate3 * delta;
  }
}

export const TK = new TimeKeeper();

