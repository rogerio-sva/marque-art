import { useState } from "react";
import { Heart, Trash2, Download, Search, Grid, Loader2, FolderPlus, Folder, FolderOpen, MoreVertical, X, Pencil, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGeneratedImages, type GeneratedImage } from "@/hooks/useGeneratedImages";
import { useFolders } from "@/hooks/useFolders";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", 
  "#f97316", "#eab308", "#22c55e", "#06b6d4"
];

interface ImageGalleryProps {
  onEditImage?: (imageUrl: string) => void;
}

export function ImageGallery({ onEditImage }: ImageGalleryProps) {
  const { images, isLoading, toggleFavorite, deleteImage, moveToFolder } = useGeneratedImages();
  const { folders, createFolder, deleteFolder, updateFolder } = useFolders();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [editingFolderColor, setEditingFolderColor] = useState("");

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.style && img.style.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFavorite = !showFavoritesOnly || img.is_favorite;
    const matchesFolder = selectedFolderId === null || img.folder_id === selectedFolderId;
    return matchesSearch && matchesFavorite && matchesFolder;
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }
    await createFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName("");
    setNewFolderColor(FOLDER_COLORS[0]);
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta pasta? As imagens não serão excluídas.")) {
      await deleteFolder(id);
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
    }
  };

  const startEditingFolder = (folder: { id: string; name: string; color: string | null }) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setEditingFolderColor(folder.color || FOLDER_COLORS[0]);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolderId || !editingFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }
    await updateFolder(editingFolderId, { name: editingFolderName.trim(), color: editingFolderColor });
    setEditingFolderId(null);
    setEditingFolderName("");
    setEditingFolderColor("");
  };

  const handleQuickDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const getImagesInFolder = (folderId: string | null) => {
    if (folderId === null) {
      return images.length;
    }
    return images.filter(img => img.folder_id === folderId).length;
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
        {/* Folders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Pastas</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
              className="h-8 gap-1"
            >
              <FolderPlus className="h-4 w-4" />
              Nova pasta
            </Button>
          </div>

          {isCreatingFolder && (
            <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-3">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cor:</span>
                <div className="flex gap-1">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${newFolderColor === color ? "scale-125 ring-2 ring-offset-2 ring-foreground" : ""}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateFolder}>Criar</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingFolder(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Editing Folder */}
          {editingFolderId && (
            <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-3">
              <Input
                placeholder="Nome da pasta"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateFolder()}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cor:</span>
                <div className="flex gap-1">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingFolderColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${editingFolderColor === color ? "scale-125 ring-2 ring-offset-2 ring-foreground" : ""}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdateFolder}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingFolderId(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFolderId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolderId(null)}
              className="gap-2"
            >
              <Grid className="h-4 w-4" />
              Todas ({images.length})
            </Button>

            {folders.map((folder) => (
              <div key={folder.id} className="relative group">
                <Button
                  variant={selectedFolderId === folder.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="gap-2 pr-8"
                >
                  {selectedFolderId === folder.id ? (
                    <FolderOpen className="h-4 w-4" style={{ color: folder.color || "#6366f1" }} />
                  ) : (
                    <Folder className="h-4 w-4" style={{ color: folder.color || "#6366f1" }} />
                  )}
                  {folder.name} ({getImagesInFolder(folder.id)})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditingFolder(folder)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Renomear / Cor
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir pasta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Grid className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">
                {searchQuery || showFavoritesOnly || selectedFolderId
                  ? "Nenhuma imagem encontrada"
                  : "Sua galeria está vazia"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery || showFavoritesOnly || selectedFolderId
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

                    {/* Folder indicator */}
                    {image.folder_id && (
                      <div className="absolute left-2 top-2">
                        <Folder 
                          className="h-5 w-5 drop-shadow-md" 
                          style={{ color: folders.find(f => f.id === image.folder_id)?.color || "#6366f1" }} 
                        />
                      </div>
                    )}

                    {/* Quick delete button */}
                    <button
                      onClick={(e) => handleQuickDelete(e, image.id)}
                      className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                    
                    <div className="mt-4 flex flex-wrap gap-2">
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
                      
                      {/* Move to folder dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Folder className="h-4 w-4" />
                            {image.folder_id 
                              ? folders.find(f => f.id === image.folder_id)?.name || "Pasta"
                              : "Mover para pasta"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {image.folder_id && (
                            <>
                              <DropdownMenuItem onClick={() => moveToFolder(image.id, null)}>
                                <X className="h-4 w-4 mr-2" />
                                Remover da pasta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => moveToFolder(image.id, folder.id)}
                              disabled={image.folder_id === folder.id}
                            >
                              <Folder className="h-4 w-4 mr-2" style={{ color: folder.color }} />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                          {folders.length === 0 && (
                            <DropdownMenuItem disabled>
                              Nenhuma pasta criada
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {onEditImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditImage(image.image_url)}
                          className="gap-2"
                        >
                          <PenTool className="h-4 w-4" />
                          Editar
                        </Button>
                      )}

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
