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
    let minutes = 25;
    let seconds = 0;
    let isRunning = false;
    let timer = null;

    // Update timer display
    function updateTimerDisplay() {
        minutesDisplay.textContent = String(minutes).padStart(2, '0');
        secondsDisplay.textContent = String(seconds).padStart(2, '0');
    }

    // Start timer function
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            startButton.disabled = true;
            pauseButton.disabled = false;

            timer = setInterval(function() {
                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else {
                    clearInterval(timer);
                    isRunning = false;
                    const notification = new Audio('/static/sounds/notification.mp3');
                    notification.play();
                    startButton.disabled = false;
                    pauseButton.disabled = true;
                }
                updateTimerDisplay();
            }, 1000);
        }
    }

    // Pause timer function
    function pauseTimer() {
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
            startButton.disabled = false;
            pauseButton.disabled = true;
        }
    }

    // Reset timer function
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        minutes = focusModeButton.classList.contains('active') ? 25 : 5;
        seconds = 0;
        updateTimerDisplay();
        startButton.disabled = false;
        pauseButton.disabled = true;
    }

    // Event listeners for timer controls
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);

    // Mode switching
    focusModeButton.addEventListener('click', function() {
        focusModeButton.classList.add('active');
        breakModeButton.classList.remove('active');
        minutes = 25;
        seconds = 0;
        updateTimerDisplay();
    });

    breakModeButton.addEventListener('click', function() {
        breakModeButton.classList.add('active');
        focusModeButton.classList.remove('active');
        minutes = 5;
        seconds = 0;
        updateTimerDisplay();
    });

    // Goals functionality
    const goalForm = document.getElementById('goal-form');
    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const weeklyHours = document.getElementById('weekly-hours').value;
        
        fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                weeklyHours: parseFloat(weeklyHours)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('goal-display').innerHTML = `<p>${weeklyHours} hours per week</p>`;
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Notes functionality
    const saveNoteButton = document.getElementById('save-note');
    const clearNoteButton = document.getElementById('clear-note');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');

    saveNoteButton.addEventListener('click', function() {
        const noteData = {
            title: noteTitleInput.value,
            content: noteContentInput.value
        };

        fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadNotes(); // Refresh notes list
                noteTitleInput.value = '';
                noteContentInput.value = '';
            }
        })
        .catch(error => console.error('Error:', error));
    });

    clearNoteButton.addEventListener('click', function() {
        noteTitleInput.value = '';
        noteContentInput.value = '';
    });

    // Load existing notes
    function loadNotes() {
        fetch('/api/notes')
            .then(response => response.json())
            .then(notes => {
                const notesList = document.getElementById('notes-list');
                notesList.innerHTML = notes.length ? '' : '<p class="empty-state">No notes yet. Create your first note!</p>';
                
                notes.forEach(note => {
                    const noteElement = document.createElement('div');
                    noteElement.className = 'note-item';
                    noteElement.innerHTML = `
                        <h3>${note.title}</h3>
                        <p>${note.content}</p>
                    `;
                    notesList.appendChild(noteElement);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Initial load
    loadNotes();
    updateTimerDisplay();
});