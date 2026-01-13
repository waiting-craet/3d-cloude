'use client'

import { useState, useEffect } from 'react'

/**
 * 项目-图谱管理组件
 * 演示如何使用项目-图谱-节点API
 */

interface Project {
  id: string
  name: string
  description: string | null
  nodeCount: number
  edgeCount: number
  createdAt: string
}

interface Graph {
  id: string
  name: string
  description: string | null
  projectId: string
  nodeCount: number
  edgeCount: number
  isPublic: boolean
  createdAt: string
}

interface Node {
  id: string
  name: string
  type: string
  description: string | null
  x: number
  y: number
  z: number
  color: string
  imageUrl: string | null
  coverUrl: string | null
  projectId: string
  graphId: string
}

export default function ProjectGraphManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(false)

  // 加载所有项目
  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载项目的图谱
  const loadGraphs = async (projectId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/graphs`)
      const data = await res.json()
      setGraphs(data.graphs)
    } catch (error) {
      console.error('加载图谱失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载图谱的节点
  const loadNodes = async (graphId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/graphs/${graphId}/nodes`)
      const data = await res.json()
      setNodes(data.nodes)
    } catch (error) {
      console.error('加载节点失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建项目
  const createProject = async () => {
    const name = prompt('请输入项目名称:')
    if (!name) return

    const description = prompt('请输入项目描述 (可选):')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (data.project) {
        alert(`项目创建成功! ID: ${data.project.id}`)
        loadProjects()
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      alert('创建项目失败')
    }
  }

  // 创建图谱
  const createGraph = async () => {
    if (!selectedProject) {
      alert('请先选择一个项目')
      return
    }

    const name = prompt('请输入图谱名称:')
    if (!name) return

    const description = prompt('请输入图谱描述 (可选):')

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/graphs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (data.graph) {
        alert(`图谱创建成功! ID: ${data.graph.id}`)
        loadGraphs(selectedProject.id)
      }
    } catch (error) {
      console.error('创建图谱失败:', error)
      alert('创建图谱失败')
    }
  }

  // 创建节点
  const createNode = async () => {
    if (!selectedGraph) {
      alert('请先选择一个图谱')
      return
    }

    const name = prompt('请输入节点名称:')
    if (!name) return

    const type = prompt('请输入节点类型 (concept/entity/document):', 'concept')
    if (!type) return

    try {
      const res = await fetch(`/api/graphs/${selectedGraph.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5,
        }),
      })
      const data = await res.json()
      if (data.node) {
        alert(`节点创建成功! ID: ${data.node.id}`)
        loadNodes(selectedGraph.id)
      }
    } catch (error) {
      console.error('创建节点失败:', error)
      alert('创建节点失败')
    }
  }

  // 选择项目
  const selectProject = (project: Project) => {
    setSelectedProject(project)
    setSelectedGraph(null)
    setNodes([])
    loadGraphs(project.id)
  }

  // 选择图谱
  const selectGraph = (graph: Graph) => {
    setSelectedGraph(graph)
    loadNodes(graph.id)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">项目-图谱管理</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* 项目列表 */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">项目</h2>
            <button
              onClick={createProject}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + 新建
            </button>
          </div>
          {loading && <p className="text-gray-500">加载中...</p>}
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => selectProject(project)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedProject?.id === project.id ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-gray-500">
                  {project.nodeCount} 节点 · {project.edgeCount} 边
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 图谱列表 */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">图谱</h2>
            <button
              onClick={createGraph}
              disabled={!selectedProject}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              + 新建
            </button>
          </div>
          {!selectedProject && (
            <p className="text-gray-500">请先选择一个项目</p>
          )}
          <div className="space-y-2">
            {graphs.map((graph) => (
              <div
                key={graph.id}
                onClick={() => selectGraph(graph)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedGraph?.id === graph.id ? 'bg-green-50 border-green-500' : ''
                }`}
              >
                <div className="font-medium">{graph.name}</div>
                <div className="text-sm text-gray-500">
                  {graph.nodeCount} 节点 · {graph.edgeCount} 边
                </div>
                {graph.isPublic && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    公开
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 节点列表 */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">节点</h2>
            <button
              onClick={createNode}
              disabled={!selectedGraph}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
            >
              + 新建
            </button>
          </div>
          {!selectedGraph && (
            <p className="text-gray-500">请先选择一个图谱</p>
          )}
          <div className="space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <div className="font-medium">{node.name}</div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  类型: {node.type}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  位置: ({node.x.toFixed(1)}, {node.y.toFixed(1)}, {node.z.toFixed(1)})
                </div>
                {node.imageUrl && (
                  <div className="text-xs text-blue-500 mt-1">📷 有图片</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 当前选择信息 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">当前选择:</h3>
        <div className="text-sm space-y-1">
          <div>项目: {selectedProject?.name || '未选择'}</div>
          <div>图谱: {selectedGraph?.name || '未选择'}</div>
          <div>节点数: {nodes.length}</div>
        </div>
      </div>
    </div>
  )
}
