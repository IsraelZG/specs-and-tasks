import React, { useState, useRef } from 'react';
import { defaultLightTheme, defaultDarkTheme, type ThemeJSON } from '@plataforma/design-system';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalColor = {} as any;

// Preset Theme definition
interface ThemePreset {
  name: string;
  scheme: 'light' | 'dark';
  theme: Record<string, any>;
}

const PRESETS: ThemePreset[] = [
  {
    name: 'VSCode Dark Modern',
    scheme: 'dark',
    theme: {
      surface: {
        canvas: { value: '#1e1e1e', type: 'color' },
        subdued: { value: '#252526', type: 'color' },
        default: { value: '#1e1e1e', type: 'color' },
        raised: { value: '#2d2d2d', type: 'color' },
        overlay: { value: '#252526', type: 'color' },
        floating: { value: '#3c3c3c', type: 'color' },
        inverse: { value: '#ffffff', type: 'color' },
        glassTint: { value: 'rgba(30, 30, 30, 0.7)', type: 'color' },
        glassBorder: { value: 'rgba(255, 255, 255, 0.1)', type: 'color' },
        scrim: { value: 'rgba(0, 0, 0, 0.6)', type: 'color' },
      },
      content: {
        strong: { value: '#f5f5f5', type: 'color' },
        default: { value: '#cccccc', type: 'color' },
        muted: { value: '#858585', type: 'color' },
        subtle: { value: '#6a6a6a', type: 'color' },
        disabled: { value: '#555555', type: 'color' },
        onInverse: { value: '#1e1e1e', type: 'color' },
        onAccent: { value: '#ffffff', type: 'color' },
        link: { value: '#3794ef', type: 'color' },
        linkHover: { value: '#2483d4', type: 'color' },
      },
      border: {
        subtle: { value: '#2d2d2d', type: 'color' },
        default: { value: '#3c3c3c', type: 'color' },
        strong: { value: '#6a6a6a', type: 'color' },
        focus: { value: '#007acc', type: 'color' },
        inverse: { value: '#ffffff', type: 'color' },
      },
      intent: {
        primary: {
          fill: { value: '#007acc', type: 'color' },
          fillHover: { value: '#0062a3', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#264f78', type: 'color' },
          onSubtle: { value: '#ffffff', type: 'color' },
          border: { value: '#007acc', type: 'color' },
          strong: { value: '#3794ef', type: 'color' },
        },
        accent: {
          fill: { value: '#007acc', type: 'color' },
          fillHover: { value: '#0062a3', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#264f78', type: 'color' },
          onSubtle: { value: '#ffffff', type: 'color' },
          border: { value: '#007acc', type: 'color' },
          strong: { value: '#3794ef', type: 'color' },
        },
      },
    },
  },
  {
    name: 'Emerald Coast (Light)',
    scheme: 'light',
    theme: {
      surface: {
        canvas: { value: '#f4f9f6', type: 'color' },
        subdued: { value: '#ebf4ef', type: 'color' },
        default: { value: '#ffffff', type: 'color' },
        raised: { value: '#ffffff', type: 'color' },
        overlay: { value: '#ffffff', type: 'color' },
        floating: { value: '#ffffff', type: 'color' },
        inverse: { value: '#112217', type: 'color' },
        glassTint: { value: 'rgba(244, 249, 246, 0.7)', type: 'color' },
        glassBorder: { value: 'rgba(4, 120, 87, 0.1)', type: 'color' },
        scrim: { value: 'rgba(17, 34, 23, 0.4)', type: 'color' },
      },
      content: {
        strong: { value: '#112217', type: 'color' },
        default: { value: '#1e3828', type: 'color' },
        muted: { value: '#44634f', type: 'color' },
        subtle: { value: '#6b8b76', type: 'color' },
        disabled: { value: '#a3c2ad', type: 'color' },
        onInverse: { value: '#ffffff', type: 'color' },
        onAccent: { value: '#ffffff', type: 'color' },
        link: { value: '#059669', type: 'color' },
        linkHover: { value: '#047857', type: 'color' },
      },
      border: {
        subtle: { value: '#e2ede6', type: 'color' },
        default: { value: '#d1e2d7', type: 'color' },
        strong: { value: '#6b8b76', type: 'color' },
        focus: { value: '#10b981', type: 'color' },
        inverse: { value: '#112217', type: 'color' },
      },
      intent: {
        primary: {
          fill: { value: '#047857', type: 'color' },
          fillHover: { value: '#065f46', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#d1fae5', type: 'color' },
          onSubtle: { value: '#065f46', type: 'color' },
          border: { value: '#047857', type: 'color' },
          strong: { value: '#047857', type: 'color' },
        },
        accent: {
          fill: { value: '#10b981', type: 'color' },
          fillHover: { value: '#059669', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#d1fae5', type: 'color' },
          onSubtle: { value: '#065f46', type: 'color' },
          border: { value: '#10b981', type: 'color' },
          strong: { value: '#059669', type: 'color' },
        },
      },
    },
  },
  {
    name: 'Midnight Purple',
    scheme: 'dark',
    theme: {
      surface: {
        canvas: { value: '#0f081d', type: 'color' },
        subdued: { value: '#160d2b', type: 'color' },
        default: { value: '#120a24', type: 'color' },
        raised: { value: '#1b1136', type: 'color' },
        overlay: { value: '#160d2b', type: 'color' },
        floating: { value: '#221644', type: 'color' },
        inverse: { value: '#f3e8ff', type: 'color' },
        glassTint: { value: 'rgba(15, 8, 29, 0.75)', type: 'color' },
        glassBorder: { value: 'rgba(168, 85, 247, 0.25)', type: 'color' },
        scrim: { value: 'rgba(15, 8, 29, 0.7)', type: 'color' },
      },
      content: {
        strong: { value: '#f3e8ff', type: 'color' },
        default: { value: '#d8b4fe', type: 'color' },
        muted: { value: '#a855f7', type: 'color' },
        subtle: { value: '#7c3aed', type: 'color' },
        disabled: { value: '#4c1d95', type: 'color' },
        onInverse: { value: '#0f081d', type: 'color' },
        onAccent: { value: '#ffffff', type: 'color' },
        link: { value: '#c084fc', type: 'color' },
        linkHover: { value: '#a855f7', type: 'color' },
      },
      border: {
        subtle: { value: '#2c1654', type: 'color' },
        default: { value: '#3b1f6e', type: 'color' },
        strong: { value: '#7c3aed', type: 'color' },
        focus: { value: '#a855f7', type: 'color' },
        inverse: { value: '#f3e8ff', type: 'color' },
      },
      intent: {
        primary: {
          fill: { value: '#a855f7', type: 'color' },
          fillHover: { value: '#9333ea', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#3b1f6e', type: 'color' },
          onSubtle: { value: '#d8b4fe', type: 'color' },
          border: { value: '#a855f7', type: 'color' },
          strong: { value: '#c084fc', type: 'color' },
        },
        accent: {
          fill: { value: '#c084fc', type: 'color' },
          fillHover: { value: '#a855f7', type: 'color' },
          onFill: { value: '#0f081d', type: 'color' },
          subtle: { value: '#3b1f6e', type: 'color' },
          onSubtle: { value: '#d8b4fe', type: 'color' },
          border: { value: '#c084fc', type: 'color' },
          strong: { value: '#a855f7', type: 'color' },
        },
      },
    },
  },
  {
    name: 'Crimson Cyberpunk',
    scheme: 'dark',
    theme: {
      surface: {
        canvas: { value: '#0b090a', type: 'color' },
        subdued: { value: '#161a1d', type: 'color' },
        default: { value: '#0b090a', type: 'color' },
        raised: { value: '#161a1d', type: 'color' },
        overlay: { value: '#161a1d', type: 'color' },
        floating: { value: '#240003', type: 'color' },
        inverse: { value: '#ffffff', type: 'color' },
        glassTint: { value: 'rgba(11, 9, 10, 0.8)', type: 'color' },
        glassBorder: { value: 'rgba(229, 56, 59, 0.3)', type: 'color' },
        scrim: { value: 'rgba(0, 0, 0, 0.8)', type: 'color' },
      },
      content: {
        strong: { value: '#f5f3f4', type: 'color' },
        default: { value: '#e5383b', type: 'color' },
        muted: { value: '#b1a7a6', type: 'color' },
        subtle: { value: '#660708', type: 'color' },
        disabled: { value: '#370607', type: 'color' },
        onInverse: { value: '#0b090a', type: 'color' },
        onAccent: { value: '#ffffff', type: 'color' },
        link: { value: '#f5f3f4', type: 'color' },
        linkHover: { value: '#e5383b', type: 'color' },
      },
      border: {
        subtle: { value: '#660708', type: 'color' },
        default: { value: '#ba181b', type: 'color' },
        strong: { value: '#e5383b', type: 'color' },
        focus: { value: '#ffb3c1', type: 'color' },
        inverse: { value: '#f5f3f4', type: 'color' },
      },
      intent: {
        primary: {
          fill: { value: '#e5383b', type: 'color' },
          fillHover: { value: '#ba181b', type: 'color' },
          onFill: { value: '#ffffff', type: 'color' },
          subtle: { value: '#660708', type: 'color' },
          onSubtle: { value: '#ffb3c1', type: 'color' },
          border: { value: '#e5383b', type: 'color' },
          strong: { value: '#f5f3f4', type: 'color' },
        },
        accent: {
          fill: { value: '#f5f3f4', type: 'color' },
          fillHover: { value: '#e5383b', type: 'color' },
          onFill: { value: '#0b090a', type: 'color' },
          subtle: { value: '#161a1d', type: 'color' },
          onSubtle: { value: '#e5383b', type: 'color' },
          border: { value: '#f5f3f4', type: 'color' },
          strong: { value: '#e5383b', type: 'color' },
        },
      },
    },
  },
];

function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object') {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  customTheme: ThemeJSON | null;
  setCustomTheme: (theme: ThemeJSON | null) => void;
}

export default function ThemeEditor({
  isOpen,
  onClose,
  customTheme,
  setCustomTheme,
}: ThemeEditorProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'presets'>('colors');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    surface: false,
    content: true,
    border: true,
    primaryIntent: true,
    accentIntent: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback helper to resolve design tokens referencing global variables e.g. {color.neutral.50.value}
  const resolveTokenValueToColor = (val: string): string => {
    let resolved = String(val);
    const regex = /\{color\.([^}]+)\.value\}/;
    const match = resolved.match(regex);
    if (match) {
      const path = match[1].split('.'); // e.g. ["neutral", "50"]
      let current = globalColor.color as any;
      for (const part of path) {
        if (current && part in current) {
          current = current[part];
        } else {
          return '#cccccc';
        }
      }
      return current?.value || '#cccccc';
    }
    return resolved;
  };

  const getThemeToEdit = (): ThemeJSON => {
    if (customTheme) return customTheme;
    // Fallback to light theme if null
    return JSON.parse(JSON.stringify(defaultLightTheme)) as ThemeJSON;
  };

  const currentEditableTheme = getThemeToEdit();

  const handleUpdateValue = (section: string, key: string, newValue: string, subkey?: string) => {
    const updatedTheme = JSON.parse(JSON.stringify(currentEditableTheme)) as ThemeJSON;
    
    if (subkey && updatedTheme.theme[section] && updatedTheme.theme[section][key]) {
      updatedTheme.theme[section][key][subkey].value = newValue;
    } else if (updatedTheme.theme[section] && updatedTheme.theme[section][key]) {
      updatedTheme.theme[section][key].value = newValue;
    }
    
    setCustomTheme(updatedTheme);
  };

  const toggleSection = (sec: string) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    const baseTheme = preset.scheme === 'dark' ? defaultDarkTheme : defaultLightTheme;
    const mergedTheme = mergeDeep(JSON.parse(JSON.stringify(baseTheme.theme)), preset.theme);
    
    const newTheme: ThemeJSON = {
      theme: {
        ...mergedTheme,
        name: { value: preset.name, type: 'other' },
        scheme: { value: preset.scheme, type: 'other' },
      },
    };
    setCustomTheme(newTheme);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentEditableTheme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    // @ts-expect-error TokenNode may be string
    downloadAnchor.setAttribute('download', `theme-${currentEditableTheme.theme.name.value.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.theme) {
          const scheme = parsed.theme.scheme?.value === 'dark' ? 'dark' : 'light';
          const baseTheme = scheme === 'dark' ? defaultDarkTheme : defaultLightTheme;
          const mergedTheme = mergeDeep(JSON.parse(JSON.stringify(baseTheme.theme)), parsed.theme);
          
          const newTheme: ThemeJSON = {
            theme: {
              ...mergedTheme,
              name: parsed.theme.name || { value: 'Importado', type: 'other' },
              scheme: parsed.theme.scheme || { value: scheme, type: 'other' },
            }
          };
          setCustomTheme(newTheme);
        } else {
          alert('Formato de arquivo JSON inválido. Certifique-se de que contenha um nó "theme".');
        }
      } catch (err) {
        alert('Falha ao ler o arquivo JSON de tema.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetTheme = () => {
    setCustomTheme(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-16 right-0 bottom-0 w-[380px] ds-glass border-l border-[color:var(--ds-theme-border-subtle)] flex flex-col z-40 transition-transform duration-300 shadow-2xl overflow-hidden`}
    >
      {/* Header */}
      <div className="p-5 border-b border-[color:var(--ds-theme-border-subtle)] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--ds-theme-content-strong)]">
            Customizador de Temas
          </h2>
          <p className="text-xs text-[color:var(--ds-theme-content-subtle)] mt-1">
            Crie e teste temas white-label on-the-fly
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-strong)] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)] p-1 gap-1">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'colors'
              ? 'bg-[color:var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-strong)] shadow-sm'
              : 'text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-strong)]'
          }`}
        >
          Tokens CSS
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-[color:var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-strong)] shadow-sm'
              : 'text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-strong)]'
          }`}
        >
          Presets (Loja)
        </button>
      </div>

      {/* Scrollable Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'presets' ? (
          <div className="space-y-3">
            <div className="text-xs text-[color:var(--ds-theme-content-subtle)] mb-2">
              Selecione um preset para carregar um estilo white-label completo:
            </div>
            {PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleApplyPreset(preset)}
                className="w-full text-left p-4 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] hover:border-[color:var(--ds-theme-border-strong)] hover:shadow-md transition-all group flex justify-between items-center cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-sm text-[color:var(--ds-theme-content-strong)]">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-[color:var(--ds-theme-content-subtle)] mt-1 flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full border ${preset.scheme === 'dark' ? 'bg-zinc-800' : 'bg-white'}`} />
                    Aparência {preset.scheme === 'dark' ? 'Escura' : 'Clara'}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.theme.surface.canvas.value }} />
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.theme.intent.primary.fill.value }} />
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.theme.border.default.value }} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Surfaces */}
            <CollapsibleSection
              title="Superfícies (Surfaces)"
              isOpen={!collapsedSections.surface}
              onToggle={() => toggleSection('surface')}
            >
              <div className="space-y-3 pt-2">
                {Object.keys(currentEditableTheme.theme.surface || {}).map(key => {
                  const token = currentEditableTheme.theme.surface[key];
                  if (token.type !== 'color') return null;
                  return (
                    <ColorInputRow
                      key={key}
                      label={key}
                      value={token.value}
                      resolvedColor={resolveTokenValueToColor(token.value)}
                      onChange={val => handleUpdateValue('surface', key, val)}
                    />
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Content */}
            <CollapsibleSection
              title="Textos e Ícones (Content)"
              isOpen={!collapsedSections.content}
              onToggle={() => toggleSection('content')}
            >
              <div className="space-y-3 pt-2">
                {Object.keys(currentEditableTheme.theme.content || {}).map(key => {
                  const token = currentEditableTheme.theme.content[key];
                  if (token.type !== 'color') return null;
                  return (
                    <ColorInputRow
                      key={key}
                      label={key}
                      value={token.value}
                      resolvedColor={resolveTokenValueToColor(token.value)}
                      onChange={val => handleUpdateValue('content', key, val)}
                    />
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Borders */}
            <CollapsibleSection
              title="Bordas (Borders)"
              isOpen={!collapsedSections.border}
              onToggle={() => toggleSection('border')}
            >
              <div className="space-y-3 pt-2">
                {Object.keys(currentEditableTheme.theme.border || {}).map(key => {
                  const token = currentEditableTheme.theme.border[key];
                  if (token.type !== 'color') return null;
                  return (
                    <ColorInputRow
                      key={key}
                      label={key}
                      value={token.value}
                      resolvedColor={resolveTokenValueToColor(token.value)}
                      onChange={val => handleUpdateValue('border', key, val)}
                    />
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Primary Intent */}
            <CollapsibleSection
              title="Intenção Primária"
              isOpen={!collapsedSections.primaryIntent}
              onToggle={() => toggleSection('primaryIntent')}
            >
              <div className="space-y-3 pt-2">
                {(currentEditableTheme.theme.intent as any)?.primary &&
                  Object.keys((currentEditableTheme.theme.intent as any).primary).map(key => {
                    const token = (currentEditableTheme.theme.intent as any).primary[key];
                    if (token.type !== 'color') return null;
                    return (
                      <ColorInputRow
                        key={key}
                        label={`primary.${key}`}
                        value={token.value}
                        resolvedColor={resolveTokenValueToColor(token.value)}
                        onChange={val => handleUpdateValue('intent', 'primary', val, key)}
                      />
                    );
                  })}
              </div>
            </CollapsibleSection>

            {/* Accent Intent */}
            <CollapsibleSection
              title="Intenção Accent"
              isOpen={!collapsedSections.accentIntent}
              onToggle={() => toggleSection('accentIntent')}
            >
              <div className="space-y-3 pt-2">
                {(currentEditableTheme.theme.intent as any)?.accent &&
                  Object.keys((currentEditableTheme.theme.intent as any).accent).map(key => {
                    const token = (currentEditableTheme.theme.intent as any).accent[key];
                    if (token.type !== 'color') return null;
                    return (
                      <ColorInputRow
                        key={key}
                        label={`accent.${key}`}
                        value={token.value}
                        resolvedColor={resolveTokenValueToColor(token.value)}
                        onChange={val => handleUpdateValue('intent', 'accent', val, key)}
                      />
                    );
                  })}
              </div>
            </CollapsibleSection>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)] space-y-2">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[color:var(--ds-theme-border-default)] bg-[color:var(--ds-theme-surface-default)] hover:bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] transition-colors cursor-pointer"
          >
            Importar JSON
          </button>
          <button
            onClick={handleExportJSON}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[color:var(--ds-theme-border-default)] bg-[color:var(--ds-theme-surface-default)] hover:bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] transition-colors cursor-pointer"
          >
            Exportar JSON
          </button>
        </div>

        {customTheme && (
          <button
            onClick={handleResetTheme}
            className="w-full py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
          >
            Limpar Customizações e Resetar
          </button>
        )}
      </div>
    </div>
  );
}

// Subcomponents helper
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border border-[color:var(--ds-theme-border-subtle)] rounded-xl bg-[color:var(--ds-theme-surface-default)] overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-[color:var(--ds-theme-content-strong)] hover:bg-[color:var(--ds-theme-surface-subdued)] transition-colors text-left cursor-pointer"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-[color:var(--ds-theme-border-subtle)]">{children}</div>}
    </div>
  );
}

interface ColorInputRowProps {
  label: string;
  value: string;
  resolvedColor: string;
  onChange: (val: string) => void;
}

function ColorInputRow({ label, value, resolvedColor, onChange }: ColorInputRowProps) {
  const isReference = value.startsWith('{');

  return (
    <div className="flex items-center justify-between text-xs gap-3">
      <span className="font-mono text-[10px] text-[color:var(--ds-theme-content-muted)] select-none truncate flex-1" title={label}>
        {label}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-black/10 overflow-hidden cursor-pointer">
          <input
            type="color"
            value={resolvedColor}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <div className="w-full h-full border border-black/10 rounded-full" style={{ backgroundColor: resolvedColor }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`px-2 py-1 rounded border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] text-[10px] font-mono text-[color:var(--ds-theme-content-default)] w-24 h-7 outline-none focus:border-[color:var(--ds-theme-border-strong)] ${
            isReference ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''
          }`}
          title={isReference ? `Referência: ${value}` : value}
        />
      </div>
    </div>
  );
}
