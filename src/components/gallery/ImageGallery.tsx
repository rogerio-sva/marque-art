import { useState } from "react";
import { Heart, Trash2, Download, Search, Filter, Grid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGeneratedImages, type GeneratedImage } from "@/hooks/useGeneratedImages";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export function ImageGallery() {
  const { images, isLoading, toggleFavorite, deleteImage } = useGeneratedImages();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.style && img.style.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFavorite = !showFavoritesOnly || img.is_favorite;
    return matchesSearch && matchesFavorite;
  });

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-studio-${image.id.slice(0, 8)}.png`;
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

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta imagem?")) {
      await deleteImage(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Grid className="h-5 w-5 text-primary" />
              Galeria de Imagens
            </CardTitle>
            <CardDescription>
              {images.length} {images.length === 1 ? "imagem gerada" : "imagens geradas"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title="Mostrar apenas favoritos"
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Grid className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">
                {searchQuery || showFavoritesOnly
                  ? "Nenhuma imagem encontrada"
                  : "Sua galeria está vazia"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery || showFavoritesOnly
                  ? "Tente ajustar os filtros"
                  : "Gere sua primeira imagem para começar"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <div className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-elevated">
                    <div className="aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.prompt}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform group-hover:translate-y-0">
                      <p className="line-clamp-2 text-sm font-medium text-primary-foreground">
                        {image.prompt}
                      </p>
                      <p className="mt-1 text-xs text-primary-foreground/70">
                        {formatDate(image.created_at)}
                      </p>
                    </div>

                    {/* Favorite indicator */}
                    {image.is_favorite && (
                      <div className="absolute right-2 top-2">
                        <Heart className="h-5 w-5 fill-destructive text-destructive drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </DialogTrigger>

                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                  <div className="relative">
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-foreground">{image.prompt}</p>
                    {image.style && (
                      <span className="mt-2 inline-block rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                        {image.style}
                      </span>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Criado em {formatDate(image.created_at)}
                    </p>
                    
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(image.id)}
                        className="gap-2"
                      >
                        <Heart className={`h-4 w-4 ${image.is_favorite ? "fill-destructive text-destructive" : ""}`} />
                        {image.is_favorite ? "Remover favorito" : "Favoritar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(image)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}