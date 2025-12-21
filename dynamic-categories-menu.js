// Dynamic Categories Menu Loader
// This script loads categories from API and dynamically populates the menu

(function() {
    // Load categories and update menu when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDynamicCategories);
    } else {
        loadDynamicCategories();
    }

    async function loadDynamicCategories() {
        try {
            // Fetch categories from API
            const response = await fetch('/api/categories');
            let categories = [];
            
            if (response.ok) {
                categories = await response.json();
                console.log('Categories loaded from API:', categories);
            } else {
                // Fallback to default categories if API fails
                categories = getDefaultCategories();
                console.log('Using default categories (API failed)');
            }

            // Filter out categories with (RU) in the name
            categories = categories.filter(cat => !cat.name.includes('(RU)'));
            console.log('Categories after filtering:', categories);

            // Update desktop mega menu
            updateDesktopMenu(categories);
            
            // Update mobile menu
            updateMobileMenu(categories);
            
        } catch (error) {
            console.error('Error loading categories:', error);
            // Use default categories on error
            const categories = getDefaultCategories();
            updateDesktopMenu(categories);
            updateMobileMenu(categories);
        }
    }

    function getDefaultCategories() {
        return [
            { id: 'jackets', name: 'КУРТКИ', slug: 'jackets' },
            { id: 'shoes', name: 'ОБУВЬ', slug: 'shoes' },
            { id: 'coats', name: 'ПАЛЬТО', slug: 'coats' },
            { id: 'sweaters', name: 'КОФТЫ', slug: 'sweaters' },
            { id: 'glasses', name: 'ОЧКИ', slug: 'glasses' },
            { id: 'pants', name: 'ШТАНЫ', slug: 'pants' },
            { id: 'hats', name: 'ГОЛОВНОЙ УБОР', slug: 'hats' }
        ];
    }

    function updateDesktopMenu(categories) {
        // Find desktop menu categories container - try multiple selectors
        const megaMenu = document.querySelector('.mega-menu-column ul') || 
                        document.querySelector('.mega-menu-columns .mega-menu-column ul');
        const megaMenuAlt = document.querySelector('.dropdown-content'); // For pages with different menu structure
        
        console.log('Updating desktop menu. MegaMenu found:', !!megaMenu, 'MegaMenuAlt found:', !!megaMenuAlt);
        
        if (megaMenu) {
            console.log('Updating mega menu with', categories.length, 'categories');
            // Clear existing categories
            megaMenu.innerHTML = '';
            
            // Add categories
            categories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="category-${category.slug}.html"> ${category.name}</a>`;
                megaMenu.appendChild(li);
            });
        }
        
        // Alternative menu structure (used in some pages)
        if (megaMenuAlt && !megaMenu) {
            // Find existing category links
            const existingLinks = megaMenuAlt.querySelectorAll('a[href*="category-"]');
            
            if (existingLinks.length > 0) {
                // Clear container
                megaMenuAlt.innerHTML = '';
                
                // Add shop all link
                const shopAllLink = document.createElement('a');
                shopAllLink.href = 'shop-all.html';
                shopAllLink.className = 'dropdown-item';
                shopAllLink.textContent = 'ВСЕ ТОВАРЫ';
                megaMenuAlt.appendChild(shopAllLink);
                
                // Add categories
                categories.forEach(category => {
                    const link = document.createElement('a');
                    link.href = `category-${category.slug}.html`;
                    link.className = 'dropdown-item';
                    link.textContent = category.name;
                    megaMenuAlt.appendChild(link);
                });
            }
        }
        
        // Update any other category lists on the page
        updateOtherCategoryLists(categories);
    }

    function updateMobileMenu(categories) {
        // Find mobile menu categories container
        const mobileCategories = document.querySelector('.mobile-dropdown-nested');
        
        if (mobileCategories) {
            // Check if this is the categories dropdown
            const hasCategories = Array.from(mobileCategories.querySelectorAll('a')).some(link => 
                link.href.includes('category-')
            );
            
            if (hasCategories) {
                // Clear existing categories
                mobileCategories.innerHTML = '';
                
                // Add categories
                categories.forEach(category => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="category-${category.slug}.html" class="mobile-dropdown-nested-link">${category.name}</a>`;
                    mobileCategories.appendChild(li);
                });
            }
        }
    }

    function updateOtherCategoryLists(categories) {
        // Update any standalone category lists (like in product page mega menu)
        const categoryContainers = document.querySelectorAll('[data-category-list]');
        
        categoryContainers.forEach(container => {
            container.innerHTML = '';
            categories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="category-${category.slug}.html">${category.name}</a>`;
                container.appendChild(li);
            });
        });
        
        // Also check for mega menu content areas that might have categories
        const megaMenuSections = document.querySelectorAll('.mega-menu-section ul');
        megaMenuSections.forEach(section => {
            // Check if this section contains category links
            const firstLink = section.querySelector('a');
            if (firstLink && firstLink.href && firstLink.href.includes('category-')) {
                // This is a category list, update it
                section.innerHTML = '';
                categories.forEach(category => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="category-${category.slug}.html">${category.name}</a>`;
                    section.appendChild(li);
                });
            }
        });
    }

    // Export function to manually refresh categories
    window.refreshCategoryMenus = loadDynamicCategories;
    
    // Auto-refresh categories when coming back to the page
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page is visible again, refresh categories
            loadDynamicCategories();
        }
    });
    
    // Listen for custom event to refresh categories
    document.addEventListener('categoriesUpdated', loadDynamicCategories);
    
    // Refresh every 3 seconds if we are on a page with category menu
    if (document.querySelector('.mega-menu-column ul') || 
        document.querySelector('.mega-menu-columns .mega-menu-column ul') ||
        document.querySelector('.dropdown-content')) {
        setInterval(loadDynamicCategories, 3000);
    }
})();
