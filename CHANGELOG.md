# Changelog

## [0.2.5] - 2025-03-07
### Added
- **Dashboard Tooltips:** Added descriptive tooltips (using `title` attributes) to many dashboard elements, including:
  - Navigation buttons in the main header.
  - Task creation form inputs (title, description, color selector), checkboxes (Private Task and Locked Task), co-owner picklist, and the Add Task button.
  - Action buttons, edit icons, comments, and history elements in task cards.
  
### Changed
- **Card Action Buttons:** Modified the Card component so that action buttons are rendered only if the task is not locked or if the user is the owner or a co-owner.
- **Task Editing:** Updated the task description edit functionality to allow both owners and co-owners to edit the task description (when the task is not marked as Done). The tooltips have been updated accordingly.

### Fixed
- Improved user experience by hiding action buttons for locked tasks from non-authorized users while allowing co-owners full access.

## [0.2.4] - 2025-03-06
### Added
- **Changelog Page Enhancements:** The Changelog page now renders markdown using `react-markdown`, and a new backend endpoint (`/other/changelog`) serves the raw changelog file.
- **Dark Mode Markdown Styling:** Added dark mode overrides in the markdown styling (in markdown.css) so that headings, paragraphs, inline code, code blocks, and blockquotes display appropriately on dark backgrounds.

### Fixed
- **Spacing & Typography:** Resolved spacing issues in the Story Feed and improved typography using a refined font (Roboto) with adjusted font sizes, weights, and margins.
  
### Improved
- **Header Redesign:** Updated the header to display “TaskFable” with a fancy gradient background and the current version (from config.js) in smaller text.
- **CSS Modularization:** Refactored a large stylesheet into multiple files (base.css, layout.css, components.css, themes.css, notifications.css, markdown.css) for better maintainability and theming.

## [0.2.3] - 2025-03-05
### Added
- Added a `/server/timezone` endpoint to return the server’s local UTC offset.
- If a user has no timezone set, the app now automatically fetches and stores the server’s timezone.

### Changed
- Timestamps in the Story Feed and Task Cards now update dynamically when the timezone is changed, using `moment.utc(...).tz(user.timezone)` and a 24-hour format.
- The SettingsPage timezone picklist now uses custom react‑select styling that exactly matches the co‑owner picklist in dark mode. It is restricted to a fixed maximum width (250px) so that it appears as a one‑line dropdown with proper spacing.
- Text inputs, textareas, and selects (as well as checkboxes via the `accent-color` property) are now styled for dark mode, eliminating bright white backgrounds.

### Fixed
- Fixed the bug where updating the timezone did not trigger a refresh of tasks/stories, ensuring that all displayed timestamps update immediately.
- Notifications now fade out smoothly before removal.

## [0.2.2] - 2025-03-01
### Improved
- Converted edit icons for descriptions/comments into small pencil icons.
- Adjusted dark mode React-Select styling to reduce overly bright text in the co-owner picklist.
- Used a darker red color for buttons in dark mode (instead of bright blue).
- Tweaked button spacing/padding to avoid oversized or crammed appearance.
- Constrained the comment field within the card width to prevent overflow.

## [0.2.1] - 2025-02-28
### Fixed
- Reordered endpoints to resolve routing conflicts between `/tasks/comment/edit` and dynamic `/tasks/{task_id}/edit`.
- Updated the comment editing endpoint to require and validate a `task_id`, ensuring the correct comment is modified.

### Improved
- Replaced the co-owner picklist checkboxes with a sleek multi-select dropdown using `react-select`.
- Enhanced the create-task form with inline styling for a modern, consistent look.

## [0.2.0] - 2025-02-27
### Added
- **Locked Card Behavior:** Tasks automatically lock when marked as "Done", preventing non-owners from making modifications.
- **Complete Timezone List:** Updated settings to include a full list of IANA time zones.

### Fixed
- **Comment Editing Endpoint:** Resolved the 422 Unprocessable Entity error on PUT `/tasks/comment/edit` by reviewing input validation and adding additional logging.
- **Co-owner Picklist Endpoint:** Reordered routes in the users router so that GET `/users/all` correctly returns all usernames (avoiding conflict with GET `/{username}`).

### Improved
- **Logging:** Enhanced logging across the backend and frontend to capture more detailed debugging information.

## [0.1.0] - (Previous Version)
- Initial release of TaskFable.
