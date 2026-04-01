/**
 * Emoji Filter Utility
 * 
 * Removes all Unicode emoji characters from text strings
 * while preserving other formatting, punctuation, and special characters.
 */

/**
 * Regular expression to match all Unicode emoji characters
 * Uses \p{Emoji_Presentation} to match characters that are displayed as emojis
 * Also matches variation selectors, zero-width joiners, and skin tone modifiers
 * Includes common UI symbols like checkmarks and X marks
 */
const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}\u2713\u2714\u2715\u2716\u2717\u2718\u20E3]+/gu

/**
 * Removes all emoji characters from a string
 * 
 * @param text - The input text that may contain emojis
 * @returns The text with all emojis removed
 * 
 * @example
 * removeEmojis('Hello 👋 World') // Returns 'Hello  World'
 * removeEmojis('✅ Success!') // Returns ' Success!'
 * removeEmojis('📊 Statistics') // Returns ' Statistics'
 */
export function removeEmojis(text: string): string {
  if (!text) return text
  return text.replace(EMOJI_REGEX, '')
}

/**
 * Removes emojis from an object's string properties
 * 
 * @param obj - The object to process
 * @param keys - Array of property names to filter emojis from
 * @returns A new object with emojis removed from specified properties
 * 
 * @example
 * removeEmojisFromObject({ title: '📊 Stats', description: '⚠️ Warning' }, ['title', 'description'])
 * // Returns { title: ' Stats', description: ' Warning' }
 */
export function removeEmojisFromObject<T extends Record<string, any>>(
  obj: T,
  keys: Array<keyof T>
): T {
  const result = { ...obj }
  
  for (const key of keys) {
    const value = result[key]
    if (typeof value === 'string') {
      result[key] = removeEmojis(value) as any
    }
  }
  
  return result
}

/**
 * Removes emojis from all string properties of an object
 * Recursively processes nested objects and arrays
 * 
 * @param obj - The object to process
 * @returns A new object with emojis removed from all string properties
 */
export function removeEmojisFromAllStrings<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'string' ? removeEmojis(item) :
      typeof item === 'object' ? removeEmojisFromAllStrings(item) :
      item
    ) as T
  }
  
  if (typeof obj !== 'object') {
    return obj
  }
  
  const result = { ...obj }
  
  for (const key in result) {
    const value = result[key]
    if (typeof value === 'string') {
      result[key] = removeEmojis(value) as any
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? removeEmojis(item) :
        typeof item === 'object' && item !== null ? removeEmojisFromAllStrings(item) :
        item
      ) as any
    } else if (typeof value === 'object' && value !== null) {
      result[key] = removeEmojisFromAllStrings(value) as any
    }
  }
  
  return result
}
