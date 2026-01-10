'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, updateNode } = useGraphStore()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.name || '')
      setDescription(selectedNode.description || '')
      // 解析 tags（如果是 JSON 字符串）
      try {
        const parsedTags = selectedNode.tags ? JSON.parse(selectedNode.tags) : []
        setTags(Array.isArray(parsedTags) ? parsedTags.join(', ') : '')
      } catch {
        setTags('')
      }
      setIsEditing(false)
    }
  }, [selectedNode])

  const handleSave = async () => {
    if (!selectedNode) return

    try {
      await updateNode(selectedNode.id, {
        name: name.trim() || '未命名',
        description: description.trim(),
        tags: JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)),
      })
      setIsEditing(false)
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleClose = () => {
    setSelectedNode(null)
    setIsEditing(false)
  }

  if (!selectedNode) return null

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      width: '350px',
      maxHeight: 'calc(100vh - 100px)',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
        }}>
          节点详情
        </h2>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {/* 名称 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}>
            名称
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6BB6FF'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          ) : (
            <div style={{
              padding: '10px',
              background: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
            }}>
              {name || '未命名'}
            </div>
          )}
        </div>

        {/* 描述 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}>
            描述
          </label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6BB6FF'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          ) : (
            <div style={{
              padding: '10px',
              background: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
              minHeight: '80px',
            }}>
              {description || '暂无描述'}
            </div>
          )}
        </div>

        {/* 标签 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}>
            标签
          </label>
          {isEditing ? (
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="用逗号分隔，例如：AI, RAG, NLP"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6BB6FF'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          ) : (
            <div style={{
              padding: '10px',
              background: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              {tags ? tags.split(',').map((tag, i) => (
                <span key={i} style={{
                  padding: '4px 10px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}>
                  {tag.trim()}
                </span>
              )) : (
                <span style={{ color: '#9ca3af' }}>暂无标签</span>
              )}
            </div>
          )}
        </div>

        {/* 元信息 */}
        <div style={{
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6b7280',
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>类型:</strong> {selectedNode.type}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>ID:</strong> {selectedNode.id.slice(0, 8)}...
          </div>
          <div>
            <strong>位置:</strong> ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)}, {selectedNode.z.toFixed(1)})
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '10px',
      }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px',
                background: '#6BB6FF',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              保存
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setName(selectedNode.name || '')
                setDescription(selectedNode.description || '')
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              flex: 1,
              padding: '10px',
              background: '#6BB6FF',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            编辑
          </button>
        )}
      </div>
    </div>
  )
}
