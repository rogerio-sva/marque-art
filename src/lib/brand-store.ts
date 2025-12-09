// Brand configuration store using localStorage for now (will migrate to DB later)

export interface BrandConfig {
  logo: string | null;
  colors: string[];
  titleFont: string;
  bodyFont: string;
}

const STORAGE_KEY = "brand-studio-config";

const defaultConfig: BrandConfig = {
  logo: null,
  colors: ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
  titleFont: "Plus Jakarta Sans",
  bodyFont: "DM Sans",
};

export function getBrandConfig(): BrandConfig {
  if (typeof window === "undefined") return defaultConfig;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading brand config:", error);
  }
  
  return defaultConfig;
}

export function saveBrandConfig(config: Partial<BrandConfig>): BrandConfig {
  const current = getBrandConfig();
  const updated = { ...current, ...config };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving brand config:", error);
  }
  
  return updated;
}

export function resetBrandConfig(): BrandConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting brand config:", error);
  }
  
  return defaultConfig;
}

export const availableFonts = [
  { name: "Plus Jakarta Sans", category: "display" },
  { name: "DM Sans", category: "body" },
  { name: "Inter", category: "both" },
  { name: "Poppins", category: "both" },
  { name: "Montserrat", category: "display" },
  { name: "Roboto", category: "body" },
  { name: "Open Sans", category: "body" },
  { name: "Lato", category: "both" },
  { name: "Playfair Display", category: "display" },
  { name: "Merriweather", category: "body" },
];