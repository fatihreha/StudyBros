// Tema Değiştirici
document.addEventListener('DOMContentLoaded', function() {
    // Tema değiştirici butonunu oluştur
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    themeSwitcher.innerHTML = `
        <button id="light-theme" class="theme-btn" aria-label="Açık Tema">☀️</button>
        <button id="dark-theme" class="theme-btn" aria-label="Koyu Tema">🌙</button>
        <button id="system-theme" class="theme-btn" aria-label="Sistem Teması">💻</button>
    `;
    
    // Sayfaya ekle
    document.body.appendChild(themeSwitcher);
    
    // Tema butonlarını seç
    const lightThemeBtn = document.getElementById('light-theme');
    const darkThemeBtn = document.getElementById('dark-theme');
    const systemThemeBtn = document.getElementById('system-theme');
    
    // Mevcut temayı al
    const currentTheme = localStorage.getItem('theme') || 'system';
    
    // Temayı uygula
    applyTheme(currentTheme);
    
    // Aktif tema butonunu işaretle
    updateActiveButton(currentTheme);
    
    // Tema butonlarına tıklama olayları ekle
    lightThemeBtn.addEventListener('click', () => {
        setTheme('light');
    });
    
    darkThemeBtn.addEventListener('click', () => {
        setTheme('dark');
    });
    
    systemThemeBtn.addEventListener('click', () => {
        setTheme('system');
    });
    
    // Sistem teması değişikliğini izle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (currentTheme === 'system') {
            applyTheme('system');
        }
    });
    
    // Tema ayarlama fonksiyonu
    function setTheme(theme) {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
        updateActiveButton(theme);
    }
    
    // Temayı uygulama fonksiyonu
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // Sistem teması
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }
    
    // Aktif tema butonunu işaretleme fonksiyonu
    function updateActiveButton(theme) {
        lightThemeBtn.classList.remove('active');
        darkThemeBtn.classList.remove('active');
        systemThemeBtn.classList.remove('active');
        
        if (theme === 'light') {
            lightThemeBtn.classList.add('active');
        } else if (theme === 'dark') {
            darkThemeBtn.classList.add('active');
        } else {
            systemThemeBtn.classList.add('active');
        }
    }
});