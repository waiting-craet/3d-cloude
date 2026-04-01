/**
 * Emoji Filter Tests
 * 
 * Unit tests for the emoji filtering functionality
 */

import {
  removeEmojis,
  removeEmojisFromObject,
  removeEmojisFromAllStrings,
} from '../emoji-filter'

describe('Emoji Filter', () => {
  describe('removeEmojis', () => {
    it('should remove all emojis from a string', () => {
      const input = 'Hello 👋 World 🌍'
      const result = removeEmojis(input)
      expect(result).toBe('Hello  World ')
    })

    it('should remove checkmark emoji', () => {
      const input = '✅ Success!'
      const result = removeEmojis(input)
      expect(result).toBe(' Success!')
    })

    it('should remove chart emoji', () => {
      const input = '📊 Statistics'
      const result = removeEmojis(input)
      expect(result).toBe(' Statistics')
    })

    it('should remove warning emoji', () => {
      const input = '⚠️ Warning'
      const result = removeEmojis(input)
      expect(result).toBe(' Warning')
    })

    it('should remove multiple different emojis', () => {
      const input = '📊 ⚠️ ✅ 🚀 ✨'
      const result = removeEmojis(input)
      expect(result).toBe('    ')
    })

    it('should preserve text and punctuation', () => {
      const input = 'Hello, World! How are you?'
      const result = removeEmojis(input)
      expect(result).toBe('Hello, World! How are you?')
    })

    it('should handle empty string', () => {
      const result = removeEmojis('')
      expect(result).toBe('')
    })

    it('should handle null or undefined input', () => {
      expect(removeEmojis(null as any)).toBe(null)
      expect(removeEmojis(undefined as any)).toBe(undefined)
    })

    it('should handle string with only emojis', () => {
      const input = '🎉🎊🎈'
      const result = removeEmojis(input)
      expect(result).toBe('')
    })

    it('should handle mixed content with emojis', () => {
      const input = '节点名称 🔗 边类型 📊 统计'
      const result = removeEmojis(input)
      expect(result).toBe('节点名称  边类型  统计')
    })

    it('should remove robot emoji', () => {
      const input = '🤖 AI 图谱预览'
      const result = removeEmojis(input)
      expect(result).toBe(' AI 图谱预览')
    })

    it('should remove close X emoji', () => {
      const input = '✕'
      const result = removeEmojis(input)
      expect(result).toBe('')
    })

    it('should remove refresh emoji', () => {
      const input = '🔄 重试'
      const result = removeEmojis(input)
      expect(result).toBe(' 重试')
    })

    it('should remove 2D/3D emojis', () => {
      const input = '📐 🌐'
      const result = removeEmojis(input)
      expect(result).toBe(' ')
    })

    it('should remove checkmark', () => {
      const input = '✓ 已处理'
      const result = removeEmojis(input)
      expect(result).toBe(' 已处理')
    })

    it('should remove people emoji', () => {
      const input = '👥 重复节点'
      const result = removeEmojis(input)
      expect(result).toBe(' 重复节点')
    })

    it('should remove document emoji', () => {
      const input = '📝 文档'
      const result = removeEmojis(input)
      expect(result).toBe(' 文档')
    })

    it('should remove settings emoji', () => {
      const input = '⚙️ 设置'
      const result = removeEmojis(input)
      expect(result).toBe(' 设置')
    })

    it('should remove tag emoji', () => {
      const input = '🏷️ 分类'
      const result = removeEmojis(input)
      expect(result).toBe(' 分类')
    })

    it('should remove clock emoji', () => {
      const input = '⏳ 等待'
      const result = removeEmojis(input)
      expect(result).toBe(' 等待')
    })

    it('should remove chart increasing emoji', () => {
      const input = '📈 进度'
      const result = removeEmojis(input)
      expect(result).toBe(' 进度')
    })

    it('should remove link emoji', () => {
      const input = '🔗 链接'
      const result = removeEmojis(input)
      expect(result).toBe(' 链接')
    })

    it('should remove magnifying glass emoji', () => {
      const input = '🔍 搜索'
      const result = removeEmojis(input)
      expect(result).toBe(' 搜索')
    })

    it('should count zero emojis after removal', () => {
      const input = '📊 ⚠️ ✅ 🚀 ✨'
      const result = removeEmojis(input)
      const emojiRegex = /[\p{Emoji}\u200d]+/gu
      const remainingEmojis = result.match(emojiRegex)
      expect(remainingEmojis).toBeNull()
    })
  })

  describe('removeEmojisFromObject', () => {
    it('should remove emojis from specified keys', () => {
      const input = {
        title: '📊 统计',
        description: '⚠️ 警告',
        value: 100,
      }
      const result = removeEmojisFromObject(input, ['title', 'description'])
      expect(result.title).toBe(' 统计')
      expect(result.description).toBe(' 警告')
      expect(result.value).toBe(100)
    })

    it('should not modify non-string properties', () => {
      const input = {
        name: '🤖 Robot',
        count: 5,
        active: true,
      }
      const result = removeEmojisFromObject(input, ['name'])
      expect(result.name).toBe(' Robot')
      expect(result.count).toBe(5)
      expect(result.active).toBe(true)
    })

    it('should handle empty keys array', () => {
      const input = {
        title: '📊 统计',
        description: '⚠️ 警告',
      }
      const result = removeEmojisFromObject(input, [])
      expect(result.title).toBe('📊 统计')
      expect(result.description).toBe('⚠️ 警告')
    })

    it('should return a new object without modifying the original', () => {
      const input = {
        title: '📊 统计',
      }
      const result = removeEmojisFromObject(input, ['title'])
      expect(input.title).toBe('📊 统计')
      expect(result.title).toBe(' 统计')
    })
  })

  describe('removeEmojisFromAllStrings', () => {
    it('should remove emojis from all string properties', () => {
      const input = {
        title: '📊 统计',
        description: '⚠️ 警告',
        label: '✅ 完成',
        count: 100,
        active: true,
      }
      const result = removeEmojisFromAllStrings(input)
      expect(result.title).toBe(' 统计')
      expect(result.description).toBe(' 警告')
      expect(result.label).toBe(' 完成')
      expect(result.count).toBe(100)
      expect(result.active).toBe(true)
    })

    it('should handle nested objects', () => {
      const input = {
        name: '🤖 Robot',
        metadata: {
          icon: '📊 Chart',
          label: '⚠️ Warning',
        },
      }
      const result = removeEmojisFromAllStrings(input)
      expect(result.name).toBe(' Robot')
      expect(result.metadata.icon).toBe(' Chart')
      expect(result.metadata.label).toBe(' Warning')
    })

    it('should handle arrays of objects', () => {
      const input = {
        nodes: [
          { name: '📊 Node1', type: 'chart' },
          { name: '⚠️ Node2', type: 'warning' },
        ],
      }
      const result = removeEmojisFromAllStrings(input)
      expect(result.nodes[0].name).toBe(' Node1')
      expect(result.nodes[1].name).toBe(' Node2')
    })

    it('should handle arrays of strings', () => {
      const input = {
        tags: ['📊 统计', '⚠️ 警告', '✅ 完成'],
      }
      const result = removeEmojisFromAllStrings(input)
      expect(result.tags[0]).toBe(' 统计')
      expect(result.tags[1]).toBe(' 警告')
      expect(result.tags[2]).toBe(' 完成')
    })

    it('should return a new object without modifying the original', () => {
      const input = {
        title: '📊 统计',
        description: '⚠️ 警告',
      }
      const result = removeEmojisFromAllStrings(input)
      expect(input.title).toBe('📊 统计')
      expect(input.description).toBe('⚠️ 警告')
      expect(result.title).toBe(' 统计')
      expect(result.description).toBe(' 警告')
    })

    it('should handle complex nested structures', () => {
      const input = {
        nodes: [
          {
            id: '1',
            name: '📊 节点1',
            description: '⚠️ 警告信息',
            properties: {
              icon: '🎉',
              label: '✅ 已完成',
            },
          },
        ],
        edges: [
          {
            id: '1',
            label: '🔗 连接',
            source: '1',
            target: '2',
          },
        ],
      }
      const result = removeEmojisFromAllStrings(input)
      expect(result.nodes[0].name).toBe(' 节点1')
      expect(result.nodes[0].description).toBe(' 警告信息')
      expect(result.nodes[0].properties.icon).toBe('')
      expect(result.nodes[0].properties.label).toBe(' 已完成')
      expect(result.edges[0].label).toBe(' 连接')
    })
  })

  describe('Emoji Detection Coverage', () => {
    it('should remove all common UI emojis', () => {
      const commonUIEmojis = [
        '📊', '⚠️', '✏️', '💾', '✨', '🚀', '❌', '🔍', '📝',
        '💡', '⭐', '🎯', '📈', '👥', '🔗', '⏳', '🏷️', '⚙️', '✅',
        '🤖', '✕', '🔄', '📐', '🌐', '✓',
      ]
      
      for (const emoji of commonUIEmojis) {
        const input = `${emoji} Text`
        const result = removeEmojis(input)
        expect(result).toBe(' Text')
      }
    })

    it('should handle zero-width joiner sequences', () => {
      const input = '👨‍👩‍👧‍👦 Family'
      const result = removeEmojis(input)
      expect(result).toBe(' Family')
    })

    it('should handle skin tone modifiers', () => {
      const input = '👍🏻👍🏼👍🏽👍🏾👍🏿'
      const result = removeEmojis(input)
      expect(result).toBe('')
    })

    it('should handle keycap emojis', () => {
      const input = '1️⃣2️⃣3️⃣'
      const result = removeEmojis(input)
      expect(result).toBe('123')
    })
  })
})
