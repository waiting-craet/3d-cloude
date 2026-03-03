# 数据库迁移说明

## 添加媒体字段迁移

已在Prisma Schema中添加了`image`和`video`字段到Node模型。

### 执行迁移

请在终端中运行以下命令:

```bash
npx prisma migrate dev --name add_media_fields_to_node
```

### 迁移内容

此迁移将在Node表中添加两个新的可选字段:
- `image` (String?) - 图片URL的简化字段
- `video` (String?) - 视频URL的简化字段

### 验证迁移

迁移完成后,可以运行以下命令验证:

```bash
npx prisma studio
```

然后检查Node表是否包含新的`image`和`video`字段。

### 回滚(如需要)

如果需要回滚此迁移:

```bash
npx prisma migrate resolve --rolled-back add_media_fields_to_node
```

### 注意事项

1. 这些字段是可选的(nullable),不会影响现有数据
2. 现有的`imageUrl`和`videoUrl`字段保持不变
3. 新字段用于简化的导入模板格式
4. 导入时可以使用`image`/`video`或`imageUrl`/`videoUrl`,系统会自动处理

### 数据迁移脚本(可选)

如果需要将现有的`imageUrl`数据复制到`image`字段:

```sql
UPDATE "Node" SET image = "imageUrl" WHERE "imageUrl" IS NOT NULL;
UPDATE "Node" SET video = "videoUrl" WHERE "videoUrl" IS NOT NULL;
```

## 相关文件

- Prisma Schema: `prisma/schema.prisma`
- 迁移文件: `prisma/migrations/`
