// Vercel serverless function
// Deployed URL will be: https://YOUR-PROJECT.vercel.app/api/estimate-food
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

function extractJson(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  // Basic CORS so the Expo app (any origin) can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { foodName } = req.body || {};
  if (!foodName || typeof foodName !== 'string') {
    return res.status(400).json({ error: 'foodName is required' });
  }

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Estimate typical nutrition macros for a single reasonable serving of: "${foodName}".
Respond with ONLY a raw JSON object, no markdown fences, no other text, in exactly this shape:
{"calories": <integer kcal>, "protein": <integer grams>, "carbs": <integer grams>, "fat": <integer grams>}`,
      }],
    });
    const text = message.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    const data = extractJson(text);
    res.status(200).json(data);
  } catch (err) {
    console.error('estimate-food error:', err);
    res.status(500).json({ error: 'Failed to estimate macros' });
  }
}
