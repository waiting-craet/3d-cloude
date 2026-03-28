# 首页到3D图谱只读模式实现

## 修改概述

实现了从首页点击知识图谱卡片进入3D图谱页面时，只显示"返回"按钮和搜索框的只读模式。

## 修改内容

### 1. 首页 (app/page.tsx)
- 在点击图谱卡片跳转时，添加 `from=homepage` URL参数
- 修改位置：第458行，图谱卡片的 onClick 处理

```typescript
onClick={(graphId) => router.push(`/graph?graphId=${graphId}&from=homepage`)}
```

### 2. 3D图谱页面 (app/graph/page.tsx)
- 添加对 `from` URL参数的检测
- 当 `from=homepage` 时，自动设置为只读模式 (`readonly`)
- 修改位置：第37-48行

```typescript
const fromParam = searchParams.get('from')

useEffect(() => {
  // 优先检查URL参数
  if (fromParam === 'homepage') {
    setNavigationMode('readonly')
    return
  }
  
  // 获取referrer（来源页面）
  const referrer = document.referrer
  const mode = determineNavigationMode(referrer)
  setNavigationMode(mode)
}, [fromParam])
```

### 3. 顶部导航栏 (components/TopNavbar.tsx)
- 移除搜索框的模式限制，使其在所有模式下都显示
- 保持"现有图谱"下拉菜单、"快速创建"和"新建图谱"按钮仅在完整模式下显示
- 修改位置：
  - 第760行：移除搜索框的 `mode === 'full'` 条件
  - 第893行：保持右侧按钮区域的 `mode === 'full'` 条件

## 功能说明

### 完整模式 (mode='full')
显示所有功能：
- 返回按钮
- 现有图谱下拉菜单
- 搜索框
- 快速创建按钮
- 新建图谱按钮
- 浮动添加按钮

### 只读模式 (mode='readonly')
仅显示基础功能：
- 返回按钮
- 搜索框

## 触发条件

只读模式在以下情况下触发：
1. URL包含 `from=homepage` 参数（优先级最高）
2. 通过 `document.referrer` 检测到来自首页

## 测试建议

1. 从首页点击项目卡片
2. 查看该项目下的知识图谱列表
3. 点击任意知识图谱卡片
4. 验证3D图谱页面只显示"返回"按钮和搜索框
5. 测试搜索功能是否正常工作
6. 点击返回按钮，验证能否正确返回首页

## 注意事项

- 搜索框在只读模式下仍然可用，用户可以搜索和查看节点详情
- 只读模式下不显示编辑相关的按钮（新建图谱、快速创建等）
- 只读模式下不显示浮动添加按钮
