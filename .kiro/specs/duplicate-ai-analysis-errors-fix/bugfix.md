# Bugfix Requirements Document

## Introduction

This document addresses critical errors that prevent knowledge graph generation when users click AI analysis. The system fails with three distinct errors: (1) duplicate detection service failure showing "Failed to check for duplicates. Please try again.", (2) AI Analysis API returning 500 Internal Server Error at /api/ai/analyze endpoint, and (3) async listener error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" at page.tsx:219. These errors completely block the AI-powered knowledge graph creation workflow, preventing users from generating graphs from their document text.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN user clicks AI analysis to generate knowledge graph THEN the duplicate detection service fails with error "Failed to check for duplicates. Please try again."

1.2 WHEN user clicks AI analysis to generate knowledge graph THEN the /api/ai/analyze endpoint returns 500 Internal Server Error

1.3 WHEN user clicks AI analysis to generate knowledge graph THEN the system throws "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" at page.tsx:219

1.4 WHEN the duplicate detection service encounters a database error THEN the system returns a generic error message without proper error handling

1.5 WHEN the AI analysis API encounters an unexpected error THEN the system fails to generate the knowledge graph and displays error to user

### Expected Behavior (Correct)

2.1 WHEN user clicks AI analysis to generate knowledge graph THEN the duplicate detection service SHALL successfully check for duplicates without errors

2.2 WHEN user clicks AI analysis to generate knowledge graph THEN the /api/ai/analyze endpoint SHALL return 200 success response with valid graph data

2.3 WHEN user clicks AI analysis to generate knowledge graph THEN the system SHALL NOT throw any async listener errors

2.4 WHEN the duplicate detection service encounters a database error THEN the system SHALL handle the error gracefully with proper logging and user-friendly error messages

2.5 WHEN the AI analysis API processes the request THEN the system SHALL successfully generate the knowledge graph and display it in the preview modal

### Unchanged Behavior (Regression Prevention)

3.1 WHEN user performs AI analysis without existing graph data THEN the system SHALL CONTINUE TO skip duplicate detection and generate new graph data

3.2 WHEN duplicate detection successfully identifies duplicates THEN the system SHALL CONTINUE TO mark them correctly in the preview

3.3 WHEN AI analysis completes successfully THEN the system SHALL CONTINUE TO display the preview modal with generated nodes and edges

3.4 WHEN user cancels AI analysis THEN the system SHALL CONTINUE TO abort the request properly without errors

3.5 WHEN user retries failed AI analysis THEN the system SHALL CONTINUE TO attempt the analysis again with the same parameters

3.6 WHEN AI analysis encounters network errors THEN the system SHALL CONTINUE TO display appropriate network error messages

## Bug Condition Analysis

### Bug Condition C(X)

The bug condition identifies when AI analysis fails to generate knowledge graphs:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AIAnalysisRequest
  OUTPUT: boolean
  
  RETURN (
    X.triggerAction = "AI_ANALYSIS_CLICK" AND
    (X.duplicateDetectionFails OR
     X.apiReturns500Error OR
     X.asyncListenerErrorOccurs)
  )
END FUNCTION
```

Where:
- `triggerAction`: User clicks AI analysis button to generate knowledge graph
- `duplicateDetectionFails`: Duplicate detection service throws database error
- `apiReturns500Error`: /api/ai/analyze endpoint returns 500 status
- `asyncListenerErrorOccurs`: Async promise error thrown at page.tsx:219

### Property Specification - Fix Checking

```pascal
// Property: AI Analysis Success
FOR ALL X WHERE isBugCondition(X) DO
  result ← performAIAnalysis'(X)
  ASSERT (
    result.duplicateDetectionSucceeds = true AND
    result.apiResponseStatus = 200 AND
    result.noAsyncListenerErrors = true AND
    result.graphDataGenerated = true AND
    result.previewModalDisplayed = true
  )
END FOR
```

This ensures that after the fix:
- Duplicate detection completes successfully without database errors
- AI analysis API returns 200 success response
- No async listener errors occur
- Knowledge graph data is generated correctly
- Preview modal displays the generated graph

### Property Specification - Preservation Checking

```pascal
// Property: Existing Functionality Preservation
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

This ensures that for normal AI analysis operations (without the bug conditions), all existing functionality remains unchanged, including successful analysis flows, duplicate detection when it works, preview display, cancellation, retry, and error handling for other error types.

## Root Cause Hypotheses

### Hypothesis 1: Database Connection Failure in Duplicate Detection
The "Failed to check for duplicates" error suggests the duplicate detection service is encountering database connection issues when querying existing nodes and edges. This could be caused by:
- Prisma client not properly initialized or connected
- Database connection pool exhausted
- Query timeout due to large dataset
- Missing error handling in fetchExistingNodes or fetchExistingEdges functions

### Hypothesis 2: AI Integration Service Error
The 500 error from /api/ai/analyze endpoint indicates the AI integration service is failing. Possible causes:
- Missing or invalid AI_API_KEY environment variable
- AI API endpoint unreachable or timing out
- Malformed request to AI service
- AI service returning unexpected response format
- Error in aiService.analyzeDocument() call

### Hypothesis 3: Async Listener Race Condition
The async listener error at page.tsx:219 suggests a timing issue with asynchronous operations. This could be:
- Chrome extension message channel closing prematurely
- React state update after component unmount
- Promise rejection not properly handled
- AbortController signal triggering during async operation

### Hypothesis 4: Error Propagation Chain
The three errors may be related in a cascade:
- AI analysis fails (500 error) → triggers error handling → causes async listener error
- Duplicate detection fails → AI analysis cannot proceed → returns 500 error
- Database error → duplicate detection fails → entire analysis pipeline breaks
