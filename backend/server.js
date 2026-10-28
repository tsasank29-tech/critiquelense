const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis Cluster connection for 1M+ user session & critique caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Meta Model API client (OpenAI-compatible endpoint)
const metaAI = new OpenAI({
    baseURL: 'https://api.meta.ai/v1',
    apiKey: process.env.META_MODEL_API_KEY
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Global Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Serve static frontend files
app.use(express.static('../frontend'));

// Critique Endpoint with Redis Caching
app.post('/api/critique', async (req, res) => {
    try {
        const { imageHash, imageBase64 } = req.body;
        if (!imageHash || !imageBase64) {
            return res.status(400).json({ error: 'Missing image payload or hash' });
        }

        // Check Redis cache first (handles 1M user reads instantly)
        const cachedCritique = await redis.get(`critique:${imageHash}`);
        if (cachedCritique) {
            return res.json({ source: 'cache', data: JSON.parse(cachedCritique) });
        }

        // Call Meta Model API (muse-spark-1.3)
        const response = await metaAI.chat.completions.create({
            model: 'muse-spark-1.3',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyze this photo. Return a JSON object with: 1. "positives" (array of strings), 2. "negatives" (array of objects with "title", "issue", "tip", and "fixType" as "exposure" or "blur").' },
                        { type: 'image_url', image_url: { url: imageBase64 } }
                    ]
                }
            ],
            response_format: { type: 'json_object' }
        });

        const critiqueData = JSON.parse(response.choices[0].message.content);

        // Store in Redis cache with 24-hour TTL
        await redis.setex(`critique:${imageHash}`, 86400, JSON.stringify(critiqueData));

        res.json({ source: 'model_api', data: critiqueData });
    } catch (error) {
        console.error('Critique generation error:', error);
        res.status(500).json({ error: 'Internal server error processing critique' });
    }
});

app.listen(port, () => {
    console.log(`CritiqueLens AI Production Backend running on port ${port}`);
});
