export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion & deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calculates how well a specific expected token matches within a larger body of extracted OCR text.
 * Uses a sliding window fuzzy match approach to handle noise on whiteboards.
 */
export function calculateTokenMatchScore(extractedText: string, expectedToken: string): number {
  const text = extractedText.toLowerCase().replace(/\s+/g, '');
  const token = expectedToken.toLowerCase().replace(/\s+/g, '');

  if (!text || !token) return 0;
  if (text.includes(token)) return 100;

  let maxScore = 0;
  const windowSize = token.length;
  for (let i = 0; i <= text.length - windowSize; i++) {
    const window = text.substring(i, i + windowSize);
    const score = ((windowSize - calculateLevenshteinDistance(window, token)) / windowSize) * 100;
    if (score > maxScore) maxScore = score;
  }
  return Math.round(maxScore * 100) / 100;
}

/**
 * Calculates overall similarity percentage between two full text extractions (Teacher vs Student OCR).
 */
export function calculateFullTextSimilarity(text1: string, text2: string): number {
  const t1 = text1.toLowerCase().replace(/\s+/g, '');
  const t2 = text2.toLowerCase().replace(/\s+/g, '');

  if (!t1 && !t2) return 100;
  if (!t1 || !t2) return 0;
  if (t1 === t2) return 100;

  const distance = calculateLevenshteinDistance(t1, t2);
  const maxLength = Math.max(t1.length, t2.length);
  return Math.round(((maxLength - distance) / maxLength) * 100 * 100) / 100;
}