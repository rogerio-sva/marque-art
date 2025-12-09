export interface CopyTemplate {
  id: string;
  name: string;
  icon: string;
  trigger: string;
  description: string;
  templates: string[];
}

export interface CopyFormula {
  id: string;
  name: string;
  description: string;
  structure: string[];
}

export const copyTemplates: CopyTemplate[] = [
  {
    id: "urgency",
    name: "Urgência & Escassez",
    icon: "⚡",
    trigger: "Escassez",
    description: "Cria senso de urgência para ação imediata",
    templates: [
      "ÚLTIMAS VAGAS • Inscrições encerram hoje!",
      "SÓ HOJE: {desconto}% OFF",
      "Restam apenas {numero} unidades",
      "ÚLTIMA CHANCE de garantir sua vaga",
      "Oferta válida até meia-noite ⏰",
    ],
  },
  {
    id: "social-proof",
    name: "Prova Social",
    icon: "🏆",
    trigger: "Autoridade",
    description: "Mostra validação de outros clientes",
    templates: [
      "Mais de {numero} clientes satisfeitos",
      "⭐⭐⭐⭐⭐ Avaliado por {numero}+ pessoas",
      "O método que já transformou {numero} vidas",
      "Escolhido por {tipo} em todo Brasil",
      "Recomendado por {numero} especialistas",
    ],
  },
  {
    id: "transformation",
    name: "Transformação",
    icon: "✨",
    trigger: "Benefício",
    description: "Mostra a jornada antes/depois",
    templates: [
      "De {problema} para {solução}",
      "Transforme seu {area} em {tempo}",
      "Pare de {dor} e comece a {benefício}",
      "Saia do {ponto_a} e chegue no {ponto_b}",
      "Sua {area} nunca mais será a mesma",
    ],
  },
  {
    id: "curiosity",
    name: "Curiosidade (Hook)",
    icon: "❓",
    trigger: "Curiosidade",
    description: "Cria interesse e desejo de saber mais",
    templates: [
      "O segredo que ninguém te contou sobre {tema}",
      "Por que {numero}% das pessoas erram nisso?",
      "Você sabia que {fato_surpreendente}?",
      "O método proibido que {resultado}",
      "Descobri isso e mudou tudo...",
    ],
  },
  {
    id: "offer",
    name: "Oferta Irresistível",
    icon: "🎁",
    trigger: "Valor",
    description: "Destaca o valor e benefícios da oferta",
    templates: [
      "{produto} + {bonus1} + {bonus2} = TUDO ISSO por apenas R${preco}",
      "GRÁTIS: {bonus} para os primeiros {numero}",
      "Investimento: menos que {comparacao} por dia",
      "Garantia de {tempo} dias ou seu dinheiro de volta",
      "Parcelamos em até {numero}x sem juros",
    ],
  },
  {
    id: "cta",
    name: "CTA Direto",
    icon: "🎯",
    trigger: "Ação",
    description: "Chamadas para ação claras e diretas",
    templates: [
      "CLIQUE AGORA e garanta sua vaga",
      "QUERO APROVEITAR →",
      "Comece sua transformação HOJE",
      "Acesse o link na bio 👆",
      "Arrasta pra cima e saiba mais ↑",
    ],
  },
];

export const copyFormulas: CopyFormula[] = [
  {
    id: "aida",
    name: "AIDA",
    description: "Atenção → Interesse → Desejo → Ação",
    structure: [
      "Atenção: Hook forte que para o scroll",
      "Interesse: Apresenta o benefício principal",
      "Desejo: Mostra a transformação possível",
      "Ação: CTA claro e direto",
    ],
  },
  {
    id: "pas",
    name: "PAS",
    description: "Problema → Agitação → Solução",
    structure: [
      "Problema: Identifica a dor do público",
      "Agitação: Intensifica o problema",
      "Solução: Apresenta seu produto/serviço",
    ],
  },
  {
    id: "bab",
    name: "BAB",
    description: "Before → After → Bridge",
    structure: [
      "Before: Situação atual (problema)",
      "After: Situação desejada (resultado)",
      "Bridge: Como chegar lá (seu produto)",
    ],
  },
];

export const campaignObjectives = [
  { id: "sales", name: "Vendas", icon: "💰", description: "Conversão direta" },
  { id: "leads", name: "Leads", icon: "📧", description: "Captura de contatos" },
  { id: "engagement", name: "Engajamento", icon: "💬", description: "Curtidas e comentários" },
  { id: "traffic", name: "Tráfego", icon: "🔗", description: "Visitas ao site" },
];

export const formatVariations = [
  { id: "feed-square", name: "Feed 1:1", width: 1080, height: 1080 },
  { id: "feed-portrait", name: "Feed 4:5", width: 1080, height: 1350 },
  { id: "stories", name: "Stories 9:16", width: 1080, height: 1920 },
  { id: "meta-ad", name: "Anúncio 1.91:1", width: 1200, height: 628 },
];

export const colorVariations = [
  { id: "original", name: "Original", description: "Cores da marca" },
  { id: "inverted", name: "Invertida", description: "Cores secundárias em destaque" },
  { id: "high-contrast", name: "Alto Contraste", description: "Preto/branco + destaque" },
  { id: "warm", name: "Tom Quente", description: "Tons de laranja e vermelho" },
  { id: "cool", name: "Tom Frio", description: "Tons de azul e verde" },
];

export const copyVariations = [
  { id: "direct", name: "Direto", description: "Copy curto e objetivo" },
  { id: "emoji", name: "Com Emoji", description: "Copy com emojis + urgência" },
  { id: "question", name: "Pergunta", description: "Copy que inicia com pergunta (hook)" },
  { id: "social", name: "Prova Social", description: "Copy com números e validação" },
];

export function generateCopyVariation(
  template: string,
  variation: string,
  productDescription: string
): string {
  let copy = template;
  
  // Replace placeholders with generic values based on product
  copy = copy.replace("{numero}", "1.000");
  copy = copy.replace("{desconto}", "50");
  copy = copy.replace("{tempo}", "30");
  copy = copy.replace("{preco}", "97");
  
  switch (variation) {
    case "emoji":
      return `🔥 ${copy} 🚀`;
    case "question":
      return `Você já parou pra pensar nisso? ${copy}`;
    case "social":
      return `+10.000 pessoas já aprovaram! ${copy}`;
    default:
      return copy;
  }
}
