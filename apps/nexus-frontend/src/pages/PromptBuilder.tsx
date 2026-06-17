import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function PromptBuilder() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [compressed, setCompressed] = useState('');
  const [stats, setStats] = useState<{
    originalChars: number;
    compressedChars: number;
    ratio: number;
    engine: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCompress = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setCompressed('');
    setStats(null);
    setError('');
    setCopied(false);

    try {
      const result = await api.compressText(text);
      setCompressed(result.compressed);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comprimir');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (compressed) {
      navigator.clipboard.writeText(compressed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reductionPercent = stats
    ? Math.round((1 - stats.ratio) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Sparkles size={28} color="var(--primary)" />
        <h1 className="page-title" style={{ margin: 0 }}>Compressor de Contexto</h1>
      </div>

      <div style={{
        backgroundColor: 'var(--panel-bg)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <label htmlFor="compress-input" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
          Cole o texto que deseja comprimir
        </label>
        <textarea
          id="compress-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: descrições de skills, agentes, ou qualquer contexto longo..."
          style={{
            width: '100%',
            height: '180px',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: 'white',
            fontSize: '1rem',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'monospace',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            onClick={handleCompress}
            disabled={isLoading || !text.trim()}
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
              opacity: isLoading || !text.trim() ? 0.7 : 1,
            }}
          >
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Comprimir'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              backgroundColor: 'var(--panel-bg)',
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #ef4444',
              marginBottom: '2rem',
              color: '#fca5a5',
            }}
          >
            {error}
          </motion.div>
        )}

        {compressed && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              backgroundColor: 'var(--panel-bg)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--accent)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--accent)', marginBottom: '0.25rem' }}>Texto Comprimido</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Engine: {stats.engine}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {stats.originalChars.toLocaleString()} → {stats.compressedChars.toLocaleString()} chars
                  </div>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                    {reductionPercent}% redução
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
                    gap: '0.5rem',
                  }}
                >
                  <Copy size={16} />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={compressed}
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
                outline: 'none',
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
