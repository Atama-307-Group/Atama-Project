import React from 'react';
import './FlashcardInput.css';

const CARD_TYPES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'DRAG_DROP', label: 'Drag & Drop' },
  { value: 'STEPS', label: 'Steps' },
];

const FlashcardInput = ({ index, card, onChange, onRemove, canRemove }) => {
  const updateField = (field, value) => {
    onChange(index, { ...card, [field]: value });
  };

  const updateListItem = (field, listIndex, value) => {
    const updated = [...card[field]];
    updated[listIndex] = value;
    onChange(index, { ...card, [field]: updated });
  };

  const addListItem = (field) => {
    onChange(index, { ...card, [field]: [...(card[field] || []), ''] });
  };

  const removeListItem = (field, listIndex) => {
    onChange(index, { ...card, [field]: card[field].filter((_, i) => i !== listIndex) });
  };

  const handleTypeChange = (newType) => {
    const base = { type: newType };
    switch (newType) {
      case 'NORMAL':
        onChange(index, { ...base, term: '', definition: '' });
        break;
      case 'FILL_BLANK':
        onChange(index, { ...base, textWithBlanks: '', correctAnswers: [''] });
        break;
      case 'DRAG_DROP':
        onChange(index, { ...base, prompt: '', draggableItems: [''], dropTargets: [''] });
        break;
      case 'STEPS':
        onChange(index, { ...base, title: '', steps: [''] });
        break;
      default:
        break;
    }
  }; // don't know if needed rn

  const renderFields = () => {
    switch (card.type) {
      case 'NORMAL':
        return (
          <>
            <input
              type="text"
              placeholder="Term"
              value={card.term || ''}
              onChange={(e) => updateField('term', e.target.value)}
              className="flashcard-input-field"
            />
            <input
              type="text"
              placeholder="Definition"
              value={card.definition || ''}
              onChange={(e) => updateField('definition', e.target.value)}
              className="flashcard-input-field"
            />
          </>
        );

      case 'FILL_BLANK':
        return (
          <>
            <input
              type="text"
              placeholder="Text with _____ for blanks"
              value={card.textWithBlanks || ''}
              onChange={(e) => updateField('textWithBlanks', e.target.value)}
              className="flashcard-input-field"
            />
            <ListEditor
              label="Correct Answers"
              items={card.correctAnswers || []}
              placeholder="Answer"
              onChange={(i, val) => updateListItem('correctAnswers', i, val)}
              onAdd={() => addListItem('correctAnswers')}
              onRemove={(i) => removeListItem('correctAnswers', i)}
            />
          </>
        );

      case 'DRAG_DROP':
        return (
          <>
            <input
              type="text"
              placeholder="Prompt"
              value={card.prompt || ''}
              onChange={(e) => updateField('prompt', e.target.value)}
              className="flashcard-input-field"
            />
            <ListEditor
              label="Draggable Items"
              items={card.draggableItems || []}
              placeholder="Item"
              onChange={(i, val) => updateListItem('draggableItems', i, val)}
              onAdd={() => addListItem('draggableItems')} // specifies what to change for each type
              onRemove={(i) => removeListItem('draggableItems', i)}
            />
            <ListEditor
              label="Drop Targets"
              items={card.dropTargets || []}
              placeholder="Target"
              onChange={(i, val) => updateListItem('dropTargets', i, val)}
              onAdd={() => addListItem('dropTargets')}
              onRemove={(i) => removeListItem('dropTargets', i)}
            />
          </>
        );

      case 'STEPS':
        return (
          <>
            <input
              type="text"
              placeholder="Title"
              value={card.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="flashcard-input-field"
            />
            <ListEditor
              label="Steps"
              items={card.steps || []}
              placeholder="Step"
              onChange={(i, val) => updateListItem('steps', i, val)}
              onAdd={() => addListItem('steps')}
              onRemove={(i) => removeListItem('steps', i)}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flashcard-input-card">
      <div className="flashcard-input-header">
        <span className="flashcard-input-number">{index + 1}</span>
        <select
          value={card.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="flashcard-input-type-select"
        >
          {CARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          className="flashcard-input-remove"
          onClick={() => onRemove(index)}
          disabled={!canRemove} // idk about this
          title="Remove card"
        >
          ✕
        </button>
      </div>
      <div className="flashcard-input-fields">
        {renderFields()}
      </div>
    </div>
  );
};

/* Reusable subcomponent for editing list of strings */
const ListEditor = ({ label, items, placeholder, onChange, onAdd, onRemove }) => (
  <div className="list-editor">
    <span className="list-editor-label">{label}</span>
    {items.map((item, i) => (
      <div key={i} className="list-editor-row">
        <input
          type="text"
          placeholder={`${placeholder} ${i + 1}`}
          value={item}
          onChange={(e) => onChange(i, e.target.value)}
          className="flashcard-input-field"
        />
        <button
          className="flashcard-input-remove"
          onClick={() => onRemove(i)}
          disabled={items.length <= 1}
          title={`Remove ${placeholder.toLowerCase()}`}
        >
          ✕
        </button>
      </div>
    ))}
    <button className="list-editor-add" onClick={onAdd}>+ Add {placeholder}</button>
  </div>
);

export default FlashcardInput;
