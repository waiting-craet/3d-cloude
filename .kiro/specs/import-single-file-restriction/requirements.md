# 需求文档

## 介绍

本功能旨在限制导入数据页面只能选择和导入单个文件,防止用户误选多个文件导致数据混乱或系统错误。通过在文件选择器层面强制单文件限制,并在用户界面上提供清晰的视觉反馈,确保用户理解并遵守单文件导入规则。

## 术语表

- **Import_Page**: 导入数据页面,用户上传文件以创建知识图谱的界面
- **File_Input**: HTML文件输入控件,用于选择本地文件
- **File_Selector**: 文件选择器组件,包含文件输入控件和相关UI元素
- **Selected_File**: 当前被选中准备上传的文件
- **File_Type_Card**: 文件类型卡片,显示Excel、CSV、JSON三种支持的文件格式
- **Upload_Button**: 生成图谱按钮,触发文件上传和数据导入流程

## 需求

### 需求 1: 文件选择器单文件限制

**用户故事:** 作为用户,我希望文件选择器只允许选择一个文件,这样我就不会意外选择多个文件导致导入错误。

#### 验收标准

1. THE File_Input SHALL have the "multiple" attribute set to false or omitted
2. WHEN a user opens the file selection dialog, THE File_Selector SHALL only allow selecting one file at a time
3. WHEN a user attempts to select multiple files (if browser allows), THE File_Input SHALL only accept the first selected file
4. THE File_Input SHALL accept files with extensions .xlsx, .xls, .csv, or .json

### 需求 2: 文件替换行为

**用户故事:** 作为用户,当我选择了一个文件后再选择另一个文件,我希望新文件替换旧文件,这样我可以更正选择错误。

#### 验收标准

1. WHEN a user selects a new file, THE Import_Page SHALL replace the previously Selected_File with the new file
2. WHEN a file is replaced, THE Import_Page SHALL update the file type indicator to match the new file's extension
3. WHEN a file is replaced, THE Import_Page SHALL display the new file's name in the file information area
4. THE Import_Page SHALL maintain only one Selected_File in state at any time

### 需求 3: 用户界面视觉反馈

**用户故事:** 作为用户,我希望界面清楚地显示当前选中的文件,这样我可以确认选择了正确的文件。

#### 验收标准

1. WHEN a file is selected, THE File_Type_Card corresponding to the file type SHALL display a visual highlight (border color change)
2. WHEN a file is selected, THE Import_Page SHALL display the file name and type below the File_Type_Cards
3. WHEN no file is selected, THE File_Type_Cards SHALL display in their default unhighlighted state
4. THE file information display SHALL show the complete file name and file type in uppercase format

### 需求 4: 文件选择提示文本

**用户故事:** 作为用户,我希望看到明确的提示告诉我只能选择一个文件,这样我就能理解系统的限制。

#### 验收标准

1. THE File_Type_Card SHALL display text "拖拽文件到此" to indicate single file drop zone
2. WHEN a user hovers over a File_Type_Card, THE card SHALL provide visual feedback (border color change and elevation)
3. THE Import_Page SHALL not display any text or UI elements suggesting multiple file selection is possible
4. THE file selection prompt text SHALL be consistent across all three File_Type_Cards

### 需求 5: 文件验证和错误处理

**用户故事:** 作为用户,当我选择了不支持的文件类型时,我希望看到清晰的错误提示,这样我就知道需要选择其他文件。

#### 验收标准

1. WHEN a user selects a file with an unsupported extension, THE Import_Page SHALL display an error message "不支持的文件格式"
2. WHEN a file validation fails, THE Import_Page SHALL set the file type to null
3. WHEN a file validation fails, THE Upload_Button SHALL remain disabled
4. THE error message SHALL be displayed in the upload status area with error styling (rose background color)

### 需求 6: 上传按钮状态管理

**用户故事:** 作为用户,我希望只有在选择了有效文件、项目和图谱后才能点击生成按钮,这样可以避免无效的上传操作。

#### 验收标准

1. WHEN no file is selected, THE Upload_Button SHALL be disabled
2. WHEN no project is selected, THE Upload_Button SHALL be disabled
3. WHEN no graph is selected, THE Upload_Button SHALL be disabled
4. WHEN a file, project, and graph are all selected, THE Upload_Button SHALL be enabled
5. WHEN an upload is in progress, THE Upload_Button SHALL be disabled and display "正在生成..."

### 需求 7: 文件选择器交互行为

**用户故事:** 作为用户,我希望点击任何文件类型卡片都能打开文件选择对话框,这样我可以方便地选择文件。

#### 验收标准

1. WHEN a user clicks on any File_Type_Card, THE File_Input SHALL trigger the file selection dialog
2. THE file selection dialog SHALL filter files by the accepted extensions (.xlsx, .xls, .csv, .json)
3. WHEN a user clicks the hidden File_Input directly (via programmatic trigger), THE same file selection dialog SHALL open
4. THE File_Input element SHALL remain hidden from view (display: none)

### 需求 8: 文件信息显示

**用户故事:** 作为用户,当我选择了文件后,我希望看到文件的详细信息,这样我可以确认选择了正确的文件。

#### 验收标准

1. WHEN a file is selected, THE Import_Page SHALL display a file information box
2. THE file information box SHALL show the file name
3. THE file information box SHALL show the file type in uppercase format (EXCEL, CSV, or JSON)
4. THE file information box SHALL have a light gray background (#f5f5f5) and rounded corners
5. WHEN no file is selected, THE file information box SHALL not be displayed

### 需求 9: 确认对话框文件信息

**用户故事:** 作为用户,在确认生成图谱之前,我希望再次看到将要导入的文件信息,这样我可以最后确认一次。

#### 验收标准

1. WHEN a user clicks the Upload_Button, THE Import_Page SHALL display a confirmation modal
2. THE confirmation modal SHALL display the selected project name
3. THE confirmation modal SHALL display the selected graph name
4. THE confirmation modal SHALL display the selected file name
5. THE confirmation modal SHALL display the file type in uppercase format
6. THE confirmation modal SHALL include a warning message "数据将被导入到选定的图谱中，此操作不可撤销"

### 需求 10: 单文件导入流程完整性

**用户故事:** 作为用户,我希望整个导入流程只处理我选择的那一个文件,这样可以确保数据的一致性和可追溯性。

#### 验收标准

1. WHEN the upload process starts, THE Import_Page SHALL send only the Selected_File to the server
2. THE FormData object SHALL contain exactly one file entry
3. THE server request SHALL include the file, projectId, graphId, and fileType parameters
4. WHEN the upload completes successfully, THE Import_Page SHALL display import statistics for the single uploaded file
5. THE import statistics SHALL show totalNodesInFile, totalEdgesInFile, importedNodesCount, importedEdgesCount, duplicateNodesCount, and duplicateEdgesCount for the single file
