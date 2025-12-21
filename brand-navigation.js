// Brand Navigation System
class BrandNavigation {
    constructor() {
        this.brands = [];
        this.init();
    }

    async init() {
        await this.loadBrands();
        this.setupBrandMenu();
        this.injectStyles();
    }
    
    injectStyles() {
        // Add CSS to override hover opacity for brand links
        const style = document.createElement('style');
        style.textContent = `
            .brand-nav-link {
                opacity: 1 !important;
            }
            .brand-nav-link:hover {
                opacity: 1 !important;
                color: inherit;
            }
            .brand-dropdown {
                opacity: 1 !important;
            }
            .brand-dropdown * {
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    async loadBrands() {
        try {
            const response = await fetch('/api/brands');
            if (response.ok) {
                const allBrands = await response.json();
                // Only show active brands
                this.brands = allBrands.filter(brand => brand.isActive);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    setupBrandMenu() {
        // Find all brand navigation links - by href, data attribute or text content
        // Include both desktop (.nav-link) and mobile (.mobile-menu-link) versions
        const allNavLinks = document.querySelectorAll('.nav-link, .mobile-menu-link');
        const brandLinks = Array.from(allNavLinks).filter(link => {
            const linkText = link.textContent.trim().toUpperCase();
            return link.href === '#brand' || 
                   link.hasAttribute('data-brand-menu') ||
                   linkText === 'BRAND' ||
                   linkText.includes('BRAND'); // For mobile links that might have SVG icons
        });
        
        console.log(`Found ${brandLinks.length} BRAND links to setup`);
        
        brandLinks.forEach(link => {
            // Remove existing href to prevent navigation
            link.href = '#';
            
            // Add specific class to brand links for styling
            link.classList.add('brand-nav-link');
            
            // Set opacity to 1 and override hover opacity
            link.style.opacity = '1';
            link.style.setProperty('opacity', '1', 'important');
            link.style.transition = 'color 0.3s ease';
            
            // Prevent opacity changes on hover
            link.addEventListener('mouseenter', (e) => {
                e.target.style.opacity = '1';
                e.target.style.setProperty('opacity', '1', 'important');
            });
            
            link.addEventListener('mouseleave', (e) => {
                e.target.style.opacity = '1';
                e.target.style.setProperty('opacity', '1', 'important');
            });
            
            // Create dropdown menu
            const dropdown = this.createBrandDropdown();
            
            // Position dropdown relative to link
            link.style.position = 'relative';
            
            // Add click handler
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle dropdown
                if (dropdown.parentNode === link) {
                    link.removeChild(dropdown);
                } else {
                    // Remove any other open dropdowns
                    document.querySelectorAll('.brand-dropdown').forEach(d => d.remove());
                    link.appendChild(dropdown);
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const clickedBrandLink = e.target.closest('.nav-link') && 
                                    e.target.closest('.nav-link').textContent.trim().toUpperCase() === 'BRAND';
            if (!clickedBrandLink && !e.target.closest('.brand-dropdown')) {
                document.querySelectorAll('.brand-dropdown').forEach(d => d.remove());
            }
        });
    }

    createBrandDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'brand-dropdown';
        
        // Add styles with solid background
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ffffff;
            background: rgb(255, 255, 255);
            opacity: 1 !important;
            border: 1px solid #d0d0d0;
            border-radius: 4px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            min-width: 200px;
            z-index: 9999;
            margin-top: 10px;
            padding: 8px 0;
            backdrop-filter: none;
        `;

        if (this.brands.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 12px 16px; color: #999; font-size: 14px; background-color: white; opacity: 1;">
                    Нет доступных брендов
                </div>
            `;
        } else {
            this.brands.forEach(brand => {
                const brandItem = document.createElement('a');
                brandItem.href = `/brand.html?id=${brand.id}`;
                brandItem.className = 'brand-dropdown-item';
                brandItem.textContent = brand.name;
                
                // Add styles to brand item
                brandItem.style.cssText = `
                    display: block;
                    padding: 10px 16px;
                    color: #333;
                    background-color: white;
                    text-decoration: none;
                    font-size: 14px;
                    transition: background-color 0.2s;
                    opacity: 1;
                `;
                
                // Hover effect
                brandItem.addEventListener('mouseenter', () => {
                    brandItem.style.backgroundColor = '#f5f5f5';
                });
                brandItem.addEventListener('mouseleave', () => {
                    brandItem.style.backgroundColor = 'white';
                });
                
                // Click handler to load brand products
                brandItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadBrandPage(brand.id, brand.name);
                });
                
                dropdown.appendChild(brandItem);
            });
        }

        return dropdown;
    }

    loadBrandPage(brandId, brandName) {
        // Check if we're on a page that can display products
        const productsContainer = document.querySelector('.products-grid, .shop-grid');
        const pageTitle = document.querySelector('.shop-title, .page-title, h1');
        
        if (productsContainer && pageTitle) {
            // Update page title
            pageTitle.innerHTML = brandName.toUpperCase();
            
            // Update description if exists
            const description = document.querySelector('.shop-description, .page-description');
            if (description) {
                description.textContent = `Коллекция товаров бренда ${brandName}`;
            }
            
            // Load brand products
            this.loadBrandProducts(brandId, productsContainer);
        } else {
            // Navigate to shop page with brand filter
            window.location.href = `/shop-all.html?brand=${brandId}`;
        }
    }

    async loadBrandProducts(brandId, container) {
        try {
            // Show loading state
            container.innerHTML = '<div class="loading">Загрузка товаров...</div>';
            
            const response = await fetch(`/api/products/brand/${brandId}`);
            if (response.ok) {
                const products = await response.json();
                
                if (products.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                            <p style="color: #999;">Нет товаров для этого бренда</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = products.map(product => this.createProductCard(product)).join('');
                    
                    // Update product count if exists
                    const productCount = document.querySelector('.product-count');
                    if (productCount) {
                        productCount.textContent = `${products.length} изделий`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading brand products:', error);
            container.innerHTML = '<div class="error">Ошибка загрузки товаров</div>';
        }
    }

    createProductCard(product) {
        const imageUrl = product.images && product.images.length > 0 
            ? (product.images[0].url || product.images[0].data || '/placeholder.jpg')
            : '/placeholder.jpg';
            
        return `
            <div class="product-card" data-product-id="${product.id}">
                <a href="/product.html?id=${product.id}" class="product-link">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.name}" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNGNUY1RjUiLz4KPHBhdGggZD0iTTIwMCAxNzBDMjE2LjU2OSAxNzAgMjMwIDE4My40MzEgMjMwIDIwMEMyMzAgMjE2LjU2OSAyMTYuNTY5IDIzMCAyMDAgMjMwQzE4My40MzEgMjMwIDE3MCAyMTYuNTY5IDE3MCAyMDBDMTcwIDE4My40MzEgMTgzLjQzMSAxNzAgMjAwIDE3MFoiIGZpbGw9IiNFMEUwRTAiLz4KPHBhdGggZD0iTTE1MCAyODBIMjUwTDIyNSAzMjBIMTc1TDE1MCAyODBaIiBmaWxsPSIjRTBFMEUwIi8+Cjwvc3ZnPg=='">
                        ${product.isTrending ? '<span class="trending-badge">TRENDING</span>' : ''}
                    </div>
                    <div class="product-info">
                        <span class="product-brand">${product.brandName || 'C.P. Company'}</span>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${product.price ? `€${product.price}` : 'Цена по запросу'}</p>
                    </div>
                </a>
            </div>
        `;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BrandNavigation();
    });
} else {
    new BrandNavigation();
}
