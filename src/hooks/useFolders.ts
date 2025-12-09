import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Erro ao carregar pastas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (name: string, color: string = "#6366f1") => {
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({ name, color })
        .select()
        .single();

      if (error) throw error;
      
      setFolders((prev) => [...prev, data]);
      toast.success("Pasta criada!");
      return data;
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Erro ao criar pasta");
      throw error;
    }
  }, []);

  const updateFolder = useCallback(async (id: string, updates: { name?: string; color?: string }) => {
    try {
      const { error } = await supabase
        .from("folders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === id ? { ...folder, ...updates } : folder
        )
      );

      toast.success("Pasta atualizada!");
    } catch (error) {
      console.error("Error updating folder:", error);
      toast.error("Erro ao atualizar pasta");
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      toast.success("Pasta excluída!");
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Erro ao excluir pasta");
    }
  }, []);

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders,
  };
}
