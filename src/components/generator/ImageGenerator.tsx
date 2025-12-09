import { useState, useRef } from "react";
import { Sparkles, Loader2, Download, Save, RefreshCw, Type, Palette, UserCircle, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formats = [
  { id: "post-square", name: "Post Feed", dimensions: "1080×1080", ratio: "1:1", emoji: "📱" },
  { id: "post-portrait", name: "Post Retrato", dimensions: "1080×1350", ratio: "4:5", emoji: "📲" },
  { id: "stories", name: "Stories/Reels", dimensions: "1080×1920", ratio: "9:16", emoji: "📖" },
  { id: "thumbnail", name: "Thumbnail", dimensions: "1280×720", ratio: "16:9", emoji: "🎬" },
  { id: "ad-landscape", name: "Anúncio", dimensions: "1200×628", ratio: "1.91:1", emoji: "📢" },
  { id: "ad-square", name: "Anúncio Quadrado", dimensions: "1080×1080", ratio: "1:1", emoji: "🎯" },
];

const styles = [
  { id: "minimal", name: "Minimalista", emoji: "◻️" },
  { id: "vibrant", name: "Vibrante", emoji: "🎨" },
  { id: "corporate", name: "Corporativo", emoji: "💼" },
  { id: "photorealistic", name: "Fotorealista", emoji: "📷" },
  { id: "artistic", name: "Artístico", emoji: "🎭" },
  { id: "retro", name: "Retrô", emoji: "📼" },
];

const contentTypes = [
  { id: "promotion", name: "Promoção", emoji: "🏷️" },
  { id: "launch", name: "Lançamento", emoji: "🚀" },
  { id: "quote", name: "Citação", emoji: "💬" },
  { id: "product", name: "Produto", emoji: "📦" },
  { id: "event", name: "Evento", emoji: "📅" },
  { id: "educational", name: "Educacional", emoji: "📚" },
];

const moods = [
  { id: "professional", name: "Profissional", emoji: "👔" },
  { id: "casual", name: "Casual", emoji: "😊" },
  { id: "energetic", name: "Enérgico", emoji: "⚡" },
  { id: "elegant", name: "Elegante", emoji: "✨" },
  { id: "friendly", name: "Amigável", emoji: "🤝" },
  { id: "bold", name: "Ousado", emoji: "💪" },
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("post-square");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [includeText, setIncludeText] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [specialistPhotos, setSpecialistPhotos] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceModifications, setReferenceModifications] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const { saveImage } = useGeneratedImages();
  const { config: brandConfig } = useBrandConfig();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Foto muito grande. Máximo 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSpecialistPhotos((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setSpecialistPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setReferenceImage(base64);
    };
    reader.readAsDataURL(file);

    if (referenceInputRef.current) {
      referenceInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { 
          prompt: prompt.trim(), 
          style: selectedStyle,
          format: selectedFormat,
          contentType: selectedContentType,
          mood: selectedMood,
          includeText: includeText ? textContent : null,
          brandColors: useBrandColors ? brandConfig.colors : null,
          specialistPhotos: specialistPhotos.length > 0 ? specialistPhotos : null,
          referenceImage: referenceImage,
          referenceModifications: referenceModifications.trim() || null,
        },
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
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-studio-${selectedFormat}-${Date.now()}.png`;
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

  const selectedFormatData = formats.find(f => f.id === selectedFormat);

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
            Configure todos os detalhes da sua imagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Descrição da Imagem *</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Um fundo abstrato com formas geométricas, moderno e elegante..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Formato</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-2 text-xs transition-all ${
                    selectedFormat === format.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-base">{format.emoji}</span>
                  <span className="font-medium">{format.name}</span>
                  <span className="text-muted-foreground">{format.dimensions}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Estilo Visual</Label>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() =>
                    setSelectedStyle(selectedStyle === style.id ? null : style.id)
                  }
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
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

          {/* Content Type */}
          <div className="space-y-3">
            <Label>Tipo de Conteúdo</Label>
            <div className="grid grid-cols-3 gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() =>
                    setSelectedContentType(selectedContentType === type.id ? null : type.id)
                  }
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    selectedContentType === type.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span>{type.emoji}</span>
                  <span>{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <Label>Tom / Mood</Label>
            <div className="grid grid-cols-3 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() =>
                    setSelectedMood(selectedMood === mood.id ? null : mood.id)
                  }
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    selectedMood === mood.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Include Text Toggle */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="include-text" className="cursor-pointer">Incluir texto na imagem</Label>
              </div>
              <Switch
                id="include-text"
                checked={includeText}
                onCheckedChange={setIncludeText}
              />
            </div>
            {includeText && (
              <Input
                placeholder="Ex: PROMOÇÃO ESPECIAL ou Inscreva-se agora!"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Specialist Photos Upload */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="cursor-pointer">Fotos de Especialistas</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1"
              >
                <Upload className="h-3 w-3" />
                Adicionar
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {specialistPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {specialistPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Especialista ${index + 1}`}
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              As fotos serão incorporadas na imagem gerada
            </p>
          </div>

          {/* Reference Image Upload */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Label className="cursor-pointer">Imagem de Referência</Label>
              </div>
              {!referenceImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => referenceInputRef.current?.click()}
                  className="gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Carregar
                </Button>
              )}
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
            </div>
            {referenceImage && (
              <div className="space-y-2">
                <div className="relative group inline-block">
                  <img
                    src={referenceImage}
                    alt="Referência"
                    className="h-24 w-auto rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => {
                      setReferenceImage(null);
                      setReferenceModifications("");
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  placeholder="Modificações desejadas (ex: mude as cores para azul)"
                  value={referenceModifications}
                  onChange={(e) => setReferenceModifications(e.target.value)}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              A IA criará algo parecido com a imagem enviada
            </p>
          </div>

          {/* Brand Colors Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="brand-colors" className="cursor-pointer">Usar cores da marca</Label>
              {useBrandColors && brandConfig.colors.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {brandConfig.colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
            <Switch
              id="brand-colors"
              checked={useBrandColors}
              onCheckedChange={setUseBrandColors}
            />
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
            {selectedFormatData && (
              <span>
                {selectedFormatData.name} • {selectedFormatData.dimensions} ({selectedFormatData.ratio})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30"
            style={{ 
              aspectRatio: selectedFormatData?.ratio.replace(":", "/") || "1/1",
              maxHeight: "500px"
            }}
          >
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
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center p-4">
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
