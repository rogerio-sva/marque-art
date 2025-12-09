import { useState, useEffect, useCallback } from "react";
import { BrandConfig, getBrandConfig, saveBrandConfig, resetBrandConfig } from "@/lib/brand-store";

export function useBrandConfig() {
  const [config, setConfig] = useState<BrandConfig>(getBrandConfig);

  useEffect(() => {
    setConfig(getBrandConfig());
  }, []);

  const updateConfig = useCallback((updates: Partial<BrandConfig>) => {
    const updated = saveBrandConfig(updates);
    setConfig(updated);
    return updated;
  }, []);

  const reset = useCallback(() => {
    const defaultConfig = resetBrandConfig();
    setConfig(defaultConfig);
    return defaultConfig;
  }, []);

  return {
    config,
    updateConfig,
    reset,
  };
}