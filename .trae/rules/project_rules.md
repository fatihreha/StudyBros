# StudyBuddy – Project Rules for Trae

## General Principles
- Never introduce syntax errors.
- Preserve the functionality of existing code.
- Follow clean code principles (readability, maintainability, simplicity).
- Use American English for comments and documentation.

## Flask + SQL (User Auth, Backend)
- Do not remove or rename route decorators (e.g., @app.route).
- Preserve the login, registration, and session-tracking functionalities.
- Avoid modifying the database schema unless explicitly requested.
- Ensure all database queries remain secure (use parameterized queries or ORM safely).

## JavaScript (Pomodoro Timer, Notes, UI)
- Keep Pomodoro timer logic intact (25 min focus / 5 min break cycle).
- Do not remove `localStorage`-based note features unless new database-backed logic is replacing them.
- Preserve cross-browser functionality and keep the interface responsive.

## SQLite & Data Visualization
- Do not alter chart logic (e.g., weekly progress graphs) unless improving clarity or performance.
- Ensure that any visualization changes still reflect accurate user study data.
- Use existing libraries like Chart.js or minimal alternatives for visual changes.

## Goal Setting & Achievement Badges
- Preserve consistency between set goals and calculated progress.
- Do not remove or reset badge tracking logic without explicit approval.
- New badges must have clear criteria and not interfere with existing ones.

## Refactoring Guidelines
- Perform refactoring only if it improves readability, maintainability, or performance.
- Avoid renaming functions, classes, or variables unless the new names are clearly better and won't break references.

## Styling & User Experience
- Maintain a simple, student-friendly UI.
- Do not make drastic changes to layout or themes unless approved.
- Ensure changes work well on mobile and desktop.

## Comments & Documentation
- Retain existing comments unless they are incorrect.
- Add comments to clarify non-obvious logic, especially around timer, goal tracking, and badge calculations.
- Avoid casual or vague phrasing in comments.

## File Structure & Organization
- Do not move or rename key files (e.g., `app.py`, `templates/`, `static/js/`, `db/`) without purpose.
- Keep frontend and backend code separate.

## Commit Messages
- Use clear, consistent commit messages:  
  - `feat(timer): added pause/resume support`  
  - `fix(db): corrected weekly hour calculation`  
  - `chore(ui): updated styling for note section`

## Testing & Debugging
- Never push changes that break login, timer, or database flows.
- Remove console logs and debug prints in production-level code.
- Manual tests should confirm:  
  - Timer accuracy  
  - Goal progress correctness  
  - Data persists as expected across sessions
