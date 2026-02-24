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
  const [isEditMode, setIsEditMode] = useState(false)

  const themeConfig = getThemeConfig(theme)

  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedImageUrl, setEditedImageUrl] = useState('')
  const [editedColor, setEditedColor] = useState('')
  const [editedTextColor, setEditedTextColor] = useState('')
  const [colorMode, setColorMode] = useState<'node' | 'text'>('node')
  const [editedShape, setEditedShape] = useState('sphere')
  const [editedSize, setEditedSize] = useState(1)

  useEffect(() => {
    if (selectedNode) {
      setEditedName(selectedNode.name || '')
      setEditedDescription(selectedNode.description || '')
      setEditedImageUrl(selectedNode.imageUrl || '')
      setEditedColor(selectedNode.color || '#6BB6FF')
      setEditedTextColor(selectedNode.textColor || '#FFFFFF')
      setEditedShape(selectedNode.shape || 'sphere')
      setEditedSize(selectedNode.size || 1)
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
      editedName !== selectedNode.name ||
      editedDescription !== (selectedNode.description || '') ||
      editedImageUrl !== (selectedNode.imageUrl || '')
    )
  }

  const validateInput = (): { valid: boolean; error?: string } => {
    if (!editedName.trim()) {
      return { valid: false, error: 'Node name cannot be empty' }
    }
    if (editedName.length > 100) {
      return { valid: false, error: 'Node name cannot exceed 100 characters' }
    }
    if (editedDescription.length > 1000) {
      return { valid: false, error: 'Node description cannot exceed 1000 characters' }
    }
    return { valid: true }
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
        throw new Error('Save failed')
      }

      return true
    } catch (error) {
      console.error('Save failed:', error)
      alert('Save failed, please try again')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = async () => {
    if (isAdmin && hasChanges()) {
      const saved = await saveChanges()
      if (!saved) return
    }
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
  }, [selectedNode, isAdmin, editedName, editedDescription, editedImageUrl])

  const handleEdit = () => {
    setIsEditMode(true)
  }

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

  const handleShapeChange = (shape: string) => {
    setEditedShape(shape)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { shape })
    }
  }

  const handleSizeChange = (size: number) => {
    setEditedSize(size)
    if (selectedNode) {
      updateNodeLocal(selectedNode.id, { size })
    }
  }

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

    if (!confirm(`Are you sure you want to delete node "${selectedNode.name}"?\n\nThis will also delete all connections to this node and cannot be undone.`)) {
      return
    }

    try {
      await deleteNode(selectedNode.id)
      alert('Node deleted successfully')
      setSelectedNode(null)
      fetchGraph()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Delete failed, please try again')
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
          {isEditMode ? 'Edit Node' : 'Node Details'}
          {isSaving && (
            <span style={{ fontSize: '14px', fontWeight: '400', marginLeft: '8px' }}>
              Saving...
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
                Edit Appearance
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
                  🎨 Node Color
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
                  ✏️ Text Color
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
              label="Name"
              value={editedName}
              onChange={setEditedName}
              placeholder="Enter node name"
              maxLength={100}
              disabled={!isAdmin || isSaving}
            />

            <EditableInput
              label="Description"
              value={editedDescription}
              onChange={setEditedDescription}
              placeholder="Enter node description"
              maxLength={1000}
              multiline
              rows={4}
              disabled={!isAdmin || isSaving}
            />

            <InlineImageUpload
              nodeId={selectedNode.id}
              currentImageUrl={editedImageUrl}
              onImageChange={setEditedImageUrl}
              disabled={!isAdmin || isSaving}
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
              Reset
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
                Edit
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
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
