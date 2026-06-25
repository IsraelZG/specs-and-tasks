type TabId = "identidade" | "rede" | "sync" | "auth" | "dados" | "cenarios";

export interface TabDefinition {
  id: TabId;
  label: string;
}

interface TabNavProps {
  tabs: TabDefinition[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="bancada-sidebar">
      <div className="bancada-sidebar-title">Navegação</div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bancada-tab-btn${tab.id === activeTab ? " active" : ""}`}
          onClick={() => {
            onTabChange(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
