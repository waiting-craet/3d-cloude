'use client'

import { useState, useEffect } from 'react'

export default function TextPage() {
  const [inputText, setInputText] = useState('')
  const [outputFormat, setOutputFormat] = useState<'2d' | '3d'>('2d')
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: number
    type: string
    content: string
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // 项目和图谱相关状态
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedGraph, setSelectedGraph] = useState<string>('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewGraphModal, setShowNewGraphModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newGraphName, setNewGraphName] = useState('')
  
  // 模拟项目和图谱数据（实际应该从API获取）
  const [projects] = useState([
    { id: '1', name: '项目 A' },
    { id: '2', name: '项目 B' },
    { id: '3', name: '项目 C' },
  ])
  
  const [graphs] = useState([
    { id: '1', name: '图谱 1', projectId: '1' },
    { id: '2', name: '图谱 2', projectId: '1' },
    { id: '3', name: '图谱 3', projectId: '2' },
  ])

  // 修复页面滚动问题
  useEffect(() => {
    // 保存原始样式
    const originalOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    
    // 允许滚动
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    
    // 清理函数：恢复原始样式
    return () => {
      document.body.style.overflow = originalOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type || getFileType(file.name),
          content: content
        })
      }
      reader.readAsText(file)
    }
  }

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const typeMap: { [key: string]: string } = {
      'txt': '文本文件',
      'md': 'Markdown',
      'json': 'JSON',
      'csv': 'CSV',
      'xlsx': 'Excel',
      'xls': 'Excel'
    }
    return typeMap[ext || ''] || '未知类型'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setShowPreview(false)
  }

  const handleConvert = () => {
    // 功能实现将在后续添加
    console.log('转换为', outputFormat === '2d' ? '二维图谱' : '三维图谱')
    console.log('项目ID:', selectedProject)
    console.log('图谱ID:', selectedGraph)
    if (uploadedFile) {
      console.log('文件内容:', uploadedFile.content)
    } else {
      console.log('文本内容:', inputText)
    }
  }

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      console.log('创建项目:', newProjectName)
      // 实际应该调用API创建项目
      setShowNewProjectModal(false)
      setNewProjectName('')
    }
  }

  const handleCreateGraph = () => {
    if (newGraphName.trim() && selectedProject) {
      console.log('创建图谱:', newGraphName, '在项目:', selectedProject)
      // 实际应该调用API创建图谱
      setShowNewGraphModal(false)
      setNewGraphName('')
    }
  }

  const filteredGraphs = graphs.filter(g => g.projectId === selectedProject)

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #0f0f1e 50%, #1a1a2e 100%)',
      padding: '60px 20px 80px 20px',
      position: 'relative',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 标题区域 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '20px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'rgba(167, 139, 250, 1)',
            fontWeight: '500',
            letterSpacing: '0.5px',
          }}>
            ✨ AI 驱动的智能分析
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-1px',
          }}>
            知识图谱生成器
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            导入数据或输入文本，AI 将自动提取实体关系，生成可视化知识图谱
          </p>
        </div>

        {/* 主内容区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}>
          {/* 项目和图谱选择区域 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}>
                📁
              </div>
              <h2 style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
              }}>
                项目与图谱
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}>
              {/* 项目选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  选择项目
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                }}>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value)
                      setSelectedGraph('')
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>
                    <option value="">请选择项目</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '10px',
                      color: 'rgba(52, 211, 153, 1)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}>
                    ➕ 新建
                  </button>
                </div>
              </div>

              {/* 图谱选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                }}>
                  选择图谱
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                }}>
                  <select
                    value={selectedGraph}
                    onChange={(e) => setSelectedGraph(e.target.value)}
                    disabled={!selectedProject}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: selectedProject ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: selectedProject ? 'white' : 'rgba(255, 255, 255, 0.4)',
                      fontSize: '14px',
                      cursor: selectedProject ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                    }}>
                    <option value="">请选择图谱</option>
                    {filteredGraphs.map(graph => (
                      <option key={graph.id} value={graph.id}>
                        {graph.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewGraphModal(true)}
                    disabled={!selectedProject}
                    style={{
                      padding: '12px 20px',
                      background: selectedProject 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '10px',
                      color: selectedProject ? 'rgba(52, 211, 153, 1)' : 'rgba(255, 255, 255, 0.3)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: selectedProject ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      opacity: selectedProject ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                        e.currentTarget.style.transform = 'scale(1)'
                      }
                    }}>
                    ➕ 新建
                  </button>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            {!selectedProject && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '10px',
                color: 'rgba(251, 191, 36, 1)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>⚠️</span>
                <span>请先选择或创建一个项目</span>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}>
                📝
              </div>
              <h2 style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
              }}>
                数据输入
              </h2>
            </div>

            {/* 文件上传按钮 */}
            <div style={{
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                border: '2px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                color: 'rgba(167, 139, 250, 1)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '15px',
                fontWeight: '600',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)'
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)'
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <span style={{ fontSize: '20px' }}>📁</span>
                导入文件
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* 已导入文件信息卡片 */}
            {uploadedFile && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'rgba(34, 197, 94, 1)',
                      fontSize: '15px',
                      fontWeight: '700',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.2)',
                      }}>✓</span>
                      文件已导入
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '14px',
                      marginBottom: '6px',
                      fontWeight: '500',
                    }}>
                      📄 {uploadedFile.name}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '13px',
                      display: 'flex',
                      gap: '12px',
                    }}>
                      <span>类型: {uploadedFile.type}</span>
                      <span>•</span>
                      <span>大小: {formatFileSize(uploadedFile.size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: 'rgba(248, 113, 113, 1)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}>
                    🗑️ 移除
                  </button>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px',
                    color: 'rgba(96, 165, 250, 1)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                  }}>
                  {showPreview ? '🔼 收起预览' : '🔽 展开预览'}
                </button>

                {/* 文件预览 */}
                {showPreview && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}>
                    <pre style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      margin: 0,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {uploadedFile.content.slice(0, 2000)}
                      {uploadedFile.content.length > 2000 && '\n\n... (内容过长，仅显示前2000字符)'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 数据类型说明 */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                marginBottom: '12px',
                fontWeight: '600',
              }}>
                支持的数据格式
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}>
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>📊</div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(34, 197, 94, 1)',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    结构化
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Excel, CSV
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔗</div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(59, 130, 246, 1)',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    半结构化
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    JSON
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>📝</div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(168, 85, 247, 1)',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    非结构化
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    TXT, MD
                  </div>
                </div>
              </div>
            </div>

            {/* 文本输入框 */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!!uploadedFile}
              placeholder={uploadedFile 
                ? "已导入文件，如需手动输入请先移除文件" 
                : "在此输入或粘贴文本内容...&#10;&#10;支持的数据类型：&#10;• 结构化数据（Excel表格、CSV文件）&#10;• 半结构化数据（JSON格式）&#10;• 非结构化文本（文章、笔记、Markdown等）&#10;&#10;AI将自动识别数据格式并提取实体关系"}
              style={{
                width: '100%',
                minHeight: '250px',
                maxHeight: '500px',
                padding: '18px',
                background: uploadedFile ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                fontFamily: 'monospace',
                cursor: uploadedFile ? 'not-allowed' : 'text',
                opacity: uploadedFile ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            />

            <div style={{
              marginTop: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
            }}>
              {uploadedFile 
                ? `文件大小: ${formatFileSize(uploadedFile.size)}`
                : `字符数: ${inputText.length}`}
            </div>
          </div>

          {/* 配置区域 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}>
                ⚙️
              </div>
              <h2 style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
              }}>
                输出配置
              </h2>
            </div>

            {/* 输出格式选择 */}
            <div style={{
              marginBottom: '28px',
            }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '16px',
              }}>
                选择图谱类型
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                {/* 2D选项 */}
                <div
                  onClick={() => setOutputFormat('2d')}
                  style={{
                    padding: '24px',
                    background: outputFormat === '2d' 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: outputFormat === '2d'
                      ? '2px solid rgba(99, 102, 241, 0.6)'
                      : '2px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    boxShadow: outputFormat === '2d' 
                      ? '0 8px 24px rgba(99, 102, 241, 0.25)' 
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (outputFormat !== '2d') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outputFormat !== '2d') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}>
                  <div style={{
                    fontSize: '40px',
                    marginBottom: '12px',
                  }}>
                    📊
                  </div>
                  <div style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '6px',
                  }}>
                    二维图谱
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                  }}>
                    平面网络视图
                  </div>
                </div>

                {/* 3D选项 */}
                <div
                  onClick={() => setOutputFormat('3d')}
                  style={{
                    padding: '24px',
                    background: outputFormat === '3d' 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: outputFormat === '3d'
                      ? '2px solid rgba(99, 102, 241, 0.6)'
                      : '2px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    boxShadow: outputFormat === '3d' 
                      ? '0 8px 24px rgba(99, 102, 241, 0.25)' 
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (outputFormat !== '3d') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outputFormat !== '3d') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}>
                  <div style={{
                    fontSize: '40px',
                    marginBottom: '12px',
                  }}>
                    🌐
                  </div>
                  <div style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '6px',
                  }}>
                    三维图谱
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                  }}>
                    立体空间视图
                  </div>
                </div>
              </div>
            </div>

            {/* 转换按钮 */}
            <button
              onClick={handleConvert}
              disabled={!uploadedFile && !inputText.trim()}
              style={{
                width: '100%',
                padding: '18px',
                background: (uploadedFile || inputText.trim())
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '14px',
                color: 'white',
                fontSize: '17px',
                fontWeight: '700',
                cursor: (uploadedFile || inputText.trim()) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: (uploadedFile || inputText.trim())
                  ? '0 8px 24px rgba(102, 126, 234, 0.4)'
                  : 'none',
                opacity: (uploadedFile || inputText.trim()) ? 1 : 0.4,
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                if (uploadedFile || inputText.trim()) {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (uploadedFile || inputText.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)'
                }
              }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>🚀</span>
              生成知识图谱
            </button>

            {/* 提示信息 */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '14px',
            }}>
              <div style={{
                color: 'rgba(96, 165, 250, 1)',
                fontSize: '14px',
                lineHeight: '1.7',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  fontWeight: '700',
                }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  功能说明
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '24px',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  <li style={{ marginBottom: '6px' }}>结构化：Excel (.xlsx/.xls)、CSV 表格数据</li>
                  <li style={{ marginBottom: '6px' }}>半结构化：JSON 格式数据</li>
                  <li style={{ marginBottom: '6px' }}>非结构化：TXT、Markdown 文本内容</li>
                  <li style={{ marginBottom: '6px' }}>AI将智能识别并提取实体和关系</li>
                  <li>生成的图谱支持交互编辑和导出</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新建项目模态框 */}
      {showNewProjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowNewProjectModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              创建新项目
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="输入项目名称"
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                marginBottom: '24px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateProject()
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectName('')
                }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
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
                }}>
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                style={{
                  padding: '12px 24px',
                  background: newProjectName.trim()
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: newProjectName.trim() ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建图谱模态框 */}
      {showNewGraphModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowNewGraphModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              创建新图谱
            </h3>
            <input
              type="text"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
              placeholder="输入图谱名称"
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                marginBottom: '24px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateGraph()
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setShowNewGraphModal(false)
                  setNewGraphName('')
                }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
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
                }}>
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={!newGraphName.trim()}
                style={{
                  padding: '12px 24px',
                  background: newGraphName.trim()
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newGraphName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: newGraphName.trim() ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (newGraphName.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newGraphName.trim()) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
