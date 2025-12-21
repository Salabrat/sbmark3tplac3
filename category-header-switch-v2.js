/**
 * Category Header Switch V2 - улучшенная версия с точным позиционированием
 */

(function() {
    'use strict';
    
    // Полностью отключаем этот скрипт: используем более простую логику initStickyShopControls
    if (typeof window !== 'undefined') {
        console.log('Category Header Switch V2 disabled (using initStickyShopControls instead)');
        return;
    }
    
    function initHeaderSwitch() {
        // Проверяем, что мы на нужной странице
        const pathname = window.location.pathname;
        const isTargetPage = (pathname.includes('category-') || pathname.includes('shop-all')) && pathname.includes('.html');
        
        if (!isTargetPage) {
            return;
        }
        
        console.log('Header switch V2 initializing...');
        
        // Находим элементы
        const topBar = document.querySelector('.top-bar');
        const header = document.querySelector('.header');
        const shopControls = document.querySelector('.shop-controls');
        
        if (!shopControls || !header) {
            console.warn('Required elements not found, retrying...');
            setTimeout(initHeaderSwitch, 100);
            return;
        }
        
        // Создаем обертку для фиксированного позиционирования если её нет
        let fixedWrapper = document.querySelector('.fixed-controls-wrapper');
        if (!fixedWrapper) {
            fixedWrapper = document.createElement('div');
            fixedWrapper.className = 'fixed-controls-wrapper';
            fixedWrapper.style.cssText = `
                position: fixed;
                top: -100px;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 9999;
                transition: top 0.3s ease-out;
                pointer-events: none;
            `;
            document.body.appendChild(fixedWrapper);
        }
        
        // Клонируем shop-controls для фиксированной версии
        const fixedControls = shopControls.cloneNode(true);
        fixedControls.className = 'shop-controls-fixed';
        fixedControls.style.cssText = `
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-bottom: 1px solid #e0e0e0;
            padding: 15px 20px;
            pointer-events: auto;
        `;
        fixedWrapper.appendChild(fixedControls);
        
        // Синхронизируем события между оригинальными и клонированными контролами
        const syncControls = () => {
            // Синхронизация фильтров
            const originalFilter = shopControls.querySelector('#filterBtn');
            const fixedFilter = fixedControls.querySelector('#filterBtn');
            
            if (originalFilter && fixedFilter) {
                fixedFilter.onclick = (e) => {
                    e.preventDefault();
                    originalFilter.click();
                };
            }
            
            // Синхронизация view controls
            const originalViews = shopControls.querySelectorAll('.view-btn');
            const fixedViews = fixedControls.querySelectorAll('.view-btn');
            
            fixedViews.forEach((btn, index) => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    if (originalViews[index]) {
                        originalViews[index].click();
                    }
                };
            });
        };
        
        syncControls();
        
        // Переменные для отслеживания
        const topBarHeight = topBar ? topBar.offsetHeight : 0;
        const headerHeight = header.offsetHeight;
        const totalHeaderHeight = topBarHeight + headerHeight;
        const shopControlsTop = shopControls.getBoundingClientRect().top + window.pageYOffset;
        
        let lastScrollY = 0;
        let isHeaderHidden = false;
        let ticking = false;
        
        // Функция обработки скролла
        function updateScroll() {
            const currentScrollY = window.pageYOffset;
            const scrollDiff = currentScrollY - lastScrollY;
            
            // Скролл вниз
            if (scrollDiff > 0 && currentScrollY > 80) {
                if (!isHeaderHidden) {
                    isHeaderHidden = true;
                    
                    // Скрываем headers
                    if (topBar) {
                        topBar.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            z-index: 1002;
                            transform: translateY(-100%);
                            transition: transform 0.3s ease-out;
                        `;
                    }
                    
                    header.style.cssText = `
                        position: fixed;
                        top: ${topBarHeight}px;
                        left: 0;
                        right: 0;
                        z-index: 1001;
                        transform: translateY(-${headerHeight + topBarHeight}px);
                        transition: transform 0.3s ease-out;
                    `;
                }
                
                // Показываем фиксированные controls
                if (currentScrollY >= shopControlsTop - 20) {
                    fixedWrapper.style.top = '0';
                    shopControls.style.opacity = '0';
                }
            }
            // Скролл вверх
            else if (scrollDiff < 0) {
                if (currentScrollY < shopControlsTop - totalHeaderHeight - 20) {
                    // Показываем headers
                    if (isHeaderHidden) {
                        isHeaderHidden = false;
                        
                        if (topBar) {
                            topBar.style.transform = 'translateY(0)';
                        }
                        header.style.transform = 'translateY(0)';
                        
                        setTimeout(() => {
                            if (!isHeaderHidden) {
                                if (topBar) {
                                    topBar.style.cssText = '';
                                }
                                header.style.cssText = '';
                            }
                        }, 300);
                    }
                    
                    // Скрываем фиксированные controls
                    fixedWrapper.style.top = '-100px';
                    shopControls.style.opacity = '1';
                }
            }
            
            // В самом верху
            if (currentScrollY <= 5) {
                isHeaderHidden = false;
                
                if (topBar) {
                    topBar.style.cssText = '';
                }
                header.style.cssText = '';
                
                fixedWrapper.style.top = '-100px';
                shopControls.style.opacity = '1';
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        // Оптимизированный обработчик
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(updateScroll);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Начальная проверка
        updateScroll();
        
        console.log('Header switch V2 initialized');
    }
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderSwitch);
    } else {
        initHeaderSwitch();
    }
})();
