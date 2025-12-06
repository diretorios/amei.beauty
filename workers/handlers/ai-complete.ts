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
 * Mock AI completion - In production, integrate with OpenAI/Anthropic/SerpAPI
 * For now, returns intelligent defaults based on profession
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

    // In production, this would call:
    // 1. OpenAI/Anthropic API to search and extract information
    // 2. SerpAPI to search Google/Brazilian directories
    // 3. Instagram/Facebook APIs (if user provides social links)
    // For now, use intelligent defaults
    const completion = mockAICompletion(body);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

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

