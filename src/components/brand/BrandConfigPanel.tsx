import { useState, useRef } from "react";
import { Upload, Palette, Type, RotateCcw, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { availableFonts } from "@/lib/brand-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BrandConfigPanel() {
  const { config, updateConfig, reset } = useBrandConfig();
  const [isUploading, setIsUploading] = useState(false);
  const [newColor, setNewColor] = useState("#7C3AED");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setIsUploading(true);
    
    try {
      const fileName = `logo-${Date.now()}.${file.name.split(".").pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(`brand-logos/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("generated-images")
        .getPublicUrl(`brand-logos/${fileName}`);

      updateConfig({ logo: publicUrl });
      toast.success("Logo carregado com sucesso!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao carregar logo");
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    updateConfig({ logo: null });
    toast.success("Logo removido");
  };

  const addColor = () => {
    if (config.colors.includes(newColor)) {
      toast.error("Esta cor já existe na paleta");
      return;
    }
    if (config.colors.length >= 8) {
      toast.error("Máximo de 8 cores na paleta");
      return;
    }
    updateConfig({ colors: [...config.colors, newColor] });
    toast.success("Cor adicionada");
  };

  const removeColor = (colorToRemove: string) => {
    if (config.colors.length <= 1) {
      toast.error("A paleta precisa ter pelo menos 1 cor");
      return;
    }
    updateConfig({ colors: config.colors.filter((c) => c !== colorToRemove) });
  };

  const updateColor = (index: number, newValue: string) => {
    const newColors = [...config.colors];
    newColors[index] = newValue;
    updateConfig({ colors: newColors });
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Logo da Marca
          </CardTitle>
          <CardDescription>
            Carregue o logo da sua marca (PNG com transparência recomendado)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          
          {config.logo ? (
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted/50 p-2">
                <img
                  src={config.logo}
                  alt="Brand logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Alterar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeLogo}
                  className="text-destructive hover:text-destructive"
                >
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isUploading ? "Carregando..." : "Clique para carregar o logo"}
              </span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Paleta de Cores
          </CardTitle>
          <CardDescription>
            Defina as cores principais da sua marca (até 8 cores)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {config.colors.map((color, index) => (
              <div key={index} className="group relative">
                <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="h-12 w-12 cursor-pointer rounded-lg border-2 border-border shadow-sm transition-shadow hover:shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <button
                    onClick={() => removeColor(color)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="mt-1 block text-center text-xs text-muted-foreground">
                  {color.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {config.colors.length < 8 && (
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-28 font-mono text-sm uppercase"
                maxLength={7}
              />
              <Button size="sm" variant="outline" onClick={addColor}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fonts Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            Tipografia
          </CardTitle>
          <CardDescription>
            Escolha as fontes para títulos e textos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="titleFont">Fonte de Títulos</Label>
              <Select
                value={config.titleFont}
                onValueChange={(value) => updateConfig({ titleFont: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFonts
                    .filter((f) => f.category === "display" || f.category === "both")
                    .map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        <span style={{ fontFamily: font.name }}>{font.name}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p
                className="text-2xl font-semibold"
                style={{ fontFamily: config.titleFont }}
              >
                Exemplo de Título
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFont">Fonte de Texto</Label>
              <Select
                value={config.bodyFont}
                onValueChange={(value) => updateConfig({ bodyFont: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFonts
                    .filter((f) => f.category === "body" || f.category === "both")
                    .map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        <span style={{ fontFamily: font.name }}>{font.name}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-base" style={{ fontFamily: config.bodyFont }}>
                Exemplo de texto corrido para ver como a fonte fica em parágrafos maiores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Reset */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Resetar Configurações
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-success" />
          Alterações salvas automaticamente
        </div>
      </div>
    </div>
  );
}