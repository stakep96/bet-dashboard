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
Analise a imagem do bilhete e extraia TODAS as apostas contidas nele. Isso inclui:
- Apostas simples (uma única seleção)
- Apostas múltiplas/combinadas (várias seleções em partidas diferentes)
- Bet Builder (várias seleções na mesma partida)

Para CADA aposta/seleção encontrada, extraia:
- match: Nome da partida/confronto (ex: "Flamengo x Palmeiras")
- modality: Modalidade do esporte. Use EXATAMENTE uma destas opções:
  BADMINTON, BASEBALL, BASQUETE, CRICKET, CRYPTO, CSGO, DARDOS, DOTA2, ELEIÇÕES, F1, FIFA, FMS, FOOTBALL, FUTEBOL, HALO, HANDEBOL, HOCKEY, LOL, MMA, MÚLTIPLA, NFL, R6, RUGBY, SINUCA, TÊNIS, TÊNIS DE MESA, UFC, VALORANT, VÔLEI
  
  REGRAS IMPORTANTES PARA ESPORTS:
  - Se o evento mencionar "League of Legends" ou "LoL", use "LOL"
  - Se o evento mencionar "Counter-Strike", "CS:GO", "CS2" ou "Counter Strike", use "CSGO"
  - Se o evento mencionar "Valorant", use "VALORANT"
  - Se o evento mencionar "Dota 2" ou "Dota2", use "DOTA2"
  - Se o evento mencionar "Rainbow Six" ou "R6", use "R6"
  - Se o evento mencionar "Halo", use "HALO"
  - Se o evento mencionar "FIFA" ou "eFootball", use "FIFA"
  - NUNCA use "ESPORTS" como modalidade - sempre identifique o jogo específico

- market: Tipo de mercado apostado. IMPORTANTE: Se o mercado for "1x2" ou "1X2", converta para "Vencedor"
- entry: A entrada/seleção feita (ex: "Vitória do Flamengo", "Acima de 2.5 gols")
- odd: O valor da odd INDIVIDUAL desta seleção (número decimal, ex: 1.85). Se não visível, use null.
- eventDate: Data do evento (formato YYYY-MM-DD)
- timing: Se a aposta foi PRÉ jogo ou LIVE

Informações GERAIS do bilhete (aplicadas a todas as apostas):
- stake: Valor total apostado em reais (número, ex: 100.00)
- bookmaker: Casa de apostas (Bet365, Betano, Sportingbet, Betsson, Pinnacle, Betfair, Ultrabet, ou outra)
- totalOdd: Odd total/combinada do bilhete (se for múltipla/combinada)
- result: Se visível, o resultado geral do bilhete (GREEN, RED, CASHOUT, DEVOLVIDA, PENDING)
- isCombined: true se for bilhete combinado/múltipla/betbuilder, false se for aposta simples

Responda APENAS com um JSON válido no formato:
{
  "isCombined": boolean,
  "stake": number ou null,
  "totalOdd": number ou null,
  "bookmaker": "string ou null",
  "result": "GREEN, RED, CASHOUT, DEVOLVIDA, PENDING ou null",
  "bets": [
    {
      "match": "string ou null",
      "modality": "string ou null",
      "market": "string ou null",
      "entry": "string ou null",
      "odd": number ou null,
      "eventDate": "YYYY-MM-DD ou null",
      "timing": "PRÉ ou LIVE ou null"
    }
  ]
}

Se for aposta simples, o array "bets" terá apenas 1 item.
Se for múltipla/combinada/betbuilder, o array "bets" terá múltiplos itens.
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
