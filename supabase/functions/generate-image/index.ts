import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, format, customWidth, customHeight, contentType, mood, includeText, textPosition, brandColors, specialistPhotos, referenceImage, referenceModifications, brandLogo } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const styleMap: Record<string, string> = {
      minimal: "minimalist, clean, white space", vibrant: "vibrant colors, bold contrast",
      corporate: "professional corporate, polished", photorealistic: "photorealistic, high detail",
      artistic: "artistic, abstract", retro: "retro vintage aesthetic",
    };
    const moodMap: Record<string, string> = {
      professional: "professional tone", casual: "casual relaxed", energetic: "high energy",
      elegant: "elegant sophisticated", friendly: "warm friendly", bold: "bold daring",
    };
    const contentMap: Record<string, string> = {
      promotion: "promotional offer", launch: "product launch", quote: "inspirational quote",
      product: "product showcase", event: "event announcement", educational: "educational content",
    };

    const parts: string[] = [prompt];
    if (style && styleMap[style]) parts.push(`Style: ${styleMap[style]}.`);
    if (mood && moodMap[mood]) parts.push(`Mood: ${moodMap[mood]}.`);
    if (contentType && contentMap[contentType]) parts.push(`Content: ${contentMap[contentType]}.`);
    if (brandColors?.length) parts.push(`Brand colors: ${brandColors.join(", ")}.`);
    if (includeText) parts.push(`Text to include: "${includeText}". Position: ${textPosition || "center"}.`);
    parts.push("High quality, professional marketing image, no watermarks.");

    const enhancedPrompt = parts.join(" ");

    // Use Imagen 3 via Google AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1", safetyFilterLevel: "block_few" },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Imagen API error:", response.status, errorText);

      // Fallback to gemini-2.0-flash-exp with image generation
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        }
      );

      if (!fallbackResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to generate image" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const fallbackData = await fallbackResponse.json();
      const imagePart = fallbackData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (!imagePart?.inlineData?.data) {
        return new Response(JSON.stringify({ error: "No image generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return await uploadAndReturn(imagePart.inlineData.data, "image/png", corsHeaders);
    }

    const data = await response.json();
    const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
    const mimeType = data.predictions?.[0]?.mimeType || "image/png";

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return await uploadAndReturn(imageBase64, mimeType, corsHeaders);

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function uploadAndReturn(base64Data: string, mimeType: string, corsHeaders: Record<string, string>) {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const filename = `img_${Date.now()}.${ext}`;
  const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage.from("generated-images").upload(filename, imageBuffer, { contentType: mimeType, upsert: true });

  if (error) {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return new Response(JSON.stringify({ url: dataUrl, filename }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: { publicUrl } } = supabase.storage.from("generated-images").getPublicUrl(filename);
  return new Response(JSON.stringify({ url: publicUrl, filename }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
