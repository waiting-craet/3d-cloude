import { render, screen } from '@testing-library/react'
import { fc } from 'fast-check'
import GraphCard from '../GraphCard'
import { GraphCard as GraphCardType } from '@/lib/types/homepage-gallery'

/**
 * 属性 10: 卡片信息完整性
 * 验证: 需求 1.3
 * 
 * 对于任何图谱卡片，渲染的 HTML 应该包含标题、创建者名称、创建时间和点赞数这四个必需字段
 */
describe('GraphCard - Property 10: 卡片信息完整性', () => {
  const mockGraph: GraphCardType = {
    id: 'test-1',
    title: '测试图谱',
    description: '这是一个测试图谱',
    thumbnail: '',
    type: '3d',
    isTemplate: false,
    creator: {
      id: 'user-1',
      name: '测试用户',
      email: 'test@example.com',
      avatar: '',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    likes: 42,
    views: 100,
    tags: ['测试', '示例'],
    nodeCount: 10,
    edgeCount: 15,
  }

  it('属性 10: 卡片应该显示所有必需信息', async () => {
    // 使用 fast-check 生成随机图谱数据
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          creatorName: fc.string({ minLength: 1, maxLength: 50 }),
          likes: fc.integer({ min: 0, max: 10000 }),
          nodeCount: fc.integer({ min: 1, max: 1000 }),
          edgeCount: fc.integer({ min: 0, max: 1000 }),
        }),
        async (data) => {
          const graph: GraphCardType = {
            ...mockGraph,
            title: data.title,
            creator: {
              ...mockGraph.creator,
              name: data.creatorName,
            },
            likes: data.likes,
            nodeCount: data.nodeCount,
            edgeCount: data.edgeCount,
          }

          render(
            <GraphCard
              graph={graph}
              onClick={jest.fn()}
              theme="dark"
            />
          )

          // 验证所有必需字段都显示
          expect(screen.getByText(data.title)).toBeInTheDocument()
          expect(screen.getByText(data.creatorName)).toBeInTheDocument()
          expect(screen.getByText(data.likes.toString())).toBeInTheDocument()
          expect(screen.getByText(new RegExp(`${data.nodeCount} 节点`))).toBeInTheDocument()
          expect(screen.getByText(new RegExp(`${data.edgeCount} 关系`))).toBeInTheDocument()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('应该显示标题', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('测试图谱')).toBeInTheDocument()
  })

  it('应该显示创建者名称', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('测试用户')).toBeInTheDocument()
  })

  it('应该显示点赞数', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('应该显示创建时间', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    // 应该显示日期
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('应该显示节点和关系数', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText(/10 节点/)).toBeInTheDocument()
    expect(screen.getByText(/15 关系/)).toBeInTheDocument()
  })

  it('应该显示图谱类型标签', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('3D')).toBeInTheDocument()
  })

  it('应该显示模板标签（如果是模板）', () => {
    const templateGraph: GraphCardType = {
      ...mockGraph,
      isTemplate: true,
    }

    render(
      <GraphCard
        graph={templateGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('模板')).toBeInTheDocument()
  })

  it('应该显示标签', () => {
    render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('#测试')).toBeInTheDocument()
    expect(screen.getByText('#示例')).toBeInTheDocument()
  })

  it('应该支持亮色和暗色主题', () => {
    const { rerender } = render(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    // 暗色主题应该正常渲染
    expect(screen.getByText('测试图谱')).toBeInTheDocument()

    // 重新渲染为亮色主题
    rerender(
      <GraphCard
        graph={mockGraph}
        onClick={jest.fn()}
        theme="light"
      />
    )

    // 亮色主题也应该正常渲染
    expect(screen.getByText('测试图谱')).toBeInTheDocument()
  })

  it('应该在没有描述时显示默认文本', () => {
    const graphWithoutDescription: GraphCardType = {
      ...mockGraph,
      description: '',
    }

    render(
      <GraphCard
        graph={graphWithoutDescription}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    expect(screen.getByText('暂无描述')).toBeInTheDocument()
  })

  it('应该在没有标签时不显示标签区域', () => {
    const graphWithoutTags: GraphCardType = {
      ...mockGraph,
      tags: [],
    }

    render(
      <GraphCard
        graph={graphWithoutTags}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    // 不应该显示任何标签
    expect(screen.queryByText(/#/)).not.toBeInTheDocument()
  })

  it('应该在有超过 3 个标签时显示 +N 指示器', () => {
    const graphWithManyTags: GraphCardType = {
      ...mockGraph,
      tags: ['标签1', '标签2', '标签3', '标签4', '标签5'],
    }

    render(
      <GraphCard
        graph={graphWithManyTags}
        onClick={jest.fn()}
        theme="dark"
      />
    )

    // 应该显示 +2
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
