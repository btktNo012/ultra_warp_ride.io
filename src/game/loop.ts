export function createTicker(cb: (dt: number, t: number) => void) {
  let raf = 0
  let last = performance.now()
  let t0 = last
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    cb(dt, (now - t0) / 1000)
    raf = requestAnimationFrame(tick)
  }
  return {
    start() {
      last = performance.now()
      t0 = last
      raf = requestAnimationFrame(tick)
    },
    stop() {
      cancelAnimationFrame(raf)
    },
  }
}

