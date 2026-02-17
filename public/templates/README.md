# 知识图谱导入模板说明

## 模板文件

本目录包含用于导入知识图谱数据的模板文件。

### CSV 模板格式

CSV文件应包含以下列：
- `source`: 源节点名称
- `target`: 目标节点名称
- `relationship`: 关系标签

示例：
```csv
source,target,relationship
节点A,节点B,关系1
节点A,节点C,关系2
```

### JSON 模板格式

JSON文件应包含 `nodes` 和 `edges` 两个数组：

#### 2D 图谱 JSON 格式
```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "节点名称",
      "description": "节点描述",
      "x": 100,
      "y": 100
    }
  ],
  "edges": [
    {
      "source": "node1",
      "target": "node2",
      "label": "关系标签"
    }
  ]
}
```

#### 3D 图谱 JSON 格式
```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "节点名称",
      "description": "节点描述",
      "x": 0,
      "y": 0,
      "z": 0
    }
  ],
  "edges": [
    {
      "source": "node1",
      "target": "node2",
      "label": "关系标签"
    }
  ]
}
```

### Excel 模板格式

Excel文件应包含两个工作表：

#### Sheet 1: Nodes（节点）

**2D图谱节点表格：**
| id | label | description | x | y |
|----|-------|-------------|---|---|
| node1 | 节点A | 描述 | 100 | 100 |
| node2 | 节点B | 描述 | 300 | 100 |

**3D图谱节点表格：**
| id | label | description | x | y | z |
|----|-------|-------------|---|---|---|
| node1 | 中心节点 | 描述 | 0 | 0 | 0 |
| node2 | 技术节点 | 描述 | 100 | 0 | 0 |

#### Sheet 2: Edges（边）
| source | target | label |
|--------|--------|-------|
| node1 | node2 | 关系1 |
| node2 | node3 | 关系2 |

## 使用说明

1. 在导入页面选择图谱类型（2D或3D）
2. 点击相应的模板按钮下载模板
3. 按照模板格式填写数据
4. 上传填写好的文件进行导入
