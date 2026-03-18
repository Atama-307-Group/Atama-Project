import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlashcardInput from '../components/FlashcardInput.jsx';
import './CreateFlashcardSetPage.css';

const newNormalCard = () => ({ type: 'NORMAL', term: '', definition: '' });

const CreateFlashcardSetPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState([newNormalCard(), newNormalCard()]);
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');

  const handleCardChange = (index, updatedCard) => {
    const updated = cards.map((card, i) => (i === index ? updatedCard : card));
    setCards(updated);
  };

  const addCard = () => {
    setCards([...cards, newNormalCard()]);
  };

  const removeCard = (index) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert('Please enter a title for your flashcard set.'); // here for now, need to find more elegant way to do this
      return;
    }

    // Validate that each card has at least its required fields filled in
    const validCards = cards.filter((card) => {
      switch (card.type) {
        case 'NORMAL':
          return card.term?.trim() && card.definition?.trim();
        case 'FILL_BLANK':
          return card.textWithBlanks?.trim() && card.correctAnswers?.some((a) => a.trim());
        case 'DRAG_DROP':
          return (
              card.prompt?.trim() &&
              card.imageUrl &&
              card.dropZones?.some((z) => z.correctLabel?.trim()) &&
              card.draggableLabels?.some((l) => l.trim())
          );
        case 'STEPS':
          return card.title?.trim() && card.steps?.some((s) => s.trim());
        default:
          return false;
      }
    });

    if (validCards.length === 0) { // used to prevent type coercion, common practice in react + js
      alert('Please complete at least one card before saving.'); // not sure how we want to deal with this normally
      return;
    }

    // Get rid of empty entries from list fields before sending
    const cleanedCards = validCards.map((card) => {
      const cleaned = {...card};
      if (cleaned.correctAnswers) {
        cleaned.correctAnswers = cleaned.correctAnswers.filter((a) => a.trim());
      }
      if (cleaned.draggableLabels) {
        cleaned.draggableLabels = cleaned.draggableLabels.filter((l) => l.trim());
      }
      if (cleaned.dropZones) {
        cleaned.dropZones = cleaned.dropZones.filter((z) => z.correctLabel?.trim());
      }
      if (cleaned.steps) {
        cleaned.steps = cleaned.steps.filter((s) => s.trim());
      }
      return cleaned; // doesn't do anything for now
    });

    try {
      const response = await fetch('http://localhost:8080/api/flashcard-sets', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim(),
          university: university.trim(),
          course: course.trim(),
          flashcards: cleanedCards,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Backend error:', err);
        throw new Error(err.message || 'Failed to save');
      }
      const saved = await response.json();
      recordAccess(saved.id);
      navigate(`/sets/${saved.id}`);
    } catch (err) {
      console.error(err);
      alert('Something went wrong saving your set.' + err.message);
    }
  };

  return (
    <div className="create-set-page">
      <div className="create-set-top">
        <button className="set-page-back" onClick={() => navigate('/')}>&larr; Back</button>
      </div>
      <h1>Create a New Flashcard Set</h1>
      {/* TODO: add fields for university and class */}

      <input
        type="text"
        className="create-set-title"
        placeholder='Enter a title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="create-set-description"
        placeholder="Add a description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <input
          type="text"
          className="create-set-description"
          placeholder="University (optional)"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
      />
      <input
          type="text"
          className="create-set-description"
          placeholder="Course (optional)"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
      />

      <div className="create-set-cards">
        {cards.map((card, index) => (
          <FlashcardInput
            key={index}
            index={index}
            card={card}
            onChange={handleCardChange}
            onRemove={removeCard}
            canRemove={cards.length > 1}
          />
        ))}
      </div>

      <button className="create-set-add-btn" onClick={addCard}>
        + Add Card
      </button>

      <div className="create-set-actions">
        <button onClick={() => navigate('/')}>Cancel</button>
        <button className="create-set-save-btn" onClick={handleSave}>
          Create Set
        </button>
      </div>
    </div>
  );
};

export default CreateFlashcardSetPage;
