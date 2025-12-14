export function parseVocabText(text: string): { dutch: string; french: string }[] {
  // Split by semicolon for different word pairs
  const pairs = text.split(';').map(pair => pair.trim()).filter(pair => pair.length > 0);
  
  const wordPairs: { dutch: string; french: string }[] = [];
  
  for (const pair of pairs) {
    // Split by comma to separate Dutch and French
    const parts = pair.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      wordPairs.push({
        dutch: parts[0],
        french: parts[1]
      });
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
