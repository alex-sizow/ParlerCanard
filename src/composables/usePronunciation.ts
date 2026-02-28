import { scoreColor } from '@/data/constants'

export interface WordResult {
  word: string
  expected: string
  score: number
  color: 'success' | 'warning' | 'danger'
}

function levenshtein (a: string, b: string): number {
  const [m, n] = [a.length, b.length]
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

const normalize = (text: string) =>
  text.toLowerCase().replace(/[.,!?;:'"«»\-—–()\[\]]/g, '').replace(/\s+/g, ' ').trim()

function similarity (a: string, b: string): number {
  if (a === b) return 100
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 100 : Math.round(((maxLen - levenshtein(a, b)) / maxLen) * 100)
}

export function analyzePronunciation (expected: string, actual: string) {
  const [normExpected, normActual] = [normalize(expected), normalize(actual)]
  const actualWords = normActual.split(' ')

  const wordResults: WordResult[] = normExpected.split(' ').map((expWord, i) => {
    const s = similarity(expWord, actualWords[i] ?? '')
    return { word: expWord, expected: expWord, score: s, color: scoreColor(s) }
  })

  const overallScore = similarity(normExpected, normActual)
  return { overallScore, overallColor: scoreColor(overallScore), wordResults }
}
