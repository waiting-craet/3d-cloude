'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'
import { getThemeConfig } from '@/lib/theme'
import { EditableInput } from './EditableInput'
import { InlineImageUpload } from './InlineImageUpload'
import { ColorPicker } from './ColorPicker'
import { ShapeSelector } from './ShapeSelector'
import { SizeSelector } from './SizeSelector'

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, deleteNode, fetchGraph, updateNodeLocal, theme } = useGraphStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 获取当前主题配置
  const themeConfig = getThemeConfig(theme)

  // 编辑状态
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedImageUrl, setEditedImageUrl] = useState('')
  
  // 外观编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedColor, setEditedColor] = useState('')
  const [editedTextColor, setEditedTextColor] = useState('')
  const [colorMode, setColorMode] = useState<'node' | 'text'>('node') // 选择修改节点颜色还是文字颜色
  const [editedShape, setEditedShape] = useState('sphere')
  const [editedSize, setEditedSize] = useState(1)

  // 初始化编辑状态
  useEffect(() => {
    if (selectedNode) {
      // 只在不是编辑模式时才重置状态
      if (!isEditMode) {
        setEditedName(selectedNode.name || '')
        setEditedDescription(selectedNode.description || '')
        setEditedImageUrl(selectedNode.imageUrl || '')
        setEditedColor(selectedNode.color || '#6BB6FF')
        setEditedTextColor(selectedNode.textColor || '#FFFFFF')
        setEditedShape(selectedNode.shape || 'sphere')
        setEditedSize(selectedNode.size || 1)
        setColorMode('node') // 重置颜色模式
      }
    }
  }, [selectedNode?.id]) // 只依赖于selectedNode的id，而不是整个selectedNode对象

  // 检查管理员状态
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    setIsAdmin(savedIsAdmin === 'true')

    // 监听登录状态变化
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

  // 检查是否有变更
  const hasChanges = (): boolean => {
    if (!selectedNode) return false
    return (
      editedName !== selectedNode.name ||
      editedDescription !== (selectedNode.description || '') ||
      editedImageUrl !== (selectedNode.imageUrl || '')
    )
  }

  // 验证输入
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

  // 保存更改
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
      // 更新全局状态
      updateNodeLocal(selectedNode.id, updatedNode)
      return true
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // 处理关闭
  const handleClose = async () => {
    if (isAdmin && hasChanges()) {
      const saved = await saveChanges()
      if (!saved) return // 保存失败，不关闭面板
    }
    setSelectedNode(null)
  }

  // ESC键关闭
  useEffect(() => {
    const handleEsc = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        await handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [selectedNode, isAdmin, editedName, editedDescription, editedImageUrl])

  const handleEdit = () => {
    // 切换到编辑模式
    setIsEditMode(true)
  }

  // 实时更新颜色 - 直接更新本地状态，不保存到数据库
  const handleColorChange = (color: string) => {
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

  // 实时更新形状 - 直接更新本地状态，不保存到数据库
  const handleShapeChange = (shape: string) => {
    setEditedShape(shape)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { shape })
    }
  }

  // 实时更新大小 - 直接更新本地状态，不保存到数据库
  const handleSizeChange = (size: number) => {
    setEditedSize(size)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { size })
    }
  }

  // 重置外观到默认值
  const handleResetAppearance = () => {
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
    }
    setIsEditMode(false)
  }

  const handleDelete = async () => {
    if (!selectedNode) return
    
    if (!confirm(`确定要删除节点"${selectedNode.name}"吗？\n\n此操作将同时删除与该节点相关的所有连接，且无法撤销。`)) {
      return
    }

    try {
      await deleteNode(selectedNode.id)
      alert('删除成功！')
      setSelectedNode(null)
      // 刷新图谱数据
      fetchGraph()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
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
      {/* 头部 - 渐变背景 */}
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
          <span style={{ fontSize: '24px' }}>{isEditMode ? '🎨' : '📋'}</span>
          {isEditMode ? '修改节点' : '节点详情'}
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
          onMouseOver={(e) => {
            if (!isSaving) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'rotate(90deg)'
            }
          }}
          onMouseOut={(e) => {
            if (!isSaving) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }
          }}
        >
          ×
        </button>
      </div>

      {/* 内容区域 */}
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
          // 编辑模式：显示颜色、形状、大小和发光选择器
          <>
            {/* 颜色模式选择器 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px',
              }}>
                修改颜色
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
                  onMouseOver={(e) => {
                    if (colorMode !== 'node') {
                      e.currentTarget.style.borderColor = '#6BB6FF'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (colorMode !== 'node') {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }
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
                  onMouseOver={(e) => {
                    if (colorMode !== 'text') {
                      e.currentTarget.style.borderColor = '#6BB6FF'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (colorMode !== 'text') {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }
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
          // 查看模式：显示节点信息
          <>
            {/* 名称 - 可编辑 */}
            <EditableInput
              label="名称"
              value={editedName}
              onChange={setEditedName}
              placeholder="请输入节点名称"
              maxLength={100}
              disabled={!isAdmin || isSaving}
            />

            {/* 描述 - 可编辑 */}
            <EditableInput
              label="简介"
              value={editedDescription}
              onChange={setEditedDescription}
              placeholder="请输入节点简介"
              maxLength={1000}
              multiline
              rows={4}
              disabled={!isAdmin || isSaving}
            />

            {/* 图片上传 */}
            <InlineImageUpload
              nodeId={selectedNode.id}
              currentImageUrl={editedImageUrl}
              onImageChange={setEditedImageUrl}
              disabled={!isAdmin || isSaving}
            />
          </>
        )}
      </div>

      {/* 底部按钮 - 仅管理员可见 */}
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
            // 编辑模式：显示重置按钮
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
              onMouseOver={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>↺</span>
              重置
            </button>
          ) : (
            // 查看模式：显示修改和删除按钮
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
                onMouseOver={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 182, 255, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 182, 255, 0.3)'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>✏️</span>
                修改
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
                onMouseOver={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }
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
