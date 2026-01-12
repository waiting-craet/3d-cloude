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
  projects: Project[]
  currentProject: Project | null
  currentGraph: KnowledgeGraph | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  setConnectingFromNode: (node: Node | null) => void
  setIsDragging: (isDragging: boolean) => void
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
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  connectingFromNode: null,
  isDragging: false,
  projects: [],
  currentProject: null,
  currentGraph: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setConnectingFromNode: (node) => set({ connectingFromNode: node }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentGraph: (graph) => set({ currentGraph: graph }),
  
  addNode: async (node) => {
    try {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      })
      
      if (response.ok) {
        const newNode = await response.json()
        set((state) => ({ nodes: [...state.nodes, newNode] }))
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
      const response = await fetch('/api/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edge),
      })
      
      if (response.ok) {
        const newEdge = await response.json()
        set((state) => ({ edges: [...state.edges, newEdge] }))
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
      const [nodesRes, edgesRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/edges'),
      ])
      
      if (nodesRes.ok && edgesRes.ok) {
        const nodes = await nodesRes.json()
        const edges = await edgesRes.json()
        set({ nodes, edges })
      } else {
        console.error('获取数据失败')
      }
    } catch (error) {
      console.error('获取图谱数据失败:', error)
    }
  },

  createProject: (projectName, graphName) => {
    const projectId = `project-${Date.now()}`
    const graphId = `graph-${Date.now()}`
    
    const newGraph: KnowledgeGraph = {
      id: graphId,
      name: graphName,
      projectId: projectId,
      nodeCount: 0,
      edgeCount: 0,
      createdAt: new Date().toISOString(),
    }
    
    const newProject: Project = {
      id: projectId,
      name: projectName,
      graphs: [newGraph],
    }
    
    set((state) => ({
      projects: [...state.projects, newProject],
      currentProject: newProject,
      currentGraph: newGraph,
      nodes: [],
      edges: [],
    }))

    // 保存到 localStorage
    const projects = [...get().projects]
    localStorage.setItem('projects', JSON.stringify(projects))
    localStorage.setItem('currentProjectId', projectId)
    localStorage.setItem('currentGraphId', graphId)
  },

  addGraphToProject: (projectId, graphName) => {
    const graphId = `graph-${Date.now()}`
    
    const newGraph: KnowledgeGraph = {
      id: graphId,
      name: graphName,
      projectId: projectId,
      nodeCount: 0,
      edgeCount: 0,
      createdAt: new Date().toISOString(),
    }
    
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, graphs: [...project.graphs, newGraph] }
          : project
      ),
      currentGraph: newGraph,
      nodes: [],
      edges: [],
    }))

    // 保存到 localStorage
    const projects = get().projects
    localStorage.setItem('projects', JSON.stringify(projects))
    localStorage.setItem('currentGraphId', graphId)
  },

  switchGraph: (projectId, graphId) => {
    const state = get()
    const project = state.projects.find((p) => p.id === projectId)
    const graph = project?.graphs.find((g) => g.id === graphId)
    
    if (project && graph) {
      set({
        currentProject: project,
        currentGraph: graph,
        nodes: [],
        edges: [],
      })

      // 保存到 localStorage
      localStorage.setItem('currentProjectId', projectId)
      localStorage.setItem('currentGraphId', graphId)

      // 这里可以从后端加载对应图谱的数据
      // 暂时清空节点和边
    }
  },
}))
