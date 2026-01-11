'use client'

import { useState } from 'react'
import { useGraphStore } from '@/lib/store'

export default function TopNavbar() {
  const { 
    addNode, 
    selectedNode, 
    connectingFromNode, 
    setConnectingFromNode,
    setSelectedNode,
  } = useGraphStore()
  
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [nodeName, setNodeName] = useState('')

  const handleAddNode = async () => {
    if (!nodeName.trim()) return
    
    await addNode({
      name: nodeName,
      type: 'entity',
      x: Math.random() * 20 - 10,
      y: Math.random() * 15,
      z: Math.random() * 20 - 10,
      color: '#4A9EFF',
      size: 1.5,
    })
    
    setNodeName('')
    setIsAddingNode(false)
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
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      background: 'rgba(40, 40, 40, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '15px',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Logo */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#4A9EFF',
        marginRight: '20px',
      }}>
        3D 知识图谱
      </div>

      {/* 添加节点按钮 */}
      {!isAddingNode ? (
        <button
          onClick={() => setIsAddingNode(true)}
          style={{
            padding: '6px 16px',
            background: '#4A9EFF',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#3A8EEF'}
          onMouseOut={(e) => e.currentTarget.style.background = '#4A9EFF'}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          添加节点
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="节点名称"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNode()}
            autoFocus
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              width: '200px',
            }}
          />
          <button
            onClick={handleAddNode}
            style={{
              padding: '6px 12px',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            确定
          </button>
          <button
            onClick={() => {
              setIsAddingNode(false)
              setNodeName('')
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
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
      )}

      {/* 连线按钮 */}
      {selectedNode && !connectingFromNode && (
        <button
          onClick={handleStartConnecting}
          style={{
            padding: '6px 16px',
            background: '#10b981',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '16px' }}>🔗</span>
          连线
        </button>
      )}

      {/* 连线模式提示 */}
      {connectingFromNode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 16px',
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '6px',
          border: '1px solid #10b981',
        }}>
          <span style={{ color: '#10b981', fontSize: '14px' }}>
            从 "{connectingFromNode.name}" 连接...
          </span>
          <button
            onClick={handleCancelConnecting}
            style={{
              padding: '4px 10px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            取消
          </button>
        </div>
      )}

      {/* 选中节点信息 */}
      {selectedNode && !connectingFromNode && (
        <div style={{
          marginLeft: 'auto',
          padding: '6px 16px',
          background: 'rgba(74, 158, 255, 0.2)',
          borderRadius: '6px',
          border: '1px solid #4A9EFF',
          color: 'white',
          fontSize: '14px',
        }}>
          已选中: <strong>{selectedNode.name}</strong>
        </div>
      )}

      {/* 工具按钮 */}
      <div style={{ marginLeft: connectingFromNode || selectedNode ? '0' : 'auto', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          title="刷新"
        >
          🔄
        </button>
      </div>
    </nav>
  )
}
