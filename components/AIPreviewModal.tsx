/**
 * AI Preview Modal Component
 * 
 * Displays AI-generated graph data with interactive editing capabilities
 * and conflict resolution UI.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.3, 7.4, 8.2
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation' // Add Next.js router for navigation (Task 2.2)
import { MergeDecision } from '@/lib/services/merge-resolution'
import { NavigationService, EnhancedNavigationResult, NavigationErrorType, ErrorRecoveryStrategy } from '@/lib/services/navigation-service' // Import enhanced NavigationService (Task 5.1)
import { removeEmojis } from '@/lib/emoji-filter' // Import emoji filter utility

// Add CSS animations for loading states (Task 2.3)
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

/**
 * Preview node structure with duplicate detection metadata
 */
export interface PreviewNode {
  id: string
  name: string
  description?: string  // Optional description
  type?: string  // Optional, for backward compatibility
  properties?: Record<string, any>  // Optional, for backward compatibility
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
  properties?: Record<string, any>  // Optional, for backward compatibility
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

// Enhanced state interfaces for panel synchronization (Task 1.1)
interface EditPanelState {
  selectedNodeId: string | null
  selectedEdgeId: string | null
  panelMode: 'nodes' | 'edges'
  isLoading: boolean
  lastUpdateTimestamp: number
  error: string | null
  retryCount: number
}

interface NodeSelectionEvent {
  nodeId: string
  timestamp: number
  source: 'list' | 'direct'
}

/**
 * Component props
 */
export interface AIPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: PreviewData
  onSave: (editedData: PreviewData, mergeDecisions: MergeDecision[]) => Promise<{ success: boolean; graphId?: string; error?: string }>
  visualizationType: '2d' | '3d'
  enableAutoNavigation?: boolean // New optional prop for backward compatibility (Task 2.1)
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
  enableAutoNavigation = true, // Default to true for new navigation feature (Task 2.1)
}: AIPreviewModalProps) {
  // Next.js router for navigation (Task 2.2)
  const router = useRouter()
  
  // State for edited data (immutable original data)
  const [editedNodes, setEditedNodes] = useState<PreviewNode[]>(data.nodes)
  const [editedEdges, setEditedEdges] = useState<PreviewEdge[]>(data.edges)
  
  // State for merge decisions
  const [mergeDecisions, setMergeDecisions] = useState<Map<string, MergeDecision>>(new Map())
  
  // State for selected node/edge for editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  
  // Enhanced panel synchronization state (Task 1.1)
  const [panelState, setPanelState] = useState<EditPanelState>({
    selectedNodeId: null,
    selectedEdgeId: null,
    panelMode: 'nodes',
    isLoading: false,
    lastUpdateTimestamp: 0,
    error: null,
    retryCount: 0
  })
  
  // State for save operation
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Enhanced state for navigation tracking and loading management (Task 5.2)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [navigationError, setNavigationError] = useState<string | null>(null)
  
  // Enhanced loading state management (Task 5.2)
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'saving' | 'success' | 'navigating' | 'complete'>('idle')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [successMessageDuration, setSuccessMessageDuration] = useState(1500) // Configurable timing (Task 5.2)
  const [navigationDelay, setNavigationDelay] = useState(500) // Delay before navigation starts
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'stats' | 'conflicts' | 'editing'>('stats')
  
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
    
    // Reset enhanced panel synchronization state (Task 1.1)
    setPanelState({
      selectedNodeId: null,
      selectedEdgeId: null,
      panelMode: 'nodes',
      isLoading: false,
      lastUpdateTimestamp: 0,
      error: null,
      retryCount: 0
    })
    
    // Reset enhanced navigation and loading state (Task 5.2)
    setIsNavigating(false)
    setShowSuccessMessage(false)
    setNavigationError(null)
    setLoadingPhase('idle')
    setLoadingProgress(0)
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

  // Enhanced timing control utilities (Task 5.2)
  const getSuccessMessageDuration = () => {
    // Configurable based on user preferences or system settings
    return successMessageDuration
  }

  const getNavigationDelay = () => {
    // Configurable delay before navigation starts for smooth transitions
    return navigationDelay
  }

  const updateTimingSettings = (newSuccessDuration?: number, newNavigationDelay?: number) => {
    if (newSuccessDuration !== undefined) {
      setSuccessMessageDuration(Math.max(500, Math.min(3000, newSuccessDuration))) // 0.5-3 seconds
    }
    if (newNavigationDelay !== undefined) {
      setNavigationDelay(Math.max(100, Math.min(1000, newNavigationDelay))) // 0.1-1 second
    }
  }

  // Enhanced save handler with improved loading state management (Task 5.2)
  const handleSave = async () => {
    // Validate that all conflicts are resolved
    if (!allConflictsResolved()) {
      setSaveError('请解决所有冲突后再保存')
      return
    }

    // Initialize enhanced loading state (Task 5.2)
    setIsSaving(true)
    setSaveError(null)
    setNavigationError(null)
    setLoadingPhase('saving')
    setLoadingProgress(0)

    // Simulate progress during save operation (Task 5.2)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    try {
      const decisionsArray = Array.from(mergeDecisions.values())
      const result = await onSave(
        {
          nodes: editedNodes,
          edges: editedEdges,
          stats: data.stats,
        },
        decisionsArray
      )

      // Complete save progress (Task 5.2)
      clearInterval(progressInterval)
      setLoadingProgress(100)

      // Handle save result with enhanced navigation logic and smooth transitions (Task 5.2)
      if (result.success) {
        if (enableAutoNavigation && result.graphId) {
          // Transition to success phase with configurable timing (Task 5.2)
          setLoadingPhase('success')
          setShowSuccessMessage(true)
          
          // Navigate after configurable delay with smooth transitions (Task 5.2)
          setTimeout(async () => {
            setLoadingPhase('navigating')
            setIsNavigating(true)
            setShowSuccessMessage(false)
            
            // Add small delay before navigation starts for smooth transition (Task 5.2)
            setTimeout(async () => {
              try {
                // Use enhanced NavigationService for navigation with comprehensive error handling
                const navigationResult: EnhancedNavigationResult = await NavigationService.navigateToGraph(result.graphId!, router)
                
                if (navigationResult.success) {
                  // Navigation successful, transition to complete phase (Task 5.2)
                  setLoadingPhase('complete')
                  setTimeout(() => {
                    onClose()
                  }, navigationDelay)
                } else {
                  // Enhanced navigation error handling with recovery strategies
                  handleNavigationError(navigationResult)
                }
              } catch (error) {
                // Fallback error handling for unexpected errors
                console.error('Navigation error:', error)
                setNavigationError('导航失败，请手动查看已保存的图谱')
                setIsNavigating(false)
                setLoadingPhase('idle')
              }
            }, navigationDelay)
          }, successMessageDuration) // Use configurable success message duration
        } else if (enableAutoNavigation && !result.graphId) {
          // Missing graphId error handling
          setNavigationError('图谱保存成功，但缺少图谱ID，无法自动跳转。请手动查看已保存的图谱。')
          setLoadingPhase('idle')
        } else {
          // Auto navigation disabled, close modal normally
          setLoadingPhase('complete')
          setTimeout(() => onClose(), 500)
        }
      } else {
        // Save failed, show error without attempting navigation
        setSaveError(result.error || '保存失败，请重试')
        setLoadingPhase('idle')
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Save error:', error)
      setSaveError(error instanceof Error ? error.message : '保存失败，请重试')
      setLoadingPhase('idle')
    } finally {
      setIsSaving(false)
    }
  }

  // Enhanced navigation error handling with recovery strategies and loading state management (Task 5.2)
  const handleNavigationError = (navigationResult: EnhancedNavigationResult) => {
    const { errorType, recoveryStrategy, fallbackUrl, error } = navigationResult

    // Log structured error information
    console.error('Navigation failed with details:', {
      errorType,
      recoveryStrategy,
      fallbackUrl,
      error,
      timestamp: new Date().toISOString()
    })

    // Set appropriate error message based on recovery strategy
    switch (recoveryStrategy) {
      case ErrorRecoveryStrategy.FALLBACK_UI:
        if (fallbackUrl) {
          setNavigationError(`导航失败，但您可以点击此链接手动访问图谱：${fallbackUrl}`)
        } else {
          setNavigationError('导航失败，请手动查看已保存的图谱')
        }
        break
      
      case ErrorRecoveryStrategy.MANUAL_NAVIGATION:
        setNavigationError('导航系统暂时不可用，请刷新页面后重试，或手动查看已保存的图谱')
        break
      
      case ErrorRecoveryStrategy.RETRY_OPERATION:
        setNavigationError('导航失败，正在重试...')
        // Implement retry logic
        setTimeout(async () => {
          try {
            const retryResult = await NavigationService.retryNavigation(
              navigationResult.logEntry?.graphId || '', 
              router, 
              2, // Max 2 retries
              1000 // 1 second base delay
            )
            
            if (retryResult.success) {
              setLoadingPhase('complete')
              setTimeout(() => onClose(), 500)
            } else {
              setNavigationError('重试失败，请手动查看已保存的图谱')
              setLoadingPhase('idle')
            }
          } catch (retryError) {
            console.error('Retry navigation failed:', retryError)
            setNavigationError('重试失败，请手动查看已保存的图谱')
            setLoadingPhase('idle')
          } finally {
            setIsNavigating(false)
          }
        }, 2000)
        return // Don't set isNavigating to false immediately for retry case
      
      case ErrorRecoveryStrategy.SHOW_ERROR:
      default:
        setNavigationError(error || '导航失败，请手动查看已保存的图谱')
        break
    }

    // Reset loading state on error (Task 5.2)
    setIsNavigating(false)
    setLoadingPhase('idle')
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

  // Enhanced node selection handler with automatic synchronization (Task 1.3)
  const handleNodeSelection = useCallback((nodeId: string, source: 'list' | 'direct' = 'list') => {
    const timestamp = Date.now()
    
    // Clear any previous errors
    setPanelState(prev => ({
      ...prev,
      selectedNodeId: nodeId,
      selectedEdgeId: null, // Clear edge selection when selecting node
      panelMode: 'nodes',
      isLoading: true,
      lastUpdateTimestamp: timestamp,
      error: null,
      retryCount: 0
    }))
    
    // Update legacy state for backward compatibility
    setSelectedNodeId(nodeId)
    setSelectedEdgeId(null)
    
    // Simulate async loading with error handling (Task 5.3)
    setTimeout(() => {
      // Simulate potential loading failure (for testing)
      const shouldFail = false // Set to true to test error handling
      
      if (shouldFail) {
        setPanelState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: '加载节点数据失败，请重试',
          retryCount: prev.retryCount + 1
        }))
      } else {
        setPanelState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: null
        }))
      }
    }, 50)
  }, [])

  // Enhanced edge selection handler with automatic synchronization
  const handleEdgeSelection = useCallback((edgeId: string, source: 'list' | 'direct' = 'list') => {
    const timestamp = Date.now()
    
    // Clear any previous errors
    setPanelState(prev => ({
      ...prev,
      selectedNodeId: null, // Clear node selection when selecting edge
      selectedEdgeId: edgeId,
      panelMode: 'edges',
      isLoading: true,
      lastUpdateTimestamp: timestamp,
      error: null,
      retryCount: 0
    }))
    
    // Update legacy state for backward compatibility
    setSelectedNodeId(null)
    setSelectedEdgeId(edgeId)
    
    // Simulate async loading with error handling (Task 5.3)
    setTimeout(() => {
      // Simulate potential loading failure (for testing)
      const shouldFail = false // Set to true to test error handling
      
      if (shouldFail) {
        setPanelState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: '加载边数据失败，请重试',
          retryCount: prev.retryCount + 1
        }))
      } else {
        setPanelState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: null
        }))
      }
    }, 50)
  }, [])

  // Retry handler for failed selections (Task 5.3)
  const handleRetrySelection = useCallback(() => {
    if (panelState.selectedNodeId) {
      handleNodeSelection(panelState.selectedNodeId, 'direct')
    } else if (panelState.selectedEdgeId) {
      handleEdgeSelection(panelState.selectedEdgeId, 'direct')
    }
  }, [panelState.selectedNodeId, panelState.selectedEdgeId, handleNodeSelection, handleEdgeSelection])

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
              AI 图谱预览
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
            关闭
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
            { id: 'stats', label: '统计', badge: null },
            { id: 'conflicts', label: '冲突', badge: unresolvedConflicts.length > 0 ? unresolvedConflicts.length : null },
            { id: 'editing', label: '编辑', badge: null },
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
              <StatsSection 
                stats={data.stats} 
                visualizationType={visualizationType}
                nodes={editedNodes}
                mergeDecisions={mergeDecisions}
              />
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



          {/* Editing Tab */}
          {activeTab === 'editing' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
              <EditingSection
                nodes={editedNodes}
                edges={editedEdges}
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                panelState={panelState}
                onNodeSelect={handleNodeSelection}
                onEdgeSelect={handleEdgeSelection}
                onNodeEdit={handleNodeEdit}
                onEdgeEdit={handleEdgeEdit}
                onRetrySelection={handleRetrySelection}
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
              <span>{saveError}</span>
            </div>
          )}

          {/* Enhanced navigation error message with fallback UI (Task 5.1) */}
          {!saveError && navigationError && (
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
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span>{navigationError}</span>
              </div>
              
              {/* Fallback navigation button if URL is available */}
              {navigationError.includes('http') && (
                <button
                  onClick={() => {
                    const urlMatch = navigationError.match(/\/graph\?graphId=[^\\s]+/)
                    if (urlMatch) {
                      window.open(urlMatch[0], '_blank')
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(99, 102, 241, 1)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'
                  }}
                >
                  手动打开图谱
                </button>
              )}
              
              {/* Retry button for certain error types */}
              {navigationError.includes('重试') && (
                <button
                  onClick={() => {
                    setNavigationError(null)
                    setIsNavigating(true)
                    // Trigger retry logic
                    handleSave()
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(16, 185, 129, 1)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                  }}
                >
                  重试导航
                </button>
              )}
            </div>
          )}

          {/* Enhanced loading state indicators with progress and phase-specific messages (Task 5.2) */}
          {!saveError && !navigationError && loadingPhase !== 'idle' && (
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                background: loadingPhase === 'saving' ? 'rgba(99, 102, 241, 0.1)' :
                           loadingPhase === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                           loadingPhase === 'navigating' ? 'rgba(168, 85, 247, 0.1)' :
                           'rgba(16, 185, 129, 0.1)',
                border: loadingPhase === 'saving' ? '1px solid rgba(99, 102, 241, 0.3)' :
                        loadingPhase === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' :
                        loadingPhase === 'navigating' ? '1px solid rgba(168, 85, 247, 0.3)' :
                        '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: loadingPhase === 'saving' ? 'rgba(99, 102, 241, 1)' :
                       loadingPhase === 'success' ? 'rgba(16, 185, 129, 1)' :
                       loadingPhase === 'navigating' ? 'rgba(168, 85, 247, 1)' :
                       'rgba(16, 185, 129, 1)',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {loadingPhase === 'saving' ? '保存中...' :
                   loadingPhase === 'success' ? '保存成功' :
                   loadingPhase === 'navigating' ? '跳转中...' :
                   '加载中'}
                </span>
                <span>
                  {loadingPhase === 'saving' ? '正在保存图谱数据...' :
                   loadingPhase === 'success' ? '图谱保存成功！准备跳转...' :
                   loadingPhase === 'navigating' ? '正在跳转到3D可视化页面...' :
                   '操作完成！'}
                </span>
              </div>
              
              {/* Progress bar for saving phase (Task 5.2) */}
              {loadingPhase === 'saving' && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${loadingProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8) 0%, rgba(99, 102, 241, 1) 100%)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              )}
              
              {/* Animated dots for navigation phase (Task 5.2) */}
              {loadingPhase === 'navigating' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  opacity: 0.8,
                }}>
                  <span>导航中</span>
                  <div style={{
                    display: 'flex',
                    gap: '2px',
                  }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'currentColor',
                          animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success message during navigation (fallback for compatibility) */}
          {!saveError && !navigationError && showSuccessMessage && loadingPhase === 'idle' && (
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: 'rgba(16, 185, 129, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>图谱保存成功！正在跳转到3D可视化页面...</span>
            </div>
          )}

          {/* Navigation loading message (fallback for compatibility) */}
          {!saveError && !navigationError && !showSuccessMessage && isNavigating && loadingPhase === 'idle' && (
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                color: 'rgba(99, 102, 241, 1)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>正在跳转到图谱页面...</span>
            </div>
          )}

          {/* Unresolved conflicts warning */}
          {!saveError && !navigationError && !showSuccessMessage && !isNavigating && loadingPhase === 'idle' && unresolvedConflicts.length > 0 && (
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
              <span>还有 {unresolvedConflicts.length} 个冲突未解决</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancelClick}
              disabled={isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle'}
              style={{
                padding: '14px 28px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving && !isNavigating && !showSuccessMessage && loadingPhase === 'idle') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && !isNavigating && !showSuccessMessage && loadingPhase === 'idle') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' || !allConflictsResolved()}
              style={{
                padding: '14px 28px',
                background: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' || !allConflictsResolved()
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' || !allConflictsResolved() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' || !allConflictsResolved() ? 0.5 : 1,
                boxShadow: isSaving || isNavigating || showSuccessMessage || loadingPhase !== 'idle' || !allConflictsResolved()
                  ? 'none'
                  : '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!isSaving && !isNavigating && !showSuccessMessage && loadingPhase === 'idle' && allConflictsResolved()) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && !isNavigating && !showSuccessMessage && loadingPhase === 'idle' && allConflictsResolved()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {/* Enhanced button text based on loading phase (Task 5.2) */}
              {loadingPhase === 'saving' ? '保存中...' :
               loadingPhase === 'success' ? '保存成功' :
               loadingPhase === 'navigating' ? '跳转中...' :
               loadingPhase === 'complete' ? '完成' :
               isSaving ? '保存中...' : 
               showSuccessMessage ? '保存成功' : 
               isNavigating ? '跳转中...' : 
               '保存图谱'}
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
                !
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
function StatsSection({ 
  stats, 
  visualizationType, 
  nodes, 
  mergeDecisions 
}: { 
  stats: PreviewStats; 
  visualizationType: '2d' | '3d';
  nodes: PreviewNode[];
  mergeDecisions: Map<string, MergeDecision>;
}) {
  // Calculate enhanced conflict statistics
  const conflictStats = (() => {
    const duplicateNodes = nodes.filter(n => n.isDuplicate)
    const resolvedConflicts = duplicateNodes.filter(n => mergeDecisions.has(n.id))
    const unresolvedConflicts = duplicateNodes.filter(n => !mergeDecisions.has(n.id))
    
    // Count conflicts by analyzing the conflict properties
    const conflictsByType = {
      duplicate_nodes: duplicateNodes.length,
      conflicting_edges: 0, // Will be calculated from edges if available
      missing_references: 0,
      content_conflicts: 0,
      property_mismatches: 0,
      type_inconsistencies: 0
    }
    
    // Analyze conflicts in duplicate nodes
    duplicateNodes.forEach(node => {
      if (node.conflicts) {
        node.conflicts.forEach(conflict => {
          // Classify conflicts based on property names and values
          if (conflict.property === 'name' || conflict.property === 'title') {
            conflictsByType.content_conflicts++
          } else if (conflict.property === 'type') {
            conflictsByType.type_inconsistencies++
          } else {
            conflictsByType.property_mismatches++
          }
        })
      }
    })
    
    const totalConflicts = duplicateNodes.length + 
      Object.values(conflictsByType).reduce((sum, count) => sum + count, 0) - duplicateNodes.length // Avoid double counting
    const resolutionProgress = duplicateNodes.length > 0 ? (resolvedConflicts.length / duplicateNodes.length) * 100 : 100
    
    return {
      totalConflicts: Math.max(totalConflicts, duplicateNodes.length), // At least count duplicate nodes
      resolvedConflicts: resolvedConflicts.length,
      unresolvedConflicts: unresolvedConflicts.length,
      resolutionProgress,
      conflictsByType
    }
  })()
  
  // Validation status
  const validationStatus = (() => {
    const hasUnresolvedConflicts = conflictStats.unresolvedConflicts > 0
    const hasInvalidNodes = nodes.some(n => !n.name || !n.type)
    const isValid = !hasUnresolvedConflicts && !hasInvalidNodes
    
    return {
      isValid,
      hasUnresolvedConflicts,
      hasInvalidNodes,
      status: isValid ? '准备保存' : hasUnresolvedConflicts ? '有未解决冲突' : '数据不完整'
    }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Basic Statistics */}
      <div>
        <h3 style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          基础统计
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <StatCard
            icon="图表"
            label="总节点数"
            value={stats.totalNodes}
            color="rgba(99, 102, 241, 1)"
          />
          <StatCard
            icon="链接"
            label="总边数"
            value={stats.totalEdges}
            color="rgba(59, 130, 246, 1)"
          />
          <StatCard
            icon={visualizationType === '2d' ? '二维' : '三维'}
            label="目标类型"
            value={visualizationType === '2d' ? '二维图谱' : '三维图谱'}
            color="rgba(16, 185, 129, 1)"
          />
        </div>
      </div>

      {/* Conflict Statistics */}
      <div>
        <h3 style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          冲突分析
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <StatCard
            icon="搜索"
            label="检测到的冲突"
            value={conflictStats.totalConflicts}
            color="rgba(239, 68, 68, 1)"
          />
          <StatCard
            icon="完成"
            label="已解决冲突"
            value={conflictStats.resolvedConflicts}
            color="rgba(16, 185, 129, 1)"
          />
          <StatCard
            icon="等待"
            label="待解决冲突"
            value={conflictStats.unresolvedConflicts}
            color="rgba(251, 191, 36, 1)"
          />
          <StatCard
            icon="进度"
            label="解决进度"
            value={`${Math.round(conflictStats.resolutionProgress)}%`}
            color="rgba(168, 85, 247, 1)"
          />
        </div>
      </div>

      {/* Detailed Conflict Breakdown */}
      {conflictStats.totalConflicts > 0 && (
        <div>
          <h3 style={{ 
            color: 'white', 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            冲突类型分布
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {conflictStats.conflictsByType.duplicate_nodes > 0 && (
              <StatCard
                icon="重复"
                label="重复节点"
                value={conflictStats.conflictsByType.duplicate_nodes}
                color="rgba(251, 191, 36, 1)"
                size="small"
              />
            )}
            {conflictStats.conflictsByType.conflicting_edges > 0 && (
              <StatCard
                icon="边"
                label="冲突边"
                value={conflictStats.conflictsByType.conflicting_edges}
                color="rgba(239, 68, 68, 1)"
                size="small"
              />
            )}
            {conflictStats.conflictsByType.missing_references > 0 && (
              <StatCard
                icon="搜索"
                label="缺失引用"
                value={conflictStats.conflictsByType.missing_references}
                color="rgba(168, 85, 247, 1)"
                size="small"
              />
            )}
            {conflictStats.conflictsByType.content_conflicts > 0 && (
              <StatCard
                icon="文档"
                label="内容冲突"
                value={conflictStats.conflictsByType.content_conflicts}
                color="rgba(59, 130, 246, 1)"
                size="small"
              />
            )}
            {conflictStats.conflictsByType.property_mismatches > 0 && (
              <StatCard
                icon="设置"
                label="属性不匹配"
                value={conflictStats.conflictsByType.property_mismatches}
                color="rgba(99, 102, 241, 1)"
                size="small"
              />
            )}
            {conflictStats.conflictsByType.type_inconsistencies > 0 && (
              <StatCard
                icon="分类"
                label="类型不一致"
                value={conflictStats.conflictsByType.type_inconsistencies}
                color="rgba(16, 185, 129, 1)"
                size="small"
              />
            )}
          </div>
        </div>
      )}


    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  size = 'normal' 
}: { 
  icon: string; 
  label: string; 
  value: string | number; 
  color: string;
  size?: 'normal' | 'small';
}) {
  const isSmall = size === 'small'
  
  return (
    <div
      style={{
        padding: isSmall ? '16px' : '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: isSmall ? '12px' : '16px',
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
      <div style={{ 
        fontSize: isSmall ? '24px' : '32px', 
        marginBottom: isSmall ? '8px' : '12px' 
      }}>
        {icon}
      </div>
      <div style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        fontSize: isSmall ? '12px' : '13px', 
        marginBottom: isSmall ? '6px' : '8px' 
      }}>
        {label}
      </div>
      <div style={{ 
        color, 
        fontSize: isSmall ? '20px' : '28px', 
        fontWeight: '700' 
      }}>
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>OK</div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>没有冲突</div>
        <div style={{ fontSize: '14px' }}>所有节点都是唯一的，可以直接保存</div>
      </div>
    )
  }

  // Group conflicts by type for better organization
  const conflictsByType = (() => {
    const groups = {
      duplicate_nodes: [] as PreviewNode[],
      content_conflicts: [] as PreviewNode[],
      property_mismatches: [] as PreviewNode[],
      type_inconsistencies: [] as PreviewNode[]
    }

    duplicateNodes.forEach(node => {
      groups.duplicate_nodes.push(node)
      
      if (node.conflicts) {
        node.conflicts.forEach(conflict => {
          if (conflict.property === 'name' || conflict.property === 'title') {
            if (!groups.content_conflicts.includes(node)) {
              groups.content_conflicts.push(node)
            }
          } else if (conflict.property === 'type') {
            if (!groups.type_inconsistencies.includes(node)) {
              groups.type_inconsistencies.push(node)
            }
          } else {
            if (!groups.property_mismatches.includes(node)) {
              groups.property_mismatches.push(node)
            }
          }
        })
      }
    })

    return groups
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>!</div>
          <div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
              发现 {duplicateNodes.length} 个冲突需要解决
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              请为每个冲突选择处理方式
            </div>
          </div>
        </div>
        <div style={{ 
          color: 'rgba(239, 68, 68, 1)', 
          fontSize: '14px', 
          fontWeight: '600' 
        }}>
          {duplicateNodes.filter(n => mergeDecisions.has(n.id)).length} / {duplicateNodes.length} 已解决
        </div>
      </div>

      {/* Conflict Classification Sections */}
      {Object.entries(conflictsByType).map(([type, conflictNodes]) => {
        if (conflictNodes.length === 0) return null

        const typeInfo = (() => {
          const typeMap = {
            duplicate_nodes: {
              icon: '重复',
              title: '重复节点',
              description: '检测到与现有节点相似的新节点',
              color: 'rgba(251, 191, 36, 1)'
            },
            content_conflicts: {
              icon: '文档',
              title: '内容冲突',
              description: '节点名称或标题存在差异',
              color: 'rgba(59, 130, 246, 1)'
            },
            property_mismatches: {
              icon: '设置',
              title: '属性不匹配',
              description: '节点属性值存在差异',
              color: 'rgba(99, 102, 241, 1)'
            },
            type_inconsistencies: {
              icon: '分类',
              title: '类型不一致',
              description: '节点类型定义存在冲突',
              color: 'rgba(16, 185, 129, 1)'
            }
          }
          
          return typeMap[type as keyof typeof typeMap] || typeMap.duplicate_nodes
        })()

        return (
          <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '20px' }}>{typeInfo.icon}</div>
              <div>
                <div style={{ 
                  color: typeInfo.color, 
                  fontSize: '16px', 
                  fontWeight: '600' 
                }}>
                  {typeInfo.title} ({conflictNodes.length})
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '13px' 
                }}>
                  {typeInfo.description}
                </div>
              </div>
            </div>

            {/* Conflict Items */}
            {conflictNodes.map(node => (
              <ConflictItem
                key={node.id}
                node={node}
                decision={mergeDecisions.get(node.id)}
                onMergeDecisionChange={onMergeDecisionChange}
                onPropertyResolutionChange={onPropertyResolutionChange}
                typeColor={typeInfo.color}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Individual Conflict Item Component
function ConflictItem({
  node,
  decision,
  onMergeDecisionChange,
  onPropertyResolutionChange,
  typeColor
}: {
  node: PreviewNode
  decision?: MergeDecision
  onMergeDecisionChange: (nodeId: string, action: 'merge' | 'keep-both' | 'skip') => void
  onPropertyResolutionChange: (nodeId: string, property: string, resolution: 'keep-existing' | 'use-new' | 'combine') => void
  typeColor: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calculate confidence score based on similarity (mock implementation)
  const confidenceScore = (() => {
    if (!node.conflicts || node.conflicts.length === 0) return 95
    
    // Lower confidence with more conflicts
    const baseScore = 90
    const penalty = Math.min(node.conflicts.length * 10, 40)
    return Math.max(baseScore - penalty, 50)
  })()

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${decision ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Conflict Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Status Indicator */}
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: decision ? 'rgba(16, 185, 129, 1)' : typeColor,
              flexShrink: 0
            }} />
            
            {/* Node Info */}
            <div>
              <div style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                {node.name}
              </div>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {node.description && <span>{node.description}</span>}
                {node.duplicateOf && <span>• 与现有节点冲突</span>}
                {node.conflicts && <span>• {node.conflicts.length} 个属性冲突</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Confidence Score */}
            <div style={{
              padding: '6px 12px',
              background: confidenceScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 
                         confidenceScore >= 60 ? 'rgba(251, 191, 36, 0.2)' : 
                         'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${confidenceScore >= 80 ? 'rgba(16, 185, 129, 0.3)' : 
                                  confidenceScore >= 60 ? 'rgba(251, 191, 36, 0.3)' : 
                                  'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: confidenceScore >= 80 ? 'rgba(16, 185, 129, 1)' : 
                     confidenceScore >= 60 ? 'rgba(251, 191, 36, 1)' : 
                     'rgba(239, 68, 68, 1)'
            }}>
              {confidenceScore}% 置信度
            </div>

            {/* Decision Status */}
            {decision && (
              <div style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(16, 185, 129, 1)'
              }}>
                已处理
              </div>
            )}

            {/* Expand Icon */}
            <div style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.5)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '20px' }}>
          {/* Side-by-side Comparison */}
          {node.conflicts && node.conflicts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                color: 'white', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '12px' 
              }}>
                属性对比
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    color: 'rgba(59, 130, 246, 1)', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    marginBottom: '8px' 
                  }}>
                    新生成的节点
                  </div>
                  {node.conflicts.map(conflict => (
                    <div key={conflict.property} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontSize: '12px' 
                      }}>
                        {conflict.property}:
                      </div>
                      <div style={{ 
                        color: 'white', 
                        fontSize: '13px', 
                        fontWeight: '500' 
                      }}>
                        {String(conflict.newValue)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    color: 'rgba(251, 191, 36, 1)', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    marginBottom: '8px' 
                  }}>
                    现有节点
                  </div>
                  {node.conflicts.map(conflict => (
                    <div key={conflict.property} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontSize: '12px' 
                      }}>
                        {conflict.property}:
                      </div>
                      <div style={{ 
                        color: 'white', 
                        fontSize: '13px', 
                        fontWeight: '500' 
                      }}>
                        {String(conflict.existingValue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resolution Interface */}
          <div>
            <div style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '12px' 
            }}>
              处理方式
            </div>
            
            {/* Main Decision */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px' 
            }}>
              {[
                { 
                  action: 'merge' as const, 
                  label: '合并节点', 
                  description: '将新节点合并到现有节点',
                  color: 'rgba(16, 185, 129, 1)'
                },
                { 
                  action: 'keep-both' as const, 
                  label: '保留两个', 
                  description: '同时保留新节点和现有节点',
                  color: 'rgba(59, 130, 246, 1)'
                },
                { 
                  action: 'skip' as const, 
                  label: '跳过新节点', 
                  description: '忽略新节点，只保留现有节点',
                  color: 'rgba(168, 85, 247, 1)'
                }
              ].map(option => (
                <button
                  key={option.action}
                  onClick={() => onMergeDecisionChange(node.id, option.action)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: decision?.action === option.action 
                      ? `${option.color}20` 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${decision?.action === option.action 
                      ? option.color 
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    color: decision?.action === option.action 
                      ? option.color 
                      : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (decision?.action !== option.action) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (decision?.action !== option.action) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                    }
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{option.label}</div>
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.8,
                    lineHeight: '1.3'
                  }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Property Resolution (only for merge action) */}
            {decision?.action === 'merge' && node.conflicts && node.conflicts.length > 0 && (
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '12px' 
                }}>
                  属性合并策略
                </div>
                {node.conflicts.map(conflict => (
                  <div key={conflict.property} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '12px', 
                      marginBottom: '6px' 
                    }}>
                      {conflict.property}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { 
                          resolution: 'keep-existing' as const, 
                          label: '保留现有', 
                          color: 'rgba(251, 191, 36, 1)' 
                        },
                        { 
                          resolution: 'use-new' as const, 
                          label: '使用新值', 
                          color: 'rgba(59, 130, 246, 1)' 
                        },
                        { 
                          resolution: 'combine' as const, 
                          label: '合并', 
                          color: 'rgba(16, 185, 129, 1)' 
                        }
                      ].map(option => (
                        <button
                          key={option.resolution}
                          onClick={() => onPropertyResolutionChange(node.id, conflict.property, option.resolution)}
                          style={{
                            padding: '6px 12px',
                            background: decision.propertyResolutions?.[conflict.property] === option.resolution
                              ? `${option.color}20`
                              : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${decision.propertyResolutions?.[conflict.property] === option.resolution
                              ? option.color
                              : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '6px',
                            color: decision.propertyResolutions?.[conflict.property] === option.resolution
                              ? option.color
                              : 'rgba(255, 255, 255, 0.7)',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}




// Editing Section Component (placeholder - will be implemented in next subtask)
function EditingSection({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  panelState,
  onNodeSelect,
  onEdgeSelect,
  onNodeEdit,
  onEdgeEdit,
  onRetrySelection
}: {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  selectedNode: PreviewNode | null
  selectedEdge: PreviewEdge | null
  panelState: EditPanelState
  onNodeSelect: (nodeId: string, source?: 'list' | 'direct') => void
  onEdgeSelect: (edgeId: string, source?: 'list' | 'direct') => void
  onNodeEdit: (nodeId: string, updates: Partial<PreviewNode>) => void
  onEdgeEdit: (edgeId: string, updates: Partial<PreviewEdge>) => void
  onRetrySelection?: () => void
}) {
  const [activeEditor, setActiveEditor] = useState<'nodes' | 'edges'>('nodes')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'duplicate' | 'normal'>('all')

  // Filter nodes based on search and filter criteria
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (node.type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (node.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'duplicate' && node.isDuplicate) ||
                         (filterType === 'normal' && !node.isDuplicate)
    
    return matchesSearch && matchesFilter
  })

  // Filter edges based on search
  const filteredEdges = edges.filter(edge => 
    edge.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nodes.find(n => n.id === edge.fromNodeId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nodes.find(n => n.id === edge.toNodeId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      {/* Header with Editor Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveEditor('nodes')}
            style={{
              padding: '12px 20px',
              background: activeEditor === 'nodes' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeEditor === 'nodes' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: activeEditor === 'nodes' ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            节点编辑 ({nodes.length})
          </button>
          <button
            onClick={() => setActiveEditor('edges')}
            style={{
              padding: '12px 20px',
              background: activeEditor === 'edges' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeEditor === 'edges' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: activeEditor === 'edges' ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            边编辑 ({edges.length})
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Search Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder={`搜索${activeEditor === 'nodes' ? '节点名称或类型' : '边标签或节点'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            搜索
          </div>
        </div>

        {/* Filter Dropdown (for nodes only) */}
        {activeEditor === 'nodes' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#1e1e2e', color: 'white' }}>所有节点</option>
            <option value="duplicate" style={{ background: '#1e1e2e', color: 'white' }}>重复节点</option>
            <option value="normal" style={{ background: '#1e1e2e', color: 'white' }}>普通节点</option>
          </select>
        )}

        {/* Results Count */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          whiteSpace: 'nowrap'
        }}>
          {activeEditor === 'nodes' ? filteredNodes.length : filteredEdges.length} 项
        </div>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* List Panel */}
        <div style={{ 
          width: '400px', 
          display: 'flex', 
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* List Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.03)'
          }}>
            <div style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              {activeEditor === 'nodes' ? '节点列表' : '边列表'}
            </div>
          </div>

          {/* Virtualized List */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            padding: '8px'
          }}>
            {activeEditor === 'nodes' ? (
              <NodeList
                nodes={filteredNodes}
                selectedNodeId={selectedNode?.id || null}
                onNodeSelect={onNodeSelect}
              />
            ) : (
              <EdgeList
                edges={filteredEdges}
                nodes={nodes}
                selectedEdgeId={selectedEdge?.id || null}
                onEdgeSelect={onEdgeSelect}
              />
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Error State Display (Task 5.3) */}
          {panelState.error ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'rgba(239, 68, 68, 1)',
              fontSize: '14px',
              gap: '16px',
              padding: '40px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                !
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  加载失败
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px' }}>
                  {panelState.error}
                </div>
                {onRetrySelection && (
                  <button
                    onClick={onRetrySelection}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: 'rgba(239, 68, 68, 1)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    重试 {panelState.retryCount > 0 && `(${panelState.retryCount})`}
                  </button>
                )}
              </div>
            </div>
          ) : activeEditor === 'nodes' ? (
            selectedNode ? (
              <NodeEditor
                node={selectedNode}
                onNodeEdit={onNodeEdit}
                onClose={() => onNodeSelect('', 'direct')}
                isLoading={panelState.isLoading}
                autoFocus={true}
              />
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                gap: '16px',
                padding: '40px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  编辑
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    选择一个节点开始编辑
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    从左侧列表中点击任意节点来查看和编辑其属性
                  </div>
                </div>
              </div>
            )
          ) : (
            selectedEdge ? (
              <EdgeEditor
                edge={selectedEdge}
                nodes={nodes}
                onEdgeEdit={onEdgeEdit}
                onClose={() => onEdgeSelect('', 'direct')}
              />
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                gap: '16px',
                padding: '40px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  链接
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    选择一条边开始编辑
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    从左侧列表中点击任意边来查看和编辑其属性
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// Node List Component with Virtualization
function NodeList({
  nodes,
  selectedNodeId,
  onNodeSelect
}: {
  nodes: PreviewNode[]
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string, source?: 'list' | 'direct') => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {nodes.map(node => (
        <div
          key={node.id}
          onClick={() => onNodeSelect(node.id, 'list')}
          style={{
            padding: '12px 16px',
            background: selectedNodeId === node.id 
              ? 'rgba(99, 102, 241, 0.2)' 
              : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${selectedNodeId === node.id 
              ? 'rgba(99, 102, 241, 0.5)' 
              : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (selectedNodeId !== node.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedNodeId !== node.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {node.isDuplicate && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(251, 191, 36, 1)',
                flexShrink: 0
              }} />
            )}
            <div style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {node.name}
            </div>
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {node.description && <span>{node.description.substring(0, 50)}{node.description.length > 50 ? '...' : ''}</span>}
            {node.isDuplicate && <span>• 重复</span>}
            {node.conflicts && node.conflicts.length > 0 && (
              <span>• {node.conflicts.length} 冲突</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Edge List Component
function EdgeList({
  edges,
  nodes,
  selectedEdgeId,
  onEdgeSelect
}: {
  edges: PreviewEdge[]
  nodes: PreviewNode[]
  selectedEdgeId: string | null
  onEdgeSelect: (edgeId: string, source?: 'list' | 'direct') => void
}) {
  const getNodeName = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.name || '未知节点'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {edges.map(edge => (
        <div
          key={edge.id}
          onClick={() => onEdgeSelect(edge.id, 'list')}
          style={{
            padding: '12px 16px',
            background: selectedEdgeId === edge.id 
              ? 'rgba(99, 102, 241, 0.2)' 
              : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${selectedEdgeId === edge.id 
              ? 'rgba(99, 102, 241, 0.5)' 
              : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (selectedEdgeId !== edge.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedEdgeId !== edge.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            }
          }}
        >
          <div style={{ 
            color: 'white', 
            fontSize: '14px', 
            fontWeight: '600',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {edge.label}
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{getNodeName(edge.fromNodeId)}</span>
            <span>→</span>
            <span>{getNodeName(edge.toNodeId)}</span>
            {edge.isRedundant && <span style={{ color: 'rgba(239, 68, 68, 1)' }}>• 冗余</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
// Node Editor Component
function NodeEditor({
  node,
  onNodeEdit,
  onClose,
  isLoading = false,
  autoFocus = true
}: {
  node: PreviewNode
  onNodeEdit: (nodeId: string, updates: Partial<PreviewNode>) => void
  onClose: () => void
  isLoading?: boolean
  autoFocus?: boolean
}) {
  const [editedNode, setEditedNode] = useState(node)
  const [hasChanges, setHasChanges] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Auto-update content when node changes (Task 2.3)
  useEffect(() => {
    setEditedNode(node)
    setHasChanges(false)
  }, [node])

  // Auto-focus on name input when component mounts or node changes (Task 2.3)
  useEffect(() => {
    if (autoFocus && nameInputRef.current && !isLoading) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100) // Small delay to ensure smooth transition
    }
  }, [node.id, autoFocus, isLoading])

  const handleFieldChange = (field: keyof PreviewNode, value: any) => {
    setEditedNode(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onNodeEdit(node.id, editedNode)
    setHasChanges(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with node identifier (Task 2.3) */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
            编辑节点
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
            {node.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          关闭
        </button>
      </div>

      {/* Loading overlay - Removed to prevent flickering */}
      {/* Form */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name Field */}
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              节点名称 *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={editedNode.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {/* Description Field */}
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              描述
            </label>
            <textarea
              value={editedNode.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isLoading}
              placeholder="输入节点描述（可选）"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? 'not-allowed' : 'text',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {hasChanges && !isLoading && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => {
              setEditedNode(node)
              setHasChanges(false)
            }}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            保存更改
          </button>
        </div>
      )}
    </div>
  )
}
// Edge Editor Component
function EdgeEditor({
  edge,
  nodes,
  onEdgeEdit,
  onClose
}: {
  edge: PreviewEdge
  nodes: PreviewNode[]
  onEdgeEdit: (edgeId: string, updates: Partial<PreviewEdge>) => void
  onClose: () => void
}) {
  const [editedEdge, setEditedEdge] = useState(edge)
  const [hasChanges, setHasChanges] = useState(false)

  const handleFieldChange = (field: keyof PreviewEdge, value: any) => {
    setEditedEdge(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onEdgeEdit(edge.id, editedEdge)
    setHasChanges(false)
  }

  const getNodeName = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.name || '未知节点'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
          编辑边
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          关闭
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Connection Info */}
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              连接关系
            </div>
            <div style={{ 
              color: 'white', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{getNodeName(edge.fromNodeId)}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</span>
              <span>{getNodeName(edge.toNodeId)}</span>
            </div>
          </div>

          {/* Label Field */}
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              边名称 *
            </label>
            <input
              type="text"
              value={editedEdge.label}
              onChange={(e) => handleFieldChange('label', e.target.value)}
              placeholder="输入边的名称（例如：属于、位于、包含等）"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => {
              setEditedEdge(edge)
              setHasChanges(false)
            }}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            保存更改
          </button>
        </div>
      )}
    </div>
  )
}

// Export the main component