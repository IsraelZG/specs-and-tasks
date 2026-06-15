import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Loader2, ArrowRight } from 'lucide-react';

interface PromptResult {
  originalLength: number;
  compressedLength: number;
  payload: string;
  keywords: string[];
}

export default function PromptBuilder() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleBuild = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    setCopied(false);
    
    try {
      const response = await fetch('http://localhost:3001/api/build-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.payload) {
      navigator.clipboard.writeText(result.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reductionPercent = result 
    ? Math.round((1 - (result.compressedLength / Math.max(1, result.originalLength))) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Sparkles size={28} color="var(--primary)" />
        <h1 className="page-title" style={{ margin: 0 }}>Prompt Builder</h1>
      </div>

      <div style={{
        backgroundColor: 'var(--panel-bg)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
          O que você precisa que a LLM faça? (Intenção)
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuild()}
            placeholder="Ex: Refatore a lógica de autenticação no painel web..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleBuild}
            disabled={isLoading || !query.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isLoading || !query.trim() ? 0.7 : 1
            }}
          >
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Gerar Contexto'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              backgroundColor: 'var(--panel-bg)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--accent)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginBottom: '0.25rem' }}>Payload Gerado</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Keywords: {result.keywords?.join(', ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {result.originalLength} ➔ {result.compressedLength} chars
                  </div>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                    {reductionPercent}% Redução (Headroom)
                  </div>
                </div>
                <button 
                  onClick={copyToClipboard}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: copied ? 'var(--accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Copy size={16} />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            <textarea 
              readOnly 
              value={result.payload}
              style={{
                width: '100%',
                height: '250px',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                resize: 'none',
                outline: 'none'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
