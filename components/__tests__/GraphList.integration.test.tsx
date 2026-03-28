import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GraphList from '../GraphList'
import { Graph } from '../GraphCard'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('GraphList Integration Tests', () => {
  const mockGraphs: Graph[] = [
    {
      id: 'graph-1',
      name: '图谱1',
      description: '描述1',
      nodeCount: 100,
      edgeCount: 200,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      projectId: 'project-123',
    },
    {
      id: 'graph-2',
      name: '图谱2',
      description: '描述2',
      nodeCount: 50,
      edgeCount: 75,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
      projectId: 'project-123',
    },
    {
      id: 'graph-3',
      name: '空图谱',
      description: null,
      nodeCount: 0,
      edgeCount: 0,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-06'),
      projectId: 'project-123',
    },
  ]

  const mockOnBack = jest.fn()
  const mockOnGraphClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('GraphList和GraphCard集成', () => {
    it('应该正确渲染所有图谱卡片', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: mockGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
          onGraphClick={mockOnGraphClick}
        />
      )

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })

      // 验证所有图谱都被渲染
      expect(screen.getByText('图谱1')).toBeInTheDocument()
      expect(screen.getByText('图谱2')).toBeInTheDocument()
      expect(screen.getByText('空图谱')).toBeInTheDocument()

      // 验证统计信息格式正确
      expect(screen.getByText('包括100个节点，200个关系')).toBeInTheDocument()
      expect(screen.getByText('包括50个节点，75个关系')).toBeInTheDocument()
      expect(screen.getByText('包括0个节点，0个关系')).toBeInTheDocument()
    })

    it('应该正确处理API数据流', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: mockGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      // 验证API被正确调用
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project-123/graphs')

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })
    })

    it('应该过滤掉无效的图谱数据', async () => {
      const invalidGraphs = [
        ...mockGraphs,
        {
          id: 'invalid-1',
          name: '无效图谱1',
          // 缺少 nodeCount
          edgeCount: 10,
        },
        {
          id: 'invalid-2',
          name: '无效图谱2',
          nodeCount: 10,
          // 缺少 edgeCount
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: invalidGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })

      // 验证只有有效的图谱被渲染
      expect(screen.queryByText('无效图谱1')).not.toBeInTheDocument()
      expect(screen.queryByText('无效图谱2')).not.toBeInTheDocument()
    })
  })

  describe('完整用户交互流程', () => {
    it('应该支持完整的点击导航流程', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: mockGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
          onGraphClick={mockOnGraphClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })

      // 点击图谱卡片
      const card = screen.getByText('图谱1').closest('div')
      if (card) {
        fireEvent.click(card)
        expect(mockOnGraphClick).toHaveBeenCalledWith('graph-1')
      }
    })

    it('应该支持返回按钮功能', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: mockGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })

      // 点击返回按钮
      const backButton = screen.getByText('← 返回项目列表')
      fireEvent.click(backButton)
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('错误处理', () => {
    it('应该正确处理API错误', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('网络错误'))

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/网络错误/)).toBeInTheDocument()
      })
    })

    it('应该提供重试功能', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('网络错误'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ graphs: mockGraphs }),
        })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText(/网络错误/)).toBeInTheDocument()
      })

      // 点击重试按钮
      const retryButton = screen.getByText(/重试/)
      fireEvent.click(retryButton)

      // 等待成功加载
      await waitFor(() => {
        expect(screen.getByText('图谱1')).toBeInTheDocument()
      })
    })
  })

  describe('空状态处理', () => {
    it('应该正确显示空状态', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: [] }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('暂无图谱')).toBeInTheDocument()
      })
    })
  })

  describe('maxItems限制', () => {
    it('应该正确限制显示的图谱数量', async () => {
      const manyGraphs = Array.from({ length: 20 }, (_, i) => ({
        id: `graph-${i}`,
        name: `图谱${i}`,
        description: null,
        nodeCount: i * 10,
        edgeCount: i * 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: 'project-123',
      }))

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ graphs: manyGraphs }),
      })

      render(
        <GraphList
          projectId="project-123"
          projectName="测试项目"
          maxItems={5}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('图谱0')).toBeInTheDocument()
      })

      // 验证只显示前5个
      expect(screen.getByText('图谱4')).toBeInTheDocument()
      expect(screen.queryByText('图谱5')).not.toBeInTheDocument()
    })
  })
})
