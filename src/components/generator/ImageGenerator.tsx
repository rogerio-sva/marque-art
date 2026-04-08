import { useState, useRef } from "react";
import { Sparkles, Loader2, Download, Save, RefreshCw, Type, Palette, UserCircle, X, Upload, Pencil, Image as ImageIcon } from "lucide-react";
import { EditorModal } from "@/components/editor/EditorModal";
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

interface ImageGeneratorProps {
  onEditImage?: (imageUrl: string) => void;
  lastGeneratedImage?: string | null;
  onImageGenerated?: (imageUrl: string) => void;
}

const formats = [
  { id: "post-square", name: "Post Feed", dimensions: "1080×1080", ratio: "1:1", emoji: "📱" },
  { id: "post-portrait", name: "Post Retrato", dimensions: "1080×1350", ratio: "4:5", emoji: "📲" },
  { id: "stories", name: "Stories/Reels", dimensions: "1080×1920", ratio: "9:16", emoji: "📖" },
  { id: "thumbnail", name: "Thumbnail", dimensions: "1280×720", ratio: "16:9", emoji: "🎬" },
  { id: "ad-landscape", name: "Anúncio", dimensions: "1200×628", ratio: "1.91:1", emoji: "📢" },
  { id: "ad-square", name: "Anúncio Quadrado", dimensions: "1080×1080", ratio: "1:1", emoji: "🎯" },
  { id: "custom", name: "Personalizado", dimensions: "Custom", ratio: "?", emoji: "✏️" },
];

const customPresets = [
  { name: "WhatsApp", width: 640, height: 640 },
  { name: "Banner", width: 1920, height: 600 },
  { name: "Capa FB", width: 820, height: 312 },
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

const textPositions = [
  { id: "center", name: "Centro", emoji: "⬛" },
  { id: "top", name: "Topo", emoji: "⬆️" },
  { id: "bottom", name: "Rodapé", emoji: "⬇️" },
];

const textSizes = [
  { id: "small", name: "Pequeno", size: "0.65rem" },
  { id: "medium", name: "Médio", size: "0.875rem" },
  { id: "large", name: "Grande", size: "1.125rem" },
];

const textColors = [
  { id: "light", name: "Claro", color: "#FFFFFF", bg: "bg-white border border-border" },
  { id: "dark", name: "Escuro", color: "#1a1a1a", bg: "bg-gray-900" },
  { id: "primary", name: "Marca", color: "var(--primary)", bg: "bg-primary" },
];

export function ImageGenerator({ onEditImage, lastGeneratedImage, onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("post-square");
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [includeText, setIncludeText] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [textPosition, setTextPosition] = useState("center");
  const [textSize, setTextSize] = useState("medium");
  const [textColor, setTextColor] = useState("light");
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [includeBrandLogo, setIncludeBrandLogo] = useState(false);
  const [specialistPhotos, setSpecialistPhotos] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceModifications, setReferenceModifications] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(lastGeneratedImage || null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
          customWidth: selectedFormat === "custom" ? customWidth : null,
          customHeight: selectedFormat === "custom" ? customHeight : null,
          contentType: selectedContentType,
          mood: selectedMood,
          includeText: includeText ? textContent : null,
          textPosition: includeText ? textPosition : null,
          brandColors: useBrandColors ? brandConfig.colors : null,
          specialistPhotos: specialistPhotos.length > 0 ? specialistPhotos : null,
          referenceImage: referenceImage,
          referenceModifications: referenceModifications.trim() || null,
          brandLogo: includeBrandLogo && brandConfig.logo ? brandConfig.logo : null,
        },
      });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || "Erro ao gerar imagem");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const imageUrl = data.url || data.image_url;
      setGeneratedImage(imageUrl);
      onImageGenerated?.(imageUrl);

      // Auto-save to gallery
      try {
        await saveImage(prompt, selectedStyle, imageUrl);
      } catch {
        // Save error already handled in hook
      }

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
                  <span className="text-muted-foreground">
                    {format.id === "custom" ? `${customWidth}×${customHeight}` : format.dimensions}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Custom Dimensions */}
            {selectedFormat === "custom" && (
              <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Largura (px)</Label>
                    <Input
                      type="number"
                      min={256}
                      max={4096}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Math.min(4096, Math.max(256, parseInt(e.target.value) || 256)))}
                      className="text-center"
                    />
                  </div>
                  <div className="flex items-end pb-2 text-muted-foreground">×</div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Altura (px)</Label>
                    <Input
                      type="number"
                      min={256}
                      max={4096}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Math.min(4096, Math.max(256, parseInt(e.target.value) || 256)))}
                      className="text-center"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setCustomWidth(preset.width);
                        setCustomHeight(preset.height);
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {preset.name} ({preset.width}×{preset.height})
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Ex: PROMOÇÃO ESPECIAL ou Inscreva-se agora!"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
                
                {/* Text Position Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Posição do texto</Label>
                  <div className="flex gap-2">
                    {textPositions.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setTextPosition(pos.id)}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                          textPosition === pos.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span>{pos.emoji}</span>
                        <span>{pos.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Text Size Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tamanho do texto</Label>
                  <div className="flex gap-2">
                    {textSizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setTextSize(size.id)}
                        className={`flex-1 flex items-center justify-center rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                          textSize === size.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span style={{ fontSize: size.size }}>{size.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Text Color Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cor do texto</Label>
                  <div className="flex gap-2">
                    {textColors.map((colorOption) => (
                      <button
                        key={colorOption.id}
                        onClick={() => setTextColor(colorOption.id)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                          textColor === colorOption.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${colorOption.bg}`} />
                        <span>{colorOption.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Text Preview */}
                {textContent && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Preview do texto</Label>
                    <div 
                      className="relative bg-gradient-to-br from-muted/50 to-muted rounded-lg overflow-hidden"
                      style={{
                        aspectRatio: selectedFormatData?.ratio.replace(':', '/') || '1/1',
                        maxHeight: '180px',
                      }}
                    >
                      {/* Safe margin indicator */}
                      <div className="absolute inset-[15%] border-2 border-dashed border-primary/30 rounded pointer-events-none" />
                      
                      {/* Text preview with position */}
                      <div 
                        className={`absolute inset-[15%] flex p-2 ${
                          textPosition === 'top' 
                            ? 'items-start justify-center' 
                            : textPosition === 'bottom' 
                              ? 'items-end justify-center' 
                              : 'items-center justify-center'
                        }`}
                      >
                        <p 
                          className="text-center font-bold break-words"
                          style={{
                            fontSize: textSizes.find(s => s.id === textSize)?.size || '0.875rem',
                            lineHeight: 1.2,
                            color: textColors.find(c => c.id === textColor)?.color || '#FFFFFF',
                            textShadow: textColor === 'light' ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(255,255,255,0.3)',
                          }}
                        >
                          {textContent}
                        </p>
                      </div>
                      
                      {/* Format label */}
                      <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/70">
                        {selectedFormatData?.dimensions}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Área tracejada = margem segura (15%). O texto ficará na posição selecionada.
                    </p>
                  </div>
                )}
              </div>
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

          {/* Brand Logo Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="brand-logo" className="cursor-pointer">Incluir logo da marca</Label>
              {includeBrandLogo && brandConfig.logo && (
                <img 
                  src={brandConfig.logo} 
                  alt="Logo" 
                  className="h-6 w-6 object-contain ml-2 rounded border border-border"
                />
              )}
            </div>
            {brandConfig.logo ? (
              <Switch
                id="brand-logo"
                checked={includeBrandLogo}
                onCheckedChange={setIncludeBrandLogo}
              />
            ) : (
              <span className="text-xs text-muted-foreground">Configure na aba Marca</span>
            )}
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
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToGallery}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
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
              <Button
                onClick={() => setIsEditorOpen(true)}
                variant="default"
                className="w-full gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar no Editor Visual
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EditorModal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageUrl={generatedImage}
      />
    </div>
  );
}
