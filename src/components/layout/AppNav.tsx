import { Palette, Sparkles, Grid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "brand", label: "Marca", icon: Palette },
  { id: "generator", label: "Gerar", icon: Sparkles },
  { id: "gallery", label: "Galeria", icon: Grid },
];

export function AppNav({ activeTab, onTabChange }: AppNavProps) {
  return (
    <nav className="sticky top-16 z-40 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}