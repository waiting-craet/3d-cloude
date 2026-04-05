'use client'

import { useState, useEffect } from 'react'
import DeleteButton from './DeleteButton'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import LoadingSpinner from './LoadingSpinner'
import UIIcon from './UIIcon'

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

interface DeleteDialogState {
  isOpen: boolean
  type: 'project' | 'graph' | null
  id: string | null
  name: string | null
  stats: {
    nodeCount: number
    edgeCount: number
    graphCount?: number
  }
}

export default function ProjectGraphManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(false)
  
  // 删除相关状态
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: null,
    id: null,
    name: null,
    stats: { nodeCount: 0, edgeCount: 0 },
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // 加载所有项目
  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/my-projects', {
        // 添加缓存控制，确保获取最新数据
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await res.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('加载项目失败:', error)
      alert('加载项目失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载项目的图谱
  const loadGraphs = async (projectId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/graphs`, {
        // 添加缓存控制，确保获取最新数据
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await res.json()
      setGraphs(data.graphs)
    } catch (error) {
      console.error('加载图谱失败:', error)
      alert('加载图谱失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载图谱的节点
  const loadNodes = async (graphId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/graphs/${graphId}/nodes`, {
        // 添加缓存控制，确保获取最新数据
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await res.json()
      setNodes(data.nodes)
    } catch (error) {
      console.error('加载节点失败:', error)
      alert('加载节点失败，请重试')
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

  // 删除项目处理
  const handleDeleteProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation() // 阻止触发选择事件
    setDeleteDialog({
      isOpen: true,
      type: 'project',
      id: project.id,
      name: project.name,
      stats: {
        nodeCount: project.nodeCount,
        edgeCount: project.edgeCount,
        graphCount: graphs.filter((g) => g.projectId === project.id).length,
      },
    })
  }

  // 删除图谱处理
  const handleDeleteGraph = (e: React.MouseEvent, graph: Graph) => {
    e.stopPropagation() // 阻止触发选择事件
    setDeleteDialog({
      isOpen: true,
      type: 'graph',
      id: graph.id,
      name: graph.name,
      stats: {
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
      },
    })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return

    setIsDeleting(true)
    try {
      const endpoint =
        deleteDialog.type === 'project'
          ? `/api/projects/${deleteDialog.id}`
          : `/api/graphs/${deleteDialog.id}`

      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '删除失败')
      }

      // 显示成功消息
      alert(
        `成功删除 ${deleteDialog.name}！\n删除了 ${data.deletedNodeCount} 个节点和 ${data.deletedEdgeCount} 条边`
      )

      // 刷新列表
      if (deleteDialog.type === 'project') {
        loadProjects()
        setSelectedProject(null)
        setGraphs([])
        setNodes([])
      } else {
        if (selectedProject) {
          loadGraphs(selectedProject.id)
        }
        setSelectedGraph(null)
        setNodes([])
      }

      // 关闭对话框
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: null,
        name: null,
        stats: { nodeCount: 0, edgeCount: 0 },
      })
    } catch (error) {
      console.error('删除失败:', error)
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: null,
        name: null,
        stats: { nodeCount: 0, edgeCount: 0 },
      })
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">项目-图谱管理</h1>

      {/* 全局加载提示 */}
      {loading && <LoadingSpinner message="正在加载中..." />}

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
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => selectProject(project)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedProject?.id === project.id ? 'bg-blue-50 border-blue-500' : ''
                } flex items-center justify-between`}
              >
                <div className="flex-1">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-500">
                    {project.nodeCount} 节点 · {project.edgeCount} 边
                  </div>
                </div>
                <DeleteButton
                  onDelete={(e) => handleDeleteProject(e, project)}
                  disabled={isDeleting}
                  ariaLabel={`删除项目 ${project.name}`}
                />
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
                } flex items-start justify-between`}
              >
                <div className="flex-1">
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
                <DeleteButton
                  onDelete={(e) => handleDeleteGraph(e, graph)}
                  disabled={isDeleting}
                  ariaLabel={`删除图谱 ${graph.name}`}
                />
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
                  <div className="text-xs text-blue-500 mt-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UIIcon name="camera" size={12} />
                    有图片
                  </div>
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

      {/* 删除确认对话框 */}
      {deleteDialog.type && (
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          entityType={deleteDialog.type}
          entityName={deleteDialog.name || ''}
          stats={deleteDialog.stats}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
