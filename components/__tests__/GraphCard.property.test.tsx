import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import * as fc from 'fast-check'
import GraphCard, { Graph } from '../GraphCard'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('GraphCard Property-Based Tests', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('属性测试 1: 统计格式不变性', () => {
    it('对于任意非负整数，格式化结果必须包含正确的数字和文本', () => {
      fc.assert(
        fc.property(
          fc.nat(), // nodeCount: 非负整数
          fc.nat(), // edgeCount: 非负整数
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const text = container.textContent || ''

            // 验证格式正确性
            const hasCorrectFormat = 
              text.includes('包括') &&
              text.includes('个节点') &&
              text.includes('个关系') &&
              text.includes(String(nodeCount)) &&
              text.includes(String(edgeCount))

            return hasCorrectFormat
          }
        ),
        { numRuns: 100 } // 运行100次
      )
    })

    it('统计信息必须严格遵循"包括X个节点，Y个关系"格式', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100000 }),
          fc.nat({ max: 100000 }),
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const statsElement = container.querySelector('[class*="stats"]')
            const text = statsElement?.textContent || ''

            // 验证精确格式
            const expectedText = `包括${nodeCount}个节点，${edgeCount}个关系`
            return text === expectedText
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('属性测试 2: 数据一致性', () => {
    it('渲染的组件必须反映输入的图谱数据', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            nodeCount: fc.nat({ max: 10000 }),
            edgeCount: fc.nat({ max: 50000 }),
          }),
          (graphData) => {
            const graph: Graph = {
              ...graphData,
              description: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const text = container.textContent || ''

            // 验证数据一致性
            return (
              text.includes(graph.name) &&
              text.includes(String(graph.nodeCount)) &&
              text.includes(String(graph.edgeCount))
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('显示的节点数和边数必须与输入完全一致', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 999999 }),
          fc.nat({ max: 999999 }),
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const statsElement = container.querySelector('[class*="stats"]')
            const text = statsElement?.textContent || ''

            // 提取显示的数字
            const match = text.match(/包括(\d+)个节点，(\d+)个关系/)
            if (!match) return false

            const displayedNodeCount = parseInt(match[1], 10)
            const displayedEdgeCount = parseInt(match[2], 10)

            // 验证完全一致
            return (
              displayedNodeCount === nodeCount &&
              displayedEdgeCount === edgeCount
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('属性测试 3: 非负性约束', () => {
    it('对于任意整数输入，显示的数字必须是非负的', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          fc.integer({ min: -1000, max: 1000 }),
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const statsElement = container.querySelector('[class*="stats"]')
            const text = statsElement?.textContent || ''

            // 提取显示的数字
            const match = text.match(/包括(\d+)个节点，(\d+)个关系/)
            if (!match) return false

            const displayedNodeCount = parseInt(match[1], 10)
            const displayedEdgeCount = parseInt(match[2], 10)

            // 验证非负性
            return displayedNodeCount >= 0 && displayedEdgeCount >= 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('负数输入必须被转换为0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: -1000, max: -1 }),
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const statsElement = container.querySelector('[class*="stats"]')
            const text = statsElement?.textContent || ''

            // 验证负数被转换为0
            return text === '包括0个节点，0个关系'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('属性测试 4: 组件稳定性', () => {
    it('相同输入应该产生相同输出', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            nodeCount: fc.nat({ max: 10000 }),
            edgeCount: fc.nat({ max: 50000 }),
          }),
          (graphData) => {
            const graph: Graph = {
              ...graphData,
              description: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            // 渲染两次
            const { container: container1 } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const text1 = container1.textContent || ''

            const { container: container2 } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
            const text2 = container2.textContent || ''

            // 验证输出一致
            return text1 === text2
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('属性测试 5: 边界值处理', () => {
    it('应该正确处理各种边界值', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(Number.MAX_SAFE_INTEGER),
            fc.nat({ max: 1000000 })
          ),
          fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(Number.MAX_SAFE_INTEGER),
            fc.nat({ max: 1000000 })
          ),
          (nodeCount, edgeCount) => {
            const graph: Graph = {
              id: 'test-id',
              name: '测试图谱',
              description: null,
              nodeCount,
              edgeCount,
              createdAt: new Date(),
              updatedAt: new Date(),
              projectId: 'test-project',
            }

            try {
              const { container } = render(<GraphCard graph={graph} onClick={mockOnClick} />)
              const text = container.textContent || ''

              // 验证组件没有崩溃且包含必要文本
              return (
                text.includes('包括') &&
                text.includes('个节点') &&
                text.includes('个关系')
              )
            } catch (error) {
              // 组件不应该抛出错误
              return false
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
