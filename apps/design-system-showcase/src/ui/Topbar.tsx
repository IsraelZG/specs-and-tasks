type Theme = 'light' | 'dark' | 'custom';
type Density = 'compact' | 'cozy' | 'tv';

interface TopbarProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  density: Density;
  setDensity: (d: Density) => void;
  radius: 'sharp' | 'soft' | 'round';
  setRadius: (r: 'sharp' | 'soft' | 'round') => void;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (o: boolean) => void;
  customThemeActive: boolean;
}

export default function Topbar({
  theme,
  setTheme,
  density,
  setDensity,
  radius,
  setRadius,
  isCustomizerOpen,
  setIsCustomizerOpen,
  customThemeActive,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b ds-glass relative">
      {/* Aurora accent line */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-[image:var(--ds-theme-gradient-aurora-soft)]"
      />

      <div className="flex items-center justify-between h-full px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-bold)] tracking-[var(--ds-font-letter-spacing-tight)] text-[color:var(--ds-theme-content-strong)] select-none">
            ◆ Design System
          </span>
          <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] px-2 py-0.5 rounded-[var(--ds-radius-pill)] bg-[var(--ds-theme-intent-accent-subtle)] text-[color:var(--ds-theme-intent-accent-on-subtle)]">
            Showcase
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <ToggleGroup
            label="Theme"
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              ...(customThemeActive ? [{ value: 'custom', label: 'Custom' }] : []),
            ]}
            value={theme}
            onChange={v => setTheme(v as Theme)}
          />
          <ToggleGroup
            label="Density"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'cozy', label: 'Cozy' },
              { value: 'tv', label: 'TV' },
            ]}
            value={density}
            onChange={v => setDensity(v as Density)}
          />
          <ToggleGroup
            label="Radius"
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'soft', label: 'Soft' },
              { value: 'round', label: 'Round' },
            ]}
            value={radius}
            onChange={v => setRadius(v as any)}
          />

          <button
            onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ds-radius-pill)] border text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              isCustomizerOpen || customThemeActive
                ? 'bg-[var(--ds-theme-intent-accent-fill)] text-[color:var(--ds-theme-intent-accent-on-fill)] border-[color:var(--ds-theme-intent-accent-border)]'
                : 'bg-[var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-default)] border-[color:var(--ds-theme-border-subtle)] hover:bg-[var(--ds-theme-surface-subdued)]'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {customThemeActive ? 'Customizado' : 'Customizar'}
          </button>
        </div>
      </div>
    </header>
  );
}

interface ToggleGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

function ToggleGroup({ label, options, value, onChange }: ToggleGroupProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-subtle)] select-none">
        {label}
      </span>
      <div className="flex p-1 rounded-[var(--ds-radius-pill)] border bg-[var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] border-[color:var(--ds-theme-border-subtle)]">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              'rounded-[var(--ds-radius-pill)] px-3 py-1 text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] transition-colors duration-[150ms] cursor-pointer',
              value === opt.value
                ? 'bg-[var(--ds-theme-intent-primary-fill)] text-[color:var(--ds-theme-intent-primary-on-fill)]'
                : 'text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-default)]',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
