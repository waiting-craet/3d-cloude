# 首页广场 API 文档

## 概述

首页广场 API 提供了获取图谱列表、搜索、通知管理等功能。所有 API 都遵循 RESTful 设计原则。

## 基础信息

- **基础 URL**: `/api/gallery`
- **认证**: 可选（某些端点需要用户认证）
- **响应格式**: JSON
- **错误处理**: 所有错误都返回标准错误对象

## API 端点

### 1. 获取图谱列表

**端点**: `GET /api/gallery/graphs`

**描述**: 获取图谱列表，支持分页、筛选和排序。

**查询参数**:
- `page` (number, 可选): 页码，默认为 1
- `pageSize` (number, 可选): 每页数量，默认为 20
- `type` (string[], 可选): 筛选类型，可选值: `3d`, `2d`, `template`
- `sort` (string, 可选): 排序方式，可选值: `latest`, `popular`, `trending`，默认为 `latest`

**响应示例**:
```json
{
  "data": {
    "items": [
      {
        "id": "graph-1",
        "title": "Python 学习路线",
        "description": "完整的 Python 学习指南",
        "type": "3d",
        "isTemplate": false,
        "thumbnail": "https://...",
        "creator": {
          "id": "user-1",
          "name": "张三",
          "avatar": "https://..."
        },
        "stats": {
          "nodes": 50,
          "edges": 120,
          "views": 1000,
          "likes": 50
        },
        "createdAt": "2024-02-11T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**错误响应**:
```json
{
  "error": "获取图谱列表失败",
  "code": "FETCH_GRAPHS_ERROR"
}
```

---

### 2. 搜索图谱

**端点**: `GET /api/gallery/search`

**描述**: 搜索图谱和用户。

**查询参数**:
- `q` (string, 必需): 搜索关键词
- `limit` (number, 可选): 返回结果数量，默认为 10

**响应示例**:
```json
{
  "data": [
    {
      "id": "graph-1",
      "type": "graph",
      "title": "Python 学习路线",
      "description": "完整的 Python 学习指南",
      "thumbnail": "https://..."
    },
    {
      "id": "user-1",
      "type": "user",
      "name": "张三",
      "avatar": "https://..."
    }
  ]
}
```

**错误响应**:
```json
{
  "error": "搜索失败",
  "code": "SEARCH_ERROR"
}
```

---

### 3. 获取通知

**端点**: `GET /api/gallery/notifications`

**描述**: 获取当前用户的通知列表。

**查询参数**:
- `userId` (string, 必需): 用户 ID
- `limit` (number, 可选): 返回通知数量，默认为 10

**响应示例**:
```json
{
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "type": "like",
        "title": "有人赞了你的图谱",
        "message": "张三 赞了你的 Python 学习路线",
        "actor": {
          "id": "user-2",
          "name": "张三",
          "avatar": "https://..."
        },
        "targetId": "graph-1",
        "isRead": false,
        "createdAt": "2024-02-11T10:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

**错误响应**:
```json
{
  "error": "获取通知失败",
  "code": "FETCH_NOTIFICATIONS_ERROR"
}
```

---

### 4. 标记通知为已读

**端点**: `POST /api/gallery/notifications`

**描述**: 标记单个或所有通知为已读。

**请求体**:
```json
{
  "notificationId": "notif-1"
}
```

或标记所有为已读:
```json
{
  "markAllAsRead": true
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "通知已标记为已读"
}
```

**错误响应**:
```json
{
  "error": "标记通知失败",
  "code": "MARK_NOTIFICATION_ERROR"
}
```

---

## 数据类型

### GraphCard
```typescript
interface GraphCard {
  id: string
  title: string
  description: string
  type: 'graph' | '3d' | '2d'
  isTemplate: boolean
  thumbnail: string
  creator: {
    id: string
    name: string
    avatar: string
  }
  stats: {
    nodes: number
    edges: number
    views: number
    likes: number
  }
  createdAt: string
}
```

### Notification
```typescript
interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'share'
  title: string
  message: string
  actor: {
    id: string
    name: string
    avatar: string
  }
  targetId: string
  isRead: boolean
  createdAt: string
}
```

### SearchSuggestion
```typescript
interface SearchSuggestion {
  id: string
  type: 'graph' | 'user'
  title?: string
  name?: string
  description?: string
  thumbnail?: string
  avatar?: string
}
```

---

## 错误处理

所有 API 错误都遵循以下格式:

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常见错误码

| 错误码 | HTTP 状态码 | 描述 |
|--------|-----------|------|
| `FETCH_GRAPHS_ERROR` | 500 | 获取图谱列表失败 |
| `SEARCH_ERROR` | 500 | 搜索失败 |
| `FETCH_NOTIFICATIONS_ERROR` | 500 | 获取通知失败 |
| `MARK_NOTIFICATION_ERROR` | 500 | 标记通知失败 |
| `INVALID_PARAMS` | 400 | 无效的请求参数 |
| `UNAUTHORIZED` | 401 | 未授权 |
| `NOT_FOUND` | 404 | 资源不存在 |

---

## 缓存策略

### SWR 缓存配置

所有数据获取都使用 SWR 库进行缓存:

- **Deduping Interval**: 60 秒（同一 URL 在 60 秒内不重复请求）
- **Focus Throttle**: 5 分钟（窗口获得焦点时，5 分钟内不重新验证）
- **Error Retry**: 3 次（失败时最多重试 3 次）
- **Retry Interval**: 5 秒（重试间隔）

### 手动重新验证

```typescript
const { mutate } = useGalleryGraphs()

// 手动重新验证数据
mutate()
```

---

## 使用示例

### 获取图谱列表

```typescript
import { useGalleryGraphs } from '@/lib/hooks/useGalleryGraphs'

export function MyComponent() {
  const { data, isLoading, error } = useGalleryGraphs({
    page: 1,
    pageSize: 20,
    filters: ['3d'],
    sort: 'latest'
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      {data?.items.map(graph => (
        <div key={graph.id}>{graph.title}</div>
      ))}
    </div>
  )
}
```

### 搜索

```typescript
import { useGallerySearch } from '@/lib/hooks/useGallerySearch'

export function SearchComponent() {
  const { query, suggestions, search } = useGallerySearch()

  return (
    <div>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="搜索..."
      />
      <ul>
        {suggestions.map(suggestion => (
          <li key={suggestion.id}>{suggestion.title || suggestion.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 获取通知

```typescript
import { useNotifications } from '@/lib/hooks/useNotifications'

export function NotificationsComponent() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications({
    userId: 'user-123'
  })

  return (
    <div>
      <h2>通知 ({unreadCount})</h2>
      <button onClick={markAllAsRead}>标记全部已读</button>
      <ul>
        {notifications.map(notif => (
          <li key={notif.id}>{notif.message}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 性能优化建议

1. **使用分页**: 始终使用分页来限制返回的数据量
2. **缓存利用**: 利用 SWR 的缓存机制减少 API 调用
3. **防抖搜索**: 搜索请求已内置 300ms 防抖
4. **条件请求**: 只在需要时才发起请求

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-02-11 | 初始版本 |

