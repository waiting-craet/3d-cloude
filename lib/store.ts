import { create } from 'zustand'

export interface Node {
  id: string
  name: string
  type: string
  description?: string
  tags?: string
  x: number
  y: number
  z: number
  color: string
  size?: number
  imageUrl?: string
  videoUrl?: string
}

export interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  weight: number
}

export interface KnowledgeGraph {
  id: string
  name: string
  projectId: string
  nodeCount: number
  edgeCount: number
  createdAt: string
}

export interface Project {
  id: string
  name: string
  graphs: KnowledgeGraph[]
}

export interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  connectingFromNode: Node | null
  isDragging: boolean
  isLoading: boolean
  projects: Project[]
  currentProject: Project | null
  currentGraph: KnowledgeGraph | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  setConnectingFromNode: (node: Node | null) => void
  setIsDragging: (isDragging: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setCurrentGraph: (graph: KnowledgeGraph | null) => void
  addNode: (node: Partial<Node>) => Promise<void>
  addEdge: (edge: Partial<Edge>) => Promise<void>
  updateNodePosition: (id: string, x: number, y: number, z: number) => void
  updateNode: (id: string, updates: Partial<Node>) => Promise<void>
  updateNodeName: (id: string, name: string) => void
  deleteNode: (id: string) => Promise<void>
  fetchGraph: () => Promise<void>
  createProject: (projectName: string, graphName: string) => void
  addGraphToProject: (projectId: string, graphName: string) => void
  switchGraph: (projectId: string, graphId: string) => void
  refreshProjects: () => Promise<void>
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  connectingFromNode: null,
  isDragging: false,
  isLoading: false,
  projects: [],
  currentProject: null,
  currentGraph: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setConnectingFromNode: (node) => set({ connectingFromNode: node }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentGraph: (graph) => set({ currentGraph: graph }),
  
  addNode: async (node) => {
    try {
      const state = get()
      const currentGraph = state.currentGraph
      
      if (!currentGraph) {
        console.error('请先选择一个图谱')
        return
      }
      
      // 使用图谱API创建节点
      const response = await fetch(`/api/graphs/${currentGraph.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newNode = data.node
        set((state) => ({ nodes: [...state.nodes, newNode] }))
        
        // 更新图谱的节点计数（使用 API 返回的最新统计）
        if (data.graph) {
          set((state) => ({
            currentGraph: state.currentGraph ? {
              ...state.currentGraph,
              nodeCount: data.graph.nodeCount,
              edgeCount: data.graph.edgeCount,
            } : null
          }))
          
          // 同时更新 projects 列表中的统计信息
          set((state) => ({
            projects: state.projects.map(project => 
              project.id === state.currentProject?.id
                ? {
                    ...project,
                    graphs: project.graphs.map(graph =>
                      graph.id === currentGraph.id
                        ? { ...graph, nodeCount: data.graph.nodeCount, edgeCount: data.graph.edgeCount }
                        : graph
                    ),
                  }
                : project
            ),
          }))
        }
      } else {
        const error = await response.json()
        console.error('创建节点失败:', error)
      }
    } catch (error) {
      console.error('创建节点失败:', error)
    }
  },
  
  addEdge: async (edge) => {
    try {
      const state = get()
      const currentGraph = state.currentGraph
      
      if (!currentGraph) {
        console.error('请先选择一个图谱')
        return
      }
      
      // 使用图谱API创建边
      const response = await fetch(`/api/graphs/${currentGraph.id}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edge),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newEdge = data.edge
        set((state) => ({ edges: [...state.edges, newEdge] }))
        
        // 更新图谱的边计数（使用 API 返回的最新统计）
        if (data.graph) {
          set((state) => ({
            currentGraph: state.currentGraph ? {
              ...state.currentGraph,
              nodeCount: data.graph.nodeCount,
              edgeCount: data.graph.edgeCount,
            } : null
          }))
          
          // 同时更新 projects 列表中的统计信息
          set((state) => ({
            projects: state.projects.map(project => 
              project.id === state.currentProject?.id
                ? {
                    ...project,
                    graphs: project.graphs.map(graph =>
                      graph.id === currentGraph.id
                        ? { ...graph, nodeCount: data.graph.nodeCount, edgeCount: data.graph.edgeCount }
                        : graph
                    ),
                  }
                : project
            ),
          }))
        }
      } else {
        const error = await response.json()
        console.error('创建关系失败:', error)
      }
    } catch (error) {
      console.error('创建关系失败:', error)
    }
  },
  
  updateNodePosition: (id, x, y, z) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, x, y, z } : node
      ),
      selectedNode: state.selectedNode?.id === id 
        ? { ...state.selectedNode, x, y, z }
        : state.selectedNode,
    }))
  },

  updateNode: async (id, updates) => {
    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        const updatedNode = await response.json()
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? updatedNode : node
          ),
          selectedNode: state.selectedNode?.id === id ? updatedNode : state.selectedNode,
        }))
      } else {
        const error = await response.json()
        console.error('更新节点失败:', error)
      }
    } catch (error) {
      console.error('更新节点失败:', error)
    }
  },

  updateNodeName: (id, name) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, name } : node
      ),
      selectedNode: state.selectedNode?.id === id 
        ? { ...state.selectedNode, name }
        : state.selectedNode,
    }))
  },

  deleteNode: async (id) => {
    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter((edge) => 
            edge.fromNodeId !== id && edge.toNodeId !== id
          ),
          selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
        }))
      } else {
        const error = await response.json()
        console.error('删除节点失败:', error)
      }
    } catch (error) {
      console.error('删除节点失败:', error)
    }
  },
  
  fetchGraph: async () => {
    try {
      const state = get()
      const currentGraph = state.currentGraph
      
      // 如果没有选择图谱，清空数据
      if (!currentGraph) {
        console.log('⚠️ 没有选择图谱，清空节点和边')
        set({ nodes: [], edges: [], isLoading: false })
        return
      }
      
      console.log('🔄 正在加载图谱数据:', currentGraph.name, currentGraph.id)
      set({ isLoading: true })
      
      // 使用图谱专属API加载数据
      const [nodesRes, edgesRes] = await Promise.all([
        fetch(`/api/graphs/${currentGraph.id}/nodes`),
        fetch(`/api/graphs/${currentGraph.id}/edges`),
      ])
      
      if (nodesRes.ok && edgesRes.ok) {
        const nodesData = await nodesRes.json()
        const edgesData = await edgesRes.json()
        
        const nodes = nodesData.nodes || []
        const edges = edgesData.edges || []
        
        console.log('✅ 图谱数据加载成功:', nodes.length, '个节点,', edges.length, '条边')
        set({ nodes, edges, isLoading: false })
      } else {
        console.error('❌ 获取数据失败 - 节点:', nodesRes.status, '边:', edgesRes.status)
        set({ nodes: [], edges: [], isLoading: false })
      }
    } catch (error) {
      console.error('❌ 获取图谱数据失败:', error)
      set({ nodes: [], edges: [], isLoading: false })
    }
  },

  createProject: async (projectName, graphName) => {
    try {
      console.log('🔄 开始创建项目:', projectName, '图谱:', graphName)
      
      // 1. 创建项目
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: `项目: ${projectName}`,
        }),
      })
      
      if (!projectRes.ok) {
        const error = await projectRes.json()
        throw new Error(error.error || '创建项目失败')
      }
      
      const projectData = await projectRes.json()
      const project = projectData.project
      console.log('✅ 项目创建成功:', project.id)
      
      // 2. 在项目中创建图谱
      const graphRes = await fetch(`/api/projects/${project.id}/graphs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: graphName,
          description: `图谱: ${graphName}`,
        }),
      })
      
      if (!graphRes.ok) {
        const error = await graphRes.json()
        throw new Error(error.error || '创建图谱失败')
      }
      
      const graphData = await graphRes.json()
      const graph = graphData.graph
      console.log('✅ 图谱创建成功:', graph.id)
      
      // 3. 重新从数据库加载所有项目（带重试机制）
      console.log('🔄 重新加载项目列表...')
      
      let projects: any[] = []
      let newProject: any = null
      let newGraph: any = null
      let retryCount = 0
      const maxRetries = 3
      
      // 重试逻辑：确保数据库写入已完成
      while (retryCount < maxRetries) {
        // 添加短暂延迟，让数据库有时间同步
        if (retryCount > 0) {
          console.log(`⏳ 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }
        
        const projectsRes = await fetch('/api/projects/with-graphs', {
          // 添加缓存控制，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (!projectsRes.ok) {
          throw new Error('重新加载项目列表失败')
        }
        
        const projectsData = await projectsRes.json()
        projects = projectsData.projects || []
        console.log('✅ 项目列表加载成功，共', projects.length, '个项目')
        
        // 找到刚创建的项目和图谱
        newProject = projects.find((p: any) => p.id === project.id)
        newGraph = newProject?.graphs.find((g: any) => g.id === graph.id)
        
        if (newProject && newGraph) {
          console.log('✅ 找到新创建的项目和图谱')
          break
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          console.log('⚠️ 未找到新创建的数据，准备重试...')
        }
      }
      
      // 如果重试后仍未找到，使用创建时返回的数据构建对象
      if (!newProject || !newGraph) {
        console.log('⚠️ 重试后仍未找到，使用创建响应数据')
        newProject = {
          id: project.id,
          name: project.name,
          graphs: [{
            id: graph.id,
            name: graph.name,
            projectId: project.id,
            nodeCount: 0,
            edgeCount: 0,
            createdAt: graph.createdAt,
          }],
        }
        newGraph = newProject.graphs[0]
        
        // 将新项目添加到列表中
        projects = [newProject, ...projects.filter((p: any) => p.id !== project.id)]
      }
      
      // 4. 更新 GraphStore 状态
      set({
        projects: projects,
        currentProject: newProject,
        currentGraph: newGraph,
        nodes: [],
        edges: [],
      })

      // 5. 保存到 localStorage
      localStorage.setItem('currentProjectId', project.id)
      localStorage.setItem('currentGraphId', graph.id)
      
      console.log('✅ 项目和图谱创建成功，数据已刷新')
      console.log('   项目:', newProject.name, '(', newProject.id, ')')
      console.log('   图谱:', newGraph.name, '(', newGraph.id, ')')
    } catch (error) {
      console.error('❌ 创建项目失败:', error)
      throw error
    }
  },

  addGraphToProject: async (projectId, graphName) => {
    try {
      console.log('🔄 开始添加图谱:', graphName, '到项目:', projectId)
      
      // 1. 在项目中创建图谱
      const graphRes = await fetch(`/api/projects/${projectId}/graphs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: graphName,
          description: `图谱: ${graphName}`,
        }),
      })
      
      if (!graphRes.ok) {
        const error = await graphRes.json()
        throw new Error(error.error || '创建图谱失败')
      }
      
      const graphData = await graphRes.json()
      const graph = graphData.graph
      console.log('✅ 图谱创建成功:', graph.id)
      
      // 2. 重新从数据库加载所有项目（带重试机制）
      console.log('🔄 重新加载项目列表...')
      
      let projects: any[] = []
      let project: any = null
      let newGraph: any = null
      let retryCount = 0
      const maxRetries = 3
      
      // 重试逻辑：确保数据库写入已完成
      while (retryCount < maxRetries) {
        // 添加短暂延迟，让数据库有时间同步
        if (retryCount > 0) {
          console.log(`⏳ 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }
        
        const projectsRes = await fetch('/api/projects/with-graphs', {
          // 添加缓存控制，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (!projectsRes.ok) {
          throw new Error('重新加载项目列表失败')
        }
        
        const projectsData = await projectsRes.json()
        projects = projectsData.projects || []
        console.log('✅ 项目列表加载成功，共', projects.length, '个项目')
        
        // 找到对应的项目和新创建的图谱
        project = projects.find((p: any) => p.id === projectId)
        newGraph = project?.graphs.find((g: any) => g.id === graph.id)
        
        if (project && newGraph) {
          console.log('✅ 找到项目和新创建的图谱')
          break
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          console.log('⚠️ 未找到新创建的图谱，准备重试...')
        }
      }
      
      // 如果重试后仍未找到，使用创建时返回的数据构建对象
      if (!project || !newGraph) {
        console.log('⚠️ 重试后仍未找到，使用创建响应数据')
        
        // 找到现有项目或创建新的项目对象
        project = projects.find((p: any) => p.id === projectId)
        if (!project) {
          throw new Error('无法找到目标项目')
        }
        
        newGraph = {
          id: graph.id,
          name: graph.name,
          projectId: projectId,
          nodeCount: 0,
          edgeCount: 0,
          createdAt: graph.createdAt,
        }
        
        // 将新图谱添加到项目的图谱列表中
        project = {
          ...project,
          graphs: [newGraph, ...(project.graphs || []).filter((g: any) => g.id !== graph.id)],
        }
        
        // 更新项目列表
        projects = projects.map((p: any) => p.id === projectId ? project : p)
      }
      
      // 3. 更新 GraphStore 状态
      set({
        projects: projects,
        currentProject: project,
        currentGraph: newGraph,
        nodes: [],
        edges: [],
      })

      // 4. 保存到 localStorage
      localStorage.setItem('currentProjectId', projectId)
      localStorage.setItem('currentGraphId', graph.id)
      
      console.log('✅ 图谱添加成功，数据已刷新')
      console.log('   项目:', project.name, '(', project.id, ')')
      console.log('   图谱:', newGraph.name, '(', newGraph.id, ')')
    } catch (error) {
      console.error('❌ 添加图谱失败:', error)
      throw error
    }
  },

  switchGraph: async (projectId, graphId) => {
    const state = get()
    const project = state.projects.find((p) => p.id === projectId)
    const graph = project?.graphs.find((g) => g.id === graphId)
    
    if (project && graph) {
      // 先设置当前项目和图谱
      set({
        currentProject: project,
        currentGraph: graph,
        nodes: [],
        edges: [],
        isLoading: true,
      })

      // 保存到 localStorage
      localStorage.setItem('currentProjectId', projectId)
      localStorage.setItem('currentGraphId', graphId)

      // 从数据库加载对应图谱的节点和边
      try {
        console.log('正在加载图谱数据:', graphId)
        
        const [nodesRes, edgesRes] = await Promise.all([
          fetch(`/api/graphs/${graphId}/nodes`),
          fetch(`/api/graphs/${graphId}/edges`),
        ])
        
        if (nodesRes.ok && edgesRes.ok) {
          const nodesData = await nodesRes.json()
          const edgesData = await edgesRes.json()
          
          console.log('加载的节点数:', nodesData.nodes?.length || 0)
          console.log('加载的边数:', edgesData.edges?.length || 0)
          
          set({ 
            nodes: nodesData.nodes || [], 
            edges: edgesData.edges || [],
            isLoading: false,
          })
        } else {
          console.error('加载图谱数据失败')
          console.error('节点响应状态:', nodesRes.status)
          console.error('边响应状态:', edgesRes.status)
          set({ isLoading: false })
        }
      } catch (error) {
        console.error('加载图谱数据时出错:', error)
        set({ isLoading: false })
      }
    }
  },

  refreshProjects: async () => {
    try {
      console.log('🔄 [refreshProjects] 开始刷新项目列表...')
      
      const state = get()
      const currentProjectId = state.currentProject?.id
      const currentGraphId = state.currentGraph?.id
      
      console.log('🔍 [refreshProjects] 当前选择:', {
        projectId: currentProjectId,
        graphId: currentGraphId,
      })
      
      let projects: any[] = []
      let retryCount = 0
      const maxRetries = 3
      let verified = false
      
      // 重试逻辑：确保数据库写入已完成（使用指数退避）
      while (retryCount < maxRetries && !verified) {
        // 添加短暂延迟，让数据库有时间同步（指数退避：500ms, 1000ms, 1500ms）
        if (retryCount > 0) {
          const delay = 500 * retryCount
          console.log(`⏳ [refreshProjects] 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries}, 延迟 ${delay}ms)`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        console.log(`🌐 [refreshProjects] 尝试 ${retryCount + 1}/${maxRetries}: 获取项目列表...`)
        const projectsRes = await fetch('/api/projects/with-graphs', {
          // 添加缓存控制，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (!projectsRes.ok) {
          console.error(`❌ [refreshProjects] API 请求失败: ${projectsRes.status}`)
          throw new Error('加载项目列表失败')
        }
        
        const projectsData = await projectsRes.json()
        projects = projectsData.projects || []
        console.log(`✅ [refreshProjects] 项目列表加载成功，共 ${projects.length} 个项目`)
        
        // 如果有当前项目和图谱，验证它们是否存在
        if (currentProjectId && currentGraphId) {
          const project = projects.find((p: any) => p.id === currentProjectId)
          const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
          
          console.log(`🔍 [refreshProjects] 查找当前项目/图谱:`, {
            projectFound: !!project,
            graphFound: !!graph,
            projectName: project?.name,
            graphName: graph?.name,
          })
          
          if (project && graph) {
            console.log('✅ [refreshProjects] 找到当前项目和图谱')
            console.log('   项目:', project.name, '(', project.id, ')')
            console.log('   图谱:', graph.name, '(', graph.id, ')')
            console.log('   节点数:', graph.nodeCount, '边数:', graph.edgeCount)
            
            // 更新状态，保持当前选中的项目和图谱
            set({
              projects: projects,
              currentProject: project,
              currentGraph: graph,
            })
            
            verified = true
            console.log('✅ [refreshProjects] 验证成功，状态已更新')
            return
          } else {
            console.log(`⚠️ [refreshProjects] 未找到当前项目/图谱，继续重试...`)
          }
        } else {
          // 没有当前选择，直接更新项目列表
          console.log('✅ [refreshProjects] 无当前选择，直接更新项目列表')
          set({ projects: projects })
          verified = true
          return
        }
        
        retryCount++
      }
      
      // 如果验证失败，仍然更新projects列表
      if (!verified) {
        console.warn('⚠️ [refreshProjects] 验证失败，但仍更新项目列表')
        set({ projects: projects })
      }
      
    } catch (error) {
      console.error('❌ [refreshProjects] 刷新项目列表失败:', error)
      throw error
    }
  },
}))
