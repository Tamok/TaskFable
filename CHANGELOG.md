# Changelog

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
