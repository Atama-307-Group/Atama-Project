import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { fetchGameState } from '../api';

const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

export function GameProvider({ children }) {
    const [stompClient, setStompClient] = useState(null);
    const [connected, setConnected] = useState(false);
    
    // Game State
    const [gameState, setGameState] = useState('LOBBY');
    const [players, setPlayers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [joinCode, setJoinCode] = useState(null);
    const [participantId, setParticipantId] = useState(null);

    const connectToGame = async (code, nick, myPartId, onConnect) => {
        setJoinCode(code);
        setParticipantId(myPartId);

        try {
            const stateResponse = await fetchGameState(code);
            setGameState(stateResponse.state);
            setPlayers(stateResponse.players || []);
            if (stateResponse.currentQuestion) {
                 setCurrentQuestion(stateResponse.currentQuestion);
            }
        } catch (err) {
            console.error("Could not fetch initial game state", err);
        }
        
        const socket = new SockJS('http://localhost:8080/ws-game');
        const client = new Client({
            webSocketFactory: () => socket,
            // debug: (str) => { console.log(str); },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setConnected(true);
            setStompClient(client);

            // Subscribe to game topic
            client.subscribe(`/topic/game/${code}`, (message) => {
                const msg = JSON.parse(message.body);
                handleGameMessage(msg);
            });

            // Join the game as player
            client.publish({
                destination: '/app/game.join',
                body: JSON.stringify({ joinCode: code, nickname: nick, participantId: myPartId })
            });
            
            if (onConnect) onConnect();
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();
    };

    const handleGameMessage = (msg) => {
        switch (msg.type) {
            case 'UPDATE_PLAYERS':
                setPlayers(msg.payload);
                break;
            case 'QUESTION_STARTING':
                setGameState('QUESTION_STARTING');
                setCurrentQuestion(null);
                setCorrectAnswer(null);
                break;
            case 'QUESTION_ACTIVE':
                setGameState('QUESTION_ACTIVE');
                setCurrentQuestion(msg.payload);
                setCorrectAnswer(null);
                break;
            case 'QUESTION_ENDED':
                setGameState('QUESTION_ENDED');
                // payload is { players, correctAnswer }
                setPlayers(msg.payload.players || msg.payload);
                setCorrectAnswer(msg.payload.correctAnswer || null);
                break;
            case 'FINISHED':
                setGameState('FINISHED');
                setPlayers(msg.payload.players || msg.payload);
                break;
            default:
                console.log('Unknown message type', msg);
        }
    };

    const startGame = () => {
        if (stompClient && connected) {
            stompClient.publish({
                destination: '/app/game.start',
                body: JSON.stringify({ joinCode })
            });
        }
    };

    const nextQuestion = () => {
        if (stompClient && connected) {
            stompClient.publish({
                destination: '/app/game.nextQuestion',
                body: JSON.stringify({ joinCode })
            });
        }
    };

    const endQuestion = () => {
        if (stompClient && connected) {
            stompClient.publish({
                destination: '/app/game.endQuestion',
                body: JSON.stringify({ joinCode })
            });
        }
    };

    const submitAnswer = (selectedOptionText) => {
        if (stompClient && connected) {
            stompClient.publish({
                destination: '/app/game.submitAnswer',
                body: JSON.stringify({ joinCode, participantId, selectedOptionText: selectedOptionText })
            });
        }
    };

    const disconnect = () => {
        if (stompClient) {
            stompClient.deactivate();
        }
        setConnected(false);
        setGameState('LOBBY');
        setPlayers([]);
        setCurrentQuestion(null);
        setJoinCode(null);
    };

    const endGame = () => {
        if (stompClient && connected) {
            stompClient.publish({
                destination: '/app/game.endGame',
                body: JSON.stringify({ joinCode })
            });
        }
    };

    return (
        <GameContext.Provider value={{
            connected,
            gameState,
            players,
            currentQuestion,
            correctAnswer,
            joinCode,
            participantId,
            connectToGame,
            startGame,
            nextQuestion,
            endQuestion,
            endGame,
            submitAnswer,
            disconnect
        }}>
            {children}
        </GameContext.Provider>
    );
}
