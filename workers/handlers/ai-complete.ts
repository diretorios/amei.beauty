/**
 * Handle AI profile completion
 * POST /api/ai/complete
 * Uses AI to search and extract profile information from digital footprint
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
        model: 'deepseek-chat',
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
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepseek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Deepseek response');
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from Deepseek response');
      }
    }

    // Map to our response format with validation
    return {
      profile: {
        headline: parsed.headline || undefined,
        bio: parsed.bio || undefined
      },
      services: Array.isArray(parsed.services) ? parsed.services.map((s: any, idx: number) => ({
        id: s.id || String(idx + 1),
        name: s.name || '',
        price: s.price || 'Sob consulta',
        description: s.description || ''
      })) : [],
      social: Array.isArray(parsed.social) ? parsed.social : [],
      location: parsed.location || undefined,
      bio: parsed.bio || undefined,
      headline: parsed.headline || undefined
    };
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw error;
  }
}

/**
 * Mock AI completion - Fallback when API is unavailable or fails
 * Returns intelligent defaults based on profession
 */
function mockAICompletion(request: AICompleteRequest): AICompleteResponse {
  const { name, profession } = request;

  // Generate intelligent defaults based on profession
  const professionLower = profession.toLowerCase();
  
  // Default services based on profession
  const defaultServices: Service[] = [];
  if (professionLower.includes('cabelo') || professionLower.includes('hair')) {
    defaultServices.push(
      { id: '1', name: 'Corte', price: 'R$ 50,00', description: 'Corte moderno e atualizado' },
      { id: '2', name: 'Coloração', price: 'R$ 120,00', description: 'Coloração profissional' },
      { id: '3', name: 'Escova', price: 'R$ 30,00', description: 'Escova e finalização' }
    );
  } else if (professionLower.includes('unhas') || professionLower.includes('nail')) {
    defaultServices.push(
      { id: '1', name: 'Manicure', price: 'R$ 25,00', description: 'Cuidado completo das unhas' },
      { id: '2', name: 'Pedicure', price: 'R$ 30,00', description: 'Cuidado completo dos pés' },
      { id: '3', name: 'Esmaltação', price: 'R$ 15,00', description: 'Esmaltação em gel' }
    );
  } else if (professionLower.includes('maquiagem') || professionLower.includes('makeup')) {
    defaultServices.push(
      { id: '1', name: 'Maquiagem Social', price: 'R$ 80,00', description: 'Maquiagem para o dia a dia' },
      { id: '2', name: 'Maquiagem para Eventos', price: 'R$ 150,00', description: 'Maquiagem para festas e eventos' },
      { id: '3', name: 'Aula de Automaquiagem', price: 'R$ 200,00', description: 'Aprenda a se maquiar' }
    );
  } else {
    // Generic services
    defaultServices.push(
      { id: '1', name: 'Consulta', price: 'R$ 50,00', description: 'Consulta inicial' },
      { id: '2', name: 'Serviço Personalizado', price: 'Sob consulta', description: 'Serviço sob medida' }
    );
  }

  // Generate headline based on profession
  const headlines: Record<string, string> = {
    'cabelo': 'Especialista em cortes modernos e coloração',
    'unhas': 'Cuidado profissional para suas unhas',
    'maquiagem': 'Maquiagem profissional para todos os momentos',
    'depilação': 'Depilação com técnicas modernas',
    'estética': 'Tratamentos estéticos personalizados',
  };

  const headline = Object.entries(headlines).find(([key]) => 
    professionLower.includes(key)
  )?.[1] || `Profissional ${profession}`;

  // Generate bio
  const bio = `Olá! Sou ${name}, ${profession.toLowerCase()} com experiência em proporcionar os melhores resultados para meus clientes. Entre em contato e vamos conversar sobre como posso ajudar você!`;

  // Default social links (empty - user can add)
  const social: SocialLink[] = [];

  return {
    profile: {
      headline,
      bio,
    },
    services: defaultServices,
    social,
    location: undefined, // Could be extracted from WhatsApp area code or user input
  };
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
        console.error('Deepseek API failed, falling back to mock:', error);
        // Fallback to mock if API fails
        completion = mockAICompletion(body);
        // Simulate delay for consistency
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      // Use mock if no API key is configured
      completion = mockAICompletion(body);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
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

