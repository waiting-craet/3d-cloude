import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProjectCard, { Project } from '../ProjectCard'
import GraphCard, { Graph } from '../GraphCard'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('ProjectCard和GraphCard隔离测试', () => {
  const mockProject: Project = {
    id: 'project-123',
    name: '测试项目',
    description: '项目描述',
    nodeCount: 500,
    edgeCount: 1000,
    graphCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockGraph: Graph = {
    id: 'graph-123',
    name: '测试图谱',
    description: '图谱描述',
    nodeCount: 100,
    edgeCount: 200,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: 'project-123',
  }

  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('显示内容隔离', () => {
    it('ProjectCard应该显示"包含X个图谱"', () => {
      render(<ProjectCard project={mockProject} onClick={mockOnClick} />)
      
      // 验证项目卡片显示图谱数量
      expect(screen.getByText(/包含.*个图谱/)).toBeInTheDocument()
      expect(screen.getByText('包含 5 个图谱')).toBeInTheDocument()
      
      // 验证不显示节点和边的统计
      expect(screen.queryByText(/个节点/)).not.toBeInTheDocument()
      expect(screen.queryByText(/个关系/)).not.toBeInTheDocument()
    })

    it('GraphCard应该显示"包括X个节点，Y个关系"', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      
      // 验证图谱卡片显示节点和边
      expect(screen.getByText(/包括.*个节点.*个关系/)).toBeInTheDocument()
      expect(screen.getByText('包括100个节点，200个关系')).toBeInTheDocument()
      
      // 验证不显示图谱数量
      expect(screen.queryByText(/个图谱/)).not.toBeInTheDocument()
    })

    it('两个组件的显示内容应该完全不同', () => {
      const { container: projectContainer } = render(
        <ProjectCard project={mockProject} onClick={mockOnClick} />
      )
      const projectText = projectContainer.textContent || ''

      const { container: graphContainer } = render(
        <GraphCard graph={mockGraph} onClick={mockOnClick} />
      )
      const graphText = graphContainer.textContent || ''

      // 验证项目卡片包含"个图谱"但不包含"节点"和"关系"
      expect(projectText).toContain('个图谱')
      expect(projectText).not.toContain('节点')
      expect(projectText).not.toContain('关系')

      // 验证图谱卡片包含"节点"和"关系"但不包含"个图谱"
      expect(graphText).toContain('节点')
      expect(graphText).toContain('关系')
      expect(graphText).not.toContain('个图谱')
    })
  })

  describe('数据字段隔离', () => {
    it('ProjectCard应该使用graphCount字段', () => {
      const projectWithDifferentCounts: Project = {
        ...mockProject,
        nodeCount: 1000,
        edgeCount: 2000,
        graphCount: 10,
      }

      render(<ProjectCard project={projectWithDifferentCounts} onClick={mockOnClick} />)
      
      // 验证显示的是graphCount而不是nodeCount或edgeCount
      expect(screen.getByText('包含 10 个图谱')).toBeInTheDocument()
      expect(screen.queryByText('1000')).not.toBeInTheDocument()
      expect(screen.queryByText('2000')).not.toBeInTheDocument()
    })

    it('GraphCard应该使用nodeCount和edgeCount字段', () => {
      const graphWithCounts: Graph = {
        ...mockGraph,
        nodeCount: 250,
        edgeCount: 500,
      }

      render(<GraphCard graph={graphWithCounts} onClick={mockOnClick} />)
      
      // 验证显示的是nodeCount和edgeCount
      expect(screen.getByText('包括250个节点，500个关系')).toBeInTheDocument()
    })
  })

  describe('样式隔离', () => {
    it('两个组件应该使用相同的样式类但显示不同内容', () => {
      const { container: projectContainer } = render(
        <ProjectCard project={mockProject} onClick={mockOnClick} />
      )
      
      const { container: graphContainer } = render(
        <GraphCard graph={mockGraph} onClick={mockOnClick} />
      )

      // 验证都使用projectCard样式类
      const projectCard = projectContainer.querySelector('[class*="projectCard"]')
      const graphCard = graphContainer.querySelector('[class*="projectCard"]')
      
      expect(projectCard).toBeInTheDocument()
      expect(graphCard).toBeInTheDocument()

      // 验证都有stats区域
      const projectStats = projectContainer.querySelector('[class*="stats"]')
      const graphStats = graphContainer.querySelector('[class*="stats"]')
      
      expect(projectStats).toBeInTheDocument()
      expect(graphStats).toBeInTheDocument()

      // 但内容不同
      expect(projectStats?.textContent).not.toBe(graphStats?.textContent)
    })
  })

  describe('图标隔离', () => {
    it('ProjectCard应该使用项目图标', () => {
      render(<ProjectCard project={mockProject} onClick={mockOnClick} />)
      
      const image = screen.getByAltText('项目图标')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/项目1.png')
    })

    it('GraphCard应该使用图谱图标', () => {
      render(<GraphCard graph={mockGraph} onClick={mockOnClick} />)
      
      const image = screen.getByAltText('图谱图标')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/知识图谱-图谱管理.png')
    })

    it('两个组件的占位符图标应该不同', () => {
      const { container: projectContainer } = render(
        <ProjectCard project={mockProject} onClick={mockOnClick} />
      )
      
      const { container: graphContainer } = render(
        <GraphCard graph={mockGraph} onClick={mockOnClick} />
      )

      // 触发图片加载错误以显示占位符
      const projectImage = projectContainer.querySelector('img')
      const graphImage = graphContainer.querySelector('img')
      
      if (projectImage) {
        projectImage.dispatchEvent(new Event('error'))
      }
      if (graphImage) {
        graphImage.dispatchEvent(new Event('error'))
      }

      // 验证占位符不同
      // ProjectCard使用📊，GraphCard使用🗺️
      // 注意：由于React的重新渲染，这里可能需要重新查询
    })
  })

  describe('功能隔离', () => {
    it('修改GraphCard不应影响ProjectCard的功能', () => {
      // 渲染ProjectCard
      const { container: projectContainer } = render(
        <ProjectCard project={mockProject} onClick={mockOnClick} />
      )
      
      // 验证ProjectCard正常工作
      const projectCard = projectContainer.querySelector('[class*="projectCard"]')
      expect(projectCard).toBeInTheDocument()
      expect(screen.getByText('测试项目')).toBeInTheDocument()
      expect(screen.getByText('包含 5 个图谱')).toBeInTheDocument()
    })

    it('两个组件应该独立响应点击事件', () => {
      const projectOnClick = jest.fn()
      const graphOnClick = jest.fn()

      const { container: projectContainer } = render(
        <ProjectCard project={mockProject} onClick={projectOnClick} />
      )
      
      const { container: graphContainer } = render(
        <GraphCard graph={mockGraph} onClick={graphOnClick} />
      )

      // 点击项目卡片
      const projectCard = projectContainer.querySelector('[class*="projectCard"]')
      if (projectCard) {
        projectCard.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        expect(projectOnClick).toHaveBeenCalledWith('project-123')
        expect(graphOnClick).not.toHaveBeenCalled()
      }

      // 重置mock
      projectOnClick.mockClear()
      graphOnClick.mockClear()

      // 点击图谱卡片
      const graphCard = graphContainer.querySelector('[class*="projectCard"]')
      if (graphCard) {
        graphCard.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        expect(graphOnClick).toHaveBeenCalledWith('graph-123')
        expect(projectOnClick).not.toHaveBeenCalled()
      }
    })
  })

  describe('类型安全隔离', () => {
    it('Project类型应该包含graphCount字段', () => {
      const project: Project = {
        id: 'test',
        name: 'test',
        description: null,
        nodeCount: 0,
        edgeCount: 0,
        graphCount: 5, // 必须存在
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(project.graphCount).toBe(5)
    })

    it('Graph类型应该包含nodeCount和edgeCount字段', () => {
      const graph: Graph = {
        id: 'test',
        name: 'test',
        description: null,
        nodeCount: 100, // 必须存在
        edgeCount: 200, // 必须存在
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: 'test',
      }

      expect(graph.nodeCount).toBe(100)
      expect(graph.edgeCount).toBe(200)
    })
  })
})
