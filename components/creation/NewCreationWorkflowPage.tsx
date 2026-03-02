'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './creation-workflow.module.css';
import CreateProjectModal from '@/components/CreateProjectModal';

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
}

export default function NewCreationWorkflowPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'graph' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'updateTime' | 'title'>('updateTime');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // 加载图谱列表（而不是项目列表）
  useEffect(() => {
    fetchAllGraphs();
  }, []);

  const fetchAllGraphs = async () => {
    try {
      const response = await fetch('/api/projects/with-graphs');
      if (response.ok) {
        const data = await response.json();
        const projectsWithGraphs = data.projects || [];
        
        // 将所有图谱展开为独立的卡片数据
        const allGraphs: Graph[] = [];
        projectsWithGraphs.forEach((project: any) => {
          if (project.graphs && project.graphs.length > 0) {
            project.graphs.forEach((graph: any) => {
              allGraphs.push({
                id: graph.id,
                name: graph.name,
                projectId: project.id,
                projectName: project.name,
                createdAt: graph.createdAt,
                updatedAt: graph.updatedAt,
                nodeCount: graph.nodeCount || 0,
                edgeCount: graph.edgeCount || 0,
              });
            });
          }
        });
        
        setGraphs(allGraphs);
        
        // 设置项目列表（用于下拉框）
        setProjects(projectsWithGraphs.map((p: any) => ({
          id: p.id,
          name: p.name,
        })));
        
        // 不再自动选中第一个项目，保持默认的 'all'
      }
    } catch (error) {
      console.error('加载图谱列表失败:', error);
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

      // 创建成功后刷新图谱列表
      await fetchAllGraphs();
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
        {/* 搜索框 - 右上角 */}
        <div className={styles.searchContainer}>
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

        {/* 功能卡片 - 横向排布 */}
        <div className={styles.actionCards}>
          {/* AI创建卡片 - 鲜艳红色 */}
          <div 
            className={`${styles.actionCard} ${styles.aiCreateCard}`}
            onClick={handleAICreate}
          >
            AI创建
          </div>

          {/* 导入数据卡片 - 鲜艳绿色 */}
          <div 
            className={`${styles.actionCard} ${styles.importDataCard}`}
            onClick={handleImport}
          >
            导入数据
          </div>
        </div>

        {/* 项目筛选栏 */}
        <div className={styles.filterBar}>
          {/* 左侧：我的项目文本和项目选择下拉框 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className={styles.myProjectsText}>我的项目</h2>
            
            {/* 项目选择下拉框 */}
            {projects.length > 0 ? (
              <select
                className={styles.filterSelect}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                <option value="all">全部项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '14px', color: '#999' }}>
                暂无项目
              </span>
            )}
          </div>

          {/* 右侧：两个下拉筛选框 */}
          <div className={styles.filterControls}>
            {/* 类型筛选下拉框 */}
            <select
              className={styles.filterSelect}
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'graph' | 'document')}
            >
              <option value="all">全部类型</option>
              <option value="graph">图谱</option>
              <option value="document">文档</option>
            </select>

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

        {/* 项目列表区域 */}
        <div className={styles.projectGrid}>
          {graphs.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#999',
              background: '#fff',
              borderRadius: '8px'
            }}>
              暂无图谱，点击"新建"按钮创建您的第一个图谱
            </div>
          ) : (
            graphs
              .filter(graph => {
                // 搜索过滤
                if (searchQuery && !graph.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }
                // 项目过滤 - 如果选择了 'all'，显示所有图谱
                if (selectedProjectId && selectedProjectId !== 'all' && graph.projectId !== selectedProjectId) {
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
                    <h3 className={styles.projectCardTitle}>{graph.projectName || '未知项目'}</h3>
                    <p className={styles.projectCardDescription}>
                      图谱：{graph.name}
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
        </div>
      </main>

      {/* 创建项目对话框 */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateProject}
        existingProjects={existingProjects}
      />
    </div>
  );
}
