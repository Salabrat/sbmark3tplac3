// Load Hero Content for All Users
(function() {
    'use strict';
    
    // Load saved hero content
    async function loadHeroContent() {
        try {
            const response = await fetch('/api/hero-content');
            if (!response.ok) {
                console.error('Failed to fetch hero content');
                return;
            }
            
            const content = await response.json();
            console.log('Loaded hero content:', content);
            
            // Update hero title
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle && content.title) {
                heroTitle.innerHTML = content.title;
                console.log('Updated hero title:', content.title);
            }
            
            // Update hero subtitle
            const heroSubtitle = document.querySelector('.hero-subtitle');
            if (heroSubtitle && content.subtitle) {
                heroSubtitle.textContent = content.subtitle;
                console.log('Updated hero subtitle:', content.subtitle);
            }
            
            // Update button text - try multiple selectors
            const heroButton = document.querySelector('[data-text-id="hero-btn"]') || 
                             document.querySelector('.hero-content .btn') || 
                             document.querySelector('.hero .btn-white');
            if (heroButton && content.buttonText) {
                heroButton.textContent = content.buttonText;
                console.log('Updated hero button text:', content.buttonText);
            } else if (!heroButton) {
                console.error('Hero button not found!');
            }
            
            // Update background image
            const heroSection = document.querySelector('.hero, .hero-section');
            const heroImg = document.querySelector('.hero-image img, .hero img, .hero-background');
            
            if (content.backgroundImage) {
                // Check if it's a full URL or a relative path
                let imageUrl = content.backgroundImage;
                
                // If it starts with /uploads/, use it as is
                if (imageUrl.startsWith('/uploads/')) {
                    imageUrl = window.location.origin + imageUrl;
                }
                // If it's a full URL (http/https), use it as is
                else if (!imageUrl.startsWith('http')) {
                    // Assume it's relative to the current domain
                    imageUrl = window.location.origin + '/' + imageUrl;
                }
                
                // Update background image on section
                if (heroSection) {
                    heroSection.style.backgroundImage = `url('${imageUrl}')`;
                }
                
                // Update img src if exists
                if (heroImg) {
                    heroImg.src = imageUrl;
                    heroImg.alt = content.title ? content.title.replace(/<br>/g, ' ') : 'Hero Image';
                }
            }
            
            console.log('Hero content loaded successfully');
        } catch (error) {
            console.error('Error loading hero content:', error);
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeroContent);
    } else {
        loadHeroContent();
    }
})();
