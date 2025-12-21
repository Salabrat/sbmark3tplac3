// Special loader for shop-all page
// Loads products from server API if available, otherwise uses local database

class ShopAllLoader {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.productsGrid = document.getElementById('productsGrid');
        this.productCounter = document.querySelector('.product-count');
    }
    
    async loadAllProducts() {
        console.log('Loading all products for shop-all page...');
        
        let products = [];
        
        // Check for brand filter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const brandId = urlParams.get('brand');
        
        // First try to load from API
        try {
            if (brandId) {
                // Load products for specific brand
                const response = await fetch(`${this.apiUrl}/products/brand/${brandId}`);
                if (response.ok) {
                    products = await response.json();
                    console.log(`Found ${products.length} products for brand ${brandId}`);
                    
                    // Update page title for brand
                    const pageTitle = document.querySelector('.shop-title');
                    if (pageTitle && products.length > 0) {
                        pageTitle.textContent = products[0].brandName || 'BRAND COLLECTION';
                    }
                }
            } else {
                // Load all products
                const response = await fetch(`${this.apiUrl}/products`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Loaded data from API:', data);
                    
                    // Collect all products from all categories
                    for (const category in data.products) {
                        if (data.products[category] && Array.isArray(data.products[category])) {
                            products.push(...data.products[category]);
                        }
                    }
                    console.log(`Found ${products.length} products from API`);
                }
            }
        } catch (error) {
            console.log('API not available, using local database');
        }
        
        // If no products from API, try local database
        if (products.length === 0 && window.productDB) {
            products = window.productDB.getAllProducts();
            console.log(`Found ${products.length} products from local database`);
        }
        
        // Display products
        this.displayProducts(products);
        
        // Update counter
        if (this.productCounter) {
            this.productCounter.textContent = `${products.length} изделий`;
        }
    }
    
    displayProducts(products) {
        if (!this.productsGrid) {
            console.error('Products grid not found');
            return;
        }
        
        // Clear existing content
        this.productsGrid.innerHTML = '';
        
        if (products.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Create product cards
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.productsGrid.appendChild(card);
        });
    }
    
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-catalog';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </div>
            <h3>В магазине пока нет товаров</h3>
            <p>Товары будут добавлены администратором</p>
        `;
        
        this.productsGrid.appendChild(emptyState);
    }
    
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);
        
        // Get images
        const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS0xNSAxODUgMTM1IDE1MCAyMDBDMTE1IDEzNSAxMzUgMTE1IDE1MCAxMjBaIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEzIiBmb250LXNpemU9IjE0Ij5ObyBpbWFnZTwvdGV4dD4KPC9zdmc+';
        
        let firstImage = placeholder;
        let secondImage = placeholder;
        
        if (product.images && product.images.length > 0) {
            // Handle different image formats
            if (typeof product.images[0] === 'string') {
                firstImage = product.images[0];
            } else if (product.images[0].url) {
                firstImage = product.images[0].url;
            } else if (product.images[0].data) {
                firstImage = product.images[0].data;
            }
            
            if (product.images.length > 1) {
                if (typeof product.images[1] === 'string') {
                    secondImage = product.images[1];
                } else if (product.images[1].url) {
                    secondImage = product.images[1].url;
                } else if (product.images[1].data) {
                    secondImage = product.images[1].data;
                }
            } else {
                secondImage = firstImage;
            }
        }
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(product.price || 0);
        
        card.innerHTML = `
            <div class="product-image">
                <img class="product-image-primary" src="${firstImage}" alt="${product.name}" loading="lazy" onerror="this.src='${placeholder}'">
                ${secondImage !== firstImage ? `<img class="product-image-hover" src="${secondImage}" alt="${product.name}" loading="lazy" onerror="this.src='${placeholder}'">` : ''}
                ${product.images && product.images.length > 1 ? `<span class="image-count">+${product.images.length - 1}</span>` : ''}
            </div>
            <h3 class="product-name">${product.name || 'Без названия'}</h3>
            <span class="product-price">${formattedPrice} ₽</span>
        `;
        
        // Add click handler
        card.addEventListener('click', () => {
            if (window.productModal && window.productModal.open) {
                window.productModal.open(product);
            } else {
                console.log('Product clicked:', product.name);
            }
        });
        
        return card;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only run on shop-all page
    if (window.location.pathname.includes('shop-all.html')) {
        const shopAllLoader = new ShopAllLoader();
        
        // Load products after a short delay to ensure everything is initialized
        setTimeout(() => {
            shopAllLoader.loadAllProducts();
        }, 100);
    }
});
