// Study Statistics Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Stats elements
    const todayHoursElement = document.getElementById('today-hours');
    const weekHoursElement = document.getElementById('week-hours');
    const totalHoursElement = document.getElementById('total-hours');
    const weeklyChartCanvas = document.getElementById('weekly-chart');
    
    // Initialize stats
    updateStats();
    
    // Create weekly chart
    let weeklyChart;
    initWeeklyChart();
    
    // Make updateStats function global so it can be called from pomodoro.js
    window.updateStats = updateStats;
    
    function updateStats() {
        const sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        
        // Calculate today's hours
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const todayMinutes = sessions
            .filter(session => session.date === today)
            .reduce((total, session) => total + session.duration, 0);
        
        // Calculate this week's hours
        const weekMinutes = getThisWeekMinutes(sessions);
        
        // Calculate total hours
        const totalMinutes = sessions.reduce((total, session) => total + session.duration, 0);
        
        // Update display
        todayHoursElement.textContent = formatHours(todayMinutes);
        weekHoursElement.textContent = formatHours(weekMinutes);
        totalHoursElement.textContent = formatHours(totalMinutes);
        
        // Update chart
        updateWeeklyChart(sessions);
    }
    
    function getThisWeekMinutes(sessions) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const startOfWeek = new Date(now);
        
        // Set to beginning of week (Sunday)
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        return sessions
            .filter(session => new Date(session.date) >= startOfWeek)
            .reduce((total, session) => total + session.duration, 0);
    }
    
    function formatHours(minutes) {
        const hours = minutes / 60;
        return hours.toFixed(1) + ' hours';
    }
    
    function initWeeklyChart() {
        const ctx = weeklyChartCanvas.getContext('2d');
        
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Study Hours',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(74, 111, 165, 0.7)',
                    borderColor: 'rgba(74, 111, 165, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }
    
    function updateWeeklyChart(sessions) {
        // Get dates for the current week
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - dayOfWeek + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }
        
        // Calculate hours for each day
        const weekData = weekDates.map(date => {
            const dayMinutes = sessions
                .filter(session => session.date === date)
                .reduce((total, session) => total + session.duration, 0);
            return dayMinutes / 60; // Convert to hours
        });
        
        // Update chart data
        weeklyChart.data.datasets[0].data = weekData;
        weeklyChart.update();
    }
});