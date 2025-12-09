import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedImage {
  id: string;
  prompt: string;
  style: string | null;
  image_url: string;
  is_favorite: boolean;
  created_at: string;
}

export function useGeneratedImages() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("generated_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Erro ao carregar imagens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const saveImage = useCallback(async (prompt: string, style: string | null, imageUrl: string) => {
    try {
      const { data, error } = await supabase
        .from("generated_images")
        .insert({
          prompt,
          style,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      
      setImages((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Erro ao salvar imagem");
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    try {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_favorite: !image.is_favorite })
        .eq("id", id);

      if (error) throw error;

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, is_favorite: !img.is_favorite } : img
        )
      );

      toast.success(image.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao atualizar favorito");
    }
  }, [images]);

  const deleteImage = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_images")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Imagem excluída");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erro ao excluir imagem");
    }
  }, []);

  return {
    images,
    isLoading,
    saveImage,
    toggleFavorite,
    deleteImage,
    refetch: fetchImages,
  };
}