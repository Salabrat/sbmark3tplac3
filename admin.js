// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        // Check admin authentication
        this.checkAdminAuth();
        
        // Initialize navigation
        this.initNavigation();
        
        // Load initial data
        this.loadDashboardData();
        
        // Initialize forms
        this.initForms();
        
        console.log('Admin Dashboard initialized');
    }

    checkAdminAuth() {
        const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const username = localStorage.getItem('username');
        
        console.log('Checking admin auth:', {
            isAdmin: isAdmin,
            isLoggedIn: isLoggedIn,
            username: username
        });
        
        // Allow access if admin or username is 'admin'
        const canAccess = isAdmin || username === 'admin';
        
        if (!canAccess) {
            const shouldRedirect = confirm('Доступ к админ панели ограничен.\n\nПерейти на страницу входа?');
            if (shouldRedirect) {
                window.location.href = 'login.html';
            } else {
                window.location.href = 'index.html';
            }
            return;
        }
        
        console.log('Admin authentication verified');
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.admin-nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionName) {
        // Remove active class from all nav items and sections
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to current nav item and section
        const currentNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        const currentSection = document.getElementById(`${sectionName}-section`);
        
        if (currentNavItem) currentNavItem.classList.add('active');
        if (currentSection) currentSection.classList.add('active');
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadDashboardData() {
        try {
            // Load products count
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                let totalProducts = 0;
                
                if (data.products) {
                    Object.values(data.products).forEach(categoryProducts => {
                        totalProducts += categoryProducts.length;
                    });
                }
                
                document.getElementById('totalProducts').textContent = totalProducts;
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'products':
                this.loadProducts();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'images':
                this.loadImages();
                break;
            default:
                break;
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                this.displayProducts(data.products || {});
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    displayProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let hasProducts = false;
        
        Object.entries(products).forEach(([category, categoryProducts]) => {
            categoryProducts.forEach(product => {
                hasProducts = true;
                const row = document.createElement('tr');
                
                const imageUrl = product.images && product.images.length > 0 
                    ? (product.images[0].url || product.images[0].data || '/placeholder.jpg')
                    : '/placeholder.jpg';
                
                row.innerHTML = `
                    <td>
                        <img src="${imageUrl}" alt="${product.name}" class="product-thumb" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNkMyMi4yIDEyIDI0LjcgMTggMjAgMjRDMTUuMyAxOCAxNy44IDEyIDIwIDE2WiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K'">
                    </td>
                    <td><strong>${product.name}</strong></td>
                    <td><span class="brand-badge">${product.brandName || 'C.P. Company'}</span></td>
                    <td><span class="category-badge">${category.toUpperCase()}</span></td>
                    <td>${product.sizes ? product.sizes.join(', ') : 'Не указано'}</td>
                    <td>${product.price || 'Не указано'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="editProduct(${product.id})" title="Редактировать">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteProduct(${product.id})" title="Удалить">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        });
        
        if (!hasProducts) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7">
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <p>Товары не найдены</p>
                            <button class="admin-btn admin-btn-primary" onclick="showAddProductModal()">Добавить первый товар</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    loadCategories() {
        const categories = [
            { name: 'КУРТКИ', count: 0, icon: '🧥' },
            { name: 'ОБУВЬ', count: 0, icon: '👟' },
            { name: 'ПАЛЬТО', count: 0, icon: '🧥' },
            { name: 'КОФТЫ', count: 0, icon: '👕' },
            { name: 'ОЧКИ', count: 0, icon: '🕶️' },
            { name: 'ШТАНЫ', count: 0, icon: '👖' },
            { name: 'ГОЛОВНОЙ УБОР', count: 0, icon: '🧢' }
        ];
        
        this.displayCategories(categories);
    }

    displayCategories(categories) {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;
        
        grid.innerHTML = categories.map(category => `
            <div class="category-card">
                <div class="category-icon">${category.icon}</div>
                <h3>${category.name}</h3>
                <p>${category.count} товаров</p>
                <div class="category-actions">
                    <button class="admin-btn admin-btn-sm admin-btn-primary">Управление</button>
                </div>
            </div>
        `).join('');
    }

    loadImages() {
        // Load current login image
        this.loadLoginImage();
    }

    async loadLoginImage() {
        try {
            const response = await fetch('/api/login-image');
            if (response.ok) {
                const data = await response.json();
                const preview = document.getElementById('loginImagePreview');
                if (preview && data.loginImage) {
                    preview.src = data.loginImage;
                }
            }
        } catch (error) {
            console.error('Error loading login image:', error);
        }
    }

    initForms() {
        // Add Product Form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct(e);
            });
        }
    }

    async handleAddProduct(e) {
        const formData = new FormData(e.target);
        const brandSelect = document.getElementById('productBrand');
        const selectedBrandOption = brandSelect ? brandSelect.options[brandSelect.selectedIndex] : null;
        
        const productData = {
            name: formData.get('productName'),
            category: formData.get('productCategory'),
            description: formData.get('productDescription'),
            brandId: parseInt(formData.get('productBrand')),
            brandName: selectedBrandOption ? selectedBrandOption.getAttribute('data-brand-name') : 'C.P. Company',
            sizes: Array.from(formData.getAll('sizes')),
            images: []
        };
        
        // Handle image upload
        const imageFile = formData.get('productImage');
        if (imageFile && imageFile.size > 0) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('image', imageFile);
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    productData.images.push({ url: uploadData.url });
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
        
        try {
            const response = await fetch(`/api/products/${productData.category.toLowerCase()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                alert('Товар успешно добавлен!');
                this.closeAddProductModal();
                this.loadProducts();
                this.loadDashboardData();
            } else {
                alert('Ошибка при добавлении товара');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Ошибка при добавлении товара');
        }
    }

    async showAddProductModal() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Load brands into select dropdown
            try {
                const response = await fetch('/api/brands');
                if (response.ok) {
                    const brands = await response.json();
                    const brandSelect = document.getElementById('productBrand');
                    if (brandSelect) {
                        brandSelect.innerHTML = '<option value="">Выберите бренд</option>';
                        brands.forEach(brand => {
                            if (brand.isActive) {
                                brandSelect.innerHTML += `<option value="${brand.id}" data-brand-name="${brand.name}">${brand.name}</option>`;
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading brands:', error);
            }
        }
    }

    closeAddProductModal() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = document.getElementById('addProductForm');
            if (form) form.reset();
        }
    }
}

// Global functions
function switchSection(sectionName) {
    if (window.adminDashboard) {
        window.adminDashboard.switchSection(sectionName);
    }
}

function showAddProductModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAddProductModal();
    }
}

function closeAddProductModal() {
    if (window.adminDashboard) {
        window.adminDashboard.closeAddProductModal();
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

function saveSettings() {
    alert('Настройки сохранены!');
}

async function editProduct(id) {
    try {
        // Получаем данные товара
        const response = await fetch(`/api/product/${id}`);
        if (!response.ok) {
            alert('Ошибка при загрузке данных товара');
            return;
        }
        
        const product = await response.json();
        
        // Открываем модальное окно редактирования
        showEditProductModal(product);
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Ошибка при загрузке данных товара');
    }
}

async function deleteProduct(id) {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        try {
            const response = await fetch(`/api/product/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Товар успешно удален!');
                // Перезагружаем список товаров
                if (window.adminDashboard) {
                    window.adminDashboard.loadProducts();
                    window.adminDashboard.loadDashboardData();
                }
            } else {
                const error = await response.json();
                alert(`Ошибка при удалении товара: ${error.error || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Ошибка при удалении товара');
        }
    }
}

function addColorInput() {
    const container = document.getElementById('colorInputs');
    const newRow = document.createElement('div');
    newRow.className = 'color-input-row';
    newRow.innerHTML = `
        <input type="text" name="colors" placeholder="Название цвета" class="form-control">
        <input type="color" name="colorValues" value="#000000" class="color-picker">
        <button type="button" class="btn-remove-color" onclick="removeColorInput(this)">×</button>
    `;
    container.appendChild(newRow);
}

function removeColorInput(button) {
    button.parentElement.remove();
}

// Функции для модального окна редактирования
async function showEditProductModal(product) {
    // Создаем модальное окно, если его еще нет
    let modal = document.getElementById('editProductModal');
    if (!modal) {
        modal = createEditProductModal();
        document.body.appendChild(modal);
    }
    
    // Загружаем бренды
    try {
        const response = await fetch('/api/brands');
        if (response.ok) {
            const brands = await response.json();
            const brandSelect = document.getElementById('editProductBrand');
            if (brandSelect) {
                brandSelect.innerHTML = '<option value="">Выберите бренд</option>';
                brands.forEach(brand => {
                    if (brand.isActive) {
                        brandSelect.innerHTML += `<option value="${brand.id}" data-brand-name="${brand.name}">${brand.name}</option>`;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading brands for edit modal:', error);
    }
    
    // Заполняем форму данными товара
    const form = document.getElementById('editProductForm');
    if (form) {
        form.dataset.productId = product.id;
        form.querySelector('[name="productName"]').value = product.name || '';
        form.querySelector('[name="productDescription"]').value = product.description || '';
        form.querySelector('[name="productPrice"]').value = product.price || '';
        
        // Устанавливаем бренд
        const brandSelect = form.querySelector('[name="productBrand"]');
        if (brandSelect) {
            brandSelect.value = product.brandId || '1';
        }
        
        form.querySelector('[name="productCategory"]').value = product.category || '';
        
        // Устанавливаем размеры
        const sizeCheckboxes = form.querySelectorAll('[name="sizes"]');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.checked = product.sizes && product.sizes.includes(checkbox.value);
        });
        
        // Показываем текущие изображения
        const imagePreview = document.getElementById('editProductImagePreview');
        if (imagePreview && product.images && product.images.length > 0) {
            const imageUrl = product.images[0].url || product.images[0].data || '';
            imagePreview.innerHTML = `<img src="${imageUrl}" alt="Product image" style="max-width: 200px; max-height: 200px;">`;
        }
        
        // Устанавливаем статус "В тренде"
        const trendingCheckbox = form.querySelector('[name="isTrending"]');
        if (trendingCheckbox) {
            trendingCheckbox.checked = product.isTrending || false;
        }
    }
    
    modal.style.display = 'flex';
}

function createEditProductModal() {
    const modal = document.createElement('div');
    modal.id = 'editProductModal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h2>Редактировать товар</h2>
                <button class="admin-modal-close" onclick="closeEditProductModal()">&times;</button>
            </div>
            <form id="editProductForm" class="admin-form">
                <div class="form-group">
                    <label for="editProductName">Название товара</label>
                    <input type="text" id="editProductName" name="productName" required class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="editProductDescription">Описание</label>
                    <textarea id="editProductDescription" name="productDescription" rows="4" class="form-control"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="editProductPrice">Цена</label>
                    <input type="text" id="editProductPrice" name="productPrice" class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="editProductBrand">Бренд</label>
                    <select id="editProductBrand" name="productBrand" required class="form-control">
                        <option value="">Выберите бренд</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editProductCategory">Категория</label>
                    <select id="editProductCategory" name="productCategory" required class="form-control">
                        <option value="jackets">Куртки</option>
                        <option value="shoes">Обувь</option>
                        <option value="coats">Пальто</option>
                        <option value="sweaters">Кофты</option>
                        <option value="glasses">Очки</option>
                        <option value="pants">Штаны</option>
                        <option value="hats">Головные уборы</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Размеры</label>
                    <div class="sizes-group">
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="XS">
                            <span>XS</span>
                        </label>
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="S">
                            <span>S</span>
                        </label>
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="M">
                            <span>M</span>
                        </label>
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="L">
                            <span>L</span>
                        </label>
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="XL">
                            <span>XL</span>
                        </label>
                        <label class="size-checkbox">
                            <input type="checkbox" name="sizes" value="XXL">
                            <span>XXL</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="isTrending">
                        <span>Товар в тренде</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="editProductImage">Изображение товара</label>
                    <input type="file" id="editProductImage" name="productImage" accept="image/*" class="form-control">
                    <div id="editProductImagePreview" class="image-preview"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="admin-btn admin-btn-primary">Сохранить изменения</button>
                    <button type="button" class="admin-btn admin-btn-secondary" onclick="closeEditProductModal()">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    // Добавляем обработчик формы
    const form = modal.querySelector('#editProductForm');
    form.addEventListener('submit', handleEditProduct);
    
    return modal;
}

function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleEditProduct(e) {
    e.preventDefault();
    
    const form = e.target;
    const productId = form.dataset.productId;
    
    if (!productId) {
        alert('Ошибка: ID товара не найден');
        return;
    }
    
    const formData = new FormData(form);
    const brandSelect = document.getElementById('editProductBrand');
    const selectedBrandOption = brandSelect ? brandSelect.options[brandSelect.selectedIndex] : null;
    
    const productData = {
        name: formData.get('productName'),
        description: formData.get('productDescription'),
        price: formData.get('productPrice'),
        category: formData.get('productCategory'),
        brandId: parseInt(formData.get('productBrand')),
        brandName: selectedBrandOption ? selectedBrandOption.getAttribute('data-brand-name') : 'C.P. Company',
        sizes: Array.from(formData.getAll('sizes')),
        isTrending: formData.get('isTrending') === 'on'
    };
    
    // Обработка загрузки нового изображения
    const imageFile = formData.get('productImage');
    if (imageFile && imageFile.size > 0) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', imageFile);
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                productData.images = [{ url: uploadData.url }];
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }
    
    try {
        const response = await fetch(`/api/product/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            alert('Товар успешно обновлен!');
            closeEditProductModal();
            // Перезагружаем список товаров
            if (window.adminDashboard) {
                window.adminDashboard.loadProducts();
                window.adminDashboard.loadDashboardData();
            }
        } else {
            const error = await response.json();
            alert(`Ошибка при обновлении товара: ${error.error || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Ошибка при обновлении товара');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});
