import { Check, Download, Loader2, X, Archive, Pencil, Eye, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { useState } from "react";
import { toast } from "sonner";
import { EditorModal } from "@/components/editor/EditorModal";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  onEditImage?: (imageUrl: string) => void;
  onRegenerate?: (creativeId: string) => void;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function CreativePreviewGrid({
  creatives,
  onDownloadAll,
  onSaveAll,
  isGenerating,
  onEditImage,
  onRegenerate,
}: CreativePreviewGridProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCopy, setPreviewCopy] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleEditClick = (imageUrl: string) => {
    setEditorImage(imageUrl);
    setIsEditorOpen(true);
  };

  const handlePreviewClick = (imageUrl: string, copy: string) => {
    setPreviewImage(imageUrl);
    setPreviewCopy(copy);
    setIsPreviewOpen(true);
  };
  const completedCount = creatives.filter((c) => c.status === "done").length;
  const totalCount = creatives.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDownloadZip = async () => {
    const completedCreatives = creatives.filter(
      (c) => c.status === "done" && c.imageUrl
    );

    if (completedCreatives.length === 0) {
      toast.error("Nenhuma imagem para baixar");
      return;
    }

    setIsZipping(true);
    toast.info("Preparando arquivo ZIP...");

    try {
      const zip = new JSZip();
      const folder = zip.folder("criativos");

      for (let i = 0; i < completedCreatives.length; i++) {
        const creative = completedCreatives[i];
        if (!creative.imageUrl) continue;

        const blob = await dataUrlToBlob(creative.imageUrl);
        const fileName = `${creative.format}_${creative.colorVariation}_${creative.copyVariation}_${i + 1}.png`;
        folder?.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `criativos_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${completedCreatives.length} imagens baixadas em ZIP!`);
    } catch (error) {
      console.error("Erro ao criar ZIP:", error);
      toast.error("Erro ao criar arquivo ZIP");
    } finally {
      setIsZipping(false);
    }
  };

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
              <div className="group relative w-full h-full">
                <img
                  src={creative.imageUrl}
                  alt={creative.copy}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePreviewClick(creative.imageUrl!, creative.copy)}
                    className="w-9 h-9 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors shadow-md"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => handleEditClick(creative.imageUrl!)}
                    className="w-9 h-9 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors shadow-md"
                    title="Editar no Editor Visual"
                  >
                    <Pencil className="w-4 h-4 text-foreground" />
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(creative.id)}
                      className="w-9 h-9 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors shadow-md"
                      title="Regenerar este criativo"
                    >
                      <RefreshCcw className="w-4 h-4 text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {creative.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-2 group">
                <X className="w-6 h-6 text-destructive mb-1" />
                <span className="text-xs text-destructive text-center">
                  {creative.error || "Erro"}
                </span>
                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate(creative.id)}
                    className="mt-2 px-3 py-1 rounded-full bg-background text-foreground text-xs flex items-center gap-1 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Tentar novamente
                  </button>
                )}
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
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={onSaveAll} variant="default">
            Salvar Todas na Galeria ({completedCount})
          </Button>
          <Button onClick={handleDownloadZip} variant="outline" disabled={isZipping}>
            {isZipping ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Archive className="w-4 h-4 mr-2" />
            )}
            Baixar ZIP
          </Button>
        </div>
      )}

      <EditorModal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageUrl={editorImage}
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-2">
          {previewImage && (
            <div className="space-y-3">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              {previewCopy && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Copy:</p>
                  <p className="text-foreground">{previewCopy}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
