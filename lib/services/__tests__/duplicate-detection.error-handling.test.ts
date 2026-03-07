/**
 * 错误处理测试 - 冗余检测服务
 * 
 * 验证需求: 5.1, 5.2, 5.3, 5.4
 */

import { detectAndFilterDuplicates, ParsedGraphData } from '../duplicate-detection'
import { PrismaClient } from '@prisma/client'

// Mock Prisma Client
const mockPrisma = {
  node: {
    findMany: jest.fn()
  },
  edge: {
    findMany: jest.fn()
  }
} as unknown as PrismaClient

describe('Duplicate Detection Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 清除 console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('数据格式错误处理', () => {
    it('应该捕获并记录缺少节点数组的错误', async () => {
      const invalidData = {
        nodes: null as any,
        edges: []
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow('数据格式错误: 缺少有效的节点数组')

      // 验证错误日志被记录
      expect(console.error).toHaveBeenCalledWith(
        'Data format validation error:',
        expect.objectContaining({
          type: 'data_format_error',
          projectId: 'project1',
          graphId: 'graph1',
          context: 'nodes array missing or invalid'
        })
      )
    })

    it('应该捕获并记录缺少边数组的错误', async () => {
      const invalidData = {
        nodes: [],
        edges: null as any
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow('数据格式错误: 缺少有效的边数组')

      // 验证错误日志被记录
      expect(console.error).toHaveBeenCalledWith(
        'Data format validation error:',
        expect.objectContaining({
          type: 'data_format_error',
          projectId: 'project1',
          graphId: 'graph1',
          context: 'edges array missing or invalid'
        })
      )
    })

    it('应该捕获并记录节点缺少label字段的错误', async () => {
      const invalidData: ParsedGraphData = {
        nodes: [
          { label: 'Node1' },
          { label: '' } as any, // 空label
          { description: 'No label' } as any // 缺少label
        ],
        edges: []
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow('数据格式错误: 节点 1 缺少必要的 label 字段')

      // 验证错误日志被记录
      expect(console.error).toHaveBeenCalledWith(
        'Data format validation error:',
        expect.objectContaining({
          type: 'data_format_error',
          projectId: 'project1',
          graphId: 'graph1',
          context: 'node at index 1'
        })
      )
    })
  })

  describe('数据库查询错误处理', () => {
    it('应该捕获并记录数据库连接错误', async () => {
      const validData: ParsedGraphData = {
        nodes: [{ label: 'Node1' }],
        edges: []
      }

      // Mock 数据库查询失败
      ;(mockPrisma.node.findMany as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      )

      await expect(
        detectAndFilterDuplicates(mockPrisma, validData, 'project1', 'graph1')
      ).rejects.toThrow('数据库查询错误')

      // 验证错误日志被记录
      expect(console.error).toHaveBeenCalledWith(
        'Database query error:',
        expect.objectContaining({
          type: 'database_query_error',
          projectId: 'project1',
          graphId: 'graph1',
          context: 'fetching existing nodes and edges'
        })
      )
    })

    it('应该捕获并记录Prisma查询错误', async () => {
      const validData: ParsedGraphData = {
        nodes: [{ label: 'Node1' }],
        edges: []
      }

      // Mock Prisma 查询失败
      ;(mockPrisma.node.findMany as jest.Mock).mockRejectedValue(
        new Error('Prisma query failed: Invalid field')
      )

      await expect(
        detectAndFilterDuplicates(mockPrisma, validData, 'project1', 'graph1')
      ).rejects.toThrow('数据库查询错误')

      // 验证错误日志包含完整的错误信息
      expect(console.error).toHaveBeenCalledWith(
        'Database query error:',
        expect.objectContaining({
          type: 'database_query_error',
          error: 'Prisma query failed: Invalid field'
        })
      )
    })
  })

  describe('错误日志记录', () => {
    it('应该记录包含所有必要上下文的错误日志', async () => {
      const invalidData = {
        nodes: null as any,
        edges: []
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow()

      // 验证日志包含所有必要字段
      expect(console.error).toHaveBeenCalledWith(
        'Data format validation error:',
        expect.objectContaining({
          type: expect.any(String),
          projectId: 'project1',
          graphId: 'graph1',
          error: expect.any(String),
          context: expect.any(String),
          timestamp: expect.any(String)
        })
      )
    })

    it('应该记录timestamp为ISO格式', async () => {
      const invalidData = {
        nodes: null as any,
        edges: []
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow()

      const errorCall = (console.error as jest.Mock).mock.calls[0][1]
      const timestamp = errorCall.timestamp
      
      // 验证timestamp是有效的ISO日期字符串
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })

  describe('错误中止导入操作', () => {
    it('数据格式错误应该中止导入操作', async () => {
      const invalidData = {
        nodes: null as any,
        edges: []
      }

      // 验证函数抛出错误,不会继续执行
      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow()

      // 验证数据库查询没有被调用(操作被中止)
      expect(mockPrisma.node.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.edge.findMany).not.toHaveBeenCalled()
    })

    it('数据库查询错误应该中止导入操作', async () => {
      const validData: ParsedGraphData = {
        nodes: [{ label: 'Node1' }],
        edges: []
      }

      // Mock 数据库查询失败
      ;(mockPrisma.node.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      // 验证函数抛出错误
      await expect(
        detectAndFilterDuplicates(mockPrisma, validData, 'project1', 'graph1')
      ).rejects.toThrow('数据库查询错误')
    })
  })

  describe('描述性错误消息', () => {
    it('应该为数据格式错误提供描述性消息', async () => {
      const invalidData = {
        nodes: null as any,
        edges: []
      }

      await expect(
        detectAndFilterDuplicates(mockPrisma, invalidData, 'project1', 'graph1')
      ).rejects.toThrow('数据格式错误: 缺少有效的节点数组')
    })

    it('应该为数据库错误提供描述性消息', async () => {
      const validData: ParsedGraphData = {
        nodes: [{ label: 'Node1' }],
        edges: []
      }

      ;(mockPrisma.node.findMany as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      )

      await expect(
        detectAndFilterDuplicates(mockPrisma, validData, 'project1', 'graph1')
      ).rejects.toThrow('数据库查询错误: Connection failed')
    })
  })
})
