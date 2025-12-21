// Loading Screen Manager
(function() {
    'use strict';
    
    // Check if we're on the main page (index.html)
    const isMainPage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('index.html') || 
                       window.location.pathname === '/index.html';
    
    if (!isMainPage) {
        return; // Only show loading screen on main page
    }
    
    // Create loading screen HTML
    function createLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.id = 'loadingScreen';
        
        const loadContainer = document.createElement('div');
        loadContainer.id = 'load';
        
        // Create LOADING letters
        const letters = ['L', 'O', 'A', 'D', 'I', 'N', 'G'];
        letters.forEach(letter => {
            const div = document.createElement('div');
            div.textContent = letter;
            loadContainer.appendChild(div);
        });
        
        loadingScreen.appendChild(loadContainer);
        document.body.insertBefore(loadingScreen, document.body.firstChild);
        
        // Make body visible now that loading screen is in place
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }
    
    // Hide loading screen with animation
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            // Add hide class to trigger slide up animation
            loadingScreen.classList.add('hide');
            
            // Add loading-complete class to body
            document.body.classList.add('loading-complete');
            
            // Remove element after animation completes
            setTimeout(() => {
                loadingScreen.remove();
                // Enable body scroll if it was disabled
                document.body.style.overflow = '';
            }, 800); // Match the CSS transition duration
        }
    }
    
    // Initialize loading screen
    function init() {
        // Create loading screen immediately
        createLoadingScreen();
        
        // Temporarily disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Set minimum display time (2.5 seconds) to show the animation
        const minDisplayTime = 2500;
        const startTime = Date.now();
        
        // Wait for page to fully load
        window.addEventListener('load', () => {
            const loadTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDisplayTime - loadTime);
            
            // Hide loading screen after minimum time or when page is loaded
            setTimeout(hideLoadingScreen, remainingTime);
        });
        
        // Fallback: Hide loading screen after 5 seconds max
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen && !loadingScreen.classList.contains('hide')) {
                hideLoadingScreen();
            }
        }, 5000);
    }
    
    // Start loading screen immediately when script loads
    if (document.readyState === 'loading') {
        // DOM is still loading, wait for it
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already loaded
        init();
    }
})();
