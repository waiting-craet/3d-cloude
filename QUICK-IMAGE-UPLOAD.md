# 快速图片上传指南

## 方法 1: 直接放置文件（推荐）

1. 在你的项目根目录找到 `public/images/` 文件夹
2. 将你的图片文件放入该文件夹
3. 将文件重命名为 `banner.png`
4. 刷新浏览器

**文件路径应该是:**
```
project-root/
  └── public/
      └── images/
          └── banner.png
```

## 方法 2: 使用命令行复制

如果你已经有图片文件，可以使用以下命令复制到正确位置：

```bash
# Windows PowerShell
Copy-Item "C:\path\to\your\image.png" "public/images/banner.png"

# Windows CMD
copy "C:\path\to\your\image.png" "public\images\banner.png"
```

## 方法 3: 使用 Base64 编码（如果文件很小）

如果图片文件很小（< 100KB），可以转换为 Base64 并直接嵌入代码中。

## 检查是否成功

1. 打开浏览器开发者工具 (F12)
2. 查看 Network 标签
3. 搜索 "banner.png"
4. 如果状态码是 200，说明图片加载成功
5. 如果是 404，说明文件不在正确位置

## 常见问题

**Q: 图片仍然没有显示？**
A: 检查以下几点：
- 文件名是否正确（必须是 `banner.png`）
- 文件是否在 `public/images/` 目录中
- 是否需要重启开发服务器
- 浏览器缓存是否需要清除（Ctrl+Shift+Delete）

**Q: 可以使用其他格式吗？**
A: 可以，支持 PNG、JPG、WebP 等，但需要修改代码中的文件名。

**Q: 图片尺寸有要求吗？**
A: 推荐宽度 >= 1920px，高度 >= 320px，但任何尺寸都可以（会自动缩放）。
