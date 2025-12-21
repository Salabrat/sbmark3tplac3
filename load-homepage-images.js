// Load saved homepage images for all users
(function() {
    'use strict';
    
    // Image mapping for homepage sections
    const imageMapping = {
        hero: '.hero-section .hero-image img',
        campaign1: '.campaign-content-wrapper .campaign-image img',
        campaign2: '.campaign-split .campaign-split-image img',
        campaign3: '.campaign-split-reverse .campaign-split-image img',
        about1: '.about-item:nth-child(1) .about-item-image img',
        about2: '.about-item:nth-child(2) .about-item-image img'
    };
    
    // Load saved images
    async function loadHomepageImages() {
        try {
            const response = await fetch('/api/homepage-images');
            if (!response.ok) {
                console.warn('Could not load homepage images');
                return;
            }
            
            const images = await response.json();
            
            // Update images on page
            Object.entries(images).forEach(([key, url]) => {
                if (url && imageMapping[key]) {
                    const img = document.querySelector(imageMapping[key]);
                    if (img) {
                        // Save original src as fallback
                        if (!img.dataset.originalSrc) {
                            img.dataset.originalSrc = img.src;
                        }
                        
                        // Update image source
                        img.src = url;
                        
                        // Handle error - fallback to original
                        img.onerror = function() {
                            if (this.dataset.originalSrc && this.src !== this.dataset.originalSrc) {
                                console.warn(`Failed to load image for ${key}, using fallback`);
                                this.src = this.dataset.originalSrc;
                            }
                        };
                    }
                }
            });
            
            console.log('Homepage images loaded successfully');
        } catch (error) {
            console.error('Error loading homepage images:', error);
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHomepageImages);
    } else {
        loadHomepageImages();
    }
    
    // Also reload on visibility change (for SPA navigation)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadHomepageImages();
        }
    });
    
    // Export for global access
    window.loadHomepageImages = loadHomepageImages;
})();
