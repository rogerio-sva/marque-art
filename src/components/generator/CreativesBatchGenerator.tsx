import { useState } from "react";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import {
  copyTemplates,
  campaignObjectives,
  formatVariations,
  colorVariations,
  copyVariations,
} from "@/lib/copy-templates";
import { CreativePreviewGrid, CreativeResult } from "./CreativePreviewGrid";
import { cn } from "@/lib/utils";

export function CreativesBatchGenerator() {
  const { saveImage } = useGeneratedImages();
  const { config: brandConfig } = useBrandConfig();

  const [productDescription, setProductDescription] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["feed-square"]);
  const [selectedColors, setSelectedColors] = useState<string[]>(["original"]);
  const [selectedCopyVariations, setSelectedCopyVariations] = useState<string[]>(["direct"]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [creatives, setCreatives] = useState<CreativeResult[]>([]);

  const toggleSelection = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const calculateTotalVariations = () => {
    const templates = Math.max(selectedTemplates.length, 1);
    const formats = selectedFormats.length;
    const colors = selectedColors.length;
    return templates * formats * colors;
  };

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      toast.error("Descreva seu produto ou serviço");
      return;
    }

    if (selectedFormats.length === 0) {
      toast.error("Selecione pelo menos um formato");
      return;
    }

    if (selectedColors.length === 0) {
      toast.error("Selecione pelo menos uma variação de cor");
      return;
    }

    setIsGenerating(true);

    // Generate all combinations
    const combinations: CreativeResult[] = [];
    let idCounter = 0;

    const templatesToUse = selectedTemplates.length > 0 
      ? selectedTemplates 
      : ["default"];

    for (const templateId of templatesToUse) {
      for (const formatId of selectedFormats) {
        for (const colorId of selectedColors) {
          const format = formatVariations.find((f) => f.id === formatId);
          const template = copyTemplates.find((t) => t.id === templateId);
          
          combinations.push({
            id: `creative-${idCounter++}`,
            imageUrl: null,
            format: format?.name || formatId,
            colorVariation: colorId,
            copyVariation: selectedCopyVariations[0] || "direct",
            copy: template?.templates[0] || productDescription,
            status: "pending",
          });
        }
      }
    }

    setCreatives(combinations);

    // Generate each creative sequentially to avoid rate limiting
    for (let i = 0; i < combinations.length; i++) {
      const creative = combinations[i];
      
      setCreatives((prev) =>
        prev.map((c) =>
          c.id === creative.id ? { ...c, status: "generating" } : c
        )
      );

      try {
        const format = formatVariations.find((f) => f.name === creative.format);
        const template = copyTemplates.find((t) => t.id === creative.copyVariation);
        
        // Build prompt with Meta best practices
        const colorInstruction = getColorInstruction(creative.colorVariation, brandConfig);
        const copyText = template?.templates[0] || productDescription;

        const prompt = `
Professional marketing creative for social media ad.
Product/Service: ${productDescription}
Campaign objective: ${selectedObjective || "engagement"}
Text overlay: "${copyText}"
Color scheme: ${colorInstruction}
Style: Modern, clean, high-contrast, scroll-stopping design.
The text should be bold and readable. Professional photography style.
Meta Ads best practices: Clear focal point, bold typography, high contrast colors.
        `.trim();

        const { data, error } = await supabase.functions.invoke("generate-image", {
          body: {
            prompt,
            format: format?.id || "feed-square",
            style: "corporate",
            useBrandColors: creative.colorVariation === "original",
            brandColors: brandConfig?.colors,
          },
        });

        if (error) throw error;

        setCreatives((prev) =>
          prev.map((c) =>
            c.id === creative.id
              ? { ...c, status: "done", imageUrl: data.imageUrl }
              : c
          )
        );
      } catch (error) {
        console.error("Error generating creative:", error);
        setCreatives((prev) =>
          prev.map((c) =>
            c.id === creative.id
              ? { ...c, status: "error", error: "Falha na geração" }
              : c
          )
        );
      }

      // Small delay between generations to avoid rate limiting
      if (i < combinations.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
    toast.success("Geração de criativos concluída!");
  };

  const getColorInstruction = (colorId: string, brand: typeof brandConfig) => {
    switch (colorId) {
      case "original":
        return brand?.colors?.length 
          ? `Use these brand colors: ${brand.colors.join(", ")}`
          : "Professional brand colors";
      case "inverted":
        return "Inverted color scheme with secondary colors prominent";
      case "high-contrast":
        return "High contrast black and white with one accent color";
      case "warm":
        return "Warm tones: oranges, reds, yellows";
      case "cool":
        return "Cool tones: blues, greens, teals";
      default:
        return "Professional marketing colors";
    }
  };

  const handleSaveAll = async () => {
    const successfulCreatives = creatives.filter(
      (c) => c.status === "done" && c.imageUrl
    );

    for (const creative of successfulCreatives) {
      await saveImage(
        `${productDescription} - ${creative.format} - ${creative.colorVariation}`,
        "batch",
        creative.imageUrl!
      );
    }

    toast.success(`${successfulCreatives.length} criativos salvos na galeria!`);
  };

  const handleDownloadAll = async () => {
    const successfulCreatives = creatives.filter(
      (c) => c.status === "done" && c.imageUrl
    );

    for (let i = 0; i < successfulCreatives.length; i++) {
      const creative = successfulCreatives[i];
      try {
        const response = await fetch(creative.imageUrl!);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `creative-${creative.format}-${creative.colorVariation}-${i + 1}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Download error:", error);
      }
    }

    toast.success("Download iniciado!");
  };

  const totalVariations = calculateTotalVariations();

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          Gerador de Criativos em Lote
        </h1>
        <p className="text-muted-foreground">
          Crie múltiplas variações de anúncios com prompts otimizados para Meta Ads
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Product Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descreva seu Produto/Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Curso de marketing digital para iniciantes que querem aprender a vender online..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Campaign Objective */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Objetivo da Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {campaignObjectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjective(obj.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                      selectedObjective === obj.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl">{obj.icon}</span>
                    <div>
                      <div className="font-medium">{obj.name}</div>
                      <div className="text-xs text-muted-foreground">{obj.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Copy Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📝 Gatilhos Mentais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {copyTemplates.map((template) => (
                  <label
                    key={template.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedTemplates.includes(template.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedTemplates.includes(template.id)}
                      onCheckedChange={() =>
                        toggleSelection(template.id, selectedTemplates, setSelectedTemplates)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{template.icon}</span>
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variations Panel */}
        <div className="space-y-6">
          {/* Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📐 Formatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {formatVariations.map((format) => (
                  <label
                    key={format.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedFormats.includes(format.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedFormats.includes(format.id)}
                      onCheckedChange={() =>
                        toggleSelection(format.id, selectedFormats, setSelectedFormats)
                      }
                    />
                    <div>
                      <div className="font-medium">{format.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.width}×{format.height}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Variations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Variações de Cor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {colorVariations.map((color) => (
                  <label
                    key={color.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedColors.includes(color.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedColors.includes(color.id)}
                      onCheckedChange={() =>
                        toggleSelection(color.id, selectedColors, setSelectedColors)
                      }
                    />
                    <div>
                      <div className="font-medium">{color.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {color.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Copy Variations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✍️ Estilo de Copy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {copyVariations.map((copy) => (
                  <label
                    key={copy.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedCopyVariations.includes(copy.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedCopyVariations.includes(copy.id)}
                      onCheckedChange={() =>
                        toggleSelection(
                          copy.id,
                          selectedCopyVariations,
                          setSelectedCopyVariations
                        )
                      }
                    />
                    <div>
                      <div className="font-medium">{copy.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {copy.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card className="bg-primary/5 border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  Total de variações: <span className="text-primary">{totalVariations}</span> imagens
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={handleGenerate}
                  disabled={isGenerating || !productDescription.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando Criativos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gerar {totalVariations} Criativos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Grid */}
      <CreativePreviewGrid
        creatives={creatives}
        onDownloadAll={handleDownloadAll}
        onSaveAll={handleSaveAll}
        isGenerating={isGenerating}
      />
    </div>
  );
}
