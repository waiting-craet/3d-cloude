# Design Document: Enhanced Unstructured Data Extraction

## Overview

This design document outlines the architecture and implementation approach for enhancing the AI-powered knowledge graph system with advanced unstructured data extraction capabilities. The system will support multiple document formats, domain-specific extraction templates, and intelligent processing of large documents.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  DocumentUploadComponent  │  TemplateSelector  │  Preview   │
│  BatchProcessor           │  ConfidenceViewer  │  Modal     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  /api/extract/analyze     │  /api/extract/batch             │
│  /api/extract/templates   │  /api/extract/validate          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  DocumentParserService    │  ExtractionService              │
│  TemplateService          │  ChunkingService                │
│  MergeService             │  ValidationService              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  DeepSeek API             │  Database (PostgreSQL)          │
│  File Storage (optional)  │  Cache (Redis - optional)       │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Document Parser Service

**Location:** `lib/services/document-parser.ts`

**Purpose:** Parse various document formats into plain text

**Interface:**
```typescript
interface DocumentParserService {
  parsePDF(file: File): Promise<ParsedDocument>
  parseDOCX(file: File): Promise<ParsedDocument>
  parseText(file: File): Promise<ParsedDocument>
  parseMarkdown(file: File): Promise<ParsedDocument>
}

interface ParsedDocument {
  text: string
  metadata: DocumentMetadata
  pages?: PageInfo[]
  tables?: TableData[]
}

interface DocumentMetadata {
  filename: string
  format: string
  size: number
  pageCount?: number
  author?: string
  createdAt?: Date
}

interface PageInfo {
  pageNumber: number
  text: string
  startOffset: number
  endOffset: number
}
```

**Implementation Details:**
- Use `pdf-parse` for PDF parsing
- Use `mammoth` for DOCX parsing
- Handle encoding detection for text files
- Extract metadata from document properties
- Preserve page boundaries for source attribution

### 2. Extraction Template Service

**Location:** `lib/services/extraction-template.ts`

**Purpose:** Manage domain-specific extraction templates

**Interface:**
```typescript
interface ExtractionTemplate {
  id: string
  name: string
  domain: string
  entityTypes: EntityTypeDefinition[]
  relationshipTypes: RelationshipTypeDefinition[]
  promptInstructions: string
  examples?: ExtractionExample[]
}

interface EntityTypeDefinition {
  type: string
  description: string
  attributes: AttributeDefinition[]
  examples: string[]
}

interface RelationshipTypeDefinition {
  type: string
  description: string
  sourceTypes: string[]
  targetTypes: string[]
  attributes: AttributeDefinition[]
  examples: string[]
}

interface AttributeDefinition {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'array'
  required: boolean
  description: string
}
```

**Predefined Templates:**

1. **Medical/Healthcare Template**
```typescript
{
  id: 'medical',
  name: 'Medical/Healthcare',
  domain: 'healthcare',
  entityTypes: [
    {
      type: 'Patient',
      description: 'A person receiving medical care',
      attributes: [
        { name: 'age', type: 'number', required: false },
        { name: 'gender', type: 'string', required: false },
        { name: 'id', type: 'string', required: false }
      ]
    },
    {
      type: 'Disease',
      description: 'A medical condition or illness',
      attributes: [
        { name: 'severity', type: 'string', required: false },
        { name: 'stage', type: 'string', required: false }
      ]
    },
    {
      type: 'Medication',
      description: 'A drug or treatment',
      attributes: [
        { name: 'dosage', type: 'string', required: false },
        { name: 'frequency', type: 'string', required: false }
      ]
    }
  ],
  relationshipTypes: [
    {
      type: 'diagnosed_with',
      sourceTypes: ['Patient'],
      targetTypes: ['Disease'],
      attributes: [
        { name: 'date', type: 'date', required: false }
      ]
    },
    {
      type: 'prescribed',
      sourceTypes: ['Patient'],
      targetTypes: ['Medication'],
      attributes: [
        { name: 'date', type: 'date', required: false },
        { name: 'prescriber', type: 'string', required: false }
      ]
    }
  ]
}
```

2. **Legal Template**
3. **Business Template**
4. **Academic Template**
5. **General Template**

### 3. Enhanced Extraction Service

**Location:** `lib/services/enhanced-extraction.ts`

**Purpose:** Orchestrate the extraction process with templates and chunking

**Interface:**
```typescript
interface EnhancedExtractionService {
  extractWithTemplate(
    document: ParsedDocument,
    template: ExtractionTemplate,
    options?: ExtractionOptions
  ): Promise<ExtractionResult>
  
  extractBatch(
    documents: ParsedDocument[],
    template: ExtractionTemplate
  ): Promise<BatchExtractionResult>
}

interface ExtractionOptions {
  chunkSize?: number
  chunkOverlap?: number
  includeConfidence?: boolean
  includeSourceContext?: boolean
  minConfidence?: number
}

interface ExtractionResult {
  entities: ExtractedEntity[]
  relationships: ExtractedRelationship[]
  metadata: ExtractionMetadata
  quality: QualityMetrics
}

interface ExtractedEntity {
  id: string
  name: string
  type: string
  attributes: Record<string, any>
  confidence: number
  sourceDocument: string
  sourceContext: string
  sourcePages?: number[]
}

interface ExtractedRelationship {
  id: string
  from: string
  to: string
  type: string
  attributes: Record<string, any>
  confidence: number
  sourceDocument: string
  sourceContext: string
}

interface ExtractionMetadata {
  documentName: string
  template: string
  processingTime: number
  tokenUsage: number
  chunksProcessed: number
}

interface QualityMetrics {
  totalEntities: number
  totalRelationships: number
  averageConfidence: number
  lowConfidenceCount: number
  qualityScore: number
}
```

### 4. Document Chunking Service

**Location:** `lib/services/document-chunking.ts`

**Purpose:** Split large documents into processable chunks

**Interface:**
```typescript
interface ChunkingService {
  chunkDocument(
    text: string,
    options: ChunkingOptions
  ): DocumentChunk[]
  
  mergeChunkResults(
    chunks: ChunkExtractionResult[]
  ): ExtractionResult
}

interface ChunkingOptions {
  maxTokens: number
  overlapTokens: number
  preserveSentences: boolean
}

interface DocumentChunk {
  id: string
  text: string
  startOffset: number
  endOffset: number
  tokenCount: number
  overlapWithPrevious: boolean
  overlapWithNext: boolean
}

interface ChunkExtractionResult {
  chunkId: string
  entities: ExtractedEntity[]
  relationships: ExtractedRelationship[]
}
```

**Chunking Algorithm:**
1. Tokenize document using tiktoken or similar
2. Split into chunks of maxTokens size
3. Add overlap of overlapTokens to each chunk
4. Preserve sentence boundaries when possible
5. Track chunk metadata for merging

**Merging Algorithm:**
1. Collect all entities from all chunks
2. Deduplicate entities by name (case-insensitive)
3. Merge attributes from duplicate entities
4. Keep highest confidence score
5. Combine source contexts
6. Deduplicate relationships by (from, to, type)
7. Merge relationship attributes

### 5. Confidence Scoring Service

**Location:** `lib/services/confidence-scoring.ts`

**Purpose:** Calculate and manage confidence scores

**Interface:**
```typescript
interface ConfidenceScoring {
  calculateQualityScore(result: ExtractionResult): number
  filterByConfidence(
    result: ExtractionResult,
    minConfidence: number
  ): ExtractionResult
  getConfidenceDistribution(
    result: ExtractionResult
  ): ConfidenceDistribution
}

interface ConfidenceDistribution {
  high: number  // >= 0.8
  medium: number  // 0.6 - 0.8
  low: number  // < 0.6
}
```

**Quality Score Calculation:**
```
qualityScore = (
  averageConfidence * 0.5 +
  (1 - lowConfidenceRatio) * 0.3 +
  completenessScore * 0.2
) * 100
```

### 6. Enhanced AI Integration

**Location:** `lib/services/ai-integration.ts` (enhanced)

**New Methods:**
```typescript
interface EnhancedAIIntegration extends AIIntegrationService {
  analyzeWithTemplate(
    text: string,
    template: ExtractionTemplate,
    options?: AnalysisOptions
  ): Promise<AIAnalysisResult>
  
  analyzeChunk(
    chunk: DocumentChunk,
    template: ExtractionTemplate,
    previousEntities?: string[]
  ): Promise<AIAnalysisResult>
}

interface AnalysisOptions {
  includeConfidence: boolean
  includeReasoning: boolean
  temperature: number
}
```

**Enhanced Prompt Structure:**
```typescript
function buildTemplatePrompt(
  template: ExtractionTemplate,
  text: string,
  options: AnalysisOptions
): string {
  return `
You are an expert at extracting structured information from ${template.domain} documents.

ENTITY TYPES TO EXTRACT:
${template.entityTypes.map(formatEntityType).join('\n')}

RELATIONSHIP TYPES TO EXTRACT:
${template.relationshipTypes.map(formatRelationType).join('\n')}

INSTRUCTIONS:
${template.promptInstructions}

EXAMPLES:
${template.examples?.map(formatExample).join('\n\n')}

DOCUMENT TEXT:
${text}

Extract entities and relationships following the schema above.
${options.includeConfidence ? 'Include confidence scores (0-1) for each extraction.' : ''}
${options.includeReasoning ? 'Include brief reasoning for each extraction.' : ''}

Return JSON in this format:
{
  "entities": [
    {
      "name": "entity name",
      "type": "entity type from schema",
      "attributes": { ... },
      "confidence": 0.95,
      "reasoning": "brief explanation"
    }
  ],
  "relationships": [
    {
      "from": "source entity name",
      "to": "target entity name",
      "type": "relationship type from schema",
      "attributes": { ... },
      "confidence": 0.90,
      "reasoning": "brief explanation"
    }
  ]
}
`;
}
```

## API Endpoints

### POST /api/extract/analyze

**Purpose:** Analyze a single document with template

**Request:**
```typescript
{
  file: File
  templateId: string
  projectId?: string
  graphId?: string
  options?: {
    includeConfidence: boolean
    minConfidence: number
    chunkSize: number
  }
}
```

**Response:**
```typescript
{
  success: boolean
  result: ExtractionResult
  preview: {
    nodes: Node[]
    edges: Edge[]
  }
}
```

### POST /api/extract/batch

**Purpose:** Analyze multiple documents

**Request:**
```typescript
{
  files: File[]
  templateId: string
  projectId?: string
  graphId?: string
}
```

**Response:**
```typescript
{
  success: boolean
  results: BatchExtractionResult
  summary: {
    totalDocuments: number
    totalEntities: number
    totalRelationships: number
    averageQuality: number
  }
}
```

### GET /api/extract/templates

**Purpose:** Get available extraction templates

**Response:**
```typescript
{
  templates: ExtractionTemplate[]
}
```

### POST /api/extract/templates

**Purpose:** Create custom extraction template

**Request:**
```typescript
{
  template: ExtractionTemplate
}
```

## UI Components

### 1. DocumentUploadComponent

**Location:** `components/DocumentUpload.tsx`

**Features:**
- Drag-and-drop file upload
- Multi-file selection
- File type validation
- File size validation
- Upload progress indicator
- File preview (name, size, type)

### 2. TemplateSelector

**Location:** `components/TemplateSelector.tsx`

**Features:**
- Dropdown of predefined templates
- Template description display
- Custom template creation button
- Template preview (entity types, relationship types)

### 3. ExtractionProgressModal

**Location:** `components/ExtractionProgressModal.tsx`

**Features:**
- Real-time progress updates
- Chunk processing status
- Current document indicator (for batch)
- Cancel button
- Estimated time remaining

### 4. ConfidenceViewer

**Location:** `components/ConfidenceViewer.tsx`

**Features:**
- Color-coded confidence indicators
- Confidence distribution chart
- Filter by confidence level
- Highlight low-confidence items
- Confidence score tooltips

### 5. Enhanced Preview Modal

**Location:** `components/EnhancedPreviewModal.tsx` (extends AIPreviewModal)

**New Features:**
- Source attribution display
- Confidence indicators on nodes/edges
- Filter by confidence
- Quality metrics panel
- Batch processing summary
- Document source tabs (for batch)

## Data Flow

### Single Document Extraction Flow

```
1. User uploads document
   ↓
2. DocumentParserService parses file
   ↓
3. ChunkingService splits into chunks (if needed)
   ↓
4. For each chunk:
   a. EnhancedExtractionService calls AI with template
   b. AI returns entities and relationships with confidence
   c. Results stored temporarily
   ↓
5. ChunkingService merges chunk results
   ↓
6. DuplicateDetectionService checks against existing graph
   ↓
7. Preview modal displays results with confidence
   ↓
8. User reviews and approves
   ↓
9. Data saved to database with source attribution
```

### Batch Processing Flow

```
1. User uploads multiple documents
   ↓
2. For each document (sequential):
   a. Parse document
   b. Extract entities/relationships
   c. Accumulate results
   ↓
3. Merge entities across all documents
   ↓
4. Deduplicate and consolidate
   ↓
5. Check against existing graph
   ↓
6. Display combined preview
   ↓
7. User reviews and approves
   ↓
8. Save all data with source attribution
```

## Database Schema Extensions

### Node Table (existing, add columns)

```prisma
model Node {
  // ... existing fields ...
  
  // New fields for enhanced extraction
  confidence      Float?
  sourceDocument  String?
  sourceContext   String?  @db.Text
  sourcePages     Int[]
  extractedAt     DateTime?
  
  // ... existing relations ...
}
```

### Edge Table (existing, add columns)

```prisma
model Edge {
  // ... existing fields ...
  
  // New fields for enhanced extraction
  confidence      Float?
  sourceDocument  String?
  sourceContext   String?  @db.Text
  extractedAt     DateTime?
  
  // ... existing relations ...
}
```

### New ExtractionTemplate Table

```prisma
model ExtractionTemplate {
  id              String   @id @default(cuid())
  name            String
  domain          String
  isCustom        Boolean  @default(false)
  userId          String?
  definition      Json     // Stores template structure
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([domain])
}
```

### New ExtractionJob Table (optional, for tracking)

```prisma
model ExtractionJob {
  id              String   @id @default(cuid())
  userId          String?
  templateId      String
  documentCount   Int
  status          String   // pending, processing, completed, failed
  progress        Float    @default(0)
  result          Json?
  error           String?
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  @@index([userId])
  @@index([status])
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
1. Implement DocumentParserService
2. Implement ChunkingService
3. Implement TemplateService with predefined templates
4. Create database migrations

### Phase 2: Enhanced Extraction (Week 3-4)
5. Enhance AIIntegrationService with template support
6. Implement EnhancedExtractionService
7. Implement ConfidenceScoring
8. Create API endpoints

### Phase 3: UI Components (Week 5-6)
9. Create DocumentUploadComponent
10. Create TemplateSelector
11. Enhance PreviewModal with confidence display
12. Create ExtractionProgressModal

### Phase 4: Advanced Features (Week 7-8)
13. Implement batch processing
14. Implement source attribution
15. Implement custom template creation
16. Add quality metrics and reporting

### Phase 5: Testing & Optimization (Week 9-10)
17. Unit tests for all services
18. Integration tests for extraction flow
19. Performance optimization
20. User acceptance testing

## Testing Strategy

### Unit Tests
- DocumentParserService: Test each format parser
- ChunkingService: Test chunking and merging logic
- TemplateService: Test template validation
- ConfidenceScoring: Test score calculations

### Integration Tests
- End-to-end extraction flow
- Batch processing
- Database persistence
- API endpoints

### Property-Based Tests
- Chunking preserves all text
- Merging doesn't lose entities
- Confidence scores are in valid range
- Source attribution is complete

## Performance Considerations

### Optimization Strategies
1. **Caching:** Cache parsed documents in memory
2. **Streaming:** Use streaming for large file uploads
3. **Parallel Processing:** Process independent chunks in parallel (respecting rate limits)
4. **Lazy Loading:** Load preview data incrementally
5. **Debouncing:** Debounce user interactions during extraction

### Resource Limits
- Max file size: 10MB
- Max batch size: 10 files
- Max chunk size: 3000 tokens
- Timeout: 60 seconds per chunk
- Rate limit: 10 requests/minute to AI API

## Security Considerations

1. **File Validation:** Validate file types and sizes before processing
2. **Content Sanitization:** Sanitize extracted text to prevent XSS
3. **API Key Protection:** Never expose API keys in client code
4. **Access Control:** Verify user permissions for projects/graphs
5. **Data Privacy:** Don't log sensitive document content
6. **Rate Limiting:** Implement rate limiting to prevent abuse

## Correctness Properties

### Property 1: Text Preservation
**Statement:** All text from the original document must be present in the parsed output or chunks.

**Validation:** Sum of all chunk texts equals original document text (ignoring whitespace normalization).

### Property 2: Entity Consistency
**Statement:** When an entity appears in multiple chunks, it must be merged into a single entity in the final result.

**Validation:** No duplicate entity names in final result (case-insensitive).

### Property 3: Relationship Validity
**Statement:** All relationships must reference entities that exist in the entity list.

**Validation:** For each relationship, both `from` and `to` must match an entity name.

### Property 4: Confidence Range
**Statement:** All confidence scores must be between 0 and 1 inclusive.

**Validation:** `0 <= confidence <= 1` for all entities and relationships.

### Property 5: Source Attribution Completeness
**Statement:** Every extracted entity and relationship must have source attribution.

**Validation:** All entities and relationships have non-empty `sourceDocument` and `sourceContext`.

### Property 6: Template Compliance
**Statement:** Extracted entity types must match the template's defined entity types.

**Validation:** All entity types are in the template's `entityTypes` list.

### Property 7: Chunk Overlap Consistency
**Statement:** Overlapping chunks must produce consistent entity extractions.

**Validation:** Entities mentioned in overlap regions appear in both chunks or are properly merged.

## Error Handling

### Error Categories
1. **File Parsing Errors:** Invalid format, corrupted file, unsupported encoding
2. **AI API Errors:** Rate limit, timeout, invalid response, API down
3. **Validation Errors:** Invalid template, missing required fields
4. **Database Errors:** Connection failure, constraint violation
5. **Business Logic Errors:** Duplicate detection failure, merge conflict

### Error Recovery Strategies
1. **Retry with Backoff:** For transient API errors
2. **Fallback Parsing:** Try alternative parsers if primary fails
3. **Partial Results:** Save successfully processed chunks even if some fail
4. **User Notification:** Clear error messages with actionable steps
5. **Logging:** Comprehensive error logging for debugging

## Future Enhancements

1. **OCR Support:** Extract text from images in PDFs
2. **Multi-language Support:** Extract from non-English documents
3. **Real-time Collaboration:** Multiple users editing extraction results
4. **ML-based Deduplication:** Use embeddings for smarter duplicate detection
5. **Automated Template Generation:** Learn templates from user corrections
6. **Export Formats:** Export to RDF, GraphML, Cypher
7. **Visualization Enhancements:** Interactive confidence heatmaps
8. **API Webhooks:** Notify external systems when extraction completes
