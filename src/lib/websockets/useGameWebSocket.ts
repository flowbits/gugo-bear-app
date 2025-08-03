import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/redux/hooks';


interface GameState {
    phase: 'BETTING' | 'LOCKED' | 'SPINNING' | 'RESULTS';
    timer: number;
    spin_id: string | null;
    winning_number: number | null;
    last_numbers: number[];
}

interface UseGameSocketReturn {
    gameState: GameState | null;
    isConnected: boolean;
    lastWinnings: number | null;
    sendPlaceBet: (bets: { [key: string]: number }[]) => void;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://127.0.0.1:8000/ws';

/**
 * Custom hook to manage the WebSocket connection for the game.
 * It handles connecting, receiving messages, and sending data.
 *
 * @param userId The ID of the current user.
 * @returns An object with game state, connection status, and action functions.
 */
export const useGameWebSocket = (userId: number | null): UseGameSocketReturn => {
    const { setToken, fetchUserProfile } = useStore();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastWinnings, setLastWinnings] = useState<number | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Memoize the message handler to avoid re-creating it on every render
    const handleMessage = useCallback((event: MessageEvent) => {
        const message = JSON.parse(event.data);
        // console.log('Received WebSocket message:', message);

        switch (message.type) {
            case 'game_state':
                setGameState(message.payload);
                break;

            case 'spin_start':
                // Update game state with winning number and last numbers
                setGameState(prevState => prevState ? {
                    ...prevState,
                    winning_number: message.payload.winningNumber,
                    phase: 'SPINNING',
                } : null);
                break;

            case 'bet_result':
                // A bet has resolved. Update winnings and refresh user profile for new balance.
                setLastWinnings(message.payload.winnings);
                // set gamestate to RESULTS phase
                setGameState(prevState => prevState ? {
                    ...prevState,
                    phase: 'RESULTS',
                    winning_number: message.payload?.winNum
                } : null);
                fetchUserProfile(); // Re-fetch profile to get the updated balance
                break;

            case 'balance_update':
                // This can be used for initial balance or other updates
                fetchUserProfile();
                break;

            case 'bet_placed':
                // Confirmation that a bet was placed. You could show a success toast here.
                console.log('Bet successfully placed for spin:', message.payload.spin_id);
                fetchUserProfile();
                break;

            case 'error':
                // Handle errors sent from the backend (e.g., insufficient funds)
                // console.error('WebSocket Error:', message.payload);
                // You could show an error toast to the user here.
                break;
        }
    }, [fetchUserProfile]);

    useEffect(() => {
        // Do not connect if there is no user ID
        if (!userId) {
            return;
        }

        // Connect to the WebSocket server
        const socket = new WebSocket(`${WEBSOCKET_URL}/${userId}`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            setIsConnected(true);
        };

        socket.onmessage = handleMessage;

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        // Cleanup function to close the socket when the component unmounts
        return () => {
            socket.close();
        };
    }, [userId, handleMessage]);

    // Function to send a "place_bet" message to the server
    const sendPlaceBet = (bets: { [key: string]: number }[]) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = {
                type: 'place_bet',
                payload: { bets },
            };
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected.');
        }
    };

    return { gameState, isConnected, lastWinnings, sendPlaceBet };
};