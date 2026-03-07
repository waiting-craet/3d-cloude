/**
 * Formats numbers for display in statistics
 * Numbers >= 10,000 are formatted with Chinese units (万)
 * 
 * @param num - The number to format
 * @returns Formatted string representation of the number
 * 
 * @example
 * formatNumber(1234)    // "1,234"
 * formatNumber(24000)   // "2.4万"
 * formatNumber(150000)  // "15万"
 * formatNumber(10000)   // "1万"
 * formatNumber(9999)    // "9,999"
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    const wan = num / 10000
    // Format with 1 decimal place if needed, remove trailing .0
    const formatted = (Math.round(wan * 10) / 10).toString()
    return `${formatted}万`
  }
  
  // Format with thousand separators for numbers < 10,000
  return num.toLocaleString('zh-CN')
}
