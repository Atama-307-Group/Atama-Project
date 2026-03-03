import React, { useState, useRef, useCallback } from 'react';
import './DragDropEditor.css';

/**
 * Drag & Drop flashcard editor.
 *
 * Card shape expected:
 *   { prompt, imageUrl, dropZones: [{ x, y, correctLabel }], draggableLabels: [string] }
 *
 * Props:
 *   card     – current card object
 *   onChange – (updatedCard) => void
 */
const DragDropEditor = ({ card, onChange }) => {
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const imgContainerRef = useRef(null);

  // ---- helpers ----
  const update = (patch) => onChange({ ...card, ...patch });

  // ---- image upload ----
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ imageUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const removeImage = () => update({ imageUrl: '', dropZones: [] });

  // ---- zone placement (click on image) ----
  const handleImageClick = useCallback(
    (e) => {
      if (mode !== 'edit') return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      update({
        dropZones: [...(card.dropZones || []), { x, y, correctLabel: '' }],
      });
    },
    [card, mode, onChange],
  );

  const updateZoneLabel = (zoneIndex, correctLabel) => {
    const zones = [...(card.dropZones || [])];
    zones[zoneIndex] = { ...zones[zoneIndex], correctLabel };
    update({ dropZones: zones });
  };

  const removeZone = (zoneIndex) => {
    update({ dropZones: (card.dropZones || []).filter((_, i) => i !== zoneIndex) });
  };

  // ---- draggable labels ----
  const updateLabel = (i, value) => {
    const labels = [...(card.draggableLabels || [])];
    labels[i] = value;
    update({ draggableLabels: labels });
  };

  const addLabel = () => update({ draggableLabels: [...(card.draggableLabels || []), ''] });

  const removeLabel = (i) => {
    update({ draggableLabels: (card.draggableLabels || []).filter((_, idx) => idx !== i) });
  };

  // ---- render helpers ----
  const renderZoneMarkers = () =>
    (card.dropZones || []).map((zone, i) => (
      <div
        key={i}
        className={`dd-zone-marker ${mode === 'preview' ? 'dd-zone-marker--preview' : ''}`}
        style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
        title={zone.correctLabel || `Zone ${i + 1}`}
      >
        {mode === 'preview' ? (zone.correctLabel || '?') : i + 1}
      </div>
    ));

  // ---- main render ----
  return (
    <div className="dd-editor">
      {/* Mode toggle */}
      <div className="dd-mode-toggle">
        <button
          type="button"
          className={mode === 'edit' ? 'dd-mode-btn active' : 'dd-mode-btn'}
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={mode === 'preview' ? 'dd-mode-btn active' : 'dd-mode-btn'}
          onClick={() => setMode('preview')}
        >
          Preview
        </button>
      </div>

      {/* Prompt */}
      {mode === 'edit' && (
        <input
          type="text"
          placeholder="Prompt (e.g. 'Label the diagram')"
          value={card.prompt || ''}
          onChange={(e) => update({ prompt: e.target.value })}
          className="flashcard-input-field"
        />
      )}
      {mode === 'preview' && card.prompt && (
        <p className="dd-preview-prompt">{card.prompt}</p>
      )}

      {/* Image uploader / canvas */}
      {mode === 'edit' && !card.imageUrl && (
        <label className="dd-image-upload">
          <span>Click to upload an image</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>
      )}

      {card.imageUrl && (
        <div className="dd-canvas-wrapper">
          <div
            className="dd-canvas"
            ref={imgContainerRef}
            onClick={mode === 'edit' ? handleImageClick : undefined}
          >
            <img src={card.imageUrl} alt="Flashcard" className="dd-canvas-img" />
            {renderZoneMarkers()}
          </div>
          {mode === 'edit' && (
            <button type="button" className="dd-remove-image-btn" onClick={removeImage}>
              Remove image
            </button>
          )}
        </div>
      )}

      {/* Zone list (edit mode) */}
      {mode === 'edit' && (card.dropZones || []).length > 0 && (
        <div className="dd-zone-list">
          <span className="dd-section-label">Drop Zones</span>
          {card.dropZones.map((zone, i) => (
            <div key={i} className="dd-zone-row">
              <span className="dd-zone-index">{i + 1}</span>
              <span className="dd-zone-coords">
                ({zone.x.toFixed(1)}%, {zone.y.toFixed(1)}%)
              </span>
              <input
                type="text"
                placeholder="Correct label"
                value={zone.correctLabel}
                onChange={(e) => updateZoneLabel(i, e.target.value)}
                className="flashcard-input-field"
              />
              <button
                type="button"
                className="flashcard-input-remove"
                onClick={() => removeZone(i)}
                title="Remove zone"
              >
                ✕
              </button>
            </div>
          ))}
          {card.imageUrl && (
            <p className="dd-hint">Click on the image above to add more zones.</p>
          )}
        </div>
      )}

      {/* Draggable labels */}
      {mode === 'edit' && (
        <div className="dd-labels-section">
          <span className="dd-section-label">Draggable Labels</span>
          {(card.draggableLabels || []).map((label, i) => (
            <div key={i} className="list-editor-row">
              <input
                type="text"
                placeholder={`Label ${i + 1}`}
                value={label}
                onChange={(e) => updateLabel(i, e.target.value)}
                className="flashcard-input-field"
              />
              <button
                type="button"
                className="flashcard-input-remove"
                onClick={() => removeLabel(i)}
                disabled={(card.draggableLabels || []).length <= 1}
                title="Remove label"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="list-editor-add" onClick={addLabel}>
            + Add Label
          </button>
        </div>
      )}

      {/* Preview: label chips */}
      {mode === 'preview' && (
        <div className="dd-preview-labels">
          {(card.draggableLabels || [])
            .filter((l) => l.trim())
            .map((label, i) => (
              <span key={i} className="dd-label-chip">
                {label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default DragDropEditor;
