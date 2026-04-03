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

const SimulatedProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const increment = Math.max(0.5, (95 - prev) * 0.08);
        return prev + increment;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tim-progress-bar-container">
      <div className="tim-progress-bar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
};

const TextImportModal = ({ onClose, onImport, onFileUpload, isUploading, isUploadingPdf }) => {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'file'

  const [text, setText] = useState('');
  const [delimiter, setDelimiter] = useState('');
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const overlayRef = useRef(null);
  const textareaRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (activeTab === 'file' && file.name.toLowerCase().endsWith('.pdf')) {
        alert("Please use the '✨ Use AI' tab to upload PDF files.");
        return;
      }
      if (activeTab === 'ai' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert("Please upload a .pdf file for AI generation.");
        return;
      }
      onFileUpload(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (activeTab === 'file' && file.name.toLowerCase().endsWith('.pdf')) {
        alert("Please use the '✨ Use AI' tab to upload PDF files.");
        return;
      }
      if (activeTab === 'ai' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert("Please upload a .pdf file for AI generation.");
        return;
      }
      onFileUpload(file);
    }
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

        {/* Tabs */}
        <div className="tim-tabs">
          <button
            className={`tim-tab-btn ${activeTab === 'text' ? 'tim-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Paste Text
          </button>
          <button
            className={`tim-tab-btn ${activeTab === 'file' ? 'tim-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            Upload File
          </button>
          <button
            className={`tim-tab-btn ${activeTab === 'ai' ? 'tim-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ✨ Use AI
          </button>
        </div>

        {activeTab === 'text' && (
          <>
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
          </>
        )}

        {activeTab === 'file' && (
          <div className="tim-section">
            <div
              className={`tim-file-upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <p>Drag and drop a .csv or .txt file here to instantly create your set!</p>
              <p>Or</p>
              <input
                type="file"
                id="modal-file-upload"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="modal-file-upload" className="tim-file-upload-btn">
                Browse Files
              </label>
              {isUploading && (
                <p className="tim-upload-loading">Uploading and analyzing file...</p>
              )}
            </div>

            <div className="tim-actions" style={{ marginTop: '1rem' }}>
              <button className="tim-btn tim-btn--ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="tim-section">
            {!isUploading ? (
              <div
                className={`tim-file-upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <p>Drag and drop a .pdf file here!</p>
                <p className="tim-ai-hint" style={{ color: '#2d7d46', fontWeight: 600 }}>✨ Gemini AI will instantly generate flashcards for you.</p>
                <p>Or</p>
                <input
                  type="file"
                  id="modal-file-upload-ai"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="modal-file-upload-ai" className="tim-file-upload-btn">
                  Browse Files
                </label>
              </div>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d7d46', marginBottom: '15px' }}>
                  ✅ PDF Uploaded Successfully!
                </div>
                <p className="tim-upload-loading" style={{ marginTop: '10px' }}>
                  ✨ Generating your flashcards...
                </p>
                <SimulatedProgressBar />
              </div>
            )}

            <div className="tim-actions" style={{ marginTop: '1rem' }}>
              <button className="tim-btn tim-btn--ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TextImportModal;