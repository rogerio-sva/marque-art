import { Check, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CreativeResult {
  id: string;
  imageUrl: string | null;
  format: string;
  colorVariation: string;
  copyVariation: string;
  copy: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

interface CreativePreviewGridProps {
  creatives: CreativeResult[];
  onDownloadAll: () => void;
  onSaveAll: () => void;
  isGenerating: boolean;
}

export function CreativePreviewGrid({
  creatives,
  onDownloadAll,
  onSaveAll,
  isGenerating,
}: CreativePreviewGridProps) {
  const completedCount = creatives.filter((c) => c.status === "done").length;
  const totalCount = creatives.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (creatives.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progresso: {completedCount}/{totalCount} geradas
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {creatives.map((creative) => (
          <div
            key={creative.id}
            className={cn(
              "relative aspect-square rounded-lg border bg-card overflow-hidden",
              creative.status === "error" && "border-destructive"
            )}
          >
            {creative.status === "pending" && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30" />
              </div>
            )}

            {creative.status === "generating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {creative.status === "done" && creative.imageUrl && (
              <>
                <img
                  src={creative.imageUrl}
                  alt={creative.copy}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </>
            )}

            {creative.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-2">
                <X className="w-6 h-6 text-destructive mb-1" />
                <span className="text-xs text-destructive text-center">
                  {creative.error || "Erro"}
                </span>
              </div>
            )}

            {/* Format Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-background/80 text-xs font-medium">
              {creative.format}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {completedCount > 0 && !isGenerating && (
        <div className="flex gap-3 justify-center">
          <Button onClick={onSaveAll} variant="default">
            Salvar Todas na Galeria ({completedCount})
          </Button>
          <Button onClick={onDownloadAll} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Baixar Todas
          </Button>
        </div>
      )}
    </div>
  );
}
