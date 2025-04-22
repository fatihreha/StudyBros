// Gelişmiş İstatistik Raporları
document.addEventListener('DOMContentLoaded', function() {
    // Gerekli DOM elementlerini seç
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.getElementById('custom-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyFilterBtn = document.getElementById('apply-filter');
    
    // Chart.js grafikleri
    let hourlyActivityChart;
    let weekdayComparisonChart;
    let productivityTrendChart;
    let focusDistributionChart;
    
    // Tarih aralığı seçimi değiştiğinde
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            loadStats(this.value);
        }
    });
    
    // Filtre uygula butonuna tıklandığında
    applyFilterBtn.addEventListener('click', function() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            showNotification('Hata', 'Lütfen başlangıç ve bitiş tarihlerini seçin', 'error');
            return;
        }
        
        loadStats('custom', startDate, endDate);
    });
    
    // Sayfa yüklendiğinde varsayılan istatistikleri yükle
    loadStats('week');
    
    // İstatistikleri yükleme fonksiyonu
    function loadStats(range, startDate, endDate) {
        // Çalışma seanslarını al
        let sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        
        // Tarih aralığına göre filtrele
        const filteredSessions = filterSessionsByDateRange(sessions, range, startDate, endDate);
        
        // İstatistikleri hesapla
        const stats = calculateAdvancedStats(filteredSessions);
        
        // İstatistikleri görüntüle
        displayAdvancedStats(stats);
        
        // Grafikleri oluştur
        createHourlyActivityChart(stats.hourlyActivity);
        createWeekdayComparisonChart(stats.weekdayActivity);
        createProductivityTrendChart(stats.dailyActivity);
        createFocusDistributionChart(stats.focusDistribution);
    }
    
    // Tarih aralığına göre seansları filtreleme
    function filterSessionsByDateRange(sessions, range, startDate, endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filterStartDate = new Date(today);
        let filterEndDate = new Date(today);
        
        switch (range) {
            case 'today':
                // Bugün (varsayılan)
                break;
            case 'week':
                // Son 7 gün
                filterStartDate.setDate(today.getDate() - 6);
                break;
            case 'month':
                // Son 30 gün
                filterStartDate.setDate(today.getDate() - 29);
                break;
            case 'year':
                // Son 365 gün
                filterStartDate.setDate(today.getDate() - 364);
                break;
            case 'custom':
                // Özel tarih aralığı
                filterStartDate = new Date(startDate);
                filterEndDate = new Date(endDate);
                filterEndDate.setHours(23, 59, 59, 999);
                break;
        }
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= filterStartDate && sessionDate <= filterEndDate;
        });
    }
    
    // Gelişmiş istatistikleri hesaplama
    function calculateAdvancedStats(sessions) {
        // Temel istatistikler
        const totalSessions = sessions.length;
        const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        
        // Günlük aktivite
        const dailyActivity = {};
        
        // Saatlik aktivite (günün hangi saatlerinde çalışıldığı)
        const hourlyActivity = Array(24).fill(0);
        
        // Haftanın günlerine göre aktivite
        const weekdayActivity = Array(7).fill(0);
        
        // Odaklanma dağılımı (25 dakikalık seanslar, 50 dakikalık seanslar, vb.)
        const focusDistribution = {
            '25min': 0,   // Tek pomodoro
            '50min': 0,   // İki pomodoro
            '75min': 0,   // Üç pomodoro
            '100min+': 0  // Dört veya daha fazla pomodoro
        };
        
        // Seans başına ortalama süre
        const avgSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
        
        // En uzun çalışma serisi (streak)
        let currentStreak = 0;
        let longestStreak = 0;
        let lastDate = null;
        
        // Seanslara göre istatistikleri hesapla
        sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const dateStr = session.date;
            const hour = new Date(session.timestamp).getHours();
            const weekday = sessionDate.getDay();
            
            // Günlük aktivite
            if (!dailyActivity[dateStr]) {
                dailyActivity[dateStr] = 0;
            }
            dailyActivity[dateStr] += session.duration;
            
            // Saatlik aktivite
            hourlyActivity[hour] += session.duration;
            
            // Haftanın günlerine göre aktivite
            weekdayActivity[weekday] += session.duration;
            
            // Odaklanma dağılımı
            if (session.duration <= 25) {
                focusDistribution['25min']++;
            } else if (session.duration <= 50) {
                focusDistribution['50min']++;
            } else if (session.duration <= 75) {
                focusDistribution['75min']++;
            } else {
                focusDistribution['100min+']++;
            }
            
            // Streak hesaplama
            if (lastDate) {
                const prevDate = new Date(lastDate);
                const currDate = new Date(dateStr);
                
                // Bir önceki günden bir gün sonra mı?
                const diffTime = Math.abs(currDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else if (diffDays > 1) {
                    // Streak kırıldı
                    longestStreak = Math.max(longestStreak, currentStreak);
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            
            lastDate = dateStr;
        });
        
        // Son streak'i kontrol et
        longestStreak = Math.max(longestStreak, currentStreak);
        
        // En verimli saat
        let mostProductiveHour = 0;
        let maxHourlyDuration = 0;
        
        hourlyActivity.forEach((duration, hour) => {
            if (duration > maxHourlyDuration) {
                maxHourlyDuration = duration;
                mostProductiveHour = hour;
            }
        });
        
        // En verimli gün
        let mostProductiveDay = 0;
        let maxDailyDuration = 0;
        
        weekdayActivity.forEach((duration, day) => {
            if (duration > maxDailyDuration) {
                maxDailyDuration = duration;
                mostProductiveDay = day;
            }
        });
        
        return {
            totalSessions,
            totalMinutes,
            totalHours,
            avgSessionDuration,
            longestStreak,
            mostProductiveHour,
            mostProductiveDay,
            dailyActivity,
            hourlyActivity,
            weekdayActivity,
            focusDistribution
        };
    }
    
    // İstatistikleri görüntüleme
    function displayAdvancedStats(stats) {
        // Özet istatistikler
        document.getElementById('total-sessions').textContent = stats.totalSessions;
        document.getElementById('total-hours').textContent = stats.totalHours;
        document.getElementById('avg-session').textContent = Math.round(stats.avgSessionDuration);
        document.getElementById('longest-streak').textContent = stats.longestStreak;
        
        // En verimli saat
        const hourFormatted = stats.mostProductiveHour < 10 ? 
            `0${stats.mostProductiveHour}:00` : 
            `${stats.mostProductiveHour}:00`;
        document.getElementById('productive-hour').textContent = hourFormatted;
        
        // En verimli gün
        const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        document.getElementById('productive-day').textContent = weekdays[stats.mostProductiveDay];
    }
    
    // Saatlik aktivite grafiği
    function createHourlyActivityChart(hourlyData) {
        const ctx = document.getElementById('hourly-activity-chart').getContext('2d');
        
        // Önceki grafiği temizle
        if (hourlyActivityChart) {
            hourlyActivityChart.destroy();
        }
        
        // Saat etiketleri
        const labels = Array.from({length: 24}, (_, i) => 
            i < 10 ? `0${i}:00` : `${i}:00`
        );
        
        hourlyActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Çalışma Dakikaları',
                    data: hourlyData,
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
                            text: 'Dakika'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Saat'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Günün Saatlerine Göre Çalışma Aktivitesi'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} dakika`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Haftanın günlerine göre karşılaştırma grafiği
    function createWeekdayComparisonChart(weekdayData) {
        const ctx = document.getElementById('weekday-comparison-chart').getContext('2d');
        
        // Önceki grafiği temizle
        if (weekdayComparisonChart) {
            weekdayComparisonChart.destroy();
        }
        
        // Gün etiketleri
        const labels = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        
        weekdayComparisonChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Çalışma Dakikaları',
                    data: weekdayData,
                    backgroundColor: 'rgba(74, 111, 165, 0.2)',
                    borderColor: 'rgba(74, 111, 165, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(74, 111, 165, 1)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Haftanın Günlerine Göre Çalışma Aktivitesi'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.r} dakika`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Üretkenlik trendi grafiği
    function createProductivityTrendChart(dailyData) {
        const ctx = document.getElementById('productivity-trend-chart').getContext('2d');
        
        // Önceki grafiği temizle
        if (productivityTrendChart) {
            productivityTrendChart.destroy();
        }
        
        // Tarihleri sırala
        const sortedDates = Object.keys(dailyData).sort();
        
        // Grafik verileri
        const labels = sortedDates.map(date => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });
        
        const data = sortedDates.map(date => dailyData[date]);
        
        // Hareketli ortalama hesapla (3 günlük)
        const movingAvg = [];
        for (let i = 0; i < data.length; i++) {
            if (i < 2) {
                // İlk iki gün için yeterli veri yok
                movingAvg.push(null);
            } else {
                const avg = (data[i] + data[i-1] + data[i-2]) / 3;
                movingAvg.push(Math.round(avg));
            }
        }
        
        productivityTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Günlük Çalışma',
                        data: data,
                        backgroundColor: 'rgba(74, 111, 165, 0.1)',
                        borderColor: 'rgba(74, 111, 165, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: '3 Günlük Ortalama',
                        data: movingAvg,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Dakika'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tarih'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Günlük Çalışma Trendi'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} dakika`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Odaklanma dağılımı grafiği
    function createFocusDistributionChart(focusData) {
        const ctx = document.getElementById('focus-distribution-chart').getContext('2d');
        
        // Önceki grafiği temizle
        if (focusDistributionChart) {
            focusDistributionChart.destroy();
        }
        
        // Grafik verileri
        const labels = ['25 dakika', '50 dakika', '75 dakika', '100+ dakika'];
        const data = [
            focusData['25min'],
            focusData['50min'],
            focusData['75min'],
            focusData['100min+']
        ];
        
        focusDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(74, 111, 165, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    borderColor: [
                        'rgba(74, 111, 165, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Çalışma Süresi Dağılımı'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = data.reduce((sum, val) => sum + val, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return `${context.label}: ${context.parsed} seans (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bildirim gösterme fonksiyonu
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
});