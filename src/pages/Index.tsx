import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppNav } from "@/components/layout/AppNav";
import { BrandConfigPanel } from "@/components/brand/BrandConfigPanel";
import { ImageGenerator } from "@/components/generator/ImageGenerator";
import { ImageGallery } from "@/components/gallery/ImageGallery";

const Index = () => {
  const [activeTab, setActiveTab] = useState("brand");

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
              <ImageGenerator />
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
              <ImageGallery />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;