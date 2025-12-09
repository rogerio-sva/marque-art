import { useEffect, useRef, useCallback, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, FabricImage, FabricObject } from "fabric";
import { ToolType } from "./EditorToolbar";
import { FormatOption } from "./FormatSelector";

interface EditorCanvasProps {
  format: FormatOption;
  activeTool: ToolType;
  onCanvasReady: (canvas: FabricCanvas) => void;
  onSelectionChange: (obj: FabricObject | null) => void;
  backgroundImage?: string | null;
  brandColors: string[];
  titleFont: string;
}

export function EditorCanvas({
  format,
  activeTool,
  onCanvasReady,
  onSelectionChange,
  backgroundImage,
  brandColors,
  titleFont,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate canvas display size to fit container
  const getDisplaySize = useCallback(() => {
    if (!containerRef.current) return { width: format.width, height: format.height, scale: 1 };
    
    const containerWidth = containerRef.current.clientWidth - 48;
    const containerHeight = containerRef.current.clientHeight - 48;
    
    const scaleX = containerWidth / format.width;
    const scaleY = containerHeight / format.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    return {
      width: format.width * scale,
      height: format.height * scale,
      scale,
    };
  }, [format]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const { scale } = getDisplaySize();

    const canvas = new FabricCanvas(canvasRef.current, {
      width: format.width,
      height: format.height,
      backgroundColor: "#ffffff",
      selection: true,
    });

    canvas.setZoom(scale);
    canvas.setDimensions({
      width: format.width * scale,
      height: format.height * scale,
    });

    fabricRef.current = canvas;
    onCanvasReady(canvas);

    canvas.on("selection:created", (e) => {
      onSelectionChange(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      onSelectionChange(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      onSelectionChange(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [format, onCanvasReady, onSelectionChange, getDisplaySize]);

  // Update canvas size when format changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const { scale } = getDisplaySize();
    const canvas = fabricRef.current;

    canvas.setDimensions({
      width: format.width,
      height: format.height,
    });
    canvas.setZoom(scale);
    canvas.setDimensions({
      width: format.width * scale,
      height: format.height * scale,
    });
    canvas.renderAll();
  }, [format, getDisplaySize]);

  // Load background image
  useEffect(() => {
    if (!fabricRef.current || !backgroundImage) return;

    const canvas = fabricRef.current;

    FabricImage.fromURL(backgroundImage, { crossOrigin: "anonymous" }).then((img) => {
      const scaleX = format.width / (img.width || 1);
      const scaleY = format.height / (img.height || 1);
      const scale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: format.width / 2,
        top: format.height / 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      (img as any).isBackground = true;

      // Remove existing background
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        if ((obj as any).isBackground) {
          canvas.remove(obj);
        }
      });

      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });
  }, [backgroundImage, format]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    canvas.isDrawingMode = false;
    canvas.selection = activeTool === "select";

    // Set cursor based on tool
    switch (activeTool) {
      case "pan":
        canvas.defaultCursor = "grab";
        break;
      case "text":
      case "rectangle":
      case "circle":
        canvas.defaultCursor = "crosshair";
        break;
      default:
        canvas.defaultCursor = "default";
    }
  }, [activeTool]);

  // Handle canvas click for adding objects
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!fabricRef.current) return;

      const canvas = fabricRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const zoom = canvas.getZoom();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      const primaryColor = brandColors[0] || "#3b82f6";

      switch (activeTool) {
        case "text":
          const text = new IText("Digite aqui", {
            left: x,
            top: y,
            fontFamily: titleFont || "sans-serif",
            fontSize: 32,
            fill: primaryColor,
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          break;

        case "rectangle":
          const rectObj = new Rect({
            left: x - 50,
            top: y - 50,
            width: 100,
            height: 100,
            fill: primaryColor,
            stroke: "#000000",
            strokeWidth: 0,
          });
          canvas.add(rectObj);
          canvas.setActiveObject(rectObj);
          break;

        case "circle":
          const circle = new Circle({
            left: x - 50,
            top: y - 50,
            radius: 50,
            fill: primaryColor,
            stroke: "#000000",
            strokeWidth: 0,
          });
          canvas.add(circle);
          canvas.setActiveObject(circle);
          break;

        case "image":
          fileInputRef.current?.click();
          break;
      }

      canvas.renderAll();
    },
    [activeTool, brandColors, titleFont]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      FabricImage.fromURL(dataUrl).then((img) => {
        const canvas = fabricRef.current!;
        const maxSize = Math.min(format.width, format.height) * 0.5;
        const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1));
        
        img.set({
          left: format.width / 2,
          top: format.height / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    
    e.target.value = "";
  };

  const { width: displayWidth, height: displayHeight } = getDisplaySize();

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-muted/50 flex items-center justify-center overflow-auto p-6"
    >
      <div
        className="shadow-xl rounded-lg overflow-hidden"
        style={{ width: displayWidth, height: displayHeight }}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
