# Deepseek API Integration Example

## Quick Start: Integrating Deepseek into Phase 4 AI Completion

Since you already have a Deepseek API key, here's how to integrate it into your existing AI completion handler.

---

## Step 1: Add API Key to Environment Variables

Add your Deepseek API key to `.dev.vars` (for local development) and Cloudflare Workers secrets (for production):

```bash
# .dev.vars (local development)
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

For production, set it via Cloudflare Dashboard or wrangler:
```bash
# For Cloudflare Pages (use this command)
npx wrangler pages secret put DEEPSEEK_API_KEY

# For Cloudflare Workers (if using Workers instead)
# npx wrangler secret put DEEPSEEK_API_KEY
```

---

## Step 2: Update `workers/handlers/ai-complete.ts`

Here's the updated implementation using Deepseek:

```typescript
/**
 * Handle AI profile completion using Deepseek API
 * POST /api/ai/complete
 */

import type { Env } from '../types';
import type { Profile, Service, SocialLink } from '../../src/models/types';

interface AICompleteRequest {
  name: string;
  profession: string;
  whatsapp?: string;
}

interface AICompleteResponse {
  profile: Partial<Profile>;
  services: Service[];
  social: SocialLink[];
  location?: {
    city?: string;
    neighborhood?: string;
    state?: string;
  };
  bio?: string;
  headline?: string;
}

/**
 * Call Deepseek API for profile completion
 */
async function callDeepseekAPI(
  request: AICompleteRequest,
  apiKey: string
): Promise<AICompleteResponse> {
  const { name, profession, whatsapp } = request;

  const prompt = `You are an AI assistant that generates profile information for Brazilian beauty professionals.

Generate a complete profile for:
- Name: ${name}
- Profession: ${profession}
${whatsapp ? `- WhatsApp: ${whatsapp}` : ''}
- Location: Brazil

Return a JSON object with the following structure:
{
  "headline": "A compelling headline in Portuguese",
  "bio": "A professional bio in Portuguese (2-3 sentences)",
  "services": [
    {
      "id": "1",
      "name": "Service name in Portuguese",
      "price": "R$ XX,XX",
      "description": "Service description in Portuguese"
    }
  ],
  "social": [],
  "location": {
    "city": "City name if found",
    "state": "State abbreviation if found"
  }
}

Requirements:
- All text must be in Brazilian Portuguese
- Services should be relevant to the profession
- Prices should be realistic Brazilian prices in R$
- Generate 3-5 services based on the profession
- Headline should be professional and appealing
- Bio should be warm and inviting`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // or 'deepseek-reasoner' for complex tasks
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates structured JSON responses for Brazilian beauty professionals. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' } // Request JSON response
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepseek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Deepseek response');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Map to our response format
    return {
      profile: {
        headline: parsed.headline,
        bio: parsed.bio
      },
      services: parsed.services || [],
      social: parsed.social || [],
      location: parsed.location,
      bio: parsed.bio,
      headline: parsed.headline
    };
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw error;
  }
}

/**
 * Fallback mock implementation
 */
function mockAICompletion(request: AICompleteRequest): AICompleteResponse {
  // ... existing mock implementation ...
  // (keep as fallback)
}

export async function handleAIComplete(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = (await request.json()) as AICompleteRequest;

    if (!body.name || !body.profession) {
      return new Response(
        JSON.stringify({ error: 'Name and profession are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let completion: AICompleteResponse;

    // Try Deepseek API if key is available
    if (env.DEEPSEEK_API_KEY) {
      try {
        completion = await callDeepseekAPI(body, env.DEEPSEEK_API_KEY);
      } catch (error) {
        console.error('Deepseek failed, falling back to mock:', error);
        // Fallback to mock if API fails
        completion = mockAICompletion(body);
      }
    } else {
      // Use mock if no API key
      completion = mockAICompletion(body);
    }

    return new Response(JSON.stringify(completion), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI completion error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to complete profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
```

---

## Step 3: Update Type Definitions

Make sure your `Env` type includes the Deepseek API key:

```typescript
// workers/types.ts or similar
export interface Env {
  DEEPSEEK_API_KEY?: string;
  // ... other env vars
}
```

---

## Step 4: Test Locally

1. Add your API key to `.dev.vars`
2. Test the endpoint:
```bash
curl -X POST http://localhost:8787/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria Silva", "profession": "Cabeleireira"}'
```

---

## Step 5: Deploy to Production

1. Set the secret in Cloudflare:
```bash
npx wrangler secret put DEEPSEEK_API_KEY
# Enter your API key when prompted
```

2. Deploy:
```bash
npx wrangler deploy
```

---

## Cost Monitoring

Deepseek charges:
- **Input:** $0.27 per 1M tokens (cache miss)
- **Output:** $1.10 per 1M tokens

**Estimated cost per request:** ~$0.0011
- Input: ~2,000 tokens = $0.00054
- Output: ~500 tokens = $0.00055
- **Total: ~$0.0011 per request**

**For 1,000 users/month:** ~$1.10/month

---

## Error Handling

The implementation includes:
- ✅ Fallback to mock if API fails
- ✅ Error logging
- ✅ Graceful degradation
- ✅ Proper error responses

---

## Advanced: Using deepseek-reasoner

For more complex reasoning tasks, you can use `deepseek-reasoner`:

```typescript
model: 'deepseek-reasoner', // Instead of 'deepseek-chat'
```

**Cost:** ~$0.0022 per request (slightly more expensive but better for complex tasks)

---

## Testing Checklist

- [ ] API key is set in environment
- [ ] Deepseek API calls work
- [ ] Fallback to mock works if API fails
- [ ] Portuguese output quality is good
- [ ] Services are relevant to profession
- [ ] Prices are realistic
- [ ] Error handling works correctly

---

## Next Steps

1. ✅ Integrate Deepseek API
2. ⏭️ Test with real user data
3. ⏭️ Monitor costs and usage
4. ⏭️ Consider adding SerpAPI for web search (hybrid approach)
5. ⏭️ Add caching for common professions

---

**Ready to implement!** Since you already have the API key, this should be quick to set up. 🚀

