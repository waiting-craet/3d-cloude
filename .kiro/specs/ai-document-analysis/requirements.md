# Requirements Document

## Introduction

This document specifies the requirements for an AI-powered document analysis feature that extracts entities and relationships from uploaded documents and generates interactive knowledge graphs. The system integrates with an external AI model API to perform natural language processing and entity extraction, then visualizes the results as 2D or 3D knowledge graphs with intelligent duplicate detection and conflict resolution capabilities.

## Glossary

- **AI_Model_API**: External API service that analyzes document text and extracts structured entity and relationship data
- **Knowledge_Graph**: A structured representation of information consisting of nodes (entities) and edges (relationships)
- **Node**: An entity in the knowledge graph representing a concept, person, place, or thing
- **Edge**: A relationship between two nodes in the knowledge graph
- **Project**: A container for multiple related knowledge graphs
- **Graph**: A specific knowledge graph instance within a project
- **Document**: Text content uploaded by users for AI analysis
- **Entity**: A distinct object or concept extracted from document text
- **Relationship**: A connection or association between two entities
- **Duplicate_Node**: A node that represents the same entity as an existing node in the graph
- **Property_Conflict**: A situation where duplicate nodes have different values for the same property
- **Preview_Modal**: A dialog interface that displays AI-generated graph data before saving
- **Database**: PostgreSQL database managed by Prisma ORM storing projects, graphs, nodes, and edges

## Requirements

### Requirement 1: AI Document Analysis Integration

**User Story:** As a user, I want to upload document text and have it analyzed by AI, so that I can automatically extract entities and relationships without manual effort.

#### Acceptance Criteria

1. WHEN a user provides document text for analysis, THE AI_Model_API SHALL process the text and return structured entity data
2. WHEN the AI_Model_API processes a document, THE System SHALL extract nodes with labels and properties
3. WHEN the AI_Model_API processes a document, THE System SHALL extract edges with relationship types and labels
4. WHEN the AI analysis is in progress, THE System SHALL display a loading state to the user
5. IF the AI_Model_API returns an error, THEN THE System SHALL display a descriptive error message to the user
6. THE System SHALL use the API key "sk-ace40498292242fbbb272d2cb7d8fee7" for authentication with the AI_Model_API

### Requirement 2: Graph Visualization Options

**User Story:** As a user, I want to choose between 2D and 3D graph visualizations, so that I can view my knowledge graph in the format that best suits my needs.

#### Acceptance Criteria

1. WHEN a user initiates AI analysis, THE System SHALL provide options to generate a 2D or 3D graph
2. WHEN a user selects 2D visualization, THE System SHALL generate graph data compatible with 2D rendering components
3. WHEN a user selects 3D visualization, THE System SHALL generate graph data compatible with 3D rendering components
4. THE System SHALL preserve the user's visualization preference for the current session

### Requirement 3: Project and Graph Selection

**User Story:** As a user, I want to select an existing project and graph or create new ones, so that I can organize my knowledge graphs and add AI-generated content to existing work.

#### Acceptance Criteria

1. WHEN a user accesses the AI analysis feature, THE System SHALL display a dropdown of existing projects from the Database
2. WHEN a user selects a project, THE System SHALL display a dropdown of graphs belonging to that project
3. WHEN a user selects "Create New Project", THE System SHALL allow the user to specify a new project name
4. WHEN a user selects "Create New Graph", THE System SHALL allow the user to specify a new graph name
5. THE System SHALL fetch project data from the Database using the configured DATABASE_URL
6. WHEN no projects exist, THE System SHALL display an option to create the first project

### Requirement 4: Preview and Edit Modal

**User Story:** As a user, I want to preview and edit the AI-generated graph before saving, so that I can correct errors and refine the extracted information.

#### Acceptance Criteria

1. WHEN AI analysis completes, THE System SHALL display a Preview_Modal showing the generated graph structure
2. WHEN the Preview_Modal is displayed, THE System SHALL render a visual representation of nodes and edges
3. WHEN a user clicks on a node in the Preview_Modal, THE System SHALL allow editing of the node's label and properties
4. WHEN a user clicks on an edge in the Preview_Modal, THE System SHALL allow editing of the edge's relationship type and label
5. WHEN a user clicks "Save" in the Preview_Modal, THE System SHALL proceed to save the graph data
6. WHEN a user clicks "Cancel" in the Preview_Modal, THE System SHALL discard the AI-generated data and close the modal
7. THE Preview_Modal SHALL display the total count of nodes and edges

### Requirement 5: Duplicate Node Detection

**User Story:** As a user, I want the system to detect duplicate nodes when adding to an existing graph, so that I don't create redundant entities.

#### Acceptance Criteria

1. WHEN adding AI-generated nodes to an existing graph, THE System SHALL compare each new node against existing nodes
2. WHEN comparing nodes, THE System SHALL consider nodes with identical labels as potential duplicates
3. WHEN comparing nodes, THE System SHALL use case-insensitive string matching for node labels
4. WHEN a potential Duplicate_Node is detected, THE System SHALL flag it for review
5. THE System SHALL detect duplicates before presenting the Preview_Modal to the user

### Requirement 6: Redundant Edge Detection

**User Story:** As a user, I want the system to detect redundant relationships when adding to an existing graph, so that I don't create duplicate connections.

#### Acceptance Criteria

1. WHEN adding AI-generated edges to an existing graph, THE System SHALL compare each new edge against existing edges
2. WHEN comparing edges, THE System SHALL consider edges with the same source node, target node, and relationship type as redundant
3. WHEN a redundant edge is detected, THE System SHALL flag it for review
4. THE System SHALL detect redundant edges before presenting the Preview_Modal to the user

### Requirement 7: Property Conflict Detection

**User Story:** As a user, I want to be notified when duplicate nodes have conflicting properties, so that I can resolve inconsistencies in my data.

#### Acceptance Criteria

1. WHEN a Duplicate_Node is detected, THE System SHALL compare properties between the new node and existing node
2. WHEN properties have different values for the same property key, THE System SHALL identify a Property_Conflict
3. WHEN a Property_Conflict is detected, THE System SHALL present both values to the user in the Preview_Modal
4. THE System SHALL highlight conflicting properties visually in the Preview_Modal

### Requirement 8: Data Merging and Conflict Resolution

**User Story:** As a user, I want to merge duplicate nodes and resolve conflicts, so that I can maintain a clean and accurate knowledge graph.

#### Acceptance Criteria

1. WHEN a user confirms merging a Duplicate_Node, THE System SHALL combine the new node with the existing node
2. WHEN merging nodes with Property_Conflict, THE System SHALL allow the user to choose which property value to keep
3. WHEN merging nodes, THE System SHALL preserve all unique properties from both nodes
4. WHEN merging nodes, THE System SHALL update all edges that reference the duplicate node to reference the merged node
5. WHEN redundant edges are detected, THE System SHALL combine them into a single edge
6. THE System SHALL maintain referential integrity during merge operations

### Requirement 9: Database Persistence

**User Story:** As a user, I want my AI-generated graphs to be saved to the database, so that I can access them later and share them with others.

#### Acceptance Criteria

1. WHEN a user saves a new graph, THE System SHALL create a new Graph record in the Database
2. WHEN a user saves nodes, THE System SHALL create Node records associated with the Graph
3. WHEN a user saves edges, THE System SHALL create Edge records associated with the Graph
4. WHEN adding to an existing graph, THE System SHALL append new nodes and edges to the existing Graph record
5. THE System SHALL use the DATABASE_URL "postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" for database connections
6. THE System SHALL use Prisma ORM for all database operations
7. WHEN database operations fail, THE System SHALL rollback partial changes and display an error message

### Requirement 10: Text Page Integration

**User Story:** As a user, I want to access the AI analysis feature from the text page, so that I can analyze documents within my existing workflow.

#### Acceptance Criteria

1. THE System SHALL modify the existing text page at "app/text-page/page.tsx"
2. WHEN a user is on the text page, THE System SHALL display an "Analyze with AI" button or trigger
3. WHEN a user clicks the AI analysis trigger, THE System SHALL display project and graph selection options
4. WHEN AI processing is in progress, THE System SHALL display a loading indicator on the text page
5. WHEN AI analysis completes, THE System SHALL display the Preview_Modal
6. THE text page SHALL integrate with the existing Project and Graph selection components

### Requirement 11: File Storage Integration

**User Story:** As a developer, I want to use Vercel Blob for file storage when needed, so that I can store large documents or media associated with graph nodes.

#### Acceptance Criteria

1. WHERE file storage is required, THE System SHALL use Vercel Blob storage
2. THE System SHALL authenticate with Vercel Blob using the token "vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs"
3. WHEN storing files, THE System SHALL return a URL reference that can be stored in the Database

### Requirement 12: Error Handling and Validation

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN the AI_Model_API is unavailable, THE System SHALL display a user-friendly error message
2. WHEN database operations fail, THE System SHALL display a descriptive error message
3. WHEN a user attempts to save without selecting a project, THE System SHALL display a validation error
4. WHEN a user attempts to save without selecting or creating a graph, THE System SHALL display a validation error
5. WHEN network requests fail, THE System SHALL provide retry options to the user
6. THE System SHALL log errors for debugging purposes without exposing sensitive information to users
