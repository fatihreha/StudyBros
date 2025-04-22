// Study Notes Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Notes elements
    const notesList = document.getElementById('notes-list');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');
    const saveNoteButton = document.getElementById('save-note');
    const clearNoteButton = document.getElementById('clear-note');
    
    // Current note being edited
    let currentNoteId = null;
    
    // Load notes
    loadNotes();
    
    // Event listeners
    saveNoteButton.addEventListener('click', saveNote);
    clearNoteButton.addEventListener('click', clearNoteForm);
    
    function loadNotes() {
        // Check if user is logged in
        if (document.body.dataset.userLoggedIn === 'true') {
            // Load notes from server
            fetch('/api/notes')
                .then(response => response.json())
                .then(notes => {
                    displayNotes(notes);
                })
                .catch(error => {
                    console.error('Notlar yüklenemedi:', error);
                    // Fallback to localStorage if server request fails
                    const localNotes = JSON.parse(localStorage.getItem('studyNotes')) || [];
                    displayNotes(localNotes);
                });
        } else {
            // Load from localStorage if not logged in
            const notes = JSON.parse(localStorage.getItem('studyNotes')) || [];
            displayNotes(notes);
        }
    }

    function displayNotes(notes) {
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="empty-state">Henüz not yok. İlk notunuzu oluşturun!</p>';
            return;
        }
        
        // Sort notes by last updated time (newest first)
        notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Clear notes list
        notesList.innerHTML = '';
        
        // Add each note to the list
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.id = note.id;
            noteElement.innerHTML = `
                <h3>${escapeHtml(note.title)}</h3>
                <p>${escapeHtml(note.content.substring(0, 50))}${note.content.length > 50 ? '...' : ''}</p>
            `;
            
            // Add click event to edit note
            noteElement.addEventListener('click', () => editNote(note.id));
            
            notesList.appendChild(noteElement);
        });
    }
    
    function saveNote() {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        
        if (!title || !content) {
            showNotification('Hata', 'Lütfen başlık ve içerik girin', 'error');
            return;
        }
        
        const now = new Date().toISOString();
        let noteData = {
            title: title,
            content: content,
            updatedAt: now
        };
        
        if (currentNoteId) {
            noteData.id = currentNoteId;
        } else {
            noteData.createdAt = now;
        }
        
        // If user is logged in, save to server
        if (document.body.dataset.userLoggedIn === 'true') {
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
                    loadNotes();
                    clearNoteForm();
                    showNotification('Başarılı', 'Not kaydedildi', 'success');
                } else {
                    showNotification('Hata', 'Not kaydedilemedi: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Not kaydedilemedi:', error);
                showNotification('Bağlantı Hatası', 'Not kaydedilemedi. İnternet bağlantınızı kontrol edin.', 'error');
                
                // Fallback to localStorage
                saveToLocalStorage(noteData);
            });
        } else {
            // Save to localStorage if not logged in
            saveToLocalStorage(noteData);
        }
    }

    function saveToLocalStorage(noteData) {
        // Get existing notes
        let notes = JSON.parse(localStorage.getItem('studyNotes')) || [];
        
        if (noteData.id) {
            // Update existing note
            const noteIndex = notes.findIndex(note => note.id === noteData.id);
            
            if (noteIndex !== -1) {
                notes[noteIndex].title = noteData.title;
                notes[noteIndex].content = noteData.content;
                notes[noteIndex].updatedAt = noteData.updatedAt;
            }
        } else {
            // Create new note
            const newNote = {
                id: Date.now().toString(),
                title: noteData.title,
                content: noteData.content,
                createdAt: noteData.createdAt,
                updatedAt: noteData.updatedAt
            };
            
            notes.push(newNote);
        }
        
        // Save notes to localStorage
        localStorage.setItem('studyNotes', JSON.stringify(notes));
        
        // Reload notes list
        loadNotes();
        
        // Clear form
        clearNoteForm();
        
        showNotification('Başarılı', 'Not kaydedildi (çevrimdışı)', 'success');
    }

    function editNote(noteId) {
        // If user is logged in, get note from server
        if (document.body.dataset.userLoggedIn === 'true') {
            fetch('/api/notes')
                .then(response => response.json())
                .then(notes => {
                    const note = notes.find(note => note.id == noteId);
                    if (note) {
                        noteTitleInput.value = note.title;
                        noteContentInput.value = note.content;
                        currentNoteId = note.id;
                        saveNoteButton.textContent = 'Notu Güncelle';
                    }
                })
                .catch(error => {
                    console.error('Not yüklenemedi:', error);
                    // Fallback to localStorage
                    editFromLocalStorage(noteId);
                });
        } else {
            // Get from localStorage if not logged in
            editFromLocalStorage(noteId);
        }
    }

    function editFromLocalStorage(noteId) {
        const notes = JSON.parse(localStorage.getItem('studyNotes')) || [];
        const note = notes.find(note => note.id === noteId);
        
        if (note) {
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            currentNoteId = note.id;
            saveNoteButton.textContent = 'Notu Güncelle';
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
    
    function clearNoteForm() {
        noteTitleInput.value = '';
        noteContentInput.value = '';
        currentNoteId = null;
        saveNoteButton.textContent = 'Notu Kaydet';
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});