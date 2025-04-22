// Achievements and Badges Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Badges container
    const badgesContainer = document.getElementById('badges-container');
    
    // Badge definitions
    const badgeDefinitions = [
        {
            id: 'first-session',
            name: 'First Step',
            description: 'Complete your first Pomodoro session',
            icon: '🚀',
            check: (stats) => stats.totalSessions >= 1
        },
        {
            id: 'five-sessions',
            name: 'Regular',
            description: 'Complete 5 Pomodoro sessions',
            icon: '⭐',
            check: (stats) => stats.totalSessions >= 5
        },
        {
            id: 'ten-hours',
            name: 'Diligent',
            description: 'Study for a total of 10 hours',
            icon: '🕙',
            check: (stats) => stats.totalHours >= 10
        },
        {
            id: 'weekly-goal',
            name: 'Goal-Oriented',
            description: 'Complete your weekly study goal',
            icon: '🎯',
            check: (stats) => stats.goalsCompleted >= 1
        },
        {
            id: 'streak-three',
            name: 'Determined',
            description: 'Study for three consecutive days',
            icon: '🔥',
            check: (stats) => stats.streak >= 3
        },
        {
            id: 'streak-seven',
            name: 'Persistent',
            description: 'Study for seven consecutive days',
            icon: '💪',
            check: (stats) => stats.streak >= 7
        }
    ];
    
    // Load badges
    loadBadges();
    
    // Make checkBadges function global so it can be called from other scripts
    window.checkBadges = checkBadges;
    
    function loadBadges() {
        const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || [];
        
        // Clear badges container
        badgesContainer.innerHTML = '';
        
        // Add each badge to the container
        badgeDefinitions.forEach(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
            badgeElement.innerHTML = `
                <div class="badge-icon" title="${badge.description}">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            `;
            
            badgesContainer.appendChild(badgeElement);
        });
        
        // If no badges, show empty state
        if (badgeDefinitions.length === 0) {
            badgesContainer.innerHTML = '<p class="empty-state">Çalışma seanslarını tamamlayarak rozetler kazanın!</p>';
        }
    }
    
    function checkBadges() {
        const stats = calculateStats();
        const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || [];
        let newBadgesEarned = false;
        
        // Check each badge
        badgeDefinitions.forEach(badge => {
            if (!earnedBadges.includes(badge.id) && badge.check(stats)) {
                earnedBadges.push(badge.id);
                newBadgesEarned = true;
                
                // Show notification
                showBadgeNotification(badge);
            }
        });
        
        if (newBadgesEarned) {
            // Save earned badges
            localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
            
            // Reload badges
            loadBadges();
        }
    }
    
    function calculateStats() {
        const sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        const goal = JSON.parse(localStorage.getItem('studyGoal'));
        
        // Calculate total sessions
        const totalSessions = sessions.length;
        
        // Calculate total hours
        const totalMinutes = sessions.reduce((total, session) => total + session.duration, 0);
        const totalHours = totalMinutes / 60;
        
        // Calculate streak
        const streak = calculateStreak(sessions);
        
        // Calculate goals completed
        const goalsCompleted = localStorage.getItem('goalsCompleted') || 0;
        
        return {
            totalSessions,
            totalHours,
            streak,
            goalsCompleted: parseInt(goalsCompleted)
        };
    }
    
    function calculateStreak(sessions) {
        if (sessions.length === 0) return 0;
        
        // Get unique dates in descending order
        const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
        
        // Check if today has a session
        const today = new Date().toISOString().split('T')[0];
        if (dates[0] !== today) return 0;
        
        // Count consecutive days
        let streak = 1;
        for (let i = 1; i < dates.length; i++) {
            const currentDate = new Date(dates[i-1]);
            const prevDate = new Date(dates[i]);
            
            // Check if dates are consecutive
            currentDate.setDate(currentDate.getDate() - 1);
            
            if (currentDate.toISOString().split('T')[0] === dates[i]) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    function showBadgeNotification(badge) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-info">
                <h3>New Badge Earned!</h3>
                <p><strong>${badge.name}</strong>: ${badge.description}</p>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 5000);
    }
});