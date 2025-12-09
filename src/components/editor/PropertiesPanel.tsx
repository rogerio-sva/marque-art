import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandConfig } from "@/lib/brand-store";

interface PropertiesPanelProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  brandConfig: BrandConfig;
}

export function PropertiesPanel({ canvas, selectedObject, brandConfig }: PropertiesPanelProps) {
  const [fill, setFill] = useState<string>("#000000");
  const [stroke, setStroke] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(100);
  const [fontSize, setFontSize] = useState<number>(24);
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (selectedObject) {
      const objFill = selectedObject.get("fill");
      setFill(typeof objFill === "string" ? objFill : "#000000");
      setStroke((selectedObject.get("stroke") as string) || "#000000");
      setStrokeWidth(selectedObject.get("strokeWidth") || 0);
      setOpacity((selectedObject.get("opacity") || 1) * 100);

      if (selectedObject.type === "i-text" || selectedObject.type === "text") {
        setFontSize((selectedObject as any).fontSize || 24);
        setText((selectedObject as any).text || "");
      }
    }
  }, [selectedObject]);

  const updateProperty = (property: string, value: any) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set(property as keyof FabricObject, value);
    canvas.renderAll();
  };

  const handleFillChange = (value: string) => {
    setFill(value);
    updateProperty("fill", value);
  };

  const handleStrokeChange = (value: string) => {
    setStroke(value);
    updateProperty("stroke", value);
  };

  const handleStrokeWidthChange = (value: number[]) => {
    setStrokeWidth(value[0]);
    updateProperty("strokeWidth", value[0]);
  };

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
    updateProperty("opacity", value[0] / 100);
  };

  const handleFontSizeChange = (value: string) => {
    const size = parseInt(value) || 24;
    setFontSize(size);
    updateProperty("fontSize", size);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (selectedObject && (selectedObject.type === "i-text" || selectedObject.type === "text")) {
      (selectedObject as any).set("text", value);
      canvas?.renderAll();
    }
  };

  const applyBrandColor = (color: string) => {
    handleFillChange(color);
  };

  if (!selectedObject) {
    return (
      <div className="w-64 border-l border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Propriedades</h3>
        <p className="text-sm text-muted-foreground">
          Selecione um objeto para editar suas propriedades
        </p>

        <Separator className="my-4" />

        <h4 className="text-sm font-medium mb-2">Cores da Marca</h4>
        <div className="flex flex-wrap gap-2">
          {brandConfig.colors.map((color, index) => (
            <button
              key={index}
              className="w-8 h-8 rounded border border-border cursor-not-allowed opacity-50"
              style={{ backgroundColor: color }}
              disabled
            />
          ))}
        </div>
      </div>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text";

  return (
    <div className="w-64 border-l border-border bg-card p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Propriedades</h3>

      <div className="space-y-4">
        {/* Text Properties */}
        {isText && (
          <>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Digite o texto"
              />
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                min={8}
                max={200}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Fill Color */}
        <div className="space-y-2">
          <Label>Cor de Preenchimento</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={fill}
              onChange={(e) => handleFillChange(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={fill}
              onChange={(e) => handleFillChange(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Cores da Marca</Label>
          <div className="flex flex-wrap gap-2">
            {brandConfig.colors.map((color, index) => (
              <button
                key={index}
                className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => applyBrandColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Stroke */}
        <div className="space-y-2">
          <Label>Cor da Borda</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={stroke}
              onChange={(e) => handleStrokeChange(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={stroke}
              onChange={(e) => handleStrokeChange(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Espessura da Borda: {strokeWidth}px</Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={handleStrokeWidthChange}
            min={0}
            max={20}
            step={1}
          />
        </div>

        <Separator />

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacidade: {Math.round(opacity)}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}
