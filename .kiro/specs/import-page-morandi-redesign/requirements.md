# Requirements Document

## Introduction

This document specifies the requirements for redesigning the import data page UI with a Morandi green color palette and ink wash aesthetic (水墨风格). The redesign focuses exclusively on visual styling while preserving all existing functionality including project/graph management, file upload, template downloads, and import workflows.

## Glossary

- **Import_Page**: The web page located at `/app/import/page.tsx` that handles data import functionality
- **Morandi_Green_Palette**: A muted, elegant color scheme featuring soft greens, sky blue (天青色), and dark green (黛绿色)
- **Ink_Wash_Style**: Traditional Chinese painting aesthetic (水墨风格) characterized by subtle gradients, soft edges, and artistic touches
- **File_Type_Icon**: Visual representation for Excel, CSV, and JSON file formats provided by the user
- **Download_Icon**: Visual representation for template download functionality provided by the user
- **UI_Component**: Any visual element including navigation bar, cards, buttons, modals, and input fields
- **Functional_Behavior**: The operational logic including API calls, state management, and user interactions that must remain unchanged

## Requirements

### Requirement 1: Morandi Green Color Palette Application

**User Story:** As a user, I want the import page to use a Morandi green color palette, so that the interface has an elegant, calming aesthetic.

#### Acceptance Criteria

1. THE Import_Page SHALL use sky blue (天青色, #87CEEB or similar muted tone) as a primary accent color
2. THE Import_Page SHALL use dark green (黛绿色, #2F4F4F or similar muted tone) as a secondary accent color
3. THE Import_Page SHALL use Morandi green tones (#8B9D83, #A8B5A0, or similar muted greens) for backgrounds and borders
4. THE Import_Page SHALL replace the current teal color (#00bfa5) with Morandi green palette colors throughout all UI_Components
5. WHEN a user hovers over interactive elements, THE Import_Page SHALL display hover states using colors from the Morandi_Green_Palette
6. THE Import_Page SHALL use soft, muted tones that avoid high saturation or brightness

### Requirement 2: Ink Wash Aesthetic Styling

**User Story:** As a user, I want the import page to have an ink wash aesthetic, so that the interface feels artistic and culturally inspired.

#### Acceptance Criteria

1. THE Import_Page SHALL apply subtle gradient effects reminiscent of ink wash paintings to background elements
2. THE Import_Page SHALL use soft shadows and blurred edges instead of hard borders where appropriate
3. THE Import_Page SHALL incorporate semi-transparent overlays to create depth and layering effects
4. WHEN displaying cards or panels, THE Import_Page SHALL use soft, rounded corners with subtle shadow effects
5. THE Import_Page SHALL maintain a clean, minimalist layout that emphasizes negative space
6. THE Import_Page SHALL use typography that complements the artistic aesthetic without sacrificing readability

### Requirement 3: Custom Icon Integration

**User Story:** As a user, I want to see custom icons for file types and downloads, so that the interface is visually cohesive with the new design style.

#### Acceptance Criteria

1. THE Import_Page SHALL display the user-provided Excel icon for Excel file type selection
2. THE Import_Page SHALL display the user-provided CSV icon for CSV file type selection
3. THE Import_Page SHALL display the user-provided JSON icon for JSON file type selection
4. THE Import_Page SHALL display the user-provided download icon for all template download buttons
5. WHEN a File_Type_Icon is displayed, THE Import_Page SHALL ensure proper sizing and alignment within its container
6. THE Import_Page SHALL apply appropriate color filters or styling to icons to match the Morandi_Green_Palette

### Requirement 4: Navigation Bar Redesign

**User Story:** As a user, I want the navigation bar to match the new design style, so that the page has a consistent visual identity.

#### Acceptance Criteria

1. THE Import_Page SHALL style the navigation bar background using colors from the Morandi_Green_Palette
2. THE Import_Page SHALL update the logo/brand element to use Morandi green tones instead of teal
3. THE Import_Page SHALL apply ink wash styling effects to the navigation bar including subtle gradients or shadows
4. THE Import_Page SHALL maintain the navigation bar's layout and positioning
5. THE Import_Page SHALL preserve all navigation functionality including any links or interactive elements

### Requirement 5: Project and Graph Selection Redesign

**User Story:** As a user, I want the project and graph selection controls to match the new design style, so that the interface is visually harmonious.

#### Acceptance Criteria

1. THE Import_Page SHALL style dropdown selectors using Morandi_Green_Palette colors for borders and backgrounds
2. THE Import_Page SHALL style the "新建" (New) buttons using Morandi green tones instead of teal
3. WHEN a user hovers over selection controls, THE Import_Page SHALL display hover effects using Morandi_Green_Palette colors
4. THE Import_Page SHALL apply soft shadows and rounded corners consistent with the Ink_Wash_Style
5. THE Import_Page SHALL preserve all selection functionality including dropdown behavior and button actions

### Requirement 6: File Upload Area Redesign

**User Story:** As a user, I want the file upload area to match the new design style, so that file selection is visually appealing.

#### Acceptance Criteria

1. THE Import_Page SHALL display file type cards (Excel, CSV, JSON) with Morandi_Green_Palette borders and backgrounds
2. WHEN a file type is selected, THE Import_Page SHALL highlight it using a Morandi green accent color
3. THE Import_Page SHALL display File_Type_Icons within each file type card
4. THE Import_Page SHALL apply Ink_Wash_Style effects including soft shadows and subtle gradients to file type cards
5. WHEN a user hovers over a file type card, THE Import_Page SHALL display hover effects using Morandi_Green_Palette colors
6. THE Import_Page SHALL preserve all file selection functionality including drag-and-drop behavior

### Requirement 7: Template Download Section Redesign

**User Story:** As a user, I want the template download section to match the new design style, so that downloading templates is visually consistent.

#### Acceptance Criteria

1. THE Import_Page SHALL style template download buttons using Morandi_Green_Palette colors
2. THE Import_Page SHALL display the Download_Icon on each template download button
3. WHEN a user hovers over a download button, THE Import_Page SHALL display hover effects using Morandi_Green_Palette colors
4. THE Import_Page SHALL apply Ink_Wash_Style effects to the template download section including soft shadows
5. THE Import_Page SHALL preserve all download functionality for Excel, CSV, and JSON templates

### Requirement 8: Generate Button Redesign

**User Story:** As a user, I want the generate button to match the new design style, so that the primary action is visually prominent yet harmonious.

#### Acceptance Criteria

1. THE Import_Page SHALL style the "生成图谱" (Generate Graph) button using a prominent Morandi green tone
2. WHEN the button is disabled, THE Import_Page SHALL display it in a muted gray that complements the Morandi_Green_Palette
3. WHEN a user hovers over the enabled button, THE Import_Page SHALL display a hover effect using a slightly lighter or darker Morandi green
4. THE Import_Page SHALL apply Ink_Wash_Style effects including soft shadows and rounded corners to the button
5. THE Import_Page SHALL preserve all button functionality including enabled/disabled states and click behavior

### Requirement 9: Modal Dialog Redesign

**User Story:** As a user, I want all modal dialogs to match the new design style, so that the entire user experience is visually cohesive.

#### Acceptance Criteria

1. THE Import_Page SHALL style all modal dialogs (new project, new graph, confirm, loading) using Morandi_Green_Palette colors
2. THE Import_Page SHALL apply Ink_Wash_Style effects to modal backgrounds including subtle gradients and soft shadows
3. THE Import_Page SHALL style modal buttons using Morandi green tones for primary actions
4. THE Import_Page SHALL style modal input fields and text areas using Morandi_Green_Palette borders
5. WHEN displaying the loading modal, THE Import_Page SHALL style the loading spinner using Morandi green colors
6. THE Import_Page SHALL preserve all modal functionality including open/close behavior and form submissions

### Requirement 10: Import Statistics Display Redesign

**User Story:** As a user, I want the import statistics display to match the new design style, so that data visualization is aesthetically pleasing.

#### Acceptance Criteria

1. THE Import_Page SHALL style statistics cards using Morandi_Green_Palette colors for backgrounds and borders
2. THE Import_Page SHALL use Morandi green tones for success indicators (imported nodes/edges)
3. THE Import_Page SHALL use muted yellow or amber tones that complement the Morandi_Green_Palette for warning indicators (duplicate nodes/edges)
4. THE Import_Page SHALL apply Ink_Wash_Style effects to statistics cards including soft shadows and subtle gradients
5. THE Import_Page SHALL preserve all statistics display functionality including data formatting and layout

### Requirement 11: Status Message Redesign

**User Story:** As a user, I want status messages to match the new design style, so that feedback is visually consistent.

#### Acceptance Criteria

1. THE Import_Page SHALL style success messages using a muted green from the Morandi_Green_Palette
2. THE Import_Page SHALL style error messages using a muted red or pink that complements the Morandi_Green_Palette
3. THE Import_Page SHALL style warning messages using a muted yellow or amber that complements the Morandi_Green_Palette
4. THE Import_Page SHALL apply Ink_Wash_Style effects to message containers including soft shadows and rounded corners
5. THE Import_Page SHALL preserve all message display functionality including timing and content

### Requirement 12: Functional Preservation

**User Story:** As a developer, I want all existing functionality to remain unchanged, so that the redesign does not introduce bugs or regressions.

#### Acceptance Criteria

1. THE Import_Page SHALL preserve all API calls including project fetching, graph fetching, project creation, graph creation, and file import
2. THE Import_Page SHALL preserve all state management including selected project, selected graph, selected file, and upload status
3. THE Import_Page SHALL preserve all user interactions including dropdown selection, button clicks, file selection, and modal interactions
4. THE Import_Page SHALL preserve all navigation behavior including routing to the graph page after successful import
5. THE Import_Page SHALL preserve all validation logic including file type checking and required field validation
6. THE Import_Page SHALL preserve all error handling including network errors, validation errors, and user cancellation
7. WHEN the redesign is complete, THE Import_Page SHALL pass all existing functional tests without modification
8. THE Import_Page SHALL maintain the same component structure and React hooks usage to minimize code changes
