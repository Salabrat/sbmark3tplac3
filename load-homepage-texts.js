// Load saved homepage texts for all users
(function() {
    'use strict';

    // Text mapping for homepage sections with proper selectors
    const textMapping = [
        // Hero section
        { selector: '.hero-title', path: 'hero.title', isHtml: true },
        { selector: '.hero-subtitle', path: 'hero.subtitle', isHtml: false },
        
        // Campaign 1 (FW025 ADV)
        { selector: '.campaign-dark .campaign-label', path: 'campaign1.label', isHtml: false },
        { selector: '.campaign-dark .campaign-title', path: 'campaign1.title', isHtml: true },
        { selector: '.campaign-dark .campaign-description', path: 'campaign1.description', isHtml: false },
        
        // Campaign 2 (Puffer)
        { selector: '.campaign-split:not(.campaign-split-reverse) .campaign-label', path: 'campaign2.label', isHtml: false },
        { selector: '.campaign-split:not(.campaign-split-reverse) .campaign-title', path: 'campaign2.title', isHtml: true },
        { selector: '.campaign-split:not(.campaign-split-reverse) .campaign-description', path: 'campaign2.description', isHtml: false },
        
        // Campaign 3 (Metropolis)
        { selector: '.campaign-split-reverse .campaign-label', path: 'campaign3.label', isHtml: false },
        { selector: '.campaign-split-reverse .campaign-title', path: 'campaign3.title', isHtml: true },
        { selector: '.campaign-split-reverse .campaign-description', path: 'campaign3.description', isHtml: false },
        
        // About section
        { selector: '.about-title', path: 'about.title', isHtml: false },
        { selector: '.about-text', path: 'about.text', isHtml: false }
    ];

    // Load saved texts
    async function loadHomepageTexts() {
        try {
            const response = await fetch('/api/homepage-texts');
            if (!response.ok) {
                console.warn('Could not load homepage texts');
                return;
            }

            const texts = await response.json();

            // Clean any button HTML from loaded texts
            const cleanContent = (content) => {
                if (typeof content !== 'string') return content;
                // Remove any edit button HTML that might have been saved
                return content.replace(/<button[^>]*class="admin-edit-btn"[^>]*>.*?<\/button>/gi, '');
            };

            // Update texts on page
            textMapping.forEach(({ selector, path, isHtml }) => {
                const element = document.querySelector(selector);
                if (element) {
                    const value = getNestedValue(texts, path);
                    if (value !== undefined && value !== null && value !== '') {
                        // Clean the content
                        const cleanedValue = cleanContent(value);
                        
                        // Save original content as fallback
                        if (!element.dataset.originalContent) {
                            element.dataset.originalContent = element.innerHTML;
                        }

                        // Update content based on type
                        if (isHtml) {
                            element.innerHTML = cleanedValue;
                        } else {
                            element.textContent = cleanedValue;
                        }
                    }
                }
            });

            console.log('Homepage texts loaded successfully');
        } catch (error) {
            console.error('Error loading homepage texts:', error);
        }
    }

    // Get nested object value by dot notation path
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHomepageTexts);
    } else {
        loadHomepageTexts();
    }

    // Also reload on visibility change (for SPA navigation)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadHomepageTexts();
        }
    });

    // Export for global access
    window.loadHomepageTexts = loadHomepageTexts;
})();
