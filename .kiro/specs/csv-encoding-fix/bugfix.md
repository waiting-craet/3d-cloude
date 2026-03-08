# Bugfix Requirements Document

## Introduction

在导入数据页面使用CSV文件导入时，当CSV文件中包含中文字符（如label列填写"拥有"）并且文件使用GBK/GB2312等非UTF-8编码保存时，导入成功但在3D知识图谱中显示为乱码（如"4???"）。

问题根源：`lib/services/graph-import.ts` 中的 `parseCSVFile()` 函数使用 `file.text()` 读取CSV文件，该方法默认使用UTF-8编码解码文件内容。当CSV文件使用其他编码（如GBK、GB2312）保存时，会导致中文字符解码错误，产生乱码。

此bug影响所有使用非UTF-8编码保存的CSV文件导入功能，特别是中文用户常用的GBK/GB2312编码。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN CSV文件使用GBK编码保存且包含中文字符 THEN 系统使用UTF-8解码导致中文字符显示为乱码（如"拥有"显示为"4???"）

1.2 WHEN CSV文件使用GB2312编码保存且包含中文字符 THEN 系统使用UTF-8解码导致中文字符显示为乱码

1.3 WHEN CSV文件使用其他非UTF-8编码保存且包含中文字符 THEN 系统使用UTF-8解码导致中文字符显示为乱码

### Expected Behavior (Correct)

2.1 WHEN CSV文件使用GBK编码保存且包含中文字符 THEN 系统应自动检测编码并正确解码，中文字符正确显示（如"拥有"正确显示为"拥有"）

2.2 WHEN CSV文件使用GB2312编码保存且包含中文字符 THEN 系统应自动检测编码并正确解码，中文字符正确显示

2.3 WHEN CSV文件使用其他常见编码（如Big5、Shift-JIS）保存且包含相应语言字符 THEN 系统应自动检测编码并正确解码，字符正确显示

### Unchanged Behavior (Regression Prevention)

3.1 WHEN CSV文件使用UTF-8编码保存 THEN 系统应继续正确解析文件内容，保持现有功能不变

3.2 WHEN CSV文件包含英文和数字字符 THEN 系统应继续正确解析文件内容，保持现有功能不变

3.3 WHEN CSV文件格式为edge-list格式（source, label, target） THEN 系统应继续正确解析节点和边数据，保持现有功能不变

3.4 WHEN CSV文件格式为完整节点数据格式（包含x, y坐标） THEN 系统应继续正确解析节点数据，保持现有功能不变

3.5 WHEN 导入Excel文件或JSON文件 THEN 系统应继续正确解析文件内容，保持现有功能不变
