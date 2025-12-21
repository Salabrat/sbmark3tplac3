// Simple Sticky Swap - Простая и надежная анимация замены меню и фильтров
(function() {
    'use strict';
    
    // Определяем, на какой странице мы находимся
    let path = '';
    try {
        if (typeof window !== 'undefined' && window.location && window.location.pathname) {
            path = window.location.pathname;
        }
    } catch (e) {}

    const isCategoryPage = path.includes('category-') || path.includes('shop-all');

    // На страницах категорий и shop-all полностью отключаем simple-sticky-swap,
    // чтобы не конфликтовать с более простой логикой initStickyShopControls
    if (isCategoryPage) {
        console.log('Simple Sticky Swap: disabled on category / shop-all page');
        return;
    }

    // Полностью отключаем все старые sticky функции на остальных страницах
    window.initStickyShopControls = function() {};
    window.smoothStickyControls = null;
    window.advancedStickyAnimation = null;
    window.fixedStickyAnimation = null;
    window.CategoryStickyNavigation = function() { return { init: function() {} }; };
    
    // Отключаем другие sticky скрипты
    if (window.CategoryStickyNavigation) {
        window.CategoryStickyNavigation.prototype.init = function() {};
    }
    
    // Флаг инициализации
    let isInitialized = false;
    
    // Конфигурация
    const CONFIG = {
        startScroll: 50,      // Когда начинать отслеживание взаимодействия (px)
        swapDistance: 150,    // Расстояние для полной замены (px)
        headerFadeStart: 100, // Когда header начинает исчезать
        controlsFixPoint: 120 // Когда controls становятся fixed
    };
    
    // Элементы
    let header = null;
    let controls = null;
    let placeholder = null;
    let topBarHeight = 0;
    
    // Состояние
    let lastScroll = 0;
    let headerOriginalHeight = 0;
    let controlsOriginalTop = 0;
    let isSwapped = false;
    
    function init() {
        // Предотвращаем повторную инициализацию
        if (isInitialized) return;
        
        console.log('Инициализация simple-sticky-swap...');
        
        // БЕЗОПАСНО находим элементы с проверками
        try {
            header = document.querySelector('.header');
            if (!header) {
                // Пробуем альтернативные селекторы
                header = document.querySelector('.header-container') || document.querySelector('header');
            }
            
            // Также ищем top-bar, если он есть
            const topBar = document.querySelector('.top-bar');
            if (topBar && !header) {
                header = topBar.closest('.header-container') || topBar.parentElement;
            }
            
            topBarHeight = topBar ? (topBar.offsetHeight || 0) : 0;
            
            console.log('Header найден:', header);
            
            controls = document.querySelector('.shop-controls');
            if (!controls) {
                // Пробуем альтернативные селекторы для фильтров
                controls = document.querySelector('.filter-bar') || document.querySelector('.filters');
            }
            console.log('Controls найден:', controls);
            
            // КРИТИЧЕСКАЯ ПРОВЕРКА - элементы обязательны
            if (!header || !controls) {
                console.warn('Simple Sticky Swap: Required elements not found - ОТКЛЮЧАЕМ СКРИПТ');
                console.warn('Header:', header, 'Controls:', controls);
                return;
            }
        } catch (err) {
            console.error('Ошибка при поиске элементов:', err);
            return;
        }
        
        // Удаляем старые классы и стили
        cleanupOldStyles();
        
        // Создаем placeholder
        createPlaceholder();
        
        // Сохраняем исходные размеры
        saveOriginalDimensions();
        
        // Добавляем стили
        injectStyles();
        
        // Добавляем обработчик скролла
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        
        isInitialized = true;
        console.log('Simple Sticky Swap initialized');
        console.log('Header element:', header);
        console.log('Controls element:', controls);
        console.log('Original controls top:', controlsOriginalTop);
    }
    
    function cleanupOldStyles() {
        // Удаляем все старые sticky классы
        if (controls) {
            controls.classList.remove('sticky', 'fixed', 'swapped', 'swapping', 'filter-bar-sticky');
            controls.style.cssText = ''; // Полная очистка всех inline стилей
        }
        
        if (header) {
            header.classList.remove('sliding', 'hidden', 'navbar-hidden');
            header.style.cssText = ''; // Полная очистка всех inline стилей
        }
        
        // Отключаем все другие observers и события
        document.removeEventListener('scroll', window.otherStickyHandler || function(){});
        
        // Удаляем старые placeholder элементы
        document.querySelectorAll('.shop-controls-placeholder, .controls-placeholder, .controls-placeholder-fixed, .sentinel').forEach(el => {
            if (el) el.remove();
        });
        
        // Удаляем старые стили
        const oldStyles = document.querySelectorAll('style[id*="sticky"], style[id*="category-navigation"]');
        oldStyles.forEach(style => {
            if (style.id !== 'simple-sticky-swap-styles') {
                style.remove();
            }
        });
    }
    
    function createPlaceholder() {
        try {
            if (!controls || !controls.parentNode) {
                console.warn('Не могу создать placeholder - controls не найден или нет родителя');
                return;
            }
            
            placeholder = document.createElement('div');
            placeholder.className = 'simple-controls-placeholder';
            placeholder.style.display = 'none';
            placeholder.style.height = '0';
            controls.parentNode.insertBefore(placeholder, controls.nextSibling);
            console.log('Placeholder создан успешно');
        } catch (err) {
            console.error('Ошибка создания placeholder:', err);
        }
    }
    
    function saveOriginalDimensions() {
        if (!header || !controls) {
            console.log('Elements not found, retrying...');
            setTimeout(saveOriginalDimensions, 200);
            return;
        }
        
        headerOriginalHeight = header.offsetHeight;
        const rect = controls.getBoundingClientRect();
        controlsOriginalTop = rect.top + window.pageYOffset;
        
        console.log('Saved dimensions:', {
            headerHeight: headerOriginalHeight,
            controlsTop: controlsOriginalTop
        });
        
        // Проверка корректности
        if (controlsOriginalTop <= 100 || headerOriginalHeight <= 0) {
            console.log('Invalid dimensions, retrying...');
            setTimeout(saveOriginalDimensions, 300);
            return;
        }
        
        console.log('Dimensions saved successfully');
    }
    
    // Интервал логирования, чтобы не захламлять консоль
    let lastLogTime = 0;
    const LOG_THROTTLE = 1000; // Логируем не чаще чем раз в секунду
    
    function handleScroll() {
        // Базовые проверки безопасности
        if (!header || !controls || !isInitialized) {
            return;
        }

        const scrollY = window.pageYOffset;

        // Если по какой-то причине ещё не сохранили корректные размеры - пробуем ещё раз
        if (!controlsOriginalTop || controlsOriginalTop <= 0) {
            saveOriginalDimensions();
        }

        // Текущая высота header и эффективная высота для расчёта точки переключения
        const currentHeaderRect = header.getBoundingClientRect();
        const currentHeaderHeight = currentHeaderRect && currentHeaderRect.height ? currentHeaderRect.height : 0;
        const effectiveHeaderHeight = headerOriginalHeight || currentHeaderHeight || 0;

        const stickyTop = topBarHeight || 0;

        // Точка, когда НИЗ header достигает ВЕРХА фильтр-бара
        const switchPoint = Math.max(0, controlsOriginalTop - (effectiveHeaderHeight + stickyTop));

        // Ограниченное логирование
        const now = Date.now();
        if (now - lastLogTime > LOG_THROTTLE) {
            console.log('Позиция скролла:', scrollY, 'Высота header:', effectiveHeaderHeight, 'Позиция controls:', controlsOriginalTop, 'Точка переключения:', switchPoint);
            lastLogTime = now;
        }

        // 1. До того, как низ header дошёл до фильтр-бара - header sticky (всегда видим сверху)
        if (scrollY < switchPoint - 5) { // небольшой буфер, чтобы избежать дёрганий
            // Только при переходе из компактного режима обратно в обычный
            if (isSwapped) {
                console.log('Возврат в sticky режим - header всегда видим');
                makeStickyHeader();
            }
            lastScroll = scrollY;
            return;
        }

        // 2. Когда низ header встретился с фильтр-баром - включаем компактный фиксированный режим
        // Вызываем fixElements только при первом входе в компактный режим
        if (!isSwapped) {
            console.log('Достигли точки стыка header и фильтр-бара - компактный режим');
            fixElements(scrollY);
        }
        lastScroll = scrollY;
    }
    
    function resetElements() {
        // Просто вызываем нашу новую функцию сброса
        resetAllStyles();
    }
    
    // НОВАЯ ФУНКЦИЯ: делает header sticky (всегда видимым сверху)
    function makeStickyHeader() {
        try {
            if (!header) return;
            
            isSwapped = false; // Еще не в компактном режиме
            
            const stickyTop = topBarHeight || 0;
            
            // Header остается sticky - всегда видим сверху, но с полной высотой
            header.style.cssText = `
                position: sticky !important;
                top: ${stickyTop}px !important;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 1001;
                background: white;
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            `;
            
            // В sticky режиме - скрываем только мега-меню, но не ограничиваем размеры
            const allMenus = header.querySelectorAll('.mega-menu, .mega-menu-content, .mega-menu-tab-content, #main-content');
            allMenus.forEach(menu => {
                menu.style.display = 'none'; // Просто скрываем мега-меню
            });
            
            // НЕ ограничиваем размеры навигационных элементов в sticky режиме
            const navElements = header.querySelectorAll('.header-wrapper, .main-nav, .nav-list');
            navElements.forEach(el => {
                if (el) {
                    el.style.height = '';
                    el.style.maxHeight = '';
                    el.style.overflow = '';
                }
            });
            
            header.classList.add('simple-sticky');
            header.classList.remove('simple-fixed');
            
            // Controls остаются в естественном положении
            if (controls) {
                controls.style.cssText = '';
                controls.style.position = '';
                controls.style.top = '';
                controls.classList.remove('simple-fixed', 'simple-sticky');
            }
            
            // Скрываем placeholder
            if (placeholder) {
                placeholder.style.display = 'none';
                placeholder.style.height = '0';
            }
            
            document.body.classList.remove('simple-swap-complete');
            document.body.classList.add('simple-sticky-active');
            
        } catch (err) {
            console.error('Ошибка в makeStickyHeader:', err);
        }
    }
    
    function resetAllStyles() {
        console.log('Сбрасываем все стили - БЕЗОПАСНО');
        isSwapped = false;
        
        try {
            // БЕЗОПАСНЫЙ сброс header - возвращаем к ЕСТЕСТВЕННОМУ скроллингу
            if (header) {
                // Полностью сбрасываем все принудительные стили
                header.style.cssText = '';
                header.style.position = 'static'; // Естественное позиционирование
                header.style.top = '';
                header.style.height = '';
                header.style.maxHeight = '';
                header.style.overflow = '';
                header.style.opacity = '1';
                header.classList.remove('simple-hidden', 'simple-sliding', 'simple-fixed');
                
                // Восстанавливаем все меню в ОБЫЧНОМ состоянии (но не показываем мега-меню)
                const allMenus = header.querySelectorAll('.mega-menu, .dropdown, .sub-menu, .mega-menu-tab-content');
                allMenus.forEach(menu => {
                    // Возвращаем естественные стили, но мега-меню остается скрытым по умолчанию
                    menu.style.cssText = '';
                    if (menu.classList.contains('mega-menu') || menu.classList.contains('mega-menu-content')) {
                        menu.style.display = 'none'; // Мега-меню скрыто по умолчанию
                    }
                });
                
                // Восстанавливаем компоненты навигации к естественному состоянию
                const compactElements = header.querySelectorAll('.header-wrapper, .main-nav, .nav-list');
                compactElements.forEach(el => {
                    if (el) {
                        el.style.cssText = '';
                        // Убираем принудительные ограничения высоты
                        el.style.height = '';
                        el.style.maxHeight = '';
                        el.style.overflow = '';
                    }
                });
            }
            
            // БЕЗОПАСНЫЙ сброс controls - с проверками
            if (controls) {
                controls.style.cssText = '';
                controls.style.position = '';
                controls.style.top = '';
                controls.classList.remove('simple-fixed', 'simple-sticky');
            }
            
            // БЕЗОПАСНОЕ скрытие placeholder
            if (placeholder) {
                placeholder.style.display = 'none';
                placeholder.style.height = '0';
            }
            
            // Убираем классы с body
            document.body.classList.remove('simple-swap-active', 'simple-swap-complete');
            
        } catch (err) {
            console.error('Ошибка при сбросе стилей:', err);
        }
    }
    
    // Для совместимости со старым кодом сохраняем имена функций
    function performPushAnimation() {
        // Вызываем новую функцию
        fixElements(window.pageYOffset);
    }
    
    function completeSwap() {
        // Вызываем новую функцию
        fixElements(window.pageYOffset);
    }
    
    function performReverseAnimation() {
        // Вызываем новую функцию
        fixElements(window.pageYOffset);
    }
    
    function fixHeaderAtFilterBarPosition() {
        // Вызываем новую функцию
        fixElements(window.pageYOffset);
    }
    
    // ДУБЛИРУЮЩАЯСЯ ФУНКЦИЯ УДАЛЕНА - ИСПОЛЬЗУЕМ ЕДИНУЮ resetAllStyles
    
    // СУПЕР ПРОСТАЯ ФУНКЦИЯ ФИКСАЦИИ ЭЛЕМЕНТОВ - HEADER ВСЕГДА СВЕРХУ И ВИДЕН
    function fixElements(scrollY) {
        // Проверка на безопасность
        if (!header || !controls || !isInitialized) return;
        
        try {
            // Фиксируем элементы
            const now = Date.now();
            if (now - lastLogTime > LOG_THROTTLE) {
                console.log('Фиксируем элементы при скролле:', scrollY);
            }
            
            isSwapped = true;
            
            const stickyTop = topBarHeight || 0;
            
            // Безопасно получаем размеры header
            const headerHeight = header.getBoundingClientRect ? header.getBoundingClientRect().height : header.offsetHeight;
            if (!headerHeight || headerHeight <= 0) {
                console.log('Ошибка: нулевая высота header');
                return;
            }
            
            // ЖЕСТКО ОГРАНИЧИВАЕМ ВЫСОТУ HEADER!
            header.style.cssText = `
                position: fixed; 
                top: ${stickyTop}px; 
                left: 0; 
                right: 0; 
                width: 100%; 
                height: 60px !important; /* ЖЕСТКО ОГРАНИЧИВАЕМ ВЫСОТУ! */
                max-height: 60px !important; /* МАКСИМУМ ВЫСОТА! */
                overflow: hidden !important; /* СКРЫВАЕМ ВСЕ ЛИШНЕЕ! */
                z-index: 1001; 
                background: white; 
                opacity: 1; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                display: block !important;
                visibility: visible !important;
            `;
            
            // МАКСИМАЛЬНО АГРЕССИВНО СКРЫВАЕМ ВСЕ МЕГА-МЕНЮ И КОНТЕНТ
            const allMenus = header.querySelectorAll(`
                .mega-menu, 
                .dropdown, 
                .sub-menu, 
                .mega-menu-tab-content,
                #main-content,
                .mega-menu-content,
                .mega-menu-columns,
                .mega-menu-column,
                .mega-menu-tabs,
                [id*="content"]
            `);
            
            if (allMenus && allMenus.length > 0) {
                allMenus.forEach(menu => {
                    menu.style.cssText = `
                        display: none !important; 
                        height: 0 !important; 
                        max-height: 0 !important;
                        min-height: 0 !important;
                        overflow: hidden !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        position: absolute !important;
                        left: -9999px !important;
                        top: -9999px !important;
                        z-index: -1 !important;
                    `;
                });
            }
            
            // ПРИНУДИТЕЛЬНО КОМПАКТИМ HEADER-WRAPPER
            const headerWrapper = header.querySelector('.header-wrapper');
            if (headerWrapper) {
                headerWrapper.style.cssText = `
                    height: 60px !important; 
                    max-height: 60px !important; 
                    min-height: 60px !important;
                    overflow: hidden !important; 
                    display: flex !important; 
                    align-items: center !important;
                    justify-content: space-between !important;
                `;
            }
            
            // ПРИНУДИТЕЛЬНО КОМПАКТИМ НАВИГАЦИЮ
            const mainNav = header.querySelector('.main-nav');
            if (mainNav) {
                mainNav.style.cssText = `
                    height: 60px !important; 
                    max-height: 60px !important; 
                    overflow: hidden !important; 
                    display: flex !important; 
                    align-items: center !important;
                `;
            }
            
            // ПРИНУДИТЕЛЬНО КОМПАКТИМ NAV-LIST
            const navList = header.querySelector('.nav-list');
            if (navList) {
                navList.style.cssText = `
                    height: 60px !important; 
                    max-height: 60px !important; 
                    overflow: hidden !important; 
                    display: flex !important; 
                    align-items: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                `;
            }
            header.classList.add('simple-fixed');
            
            // ИСПОЛЬЗУЕМ ФИКСИРОВАННУЮ ВЫСОТУ 60px для всех расчетов
            const compactHeaderHeight = 60;
            const controlsTop = compactHeaderHeight + stickyTop;
            
            // Фиксируем фильтр-бар под компактным header
            controls.style.cssText = `
                position: fixed;
                top: ${controlsTop}px; /* Используем высоту компактного header и top-bar */
                left: 0;
                right: 0;
                width: 100%;
                z-index: 1000;
                background: white;
                display: block;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            `;
            controls.classList.add('simple-fixed');
            
            // Показываем placeholder для сохранения высоты
            if (placeholder) {
                placeholder.style.display = 'block';
                // Используем высоту компактного header и фильтр-бара
                placeholder.style.height = (controls.offsetHeight + compactHeaderHeight) + 'px';
            }
            
            // Применяем класс к body после успешной фиксации
            document.body.classList.add('simple-swap-complete');
        } catch (err) {
            console.error('Ошибка при фиксации элементов:', err);
            
            // Пытаемся восстановиться после ошибки
            try {
                resetAllStyles();
            } catch (e) {}
        }
    }
    
    
    function handleResize() {
        // Пересчитываем размеры при изменении окна
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            topBarHeight = topBar.offsetHeight || 0;
        }
        if (!isSwapped) {
            saveOriginalDimensions();
        }
    }
    
    function injectStyles() {
        const styleId = 'simple-sticky-swap-styles';
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* Simple Sticky Swap Styles */
            /* ГЛОБАЛЬНЫЕ ПРАВИЛА ДЛЯ HEADER */
            .header,
            .header-container,
            .header .menu-bar,
            .menu-bar,
            .top-bar {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                transition: none !important;
            }
            
            /* МЕГА-МЕНЮ СКРЫТО ТОЛЬКО В ФИКСИРОВАННОМ РЕЖИМЕ И ПО УМОЛЧАНИЮ */
            .mega-menu,
            .mega-menu-content,
            .mega-menu-columns,
            .mega-menu-tab-content,
            #main-content {
                display: none !important; /* По умолчанию мега-меню скрыто */
            }
            
            /* В ФИКСИРОВАННОМ РЕЖИМЕ - АГРЕССИВНОЕ СКРЫТИЕ */
            .header[style*="position: fixed"] .mega-menu,
            .header[style*="height: 60px"] .mega-menu,
            .header[style*="max-height: 60px"] .mega-menu,
            .header.simple-fixed .mega-menu,
            .header.simple-fixed .mega-menu-content,
            .header.simple-fixed .mega-menu-columns,
            .header.simple-fixed .mega-menu-tab-content,
            .header.simple-fixed #main-content {
                display: none !important;
                height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                opacity: 0 !important;
                visibility: hidden !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                z-index: -1 !important;
                transform: scale(0) !important;
            }
            
            /* РЕЖИМЫ HEADER */
            
            /* STICKY РЕЖИМ - header всегда видим, но естественной высоты */
            .header.simple-sticky,
            .header[style*="position: sticky"],
            body.simple-sticky-active .header {
                position: sticky !important;
                z-index: 1001 !important;
                background: white !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                /* НЕ ограничиваем высоту в sticky режиме */
            }
            
            /* ФИКСИРОВАННЫЙ КОМПАКТНЫЙ РЕЖИМ - при достижении фильтр-бара */
            .header.simple-fixed,
            .header-container.simple-fixed,
            body.simple-swap-complete .header,
            .header[style*="position: fixed"][style*="height: 60px"] {
                height: 60px !important;
                max-height: 60px !important;
                min-height: 60px !important;
                overflow: hidden !important;
            }
            
            /* МАКСИМАЛЬНО АГРЕССИВНО УБИРАЕМ ВСЕ МЕГА-МЕНЮ */
            .header.simple-fixed .mega-menu,
            .header-container.simple-fixed .mega-menu,
            body.simple-swap-complete .header .mega-menu,
            .header.simple-fixed .dropdown-menu,
            .header.simple-fixed .sub-menu,
            .simple-fixed .mega-menu-tab-content,
            .simple-fixed #main-content,
            .header[style*="position: fixed"] .mega-menu,
            .header[style*="position: fixed"] .dropdown,
            .header[style*="position: fixed"] .mega-menu-content,
            .header[style*="position: fixed"] .mega-menu-columns,
            .header[style*="position: fixed"] .mega-menu-column,
            .header[style*="position: fixed"] .mega-menu-tabs,
            .header[style*="position: fixed"] [id*="content"],
            .header[style*="height: 60px"] .mega-menu,
            .header[style*="height: 60px"] .mega-menu-content,
            .header[style*="height: 60px"] #main-content,
            .header[style*="height: 60px"] .mega-menu-tab-content {
                display: none !important;
                height: 0 !important;
                max-height: 0 !important;
                min-height: 0 !important;
                overflow: hidden !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                z-index: -1 !important;
                transform: scale(0) !important;
            }
            
            /* ПРИНУДИТЕЛЬНО ДЕЛАЕМ НАВИГАЦИЮ КОМПАКТНОЙ */
            .header.simple-fixed .nav-list,
            .header.simple-fixed .header-wrapper,
            .header.simple-fixed .logo,
            .header.simple-fixed .main-nav,
            .header[style*="position: fixed"] .nav-list,
            .header[style*="position: fixed"] .header-wrapper,
            .header[style*="position: fixed"] .logo,
            .header[style*="position: fixed"] .main-nav {
                display: flex !important;
                height: 60px !important;
                max-height: 60px !important;
                min-height: 60px !important;
                overflow: hidden !important;
                align-items: center !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .header {
                /* Основные стили */
                position: relative;
                background: white;
                z-index: 98;
            }
            
            .header.simple-fixed,
            .header.simple-sliding {
                /* Стили для фиксированного состояния */
                background: white;
                width: 100%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .shop-controls {
                transition: none !important;
                will-change: auto;
                background: white;
            }
            
            .shop-controls.simple-sticky {
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            
            .shop-controls.simple-fixed {
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
                background: white;
                width: 100% !important;
            }
            
            /* Фиксированные состояния для эффекта вытеснения */
            .header[style*="position: fixed"],
            .shop-controls[style*="position: fixed"] {
                background: white !important;
                width: 100% !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            /* Анимация удалена */
            
            .simple-controls-placeholder {
                visibility: hidden;
                transition: none;
            }
            
            /* Состояния body */
            body.simple-swap-active {
                /* Можно добавить дополнительные стили */
            }
            
            body.simple-swap-complete .header {
                z-index: 90;
            }
            
            body.simple-swap-complete .shop-controls {
                z-index: 999;
            }
            
            /* Убираем конфликтующие стили */
            .shop-controls.sticky:not(.simple-sticky) {
                position: relative !important;
                top: auto !important;
            }
            
            /* Удалена анимация фильтров */
            .filter-dropdown {
                transition: none;
            }
            
            /* Исправленная мобильная адаптация */
            @media (max-width: 768px) {
                .shop-controls.simple-fixed,
                .shop-controls.simple-sticky {
                    padding: 10px 15px;
                }
                
                /* ИСПРАВЛЕНО: ГАРАНТИРУЕМ ВИДИМОСТЬ ДАЖЕ НА МОБИЛЬНЫХ */
                .header.simple-hidden {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                /* Улучшаем прокрутку на мобильных */
                .shop-controls-fixed-container {
                    padding-top: env(safe-area-inset-top);
                }
            }
            
            /* Удалены стили для плавности */
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // БЕЗОПАСНАЯ инициализация после загрузки DOM
    function safeInit() {
        try {
            console.log('Попытка инициализации simple-sticky-swap...');
            
            // Проверяем готовность DOM
            if (!document.body) {
                console.log('DOM не готов, повторяем через 100ms');
                setTimeout(safeInit, 100);
                return;
            }
            
            // Проверяем наличие основных элементов
            const headerCheck = document.querySelector('.header') || document.querySelector('header');
            const controlsCheck = document.querySelector('.shop-controls') || document.querySelector('.filter-bar');
            
            if (!headerCheck || !controlsCheck) {
                console.log('Основные элементы не найдены, повторяем через 200ms');
                setTimeout(safeInit, 200);
                return;
            }
            
            // Запускаем инициализацию
            init();
        } catch (err) {
            console.error('Критическая ошибка инициализации:', err);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInit);
    } else {
        setTimeout(safeInit, 100);
    }
    
    // API для отладки
    window.simpleStickySwap = {
        init: init,
        reset: function() {
            resetElements();
            window.scrollTo(0, 0);
        },
        getState: function() {
            return {
                isInitialized: isInitialized,
                isSwapped: isSwapped,
                scrollY: window.pageYOffset,
                config: CONFIG
            };
        }
    };
})();
