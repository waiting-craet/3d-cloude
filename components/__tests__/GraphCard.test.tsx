import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GraphCard, { Graph } from '../GraphCard'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('GraphCard Component', () => {
  const mockGraph: Graph = {
    id: 'graph-123',
    name: '测试图谱',
    description: '这是一个测试图谱',
    nodeCount: 150,
    edgeCount: 320,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    projectId: 'project-456',
  }

  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('正常渲染测试', () => {
    it('应该正确渲染图谱名称', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      expect(screen.getByText('测试图谱')).toBeInTheDocument()
    })

    it('应该以正确格式显示统计信息', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText(/包括.*个节点.*个关系/)
      expect(statsText).toBeInTheDocument()
      expect(statsText.textContent).toBe('包括150个节点，320个关系')
    })

    it('应该显示图谱图标', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const image = screen.getByAltText('图谱图标')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/知识图谱-图谱管理.png')
    })
  })

  describe('零值显示测试', () => {
    it('应该正确显示零节点和零边', () => {
      const emptyGraph: Graph = {
        ...mockGraph,
        nodeCount: 0,
        edgeCount: 0,
      }
      render(<GraphCard graph={emptyGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括0个节点，0个关系')
      expect(statsText).toBeInTheDocument()
    })

    it('应该正确显示零节点但有边', () => {
      const graphWithEdgesOnly: Graph = {
        ...mockGraph,
        nodeCount: 0,
        edgeCount: 50,
      }
      render(<GraphCard graph={graphWithEdgesOnly} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括0个节点，50个关系')
      expect(statsText).toBeInTheDocument()
    })

    it('应该正确显示有节点但零边', () => {
      const graphWithNodesOnly: Graph = {
        ...mockGraph,
        nodeCount: 100,
        edgeCount: 0,
      }
      render(<GraphCard graph={graphWithNodesOnly} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括100个节点，0个关系')
      expect(statsText).toBeInTheDocument()
    })
  })

  describe('大数值显示测试', () => {
    it('应该正确显示大数值节点和边', () => {
      const largeGraph: Graph = {
        ...mockGraph,
        nodeCount: 10000,
        edgeCount: 50000,
      }
      render(<GraphCard graph={largeGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括10000个节点，50000个关系')
      expect(statsText).toBeInTheDocument()
    })

    it('应该正确显示非常大的数值', () => {
      const veryLargeGraph: Graph = {
        ...mockGraph,
        nodeCount: 999999,
        edgeCount: 1234567,
      }
      render(<GraphCard graph={veryLargeGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括999999个节点，1234567个关系')
      expect(statsText).toBeInTheDocument()
    })
  })

  describe('异常数据处理测试', () => {
    it('应该将负数节点数显示为0', () => {
      const negativeNodeGraph: Graph = {
        ...mockGraph,
        nodeCount: -10,
        edgeCount: 50,
      }
      render(<GraphCard graph={negativeNodeGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括0个节点，50个关系')
      expect(statsText).toBeInTheDocument()
    })

    it('应该将负数边数显示为0', () => {
      const negativeEdgeGraph: Graph = {
        ...mockGraph,
        nodeCount: 100,
        edgeCount: -20,
      }
      render(<GraphCard graph={negativeEdgeGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括100个节点，0个关系')
      expect(statsText).toBeInTheDocument()
    })

    it('应该将两个负数都显示为0', () => {
      const bothNegativeGraph: Graph = {
        ...mockGraph,
        nodeCount: -10,
        edgeCount: -20,
      }
      render(<GraphCard graph={bothNegativeGraph} onClick={mockOnClick} />)
      const statsText = screen.getByText('包括0个节点，0个关系')
      expect(statsText).toBeInTheDocument()
    })
  })

  describe('点击事件测试', () => {
    it('应该在点击卡片时调用onClick回调', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const card = screen.getByText('测试图谱').closest('div')
      
      if (card) {
        fireEvent.click(card)
        expect(mockOnClick).toHaveBeenCalledTimes(1)
        expect(mockOnClick).toHaveBeenCalledWith('graph-123')
      }
    })

    it('应该在多次点击时多次调用onClick', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const card = screen.getByText('测试图谱').closest('div')
      
      if (card) {
        fireEvent.click(card)
        fireEvent.click(card)
        fireEvent.click(card)
        expect(mockOnClick).toHaveBeenCalledTimes(3)
      }
    })
  })

  describe('图标加载失败测试', () => {
    it('应该在图片加载失败时显示占位符', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const image = screen.getByAltText('图谱图标')
      
      // 触发图片加载错误
      fireEvent.error(image)
      
      // 检查占位符是否显示
      const placeholder = screen.getByText('🗺️')
      expect(placeholder).toBeInTheDocument()
    })
  })

  describe('数据完整性测试', () => {
    it('应该显示与输入数据完全一致的统计信息', () => {
      const testCases = [
        { nodeCount: 0, edgeCount: 0 },
        { nodeCount: 1, edgeCount: 1 },
        { nodeCount: 50, edgeCount: 100 },
        { nodeCount: 999, edgeCount: 1234 },
        { nodeCount: 10000, edgeCount: 50000 },
      ]

      testCases.forEach(({ nodeCount, edgeCount }) => {
        const testGraph: Graph = {
          ...mockGraph,
          nodeCount,
          edgeCount,
        }
        const { unmount } = render(<GraphCard graph={testGraph} onClick={mockOnClick} />)
        const expectedText = `包括${nodeCount}个节点，${edgeCount}个关系`
        expect(screen.getByText(expectedText)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('可访问性测试', () => {
    it('应该有正确的title属性用于长名称', () => {
      const longNameGraph: Graph = {
        ...mockGraph,
        name: '这是一个非常非常非常长的图谱名称用于测试文本溢出处理',
      }
      render(<GraphCard graph={longNameGraph} onClick={mockOnClick} />)
      const nameElement = screen.getByTitle(longNameGraph.name)
      expect(nameElement).toBeInTheDocument()
    })

    it('应该有可点击的卡片元素', () => {
      const { container } = render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      const card = container.querySelector('[class*="projectCard"]')
      expect(card).toBeInTheDocument()
    })
  })
})
