// Telegram Mini App Checkout Form
class TelegramCheckout {
    constructor() {
        this.page = null;
        this.deliveryType = 'delivery'; // 'delivery' or 'pickup'
        this.init();
    }

    init() {
        this.createPage();
        this.setupEventListeners();
    }

    createPage() {
        const pageHTML = `
            <div class="tg-checkout-page" id="tgCheckoutPage" style="display: none;">
                <div class="tg-checkout-page-header">
                    <button class="tg-checkout-page-back">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h1 class="tg-checkout-page-title">Оформление заказа</h1>
                    <div class="tg-checkout-page-spacer"></div>
                </div>
                
                <div class="tg-checkout-page-content">
                    <div class="tg-checkout-delivery-toggle">
                        <button class="tg-checkout-toggle-btn ${this.deliveryType === 'delivery' ? 'active' : ''}" data-type="delivery">
                            Доставка
                        </button>
                        <button class="tg-checkout-toggle-btn ${this.deliveryType === 'pickup' ? 'active' : ''}" data-type="pickup">
                            Самовывоз
                        </button>
                    </div>
                    
                    <form class="tg-checkout-form" id="tgCheckoutForm">
                        <div class="tg-checkout-field">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input type="text" id="tgCheckoutFullName" placeholder="ФИО" required>
                        </div>
                        
                        <div class="tg-checkout-field">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <input type="tel" id="tgCheckoutPhone" placeholder="Телефон" required>
                        </div>
                        
                        <div class="tg-checkout-field">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <input type="text" id="tgCheckoutComment" placeholder="Комментарий">
                        </div>
                        
                        <div class="tg-checkout-field" id="tgCheckoutCityField" style="display: ${this.deliveryType === 'delivery' ? 'flex' : 'none'};">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <input type="text" id="tgCheckoutCity" placeholder="Город доставки" ${this.deliveryType === 'delivery' ? 'required' : ''}>
                        </div>
                        
                        <div class="tg-checkout-field" id="tgCheckoutPickupField" style="display: ${this.deliveryType === 'pickup' ? 'flex' : 'none'};">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <input type="text" id="tgCheckoutPickup" placeholder="Пункт выдачи KontoraStore_Bot" ${this.deliveryType === 'pickup' ? 'required' : ''}>
                        </div>
                    </form>
                    
                    <button class="tg-checkout-contact-btn" id="tgCheckoutContactBtn">
                        Связаться с продавцом
                    </button>
                    
                    <div class="tg-checkout-agreement">
                        Продолжая оформление заказа, вы соглашаетесь с
                        <a href="#" class="tg-checkout-agreement-link">Политикой обработки персональных данных</a>
                    </div>
                    
                    <button class="tg-checkout-submit-btn" id="tgCheckoutSubmitBtn">
                        Оформить заказ
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', pageHTML);
        this.page = document.getElementById('tgCheckoutPage');
    }

    setupEventListeners() {
        const backBtn = this.page.querySelector('.tg-checkout-page-back');
        backBtn.addEventListener('click', () => this.close());
        
        // Delivery type toggle
        this.page.querySelectorAll('.tg-checkout-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.setDeliveryType(type);
            });
        });
        
        // Form submit
        const submitBtn = document.getElementById('tgCheckoutSubmitBtn');
        submitBtn.addEventListener('click', () => this.submitOrder());
        
        // Contact seller button
        const contactBtn = document.getElementById('tgCheckoutContactBtn');
        contactBtn.addEventListener('click', () => this.contactSeller());
        
        // Load user data from Telegram if available
        this.loadUserData();
    }

    loadUserData() {
        if (window.telegramWebApp && window.telegramWebApp.isTelegram) {
            const user = window.telegramWebApp.getUserData();
            if (user) {
                // Pre-fill phone if available
                const phoneInput = document.getElementById('tgCheckoutPhone');
                if (phoneInput && user.phone_number) {
                    phoneInput.value = '+' + user.phone_number;
                }
            }
        }
    }

    setDeliveryType(type) {
        this.deliveryType = type;
        
        // Update toggle buttons
        this.page.querySelectorAll('.tg-checkout-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Show/hide fields
        const cityField = document.getElementById('tgCheckoutCityField');
        const pickupField = document.getElementById('tgCheckoutPickupField');
        const cityInput = document.getElementById('tgCheckoutCity');
        const pickupInput = document.getElementById('tgCheckoutPickup');
        
        if (type === 'delivery') {
            cityField.style.display = 'flex';
            pickupField.style.display = 'none';
            cityInput.required = true;
            pickupInput.required = false;
        } else {
            cityField.style.display = 'none';
            pickupField.style.display = 'flex';
            cityInput.required = false;
            pickupInput.required = true;
        }
    }

    open() {
        this.page.style.display = 'block';
        this.loadUserData();
        
        // Show back button in Telegram
        if (window.telegramWebApp && window.telegramWebApp.isTelegram) {
            window.telegramWebApp.tg.BackButton.onClick(() => {
                this.close();
            });
            window.telegramWebApp.showBackButton();
        }
        
        // Haptic feedback
        if (window.telegramWebApp) {
            window.telegramWebApp.hapticFeedback('impact');
        }
    }

    close() {
        this.page.style.display = 'none';
        
        // Show cart footer again when closing checkout (if cart has items)
        if (window.telegramCart && window.telegramCart.items && window.telegramCart.items.length > 0) {
            const footer = document.getElementById('tgCartFooter');
            if (footer) {
                footer.style.display = 'block';
            }
        }
        
        // Hide back button in Telegram
        if (window.telegramWebApp && window.telegramWebApp.isTelegram) {
            window.telegramWebApp.hideBackButton();
            
            // Restore back button for cart page
            if (window.telegramCartPage && window.telegramCartPage.page && window.telegramCartPage.page.style.display !== 'none') {
                window.telegramWebApp.tg.BackButton.onClick(() => {
                    window.telegramCartPage.close();
                });
                window.telegramWebApp.showBackButton();
            } else {
                window.telegramWebApp.setupBackButton();
            }
        }
    }

    async submitOrder() {
        const form = document.getElementById('tgCheckoutForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form data
        const orderData = {
            fullName: document.getElementById('tgCheckoutFullName').value.trim(),
            phone: document.getElementById('tgCheckoutPhone').value.trim(),
            comment: document.getElementById('tgCheckoutComment').value.trim(),
            deliveryType: this.deliveryType,
            city: this.deliveryType === 'delivery' ? document.getElementById('tgCheckoutCity').value.trim() : null,
            pickupPoint: this.deliveryType === 'pickup' ? document.getElementById('tgCheckoutPickup').value.trim() : null,
            items: window.telegramCart.items.map(item => ({
                productId: item.productId,
                productName: item.product.name,
                size: item.size,
                quantity: item.quantity,
                price: window.telegramCart && typeof window.telegramCart.getItemUnitPrice === 'function'
                    ? window.telegramCart.getItemUnitPrice(item)
                    : item.price
            })),
            total: window.telegramCart.getTotal()
        };
        
        // Get user info from Telegram
        let username = 'Не указан';
        if (window.telegramWebApp && window.telegramWebApp.isTelegram) {
            const user = window.telegramWebApp.getUserData();
            if (user) {
                if (user.username) {
                    username = '@' + user.username;
                } else if (user.first_name) {
                    username = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                } else {
                    username = 'Пользователь Telegram';
                }
            }
        }
        
        orderData.username = username;
        
        // Show loading
        const submitBtn = document.getElementById('tgCheckoutSubmitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            // Send order to server
            const response = await fetch('/api/telegram/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit order');
            }
            
            // Clear cart
            window.telegramCart.clear();
            
            // Show success
            if (window.telegramWebApp) {
                window.telegramWebApp.showNotification('Заказ успешно оформлен!');
                window.telegramWebApp.hapticFeedback('success');
            }
            
            // Close checkout and cart
            this.close();
            if (window.telegramCartPage) {
                window.telegramCartPage.close();
            }
            
            // Navigate to home
            if (window.telegramNavigation) {
                window.telegramNavigation.showPage('home');
            }
            
        } catch (error) {
            console.error('Error submitting order:', error);
            if (window.telegramWebApp) {
                window.telegramWebApp.showNotification('Ошибка при оформлении заказа');
                window.telegramWebApp.hapticFeedback('error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async contactSeller() {
        try {
            // Get telegram settings
            const settings = await this.getTelegramSettings();
            
            // Get cart items
            const cartItems = window.telegramCart ? window.telegramCart.items : [];
            
            if (cartItems.length === 0) {
                if (window.telegramWebApp) {
                    window.telegramWebApp.showNotification('Корзина пуста');
                }
                return;
            }
            
            // Build message (без строки "Итого")
            let message = 'Здравствуйте! Заинтересовал данный товар:\n\n';
            cartItems.forEach((item, index) => {
                const product = item.product;
                const sizeText = item.size ? ` (Размер: ${item.size})` : '';
                const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
                const unitPrice = window.telegramCart && typeof window.telegramCart.getItemUnitPrice === 'function'
                    ? window.telegramCart.getItemUnitPrice(item)
                    : item.price;
                const price = this.formatPrice(unitPrice * (item.quantity || 1));
                
                message += `${index + 1}. ${product.name}${sizeText}${quantityText} - ${price}\n`;
                
                const imageUrl = this.getProductImageUrl(product);
                if (imageUrl) {
                    message += `Фото товара: ${imageUrl}`;
                }
                if (index < cartItems.length - 1) {
                    message += '\n\n';
                }
            });
            
            // Encode message for URL
            const encodedMessage = encodeURIComponent(message);
            
            // Create Telegram URL
            const telegramUrl = `https://t.me/${settings.telegramUsername}?text=${encodedMessage}`;
            
            // Open Telegram in new tab
            window.open(telegramUrl, '_blank');
            
            // Haptic feedback
            if (window.telegramWebApp) {
                window.telegramWebApp.hapticFeedback('impact');
            }
        } catch (error) {
            console.error('Error contacting seller:', error);
            // Fallback to default
            const defaultUrl = 'https://t.me/pravitelstvo_russian';
            window.open(defaultUrl, '_blank');
        }
    }

    getProductImageUrl(product) {
        let url = product.image || '';
        if (!url && product.images && product.images.length > 0) {
            const first = product.images[0];
            url = typeof first === 'string' ? first : (first.url || first.data || '');
        }
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const base = window.location.origin;
        return url.startsWith('/') ? base + url : base + '/' + url;
    }

    async getTelegramSettings() {
        try {
            // Try to get settings from localStorage first
            const savedSettings = localStorage.getItem('telegram_settings');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
            
            // Default settings
            return {
                telegramUsername: 'pravitelstvo_russian'
            };
        } catch (error) {
            console.error('Error getting telegram settings:', error);
            return {
                telegramUsername: 'pravitelstvo_russian'
            };
        }
    }

    formatPrice(price) {
        if (!price) return '0 ₽';
        const numPrice = typeof price === 'string' ? parseInt(price.replace(/\s/g, '')) : price;
        return numPrice.toLocaleString('ru-RU') + ' ₽';
    }
}

// Initialize checkout
let telegramCheckout = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        telegramCheckout = new TelegramCheckout();
        window.TelegramCheckout = TelegramCheckout;
        window.telegramCheckout = telegramCheckout;
    });
} else {
    telegramCheckout = new TelegramCheckout();
    window.TelegramCheckout = TelegramCheckout;
    window.telegramCheckout = telegramCheckout;
}
