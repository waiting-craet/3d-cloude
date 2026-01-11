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
  size?: number
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
  connectingFromNode: Node | null
  isDragging: boolean
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  setConnectingFromNode: (node: Node | null) => void
  setIsDragging: (isDragging: boolean) => void
  addNode: (node: Partial<Node>) => Promise<void>
  addEdge: (edge: Partial<Edge>) => Promise<void>
  updateNodePosition: (id: string, x: number, y: number, z: number) => void
  updateNode: (id: string, updates: Partial<Node>) => Promise<void>
  fetchGraph: () => Promise<void>
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  connectingFromNode: null,
  isDragging: false,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setConnectingFromNode: (node) => set({ connectingFromNode: node }),
  setIsDragging: (isDragging) => set({ isDragging }),
  
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
}))
