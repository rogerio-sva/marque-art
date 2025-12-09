import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, format, contentType, mood, includeText, brandColors } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format dimensions mapping
    const formatDimensions: Record<string, { width: number; height: number; description: string }> = {
      "post-square": { width: 1080, height: 1080, description: "square format for social media feed post" },
      "post-portrait": { width: 1080, height: 1350, description: "portrait format 4:5 for Instagram feed" },
      "stories": { width: 1080, height: 1920, description: "vertical 9:16 format for stories and reels" },
      "thumbnail": { width: 1280, height: 720, description: "horizontal 16:9 format for YouTube thumbnail" },
      "ad-landscape": { width: 1200, height: 628, description: "landscape format for Meta ads and banners" },
      "ad-square": { width: 1080, height: 1080, description: "square format for Meta ads" },
    };

    // Style prompts
    const stylePrompts: Record<string, string> = {
      minimal: "minimalist design, clean lines, simple shapes, generous white space, modern aesthetic",
      vibrant: "vibrant colors, bold contrast, energetic composition, dynamic elements, eye-catching",
      corporate: "professional corporate style, clean and trustworthy, business-oriented, polished",
      photorealistic: "photorealistic, high detail, realistic lighting, professional photography quality",
      artistic: "artistic creative style, abstract elements, unique expression, visually distinctive",
      retro: "retro vintage aesthetic, nostalgic feel, classic design elements, throwback style",
    };

    // Content type prompts
    const contentTypePrompts: Record<string, string> = {
      promotion: "promotional content, sale or discount theme, attention-grabbing offer presentation",
      launch: "product launch theme, new and exciting, announcement style, debut presentation",
      quote: "inspirational quote layout, text-focused design, motivational message presentation",
      product: "product showcase, item-focused, commercial presentation, feature highlight",
      event: "event announcement, date and time emphasis, invitation style, gathering theme",
      educational: "educational content, informative layout, learning-focused, knowledge sharing",
    };

    // Mood prompts
    const moodPrompts: Record<string, string> = {
      professional: "professional and serious tone, corporate confidence, trustworthy feel",
      casual: "casual and relaxed vibe, friendly approachable feel, laid-back atmosphere",
      energetic: "high energy dynamic feel, exciting and active, powerful movement",
      elegant: "elegant and sophisticated, refined luxury feel, premium quality aesthetic",
      friendly: "warm and friendly, welcoming and approachable, positive and inviting",
      bold: "bold and daring, strong impactful presence, confident and striking",
    };

    // Build the enhanced prompt
    const promptParts: string[] = [];
    
    // Base prompt
    promptParts.push(prompt);
    
    // Add format context
    const formatInfo = formatDimensions[format] || formatDimensions["post-square"];
    promptParts.push(`Create this as a ${formatInfo.description}`);
    
    // Add style
    if (style && stylePrompts[style]) {
      promptParts.push(`Visual style: ${stylePrompts[style]}`);
    }
    
    // Add content type
    if (contentType && contentTypePrompts[contentType]) {
      promptParts.push(`Content type: ${contentTypePrompts[contentType]}`);
    }
    
    // Add mood
    if (mood && moodPrompts[mood]) {
      promptParts.push(`Mood and tone: ${moodPrompts[mood]}`);
    }
    
    // Add text overlay instructions
    if (includeText && includeText.trim()) {
      promptParts.push(`Include this text prominently in the image: "${includeText}". Make the text readable and well-integrated into the design`);
    }
    
    // Add brand colors
    if (brandColors && Array.isArray(brandColors) && brandColors.length > 0) {
      const colorList = brandColors.slice(0, 5).join(", ");
      promptParts.push(`Use these brand colors as the main color palette: ${colorList}. Incorporate these colors harmoniously throughout the design`);
    }

    const enhancedPrompt = promptParts.join(". ");
    
    console.log("Generating image with enhanced prompt:", enhancedPrompt);
    console.log("Format:", format, "Style:", style, "Content Type:", contentType, "Mood:", mood);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate a beautiful, high-quality marketing image. ${enhancedPrompt}. Ultra high resolution, professional quality, suitable for social media and advertising.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received successfully");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        image_url: imageUrl,
        prompt: prompt,
        style: style || null,
        format: format || "post-square",
        contentType: contentType || null,
        mood: mood || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
