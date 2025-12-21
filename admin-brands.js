// Admin Brands Management
class BrandsManager {
    constructor() {
        this.brands = [];
        this.init();
    }

    init() {
        this.loadBrands();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add brand form submission
        const addBrandForm = document.getElementById('add-brand-form');
        if (addBrandForm) {
            addBrandForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBrand();
            });
        }
    }

    async loadBrands() {
        try {
            const response = await fetch('/api/brands');
            if (response.ok) {
                this.brands = await response.json();
                this.renderBrands();
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    renderBrands() {
        const brandsList = document.getElementById('brands-list');
        if (!brandsList) return;

        if (this.brands.length === 0) {
            brandsList.innerHTML = '<p class="empty-message">Нет добавленных брендов</p>';
            return;
        }

        brandsList.innerHTML = this.brands.map(brand => `
            <div class="brand-item ${!brand.isActive ? 'inactive' : ''}" data-brand-id="${brand.id}">
                <div class="brand-info">
                    <h3 class="brand-name">${brand.name}</h3>
                    <span class="brand-status">${brand.isActive ? 'Активный' : 'Неактивный'}</span>
                </div>
                <div class="brand-actions">
                    <button class="btn-edit" onclick="brandsManager.editBrand(${brand.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-toggle" onclick="brandsManager.toggleBrand(${brand.id})">
                        ${brand.isActive ? 
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' : 
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                        }
                    </button>
                    <button class="btn-delete" onclick="brandsManager.deleteBrand(${brand.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async addBrand() {
        const input = document.getElementById('brand-name-input');
        if (!input || !input.value.trim()) {
            this.showMessage('Введите название бренда', 'error');
            return;
        }

        const brandName = input.value.trim();

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/brands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: brandName })
            });

            if (response.ok) {
                const newBrand = await response.json();
                this.brands.push(newBrand);
                this.renderBrands();
                input.value = '';
                this.showMessage(`Бренд "${brandName}" успешно добавлен`, 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Ошибка при добавлении бренда', 'error');
            }
        } catch (error) {
            console.error('Error adding brand:', error);
            this.showMessage('Ошибка при добавлении бренда', 'error');
        }
    }

    async editBrand(brandId) {
        const brand = this.brands.find(b => b.id === brandId);
        if (!brand) return;

        const newName = prompt('Введите новое название бренда:', brand.name);
        if (!newName || newName.trim() === brand.name) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/brands/${brandId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName.trim() })
            });

            if (response.ok) {
                const updatedBrand = await response.json();
                const index = this.brands.findIndex(b => b.id === brandId);
                this.brands[index] = updatedBrand;
                this.renderBrands();
                this.showMessage('Бренд успешно обновлен', 'success');
            } else {
                this.showMessage('Ошибка при обновлении бренда', 'error');
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            this.showMessage('Ошибка при обновлении бренда', 'error');
        }
    }

    async toggleBrand(brandId) {
        const brand = this.brands.find(b => b.id === brandId);
        if (!brand) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/brands/${brandId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !brand.isActive })
            });

            if (response.ok) {
                const updatedBrand = await response.json();
                const index = this.brands.findIndex(b => b.id === brandId);
                this.brands[index] = updatedBrand;
                this.renderBrands();
                this.showMessage('Статус бренда изменен', 'success');
            }
        } catch (error) {
            console.error('Error toggling brand:', error);
            this.showMessage('Ошибка при изменении статуса', 'error');
        }
    }

    async deleteBrand(brandId) {
        const brand = this.brands.find(b => b.id === brandId);
        if (!brand) return;

        if (!confirm(`Вы уверены, что хотите удалить бренд "${brand.name}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/brands/${brandId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.brands = this.brands.filter(b => b.id !== brandId);
                this.renderBrands();
                this.showMessage(`Бренд "${brand.name}" удален`, 'success');
            } else {
                this.showMessage('Ошибка при удалении бренда', 'error');
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
            this.showMessage('Ошибка при удалении бренда', 'error');
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message ${type}`;
        messageDiv.textContent = message;
        
        // Add to page
        document.body.appendChild(messageDiv);
        
        // Style the message
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '4px',
            backgroundColor: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease'
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
let brandsManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        brandsManager = new BrandsManager();
    });
} else {
    brandsManager = new BrandsManager();
}
