export function parseVocabText(text: string): { word1: string; word2: string }[] {
  // Split by ||| for different word pairs (supports sentences with commas, semicolons, etc.)
  const pairs = text.split('|||').map(pair => pair.trim()).filter(pair => pair.length > 0);
  
  const wordPairs: { word1: string; word2: string }[] = [];
  
  for (const pair of pairs) {
    // Use ONLY the first || to split word1 and word2
    const separatorIdx = pair.indexOf('||');
    if (separatorIdx === -1) continue;

    const left = pair.slice(0, separatorIdx).trim();
    const right = pair.slice(separatorIdx + 2).trim(); // +2 because || is 2 characters

    if (left && right) {
      // Check if right side has multiple alternatives separated by |
      const alternatives = right.split('|').map(alt => alt.trim()).filter(alt => alt.length > 0);
      
      // Create a word pair for each alternative
      for (const alternative of alternatives) {
        wordPairs.push({
          word1: left,
          word2: alternative
        });
      }
    }
  }
  
  return wordPairs;
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Normalize string for comparison
export function normalizeString(str: string, removeAccents = true, lowercase = true): string {
  let normalized = str.trim();
  
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }
  
  if (removeAccents) {
    // Remove accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  
  return normalized;
}

// Check if answer is correct
export function checkAnswer(
  userAnswer: string, 
  correctAnswer: string, 
  caseSensitive = false, 
  accentSensitive = false
): boolean {
  const normalizedUser = normalizeString(userAnswer, !accentSensitive, !caseSensitive);
  const normalizedCorrect = normalizeString(correctAnswer, !accentSensitive, !caseSensitive);
  
  return normalizedUser === normalizedCorrect;
}

// Calculate similarity percentage (for partial credit or hints)
export function calculateSimilarity(
  str1: string,
  str2: string,
  options?: { caseSensitive?: boolean; accentSensitive?: boolean }
): number {
  // If options provided, normalize inputs to match configured sensitivity
  const useCaseSensitive = options?.caseSensitive ?? true;
  const useAccentSensitive = options?.accentSensitive ?? true;

  const a = options
    ? normalizeString(str1, !useAccentSensitive, !useCaseSensitive)
    : str1;
  const b = options
    ? normalizeString(str2, !useAccentSensitive, !useCaseSensitive)
    : str2;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
