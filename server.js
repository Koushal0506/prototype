const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Perplexity AI Configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Farming products database (same as before)
const farmingProducts = {
    seeds: [
        {
            id: 1,
            name: "Hybrid Wheat Seeds",
            price: "₹450/kg",
            image: "/images/wheat-seeds.jpg",
            link: "https://www.amazon.in/Hybrid-Wheat-Seeds-High-Yield/dp/B08XYZ1234",
            description: "High yield hybrid wheat seeds with disease resistance"
        },
        {
            id: 2,
            name: "Basmati Rice Seeds",
            price: "₹380/kg",
            image: "/images/rice-seeds.jpg",
            link: "https://www.amazon.in/Basmati-Rice-Seeds-Premium-Quality/dp/B08ABC5678",
            description: "Premium quality basmati rice seeds for aromatic yield"
        }
    ],
    fertilizers: [
        {
            id: 1,
            name: "NPK Fertilizer",
            price: "₹800/50kg",
            image: "/images/npk-fertilizer.jpg",
            link: "https://www.amazon.in/NPK-Fertilizer-Plant-Nutrient-50kg/dp/B09XYZ1234",
            description: "Balanced NPK fertilizer for all crops"
        },
        {
            id: 2,
            name: "Organic Compost",
            price: "₹600/25kg",
            image: "/images/organic-compost.jpg",
            link: "https://www.amazon.in/Organic-Compost-Natural-Fertilizer-25kg/dp/B09ABC5678",
            description: "100% natural organic compost for soil health"
        }
    ],
    pesticides: [
        {
            id: 1,
            name: "Neem Oil Pesticide",
            price: "₹250/liter",
            image: "/images/neem-oil.jpg",
            link: "https://www.amazon.in/Neem-Oil-Pesticide-Organic-1000ml/dp/B10XYZ1234",
            description: "Organic neem oil for pest control"
        },
        {
            id: 2,
            name: "Insecticide Spray",
            price: "₹350/500ml",
            image: "/images/insecticide.jpg",
            link: "https://www.amazon.in/Insecticide-Spray-Crop-Protection-500ml/dp/B10ABC5678",
            description: "Effective insecticide for crop protection"
        }
    ],
    equipment: [
        {
            id: 1,
            name: "Hand Sprayer",
            price: "₹1,200",
            image: "/images/sprayer.jpg",
            link: "https://www.amazon.in/Hand-Sprayer-Agricultural-Equipment-5L/dp/B11XYZ1234",
            description: "5L manual sprayer for pesticides and fertilizers"
        },
        {
            id: 2,
            name: "Pruning Shears",
            price: "₹850",
            image: "/images/shears.jpg",
            link: "https://www.amazon.in/Pruning-Shears-Gardening-Tools-Steel/dp/B11ABC5678",
            description: "Professional pruning shears for gardening"
        }
    ]
};

// Perplexity AI Function
async function askPerplexity(question) {
    try {
        console.log('🤖 Asking Perplexity AI...');
        
        const response = await axios.post(PERPLEXITY_API_URL, {
            model: "sonar",
            messages: [
                {
                    role: "system",
                    content: `You are Krishi Mitra, an AI farming assistant for Indian farmers. 
                    Provide helpful, practical advice in simple language. Be specific about 
                    farming techniques, pest control, soil management, and crop cultivation.
                    Focus on Indian agricultural practices and conditions.`
                },
                {
                    role: "user",
                    content: question
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Perplexity API error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
}

// Suggest products based on question
function suggestProducts(question) {
    const lowerQuestion = question.toLowerCase();
    const suggestions = [];

    if (lowerQuestion.includes('pest') || lowerQuestion.includes('insect') || lowerQuestion.includes('कीट')) {
        suggestions.push(...farmingProducts.pesticides.slice(0, 2));
    }
    if (lowerQuestion.includes('soil') || lowerQuestion.includes('fertilizer') || lowerQuestion.includes('मिट्टी') || lowerQuestion.includes('खाद')) {
        suggestions.push(...farmingProducts.fertilizers.slice(0, 2));
    }
    if (lowerQuestion.includes('seed') || lowerQuestion.includes('crop') || lowerQuestion.includes('बीज') || lowerQuestion.includes('फसल')) {
        suggestions.push(...farmingProducts.seeds.slice(0, 2));
    }
    if (lowerQuestion.includes('tool') || lowerQuestion.includes('equipment') || lowerQuestion.includes('उपकरण')) {
        suggestions.push(...farmingProducts.equipment.slice(0, 2));
    }

    return suggestions;
}

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
    res.json(farmingProducts);
});

// Get products by category
app.get('/api/products/:category', (req, res) => {
    const category = req.params.category;
    if (farmingProducts[category]) {
        res.json(farmingProducts[category]);
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

// AI Chat endpoint with Perplexity
app.post('/api/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Please provide a question.' });
    }

    console.log('👨‍🌾 Farmer question:', question);

    try {
        // Get AI response from Perplexity
        const aiResponse = await askPerplexity(question);
        
        // Get related products
        const relatedProducts = suggestProducts(question);

        res.json({
            answer: aiResponse,
            sources: [],
            relatedProducts: relatedProducts
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        
        // Fallback response if Perplexity fails
        res.json({
            answer: "I'm here to help with farming questions! Ask me about crops, pests, soil, fertilizers, or farming techniques. Currently, I'm experiencing technical difficulties with the AI service.",
            sources: [],
            relatedProducts: suggestProducts(question)
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Farmer Assistant API',
        ai_provider: 'Perplexity AI',
        features: ['AI Chat', 'Product Store', 'Multi-language Support']
    });
});

// Test Perplexity connection
app.get('/api/test-ai', async (req, res) => {
    try {
        const testResponse = await askPerplexity("Hello, are you working?");
        res.json({
            success: true,
            response: testResponse,
            message: 'Perplexity AI is connected successfully!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Check your Perplexity API key and internet connection'
        });
    }
});

app.listen(port, () => {
    console.log('\n==========================================');
    console.log('🚀 Farmer Assistant Server Started!');
    console.log('==========================================');
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`✅ Health: http://localhost:${port}/api/health`);
    console.log(`🤖 AI Test: http://localhost:${port}/api/test-ai`);
    console.log('==========================================');
    console.log('🎯 Using Perplexity AI for smart responses');
    console.log('🛒 Integrated farming product store');
    console.log('🌍 Multi-language support enabled');
    console.log('==========================================');
});