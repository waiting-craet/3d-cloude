# 首页图库快速指南

## 🚀 快速开始

### 1. 生成测试数据
```bash
npm run db:seed
```
这会创建:
- 1 个 3D 图谱: "人工智能知识体系"
- 1 个 2D 图谱: "数据科学工具链"

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问首页
打开浏览器: `http://localhost:3000`

## 📊 功能测试

### 筛选功能
- **默认**: 显示所有图谱 (2 个)
- **点击 "3D 图谱"**: 只显示 3D 图谱 (1 个)
- **点击 "2D 图谱"**: 只显示 2D 图谱 (1 个)
- **点击 "清除筛选"**: 显示所有图谱

### 分页功能
- 每页显示 20 个图谱
- 当图谱数量超过 20 时显示分页按钮

### 卡片显示
每个卡片显示:
- 缩略图
- 图谱名称
- 图谱描述
- 图谱类型 (3D/2D)
- 创建者名称
- 节点数和边数
- 创建日期

## 🔧 验证设置

运行验证脚本检查所有组件是否正确配置:
```bash
npx tsx scripts/verify-gallery-setup.ts
```

## 📁 核心文件

| 文件 | 功能 |
|------|------|
| `app/api/gallery/graphs/route.ts` | API 端点，返回图谱数据 |
| `lib/hooks/useGalleryGraphs.ts` | 数据获取 Hook，使用 SWR 缓存 |
| `components/gallery/FilterBar.tsx` | 筛选栏，单选模式 |
| `components/gallery/GalleryGrid.tsx` | 图库网格，显示卡片列表 |
| `components/gallery/GraphCard.tsx` | 单个图谱卡片 |
| `scripts/seed.ts` | 数据库种子脚本 |

## 🧪 测试脚本

### 测试数据库查询
```bash
npx tsx scripts/test-gallery-api.ts
```

### 测试 API 响应
```bash
npx tsx scripts/test-api-response.ts
```

### 验证完整设置
```bash
npx tsx scripts/verify-gallery-setup.ts
```

## 📝 API 端点

### 获取所有图谱
```
GET /api/gallery/graphs?page=1&pageSize=20&sort=latest
```

### 获取 3D 图谱
```
GET /api/gallery/graphs?page=1&pageSize=20&type=3d&sort=latest
```

### 获取 2D 图谱
```
GET /api/gallery/graphs?page=1&pageSize=20&type=2d&sort=latest
```

### 查询参数
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20, 最大: 100)
- `type`: 筛选类型 (2d, 3d, template)
- `sort`: 排序方式 (latest, popular, trending)

## 💡 常见问题

### Q: 首页没有显示任何图谱
**A**: 运行 `npm run db:seed` 生成测试数据

### Q: 筛选功能不工作
**A**: 检查 FilterBar 组件是否正确传递 filters 参数到 GalleryGrid

### Q: 缩略图不显示
**A**: 检查节点是否有 imageUrl 字段，或检查 URL 是否有效

### Q: API 返回 500 错误
**A**: 检查数据库连接和 DATABASE_URL 环境变量

## 🎯 下一步

1. **添加更多测试数据**: 修改 `scripts/seed.ts` 创建更多图谱
2. **自定义缩略图**: 替换 Unsplash URL 为真实图片
3. **添加搜索功能**: 在 FilterBar 中添加搜索输入框
4. **实现排序**: 添加排序选项 (热门、趋势)
5. **用户交互**: 添加点赞、收藏、评论功能

## 📚 相关文档

- `GALLERY-INTEGRATION-COMPLETE.md` - 完整集成文档
- `GALLERY-DATA-INTEGRATION.md` - 数据集成指南
- `FILTER-LOGIC-UPDATE.md` - 筛选逻辑文档
