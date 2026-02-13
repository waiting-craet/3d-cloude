/**
 * AI Preview Modal Component
 * 
 * Displays AI-generated graph data with interactive editing capabilities
 * and conflict resolution UI.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.3, 7.4, 8.2
 */

'use client'

import { useState, useEffect } from 'react'
import { MergeDecision } from '@/lib/services/merge-resolution'

/**
 * Preview node structure with duplicate detection metadata
 */
export interface PreviewNode {
  id: string
  name: string
  type: string
  properties: Record<string, any>
  isDuplicate?: boolean
  duplicateOf?: string
  conflicts?: Array<{
    property: string
    existingValue: any
    newValue: any
  }>
}

/**
 * Preview edge structure with redundancy detection metadata
 */
export interface PreviewEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  properties: Record<string, any>
  isRedundant?: boolean
}

/**
 * Stats about the AI-generated graph
 */
export interface PreviewStats {
  totalNodes: number
  totalEdges: number
  duplicateNodes: number
  redundantEdges: number
  conflicts: number
}

/**
 * Preview data structure
 */
export interface PreviewData {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  stats: PreviewStats
}

/**
 * Component props
 */
export interface AIPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: PreviewData
  onSave: (editedData: PreviewData, mergeDecisions: MergeDecision[]) => Promise<void>
  visualizationType: '2d' | '3d'
}

/**
 * AI Preview Modal Component
 */
export default function AIPreviewModal({
  isOpen,
  onClose,
  data,
  onSave,
  visualizationType,
}: AIPreviewModalProps) {
  // State for edited data (immutable original data)
  const [editedNodes, setEditedNodes] = useState<PreviewNode[]>(data.nodes)
  const [editedEdges, setEditedEdges] = useState<PreviewEdge[]>(data.edges)
  
  // State for merge decisions
  const [mergeDecisions, setMergeDecisions] = useState<Map<string, MergeDecision>>(new Map())
  
  // State for selected node/edge for editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  
  // State for save operation
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'stats' | 'conflicts' | 'visualization' | 'editing'>('stats')
  
  // State for close confirmation
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // Reset state when data changes
  useEffect(() => {
    setEditedNodes(data.nodes)
    setEditedEdges(data.edges)
    setMergeDecisions(new Map())
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSaveError(null)
  }, [data])

  // Check if all conflicts are resolved
  const allConflictsResolved = () => {
    const duplicateNodes = editedNodes.filter(n => n.isDuplicate)
    
    for (const node of duplicateNodes) {
      const decision = mergeDecisions.get(node.id)
      if (!decision) return false
      
      // If merging, check that all conflicts have resolutions
      if (decision.action === 'merge' && node.conflicts && node.conflicts.length > 0) {
        for (const conflict of node.conflicts) {
          if (!decision.propertyResolutions?.[conflict.property]) {
            return false
          }
        }
      }
    }
    
    return true
  }

  // Handle save
  const handleSave = async () => {
    // Validate that all conflicts are resolved
    if (!allConflictsResolved()) {
      setSaveError('请解决所有冲突后再保存')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const decisionsArray = Array.from(mergeDecisions.values())
      await onSave(
        {
          nodes: editedNodes,
          edges: editedEdges,
          stats: data.stats,
        },
        decisionsArray
      )
      // Close modal on success
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      setSaveError(error instanceof Error ? error.message : '保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel - show confirmation dialog
  const handleCancelClick = () => {
    setShowCloseConfirm(true)
  }

  // Confirm close - actually close the modal
  const handleConfirmClose = () => {
    setShowCloseConfirm(false)
    onClose()
  }

  // Cancel close - keep modal open
  const handleCancelClose = () => {
    setShowCloseConfirm(false)
  }

  // Handle merge decision change
  const handleMergeDecisionChange = (
    nodeId: string,
    action: 'merge' | 'keep-both' | 'skip'
  ) => {
    const node = editedNodes.find(n => n.id === nodeId)
    if (!node || !node.isDuplicate) return

    const nodeIndex = data.nodes.findIndex(n => n.id === nodeId)
    
    setMergeDecisions(prev => {
      const newDecisions = new Map(prev)
      newDecisions.set(nodeId, {
        action,
        newNodeIndex: nodeIndex,
        existingNodeId: node.duplicateOf || '',
        propertyResolutions: {},
      })
      return newDecisions
    })
  }

  // Handle property resolution change
  const handlePropertyResolutionChange = (
    nodeId: string,
    property: string,
    resolution: 'keep-existing' | 'use-new' | 'combine'
  ) => {
    setMergeDecisions(prev => {
      const newDecisions = new Map(prev)
      const decision = newDecisions.get(nodeId)
      
      if (decision) {
        newDecisions.set(nodeId, {
          ...decision,
          propertyResolutions: {
            ...decision.propertyResolutions,
            [property]: resolution,
          },
        })
      }
      
      return newDecisions
    })
  }

  // Handle node edit
  const handleNodeEdit = (nodeId: string, updates: Partial<PreviewNode>) => {
    setEditedNodes(prev =>
      prev.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    )
  }

  // Handle edge edit
  const handleEdgeEdit = (edgeId: string, updates: Partial<PreviewEdge>) => {
    setEditedEdges(prev =>
      prev.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    )
  }

  if (!isOpen) return null

  const selectedNode = selectedNodeId ? (editedNodes.find(n => n.id === selectedNodeId) || null) : null
  const selectedEdge = selectedEdgeId ? (editedEdges.find(e => e.id === selectedEdgeId) || null) : null
  const unresolvedConflicts = editedNodes.filter(n => n.isDuplicate && !mergeDecisions.has(n.id))

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      // 移除背景点击关闭功能
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
          borderRadius: '24px',
          maxWidth: '1400px',
          width: '100%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: '700',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              🤖 AI 图谱预览
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: 0,
              }}
            >
              查看并编辑AI生成的知识图谱，解决冲突后保存
            </p>
          </div>
          <button
            onClick={handleCancelClick}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.color = 'rgba(248, 113, 113, 1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            padding: '0 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '8px',
          }}
        >
          {[
            { id: 'stats', label: '📊 统计', badge: null },
            { id: 'conflicts', label: '⚠️ 冲突', badge: unresolvedConflicts.length > 0 ? unresolvedConflicts.length : null },
            { id: 'visualization', label: '🌐 可视化', badge: null },
            { id: 'editing', label: '✏️ 编辑', badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid rgba(99, 102, 241, 1)' : '2px solid transparent',
                color: activeTab === tab.id ? 'rgba(167, 139, 250, 1)' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                }
              }}
            >
              {tab.label}
              {tab.badge !== null && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 1)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
              <StatsSection stats={data.stats} visualizationType={visualizationType} />
            </div>
          )}

          {/* Conflicts Tab */}
          {activeTab === 'conflicts' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
              <ConflictsSection
                nodes={editedNodes}
                mergeDecisions={mergeDecisions}
                onMergeDecisionChange={handleMergeDecisionChange}
                onPropertyResolutionChange={handlePropertyResolutionChange}
              />
            </div>
          )}

          {/* Visualization Tab */}
          {activeTab === 'visualization' && (
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px' }}>
              <VisualizationSection
                nodes={editedNodes}
                edges={editedEdges}
                visualizationType={visualizationType}
                onNodeSelect={setSelectedNodeId}
                onEdgeSelect={setSelectedEdgeId}
              />
            </div>
          )}

          {/* Editing Tab */}
          {activeTab === 'editing' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
              <EditingSection
                nodes={editedNodes}
                edges={editedEdges}
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                onNodeSelect={setSelectedNodeId}
                onEdgeSelect={setSelectedEdgeId}
                onNodeEdit={handleNodeEdit}
                onEdgeEdit={handleEdgeEdit}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px 32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Error message */}
          {saveError && (
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: 'rgba(248, 113, 113, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{saveError}</span>
            </div>
          )}

          {/* Unresolved conflicts warning */}
          {!saveError && unresolvedConflicts.length > 0 && (
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '10px',
                color: 'rgba(251, 191, 36, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>还有 {unresolvedConflicts.length} 个冲突未解决</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancelClick}
              disabled={isSaving}
              style={{
                padding: '14px 28px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSaving ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !allConflictsResolved()}
              style={{
                padding: '14px 28px',
                background: isSaving || !allConflictsResolved()
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSaving || !allConflictsResolved() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSaving || !allConflictsResolved() ? 0.5 : 1,
                boxShadow: isSaving || !allConflictsResolved()
                  ? 'none'
                  : '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!isSaving && allConflictsResolved()) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && allConflictsResolved()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {isSaving ? '保存中...' : '💾 保存图谱'}
            </button>
          </div>
        </div>

        {/* Close Confirmation Dialog */}
        {showCloseConfirm && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              borderRadius: '24px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #2a2a3e 0%, #1e1e2e 100%)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 20px',
                }}
              >
                ⚠️
              </div>

              {/* Title */}
              <h3
                style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  textAlign: 'center',
                }}
              >
                确定要放弃吗？
              </h3>

              {/* Message */}
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 24px 0',
                  textAlign: 'center',
                  lineHeight: '1.6',
                }}
              >
                确定要放弃当前生成的图谱吗？所有未保存的更改将会丢失。
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCancelClose}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  继续编辑
                </button>
                <button
                  onClick={handleConfirmClose}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  确定放弃
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stats Section Component
function StatsSection({ stats, visualizationType }: { stats: PreviewStats; visualizationType: '2d' | '3d' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
      <StatCard
        icon="📊"
        label="总节点数"
        value={stats.totalNodes}
        color="rgba(99, 102, 241, 1)"
      />
      <StatCard
        icon="🔗"
        label="总边数"
        value={stats.totalEdges}
        color="rgba(59, 130, 246, 1)"
      />
      <StatCard
        icon="⚠️"
        label="重复节点"
        value={stats.duplicateNodes}
        color="rgba(251, 191, 36, 1)"
      />
      <StatCard
        icon="🔄"
        label="冗余边"
        value={stats.redundantEdges}
        color="rgba(168, 85, 247, 1)"
      />
      <StatCard
        icon="❗"
        label="属性冲突"
        value={stats.conflicts}
        color="rgba(239, 68, 68, 1)"
      />
      <StatCard
        icon={visualizationType === '2d' ? '📐' : '🌐'}
        label="可视化类型"
        value={visualizationType === '2d' ? '二维' : '三维'}
        color="rgba(16, 185, 129, 1)"
      />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color, fontSize: '28px', fontWeight: '700' }}>
        {value}
      </div>
    </div>
  )
}

// Conflicts Section Component (placeholder - will be implemented in next subtask)
function ConflictsSection({
  nodes,
  mergeDecisions,
  onMergeDecisionChange,
  onPropertyResolutionChange,
}: {
  nodes: PreviewNode[]
  mergeDecisions: Map<string, MergeDecision>
  onMergeDecisionChange: (nodeId: string, action: 'merge' | 'keep-both' | 'skip') => void
  onPropertyResolutionChange: (nodeId: string, property: string, resolution: 'keep-existing' | 'use-new' | 'combine') => void
}) {
  const duplicateNodes = nodes.filter(n => n.isDuplicate)

  if (duplicateNodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>没有冲突</div>
        <div style={{ fontSize: '14px' }}>所有节点都是唯一的，可以直接保存</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
        发现 {duplicateNodes.length} 个重复节点，请选择处理方式
      </div>
      {/* Conflict resolution UI will be implemented in subtask 6.3 */}
      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
        冲突解决面板将在下一个子任务中实现
      </div>
    </div>
  )
}

// Visualization Section Component
function VisualizationSection({
  nodes,
  edges,
  visualizationType,
  onNodeSelect,
  onEdgeSelect,
}: {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  visualizationType: '2d' | '3d'
  onNodeSelect: (nodeId: string) => void
  onEdgeSelect: (edgeId: string) => void
}) {
  // 导入必要的组件
  const Interactive2DGraph = require('./Interactive2DGraph').default
  const Preview3DGraph = require('./Preview3DGraph').default
  const { applyLayout } = require('@/lib/graph-layouts')
  
  // 转换预览数据为图谱格式，并应用AI推荐的布局
  const graphData = (() => {
    // 准备节点和边数据
    const graphNodes = nodes.map((node: PreviewNode) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      x: 0,
      y: 0,
      color: node.isDuplicate ? '#f59e0b' : '#6366f1',
      size: 2.5,
      metadata: node.properties,
    }))
    
    const graphEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      label: edge.label,
      color: edge.isRedundant ? '#ef4444' : '#8b5cf6',
      metadata: edge.properties,
    }))
    
    // 如果是3D模式，应用智能布局算法（AI自动选择）
    let optimizedNodes = graphNodes
    let recommendedLayout = 'force' // 默认布局
    
    if (visualizationType === '3d' && nodes.length > 1) {
      try {
        // AI自动分析并选择最佳布局
        const { nodes: layoutNodes, analysis } = applyLayout(graphNodes, graphEdges)
        recommendedLayout = analysis.recommendedLayout
        
        console.log('🤖 AI推荐布局:', recommendedLayout, '原因:', {
          节点数: analysis.nodeCount,
          边数: analysis.edgeCount,
          密度: analysis.density.toFixed(2),
          有层级: analysis.hasHierarchy,
          有环: analysis.hasCycles,
        })
        
        // 转换为3D坐标，缩小间距让节点更紧凑
        optimizedNodes = layoutNodes.map((node: any) => ({
          ...node,
          x: node.x * 0.3, // 大幅缩小间距（0.8 → 0.3）
          y: node.y * 0.3,
          z: (Math.random() - 0.5) * 15, // 缩小Z轴范围（30 → 15）
        }))
      } catch (error) {
        console.error('Layout error:', error)
        // 降级到紧凑的圆形布局
        const radius = Math.min(15 + nodes.length * 0.5, 25) // 更小的半径
        optimizedNodes = graphNodes.map((node, index) => ({
          ...node,
          x: Math.cos((index / graphNodes.length) * 2 * Math.PI) * radius,
          y: Math.sin((index / graphNodes.length) * 2 * Math.PI) * radius,
          z: (Math.random() - 0.5) * 15,
        }))
      }
    } else {
      // 2D模式使用紧凑的圆形布局
      const radius = Math.min(20 + nodes.length * 0.5, 30)
      optimizedNodes = graphNodes.map((node, index) => ({
        ...node,
        x: Math.cos((index / graphNodes.length) * 2 * Math.PI) * radius,
        y: Math.sin((index / graphNodes.length) * 2 * Math.PI) * radius,
        z: 0,
      }))
    }
    
    return {
      nodes: optimizedNodes,
      edges: graphEdges,
      recommendedLayout, // 传递AI推荐的布局
    }
  })()

  if (visualizationType === '3d') {
    // 3D 可视化 - 使用独立的预览组件
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}>
        <Preview3DGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          onNodeClick={(nodeId: string) => onNodeSelect(nodeId)}
        />
        
        {/* 图例 */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}>
          <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            图例
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>普通节点</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>重复节点</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '2px', background: '#8b5cf6' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>普通边</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '2px', background: '#ef4444' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>冗余边</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2D 可视化 - 使用交互式图谱组件
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Interactive2DGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          onNodeClick={(nodeId: string) => onNodeSelect(nodeId)}
          onEdgeClick={(edgeId: string) => onEdgeSelect(edgeId)}
        />
      </div>
      
      {/* 图例 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10,
      }}>
        <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
          图例
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>普通节点</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>重复节点</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', background: '#8b5cf6' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>普通边</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', background: '#ef4444' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>冗余边</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Editing Section Component (placeholder - will be implemented in next subtask)
function EditingSection({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  onNodeSelect,
  onEdgeSelect,
  onNodeEdit,
  onEdgeEdit,
}: {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  selectedNode: PreviewNode | null
  selectedEdge: PreviewEdge | null
  onNodeSelect: (nodeId: string) => void
  onEdgeSelect: (edgeId: string) => void
  onNodeEdit: (nodeId: string, updates: Partial<PreviewNode>) => void
  onEdgeEdit: (edgeId: string, updates: Partial<PreviewEdge>) => void
}) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>节点和边编辑</div>
      <div style={{ fontSize: '14px' }}>编辑功能将在下一个子任务中实现</div>
    </div>
  )
}
