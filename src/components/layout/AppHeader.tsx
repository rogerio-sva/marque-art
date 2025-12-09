import { Palette } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Palette className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              Brand Studio
            </h1>
            <p className="text-xs text-muted-foreground">
              Crie conteúdo visual para sua marca
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}