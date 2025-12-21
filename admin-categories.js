// Admin Categories Management
let categories = [];

// Initialize categories when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load categories if we're on the categories section
    if (document.getElementById('categories-section')) {
        loadCategories();
    }
});

// Load and display categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            categories = await response.json();
            displayCategories(categories);
        } else {
            // If API doesn't exist yet, use default categories
            categories = getDefaultCategories();
            displayCategories(categories);
        }
    } catch (error) {
        console.log('Using default categories:', error);
        categories = getDefaultCategories();
        displayCategories(categories);
    }
}

// Get default categories
function getDefaultCategories() {
    return [
        { id: 'jackets', name: 'КУРТКИ', slug: 'jackets', productCount: 0, isDefault: true },
        { id: 'shoes', name: 'ОБУВЬ', slug: 'shoes', productCount: 0, isDefault: true },
        { id: 'coats', name: 'ПАЛЬТО', slug: 'coats', productCount: 0, isDefault: true },
        { id: 'sweaters', name: 'КОФТЫ', slug: 'sweaters', productCount: 0, isDefault: true },
        { id: 'glasses', name: 'ОЧКИ', slug: 'glasses', productCount: 0, isDefault: true },
        { id: 'pants', name: 'ШТАНЫ', slug: 'pants', productCount: 0, isDefault: true },
        { id: 'hats', name: 'ГОЛОВНОЙ УБОР', slug: 'hats', productCount: 0, isDefault: true },
        { id: 'kurtki', name: 'КУРТКИ (RU)', slug: 'kurtki', productCount: 0, isDefault: true },
        { id: 'obuv', name: 'ОБУВЬ (RU)', slug: 'obuv', productCount: 0, isDefault: true }
    ];
}

// Display categories in grid
function displayCategories(categoriesList) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    if (!categoriesList || categoriesList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <p style="margin-top: 16px; color: #666;">Категории не найдены</p>
                <button class="admin-btn admin-btn-primary" style="margin-top: 16px;" onclick="showAddCategoryModal()">
                    Добавить первую категорию
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = categoriesList.map(category => `
        <div class="category-card" ondblclick="editCategory('${category.id}')" style="cursor: pointer;" title="Двойной клик для редактирования">
            <div class="category-card-header">
                <h3 class="category-name">${category.name}</h3>
                ${category.isDefault ? '<span class="badge badge-info">Системная</span>' : ''}
            </div>
            <div class="category-card-body">
                <div class="category-info">
                    <span class="category-label">URL:</span>
                    <span class="category-value">/category-${category.slug}.html</span>
                </div>
                <div class="category-info">
                    <span class="category-label">Товаров:</span>
                    <span class="category-value">${category.productCount || 0}</span>
                </div>
                ${category.description ? `
                    <div class="category-info">
                        <span class="category-label">Описание:</span>
                        <span class="category-value">${category.description}</span>
                    </div>
                ` : ''}
            </div>
            <div class="category-card-actions">
                <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="editCategory('${category.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Изменить
                </button>
                ${!category.isDefault ? `
                    <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCategory('${category.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                        Удалить
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Update total categories count
    const totalCategories = document.getElementById('totalCategories');
    if (totalCategories) {
        totalCategories.textContent = categoriesList.length;
    }
}

// Show add category modal
function showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear form
        document.getElementById('categoryName').value = '';
        document.getElementById('categorySlug').value = '';
        document.getElementById('categoryDescription').value = '';
    }
}

// Close add category modal
function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset modal to "Add" mode
        const saveBtn = modal.querySelector('.admin-btn-primary');
        if (saveBtn) {
            saveBtn.textContent = 'Добавить';
            saveBtn.onclick = saveCategory;
        }
        
        // Clear form fields
        document.getElementById('categoryName').value = '';
        document.getElementById('categorySlug').value = '';
        document.getElementById('categoryDescription').value = '';
    }
}

// Save new category
async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim().toLowerCase();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name || !slug) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }

    // Validate slug (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
        alert('URL идентификатор может содержать только латинские буквы в нижнем регистре, цифры и дефисы');
        return;
    }

    // Check if category with this slug already exists
    if (categories.some(cat => cat.slug === slug)) {
        alert('Категория с таким URL идентификатором уже существует');
        return;
    }

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
            },
            body: JSON.stringify({ name, slug, description })
        });

        if (response.ok) {
            const newCategory = await response.json();
            showNotification('Категория успешно добавлена', 'success');
            closeAddCategoryModal();
            loadCategories();
            
            // Create category page file if needed
            createCategoryPage(slug, name, description);
            
            // Trigger menu refresh on all open pages
            if (window.opener && typeof window.opener.refreshCategoryMenus === 'function') {
                window.opener.refreshCategoryMenus();
            }
            // Dispatch event for dynamic menu refresh
            document.dispatchEvent(new CustomEvent('categoriesUpdated'));
        } else {
            throw new Error('Failed to add category');
        }
    } catch (error) {
        console.error('Error adding category:', error);
        // If API doesn't exist, add locally
        const newCategory = {
            id: slug,
            name: name,
            slug: slug,
            description: description,
            productCount: 0,
            isDefault: false
        };
        categories.push(newCategory);
        displayCategories(categories);
        closeAddCategoryModal();
        showNotification('Категория добавлена локально', 'success');
        
        // Create category page file
        createCategoryPage(slug, name, description);
        
        // Trigger menu refresh
        document.dispatchEvent(new CustomEvent('categoriesUpdated'));
    }
}

// Edit category
function editCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Show modal with existing data
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categorySlug').value = category.slug;
        document.getElementById('categoryDescription').value = category.description || '';
        
        // Change button text
        const saveBtn = modal.querySelector('.admin-btn-primary');
        if (saveBtn) {
            saveBtn.textContent = 'Сохранить изменения';
            saveBtn.onclick = () => updateCategory(categoryId);
        }
    }
}

// Update category
async function updateCategory(categoryId) {
    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim().toLowerCase();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name || !slug) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
            },
            body: JSON.stringify({ name, slug, description })
        });

        if (response.ok) {
            showNotification('Категория успешно обновлена', 'success');
            
            // Update category page HTML file
            await createCategoryPage(slug, name, description);
            
            closeAddCategoryModal();
            loadCategories();
            // Trigger menu refresh
            document.dispatchEvent(new CustomEvent('categoriesUpdated'));
        } else {
            throw new Error('Failed to update category');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        // Update locally if API fails
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex !== -1) {
            categories[categoryIndex] = {
                ...categories[categoryIndex],
                name: name,
                slug: slug,
                description: description
            };
            
            // Update category page HTML file
            await createCategoryPage(slug, name, description);
            
            displayCategories(categories);
            closeAddCategoryModal();
            showNotification('Категория обновлена локально', 'success');
            // Trigger menu refresh
            document.dispatchEvent(new CustomEvent('categoriesUpdated'));
        }
    }
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Все товары в этой категории также будут удалены.')) {
        return;
    }

    // Find category to get its slug for file deletion
    const category = categories.find(cat => cat.id === categoryId);
    const categorySlug = category ? category.slug : categoryId;

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
            }
        });

        if (response.ok) {
            showNotification('Категория успешно удалена', 'success');
            
            // Try to delete the HTML file
            try {
                const deletePageResponse = await fetch('/api/delete-category-page', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    },
                    body: JSON.stringify({ slug: categorySlug })
                });
                
                if (deletePageResponse.ok) {
                    console.log(`Category page category-${categorySlug}.html deleted`);
                }
            } catch (pageError) {
                console.log('Could not delete category page file:', pageError);
            }
            
            loadCategories();
            // Trigger menu refresh
            document.dispatchEvent(new CustomEvent('categoriesUpdated'));
        } else {
            throw new Error('Failed to delete category');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        // Delete locally if API fails
        categories = categories.filter(cat => cat.id !== categoryId);
        displayCategories(categories);
        showNotification('Категория удалена локально', 'success');
        // Trigger menu refresh
        document.dispatchEvent(new CustomEvent('categoriesUpdated'));
    }
}

// Create category page HTML file
async function createCategoryPage(slug, name, description = '') {
    console.log(`Creating category page: category-${slug}.html for ${name}`);
    
    try {
        // Send request to server to create category page
        const response = await fetch('/api/create-category-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
            },
            body: JSON.stringify({ slug, name, description })
        });
        
        if (response.ok) {
            showNotification(`Страница категории category-${slug}.html создана`, 'success');
        } else {
            showNotification(`Страница category-${slug}.html будет создана вручную`, 'info');
        }
    } catch (error) {
        console.error('Error creating category page:', error);
        showNotification(`Страница category-${slug}.html будет создана вручную`, 'info');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS for category cards
const style = document.createElement('style');
style.textContent = `
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 30px;
    }

    .category-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.3s ease;
    }

    .category-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .category-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
    }

    .category-name {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
    }

    .badge {
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        border-radius: 4px;
    }

    .badge-info {
        background: #e3f2fd;
        color: #1976d2;
    }

    .category-card-body {
        margin-bottom: 15px;
    }

    .category-info {
        display: flex;
        margin-bottom: 8px;
        font-size: 14px;
    }

    .category-label {
        font-weight: 600;
        color: #666;
        margin-right: 8px;
        min-width: 70px;
    }

    .category-value {
        color: #333;
        word-break: break-word;
    }

    .category-card-actions {
        display: flex;
        gap: 10px;
    }

    .admin-btn-sm {
        padding: 6px 12px;
        font-size: 12px;
    }

    .admin-btn-danger {
        background: #f44336;
        color: white;
    }

    .admin-btn-danger:hover {
        background: #d32f2f;
    }

    .empty-state {
        text-align: center;
        padding: 60px;
        color: #666;
    }

    .empty-state svg {
        margin: 0 auto;
        opacity: 0.3;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .section-actions {
        display: flex;
        gap: 10px;
    }

    .admin-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .admin-section-header > div:first-child {
        flex: 1;
    }
`;
document.head.appendChild(style);
