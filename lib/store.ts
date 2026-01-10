import { create } from 'zustand'

export interface Node {
  id: string
  name: string
  type: string
  description?: string
  x: number
  y: number
  z: number
  color: string
}

export interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  weight: number
}

export interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  editingNodeId: string | null
  connectingFromNode: Node | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  setEditingNodeId: (id: string | null) => void
  setConnectingFromNode: (node: Node | null) => void
  updateNodeName: (id: string, name: string) => void
  addNode: (node: Partial<Node>) => Promise<void>
  addEdge: (edge: Partial<Edge>) => Promise<void>
  deleteNode: (id: string) => Promise<void>
  deleteEdge: (id: string) => Promise<void>
  fetchGraph: () => Promise<void>
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  editingNodeId: null,
  connectingFromNode: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  setConnectingFromNode: (node) => set({ connectingFromNode: node }),
  
  updateNodeName: (id, name) => {
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === id ? { ...n, name } : n),
      selectedNode: state.selectedNode?.id === id ? { ...state.selectedNode, name } : state.selectedNode,
    }))
  },
  
  addNode: async (node) => {
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
  },
  
  addEdge: async (edge) => {
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
  },
  
  deleteNode: async (id) => {
    const response = await fetch(`/api/nodes/${id}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
      }))
    } else {
      const error = await response.json()
      console.error('删除节点失败:', error)
    }
  },
  
  deleteEdge: async (id) => {
    const response = await fetch(`/api/edges/${id}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id),
      }))
    } else {
      const error = await response.json()
      console.error('删除关系失败:', error)
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
        console.error('获取数据失败:', {
          nodes: nodesRes.status,
          edges: edgesRes.status,
        })
      }
    } catch (error) {
      console.error('获取图谱数据失败:', error)
    }
  },
}))
