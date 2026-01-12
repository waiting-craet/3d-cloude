# Requirements Document

## Introduction

This document specifies the requirements for the workflow canvas node connection feature. The system allows users to create visual connections between nodes by dragging from one node's connection point to another node's connection point.

## Glossary

- **Connection_Point**: A circular button on the left or right side of a node that users can click and drag to create connections
- **Connection_Line**: A visual curved line (Bezier curve) that connects two nodes
- **Drag_Preview_Line**: A temporary dashed line shown while dragging from a connection point
- **Canvas**: The main workspace area where nodes and connections are displayed
- **Node**: A rectangular card element that can be connected to other nodes

## Requirements

### Requirement 1: Connection Point Interaction

**User Story:** As a user, I want to click and drag from a connection point to create connections between nodes, so that I can visualize relationships in my workflow.

#### Acceptance Criteria

1. WHEN a user clicks on a connection point, THE System SHALL initiate connection dragging mode
2. WHEN connection dragging mode is active, THE System SHALL prevent other interactions (canvas panning, node dragging)
3. WHEN the user releases the mouse button, THE System SHALL exit connection dragging mode
4. WHEN a connection point is clicked, THE System SHALL record the source node ID

### Requirement 2: Visual Feedback During Dragging

**User Story:** As a user, I want to see a visual line following my cursor while dragging a connection, so that I understand what I'm doing.

#### Acceptance Criteria

1. WHEN connection dragging mode is active, THE System SHALL display a dashed preview line from the source connection point to the current mouse position
2. WHEN the mouse moves during connection dragging, THE System SHALL update the preview line endpoint to follow the cursor
3. WHEN the mouse hovers near a valid target connection point, THE System SHALL highlight that connection point with a green color and scale effect
4. WHEN the mouse moves away from a connection point, THE System SHALL remove the highlight effect
5. WHEN connection dragging ends, THE System SHALL remove the preview line

### Requirement 3: Connection Creation

**User Story:** As a user, I want to complete a connection by releasing the mouse over another node's connection point, so that I can link nodes together.

#### Acceptance Criteria

1. WHEN the user releases the mouse while hovering over a valid target node, THE System SHALL create a new connection between the source and target nodes
2. WHEN a connection is created, THE System SHALL prevent duplicate connections between the same two nodes
3. WHEN a connection is created, THE System SHALL prevent self-connections (a node connecting to itself)
4. WHEN a connection is created, THE System SHALL assign a unique ID to the connection
5. WHEN the user releases the mouse not over a valid target, THE System SHALL cancel the connection attempt without creating a connection

### Requirement 4: Connection Rendering

**User Story:** As a user, I want to see smooth curved lines connecting my nodes, so that the workflow is visually clear and professional.

#### Acceptance Criteria

1. WHEN nodes are connected, THE System SHALL render a blue Bezier curve from the source node's right edge to the target node's left edge
2. WHEN a connection line is rendered, THE System SHALL include an arrowhead at the target end
3. WHEN nodes are moved, THE System SHALL update all connected lines in real-time to maintain accurate connections
4. WHEN the canvas is zoomed or panned, THE System SHALL maintain correct line positioning relative to nodes

### Requirement 5: Connection Point Hover Detection

**User Story:** As a user, I want the system to detect when I'm near a connection point during dragging, so that I can easily complete connections.

#### Acceptance Criteria

1. WHEN the mouse is within 30 pixels of a connection point during dragging, THE System SHALL consider that connection point as hovered
2. WHEN calculating hover distance, THE System SHALL check both left and right connection points of all nodes
3. WHEN multiple connection points are within range, THE System SHALL select the closest one
4. WHEN the source node's connection points are within range, THE System SHALL ignore them (cannot connect to self)

### Requirement 6: State Management

**User Story:** As a system, I want to properly manage connection state, so that the UI remains consistent and responsive.

#### Acceptance Criteria

1. WHEN connection dragging starts, THE System SHALL set isDraggingConnection to true
2. WHEN connection dragging starts, THE System SHALL store the source node ID in connectingFrom
3. WHEN connection dragging ends, THE System SHALL reset isDraggingConnection to false
4. WHEN connection dragging ends, THE System SHALL clear the connectingFrom state
5. WHEN connection dragging ends, THE System SHALL clear the hoveredNode state
