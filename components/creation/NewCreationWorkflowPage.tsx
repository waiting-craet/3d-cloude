'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './creation-workflow.module.css';
import CreateProjectModal from '@/components/CreateProjectModal';
import BatchDeleteControls from './BatchDeleteControls';
import ProjectCardCheckbox from './ProjectCardCheckbox';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useUserStore } from '@/lib/userStore';

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
  createdAt?: string;
  updatedAt?: string;
  graphs?: Graph[];
  graphCount?: number;
}

export default function NewCreationWorkflowPage() {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'updateTime' | 'title'>('updateTime');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'projects' | 'graphs'>('projects');
  
  // 批量删除状态
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedGraphIds, setSelectedGraphIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    type: 'project' | 'graph' | null;
    id: string | null;
    currentName: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    currentName: '',
  });
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

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
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          graphs: project.graphs || [],
          graphCount: project.graphs ? project.graphs.length : 0,
        }));
        
        setProjects(projectList);
        if (selectedProject) {
          const updatedProject = projectList.find(p => p.id === selectedProject.id);
          if (updatedProject) {
            setSelectedProject(updatedProject);
          } else if (viewMode === 'graphs') {
            setSelectedProject(null);
            setViewMode('projects');
            setSelectedGraphIds(new Set());
            setIsBatchDeleteMode(false);
          }
        }
        
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
      const response = await fetch('/api/projects/my-projects');
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
    setSelectedGraphIds(new Set());
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
    // 检查用户是否登录
    if (!isLoggedIn) {
      alert('请先登录后再进行批量删除操作');
      return;
    }
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

  const handleToggleGraphSelection = (graphId: string) => {
    setSelectedGraphIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(graphId)) {
        newSet.delete(graphId);
      } else {
        newSet.add(graphId);
      }
      return newSet;
    });
  };

  const handleSelectAllGraphs = () => {
    if (selectedProject && selectedProject.graphs) {
      const allGraphIds = selectedProject.graphs.map(graph => graph.id);
      setSelectedGraphIds(new Set(allGraphIds));
    }
  };

  const handleDeselectAllGraphs = () => {
    setSelectedGraphIds(new Set());
  };

  const handleCancelBatchDelete = () => {
    setIsBatchDeleteMode(false);
    setSelectedProjectIds(new Set());
    setSelectedGraphIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleShowConfirm = () => {
    if (viewMode === 'projects' && selectedProjectIds.size > 0) {
      setShowDeleteConfirm(true);
    } else if (viewMode === 'graphs' && selectedGraphIds.size > 0) {
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
      
      if (response.status === 401) {
        alert('请先登录后再进行删除操作');
        return;
      }
      
      if (response.ok && data.success) {
        alert(`成功删除 ${data.summary.succeeded} 个项目`);
        await fetchProjectsWithGraphs();
        handleCancelBatchDelete();
      } else if (data.summary && data.summary.succeeded > 0) {
        // 部分成功
        const failedProjects = data.results
          .filter((r: any) => !r.success)
          .map((r: any) => r.projectName || r.projectId)
          .join(', ');
        alert(
          `部分删除成功：${data.summary.succeeded} 个成功，${data.summary.failed} 个失败\n` +
          `失败的项目：${failedProjects}`
        );
        await fetchProjectsWithGraphs();
        handleCancelBatchDelete();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('批量删除项目失败:', error);
      alert('删除操作失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteGraphs = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      // 调用批量删除图谱 API
      const response = await fetch('/api/graphs/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphIds: Array.from(selectedGraphIds)
        })
      });
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const data = await response.json();
      
      // 处理删除结果
      if (data.success) {
        // 完全成功
        alert(`成功删除 ${data.summary.succeeded} 个图谱`);
      } else if (data.summary.succeeded > 0) {
        // 部分成功
        const failedGraphs = data.results
          .filter((r: any) => !r.success)
          .map((r: any) => r.graphName || r.graphId)
          .join(', ');
        alert(
          `部分删除成功：${data.summary.succeeded} 个成功，${data.summary.failed} 个失败\n` +
          `失败的图谱：${failedGraphs}`
        );
      } else {
        // 全部失败
        const errors = data.results
          .map((r: any) => `${r.graphName || r.graphId}: ${r.error}`)
          .join('\n');
        alert(`删除失败：\n${errors}`);
      }
      
      // 实现重试机制以确保数据同步
      let retryCount = 0;
      const maxRetries = 3;
      let verified = false;
      const deletedGraphIds = Array.from(selectedGraphIds);
      
      while (retryCount < maxRetries && !verified) {
        if (retryCount > 0) {
          // 指数退避策略
          const delay = 500 * retryCount;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 重新获取数据，使用 no-cache 确保获取最新数据
        const refreshResponse = await fetch('/api/projects/with-graphs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const projectsWithGraphs = refreshData.projects || [];
          
          // 验证删除是否成功
          const stillExists = projectsWithGraphs.some((p: any) => 
            p.graphs && p.graphs.some((g: any) => deletedGraphIds.includes(g.id))
          );
          
          if (!stillExists) {
            verified = true;
            
            // 更新项目列表
            const projectList: Project[] = projectsWithGraphs.map((project: any) => ({
              id: project.id,
              name: project.name,
              description: project.description || '',
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              graphs: project.graphs || [],
              graphCount: project.graphs ? project.graphs.length : 0,
            }));
            
            setProjects(projectList);
            
            // 更新当前选中的项目（如果在图谱视图中）
            if (selectedProject) {
              const updatedProject = projectList.find(p => p.id === selectedProject.id);
              if (updatedProject) {
                setSelectedProject(updatedProject);
              }
            }
          }
        }
        
        retryCount++;
      }
      
      if (!verified) {
        console.warn('数据刷新验证失败，可能存在同步延迟');
      }
      
      // 清除选择状态
      setSelectedGraphIds(new Set());
      setIsBatchDeleteMode(false);
      
    } catch (error) {
      console.error('批量删除图谱失败:', error);
      
      // 显示用户友好的错误消息
      if (error instanceof Error) {
        if (error.message.includes('网络')) {
          alert('删除操作失败，请检查网络连接后重试');
        } else {
          alert(`删除操作失败：${error.message}`);
        }
      } else {
        alert('删除操作失败，请稍后重试');
      }
      
      // 保留选择状态，允许用户重试
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRenameDialog = () => {
    if (!isLoggedIn) {
      alert('请先登录后再进行修改名称操作');
      return;
    }

    if (viewMode === 'graphs' && !isBatchDeleteMode && selectedProject) {
      setRenameDialog({
        isOpen: true,
        type: 'project',
        id: selectedProject.id,
        currentName: selectedProject.name,
      });
      setRenameInput(selectedProject.name);
      return;
    }

    const selectedCount = viewMode === 'projects' ? selectedProjectIds.size : selectedGraphIds.size;
    if (!isBatchDeleteMode || selectedCount !== 1) {
      alert(`请在选择模式下选中 1 个${viewMode === 'projects' ? '项目' : '图谱'}后再修改名称`);
      return;
    }

    if (viewMode === 'projects') {
      const projectId = Array.from(selectedProjectIds)[0];
      const project = projects.find(p => p.id === projectId);
      const currentName = project?.name || '';
      setRenameDialog({
        isOpen: true,
        type: 'project',
        id: projectId,
        currentName,
      });
      setRenameInput(currentName);
      return;
    }

    const graphId = Array.from(selectedGraphIds)[0];
    const graph = selectedProject?.graphs?.find(g => g.id === graphId);
    const currentName = graph?.name || '';
    setRenameDialog({
      isOpen: true,
      type: 'graph',
      id: graphId,
      currentName,
    });
    setRenameInput(currentName);
  };

  const handleCloseRenameDialog = () => {
    if (isRenaming) return;
    setRenameDialog({
      isOpen: false,
      type: null,
      id: null,
      currentName: '',
    });
    setRenameInput('');
  };

  const handleConfirmRename = async () => {
    if (!renameDialog.isOpen || !renameDialog.type || !renameDialog.id) return;

    const newName = renameInput.trim();
    if (!newName) {
      alert('名称不能为空');
      return;
    }

    setIsRenaming(true);
    try {
      const endpoint =
        renameDialog.type === 'project'
          ? `/api/projects/${renameDialog.id}`
          : `/api/graphs/${renameDialog.id}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        alert('请先登录后再进行修改名称操作');
        return;
      }
      if (response.status === 403) {
        alert(data.error || '无权限操作');
        return;
      }
      if (!response.ok) {
        alert(data.error || '修改失败');
        return;
      }

      await fetchProjectsWithGraphs();
      handleCloseRenameDialog();
      alert('名称已更新');
    } catch (error) {
      console.error('修改名称失败:', error);
      alert('修改失败，请稍后重试');
    } finally {
      setIsRenaming(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  // 处理回车键搜索
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renameTargetText = (() => {
    if (viewMode === 'graphs' && !isBatchDeleteMode) return '项目';
    return viewMode === 'projects' ? '项目' : '图谱';
  })();

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
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchBar}
                placeholder="搜索项目..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button 
                className={styles.searchButton}
                onClick={handleSearch}
                aria-label="搜索"
              >
                <svg 
                  className={styles.searchIcon}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle 
                    cx="11" 
                    cy="11" 
                    r="7" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M20 20L16.5 16.5" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 右侧：两个下拉筛选框 */}
          <div className={styles.filterControls}>
            <button
              className={styles.renameButton}
              onClick={handleOpenRenameDialog}
              disabled={isDeleting || isRenaming}
              aria-label={`修改${renameTargetText}名称`}
            >
              {isRenaming ? '修改中...' : '修改名称'}
            </button>

            {/* 批量删除控件 */}
            <BatchDeleteControls
              isBatchDeleteMode={isBatchDeleteMode}
              selectedCount={viewMode === 'projects' ? selectedProjectIds.size : selectedGraphIds.size}
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
                  暂无项目，点击“新建”按钮创建您的第一个项目
                </div>
              ) : (() => {
                const filteredProjects = projects
                  .filter(project => {
                    // 搜索过滤
                    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    // 排序逻辑
                    if (sortBy === 'title') {
                      // 按标题排序（字母顺序）
                      return a.name.localeCompare(b.name, 'zh-CN');
                    } else {
                      // 按更新时间排序（最新的在前）
                      // 注意：如果项目没有 updatedAt，使用 createdAt
                      const aTime = (a as any).updatedAt || (a as any).createdAt || '';
                      const bTime = (b as any).updatedAt || (b as any).createdAt || '';
                      return new Date(bTime).getTime() - new Date(aTime).getTime();
                    }
                  });

                return filteredProjects.length === 0 ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#6b8578',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 166, 154, 0.25)'
                  }}>
                    搜索结果为空，未找到匹配的项目
                  </div>
                ) : (
                  filteredProjects.map((project) => (
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
                              点击查看图谱
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                );
              })()}
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
                  该项目暂无图谱，点击“新建”按钮创建图谱
                </div>
              ) : (() => {
                const filteredGraphs = selectedProject.graphs
                  ?.filter(graph => {
                    // 搜索过滤
                    if (searchQuery && !graph.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    // 排序逻辑
                    if (sortBy === 'title') {
                      // 按标题排序（字母顺序）
                      return a.name.localeCompare(b.name, 'zh-CN');
                    } else {
                      // 按更新时间排序（最新的在前）
                      const aTime = a.updatedAt || a.createdAt || '';
                      const bTime = b.updatedAt || b.createdAt || '';
                      return new Date(bTime).getTime() - new Date(aTime).getTime();
                    }
                  });

                return filteredGraphs && filteredGraphs.length === 0 ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#6b8578',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 166, 154, 0.25)'
                  }}>
                    搜索结果为空，未找到匹配的图谱
                  </div>
                ) : (
                  filteredGraphs?.map((graph) => (
                    <div
                      key={graph.id}
                      className={`${styles.projectCard} ${
                        isBatchDeleteMode && selectedGraphIds.has(graph.id) ? styles.selected : ''
                      }`}
                      onClick={() => {
                        if (!isBatchDeleteMode) {
                          handleGraphCardClick(graph);
                        }
                      }}
                    >
                      {/* 批量删除复选框 */}
                      {isBatchDeleteMode && (
                        <div
                          className={styles.checkboxContainer}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGraphSelection(graph.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            className={styles.projectCheckbox}
                            checked={selectedGraphIds.has(graph.id)}
                            onChange={() => handleToggleGraphSelection(graph.id)}
                            aria-label={`选择图谱 ${graph.name}`}
                          />
                        </div>
                      )}
                      
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
                                  {graph.nodeCount} 节点
                                </span>
                              )}
                              {graph.edgeCount !== undefined && (
                                <span className={styles.projectCardStat}>
                                  {graph.edgeCount} 边
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                );
              })()}
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
        graphCount={selectedGraphIds.size}
        itemType={viewMode === 'projects' ? 'project' : 'graph'}
        onConfirm={viewMode === 'projects' ? handleConfirmDelete : handleConfirmDeleteGraphs}
        onCancel={handleCancelBatchDelete}
      />

      {renameDialog.isOpen && (
        <>
          <div
            className={styles.dialogOverlay}
            onClick={handleCloseRenameDialog}
            aria-hidden="true"
          />
          <div
            className={styles.dialogContainer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-dialog-title"
          >
            <h3 id="rename-dialog-title" className={styles.dialogTitle}>
              修改{renameDialog.type === 'graph' ? '图谱' : '项目'}名称
            </h3>
            <div className={styles.dialogContent}>
              {renameDialog.currentName && (
                <p className={styles.dialogText}>当前名称：{renameDialog.currentName}</p>
              )}
              <input
                className={styles.dialogInput}
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder={`请输入新的${renameDialog.type === 'graph' ? '图谱' : '项目'}名称`}
                disabled={isRenaming}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming) {
                    handleConfirmRename();
                  }
                }}
              />
            </div>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancelButton}
                onClick={handleCloseRenameDialog}
                disabled={isRenaming}
              >
                取消
              </button>
              <button
                className={styles.dialogPrimaryButton}
                onClick={handleConfirmRename}
                disabled={isRenaming}
              >
                {isRenaming ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </>
      )}

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
