import React, { useState } from 'react';
import FlashcardStartPage from './pages/FlashcardStartPage';
import PreLearnPage from './pages/PreLearnPage';
import StudyPage from './pages/StudyPage';
import PostLearnPage from './pages/PostLearnPage';
import PreTestPage from './pages/PreTestPage';
import PracticeTestPage from './pages/PracticeTestPage';
import PostTestPage from './pages/PostTestPage';

const App = () => {
  const [page, setPage] = useState('start');
  // 'start', 'prelearn', 'study', 'postlearn', 'pretest', 'test', 'posttest'

  // Learning state
  const [studyMode, setStudyMode] = useState(null); // 'term' or 'definition'
  const [cardsToStudy, setCardsToStudy] = useState([]);
  const [studiedCount, setStudiedCount] = useState(0);

  // Practice test state
  const [testSettings, setTestSettings] = useState(null); // { promptType, cardsPool, numQuestions }
  const [testResults, setTestResults] = useState(null);   // { correct, total }

  // Sample flashcards
  const flashcards = [
    { term: 'React', definition: 'A JS library for building UI', favorite: true },
    { term: 'Node', definition: 'JS runtime', favorite: false },
    { term: 'PostgreSQL', definition: 'Relational database', favorite: true },
  ];

  return (
    <div>
      {/* START PAGE */}
      {page === 'start' && (
        <FlashcardStartPage
          onLearn={() => setPage('prelearn')}
          onPracticeTest={() => setPage('pretest')}
        />
      )}

      {/* PRE-LEARN PAGE */}
      {page === 'prelearn' && (
        <PreLearnPage
          flashcards={flashcards}
          onStart={(mode, selectedCards) => {
            setStudyMode(mode);
            setCardsToStudy(selectedCards);
            setPage('study');
          }}
        />
      )}

      {/* STUDY PAGE */}
      {page === 'study' && (
        <StudyPage
          studyMode={studyMode}
          flashcards={cardsToStudy}
          onDone={(count) => {
            setStudiedCount(count);
            setPage('postlearn');
          }}
        />
      )}

      {/* POST-LEARN PAGE */}
      {page === 'postlearn' && (
        <PostLearnPage
          studiedCount={studiedCount}
          totalCount={cardsToStudy.length}
          onRestart={() => {
            setCardsToStudy([]);
            setStudyMode(null);
            setStudiedCount(0);
            setPage('start');
          }}
        />
      )}

      {/* PRE-TEST PAGE */}
      {page === 'pretest' && (
        <PreTestPage
          flashcards={flashcards}
          onStartTest={(promptType, cardsPool, numQuestions) => {
            setTestSettings({ promptType, cardsPool, numQuestions });
            setPage('test');
          }}
        />
      )}

      {/* PRACTICE TEST PAGE */}
      {page === 'test' && testSettings && (
        <PracticeTestPage
          promptType={testSettings.promptType}
          cards={testSettings.cardsPool}
          numQuestions={testSettings.numQuestions}
          onDone={(correct, total) => {
            setTestResults({ correct, total });
            setPage('posttest'); // move to post-test after finishing
          }}
        />
      )}

      {/* POST-TEST PAGE */}
      {page === 'posttest' && testResults && (
        <PostTestPage
          correct={testResults.correct}
          total={testResults.total}
          onRestart={() => {
            setTestResults(null);
            setTestSettings(null);
            setPage('start');
          }}
        />
      )}
    </div>
  );
};

export default App;