// Product Loader for API version
class ProductLoaderAPI {
    constructor() {
        this.productsGrid = document.getElementById('productsGrid');
        this.productCounter = document.querySelector('.product-count');
        this.currentCategory = this.detectCategory();
        this.init();
    }

    async init() {
        // Load products directly from API
        await this.loadProducts();
    }

    // Detect current category from URL
    detectCategory() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        // Special case for shop-all
        if (filename === 'shop-all.html') {
            return 'all';
        }
        
        // Extract category from filename pattern: category-{slug}.html
        if (filename.startsWith('category-') && filename.endsWith('.html')) {
            const category = filename.replace('category-', '').replace('.html', '');
            console.log(`Detected category from filename: ${category}`);
            return category;
        }
        
        // Default to 'all' if pattern doesn't match
        return 'all';
    }

    // Load products for current category
    async loadProducts() {
        if (!this.productsGrid) {
            console.log('Products grid not found');
            return;
        }

        console.log(`Loading products for category: ${this.currentCategory}`);
        
        try {
            let products = [];
            
            // Load from API only - no localStorage to prevent demo data
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    console.log('API data received for category page:', data);
                    
                    if (this.currentCategory === 'all') {
                        // Load all products from API
                        if (data.products) {
                            Object.values(data.products).forEach(categoryProducts => {
                                products.push(...categoryProducts);
                            });
                        }
                    } else {
                        // Load specific category products from API
                        if (data.products && data.products[this.currentCategory]) {
                            products = data.products[this.currentCategory];
                        }
                    }
                } else {
                    console.error('API response not OK:', response.status);
                    throw new Error(`API error: ${response.status}`);
                }
            } catch (apiError) {
                console.error('Error fetching from API:', apiError);
                throw apiError;
            }
            
            console.log(`Found ${products.length} products`);
            
            // Clear grid
            this.productsGrid.innerHTML = '';
            
            if (products.length === 0) {
                await this.showEmptyState();
            } else {
                products.forEach(product => {
                    const card = this.createProductCard(product);
                    this.productsGrid.appendChild(card);
                });
            }
            
            // Update counter
            this.updateProductCounter(products.length);
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showErrorState();
        }
    }

    // Show empty state when no products
    async showEmptyState() {
        let categoryName = 'ТОВАРЫ';
        
        // Try to get category name from API
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const categories = await response.json();
                const currentCat = categories.find(cat => cat.slug === this.currentCategory);
                if (currentCat) {
                    categoryName = currentCat.name.toUpperCase();
                }
            }
        } catch (error) {
            console.error('Error fetching category name:', error);
            // Fallback to formatted slug
            categoryName = this.currentCategory.toUpperCase();
        }
        
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
            <h3>В категории "${categoryName}" пока нет товаров</h3>
            <p>Товары будут добавлены администратором</p>
        `;
        
        this.productsGrid.appendChild(emptyState);
    }

    // Show error state
    showErrorState() {
        const errorState = document.createElement('div');
        errorState.className = 'empty-catalog';
        errorState.innerHTML = `
            <div class="empty-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3>Ошибка загрузки товаров</h3>
            <p>Убедитесь, что сервер запущен командой: npm start</p>
            <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 20px;">
                Обновить страницу
            </button>
        `;
        
        this.productsGrid.appendChild(errorState);
    }

    // Create product card HTML
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);
        
        // Get first and second images or placeholder
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
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(product.price);
        
        // Format sizes
        const sizesText = product.sizes && product.sizes.length > 0 
            ? product.sizes.join(', ') 
            : 'Один размер';

        card.innerHTML = `
            <div class="product-image">
                <img class="product-image-primary" src="${firstImage}" alt="${product.name}" loading="lazy" onerror="this.src='${placeholder}'">
                ${secondImage !== firstImage ? `<img class="product-image-hover" src="${secondImage}" alt="${product.name}" loading="lazy" onerror="this.src='${placeholder}'">` : ''}
                ${product.images && product.images.length > 1 ? `<span class="image-count">+${product.images.length - 1}</span>` : ''}
            </div>
            <h3 class="product-name">${product.name}</h3>
            <span class="product-price">${formattedPrice} ₽</span>
        `;

        // Add click handler to open product page
        card.addEventListener('click', () => {
            this.openProductPage(product.id);
        });

        return card;
    }

    // Update product counter
    updateProductCounter(count) {
        if (this.productCounter) {
            const categoryAttribute = this.productCounter.getAttribute('data-category');
            if (categoryAttribute) {
                this.productCounter.textContent = `${count} изделий`;
            }
        }
    }

    // Open product page using modal
    async openProductPage(productId) {
        console.log('Opening product page for ID:', productId);
        
        try {
            // Get product from API only, not localStorage
            const response = await fetch(`/api/product/${productId}`);
            if (!response.ok) {
                console.error('Failed to fetch product from API');
                return;
            }
            
            const product = await response.json();
            console.log('Product found:', product);
            
            if (!product) {
                console.error('Product not found with ID:', productId);
                return;
            }
            
            // Check if modal is available
            if (window.productModal) {
                console.log('Opening modal with product:', product.name);
                window.productModal.open(product);
            } else {
                console.error('Product modal not available, trying to initialize...');
                // Try to initialize modal
                if (!window.productModal && window.ProductModal) {
                    window.productModal = new ProductModal();
                    setTimeout(() => {
                        window.productModal.open(product);
                    }, 100);
                } else {
                    // Fallback if modal is not available
                    alert(`Товар: ${product.name}\nЦена: ${product.price} ₽\nОписание: ${product.description}`);
                }
            }
        } catch (error) {
            console.error('Error opening product:', error);
        }
    }

    // Refresh products (useful after adding new products)
    async refresh() {
        await this.loadProducts();
    }
}

// Initialize product loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loader directly - no database dependency
    window.productLoader = new ProductLoaderAPI();
    console.log('Product loader API initialized');
});

// Export for global use
window.ProductLoaderAPI = ProductLoaderAPI;
