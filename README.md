# TaskFable

**Version:** 0.3.0

## Overview
TaskFable is a web application that turns task management into an engaging adventure. Users create tasks (quests), add comments, and gain XP and currency as they progress. The application supports features like private tasks, co-owner collaboration, and a story feed that weaves task events into mini-adventures.

## Features
- **Task Management:** Create, update, and manage tasks with various statuses (To-Do, Doing, Waiting, Done).
- **Collaborative Tasks:** Assign co-owners to tasks using a picklist (now fixed).
- **Locked Tasks:** Tasks marked as "Done" become locked to prevent further editing by non-owners.
- **Stories & XP:** Generate mini-stories for tasks along with XP and currency rewards.

## Installation
1. **Backend:**  
   - Install dependencies: `pip install -r requirements.txt`
   - Initialize the database: `python backend/init_db.py`
   - Run the server: `uvicorn backend.main:app --reload`

2. **Frontend:**  
   - Install dependencies: `npm install`
   - Run the app: `npm start`

## Versioning
This project uses [Semantic Versioning](https://semver.org/) in the format `MAJOR.MINOR.PATCH`:
- **MAJOR:** Breaking changes.
- **MINOR:** New features and improvements.
- **PATCH:** Bug fixes and minor tweaks.

## Contributing
Contributions are welcome! Please open an issue or pull request with your changes.  
For each code change, update the changelog and bump the version accordingly.

## License
[MIT License](LICENSE)
