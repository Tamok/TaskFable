# Changelog

## [0.3.1] - 2025-03-11

### Added
- **Invitation Handling Enhancements:**
  - New endpoint (`/questlogs/invite/details`) added to return board details (name, owner, expiry, etc.) based on an invite token.
  - Implemented a new `InviteChoicePage` component that displays the board name, owner, and expiry information along with options to “Join” (upgrade membership) or “Spectate”.
- **Spectator Mode Enhancements:**
  - Spectators (users with a "spectator" role) can no longer create tasks, comment, or reorder/move cards.
  - Added a `SpectatorJoinButton` component to allow a spectator to upgrade their membership to a full member.
  - When in spectator mode, the filter bar is hidden and interactive elements (such as task creation forms and invite-generation controls) are omitted.
- **Dynamic Login/Invite Routing:**
  - Updated the login flow to preserve an invite token in the URL so that a logged‑in user is routed to the invite choice page instead of being forced to log in again.
- **Dark Mode Improvements:**
  - Updated CSS for inputs, buttons, invite panels, and the spectator join UI to meet dark theme standards.
- **Logging & Human‑Readable Activity Logs:**
  - Improved logging in both backend and frontend.
  - Activity logs now display human‑readable actions (e.g. "Invite Generated", "Invite Revoked") with proper timestamps.

### Changed
- Updated **App.js** to:
  - Check for an `invite_token` in the URL and render `InviteChoicePage` accordingly.
  - Pass down an `isSpectator` flag to child components.
  - Omit the CreateTaskForm and related interactive controls when the user is a spectator.
- Updated **Board.js**, **Column.js**, and **Card.js** to:
  - Accept and propagate an `isSpectator` prop.
  - Disable drag‑and‑drop, commenting, editing, and other interactive features when in spectator mode.
  - Hide the filter bar in spectator mode.
- Updated useEffect hooks to use functional state updates (e.g. in Board.js) to resolve ESLint dependency warnings.

### Fixed
- Resolved issues where spectators could still comment, edit, or move cards.
- Fixed login behavior so that clicking an invite link preserves the user’s login state rather than logging them out.
- Fixed CSS inconsistencies in dark mode for text inputs, buttons, and invite panels.
- Corrected ESLint warnings regarding missing dependencies in useEffect hooks.
- Fixed the persistent invite token issue to properly route logged‑in users to the invite choice view.

## [0.3.0] - 2025-03-10
### Added
- **Multi-Quest Log (QL) Support:**  
  - Ability to create and switch between multiple boards (Quest Logs) via a new Quest Log selector UI.  
  - The selector button now behaves as follows: clicking its main area navigates to the current QL dashboard, while clicking the dropdown arrow opens a list for switching QLs or creating a new one.
- **Backend Invite Functionality & Activity Logging:**  
  - Endpoints for generating unique invite links (with optional expiration) for Quest Logs have been implemented.  
  - Backend now logs user activities such as join, spectate, and invite link clicks.  
  - (Note: The UI for managing invites and viewing board activity subtabs is not implemented yet; this is planned for a future release.)
- **Dynamic Test Report Generation:**  
  - A new backend script (`backend/scripts/generate_test_report.py`) runs integration tests with JSON reporting enabled.  
  - A new frontend component (`TestReportDynamicPage`) dynamically fetches and displays the JSON test report in a well-formatted, expandable table with detailed views for each test.
- **FastAPI Lifespan Handler:**  
  - Replaced deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")` hooks with an async lifespan context manager.
- **SQLAlchemy Model Updates:**  
  - Updated the models to use `sqlalchemy.orm.declarative_base()` per SQLAlchemy 2.0 recommendations.  
  - Added cascade deletion on Quest Log relationships (e.g. tasks) to prevent orphaned records and NOT NULL constraint errors.

### Changed
- **File Path Adjustments:**  
  - Updated backend endpoints (e.g. for `/other/changelog` and `/logs/test_report`) to use absolute paths relative to the module’s location, ensuring consistency when running from the project root.
- **Frontend UI Enhancements:**  
  - Updated the Quest Log selector and expand/collapse buttons to match the styling of other dashboard buttons.
  - Enhanced the dynamic test report view with an expandable details card for each test, showing a nicely formatted summary of setup, call, teardown, and logs.
- **Integration Testing:**  
  - Improved integration tests to create isolated test data (new Quest Logs, tasks, etc.) and clean them up afterward.

### Fixed
- **Relative Import & Path Issues:**  
  - Fixed problems with relative linking by switching to absolute paths (using `os.path.abspath`) where necessary.
- **Database Cascade Issues:**  
  - Fixed database update errors (NOT NULL constraint) by configuring cascade deletion for Quest Log tasks.
- **Accurate Duration Reporting:**  
  - Updated the dynamic test report to compute total test duration by summing setup, call, and teardown durations rather than showing only a partial value.

### Note
- **Subtabs / Invite Link UI:**  
  - Although the backend now supports invites and activity logging, the user interface for subtabs (e.g. for board activity and managing invite links) has not yet been implemented. This functionality is planned for a future release.

## [0.2.6] - 2025-03-06
### Added
- **Card Sorting & Filtering:** Implemented sorting (ascending/descending) by Title, Owner, Date Created, and Last Modified, along with filtering across all card content.
- **Manual Reordering:** Integrated manual drag-and-drop reordering for cards within a column using @hello-pangea/dnd when sorting is set to Manual Order.
- **Collapsible Filter Bar:** Added a collapsible, dark theme–compliant Sort/Filter bar with tooltips and a “search by content” placeholder that aligns with the rest of the UI.

### Fixed
- **API Data Issue:** Updated the tasks API endpoint to include the `created_at` field (previously returned as null), so that date-based sorting works correctly.
- **ESLint Warnings:** Resolved React Hooks dependency warnings by wrapping fetch functions (fetchTasks and fetchStories) with useCallback.

## [0.2.5] - 2025-03-05
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

## [0.2.4] - 2025-03-05
### Added
- **Changelog Page Enhancements:** The Changelog page now renders markdown using `react-markdown`, and a new backend endpoint (`/other/changelog`) serves the raw changelog file.
- **Dark Mode Markdown Styling:** Added dark mode overrides in the markdown styling (in markdown.css) so that headings, paragraphs, inline code, code blocks, and blockquotes display appropriately on dark backgrounds.

### Fixed
- **Spacing & Typography:** Resolved spacing issues in the Story Feed and improved typography using a refined font (Roboto) with adjusted font sizes, weights, and margins.
  
### Improved
- **Header Redesign:** Updated the header to display “TaskFable” with a fancy gradient background and the current version (from config.js) in smaller text.
- **CSS Modularization:** Refactored a large stylesheet into multiple files (base.css, layout.css, components.css, themes.css, notifications.css, markdown.css) for better maintainability and theming.

## [0.2.3] - 2025-03-04
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
