import { useState, useCallback, useEffect } from "react";
import { resetLocalState } from "@plataforma/client-sdk";

export function useBancadaReset(): {
  isResetting: boolean;
  reset: () => Promise<void>;
} {
  const [isResetting, setIsResetting] = useState(false);

  const reset = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetLocalState();
    } finally {
      setIsResetting(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__bancada = { reset };
    }
  }, [reset]);

  return { isResetting, reset };
}
