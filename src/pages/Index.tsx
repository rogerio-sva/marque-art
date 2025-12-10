import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppNav } from "@/components/layout/AppNav";
import { BrandConfigPanel } from "@/components/brand/BrandConfigPanel";
import { ImageGenerator } from "@/components/generator/ImageGenerator";
import { CreativesBatchGenerator } from "@/components/generator/CreativesBatchGenerator";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { VisualEditor } from "@/components/editor/VisualEditor";

const Index = () => {
  const [activeTab, setActiveTab] = useState("brand");
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);

  const handleEditImage = (imageUrl: string) => {
    setEditorImage(imageUrl);
    setActiveTab("editor");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <AppNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container py-8">
        <div className="animate-fade-in">
          {activeTab === "brand" && (
            <div className="mx-auto max-w-3xl">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Configuração da Marca
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Defina a identidade visual da sua marca para manter consistência em todas as criações
                </p>
              </div>
              <BrandConfigPanel />
            </div>
          )}

          {activeTab === "generator" && (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Gerador de Imagens
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Use IA para criar backgrounds, elementos visuais e muito mais
                </p>
              </div>
              <ImageGenerator 
                onEditImage={handleEditImage} 
                lastGeneratedImage={lastGeneratedImage}
                onImageGenerated={setLastGeneratedImage}
              />
            </div>
          )}

          {activeTab === "creatives" && (
            <CreativesBatchGenerator onEditImage={handleEditImage} />
          )}

          {activeTab === "editor" && (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Editor Visual
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Edite suas imagens, adicione texto, formas e exporte em diversos formatos
                </p>
              </div>
              <VisualEditor initialImage={editorImage} />
            </div>
          )}

          {activeTab === "gallery" && (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Sua Galeria
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Todas as imagens que você gerou ficam salvas aqui
                </p>
              </div>
              <ImageGallery onEditImage={handleEditImage} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;