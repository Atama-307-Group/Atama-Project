import React, { useState } from 'react';
import FlashcardStartPage from './pages/FlashcardStartPage';
import PreLearnPage from './pages/PreLearnPage';
import StudyPage from './pages/StudyPage';
import PostLearnPage from './pages/PostLearnPage';
import PreMatchPage from './pages/PreMatchPage';
import MatchPage from './pages/MatchPage';
import PostMatchPage from './pages/PostMatchPage';

const App = () => {
  const [page, setPage] = useState('start');
  const [cardsToStudy, setCardsToStudy] = useState([]);
  const [totalCards, setTotalCards] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [matchTime, setMatchTime] = useState(0);

  const flashcards = [
    { term: 'React', definition: 'A JS library for building UI', favorite: true },
    { term: 'Node', definition: 'JS runtime', favorite: false },
    { term: 'PostgreSQL', definition: 'Relational database', favorite: true },
  ];

  return (
    <div>
      {page === 'start' && (
        <FlashcardStartPage
          onLearn={() => setPage('prelearn')}
          onMatch={() => setPage('prematch')}
        />
      )}

      {page === 'prelearn' && (
        <PreLearnPage
          flashcards={flashcards}
          onStart={(mode, selectedCards) => {
            setCardsToStudy(selectedCards);
            setTotalCards(selectedCards.length);
            setPage('study');
          }}
        />
      )}

      {page === 'study' && (
        <StudyPage
          studyMode={'term'}
          flashcards={cardsToStudy}
          onDone={(studiedCount) => {
            setTotalCards(studiedCount);
            setPage('postlearn');
          }}
        />
      )}

      {page === 'postlearn' && (
        <PostLearnPage
          studiedCount={totalCards}
          totalCount={cardsToStudy.length}
          onRestart={() => setPage('start')}
        />
      )}

      {/* Match Mode */}
      {page === 'prematch' && (
        <PreMatchPage
          flashcards={flashcards}
          onStart={(selectedCards) => {
            setCardsToStudy(selectedCards);
            setPage('match');
          }}
        />
      )}

      {page === 'match' && (
        <MatchPage
          flashcards={cardsToStudy}
          onDone={(attemptsCount, time) => {
            setAttempts(attemptsCount);
            setMatchTime(time);
            setPage('postmatch');
          }}
        />
      )}

      {page === 'postmatch' && (
        <PostMatchPage
          attempts={attempts}
          time={matchTime}
          onRestart={() => setPage('start')}
        />
      )}
    </div>
  );
};

export default App;