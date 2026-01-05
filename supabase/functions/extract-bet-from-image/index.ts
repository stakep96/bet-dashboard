import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um assistente especializado em extrair dados de bilhetes/comprovantes de apostas esportivas.
Analise a imagem do bilhete e extraia as seguintes informações:
- match: Nome da partida/confronto (ex: "Flamengo x Palmeiras")
- modality: Modalidade do esporte (FUTEBOL, BASQUETE, TÊNIS, MMA, ESPORTS, OUTRO)
- market: Tipo de mercado apostado (ex: "Resultado final", "Total gols", "Ambas marcam", etc)
- entry: A entrada/seleção feita (ex: "Vitória do Flamengo", "Acima de 2.5 gols")
- odd: O valor da odd (número decimal, ex: 1.85)
- stake: Valor apostado em reais (número, ex: 100.00)
- bookmaker: Casa de apostas (Bet365, Betano, Sportingbet, Betsson, Pinnacle, Betfair, Ultrabet, ou outra)
- eventDate: Data do evento (formato YYYY-MM-DD)
- timing: Se a aposta foi PRÉ jogo ou LIVE
- result: Se visível, o resultado (GREEN, RED, CASHOUT, DEVOLVIDA, PENDING)

Responda APENAS com um JSON válido no formato:
{
  "match": "string ou null",
  "modality": "string ou null",
  "market": "string ou null",
  "entry": "string ou null",
  "odd": number ou null,
  "stake": number ou null,
  "bookmaker": "string ou null",
  "eventDate": "YYYY-MM-DD ou null",
  "timing": "PRÉ ou LIVE ou null",
  "result": "GREEN, RED, CASHOUT, DEVOLVIDA, PENDING ou null"
}

Se não conseguir identificar algum campo, retorne null para esse campo.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados deste bilhete de aposta:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response (may be wrapped in markdown code block)
    let extractedData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse extracted data');
    }

    console.log('Extracted bet data:', extractedData);

    return new Response(
      JSON.stringify({ data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting bet data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao processar imagem' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
