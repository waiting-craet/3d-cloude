import { create } from 'zustand'

interface Node {
  id: string
  name: string
  type: string
  description?: string
  x: number
  y: number
  z: number
  color: string
}

interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  weight: number
}

interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNode: (node: Node | null) => void
  addNode: (node: Partial<Node>) => Promise<void>
  addEdge: (edge: Partial<Edge>) => Promise<void>
  fetchGraph: () => Promise<void>
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  addNode: async (node) => {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    })
    
    if (response.ok) {
      const newNode = await response.json()
      set((state) => ({ nodes: [...state.nodes, newNode] }))
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
      }
    } catch (error) {
      console.error('获取图谱数据失败:', error)
    }
  },
}))
