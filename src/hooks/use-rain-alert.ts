import { useEffect, useState } from "react";

export function useRainAlert() {
  const [isRaining, setIsRaining] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("guarita:isRaining");
      if (raw !== null) setIsRaining(raw === "true");
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleRainAlert = (value?: boolean) => {
    const next = typeof value === "boolean" ? value : !isRaining;
    setIsRaining(next);
    try {
      localStorage.setItem("guarita:isRaining", next ? "true" : "false");
    } catch (e) {
      // ignore
    }
  };

  return { isRaining, toggleRainAlert } as const;
}
