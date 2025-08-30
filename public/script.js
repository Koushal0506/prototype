// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const popupMessages = document.getElementById('popupMessages');
const popupInput = document.getElementById('popupInput');
const aiPopup = document.getElementById('aiPopup');

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts('all');
    setupCategoryButtons();
});

// Load products by category
async function loadProducts(category) {
    try {
        let url = '/api/products';
        if (category !== 'all') {
            url = `/api/products/${category}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        displayProducts(data, category);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in grid
function displayProducts(products, category) {
    if (category === 'all') {
        // Flatten all products
        const allProducts = [];
        for (const category in products) {
            allProducts.push(...products[category]);
        }
        products = allProducts;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas fa-seedling"></i>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price}</div>
                <p class="product-description">${product.description}</p>
                <button class="buy-btn" onclick="window.open('${product.link}', '_blank')">
                    <i class="fas fa-shopping-cart"></i> Buy Now
                </button>
            </div>
        </div>
    `).join('');
}

// Setup category buttons
function setupCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            loadProducts(this.dataset.category);
        });
    });
}

// AI Chat Functions
async function sendMessage() {
    const question = userInput.value.trim();
    if (!question) return;
    
    addMessage(question, 'user');
    userInput.value = '';
    
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question })
        });
        
        const data = await response.json();
        addMessage(data.answer, 'ai');
        
        // Show related products if available
        if (data.relatedProducts && data.relatedProducts.length > 0) {
            showRelatedProducts(data.relatedProducts);
        }
        
    } catch (error) {
        addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
}

async function sendPopupMessage() {
    const question = popupInput.value.trim();
    if (!question) return;
    
    addPopupMessage(question, 'user');
    popupInput.value = '';
    
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question })
        });
        
        const data = await response.json();
        addPopupMessage(data.answer, 'ai');
        
    } catch (error) {
        addPopupMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<strong>${type === 'user' ? 'You' : 'Krishi Mitra AI'}:</strong> ${text}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addPopupMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<strong>${type === 'user' ? 'You' : 'AI'}:</strong> ${text}`;
    popupMessages.appendChild(messageDiv);
    popupMessages.scrollTop = popupMessages.scrollHeight;
}

function showRelatedProducts(products) {
    const productsHTML = products.map(product => `
        <div style="margin: 10px 0; padding: 10px; background: #e8f5e8; border-radius: 8px;">
            <strong>${product.name}</strong> - ${product.price}<br>
            <small>${product.description}</small><br>
            <button onclick="window.open('${product.link}', '_blank')" 
                    style="background: #4a7c2a; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-top: 5px;">
                View Product
            </button>
        </div>
    `).join('');
    
    addMessage(`I found these products that might help you:<br>${productsHTML}`, 'ai');
}

// Popup Functions
function openAIHelp() {
    aiPopup.style.display = 'block';
}

function closeAIHelp() {
    aiPopup.style.display = 'none';
}

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Keyboard support
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

popupInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendPopupMessage();
});

// Close popup when clicking outside
document.addEventListener('click', function(e) {
    if (aiPopup.style.display === 'block' && !aiPopup.contains(e.target) && !e.target.closest('.btn-primary')) {
        closeAIHelp();
    }
});