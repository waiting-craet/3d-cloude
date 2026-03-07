# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - 项目卡片点击应切换视图而非跳转路由
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - clicking project cards on homepage
  - Test that clicking a project card attempts to navigate to `/project/${projectId}` route (from Fault Condition in design)
  - Test that viewMode state does not exist or is not updated
  - Test that selectedProject state does not exist or is not set
  - Test that fetchProjectGraphs is not called
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "clicking project card calls router.push('/project/abc123') instead of switching view state")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - 非项目卡片点击的交互行为
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-project-card interactions:
    - Clicking graph cards navigates to `/graph/${graphId}`
    - Navigation buttons (开始创作, 登录) work normally
    - Page loads and fetches project data correctly
    - Search functionality works normally
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for 首页项目卡片点击404错误

  - [x] 3.1 添加视图状态管理
    - Add `viewMode` state: `useState<'gallery' | 'projectGraphs'>('gallery')`
    - Add `selectedProject` state: `useState<Project | null>(null)`
    - Add `graphs` state: `useState<Graph[]>([])`
    - Add `graphsLoading` state: `useState(false)`
    - Add `graphsError` state: `useState<string | null>(null)`
    - Add Graph type definition if not exists
    - _Bug_Condition: isBugCondition(input) where input.eventType === 'projectCardClick' AND navigationAttemptedTo('/project/' + input.projectId)_
    - _Expected_Behavior: viewMode switches to 'projectGraphs', selectedProject is set, graphs are fetched_
    - _Preservation: Non-project-card interactions remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 修改 handleProjectClick 函数实现视图切换
    - Remove `router.push('/project/${projectId}')` call
    - Add logic to find selected project: `const project = projects.find(p => p.id === projectId)`
    - Set `selectedProject` state with found project
    - Set `viewMode` to 'projectGraphs'
    - Call `fetchProjectGraphs(projectId)` function
    - _Bug_Condition: isBugCondition(input) from design_
    - _Expected_Behavior: expectedBehavior(result) from design - view switches instead of navigation_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 添加 fetchProjectGraphs 函数
    - Accept `projectId` parameter
    - Set `graphsLoading` to true
    - Call `/api/projects/${projectId}/graphs` API
    - Handle successful response and update `graphs` state
    - Handle errors and update `graphsError` state
    - Set `graphsLoading` to false in finally block
    - _Requirements: 2.3_

  - [x] 3.4 添加 handleBackToGallery 函数
    - Reset `viewMode` to 'gallery'
    - Clear `selectedProject` to null
    - Clear `graphs` to empty array
    - Clear `graphsError` to null
    - _Requirements: 2.4_

  - [x] 3.5 修改渲染逻辑支持两种视图模式
    - Update PaperGallerySection heading: use conditional expression `viewMode === 'gallery' ? '推荐广场' : `${selectedProject?.name}项目中的知识图谱``
    - Add back button in graph list view that calls handleBackToGallery
    - Use conditional rendering: `viewMode === 'gallery' ? <ProjectCards> : <GraphCards>`
    - Reuse PaperWorkCard component for graph cards or create new GraphCard component
    - Graph cards should navigate to `/graph/${graphId}` on click
    - Handle empty state: show "该项目还没有创建任何图谱" when graphs array is empty
    - Handle loading state: show loading indicator when graphsLoading is true
    - Handle error state: show error message when graphsError is not null
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - 项目卡片点击应切换视图而非跳转路由
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design - 2.1, 2.2, 2.3, 2.4_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - 非项目卡片点击的交互行为
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (exploration test + preservation tests)
  - Verify all tests pass
  - Test complete user flow manually:
    - Load homepage and see project cards
    - Click a project card and see graph list view
    - Verify title changes to "xxx项目中的知识图谱"
    - Verify back button appears
    - Click back button and return to gallery view
    - Click a graph card and verify navigation to graph detail page works
  - Ask the user if questions arise
