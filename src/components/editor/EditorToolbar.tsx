import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Type,
  Square,
  Circle,
  Image,
  MousePointer2,
  Trash2,
  Download,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

export type ToolType = "select" | "text" | "rectangle" | "circle" | "image" | "pan";

interface EditorToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const tools = [
  { id: "select" as ToolType, icon: MousePointer2, label: "Selecionar" },
  { id: "pan" as ToolType, icon: Move, label: "Mover Canvas" },
  { id: "text" as ToolType, icon: Type, label: "Adicionar Texto" },
  { id: "rectangle" as ToolType, icon: Square, label: "Retângulo" },
  { id: "circle" as ToolType, icon: Circle, label: "Círculo" },
  { id: "image" as ToolType, icon: Image, label: "Adicionar Imagem" },
];

export function EditorToolbar({
  activeTool,
  onToolChange,
  onDelete,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onExport,
  onSave,
  canUndo,
  canRedo,
  hasSelection,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-card">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* History */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfazer</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refazer</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Diminuir Zoom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Aumentar Zoom</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onDelete} disabled={!hasSelection}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir Seleção</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar na Galeria
        </Button>
        <Button size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
    </div>
  );
}
