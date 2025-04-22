// Study Goals Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Goals elements
    const goalDisplay = document.getElementById('goal-display');
    const goalProgress = document.getElementById('goal-progress');
    const goalForm = document.getElementById('goal-form');
    const weeklyHoursInput = document.getElementById('weekly-hours');
    
    // Load current goal
    loadGoal();
    
    // Event listeners
    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        setGoal();
    });
    
    function loadGoal() {
        const goal = JSON.parse(localStorage.getItem('studyGoal'));
        
        if (goal && goal.isActive) {
            displayGoal(goal);
            updateGoalProgress();
        } else {
            goalDisplay.innerHTML = '<p>No active goal</p>';
            goalProgress.style.width = '0%';
        }
    }
    
    function setGoal() {
        const weeklyHours = parseFloat(weeklyHoursInput.value);
        
        if (isNaN(weeklyHours) || weeklyHours <= 0) {
            alert('Please enter a valid weekly study hours goal');
            return;
        }
        
        const goal = {
            weeklyHours: weeklyHours,
            startDate: new Date().toISOString(),
            isActive: true
        };
        
        localStorage.setItem('studyGoal', JSON.stringify(goal));
        displayGoal(goal);
        updateGoalProgress();
    }
    
    function displayGoal(goal) {
        goalDisplay.innerHTML = `
            <p>Weekly goal: <strong>${goal.weeklyHours} hours</strong></p>
            <p>Started: ${new Date(goal.startDate).toLocaleDateString()}</p>
        `;
    }
    
    function updateGoalProgress() {
        const goal = JSON.parse(localStorage.getItem('studyGoal'));
        if (!goal || !goal.isActive) return;
        
        const sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        
        // Calculate this week's hours
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const weekMinutes = sessions
            .filter(session => new Date(session.date) >= startOfWeek)
            .reduce((total, session) => total + session.duration, 0);
        
        const weekHours = weekMinutes / 60;
        const progressPercent = Math.min((weekHours / goal.weeklyHours) * 100, 100);
        
        goalProgress.style.width = `${progressPercent}%`;
        
        // Check if goal is completed
        if (weekHours >= goal.weeklyHours && typeof checkBadges === 'function') {
            checkBadges();
        }
    }
    
    // Make updateGoalProgress global so it can be called from other scripts
    window.updateGoalProgress = updateGoalProgress;
});