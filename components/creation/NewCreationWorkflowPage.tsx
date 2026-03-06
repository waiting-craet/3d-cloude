'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './creation-workflow.module.css';
import CreateProjectModal from '@/components/CreateProjectModal';
import BatchDeleteControls from './BatchDeleteControls';
import ProjectCardCheckbox from './ProjectCardCheckbox';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface Graph {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  createdAt?: string;
  updatedAt?: string;
  nodeCount?: number;
  edgeCount?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  graphs?: Graph[];
  graphCount?: number;
}

export default function NewCreationWorkflowPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updateTime' | 'title'>('updateTime');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'projects' | 'graphs'>('projects');
  
  // 批量删除状态
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 加载项目和图谱列表
  useEffect(() => {
    fetchProjectsWithGraphs();
  }, []);

  const fetchProjectsWithGraphs = async () => {
    try {
      const response = await fetch('/api/projects/with-graphs');
      if (response.ok) {
        const data = await response.json();
        const projectsWithGraphs = data.projects || [];
        
        // 设置项目列表（包含图谱信息）
        const projectList: Project[] = projectsWithGraphs.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          graphs: project.graphs || [],
          graphCount: project.graphs ? project.graphs.length : 0,
        }));
        
        setProjects(projectList);
        
        // 注意: graphs 状态已移除,因为图谱数据已包含在 projects 中
      }
    } catch (error) {
      console.error('加载项目和图谱列表失败:', error);
    }
  };

  // 加载现有项目列表
  useEffect(() => {
    if (isModalOpen) {
      fetchProjects();
    }
  }, [isModalOpen]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectList = data.projects || [];
        // 确保包含 description 字段
        setExistingProjects(projectList.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
        })));
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateProject = async (projectName: string, graphName: string, isNewProject: boolean) => {
    try {
      if (isNewProject) {
        // 创建新项目和图谱
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            graphName: graphName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage = error.error || '创建失败';
          
          // 如果是 500 错误，可能是数据库连接问题
          if (response.status === 500) {
            throw new Error(`${errorMessage}\n\n可能原因：\n1. 数据库连接失败（Neon 数据库可能已暂停）\n2. 请访问 Neon 控制台唤醒数据库\n3. 或查看 DATABASE-CONNECTION-FIX.md 文件获取详细解决方案`);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('项目创建成功:', data);
      } else {
        // 在现有项目中创建图谱
        const selectedProject = existingProjects.find(p => p.name === projectName);
        if (!selectedProject) {
          throw new Error('未找到选中的项目');
        }

        // 创建图谱
        const graphResponse = await fetch('/api/graphs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: selectedProject.id,
            name: graphName,
          }),
        });

        if (!graphResponse.ok) {
          const error = await graphResponse.json();
          throw new Error(error.error || '创建图谱失败');
        }

        const graphData = await graphResponse.json();
        console.log('图谱创建成功:', graphData);
      }

      // 创建成功后刷新项目和图谱列表
      await fetchProjectsWithGraphs();
    } catch (error) {
      console.error('创建失败:', error);
      throw error;
    }
  };

  const handleImport = () => {
    router.push('/import');
  };

  const handleAICreate = () => {
    router.push('/text-page');
  };

  // 处理项目卡片点击 - 进入项目的图谱列表
  const handleProjectCardClick = (project: Project) => {
    // 在批量删除模式下，阻止导航
    if (isBatchDeleteMode) {
      return;
    }
    setSelectedProject(project);
    setViewMode('graphs');
  };

  // 处理返回按钮点击 - 返回项目列表
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode('projects');
  };

  // 处理图谱卡片点击 - 导航到 3D 图谱编辑器
  const handleGraphCardClick = (graph: Graph) => {
    // 验证图谱 ID
    if (!graph.id || graph.id.trim() === '') {
      console.error('无效的图谱 ID:', graph.id);
      alert('无法打开图谱：图谱 ID 无效');
      return;
    }

    // 导航到 graph 页面（3D 编辑器）
    router.push(`/graph?graphId=${graph.id}`);
  };

  // 批量删除事件处理函数
  const handleEnterBatchDeleteMode = () => {
    setIsBatchDeleteMode(true);
    setSelectedProjectIds(new Set());
  };

  const handleToggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleCancelBatchDelete = () => {
    setIsBatchDeleteMode(false);
    setSelectedProjectIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleShowConfirm = () => {
    if (selectedProjectIds.size > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      const response = await fetch('/api/projects/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIds: Array.from(selectedProjectIds)
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`成功删除 ${data.summary.succeeded} 个项目`);
        await fetchProjectsWithGraphs();
        handleCancelBatchDelete();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('删除操作失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* 左侧导航栏 - 占 1/6 宽度 */}
      <aside className={styles.sideNavigation}>
        {/* 标题区域 */}
        <div className={styles.titleSection}>
          <h1 className={styles.titleText}>3DGraph</h1>
        </div>

        {/* 按钮容器 */}
        <div className={styles.buttonContainer}>
          {/* 新建按钮 - 蓝色 */}
          <button 
            className={styles.newButton}
            onClick={handleNewProject}
          >
            新建
          </button>

          {/* 导入按钮 - 白色无边框 */}
          <button 
            className={styles.importButton}
            onClick={handleImport}
          >
            导入
          </button>

          {/* AI创建按钮 - 紫色 */}
          <button 
            className={styles.aiCreateButton}
            onClick={handleAICreate}
          >
            AI创建
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 - 占 5/6 宽度 */}
      <main className={styles.mainContent}>
        {/* 项目筛选栏 */}
        <div className={styles.filterBar}>
          {/* 左侧：我的项目文本和搜索框 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className={styles.myProjectsText}>我的项目</h2>
            
            {/* 搜索框（从右上角移动过来） */}
            <div style={{ position: 'relative' }}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchBar}
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 右侧：两个下拉筛选框 */}
          <div className={styles.filterControls}>
            {/* 批量删除控件 */}
            <BatchDeleteControls
              isBatchDeleteMode={isBatchDeleteMode}
              selectedCount={selectedProjectIds.size}
              isDeleting={isDeleting}
              isProjectView={viewMode === 'projects'}
              onEnterBatchMode={handleEnterBatchDeleteMode}
              onConfirm={handleShowConfirm}
              onCancel={handleCancelBatchDelete}
            />

            {/* 排序方式下拉框 */}
            <select
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updateTime' | 'title')}
            >
              <option value="updateTime">更新时间</option>
              <option value="title">标题</option>
            </select>
          </div>
        </div>

        {/* 返回按钮（仅在图谱视图时显示） */}
        {viewMode === 'graphs' && (
          <div style={{ 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={handleBackToProjects}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#333'
              }}
            >
              ← 返回项目列表
            </button>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
              项目：{selectedProject?.name}
            </span>
          </div>
        )}

        {/* 项目列表区域 */}
        <div className={styles.projectGrid}>

          {/* 项目视图 */}
          {viewMode === 'projects' && (
            <>
              {projects.length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#999',
                  background: '#fff',
                  borderRadius: '8px'
                }}>
                  暂无项目，点击"新建"按钮创建您的第一个项目
                </div>
              ) : (
                projects
                  .filter(project => {
                    // 搜索过滤
                    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map((project) => (
                    <div
                      key={project.id}
                      className={styles.projectCard}
                      onClick={() => handleProjectCardClick(project)}
                    >
                      {/* 批量删除复选框 */}
                      {isBatchDeleteMode && (
                        <ProjectCardCheckbox
                          projectId={project.id}
                          projectName={project.name}
                          isSelected={selectedProjectIds.has(project.id)}
                          onToggle={handleToggleProjectSelection}
                        />
                      )}
                      
                      <div className={styles.projectCardContent}>
                        <h3 className={styles.projectCardTitle}>项目：{project.name}</h3>
                        <p className={styles.projectCardDescription}>
                          {project.description || '暂无描述'}
                        </p>
                        <div className={styles.projectCardFooter}>
                          <span className={styles.projectCardDate}>
                            包含 {project.graphCount || 0} 个图谱
                          </span>
                          <div className={styles.projectCardStats}>
                            <span className={styles.projectCardStat}>
                              📊 点击查看图谱
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </>
          )}

          {/* 图谱视图 */}
          {viewMode === 'graphs' && selectedProject && (
            <>
              {selectedProject.graphs && selectedProject.graphs.length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#999',
                  background: '#fff',
                  borderRadius: '8px'
                }}>
                  该项目暂无图谱，点击"新建"按钮创建图谱
                </div>
              ) : (
                selectedProject.graphs
                  ?.filter(graph => {
                    // 搜索过滤
                    if (searchQuery && !graph.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map((graph) => (
                    <div
                      key={graph.id}
                      className={styles.projectCard}
                      onClick={() => handleGraphCardClick(graph)}
                    >
                      <div className={styles.projectCardContent}>
                        <h3 className={styles.projectCardTitle}>图谱：{graph.name}</h3>
                        <p className={styles.projectCardDescription}>
                          所属项目：{selectedProject.name}
                        </p>
                        <div className={styles.projectCardFooter}>
                          <span className={styles.projectCardDate}>
                            {graph.createdAt 
                              ? new Date(graph.createdAt).toLocaleDateString('zh-CN')
                              : '未知日期'
                            }
                          </span>
                          {(graph.nodeCount !== undefined || graph.edgeCount !== undefined) && (
                            <div className={styles.projectCardStats}>
                              {graph.nodeCount !== undefined && (
                                <span className={styles.projectCardStat}>
                                  📊 {graph.nodeCount} 节点
                                </span>
                              )}
                              {graph.edgeCount !== undefined && (
                                <span className={styles.projectCardStat}>
                                  🔗 {graph.edgeCount} 边
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </>
          )}
        </div>
      </main>

      {/* 创建项目对话框 */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateProject}
        existingProjects={existingProjects}
      />

      {/* 批量删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        projectCount={selectedProjectIds.size}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelBatchDelete}
      />

      {/* aria-live 区域用于通知选择模式变化 */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {isBatchDeleteMode ? '已进入批量删除模式，请选择要删除的项目' : ''}
      </div>
    </div>
  );
}
