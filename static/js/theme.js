// Tema değiştirme işlevselliği
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Kaydedilmiş temayı kontrol et
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Tema değiştirme olayı
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // HTML kök elementine tema özelliğini ayarla
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Temayı localStorage'a kaydet
        localStorage.setItem('theme', newTheme);
        
        // Tema simgesini güncelle
        updateThemeIcon(newTheme);
        
        console.log('Tema değiştirildi:', newTheme);
    });
    
    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' ? '🌙' : '☀️';
    }
});