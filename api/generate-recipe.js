// Vercel serverless function
// Deployed URL will be: https://YOUR-PROJECT.vercel.app/api/generate-recipe
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

function extractJson(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, category } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `Create a healthy, ${category || 'balanced'}-style recipe called "${name}".
Respond with ONLY a raw JSON object, no markdown fences, no other text, in exactly this shape:
{
  "ingredients": ["<ingredient 1>", "<ingredient 2>", "..."],
  "method": "<clear step-by-step method as a single paragraph or short numbered steps in one string>",
  "calories": <integer kcal per serving>,
  "protein": <integer grams per serving>,
  "carbs": <integer grams per serving>,
  "fat": <integer grams per serving>,
  "time": "<e.g. '25 min'>"
}`,
      }],
    });
    const text = message.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    const data = extractJson(text);
    res.status(200).json(data);
  } catch (err) {
    console.error('generate-recipe error:', err);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
