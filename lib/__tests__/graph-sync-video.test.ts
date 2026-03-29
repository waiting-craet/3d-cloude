import { detectNodeChanges } from '@/lib/graph-sync'

describe('Graph Sync - detectNodeChanges', () => {
  it('should detect videoUrl updates', () => {
    // 模拟工作流中的节点（刚上传了视频）
    const workflowNodes = [
      {
        id: 'node-1',
        label: 'Node 1',
        x: 100,
        y: 100,
        videoUrl: 'https://example.com/video.mp4',
      }
    ]

    // 模拟数据库中的现有节点（原来没有视频）
    const dbNodes = [
      {
        id: 'node-1',
        name: 'Node 1',
        type: 'concept',
        description: '',
        x: 100,
        y: 100,
        z: 0,
        color: '#3b82f6',
        textColor: '#ffffff',
        shape: 'sphere',
        size: 2,
        opacity: 1,
        isGlowing: false,
        imageUrl: null,
        videoUrl: null, // 之前没有视频
        iconUrl: null,
        image: null,
        video: null,
        documentId: null,
        chunkIndex: null,
        coverUrl: null,
        embedding: null,
        tags: [],
        category: null,
        projectId: 'proj-1',
        graphId: 'graph-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]

    const result = detectNodeChanges(workflowNodes, dbNodes as any)

    // 验证能够检测到更新
    expect(result.toUpdate).toHaveLength(1)
    expect(result.toUpdate[0].id).toBe('node-1')
    
    // 验证更新的内容包含 videoUrl
    expect(result.toUpdate[0].updates).toHaveProperty('videoUrl')
    expect(result.toUpdate[0].updates.videoUrl).toBe('https://example.com/video.mp4')
  })

  it('should detect videoUrl clearing', () => {
    // 模拟工作流中的节点（删除了视频）
    const workflowNodes = [
      {
        id: 'node-1',
        label: 'Node 1',
        x: 100,
        y: 100,
        videoUrl: undefined, // 删除了视频
      }
    ]

    // 模拟数据库中的现有节点（原来有视频）
    const dbNodes = [
      {
        id: 'node-1',
        name: 'Node 1',
        type: 'concept',
        description: '',
        x: 100,
        y: 100,
        z: 0,
        color: '#3b82f6',
        textColor: '#ffffff',
        shape: 'sphere',
        size: 2,
        opacity: 1,
        isGlowing: false,
        imageUrl: null,
        videoUrl: 'https://example.com/old-video.mp4',
        iconUrl: null,
        image: null,
        video: null,
        documentId: null,
        chunkIndex: null,
        coverUrl: null,
        embedding: null,
        tags: [],
        category: null,
        projectId: 'proj-1',
        graphId: 'graph-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]

    const result = detectNodeChanges(workflowNodes, dbNodes as any)

    // 验证能够检测到更新
    expect(result.toUpdate).toHaveLength(1)
    expect(result.toUpdate[0].id).toBe('node-1')
    
    // 验证更新的内容包含 videoUrl
    expect(result.toUpdate[0].updates).toHaveProperty('videoUrl')
    expect(result.toUpdate[0].updates.videoUrl).toBeUndefined()
  })
})
