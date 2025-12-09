import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FormatOption {
  id: string;
  label: string;
  width: number;
  height: number;
  category: string;
}

export const formatOptions: FormatOption[] = [
  { id: "feed-square", label: "Feed Quadrado", width: 1080, height: 1080, category: "Feed" },
  { id: "feed-portrait", label: "Feed Retrato", width: 1080, height: 1350, category: "Feed" },
  { id: "feed-landscape", label: "Feed Paisagem", width: 1080, height: 566, category: "Feed" },
  { id: "stories", label: "Stories/Reels", width: 1080, height: 1920, category: "Stories" },
  { id: "thumbnail", label: "Thumbnail YouTube", width: 1280, height: 720, category: "YouTube" },
  { id: "meta-square", label: "Meta Ad Quadrado", width: 1080, height: 1080, category: "Ads" },
  { id: "meta-landscape", label: "Meta Ad Paisagem", width: 1200, height: 628, category: "Ads" },
  { id: "meta-vertical", label: "Meta Ad Vertical", width: 1080, height: 1350, category: "Ads" },
];

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (formatId: string) => void;
}

export function FormatSelector({ selectedFormat, onFormatChange }: FormatSelectorProps) {
  const selectedOption = formatOptions.find(f => f.id === selectedFormat);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedFormat} onValueChange={onFormatChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o formato" />
        </SelectTrigger>
        <SelectContent>
          {formatOptions.map((format) => (
            <SelectItem key={format.id} value={format.id}>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{format.category}</span>
                <span>{format.label}</span>
                <span className="text-xs text-muted-foreground">
                  {format.width}x{format.height}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedOption && (
        <span className="text-xs text-muted-foreground">
          {selectedOption.width} × {selectedOption.height}px
        </span>
      )}
    </div>
  );
}
