import { useState, useCallback } from "react";
import { useBancadaReset } from "./hooks/useBancadaReset.js";
import { TabNav } from "./components/TabNav.js";
import type { TabDefinition } from "./components/TabNav.js";
import { IdentidadeTab } from "./components/tabs/IdentidadeTab.js";
import { RedeTab } from "./components/tabs/RedeTab.js";
import { SyncTab } from "./components/tabs/SyncTab.js";
import { AuthTab } from "./components/tabs/AuthTab.js";
import { DadosTab } from "./components/tabs/DadosTab.js";
import { CenariosTab } from "./components/tabs/CenariosTab.js";
import "./index.css";

type TabId = "identidade" | "rede" | "sync" | "auth" | "dados" | "cenarios";

const TABS: TabDefinition[] = [
  { id: "identidade", label: "Identidade" },
  { id: "rede", label: "Rede" },
  { id: "sync", label: "Sync" },
  { id: "auth", label: "Auth" },
  { id: "dados", label: "Dados" },
  { id: "cenarios", label: "Cenários" },
];

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  identidade: IdentidadeTab,
  rede: RedeTab,
  sync: SyncTab,
  auth: AuthTab,
  dados: DadosTab,
  cenarios: CenariosTab,
};

export const VERSION = "0.0.1";

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("identidade");
  const { isResetting, reset } = useBancadaReset();

  const handleTabChange = useCallback((id: TabId) => {
    setActiveTab(id);
  }, []);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="bancada-shell">
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="bancada-content">
        <div className="bancada-header">
          <h1>{TABS.find((t) => t.id === activeTab)?.label}</h1>
          <button
            type="button"
            className="bancada-reset-btn"
            onClick={() => {
              void reset();
            }}
            disabled={isResetting}
          >
            {isResetting ? "Resetando..." : "Reset deste peer"}
          </button>
        </div>
        <ActiveComponent />
      </main>
    </div>
  );
}
