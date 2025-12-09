import { useState, useCallback, useRef } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Card, CardContent } from "@/components/ui/card";
import { EditorToolbar, ToolType } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { FormatSelector, formatOptions, FormatOption } from "./FormatSelector";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { toast } from "sonner";

interface VisualEditorProps {
  initialImage?: string | null;
}

export function VisualEditor({ initialImage }: VisualEditorProps) {
  const { config: brandConfig } = useBrandConfig();
  const { saveImage } = useGeneratedImages();
  
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("feed-square");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(initialImage || null);
  
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const format = formatOptions.find((f) => f.id === selectedFormat) || formatOptions[0];

  const saveToHistory = useCallback(() => {
    if (!canvas) return;
    
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, [canvas]);

  const handleCanvasReady = useCallback((fabricCanvas: FabricCanvas) => {
    setCanvas(fabricCanvas);
    
    fabricCanvas.on("object:added", () => saveToHistory());
    fabricCanvas.on("object:modified", () => saveToHistory());
    fabricCanvas.on("object:removed", () => saveToHistory());
  }, [saveToHistory]);

  const handleSelectionChange = useCallback((obj: FabricObject | null) => {
    setSelectedObject(obj);
    if (obj) {
      setActiveTool("select");
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
    canvas.renderAll();
  }, [canvas, selectedObject]);

  const handleUndo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;
    
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [canvas]);

  const handleRedo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [canvas]);

  const handleZoomIn = useCallback(() => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    canvas.setZoom(Math.min(currentZoom * 1.2, 3));
    canvas.renderAll();
  }, [canvas]);

  const handleZoomOut = useCallback(() => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    canvas.setZoom(Math.max(currentZoom / 1.2, 0.3));
    canvas.renderAll();
  }, [canvas]);

  const handleExport = useCallback(() => {
    if (!canvas) return;

    const originalZoom = canvas.getZoom();
    canvas.setZoom(1);

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
      width: format.width,
      height: format.height,
    });

    canvas.setZoom(originalZoom);

    const link = document.createElement("a");
    link.download = `design-${format.id}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    toast.success("Imagem exportada com sucesso!");
  }, [canvas, format]);

  const handleSave = useCallback(async () => {
    if (!canvas) return;

    const originalZoom = canvas.getZoom();
    canvas.setZoom(1);

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
      width: format.width,
      height: format.height,
    });

    canvas.setZoom(originalZoom);

    try {
      await saveImage(`Editor: ${format.label}`, "edited", dataUrl);
      toast.success("Imagem salva na galeria!");
    } catch (error) {
      toast.error("Erro ao salvar imagem");
    }
  }, [canvas, format, saveImage]);

  const handleFormatChange = (formatId: string) => {
    setSelectedFormat(formatId);
  };

  return (
    <Card className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onExport={handleExport}
        onSave={handleSave}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={!!selectedObject}
      />

      <div className="flex items-center gap-4 p-3 border-b border-border">
        <FormatSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
        />
      </div>

      <CardContent className="flex-1 flex p-0 overflow-hidden">
        <EditorCanvas
          format={format}
          activeTool={activeTool}
          onCanvasReady={handleCanvasReady}
          onSelectionChange={handleSelectionChange}
          backgroundImage={backgroundImage}
          brandColors={brandConfig.colors}
          titleFont={brandConfig.titleFont}
        />
        <LayersPanel
          canvas={canvas}
          selectedObject={selectedObject}
          onSelectObject={handleSelectionChange}
        />
        <PropertiesPanel
          canvas={canvas}
          selectedObject={selectedObject}
          brandConfig={brandConfig}
        />
      </CardContent>
    </Card>
  );
}
