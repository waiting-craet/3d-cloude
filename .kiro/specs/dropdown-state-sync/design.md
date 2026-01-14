# Design Document

## Overview

This design addresses two critical synchronization issues in the dropdown state management:

1. **Post-Save Redirect Issue**: After saving 2D workflow data, the page redirects before the dropdown state can update, causing the newly saved project/graph to disappear
2. **Post-Delete Stale Data Issue**: After deleting a project/graph, the dropdown still shows the deleted item because the state isn't properly refreshed

The root cause of both issues is improper state synchronization timing. The solution involves coordinating state updates with navigation actions and ensuring the dropdown always reflects the current database state.

## Architecture

### Current Flow (Problematic)

**Save and Convert Flow:**
```
User clicks "Save and Convert"
  → Call Sync API
  → API saves to database
  → Call refreshProjects() (async)
  → Immediately redirect to '/' (doesn't wait for refresh)
  → Page reloads, loses refreshed state
  → Dropdown loads stale data from initial page load
```

**Delete Flow:**
```
User confirms deletion
  → Call Delete API
  → API deletes from database
  → Call refreshProjects() with retry logic
  → Update dropdown state
  → (Sometimes) Stale data persists due to timing issues
```

### Proposed Flow (Fixed)

**Save and Convert Flow:**
```
User clicks "Save and Convert"
  → Call Sync API
  → API saves to database
  → Wait for refreshProjects() to complete
  → Store current project/graph IDs in localStorage
  → Redirect to '/' with query params (?projectId=X&graphId=Y)
  → Page loads and reads query params
  → TopNavbar restores selection from query params
  → Dropdown shows correct state
```

**Delete Flow:**
```
User confirms deletion
  → Call Delete API
  → API deletes from database
  → Verify deletion succeeded (check response)
  → Call refreshProjects() with retry logic
  → Verify deleted item is gone from state
  → If verification fails, force page reload
  → Update dropdown state
  → Clear selection if deleted item was selected
```

## Components and Interfaces

### 1. WorkflowCanvas Component

**Modified Methods:**

```typescript
// Save and convert with proper state synchronization
const saveAndConvert = async () => {
  try {
    // 1. Validate and prepare data
    if (!currentGraph) {
      setConversionError('请先选择一个图谱')
      return
    }

    // 2. Call Sync API
    setSavingStatus('正在保存到数据库...')
    setIsConverting(true)
    
    const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('同步失败')
    }

    // 3. Wait for state refresh to complete
    setSavingStatus('保存成功！正在刷新数据...')
    await refreshProjects()
    
    // 4. Store selection in localStorage for page load
    localStorage.setItem('currentProjectId', currentProject.id)
    localStorage.setItem('currentGraphId', currentGraph.id)
    
    // 5. Redirect with query parameters
    setSavingStatus('即将跳转到3D视图...')
    setConversionSuccess(true)
    
    // Use query params to ensure state is restored
    const redirectUrl = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`
    setTimeout(() => {
      window.location.href = redirectUrl
    }, 1500)
    
  } catch (error) {
    setConversionError(error.message)
  } finally {
    setIsConverting(false)
  }
}
```

### 2. TopNavbar Component

**Modified Methods:**

```typescript
// Enhanced project loading with query param support
useEffect(() => {
  const loadProjects = async () => {
    try {
      // Load all projects
      const res = await fetch('/api/projects/with-graphs')
      const data = await res.json()
      const projects = data.projects || []
      
      setProjects(projects)
      
      // Check for query parameters (from redirect)
      const urlParams = new URLSearchParams(window.location.search)
      const projectIdFromUrl = urlParams.get('projectId')
      const graphIdFromUrl = urlParams.get('graphId')
      
      // Priority: URL params > localStorage > nothing
      const projectId = projectIdFromUrl || localStorage.getItem('currentProjectId')
      const graphId = graphIdFromUrl || localStorage.getItem('currentGraphId')
      
      if (projectId && graphId) {
        const project = projects.find(p => p.id === projectId)
        const graph = project?.graphs.find(g => g.id === graphId)
        
        if (project && graph) {
          switchGraph(projectId, graphId)
          
          // Clean up URL params after restoring state
          if (projectIdFromUrl || graphIdFromUrl) {
            window.history.replaceState({}, '', '/')
          }
        } else {
          // Invalid IDs, clear localStorage
          localStorage.removeItem('currentProjectId')
          localStorage.removeItem('currentGraphId')
        }
      }
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }
  
  loadProjects()
}, [setProjects, switchGraph])

// Enhanced delete confirmation with verification
const confirmDelete = async () => {
  if (!deleteDialog.id || !deleteDialog.type) return

  setIsDeleting(true)
  try {
    const endpoint = deleteDialog.type === 'project'
      ? `/api/projects/${deleteDialog.id}`
      : `/api/graphs/${deleteDialog.id}`

    // 1. Call delete API
    const res = await fetch(endpoint, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || '删除失败')
    }

    // 2. Show success message
    alert(`成功删除 ${deleteDialog.name}！`)

    // 3. Close dialog
    setDeleteDialog({
      isOpen: false,
      type: null,
      id: null,
      name: null,
      stats: { nodeCount: 0, edgeCount: 0 },
    })

    // 4. Handle current selection
    const isCurrentProject = deleteDialog.type === 'project' && currentProject?.id === deleteDialog.id
    const isCurrentGraph = deleteDialog.type === 'graph' && currentGraph?.id === deleteDialog.id
    
    if (isCurrentProject || isCurrentGraph) {
      // Clear selection and reload page
      localStorage.removeItem('currentProjectId')
      localStorage.removeItem('currentGraphId')
      window.location.reload()
      return
    }

    // 5. Refresh project list with verification
    const expandedProjectId = deleteDialog.type === 'graph' ? hoveredProjectId : null
    
    let verified = false
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries && !verified) {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
      }

      const projectsRes = await fetch('/api/projects/with-graphs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        const projects = projectsData.projects || []
        
        // Verify deletion
        if (deleteDialog.type === 'project') {
          verified = !projects.some(p => p.id === deleteDialog.id)
        } else {
          verified = !projects.some(p => 
            p.graphs.some(g => g.id === deleteDialog.id)
          )
        }
        
        if (verified) {
          setProjects(projects)
          if (expandedProjectId) {
            setHoveredProjectId(expandedProjectId)
          }
          break
        }
      }
      
      retryCount++
    }

    // Force reload if verification failed
    if (!verified) {
      window.location.reload()
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert(`删除失败: ${error.message}`)
  } finally {
    setIsDeleting(false)
  }
}
```

### 3. GraphStore (lib/store.ts)

**Modified Methods:**

```typescript
// Enhanced refreshProjects with better verification
refreshProjects: async () => {
  try {
    const state = get()
    const currentProjectId = state.currentProject?.id
    const currentGraphId = state.currentGraph?.id
    
    let projects: any[] = []
    let retryCount = 0
    const maxRetries = 3
    let verified = false
    
    while (retryCount < maxRetries && !verified) {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
      }
      
      const projectsRes = await fetch('/api/projects/with-graphs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (!projectsRes.ok) {
        throw new Error('加载项目列表失败')
      }
      
      const projectsData = await projectsRes.json()
      projects = projectsData.projects || []
      
      // If we have a current selection, verify it exists
      if (currentProjectId && currentGraphId) {
        const project = projects.find(p => p.id === currentProjectId)
        const graph = project?.graphs.find(g => g.id === currentGraphId)
        
        if (project && graph) {
          verified = true
          set({
            projects,
            currentProject: project,
            currentGraph: graph,
          })
          return
        }
      } else {
        // No current selection, just update projects
        verified = true
        set({ projects })
        return
      }
      
      retryCount++
    }
    
    // If verification failed, update projects anyway
    set({ projects })
    
  } catch (error) {
    console.error('刷新项目列表失败:', error)
    throw error
  }
}
```

## Data Models

No changes to database schema required. All changes are in client-side state management.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

**1.1 WHEN a user clicks "保存并转换为3D" in the 2D workflow canvas, THEN the System SHALL save the data to the database via the Sync API**
Thoughts: This is testing that the save action triggers the correct API call. We can verify this by checking that the Sync API is called with the correct payload.
Testable: yes - example

**1.2 WHEN the Sync API successfully saves the data, THEN the System SHALL refresh the project list in GraphStore**
Thoughts: This is testing that after a successful save, the refresh function is called. We can verify this by mocking the API and checking that refreshProjects is called.
Testable: yes - example

**1.3 WHEN the project list is refreshed, THEN the System SHALL redirect to the 3D view with the current project and graph selected**
Thoughts: This is testing the redirect behavior after refresh. We can verify the redirect URL contains the correct query parameters.
Testable: yes - example

**1.4 WHEN the 3D view loads, THEN the System SHALL display the updated project and graph in the dropdown menu**
Thoughts: This is testing UI state after page load. We can verify that the dropdown shows the correct project/graph by checking the rendered output.
Testable: yes - example

**1.5 WHEN the dropdown is opened, THEN the System SHALL show the correct node count and edge count for the graph**
Thoughts: This is testing that the counts displayed match the actual data. For any graph, the displayed counts should match the database counts.
Testable: yes - property

**2.1 WHEN an administrator deletes a project, THEN the System SHALL remove the project from the database**
Thoughts: This is testing the delete API functionality. We can verify the API is called and returns success.
Testable: yes - example

**2.2 WHEN the project is successfully deleted, THEN the System SHALL refresh the project list in GraphStore**
Thoughts: This is testing that refresh is called after successful deletion. We can verify refreshProjects is called.
Testable: yes - example

**2.3 WHEN the project list is refreshed, THEN the System SHALL remove the deleted project from the dropdown immediately**
Thoughts: This is testing that for any deleted project, it should not appear in the refreshed project list.
Testable: yes - property

**2.4 WHEN an administrator deletes a graph, THEN the System SHALL remove the graph from the database**
Thoughts: This is testing the delete API functionality for graphs.
Testable: yes - example

**2.5 WHEN the graph is successfully deleted, THEN the System SHALL refresh the project list in GraphStore**
Thoughts: This is testing that refresh is called after graph deletion.
Testable: yes - example

**2.6 WHEN the project list is refreshed, THEN the System SHALL remove the deleted graph from the dropdown immediately**
Thoughts: This is testing that for any deleted graph, it should not appear in the refreshed graph list.
Testable: yes - property

**2.7 IF the deleted project or graph was currently selected, THEN the System SHALL clear the selection and reload the page**
Thoughts: This is testing a specific condition - when the current selection is deleted. We can verify the selection is cleared and reload is triggered.
Testable: yes - example

**3.1 WHEN the System refreshes the project list, THEN it SHALL use cache-busting headers to ensure fresh data**
Thoughts: This is testing that the fetch request includes the correct headers. We can verify the headers are present.
Testable: yes - example

**3.2 WHEN the database write operation completes, THEN the System SHALL wait for database synchronization before fetching updated data**
Thoughts: This is testing timing behavior. We can verify that there's a delay between write and read operations.
Testable: yes - example

**3.3 IF the first refresh attempt doesn't return updated data, THEN the System SHALL retry up to 3 times with exponential backoff**
Thoughts: This is testing retry logic. For any refresh operation that fails initially, it should retry with increasing delays.
Testable: yes - property

**3.4 WHEN all retry attempts fail, THEN the System SHALL force a page reload to ensure data consistency**
Thoughts: This is testing the fallback behavior. We can verify that after max retries, a page reload is triggered.
Testable: yes - example

**3.5 WHEN the System fetches project data, THEN it SHALL include all graphs with their current node counts and edge counts**
Thoughts: This is testing data completeness. For any project fetch, all graphs should have accurate counts.
Testable: yes - property

**4.1 WHEN a deletion API call returns a 404 error, THEN the System SHALL display an error message "项目不存在" or "图谱不存在"**
Thoughts: This is testing error handling for a specific error code. We can verify the correct message is displayed.
Testable: yes - example

**4.2 WHEN a deletion API call returns a 500 error, THEN the System SHALL display the error message from the API response**
Thoughts: This is testing error message propagation. For any 500 error, the API's error message should be displayed.
Testable: yes - property

**4.3 WHEN a deletion fails, THEN the System SHALL NOT remove the item from the dropdown**
Thoughts: This is testing that failed deletions don't affect the UI state. For any deletion failure, the item should remain visible.
Testable: yes - property

**4.4 WHEN a deletion succeeds but refresh fails, THEN the System SHALL force a page reload to ensure consistency**
Thoughts: This is testing the fallback behavior for refresh failures.
Testable: yes - example

**4.5 WHEN displaying error messages, THEN the System SHALL automatically dismiss them after 5 seconds**
Thoughts: This is testing timing behavior for error messages. We can verify messages disappear after the timeout.
Testable: yes - example

### Property Reflection

After reviewing all testable properties:

- **Property 1.5** (node/edge counts) and **Property 3.5** (data completeness) are related but test different aspects - 1.5 tests UI display, 3.5 tests API response. Keep both.
- **Property 2.3** (deleted project not in list) and **Property 2.6** (deleted graph not in list) test the same concept for different entity types. These can be combined into one property about deleted entities.
- **Property 3.3** (retry logic) is unique and valuable.
- **Property 4.2** (error message propagation) and **Property 4.3** (failed deletion state) are distinct and should both be kept.

**Combined Property:** Deleted entities should not appear in refreshed lists
- Combines 2.3 and 2.6 into a single property that applies to both projects and graphs

### Correctness Properties

**Property 1: Dropdown counts match database counts**
*For any* graph displayed in the dropdown, the displayed node count and edge count should match the actual counts in the database
**Validates: Requirements 1.5**

**Property 2: Deleted entities are removed from state**
*For any* deleted project or graph, after a successful refresh, the entity should not appear in the projects list
**Validates: Requirements 2.3, 2.6**

**Property 3: Retry logic uses exponential backoff**
*For any* refresh operation that requires retries, the delay between attempts should increase exponentially (500ms, 1000ms, 1500ms)
**Validates: Requirements 3.3**

**Property 4: Error messages are propagated correctly**
*For any* API error response with a message field, the displayed error message should contain the API's error message
**Validates: Requirements 4.2**

**Property 5: Failed deletions preserve state**
*For any* deletion operation that fails, the project/graph should remain in the dropdown with unchanged data
**Validates: Requirements 4.3**

**Property 6: Data completeness in API responses**
*For any* project fetched from the API, all graphs in that project should have defined nodeCount and edgeCount properties
**Validates: Requirements 3.5**

## Error Handling

### 1. Save and Convert Errors

**Scenario:** Sync API fails
- Display error message from API response
- Keep user on 2D workflow page
- Allow user to retry

**Scenario:** refreshProjects fails
- Log warning but continue with redirect
- Page reload will fetch fresh data anyway

### 2. Deletion Errors

**Scenario:** Delete API returns 404
- Display "项目不存在" or "图谱不存在"
- Close delete dialog
- Refresh project list to sync state

**Scenario:** Delete API returns 500
- Display error message from API
- Keep delete dialog open
- Allow user to retry

**Scenario:** Refresh fails after successful deletion
- Force page reload to ensure consistency
- User sees updated state after reload

### 3. State Synchronization Errors

**Scenario:** Retry attempts exhausted
- Force page reload
- Log error for debugging

**Scenario:** Invalid query parameters
- Clear localStorage
- Load default state (no selection)

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Save and Convert Flow**
   - Test successful save triggers refreshProjects
   - Test redirect URL contains correct query params
   - Test error handling when Sync API fails

2. **Delete Flow**
   - Test successful deletion triggers refresh
   - Test 404 error displays correct message
   - Test 500 error displays API message
   - Test current selection is cleared when deleted

3. **State Restoration**
   - Test query params override localStorage
   - Test invalid IDs are cleared from localStorage
   - Test dropdown shows correct selection after page load

### Property-Based Tests

Property-based tests will verify universal properties across all inputs:

1. **Property 1: Dropdown counts match database counts**
   - Generate random graphs with varying node/edge counts
   - Verify displayed counts always match database counts

2. **Property 2: Deleted entities are removed from state**
   - Generate random project/graph structures
   - Delete random entities
   - Verify deleted entities never appear in refreshed state

3. **Property 3: Retry logic uses exponential backoff**
   - Simulate various refresh failure scenarios
   - Verify delays follow exponential pattern

4. **Property 4: Error messages are propagated correctly**
   - Generate random API error responses
   - Verify error messages are correctly displayed

5. **Property 5: Failed deletions preserve state**
   - Simulate deletion failures
   - Verify state remains unchanged

6. **Property 6: Data completeness in API responses**
   - Generate random project structures
   - Verify all graphs have required count properties

Each property test should run a minimum of 100 iterations to ensure comprehensive coverage.
