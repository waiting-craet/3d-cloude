import { create } from 'zustand'

// Throttle function for caching
let cacheTimer: NodeJS.Timeout | null = null
const CACHE_THROTTLE_MS = 1000 // 1 second throttle

function cacheNodePositions(graphId: string, nodes: Node[]) {
  if (cacheTimer) {
    clearTimeout(cacheTimer)
  }
  
  cacheTimer = setTimeout(() => {
    try {
      const cacheKey = `graph_positions_${graphId}`
      const positionsData = {
        graphId,
        positions: nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          z: node.z,
        })),
        timestamp: new Date().toISOString(),
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(positionsData))
      console.log('✅ [缓存] 节点位置已缓存到 localStorage:', nodes.length, '个节点')
    } catch (error) {
      console.warn('⚠️ [缓存] 无法缓存节点位置到 localStorage:', error)
    }
  }, CACHE_THROTTLE_MS)
}

function restoreCachedPositions(graphId: string): Array<{ id: string; x: number; y: number; z: number }> | null {
  try {
    const cacheKey = `graph_positions_${graphId}`
    const cached = localStorage.getItem(cacheKey)
    
    if (!cached) {
      return null
    }
    
    const data = JSON.parse(cached)
    
    // Validate cache data
    if (!data.graphId || data.graphId !== graphId || !Array.isArray(data.positions)) {
      console.warn('⚠️ [缓存] 缓存数据格式无效，清除缓存')
      localStorage.removeItem(cacheKey)
      return null
    }
    
    // Check if cache is not too old (e.g., 24 hours)
    const cacheAge = Date.now() - new Date(data.timestamp).getTime()
    const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours
    
    if (cacheAge > MAX_CACHE_AGE) {
      console.log('⚠️ [缓存] 缓存已过期，清除缓存')
      localStorage.removeItem(cacheKey)
      return null
    }
    
    console.log('✅ [缓存] 从 localStorage 恢复节点位置:', data.positions.length, '个节点')
    return data.positions
  } catch (error) {
    console.warn('⚠️ [缓存] 无法从 localStorage 恢复节点位置:', error)
    return null
  }
}

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
  textColor?: string
  size?: number
  shape?: string
  isGlowing?: boolean
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
  settings?: any  // 图谱设置（包括保存的位置数据）
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
  error: string | null
  projects: Project[]
  currentProject: Project | null
  currentGraph: KnowledgeGraph | null
  theme: 'light' | 'dark'
  hasUnsavedChanges: boolean
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  setConnectingFromNode: (node: Node | null) => void
  setIsDragging: (isDragging: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setCurrentGraph: (graph: KnowledgeGraph | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setHasUnsavedChanges: (value: boolean) => void
  addNode: (node: Partial<Node>) => Promise<void>
  addEdge: (edge: Partial<Edge>) => Promise<void>
  updateNodePosition: (id: string, x: number, y: number, z: number) => void
  updateNode: (id: string, updates: Partial<Node>) => Promise<void>
  updateNodeLocal: (id: string, updates: Partial<Node>) => void
  updateNodeName: (id: string, name: string) => void
  deleteNode: (id: string) => Promise<void>
  fetchGraph: () => Promise<void>
  loadGraphById: (graphId: string) => Promise<void>
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
  error: null,
  projects: [],
  currentProject: null,
  currentGraph: null,
  theme: 'dark',
  hasUnsavedChanges: false,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setConnectingFromNode: (node) => set({ connectingFromNode: node }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentGraph: (graph) => set({ currentGraph: graph }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
    try {
      localStorage.setItem('theme', theme)
      console.log('✅ 主题已保存:', theme)
    } catch (error) {
      console.warn('⚠️ 无法保存主题到 localStorage:', error)
    }
  },
  
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('theme', newTheme)
        console.log('✅ 主题已切换:', newTheme)
      } catch (error) {
        console.warn('⚠️ 无法保存主题到 localStorage:', error)
      }
      return { theme: newTheme }
    })
  },
  
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
    // Validate coordinates are finite numbers
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
      console.error('Invalid node position: coordinates must be finite numbers', { id, x, y, z })
      return
    }
    
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, x, y, z } : node
      ),
      selectedNode: state.selectedNode?.id === id 
        ? { ...state.selectedNode, x, y, z }
        : state.selectedNode,
      hasUnsavedChanges: true,
    }))
    
    // Cache positions to localStorage with throttling
    const state = get()
    if (state.currentGraph?.id) {
      cacheNodePositions(state.currentGraph.id, state.nodes)
    }
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

  updateNodeLocal: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
      selectedNode: state.selectedNode?.id === id 
        ? { ...state.selectedNode, ...updates }
        : state.selectedNode,
    }))
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
      
      // 使用图谱专属API加载数据（包括完整的图谱信息以获取settings）
      const [graphRes, edgesRes] = await Promise.all([
        fetch(`/api/graphs/${currentGraph.id}`),
        fetch(`/api/graphs/${currentGraph.id}/edges`),
      ])
      
      if (graphRes.ok && edgesRes.ok) {
        const graphData = await graphRes.json()
        const edgesData = await edgesRes.json()
        
        let nodes = graphData.nodes || []
        const edges = edgesData.edges || []
        const graph = graphData.graph
        
        // 尝试恢复保存的位置数据（优先级：数据库 > localStorage）
        let positionsRestored = false
        
        // 首先尝试从数据库的 settings.workflowPositions 恢复
        if (graph?.settings) {
          try {
            const settings = typeof graph.settings === 'string' 
              ? JSON.parse(graph.settings) 
              : graph.settings
            
            if (settings.workflowPositions?.nodes && Array.isArray(settings.workflowPositions.nodes)) {
              const savedPositions = settings.workflowPositions.nodes
              console.log('🔄 [fetchGraph] 发现数据库中保存的位置数据，应用到节点...')
              console.log('   保存的位置数:', savedPositions.length)
              
              // Create a map for quick lookup
              const savedMap = new Map(savedPositions.map((p: any) => [p.id, p]))
              
              // Apply saved positions to nodes
              nodes = nodes.map(node => {
                const saved = savedMap.get(node.id)
                if (saved) {
                  return {
                    ...node,
                    x: saved.x,
                    y: saved.y,
                    z: node.z || 0, // 保持原有z坐标
                  }
                }
                return node
              })
              
              positionsRestored = true
              console.log('✅ [fetchGraph] 已应用数据库中保存的位置数据')
              
              // 清除 localStorage 缓存（因为数据库数据更权威）
              try {
                const cacheKey = `graph_positions_${currentGraph.id}`
                localStorage.removeItem(cacheKey)
              } catch (error) {
                console.warn('⚠️ [fetchGraph] 清除缓存失败:', error)
              }
            }
          } catch (error) {
            console.warn('⚠️ [fetchGraph] 解析 settings 失败:', error)
          }
        }
        
        // 如果数据库中没有保存的位置，尝试从 localStorage 恢复缓存
        if (!positionsRestored) {
          const cachedPositions = restoreCachedPositions(currentGraph.id)
          
          if (cachedPositions && cachedPositions.length > 0) {
            console.log('🔄 [fetchGraph] 发现 localStorage 缓存的位置数据，应用到节点...')
            
            // Create a map for quick lookup
            const cachedMap = new Map(cachedPositions.map(p => [p.id, p]))
            
            // Apply cached positions to nodes
            nodes = nodes.map(node => {
              const cached = cachedMap.get(node.id)
              if (cached) {
                return {
                  ...node,
                  x: cached.x,
                  y: cached.y,
                  z: cached.z,
                }
              }
              return node
            })
            
            positionsRestored = true
            console.log('✅ [fetchGraph] 已应用 localStorage 缓存的位置数据')
            
            // Mark as having unsaved changes since we restored from cache
            set({ hasUnsavedChanges: true })
          }
        }
        
        console.log('✅ 图谱数据加载成功:', nodes.length, '个节点,', edges.length, '条边')
        set({ nodes, edges, isLoading: false })
      } else {
        console.error('❌ 获取数据失败 - 图谱:', graphRes.status, '边:', edgesRes.status)
        set({ nodes: [], edges: [], isLoading: false })
      }
    } catch (error) {
      console.error('❌ 获取图谱数据失败:', error)
      set({ nodes: [], edges: [], isLoading: false })
    }
  },

  loadGraphById: async (graphId: string) => {
    try {
      console.log('🔄 [loadGraphById] 开始加载图谱:', graphId)
      set({ isLoading: true, error: null })
      
      // 1. 获取图谱详情（包括节点和边）
      const graphResponse = await fetch(`/api/graphs/${graphId}`)
      
      if (!graphResponse.ok) {
        if (graphResponse.status === 404) {
          throw new Error('图谱不存在或已被删除')
        }
        throw new Error('加载图谱失败')
      }
      
      const graphData = await graphResponse.json()
      const { graph, nodes, edges } = graphData
      
      console.log('✅ [loadGraphById] 图谱数据获取成功:', graph.name)
      console.log('   节点数:', nodes?.length || 0, '边数:', edges?.length || 0)
      
      // 2. 查找或加载项目信息
      let project = get().projects.find(p => p.id === graph.projectId)
      
      if (!project) {
        console.log('🔄 [loadGraphById] 项目不在列表中，刷新项目列表...')
        await get().refreshProjects()
        project = get().projects.find(p => p.id === graph.projectId)
      }
      
      // 3. 构建图谱对象
      const knowledgeGraph: KnowledgeGraph = {
        id: graph.id,
        name: graph.name,
        projectId: graph.projectId,
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
        createdAt: graph.createdAt,
        settings: graph.settings,  // 包含settings字段（保存的位置数据）
      }
      
      // 4. 尝试恢复保存的位置数据（优先级：数据库 > localStorage）
      let finalNodes = nodes || []
      let positionsRestored = false
      let restoredFromCache = false
      
      // 4.1 首先尝试从数据库的 settings.workflowPositions 恢复
      if (graph.settings) {
        try {
          const settings = typeof graph.settings === 'string' 
            ? JSON.parse(graph.settings) 
            : graph.settings
          
          if (settings.workflowPositions?.nodes && Array.isArray(settings.workflowPositions.nodes)) {
            const savedPositions = settings.workflowPositions.nodes
            console.log('🔄 [loadGraphById] 发现数据库中保存的位置数据，应用到节点...')
            console.log('   保存的位置数:', savedPositions.length)
            console.log('   保存时间:', settings.workflowPositions.lastSaved)
            
            // Create a map for quick lookup
            const savedMap = new Map(savedPositions.map((p: any) => [p.id, p]))
            
            // Apply saved positions to nodes
            finalNodes = finalNodes.map(node => {
              const saved = savedMap.get(node.id)
              if (saved) {
                // 对于3D图谱，使用保存的x, y作为x, y坐标，z保持原值或设为0
                // 如果metadata中标记了is3D，说明保存的是3D位置
                const is3D = settings.workflowPositions.metadata?.is3D
                return {
                  ...node,
                  x: saved.x,
                  y: saved.y,
                  z: is3D ? (node.z || 0) : (node.z || 0), // 保持原有z坐标
                }
              }
              return node
            })
            
            positionsRestored = true
            console.log('✅ [loadGraphById] 已应用数据库中保存的位置数据')
            
            // 清除 localStorage 缓存（因为数据库数据更权威）
            try {
              const cacheKey = `graph_positions_${graphId}`
              localStorage.removeItem(cacheKey)
              console.log('🗑️ [loadGraphById] 已清除 localStorage 缓存')
            } catch (error) {
              console.warn('⚠️ [loadGraphById] 清除缓存失败:', error)
            }
          }
        } catch (error) {
          console.warn('⚠️ [loadGraphById] 解析 settings 失败:', error)
        }
      }
      
      // 4.2 如果数据库中没有保存的位置，尝试从 localStorage 恢复缓存
      if (!positionsRestored) {
        const cachedPositions = restoreCachedPositions(graphId)
        
        if (cachedPositions && cachedPositions.length > 0) {
          console.log('🔄 [loadGraphById] 发现 localStorage 缓存的位置数据，应用到节点...')
          
          // Create a map for quick lookup
          const cachedMap = new Map(cachedPositions.map(p => [p.id, p]))
          
          // Apply cached positions to nodes
          finalNodes = finalNodes.map(node => {
            const cached = cachedMap.get(node.id)
            if (cached) {
              return {
                ...node,
                x: cached.x,
                y: cached.y,
                z: cached.z,
              }
            }
            return node
          })
          
          positionsRestored = true
          restoredFromCache = true
          console.log('✅ [loadGraphById] 已应用 localStorage 缓存的位置数据')
          
          // Mark as having unsaved changes since we restored from cache
          set({ hasUnsavedChanges: true })
        }
      }
      
      // 5. 更新状态
      set({
        currentProject: project || null,
        currentGraph: knowledgeGraph,
        nodes: finalNodes,
        edges: edges || [],
        isLoading: false,
        error: null,
      })
      
      // 6. 保存到 localStorage
      if (project) {
        localStorage.setItem('currentProjectId', project.id)
      }
      localStorage.setItem('currentGraphId', graphId)
      
      console.log('✅ [loadGraphById] 图谱加载完成')
      console.log('   项目:', project?.name || '未知')
      console.log('   图谱:', knowledgeGraph.name)
      
    } catch (error) {
      console.error('❌ [loadGraphById] 加载图谱失败:', error)
      const errorMessage = error instanceof Error ? error.message : '加载图谱失败'
      set({ 
        error: errorMessage,
        isLoading: false,
        nodes: [],
        edges: [],
      })
      throw error
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
            settings: null,  // 新图谱没有保存的设置
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
          settings: null,  // 新图谱没有保存的设置
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


// 初始化主题：从 localStorage 恢复用户的主题选择
if (typeof window !== 'undefined') {
  try {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      useGraphStore.setState({ theme: savedTheme })
      console.log('✅ 主题已从 localStorage 恢复:', savedTheme)
    } else if (savedTheme !== null) {
      // 如果保存的值无效，清理并使用默认值
      console.warn('⚠️ 检测到无效的主题值:', savedTheme, '，使用默认主题')
      localStorage.removeItem('theme')
    }
  } catch (error) {
    console.warn('⚠️ 无法从 localStorage 读取主题:', error)
  }
}
