export class RNG {
  private seed: number
  constructor(seed = Date.now() >>> 0) {
    this.seed = seed >>> 0
  }
  next(): number {
    // LCG (Numerical Recipes)
    this.seed = (1664525 * this.seed + 1013904223) >>> 0
    return this.seed / 0xffffffff
  }
  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
}

export const defaultRng = new RNG()

