'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'

export default function ControlPanel() {
  const { 
    selectedNode, 
    addNode, 
    deleteNode,
    connectingFromNode,
    setConnectingFromNode,
    setSelectedNode,
    updateNodeName,
  } = useGraphStore()
  
  const [isOpen, setIsOpen] = useState(true)
  const [editingName, setEditingName] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (selectedNode) {
      setEditingName(selectedNode.name)
    }
  }, [selectedNode])

  const handleAddNode = async (color: string, type: string) => {
    const name = type === 'document' ? 'Document' : `Chunk ${Date.now()}`
    
    await addNode({
      name,
      type,
      x: Math.random() * 20 - 10,
      y: Math.random() * 10,
      z: Math.random() * 20 - 10,
      color,
    })
  }

  const handleSaveName = async () => {
    if (selectedNode && editingName.trim()) {
      updateNodeName(selectedNode.id, editingName.trim())
      
      // 更新到数据库
      await fetch(`/api/nodes/${selectedNode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      })
      
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (selectedNode && confirm('确定要删除这个节点吗？')) {
      await deleteNode(selectedNode.id)
      setSelectedNode(null)
    }
  }

  const handleStartConnecting = () => {
    if (selectedNode) {
      setConnectingFromNode(selectedNode)
      setSelectedNode(null)
    }
  }

  const handleCancelConnecting = () => {
    setConnectingFromNode(null)
  }

  return (
    <div className="ui-overlay" style={{ top: 20, right: 20 }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        minWidth: '320px',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>3D 知识图谱</h2>
          <button onClick={() => setIsOpen(!isOpen)} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0 5px',
          }}>
            {isOpen ? '−' : '+'}
          </button>
        </div>

        {isOpen && (
          <>
            {connectingFromNode && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                background: 'rgba(16, 185, 129, 0.2)', 
                borderRadius: '8px',
                border: '2px solid #10b981'
              }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>🔗 连线模式</h3>
                <p style={{ margin: '10px 0', fontSize: '14px' }}>
                  从 <strong>{connectingFromNode.name}</strong> 连接
                </p>
                <p style={{ margin: '10px 0', fontSize: '13px', opacity: 0.8 }}>
                  点击目标节点完成连接
                </p>
                <button
                  onClick={handleCancelConnecting}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  取消连线
                </button>
              </div>
            )}

            {selectedNode && !connectingFromNode && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                background: 'rgba(59, 130, 246, 0.2)', 
                borderRadius: '8px',
                border: '2px solid #3b82f6'
              }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>✏️ 编辑节点</h3>
                
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px',
                        borderRadius: '6px',
                        border: '1px solid #3b82f6',
                        background: '#1a1a1a',
                        color: 'white',
                        fontSize: '14px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSaveName}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditingName(selectedNode.name)
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#6b7280',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {selectedNode.name}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '13px', opacity: 0.7 }}>
                      类型: {selectedNode.type}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => setIsEditing(true)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={handleStartConnecting}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        连线
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>➕ 创建节点</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => handleAddNode('#FFB6C1', 'document')}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFB6C1 0%, #FFA0B4 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(255, 182, 193, 0.3)',
                  }}
                >
                  📄 Document 节点
                </button>
                <button
                  onClick={() => handleAddNode('#FFE4B5', 'chunk')}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFE4B5 0%, #FFD89B 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(255, 228, 181, 0.3)',
                  }}
                >
                  📦 Chunk 节点
                </button>
              </div>
            </div>

            <div style={{ 
              padding: '12px', 
              background: 'rgba(100, 100, 100, 0.2)', 
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>💡 操作提示:</p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>点击节点选中并编辑</li>
                <li>选中后点击"连线"开始连接</li>
                <li>鼠标拖拽旋转视图</li>
                <li>滚轮缩放场景</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
