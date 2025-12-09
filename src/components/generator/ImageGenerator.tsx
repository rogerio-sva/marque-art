import { useState } from "react";
import { Sparkles, Loader2, Download, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const styles = [
  { id: "minimal", name: "Minimalista", emoji: "◻️" },
  { id: "vibrant", name: "Vibrante", emoji: "🎨" },
  { id: "corporate", name: "Corporativo", emoji: "💼" },
  { id: "photorealistic", name: "Fotorealista", emoji: "📷" },
  { id: "artistic", name: "Artístico", emoji: "🎭" },
  { id: "retro", name: "Retrô", emoji: "📼" },
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { saveImage } = useGeneratedImages();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim(), style: selectedStyle },
      });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || "Erro ao gerar imagem");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data.image_url);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar imagem");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!generatedImage) return;

    try {
      await saveImage(prompt, selectedStyle, generatedImage);
      toast.success("Imagem salva na galeria!");
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // Convert base64 to blob and download
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-studio-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Erro ao fazer download");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Panel */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerador de Imagens
          </CardTitle>
          <CardDescription>
            Descreva a imagem que você quer criar e escolha um estilo visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descrição da Imagem</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Um fundo abstrato com formas geométricas em tons de azul e roxo, moderno e elegante..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label>Estilo Visual (opcional)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() =>
                    setSelectedStyle(selectedStyle === style.id ? null : style.id)
                  }
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span>{style.emoji}</span>
                  <span>{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Imagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>
            A imagem gerada aparecerá aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30">
            {isGenerating ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-primary/20" />
                  <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Criando sua imagem...</p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Sua imagem gerada aparecerá aqui
                </p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleSaveToGallery}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar na Galeria
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={handleGenerate}
                variant="ghost"
                size="icon"
                title="Gerar novamente"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}