export interface PitchPoint {
  time: number
  pitch: number
  clarity: number
}

const CLARITY_THRESHOLD = 0.8
const MIN_PITCH_HZ = 50
const MAX_PITCH_HZ = 600

let detector: ReturnType<typeof createDetector> | null = null

function createDetector (inputLength: number) {
  // Lazy dynamic import — pitchy is ESM-only
  let pitchDetector: import('pitchy').PitchDetector<Float32Array> | null = null
  const initPromise = import('pitchy').then(({ PitchDetector }) => {
    pitchDetector = PitchDetector.forFloat32Array(inputLength)
    pitchDetector.minVolumeDecibels = -30
  })

  return {
    initPromise,
    findPitch (input: Float32Array, sampleRate: number): [number, number] {
      if (!pitchDetector) return [0, 0]
      return pitchDetector.findPitch(input, sampleRate)
    },
    inputLength,
  }
}

export function startPitchTracking (
  analyserNode: AnalyserNode,
  sampleRate: number,
): { stop: () => PitchPoint[]; contour: PitchPoint[] } {
  const fftSize = analyserNode.fftSize

  if (!detector || detector.inputLength !== fftSize) {
    detector = createDetector(fftSize)
  }

  const contour: PitchPoint[] = []
  const input = new Float32Array(fftSize)
  const startedAt = performance.now()
  let animId: number | null = null
  let stopped = false

  function tick () {
    if (stopped) return

    analyserNode.getFloatTimeDomainData(input)
    const [pitch, clarity] = detector!.findPitch(input, sampleRate)

    if (clarity >= CLARITY_THRESHOLD && pitch >= MIN_PITCH_HZ && pitch <= MAX_PITCH_HZ) {
      contour.push({
        time: (performance.now() - startedAt) / 1000,
        pitch,
        clarity,
      })
    }

    animId = requestAnimationFrame(tick)
  }

  // Start after detector is initialized
  detector.initPromise.then(() => {
    if (!stopped) tick()
  })

  function stop (): PitchPoint[] {
    stopped = true
    if (animId !== null) cancelAnimationFrame(animId)
    return contour
  }

  return { stop, contour }
}

/**
 * Compare two pitch contours and return a similarity score 0-100.
 * Normalizes both contours to the same length, then computes
 * Pearson correlation between the pitch curves.
 */
export function comparePitchContours (
  reference: PitchPoint[],
  actual: PitchPoint[],
): number {
  if (reference.length < 3 || actual.length < 3) return 50 // Not enough data — neutral score

  const refPitches = resampleContour(reference, 50)
  const actPitches = resampleContour(actual, 50)

  const correlation = pearsonCorrelation(refPitches, actPitches)
  // correlation is -1 to 1, map to 0-100
  return Math.round(Math.max(0, Math.min(100, (correlation + 1) * 50)))
}

function resampleContour (contour: PitchPoint[], targetLength: number): number[] {
  const pitches = contour.map(p => p.pitch)
  if (pitches.length === targetLength) return pitches

  const result: number[] = []
  for (let i = 0; i < targetLength; i++) {
    const idx = (i / (targetLength - 1)) * (pitches.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(lo + 1, pitches.length - 1)
    const frac = idx - lo
    result.push(pitches[lo]! * (1 - frac) + pitches[hi]! * frac)
  }
  return result
}

function pearsonCorrelation (a: number[], b: number[]): number {
  const n = a.length
  if (n === 0) return 0

  let sumA = 0, sumB = 0
  for (let i = 0; i < n; i++) { sumA += a[i]!; sumB += b[i]! }
  const meanA = sumA / n, meanB = sumB / n

  let num = 0, denA = 0, denB = 0
  for (let i = 0; i < n; i++) {
    const dA = a[i]! - meanA, dB = b[i]! - meanB
    num += dA * dB
    denA += dA * dA
    denB += dB * dB
  }

  const den = Math.sqrt(denA * denB)
  return den === 0 ? 0 : num / den
}
