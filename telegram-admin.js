// Telegram Settings Management for Admin Panel

// Load telegram settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTelegramSettings();
});

// Load saved telegram settings
function loadTelegramSettings() {
    try {
        const savedSettings = localStorage.getItem('telegram_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const telegramInput = document.getElementById('telegramUsername');
            if (telegramInput && settings.telegramUsername) {
                telegramInput.value = settings.telegramUsername;
            }
        } else {
            // Set default value
            const telegramInput = document.getElementById('telegramUsername');
            if (telegramInput) {
                telegramInput.value = 'pravitelstvo_russian';
            }
        }
    } catch (error) {
        console.error('Error loading telegram settings:', error);
    }
}

// Save settings including telegram
function saveSettings() {
    try {
        const telegramInput = document.getElementById('telegramUsername');
        if (telegramInput) {
            const username = telegramInput.value.trim();
            
            // Remove @ if user accidentally included it
            const cleanUsername = username.replace('@', '');
            
            // Save to localStorage
            const settings = {
                telegramUsername: cleanUsername || 'pravitelstvo_russian'
            };
            
            localStorage.setItem('telegram_settings', JSON.stringify(settings));
            
            // Update input to show clean username
            telegramInput.value = cleanUsername;
            
            // Show success message
            showNotification('Настройки успешно сохранены!', 'success');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Ошибка при сохранении настроек', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    
    // Add styles if not exist
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                background: #4CAF50;
                color: white;
                font-size: 14px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .admin-notification.error {
                background: #f44336;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Make saveSettings global
window.saveSettings = saveSettings;
