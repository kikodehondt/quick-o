/**
 * Generate a simple unique user ID using localStorage
 * This creates a persistent browser-based user identifier
 */
export function getOrCreateUserId(): string {
  const STORAGE_KEY = 'vocab_trainer_user_id'
  
  let userId = localStorage.getItem(STORAGE_KEY)
  
  if (!userId) {
    // Generate a simple UUID v4-like string
    userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    localStorage.setItem(STORAGE_KEY, userId)
  }
  
  return userId
}

/**
 * Clear the stored user ID (useful for testing)
 */
export function clearUserId(): void {
  localStorage.removeItem('vocab_trainer_user_id')
}
