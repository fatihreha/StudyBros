# StudyBros - Smart Study Tracking System

StudyBuddy is a comprehensive study tracking application designed to help students manage their study time effectively, set goals, and track progress.

## Features

- **Pomodoro Timer**: Focus for 25 minutes, then take a 5-minute break
- **Study Statistics**: Track daily, weekly, and total study hours
- **Goal Setting**: Set weekly study goals and track progress
- **Notes**: Take and organize study notes
- **Achievements**: Earn badges for study milestones
- **Offline Support**: Use the app even without internet connection
- **Dark/Light Theme**: Choose your preferred visual theme

## Project Structure

StudyBros/
├── app.py                 # Main Flask application
├── static/
│   ├── css/               # CSS styling files
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   ├── pomodoro.js    # Pomodoro timer functionality
│   │   ├── notes.js       # Note-taking functionality
│   │   ├── stats.js       # Study statistics
│   │   ├── goals.js       # Goal tracking
│   │   ├── badges.js      # Achievement badges
│   │   ├── theme.js       # Theme switcher
│   │   ├── main.js        # Main JavaScript functionality
│   │   └── service-worker.js # Offline functionality
│   ├── sounds/            # Notification sounds
│   └── images/            # Images and icons
├── templates/
│   ├── base.html          # Base template
│   ├── index.html         # Homepage
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # User dashboard
│   └── offline.html       # Offline page
└── requirements.txt       # Python dependencies

## Installation

1. Clone the repository:

git clone https://github.com/yourusername/studybuddy.git cd studybuddy


2. Create a virtual environment and activate it:

python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac


3. Install dependencies:

pip install -r requirements.txt


4. Initialize the database:

flask shell

from app import db
db.create_all()
exit()

5. Run the application:

flask run

6. Open your browser and navigate to `http://127.0.0.1:5000/`

## Technologies Used
- Backend : Flask, SQLAlchemy
- Frontend : HTML, CSS, JavaScript
- Database : SQLite
- PWA : Service Workers for offline functionality
- Authentication : Flask session management with password hashing
- Data Visualization : Chart.js for study statistics
- Responsive Design : Mobile-friendly interface
- Local Storage : For offline data persistence
- IndexedDB : For storing larger datasets offline
- Notification API : For timer alerts and achievements
- Fetch API : For asynchronous data operations
## Key Features Implementation
### Pomodoro Timer
The Pomodoro technique is implemented with a 25-minute focus period followed by a 5-minute break. The timer uses JavaScript's setInterval API and provides audio and visual notifications when each period ends.

### Study Statistics
The application tracks and visualizes study data using Chart.js. Statistics include:

- Daily and weekly study hours
- Most productive times of day
- Study streaks and consistency metrics
- Goal completion rates
### Offline Functionality
StudyBuddy works offline thanks to Service Workers and local storage:

- All core features function without internet connection
- Study sessions are stored locally and synced when online
- Progressive Web App (PWA) capabilities allow installation on devices
### Achievement System
The application includes a gamified achievement system with badges for:

- Completing first study session
- Reaching study hour milestones
- Maintaining study streaks
- Completing weekly goals
## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
