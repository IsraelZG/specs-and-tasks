import { useBancadaReset } from "./hooks/useBancadaReset.js";

export const VERSION = "0.0.1";

export function App() {
  const { isResetting, reset } = useBancadaReset();

  return (
    <div>
      <button type="button" onClick={() => { void reset(); }} disabled={isResetting}>
        {isResetting ? "Resetando..." : "Reset deste peer"}
      </button>
    </div>
  );
}
