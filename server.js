const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;

// Simple in-memory session storage (in production use Redis or database)
const sessions = new Map();

// Admin credentials (in production store hashed in database)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Change this!

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Products file path
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const HOMEPAGE_IMAGES_FILE = path.join(__dirname, 'homepage-images.json');
const HOMEPAGE_TEXTS_FILE = path.join(__dirname, 'homepage-texts.json');
const BUTTON_TEXTS_FILE = path.join(__dirname, 'button-texts.json');
const BRANDS_FILE = path.join(__dirname, 'brands.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');

// Initialize products file if it doesn't exist
if (!fs.existsSync(PRODUCTS_FILE)) {
    const initialData = {
        lastId: 0,
        products: {
            jackets: [],
            shoes: [],
            coats: [],
            sweaters: [],
            glasses: [],
            pants: [],
            hats: [],
            kurtki: [],
            obuv: []
        }
    };
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialData, null, 2));
    console.log('Created products.json file');
}

// Initialize homepage images file if it doesn't exist
if (!fs.existsSync(HOMEPAGE_IMAGES_FILE)) {
    const initialImages = {
        hero: null,
        campaign1: null,
        campaign2: null,
        campaign3: null,
        about1: null,
        about2: null
    };
    fs.writeFileSync(HOMEPAGE_IMAGES_FILE, JSON.stringify(initialImages, null, 2));
    console.log('Created homepage-images.json file');
}

// Initialize homepage texts file if it doesn't exist
if (!fs.existsSync(HOMEPAGE_TEXTS_FILE)) {
    const initialTexts = {
        campaign1: {
            label: "FALL WINTER 025",
            title: "FW025 ADV<br>CAMPAIGN",
            description: ""
        },
        campaign2: {
            label: "FALL WINTER 025",
            title: "PUFFER",
            description: "Cold-Weather Icons: soft-touch essentials in updated colourways"
        },
        campaign3: {
            label: "FALL WINTER 025",
            title: "THE METROPOLIS<br>SERIES",
            description: "Functionality and performance for the contemporary urban environment"
        },
        about: {
            title: "ABOUT C.P. COMPANY",
            text: "In 1971, Italian designer Massimo Osti founded Chester Perry..."
        }
    };
    fs.writeFileSync(HOMEPAGE_TEXTS_FILE, JSON.stringify(initialTexts, null, 2));
    console.log('Created homepage-texts.json file');
}

// Initialize button texts file if it doesn't exist
if (!fs.existsSync(BUTTON_TEXTS_FILE)) {
    const initialButtonTexts = {
        "hero-btn": "SHOP NOW",
        "campaign1-btn": "DISCOVER MORE",
        "campaign2-btn": "DISCOVER MORE",
        "campaign3-btn": "DISCOVER MORE"
    };
    fs.writeFileSync(BUTTON_TEXTS_FILE, JSON.stringify(initialButtonTexts, null, 2));
    console.log('Created button-texts.json file');
}

// Initialize brands file if it doesn't exist
if (!fs.existsSync(BRANDS_FILE)) {
    const initialBrands = {
        brands: [
            { id: 1, name: "C.P. Company", isActive: true },
            { id: 2, name: "Stone Island", isActive: true }
        ],
        lastId: 2
    };
    fs.writeFileSync(BRANDS_FILE, JSON.stringify(initialBrands, null, 2));
    console.log('Created brands.json file');
}

// Initialize categories file if it doesn't exist
if (!fs.existsSync(CATEGORIES_FILE)) {
    const initialCategories = {
        categories: [
            { id: 'jackets', name: 'КУРТКИ', slug: 'jackets', description: 'Мужские куртки', isDefault: true },
            { id: 'shoes', name: 'ОБУВЬ', slug: 'shoes', description: 'Мужская обувь', isDefault: true },
            { id: 'coats', name: 'ПАЛЬТО', slug: 'coats', description: 'Мужские пальто', isDefault: true },
            { id: 'sweaters', name: 'КОФТЫ', slug: 'sweaters', description: 'Мужские кофты и свитера', isDefault: true },
            { id: 'glasses', name: 'ОЧКИ', slug: 'glasses', description: 'Солнцезащитные очки', isDefault: true },
            { id: 'pants', name: 'ШТАНЫ', slug: 'pants', description: 'Мужские брюки и джинсы', isDefault: true },
            { id: 'hats', name: 'ГОЛОВНОЙ УБОР', slug: 'hats', description: 'Шапки и кепки', isDefault: true }
        ]
    };
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initialCategories, null, 2));
    console.log('Created categories.json file');
}

// Helper functions
function readProducts() {
    try {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products file:', error);
        return {
            lastId: 0,
            products: {}
        };
    }
}

function writeProducts(data) {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing products file:', error);
        return false;
    }
}

// API Routes

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Store session
        sessions.set(token, {
            username,
            isAdmin: true,
            createdAt: Date.now()
        });
        
        // Clean old sessions (older than 24 hours)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        for (const [key, session] of sessions.entries()) {
            if (session.createdAt < dayAgo) {
                sessions.delete(key);
            }
        }
        
        res.json({ 
            success: true, 
            token,
            message: 'Admin logged in successfully'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// Check admin authentication
app.get('/api/check-admin', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ isAdmin: false });
    }
    
    const token = authHeader.substring(7);
    const session = sessions.get(token);
    
    if (session && session.isAdmin) {
        // Check if session is not older than 24 hours
        const isValid = (Date.now() - session.createdAt) < (24 * 60 * 60 * 1000);
        
        if (isValid) {
            return res.json({ isAdmin: true, username: session.username });
        } else {
            sessions.delete(token);
        }
    }
    
    res.json({ isAdmin: false });
});

// Logout endpoint
app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        sessions.delete(token);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
});

// Middleware to check admin for protected routes
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const session = sessions.get(token);
    
    if (session && session.isAdmin) {
        const isValid = (Date.now() - session.createdAt) < (24 * 60 * 60 * 1000);
        
        if (isValid) {
            req.admin = session;
            return next();
        }
    }
    
    res.status(401).json({ error: 'Unauthorized' });
}

// Brand API endpoints

// Get all brands
app.get('/api/brands', (req, res) => {
    try {
        const data = fs.readFileSync(BRANDS_FILE, 'utf8');
        const brandsData = JSON.parse(data);
        res.json(brandsData.brands);
    } catch (error) {
        console.error('Error reading brands:', error);
        res.json([]);
    }
});

// Add new brand (admin only)
app.post('/api/brands', requireAdmin, (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Brand name is required' });
        }
        
        const data = fs.readFileSync(BRANDS_FILE, 'utf8');
        const brandsData = JSON.parse(data);
        
        // Check if brand already exists
        const existingBrand = brandsData.brands.find(b => b.name.toLowerCase() === name.toLowerCase());
        if (existingBrand) {
            return res.status(400).json({ error: 'Brand already exists' });
        }
        
        // Create new brand
        brandsData.lastId++;
        const newBrand = {
            id: brandsData.lastId,
            name: name.trim(),
            isActive: true
        };
        
        brandsData.brands.push(newBrand);
        fs.writeFileSync(BRANDS_FILE, JSON.stringify(brandsData, null, 2));
        
        console.log('Brand added:', newBrand.name);
        res.json(newBrand);
    } catch (error) {
        console.error('Error adding brand:', error);
        res.status(500).json({ error: 'Failed to add brand' });
    }
});

// Update brand (admin only)
app.put('/api/brands/:id', requireAdmin, (req, res) => {
    try {
        const brandId = parseInt(req.params.id);
        const { name, isActive } = req.body;
        
        const data = fs.readFileSync(BRANDS_FILE, 'utf8');
        const brandsData = JSON.parse(data);
        
        const brandIndex = brandsData.brands.findIndex(b => b.id === brandId);
        if (brandIndex === -1) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        
        if (name !== undefined) brandsData.brands[brandIndex].name = name.trim();
        if (isActive !== undefined) brandsData.brands[brandIndex].isActive = isActive;
        
        fs.writeFileSync(BRANDS_FILE, JSON.stringify(brandsData, null, 2));
        
        console.log('Brand updated:', brandsData.brands[brandIndex]);
        res.json(brandsData.brands[brandIndex]);
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
});

// Delete brand (admin only)
app.delete('/api/brands/:id', requireAdmin, (req, res) => {
    try {
        const brandId = parseInt(req.params.id);
        
        const data = fs.readFileSync(BRANDS_FILE, 'utf8');
        const brandsData = JSON.parse(data);
        
        const brandIndex = brandsData.brands.findIndex(b => b.id === brandId);
        if (brandIndex === -1) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        
        const deletedBrand = brandsData.brands.splice(brandIndex, 1)[0];
        fs.writeFileSync(BRANDS_FILE, JSON.stringify(brandsData, null, 2));
        
        console.log('Brand deleted:', deletedBrand.name);
        res.json({ message: 'Brand deleted', brand: deletedBrand });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ error: 'Failed to delete brand' });
    }
});

// Get products by brand
app.get('/api/products/brand/:brandId', (req, res) => {
    try {
        const brandId = parseInt(req.params.brandId);
        const data = readProducts();
        
        const brandProducts = [];
        for (const category in data.products) {
            const categoryProducts = data.products[category].filter(p => p.brandId === brandId);
            brandProducts.push(...categoryProducts);
        }
        
        res.json(brandProducts);
    } catch (error) {
        console.error('Error getting products by brand:', error);
        res.status(500).json({ error: 'Failed to get products by brand' });
    }
});

// Categories API endpoints

// Get all categories
app.get('/api/categories', (req, res) => {
    try {
        if (!fs.existsSync(CATEGORIES_FILE)) {
            res.json([]);
            return;
        }
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        const categoriesData = JSON.parse(data);
        
        // Add product count for each category
        const productsData = readProducts();
        const categoriesWithCount = categoriesData.categories.map(category => {
            const productCount = productsData.products[category.slug] ? productsData.products[category.slug].length : 0;
            return {
                ...category,
                productCount
            };
        });
        
        res.json(categoriesWithCount);
    } catch (error) {
        console.error('Error reading categories:', error);
        res.json([]);
    }
});

// Add new category (admin only)
app.post('/api/categories', requireAdmin, (req, res) => {
    try {
        const { name, slug, description } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }
        
        // Read current categories
        let categoriesData;
        if (fs.existsSync(CATEGORIES_FILE)) {
            const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
            categoriesData = JSON.parse(data);
        } else {
            categoriesData = { categories: [] };
        }
        
        // Check if category already exists
        const existingCategory = categoriesData.categories.find(c => c.slug === slug);
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this slug already exists' });
        }
        
        // Create new category
        const newCategory = {
            id: slug,
            name: name,
            slug: slug,
            description: description || '',
            isDefault: false
        };
        
        categoriesData.categories.push(newCategory);
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2));
        
        // Add category to products structure if it doesn't exist
        const productsData = readProducts();
        if (!productsData.products[slug]) {
            productsData.products[slug] = [];
            writeProducts(productsData);
        }
        
        console.log('Category added:', newCategory.name);
        res.json(newCategory);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// Update category (admin only)
app.put('/api/categories/:id', requireAdmin, (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, slug, description } = req.body;
        
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        const categoriesData = JSON.parse(data);
        
        const categoryIndex = categoriesData.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Don't allow changing slug of default categories
        if (categoriesData.categories[categoryIndex].isDefault && slug !== categoriesData.categories[categoryIndex].slug) {
            return res.status(400).json({ error: 'Cannot change slug of default category' });
        }
        
        if (name) categoriesData.categories[categoryIndex].name = name;
        if (description !== undefined) categoriesData.categories[categoryIndex].description = description;
        
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2));
        
        console.log('Category updated:', categoriesData.categories[categoryIndex]);
        res.json(categoriesData.categories[categoryIndex]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category (admin only)
app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    try {
        const categoryId = req.params.id;
        
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        const categoriesData = JSON.parse(data);
        
        const categoryIndex = categoriesData.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Don't allow deleting default categories
        if (categoriesData.categories[categoryIndex].isDefault) {
            return res.status(400).json({ error: 'Cannot delete default category' });
        }
        
        const deletedCategory = categoriesData.categories.splice(categoryIndex, 1)[0];
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2));
        
        // Remove category from products structure
        const productsData = readProducts();
        if (productsData.products[deletedCategory.slug]) {
            delete productsData.products[deletedCategory.slug];
            writeProducts(productsData);
        }
        
        console.log('Category deleted:', deletedCategory.name);
        res.json({ message: 'Category deleted', category: deletedCategory });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Create category page from template (admin only)
app.post('/api/create-category-page', requireAdmin, (req, res) => {
    try {
        const { slug, name, description } = req.body;
        
        if (!slug || !name) {
            return res.status(400).json({ error: 'Slug and name are required' });
        }
        
        // Read template
        const templatePath = path.join(__dirname, 'category-template.html');
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: 'Template file not found' });
        }
        
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholders
        template = template.replace(/{{CATEGORY_NAME}}/g, name);
        template = template.replace(/{{CATEGORY_SLUG}}/g, slug);
        template = template.replace(/{{CATEGORY_DESCRIPTION}}/g, description || `Коллекция товаров категории ${name}`);
        
        // Write new category page
        const newFilePath = path.join(__dirname, `category-${slug}.html`);
        fs.writeFileSync(newFilePath, template);
        
        console.log('Category page created:', newFilePath);
        res.json({ message: 'Category page created successfully', file: `category-${slug}.html` });
    } catch (error) {
        console.error('Error creating category page:', error);
        res.status(500).json({ error: 'Failed to create category page' });
    }
});

// Delete category page (admin only)
app.delete('/api/delete-category-page', requireAdmin, (req, res) => {
    try {
        const { slug } = req.body;
        
        if (!slug) {
            return res.status(400).json({ error: 'Slug is required' });
        }
        
        const filePath = path.join(__dirname, `category-${slug}.html`);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Category page deleted:', filePath);
            res.json({ message: 'Category page deleted successfully' });
        } else {
            res.status(404).json({ error: 'Category page not found' });
        }
    } catch (error) {
        console.error('Error deleting category page:', error);
        res.status(500).json({ error: 'Failed to delete category page' });
    }
});

// Get all products
app.get('/api/products', (req, res) => {
    const data = readProducts();
    res.json(data);
});

// Get products by category
app.get('/api/products/:category', (req, res) => {
    const { category } = req.params;
    const data = readProducts();
    
    if (data.products[category]) {
        res.json(data.products[category]);
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

// Get single product by ID
app.get('/api/product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const data = readProducts();
    
    for (const category in data.products) {
        const product = data.products[category].find(p => p.id === productId);
        if (product) {
            return res.json(product);
        }
    }
    
    res.status(404).json({ error: 'Product not found' });
});

// Add new product
app.post('/api/products/:category', (req, res) => {
    const { category } = req.params;
    const productData = req.body;
    
    const data = readProducts();
    
    // Generate new ID
    data.lastId += 1;
    
    // Create product object
    const product = {
        id: data.lastId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        sizes: productData.sizes || [],
        images: productData.images || [],
        category: category,
        brandId: productData.brandId || 1, // Default to C.P. Company if not specified
        brandName: productData.brandName || 'C.P. Company',
        dateAdded: new Date().toISOString(),
        isActive: true,
        isTrending: productData.isTrending || false
    };
    
    // Initialize category if it doesn't exist
    if (!data.products[category]) {
        data.products[category] = [];
    }
    
    // Add product to category
    data.products[category].push(product);
    
    // Save to file
    if (writeProducts(data)) {
        res.json(product);
        console.log(`Product added: ${product.name} to ${category}`);
    } else {
        res.status(500).json({ error: 'Failed to save product' });
    }
});

// Update product
app.put('/api/product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const updates = req.body;
    
    const data = readProducts();
    
    for (const category in data.products) {
        const productIndex = data.products[category].findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            data.products[category][productIndex] = {
                ...data.products[category][productIndex],
                ...updates
            };
            
            if (writeProducts(data)) {
                return res.json(data.products[category][productIndex]);
            } else {
                return res.status(500).json({ error: 'Failed to update product' });
            }
        }
    }
    
    res.status(404).json({ error: 'Product not found' });
});

// Delete product
app.delete('/api/product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    
    const data = readProducts();
    
    for (const category in data.products) {
        const productIndex = data.products[category].findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            const deletedProduct = data.products[category].splice(productIndex, 1)[0];
            
            if (writeProducts(data)) {
                return res.json({ message: 'Product deleted', product: deletedProduct });
            } else {
                return res.status(500).json({ error: 'Failed to delete product' });
            }
        }
    }
    
    res.status(404).json({ error: 'Product not found' });
});

// Upload image endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

// Get homepage images
app.get('/api/homepage-images', (req, res) => {
    try {
        const data = fs.readFileSync(HOMEPAGE_IMAGES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading homepage images:', error);
        res.status(500).json({ error: 'Failed to read homepage images' });
    }
});

// Update homepage images
app.post('/api/homepage-images', (req, res) => {
    try {
        const images = req.body;
        fs.writeFileSync(HOMEPAGE_IMAGES_FILE, JSON.stringify(images, null, 2));
        res.json({ success: true, images });
        console.log('Homepage images updated');
    } catch (error) {
        console.error('Error saving homepage images:', error);
        res.status(500).json({ error: 'Failed to save homepage images' });
    }
});

// Get login page image
app.get('/api/login-image', (req, res) => {
    try {
        const data = fs.readFileSync(HOMEPAGE_IMAGES_FILE, 'utf8');
        const images = JSON.parse(data);
        res.json({ loginImage: images.loginImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop' });
    } catch (error) {
        console.error('Error reading login image:', error);
        res.json({ loginImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop' });
    }
});

// Update login page image
app.post('/api/login-image', (req, res) => {
    try {
        const { loginImage } = req.body;
        const data = fs.readFileSync(HOMEPAGE_IMAGES_FILE, 'utf8');
        const images = JSON.parse(data);
        images.loginImage = loginImage;
        fs.writeFileSync(HOMEPAGE_IMAGES_FILE, JSON.stringify(images, null, 2));
        res.json({ success: true, loginImage });
        console.log('Login image updated');
    } catch (error) {
        console.error('Error saving login image:', error);
        res.status(500).json({ error: 'Failed to save login image' });
    }
});

// Get homepage texts
app.get('/api/homepage-texts', (req, res) => {
    try {
        const data = fs.readFileSync(HOMEPAGE_TEXTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading homepage texts:', error);
        res.status(500).json({ error: 'Failed to read homepage texts' });
    }
});

// Get button texts
app.get('/api/button-texts', (req, res) => {
    try {
        const data = fs.readFileSync(BUTTON_TEXTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading button texts:', error);
        res.status(500).json({ error: 'Failed to read button texts' });
    }
});

// Update button text (requires admin)
app.post('/api/button-texts/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        
        const data = fs.readFileSync(BUTTON_TEXTS_FILE, 'utf8');
        const buttonTexts = JSON.parse(data);
        
        buttonTexts[id] = text;
        
        fs.writeFileSync(BUTTON_TEXTS_FILE, JSON.stringify(buttonTexts, null, 2));
        res.json({ success: true, id, text });
        console.log(`Button text updated: ${id} = ${text}`);
    } catch (error) {
        console.error('Error saving button text:', error);
        res.status(500).json({ error: 'Failed to save button text' });
    }
});

// Update homepage texts
app.post('/api/homepage-texts', (req, res) => {
    try {
        const texts = req.body;
        fs.writeFileSync(HOMEPAGE_TEXTS_FILE, JSON.stringify(texts, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving homepage texts:', error);
        res.status(500).json({ error: 'Failed to save texts' });
    }
});

// Hero texts file
const HERO_TEXTS_FILE = path.join(__dirname, 'hero-texts.json');

// Initialize hero texts file if it doesn't exist
if (!fs.existsSync(HERO_TEXTS_FILE)) {
    fs.writeFileSync(HERO_TEXTS_FILE, JSON.stringify({
        'hero-title': 'HIGH<br>PERFORMANCE<br>JACKETS',
        'hero-subtitle': 'Cutting-edge technologies for all winter conditions'
    }, null, 2));
}

// Get hero texts
app.get('/api/hero-texts', (req, res) => {
    try {
        const data = fs.readFileSync(HERO_TEXTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading hero texts:', error);
        res.json({});
    }
});

// Update hero texts (requires admin)
app.post('/api/hero-texts', requireAdmin, (req, res) => {
    try {
        // Read existing texts
        let existingTexts = {};
        if (fs.existsSync(HERO_TEXTS_FILE)) {
            existingTexts = JSON.parse(fs.readFileSync(HERO_TEXTS_FILE, 'utf8'));
        }
        
        // Merge with new texts
        const updatedTexts = { ...existingTexts, ...req.body };
        
        // Save to file
        fs.writeFileSync(HERO_TEXTS_FILE, JSON.stringify(updatedTexts, null, 2));
        
        console.log('Hero texts updated:', req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving hero texts:', error);
        res.status(500).json({ error: 'Failed to save hero texts' });
    }
});

// Hero content file
const HERO_CONTENT_FILE = path.join(__dirname, 'hero-content.json');

// Initialize hero content file if it doesn't exist
if (!fs.existsSync(HERO_CONTENT_FILE)) {
    fs.writeFileSync(HERO_CONTENT_FILE, JSON.stringify({
        title: 'HIGH<br>PERFORMANCE<br>JACKETS',
        subtitle: 'Cutting-edge technologies for all winter conditions',
        buttonText: 'SHOP NOW',
        backgroundImage: '/uploads/hero-default.jpg'
    }, null, 2));
}

// Get hero content
app.get('/api/hero-content', (req, res) => {
    try {
        const data = fs.readFileSync(HERO_CONTENT_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading hero content:', error);
        res.json({
            title: 'HIGH<br>PERFORMANCE<br>JACKETS',
            subtitle: 'Cutting-edge technologies for all winter conditions',
            buttonText: 'SHOP NOW',
            backgroundImage: '/uploads/hero-default.jpg'
        });
    }
});

// Update hero content with image upload (requires admin)
app.post('/api/hero-content', requireAdmin, upload.single('image'), (req, res) => {
    try {
        const { title, subtitle, buttonText } = req.body;
        
        // Read existing content
        let heroContent = {
            title: 'HIGH<br>PERFORMANCE<br>JACKETS',
            subtitle: 'Cutting-edge technologies for all winter conditions',
            buttonText: 'SHOP NOW',
            backgroundImage: '/uploads/hero-default.jpg'
        };
        
        if (fs.existsSync(HERO_CONTENT_FILE)) {
            heroContent = JSON.parse(fs.readFileSync(HERO_CONTENT_FILE, 'utf8'));
        }
        
        // Update text fields
        if (title) heroContent.title = title.replace(/\n/g, '<br>');
        if (subtitle) heroContent.subtitle = subtitle;
        if (buttonText) heroContent.buttonText = buttonText;
        
        // Update image if uploaded
        if (req.file) {
            heroContent.backgroundImage = '/uploads/' + req.file.filename;
            console.log('New hero image uploaded:', req.file.filename);
        }
        
        // Save to file
        fs.writeFileSync(HERO_CONTENT_FILE, JSON.stringify(heroContent, null, 2));
        
        console.log('Hero content updated:', heroContent);
        res.json({ success: true, content: heroContent });
    } catch (error) {
        console.error('Error saving hero content:', error);
        res.status(500).json({ error: 'Failed to save hero content' });
    }
});

// Campaign content file
const CAMPAIGN_CONTENT_FILE = path.join(__dirname, 'campaign-content.json');

// Initialize campaign content file if it doesn't exist
if (!fs.existsSync(CAMPAIGN_CONTENT_FILE)) {
    fs.writeFileSync(CAMPAIGN_CONTENT_FILE, JSON.stringify({
        campaign1: {
            label: 'FALL WINTER 025',
            title: 'FW025 ADV<br>CAMPAIGN',
            description: 'Sportswear, Not for playing in',
            buttonText: 'DISCOVER MORE'
        },
        campaign2: {
            label: 'NEW ARRIVAL',
            title: 'GOGGLE JACKETS',
            description: 'New Italian Sportswear icons with integrated lens protection',
            buttonText: 'DISCOVER MORE'
        },
        campaign3: {
            label: 'FALL WINTER 025',
            title: 'THE METROPOLIS<br>SERIES',
            description: 'Functionality and performance for the contemporary urban environment',
            buttonText: 'DISCOVER MORE'
        }
    }, null, 2));
}

// Get campaign content
app.get('/api/campaign-content', (req, res) => {
    try {
        const data = fs.readFileSync(CAMPAIGN_CONTENT_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading campaign content:', error);
        res.json({});
    }
});

// Update campaign content (requires admin)
app.post('/api/campaign-content/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { label, title, description, buttonText, buttonLink } = req.body;
        
        // Read existing content
        const data = fs.readFileSync(CAMPAIGN_CONTENT_FILE, 'utf8');
        const campaignContent = JSON.parse(data);
        
        // Create campaign object if it doesn't exist
        if (!campaignContent[id]) {
            campaignContent[id] = {};
        }
        
        // Update only provided fields
        if (label !== undefined) campaignContent[id].label = label;
        if (title !== undefined) campaignContent[id].title = title;
        if (description !== undefined) campaignContent[id].description = description;
        if (buttonText !== undefined) campaignContent[id].buttonText = buttonText;
        if (buttonLink !== undefined) campaignContent[id].buttonLink = buttonLink;
        
        // Save to file
        fs.writeFileSync(CAMPAIGN_CONTENT_FILE, JSON.stringify(campaignContent, null, 2));
        
        console.log(`Campaign content updated for ${id}:`, campaignContent[id]);
        res.json({ success: true, content: campaignContent[id] });
    } catch (error) {
        console.error('Error saving campaign content:', error);
        res.status(500).json({ error: 'Failed to save campaign content' });
    }
});

// About content file
const ABOUT_CONTENT_FILE = path.join(__dirname, 'about-content.json');

// Initialize about content file if it doesn't exist
if (!fs.existsSync(ABOUT_CONTENT_FILE)) {
    fs.writeFileSync(ABOUT_CONTENT_FILE, JSON.stringify({
        title: 'ABOUT C.P. COMPANY',
        text: 'In 1971, Italian designer Massimo Osti founded Chester Perry, a brand best known for its screen-printed t-shirts. In 1978, it was renamed C.P. Company, marking the beginning of one of the most creative and influential eras in contemporary sportswear. For over 50 years, C.P. Company has pioneered a hybrid style that merged military, workwear, and sportswear influences, supported by ongoing research into cutting-edge fabrics and textile technologies. Among its most significant innovations is garment dyeing, first developed in the mid-\'70s and still a defining hallmark of the brand\'s collections. This fusion of functional design and Italian textile innovation lies at the core of C.P. Company and continues to shape every garment that carries its name.'
    }, null, 2));
}

// Get about content
app.get('/api/about-content', (req, res) => {
    try {
        const data = fs.readFileSync(ABOUT_CONTENT_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading about content:', error);
        res.json({});
    }
});

// Update about content (requires admin)
app.post('/api/about-content', requireAdmin, (req, res) => {
    try {
        const { title, text } = req.body;
        
        // Read current content
        const currentData = fs.readFileSync(ABOUT_CONTENT_FILE, 'utf8');
        const aboutContent = JSON.parse(currentData);
        
        // Update fields if provided
        if (title !== undefined) aboutContent.title = title;
        if (text !== undefined) aboutContent.text = text;
        
        // Save to file
        fs.writeFileSync(ABOUT_CONTENT_FILE, JSON.stringify(aboutContent, null, 2));
        
        console.log('About content updated:', aboutContent);
        res.json({ success: true, content: aboutContent });
    } catch (error) {
        console.error('Error saving about content:', error);
        res.status(500).json({ error: 'Failed to save about content' });
    }
});

// Page texts API
const PAGE_TEXTS_FILE = path.join(__dirname, 'page-texts.json');

// Initialize page texts file if it doesn't exist
if (!fs.existsSync(PAGE_TEXTS_FILE)) {
    fs.writeFileSync(PAGE_TEXTS_FILE, JSON.stringify({}, null, 2));
    console.log('Created page-texts.json file');
}

// Get page texts
app.get('/api/page-texts', (req, res) => {
    try {
        const { page } = req.query;
        const data = fs.readFileSync(PAGE_TEXTS_FILE, 'utf8');
        const texts = JSON.parse(data);
        
        if (page && texts[page]) {
            res.json(texts[page]);
        } else if (page) {
            res.json({});
        } else {
            res.json(texts);
        }
    } catch (error) {
        console.error('Error reading page texts:', error);
        res.status(500).json({ error: 'Failed to read page texts' });
    }
});

// Save page text
app.post('/api/page-texts', (req, res) => {
    try {
        const { id, content, page, timestamp } = req.body;
        
        const data = fs.readFileSync(PAGE_TEXTS_FILE, 'utf8');
        const texts = JSON.parse(data);
        
        if (!texts[page]) {
            texts[page] = {};
        }
        
        texts[page][id] = {
            content,
            timestamp,
            lastModified: new Date().toISOString()
        };
        
        fs.writeFileSync(PAGE_TEXTS_FILE, JSON.stringify(texts, null, 2));
        res.json({ success: true, id, content });
        console.log(`Page text updated: ${page}/${id}`);
    } catch (error) {
        console.error('Error saving page text:', error);
        res.status(500).json({ error: 'Failed to save page text' });
    }
});

// Clear all products (for testing)
app.delete('/api/products/all', (req, res) => {
    const initialData = {
        lastId: 0,
        products: {
            jackets: [],
            shoes: [],
            coats: [],
            sweaters: [],
            glasses: [],
            pants: [],
            hats: [],
            kurtki: [],
            obuv: []
        }
    };
    
    if (writeProducts(initialData)) {
        res.json({ message: 'All products cleared' });
    } else {
        res.status(500).json({ error: 'Failed to clear products' });
    }
});

// Upload image endpoint (requires admin auth)
app.post('/api/upload-image', requireAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Get all uploaded images (admin only)
app.get('/api/images', requireAdmin, (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ images: [] });
        }
        
        const files = fs.readdirSync(uploadsDir);
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                filename: file,
                url: `/uploads/${file}`,
                size: fs.statSync(path.join(uploadsDir, file)).size,
                modified: fs.statSync(path.join(uploadsDir, file)).mtime
            }));
        
        res.json({ images });
    } catch (error) {
        console.error('Error reading images:', error);
        res.status(500).json({ error: 'Failed to get images' });
    }
});

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Products will be saved to: ${PRODUCTS_FILE}`);
    console.log('\nAPI Endpoints:');
    console.log('GET    /api/products          - Get all products');
    console.log('GET    /api/products/:category - Get products by category');
    console.log('GET    /api/product/:id        - Get single product');
    console.log('POST   /api/products/:category - Add new product');
    console.log('PUT    /api/product/:id        - Update product');
    console.log('DELETE /api/product/:id        - Delete product');
    console.log('POST   /api/upload             - Upload image');
    console.log('\nTo stop server, press Ctrl+C');
});
