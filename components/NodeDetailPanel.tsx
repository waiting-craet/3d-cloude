'use client'

import { useState, useEffect, useRef } from 'react'
import { useGraphStore } from '@/lib/store'
import { getThemeConfig } from '@/lib/theme'
import { EditableInput } from './EditableInput'
import { InlineImageUpload } from './InlineImageUpload'
import { ColorPicker } from './ColorPicker'
import { ShapeSelector } from './ShapeSelector'
import { SizeSelector } from './SizeSelector'

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, deleteNode, fetchGraph, updateNodeLocal, updateNode, theme } = useGraphStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // 标记是否正在删除

  const themeConfig = getThemeConfig(theme)

  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedImageUrl, setEditedImageUrl] = useState('')
  const [editedColor, setEditedColor] = useState('')
  const [editedTextColor, setEditedTextColor] = useState('')
  const [colorMode, setColorMode] = useState<'node' | 'text'>('node')
  const [editedShape, setEditedShape] = useState('sphere')
  const [editedSize, setEditedSize] = useState(1)

  // 保存原始值用于比较
  const [originalValues, setOriginalValues] = useState({
    name: '',
    description: '',
    imageUrl: '',
    color: '',
    textColor: '',
    shape: '',
    size: 1
  })

  // 使用 ref 来跟踪最新的编辑状态
  const editStateRef = useRef({
    name: '',
    description: '',
    imageUrl: '',
    color: '',
    textColor: '',
    shape: '',
    size: 1,
    nodeId: '',
    isDeleting: false,
    originalValues: {
      name: '',
      description: '',
      imageUrl: '',
      color: '',
      textColor: '',
      shape: '',
      size: 1
    }
  })

  // 更新 ref 以跟踪最新状态
  useEffect(() => {
    editStateRef.current = {
      name: editedName,
      description: editedDescription,
      imageUrl: editedImageUrl,
      color: editedColor,
      textColor: editedTextColor,
      shape: editedShape,
      size: editedSize,
      nodeId: selectedNode?.id || '',
      isDeleting: isDeleting,
      originalValues: originalValues
    }
  }, [editedName, editedDescription, editedImageUrl, editedColor, editedTextColor, editedShape, editedSize, selectedNode?.id, isDeleting, originalValues])

  useEffect(() => {
    if (selectedNode) {
      const originalColor = selectedNode.color || '#6BB6FF'
      const originalTextColor = selectedNode.textColor || '#FFFFFF'
      const originalShape = selectedNode.shape || 'sphere'
      const originalSize = selectedNode.size || 1
      
      console.log('📋 [NodeDetailPanel] 节点选中，初始化编辑状态:', {
        nodeId: selectedNode.id,
        name: selectedNode.name,
        color: originalColor,
        textColor: originalTextColor,
        shape: originalShape,
        size: originalSize
      })
      
      // 设置编辑值
      setEditedName(selectedNode.name || '')
      setEditedDescription(selectedNode.description || '')
      setEditedImageUrl(selectedNode.imageUrl || '')
      setEditedColor(originalColor)
      setEditedTextColor(originalTextColor)
      setEditedShape(originalShape)
      setEditedSize(originalSize)
      
      // 保存原始值用于比较
      setOriginalValues({
        name: selectedNode.name || '',
        description: selectedNode.description || '',
        imageUrl: selectedNode.imageUrl || '',
        color: originalColor,
        textColor: originalTextColor,
        shape: originalShape,
        size: originalSize
      })
      
      setColorMode('node')
      setIsEditMode(false)
    }
  }, [selectedNode?.id])

  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    setIsAdmin(savedIsAdmin === 'true')

    const handleLoginStateChange = () => {
      const currentIsAdmin = localStorage.getItem('isAdmin')
      setIsAdmin(currentIsAdmin === 'true')
    }

    window.addEventListener('loginStateChange', handleLoginStateChange)
    window.addEventListener('storage', handleLoginStateChange)

    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
      window.removeEventListener('storage', handleLoginStateChange)
    }
  }, [])

  const hasChanges = (): boolean => {
    if (!selectedNode) return false
    return (
      editedName !== originalValues.name ||
      editedDescription !== originalValues.description ||
      editedImageUrl !== originalValues.imageUrl
    )
  }

  const hasAppearanceChanges = (): boolean => {
    if (!selectedNode) return false
    const hasChanges = (
      editedColor !== originalValues.color ||
      editedTextColor !== originalValues.textColor ||
      editedShape !== originalValues.shape ||
      editedSize !== originalValues.size
    )
    
    console.log('🔍 [NodeDetailPanel] 检查外观修改:', {
      editedColor,
      originalColor: originalValues.color,
      editedTextColor,
      originalTextColor: originalValues.textColor,
      editedShape,
      originalShape: originalValues.shape,
      editedSize,
      originalSize: originalValues.size,
      hasChanges
    })
    
    return hasChanges
  }

  const validateInput = (): { valid: boolean; error?: string } => {
    if (!editedName.trim()) {
      return { valid: false, error: '节点名称不能为空' }
    }
    if (editedName.length > 100) {
      return { valid: false, error: '节点名称不能超过100个字符' }
    }
    if (editedDescription.length > 1000) {
      return { valid: false, error: '节点描述不能超过1000个字符' }
    }
    return { valid: true }
  }

  const saveAppearanceChanges = async (): Promise<boolean> => {
    if (!selectedNode || !hasAppearanceChanges()) return true

    console.log('🎨 [NodeDetailPanel] 开始保存外观修改:', {
      nodeId: selectedNode.id,
      color: editedColor,
      textColor: editedTextColor,
      shape: editedShape,
      size: editedSize
    })

    setIsSaving(true)
    try {
      const response = await fetch(`/api/nodes/${selectedNode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: editedColor,
          textColor: editedTextColor,
          shape: editedShape,
          size: editedSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [NodeDetailPanel] 保存外观失败:', errorData)
        throw new Error('保存外观失败')
      }

      console.log('✅ [NodeDetailPanel] 外观保存成功')

      // 更新 store 中的节点数据
      await updateNode(selectedNode.id, {
        color: editedColor,
        textColor: editedTextColor,
        shape: editedShape,
        size: editedSize,
      })

      return true
    } catch (error) {
      console.error('❌ [NodeDetailPanel] 保存外观失败:', error)
      alert('保存外观失败，请重试')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const saveChanges = async (): Promise<boolean> => {
    if (!selectedNode || !hasChanges()) return true

    const validation = validateInput()
    if (!validation.valid) {
      alert(validation.error)
      return false
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/nodes/${selectedNode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          imageUrl: editedImageUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      const updatedNode = await response.json()
      
      // 更新 store 中的节点数据，触发重新渲染
      await updateNode(selectedNode.id, {
        name: editedName,
        description: editedDescription,
        imageUrl: editedImageUrl,
      })

      return true
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = async () => {
    console.log('🔄 [NodeDetailPanel] 开始关闭弹窗，检查修改...')
    
    // 如果有基本信息修改，自动保存
    if (hasChanges()) {
      console.log('📝 [NodeDetailPanel] 检测到基本信息修改，开始保存...')
      const saved = await saveChanges()
      if (!saved) return // 如果保存失败，不关闭弹窗
    }
    
    // 如果有外观修改，自动保存
    if (hasAppearanceChanges()) {
      console.log('🎨 [NodeDetailPanel] 检测到外观修改，开始保存...')
      const saved = await saveAppearanceChanges()
      if (!saved) return // 如果保存失败，不关闭弹窗
    }
    
    console.log('✅ [NodeDetailPanel] 弹窗关闭完成')
    setSelectedNode(null)
  }

  useEffect(() => {
    const handleEsc = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        await handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [selectedNode, editedName, editedDescription, editedImageUrl])

  // 监听 selectedNode 变化，当弹窗被外部关闭时自动保存
  useEffect(() => {
    const previousNode = selectedNode

    return () => {
      // 组件卸载或 selectedNode 变化时
      const state = editStateRef.current
      
      // 如果正在删除，不保存
      if (state.isDeleting) {
        return
      }

      // 如果有节点 ID 且有修改，自动保存
      if (state.nodeId && previousNode) {
        // 检查基本信息修改
        const hasBasicChanges = 
          state.name !== state.originalValues.name ||
          state.description !== state.originalValues.description ||
          state.imageUrl !== state.originalValues.imageUrl

        // 检查外观修改
        const hasAppearanceChanges = 
          state.color !== state.originalValues.color ||
          state.textColor !== state.originalValues.textColor ||
          state.shape !== state.originalValues.shape ||
          state.size !== state.originalValues.size

        // 保存基本信息修改
        if (hasBasicChanges) {
          // 验证输入
          if (!state.name.trim()) {
            console.warn('节点名称不能为空，跳过保存')
            return
          }
          if (state.name.length > 100 || state.description.length > 1000) {
            console.warn('输入超出长度限制，跳过保存')
            return
          }

          // 异步保存基本信息，不阻塞关闭
          fetch(`/api/nodes/${state.nodeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: state.name,
              description: state.description,
              imageUrl: state.imageUrl,
            }),
          })
          .then(response => {
            if (response.ok) {
              console.log('基本信息自动保存成功')
              fetchGraph()
            }
          })
          .catch(error => {
            console.error('基本信息自动保存失败:', error)
          })
        }

        // 保存外观修改
        if (hasAppearanceChanges) {
          // 异步保存外观，不阻塞关闭
          fetch(`/api/nodes/${state.nodeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              color: state.color,
              textColor: state.textColor,
              shape: state.shape,
              size: state.size,
            }),
          })
          .then(response => {
            if (response.ok) {
              console.log('外观自动保存成功')
              fetchGraph()
            }
          })
          .catch(error => {
            console.error('外观自动保存失败:', error)
          })
        }
      }
    }
  }, [selectedNode])

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleColorChange = (color: string) => {
    console.log('🎨 [NodeDetailPanel] 颜色修改:', { colorMode, color })
    if (colorMode === 'node') {
      setEditedColor(color)
      if (selectedNode) {
        updateNodeLocal(selectedNode.id, { color })
      }
    } else {
      setEditedTextColor(color)
      if (selectedNode) {
        updateNodeLocal(selectedNode.id, { textColor: color })
      }
    }
  }

  const handleShapeChange = (shape: string) => {
    console.log('🔷 [NodeDetailPanel] 形状修改:', { shape })
    setEditedShape(shape)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { shape })
    }
  }

  const handleSizeChange = (size: number) => {
    console.log('📏 [NodeDetailPanel] 大小修改:', { size })
    setEditedSize(size)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { size })
    }
  }

  const handleResetAppearance = async () => {
    console.log('↺ [NodeDetailPanel] 重置外观')
    const defaultColor = '#6BB6FF'
    const defaultTextColor = '#FFFFFF'
    const defaultShape = 'sphere'
    const defaultSize = 2
    const defaultIsGlowing = false

    setEditedColor(defaultColor)
    setEditedTextColor(defaultTextColor)
    setEditedShape(defaultShape)
    setEditedSize(defaultSize)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, {
        color: defaultColor,
        textColor: defaultTextColor,
        shape: defaultShape,
        size: defaultSize,
        isGlowing: defaultIsGlowing
      })
      
      // 立即保存重置的外观
      try {
        const response = await fetch(`/api/nodes/${selectedNode.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            color: defaultColor,
            textColor: defaultTextColor,
            shape: defaultShape,
            size: defaultSize,
          }),
        })
        
        if (response.ok) {
          console.log('✅ [NodeDetailPanel] 重置外观保存成功')
          await updateNode(selectedNode.id, {
            color: defaultColor,
            textColor: defaultTextColor,
            shape: defaultShape,
            size: defaultSize,
          })
        } else {
          console.error('❌ [NodeDetailPanel] 重置外观保存失败')
        }
      } catch (error) {
        console.error('❌ [NodeDetailPanel] 重置外观保存错误:', error)
      }
    }
    setIsEditMode(false)
  }

  const handleDelete = async () => {
    if (!selectedNode) return

    if (!confirm(`确定要删除节点 "${selectedNode.name}" 吗？\n\n这将同时删除所有与该节点相关的连接，且无法撤销。`)) {
      return
    }

    setIsDeleting(true) // 标记正在删除，跳过保存逻辑
    try {
      await deleteNode(selectedNode.id)
      alert('节点删除成功')
      setSelectedNode(null)
      fetchGraph()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!selectedNode) return null

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        width: '380px',
        maxHeight: 'calc(100vh - 100px)',
        background: themeConfig.panelBackground,
        borderRadius: '16px',
        boxShadow: themeConfig.panelShadow,
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${themeConfig.panelBorder}`,
        animation: 'slideInRight 0.3s ease-out',
        transition: 'all 0.3s ease',
      }}>
      <div style={{
        padding: '24px',
        background: themeConfig.panelHeaderBackground,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(107, 182, 255, 0.3)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: themeConfig.panelHeaderText,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '24px' }}>{isEditMode ? '✏️' : '📋'}</span>
          {isEditMode ? '编辑节点' : '节点详情'}
          {isSaving && (
            <span style={{ fontSize: '14px', fontWeight: '400', marginLeft: '8px' }}>
              保存中...
            </span>
          )}
        </h2>
        <button
          onClick={handleClose}
          disabled={isSaving}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            fontSize: '24px',
            color: 'white',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            padding: '4px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s',
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          ✕
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
        }}>
        {isEditMode ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px',
              }}>
                编辑外观
              </label>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setColorMode('node')
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: colorMode === 'node' ? '2px solid #6BB6FF' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: colorMode === 'node' ? 'rgba(107, 182, 255, 0.1)' : 'white',
                    color: colorMode === 'node' ? '#6BB6FF' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  🎨 节点颜色
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setColorMode('text')
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: colorMode === 'text' ? '2px solid #6BB6FF' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: colorMode === 'text' ? 'rgba(107, 182, 255, 0.1)' : 'white',
                    color: colorMode === 'text' ? '#6BB6FF' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ✏️ 文字颜色
                </button>
              </div>
            </div>

            <ColorPicker
              value={colorMode === 'node' ? editedColor : editedTextColor}
              onChange={handleColorChange}
              disabled={isSaving}
            />

            <ShapeSelector
              value={editedShape}
              onChange={handleShapeChange}
              disabled={isSaving}
            />

            <SizeSelector
              value={editedSize}
              onChange={handleSizeChange}
              disabled={isSaving}
            />
          </>
        ) : (
          <>
            <EditableInput
              label="名称"
              value={editedName}
              onChange={setEditedName}
              placeholder="输入节点名称"
              maxLength={100}
              disabled={isSaving}
            />

            <EditableInput
              label="描述"
              value={editedDescription}
              onChange={setEditedDescription}
              placeholder="输入节点描述"
              maxLength={1000}
              multiline
              rows={4}
              disabled={isSaving}
            />

            <InlineImageUpload
              nodeId={selectedNode.id}
              currentImageUrl={editedImageUrl}
              onImageChange={setEditedImageUrl}
              disabled={isSaving}
            />
          </>
        )}
      </div>

      {isAdmin && (
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${themeConfig.dividerColor}`,
          display: 'flex',
          gap: '12px',
          background: theme === 'dark'
            ? 'rgba(249, 250, 251, 0.05)'
            : 'rgba(249, 250, 251, 0.8)',
          transition: 'all 0.3s ease',
        }}>
          {isEditMode ? (
            <button
              onClick={handleResetAppearance}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '16px' }}>↺</span>
              重置
            </button>
          ) : (
            <>
              <button
                onClick={handleEdit}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(107, 182, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '16px' }}>✏️</span>
                编辑
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '16px' }}>🗑️</span>
                删除
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
