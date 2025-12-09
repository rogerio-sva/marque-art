import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, FabricObject, util } from "fabric";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Square,
  Circle,
  Image,
} from "lucide-react";

interface LayersPanelProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  onSelectObject: (obj: FabricObject | null) => void;
}

interface LayerInfo {
  object: FabricObject;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

const getObjectIcon = (type: string) => {
  switch (type) {
    case "i-text":
    case "text":
      return Type;
    case "rect":
      return Square;
    case "circle":
      return Circle;
    case "image":
      return Image;
    default:
      return Square;
  }
};

const getObjectName = (obj: FabricObject, index: number): string => {
  const type = obj.type || "object";
  
  if (type === "i-text" || type === "text") {
    const text = (obj as any).text || "";
    return text.substring(0, 20) + (text.length > 20 ? "..." : "") || `Texto ${index + 1}`;
  }
  
  switch (type) {
    case "rect":
      return `Retângulo ${index + 1}`;
    case "circle":
      return `Círculo ${index + 1}`;
    case "image":
      return `Imagem ${index + 1}`;
    default:
      return `Objeto ${index + 1}`;
  }
};

export function LayersPanel({ canvas, selectedObject, onSelectObject }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerInfo[]>([]);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects().filter(obj => obj.type !== "image" || !(obj as any).isBackground);
      const layerInfos: LayerInfo[] = objects.map((obj, index) => ({
        object: obj,
        name: getObjectName(obj, index),
        type: obj.type || "object",
        visible: obj.visible !== false,
        locked: !obj.selectable,
      }));
      setLayers(layerInfos.reverse());
    };

    updateLayers();
    
    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);
    canvas.on("object:modified", updateLayers);

    return () => {
      canvas.off("object:added", updateLayers);
      canvas.off("object:removed", updateLayers);
      canvas.off("object:modified", updateLayers);
    };
  }, [canvas]);

  const moveUp = (layer: LayerInfo) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const index = objects.indexOf(layer.object);
    if (index < objects.length - 1) {
      canvas.moveObjectTo(layer.object, index + 1);
      canvas.renderAll();
    }
  };

  const moveDown = (layer: LayerInfo) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const index = objects.indexOf(layer.object);
    if (index > 0) {
      canvas.moveObjectTo(layer.object, index - 1);
      canvas.renderAll();
    }
  };

  const toggleVisibility = (layer: LayerInfo) => {
    if (!canvas) return;
    layer.object.set("visible", !layer.visible);
    canvas.renderAll();
    setLayers(prev =>
      prev.map(l => 
        l.object === layer.object 
          ? { ...l, visible: !l.visible } 
          : l
      )
    );
  };

  const toggleLock = (layer: LayerInfo) => {
    if (!canvas) return;
    const isLocked = !layer.locked;
    layer.object.set({
      selectable: !isLocked,
      evented: !isLocked,
    });
    canvas.renderAll();
    setLayers(prev => 
      prev.map(l => 
        l.object === layer.object 
          ? { ...l, locked: isLocked } 
          : l
      )
    );
  };

  const selectLayer = (layer: LayerInfo) => {
    if (!canvas || layer.locked) return;
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    onSelectObject(layer.object);
  };

  return (
    <div className="w-56 border-l border-border bg-card flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Camadas</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma camada
            </p>
          ) : (
            layers.map((layer, index) => {
              const Icon = getObjectIcon(layer.type);
              const isSelected = selectedObject === layer.object;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-1 p-2 rounded text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  } ${layer.locked ? "opacity-60" : ""}`}
                  onClick={() => selectLayer(layer)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs">{layer.name}</span>
                  
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(layer);
                      }}
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(layer);
                      }}
                    >
                      {layer.locked ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(layer);
                      }}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(layer);
                      }}
                      disabled={index === layers.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
