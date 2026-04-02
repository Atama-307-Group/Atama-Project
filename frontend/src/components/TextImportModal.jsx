import React, { useState, useRef, useEffect } from 'react';
import './TextImportModal.css';

const DELIMITERS = [
  { label: 'Tab', value: '\t', example: 'term[TAB]definition' },
  { label: 'Comma', value: ',', example: 'term,definition' },
  { label: 'Colon', value: ':', example: 'term:definition' },
  { label: 'Semicolon', value: ';', example: 'term;definition' },
  { label: 'Pipe', value: '|', example: 'term|definition' },
  { label: 'Arrow (->)', value: '->', example: 'term->definition' },
  { label: 'Dash ( - )', value: ' - ', example: 'term - definition' },
];

const parseCards = (text, delimiter) => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) throw new Error('No lines found.');

  const cards = [];
  for (const line of lines) {
    const idx = line.indexOf(delimiter);
    if (idx === -1) throw new Error(`Line has no delimiter: "${line}"`);
    const term = line.slice(0, idx).trim();
    const definition = line.slice(idx + delimiter.length).trim();
    if (!term || !definition) throw new Error(`Empty term or definition: "${line}"`);
    cards.push({ type: 'NORMAL', term, definition });
  }

  if (cards.length === 0) throw new Error('No valid cards parsed.');
  return cards;
};

const TextImportModal = ({ onClose, onImport }) => {
  const [text, setText] = useState('');
  const [delimiter, setDelimiter] = useState('');
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const overlayRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleParse = () => {
    setError(null);
    setPreview(null);

    if (!delimiter) {
      setError('Please select a delimiter before parsing.');
      return;
    }
    if (!text.trim()) {
      setError('Please paste some text first.');
      return;
    }

    try {
      const cards = parseCards(text, delimiter);
      setPreview(cards);
    } catch (err) {
      setError('Parsing failed! Please try again. (' + err.message + ')');
    }
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) return;
    onImport(preview);
    onClose();
  };

  const selectedDelimiterLabel = DELIMITERS.find((d) => d.value === delimiter)?.label ?? null;

  return (
    <div className="tim-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="tim-modal" role="dialog" aria-modal="true" aria-label="Import flashcards from text">

        <div className="tim-header">
          <div className="tim-header-icon">⬆</div>
          <div>
            <h2 className="tim-title">Import from Text</h2>
            <p className="tim-subtitle">Paste your cards below and choose how they're separated</p>
          </div>
          <button className="tim-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step 1 — Paste */}
        <div className="tim-section">
          <label className="tim-label">
            <span className="tim-step">1</span> Paste your text
          </label>
          <textarea
            ref={textareaRef}
            className="tim-textarea"
            placeholder={"front side,back side\nhello,a greeting\napple,a red fruit"}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); setPreview(null); }}
            rows={7}
            spellCheck={false}
          />
        </div>

        {/* Step 2 — Delimiter */}
        <div className="tim-section">
          <label className="tim-label">
            <span className="tim-step">2</span> Choose a delimiter <span className="tim-required">*required</span>
          </label>
          <div className="tim-delimiter-grid">
            {DELIMITERS.map((d) => (
              <button
                key={d.value}
                className={`tim-delim-btn${delimiter === d.value ? ' tim-delim-btn--active' : ''}`}
                onClick={() => { setDelimiter(d.value); setError(null); setPreview(null); }}
              >
                <span className="tim-delim-name">{d.label}</span>
                <span className="tim-delim-example">{d.example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="tim-error" role="alert">
            <span className="tim-error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="tim-preview">
            <div className="tim-preview-header">
              <span className="tim-preview-label">Preview</span>
              <span className="tim-preview-count">{preview.length} card{preview.length !== 1 ? 's' : ''} found</span>
            </div>
            <div className="tim-preview-list">
              {preview.slice(0, 5).map((card, i) => (
                <div className="tim-preview-row" key={i}>
                  <span className="tim-preview-term">{card.term}</span>
                  <span className="tim-preview-arrow">→</span>
                  <span className="tim-preview-def">{card.definition}</span>
                </div>
              ))}
              {preview.length > 5 && (
                <div className="tim-preview-more">+{preview.length - 5} more cards…</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="tim-actions">
          <button className="tim-btn tim-btn--ghost" onClick={onClose}>Cancel</button>
          {!preview ? (
            <button className="tim-btn tim-btn--parse" onClick={handleParse}>
              Parse Cards
            </button>
          ) : (
            <button className="tim-btn tim-btn--import" onClick={handleImport}>
              Import {preview.length} Card{preview.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TextImportModal;