// 搜索结果高亮工具函数

export interface HighlightOptions {
  caseSensitive?: boolean
  wholeWords?: boolean
  maxHighlights?: number
  highlightClass?: string
}

export interface SearchMatch {
  text: string
  isMatch: boolean
  index: number
}

/**
 * 将文本按搜索查询分割并标记匹配部分
 * @param text 要搜索的文本
 * @param query 搜索查询
 * @param options 高亮选项
 * @returns 分割后的文本片段数组
 */
export function splitTextWithMatches(
  text: string,
  query: string,
  options: HighlightOptions = {}
): SearchMatch[] {
  const {
    caseSensitive = false,
    wholeWords = false,
    maxHighlights = -1
  } = options

  if (!text || !query || !query.trim()) {
    return [{ text, isMatch: false, index: 0 }]
  }

  // 构建正则表达式
  const regex = buildSearchRegex(query.trim(), { caseSensitive, wholeWords })
  
  if (!regex) {
    return [{ text, isMatch: false, index: 0 }]
  }

  // 查找所有匹配
  const matches = Array.from(text.matchAll(regex))
  
  if (matches.length === 0) {
    return [{ text, isMatch: false, index: 0 }]
  }

  // 限制高亮数量
  const limitedMatches = maxHighlights > 0 ? matches.slice(0, maxHighlights) : matches

  // 构建结果数组
  const result: SearchMatch[] = []
  let lastIndex = 0

  limitedMatches.forEach((match, index) => {
    const matchStart = match.index!
    const matchEnd = matchStart + match[0].length

    // 添加匹配前的文本
    if (matchStart > lastIndex) {
      result.push({
        text: text.slice(lastIndex, matchStart),
        isMatch: false,
        index: result.length
      })
    }

    // 添加匹配的文本
    result.push({
      text: match[0],
      isMatch: true,
      index: result.length
    })

    lastIndex = matchEnd
  })

  // 添加最后剩余的文本
  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      isMatch: false,
      index: result.length
    })
  }

  return result
}

/**
 * 构建搜索正则表达式
 * @param query 搜索查询
 * @param options 选项
 * @returns 正则表达式或null
 */
export function buildSearchRegex(
  query: string,
  options: { caseSensitive?: boolean; wholeWords?: boolean } = {}
): RegExp | null {
  const { caseSensitive = false, wholeWords = false } = options

  try {
    // 转义特殊字符
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 分割查询词（支持多个关键词）
    const keywords = escapedQuery.split(/\s+/).filter(Boolean)
    
    if (keywords.length === 0) return null
    
    // 构建正则表达式模式
    let pattern = keywords.join('|')
    
    if (wholeWords) {
      pattern = `\\b(${pattern})\\b`
    }
    
    const flags = caseSensitive ? 'g' : 'gi'
    return new RegExp(pattern, flags)
  } catch (error) {
    console.warn('Failed to build search regex:', error)
    return null
  }
}

/**
 * 计算搜索匹配分数
 * @param text 文本
 * @param query 查询
 * @param options 选项
 * @returns 匹配分数 (0-1)
 */
export function calculateMatchScore(
  text: string,
  query: string,
  options: HighlightOptions = {}
): number {
  if (!text || !query) return 0

  const matches = splitTextWithMatches(text, query, options)
  const matchedChars = matches
    .filter(match => match.isMatch)
    .reduce((sum, match) => sum + match.text.length, 0)

  return matchedChars / text.length
}

/**
 * 高亮搜索结果中的多个字段
 * @param item 要搜索的对象
 * @param query 搜索查询
 * @param fields 要搜索的字段
 * @param options 高亮选项
 * @returns 包含高亮信息的对象
 */
export function highlightSearchFields<T extends Record<string, any>>(
  item: T,
  query: string,
  fields: (keyof T)[],
  options: HighlightOptions = {}
): T & { _highlights: Record<string, SearchMatch[]>; _matchScore: number } {
  const highlights: Record<string, SearchMatch[]> = {}
  let totalScore = 0

  fields.forEach(field => {
    const fieldValue = item[field]
    if (typeof fieldValue === 'string') {
      const matches = splitTextWithMatches(fieldValue, query, options)
      highlights[field as string] = matches
      totalScore += calculateMatchScore(fieldValue, query, options)
    } else if (Array.isArray(fieldValue)) {
      // 处理数组字段（如标签）
      const arrayMatches = fieldValue.map(value => 
        typeof value === 'string' 
          ? splitTextWithMatches(value, query, options)
          : [{ text: String(value), isMatch: false, index: 0 }]
      )
      highlights[field as string] = arrayMatches.flat()
      
      // 计算数组字段的匹配分数
      const arrayText = fieldValue.join(' ')
      totalScore += calculateMatchScore(arrayText, query, options)
    }
  })

  return {
    ...item,
    _highlights: highlights,
    _matchScore: totalScore / fields.length
  }
}

/**
 * 生成搜索摘要
 * @param text 原文本
 * @param query 搜索查询
 * @param maxLength 最大长度
 * @param options 选项
 * @returns 包含匹配内容的摘要
 */
export function generateSearchSnippet(
  text: string,
  query: string,
  maxLength: number = 200,
  options: HighlightOptions = {}
): string {
  if (!text || !query) return text.slice(0, maxLength)

  const regex = buildSearchRegex(query, options)
  if (!regex) return text.slice(0, maxLength)

  const match = text.match(regex)
  if (!match) return text.slice(0, maxLength)

  const matchIndex = text.indexOf(match[0])
  const contextLength = Math.floor((maxLength - match[0].length) / 2)
  
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(text.length, matchIndex + match[0].length + contextLength)
  
  let snippet = text.slice(start, end)
  
  // 添加省略号
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  
  return snippet
}

/**
 * 搜索建议生成器
 * @param items 数据项
 * @param query 查询
 * @param fields 搜索字段
 * @param maxSuggestions 最大建议数
 * @returns 搜索建议
 */
export function generateSearchSuggestions<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  maxSuggestions: number = 10
): Array<{ text: string; type: string; count: number; score: number }> {
  if (!query || query.length < 2) return []

  const suggestions = new Map<string, { type: string; count: number; score: number }>()

  items.forEach(item => {
    fields.forEach(field => {
      const fieldValue = item[field]
      
      if (typeof fieldValue === 'string') {
        const score = calculateMatchScore(fieldValue, query)
        if (score > 0) {
          const key = fieldValue.toLowerCase()
          const existing = suggestions.get(key)
          if (existing) {
            existing.count++
            existing.score = Math.max(existing.score, score)
          } else {
            suggestions.set(key, {
              type: String(field),
              count: 1,
              score
            })
          }
        }
      } else if (Array.isArray(fieldValue)) {
        fieldValue.forEach(value => {
          if (typeof value === 'string') {
            const score = calculateMatchScore(value, query)
            if (score > 0) {
              const key = value.toLowerCase()
              const existing = suggestions.get(key)
              if (existing) {
                existing.count++
                existing.score = Math.max(existing.score, score)
              } else {
                suggestions.set(key, {
                  type: String(field),
                  count: 1,
                  score
                })
              }
            }
          }
        })
      }
    })
  })

  return Array.from(suggestions.entries())
    .map(([text, data]) => ({ text, ...data }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, maxSuggestions)
}

/**
 * 搜索结果排序
 * @param items 搜索结果
 * @param query 搜索查询
 * @param fields 搜索字段
 * @param sortBy 排序方式
 * @returns 排序后的结果
 */
export function sortSearchResults<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  sortBy: 'relevance' | 'date' | 'popularity' = 'relevance'
): T[] {
  if (sortBy === 'relevance' && query) {
    // 按相关性排序
    const itemsWithScore = items.map(item => ({
      ...item,
      _relevanceScore: fields.reduce((score, field) => {
        const fieldValue = item[field]
        if (typeof fieldValue === 'string') {
          return score + calculateMatchScore(fieldValue, query)
        } else if (Array.isArray(fieldValue)) {
          const arrayText = fieldValue.join(' ')
          return score + calculateMatchScore(arrayText, query)
        }
        return score
      }, 0) / fields.length
    }))

    return itemsWithScore.sort((a, b) => b._relevanceScore - a._relevanceScore)
  }

  // 其他排序方式保持原有逻辑
  return items
}

/**
 * 搜索性能优化：防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounceSearch<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 搜索缓存管理
 */
export class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: any): void {
    // 清理过期项
    this.cleanup()

    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }
}