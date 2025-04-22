// Pomodoro Timer Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Timer elements
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const resetButton = document.getElementById('reset-timer');
    const focusModeButton = document.getElementById('focus-mode');
    const breakModeButton = document.getElementById('break-mode');

    // Timer variables
    let timer;
    let minutes = 25;
    let seconds = 0;
    let isRunning = false;
    let isPaused = false;
    let mode = 'focus'; // 'focus' or 'break'
    
    // Initialize timer display
    updateTimerDisplay();
    
    // Event listeners
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    focusModeButton.addEventListener('click', () => setMode('focus'));
    breakModeButton.addEventListener('click', () => setMode('break'));
    
    // Timer functions
    function startTimer() {
        if (isRunning) return;
        
        if (isPaused) {
            isPaused = false;
        } else {
            // Save start time to localStorage for tracking
            const startTime = new Date().toISOString();
            localStorage.setItem('pomodoroStartTime', startTime);
        }
        
        isRunning = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        
        timer = setInterval(function() {
            // Decrease seconds
            if (seconds > 0) {
                seconds--;
            } else if (minutes > 0) {
                // If seconds is 0 and minutes > 0, decrease minutes and set seconds to 59
                minutes--;
                seconds = 59;
            } else {
                // Timer completed
                clearInterval(timer);
                isRunning = false;
                
                // Play notification sound
                const audio = new Audio('/static/sounds/notification.mp3');
                audio.play().catch(e => {
                    console.log('Audio play failed:', e);
                    // Show notification to user
                    showNotification('Audio Failed', 'Your browser does not allow audio playback. Please check permissions.', 'warning');
                });
                
                // Show notification
                if (Notification.permission === 'granted') {
                    const message = mode === 'focus' 
                        ? 'Focus time completed! Time for a break.' 
                        : 'Break time completed! Time to focus again.';
                    
                    try {
                        new Notification('StudyBuddy Pomodoro', { 
                            body: message,
                            icon: '/static/images/logo.png'
                        });
                    } catch (e) {
                        console.error('Notification error:', e);
                        // Show notification on page in case of error
                        showNotification('Pomodoro', message, 'info');
                    }
                } else if (Notification.permission !== 'denied') {
                    // Notification permission not requested, inform user
                    showNotification('Notification Permission', 'Allow notifications for a better experience', 'info');
                    Notification.requestPermission();
                } else {
                    // Notification permission denied, show on page
                    const message = mode === 'focus' 
                        ? 'Focus time completed! Time for a break.' 
                        : 'Break time completed! Time to focus again.';
                    showNotification('Pomodoro', message, 'info');
                }
                
                // Record completed session if in focus mode
                if (mode === 'focus') {
                    recordStudySession(25); // 25 minutes
                }
                
                // Switch modes automatically
                setMode(mode === 'focus' ? 'break' : 'focus');
                startTimer(); // Auto-start next session
                return;
            }
            
            updateTimerDisplay();
        }, 1000);
    }
    
    function pauseTimer() {
        if (!isRunning) return;
        
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        startButton.disabled = false;
        pauseButton.disabled = true;
    }
    
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        isPaused = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        
        // Reset to current mode's default time
        setMode(mode);
    }
    
    function setMode(newMode) {
        mode = newMode;
        
        // Update UI
        if (mode === 'focus') {
            focusModeButton.classList.add('active');
            breakModeButton.classList.remove('active');
            minutes = 25;
            seconds = 0;
        } else {
            focusModeButton.classList.remove('active');
            breakModeButton.classList.add('active');
            minutes = 5;
            seconds = 0;
        }
        
        // Reset timer state
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
        }
        
        startButton.disabled = false;
        pauseButton.disabled = true;
        updateTimerDisplay();
    }
    
    function updateTimerDisplay() {
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }
    
    function recordStudySession(duration) {
        // Get existing sessions from localStorage for offline support
        let sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        
        // Create session object
        const session = {
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            duration: duration, // in minutes
            timestamp: new Date().getTime()
        };
        
        // Add to localStorage for offline support
        sessions.push(session);
        localStorage.setItem('studySessions', JSON.stringify(sessions));
        
        // If user is logged in, save to database
        if (document.body.dataset.userLoggedIn === 'true') {
            fetch('/api/study-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(session)
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Çalışma seansı kaydedilemedi:', data.message);
                    showNotification('Hata', 'Çalışma seansı kaydedilemedi: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Çalışma seansı kaydedilemedi:', error);
                showNotification('Bağlantı Hatası', 'Çalışma seansı kaydedilemedi. İnternet bağlantınızı kontrol edin.', 'error');
            });
        }
        
        // Update stats display if stats.js is loaded
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        // Check for badges
        if (typeof checkBadges === 'function') {
            checkBadges();
        }
    }
    
    // Utility function to show notifications
    function showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 5000);
    }
    
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});