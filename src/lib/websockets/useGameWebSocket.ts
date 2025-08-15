import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/redux/hooks';

interface GameState {
    phase: 'BETTING' | 'LOCKED' | 'SPINNING' | 'RESULTS';
    timer: number;
    spin_id: string | null;
    winning_number: number | null;
    last_numbers: number[];
}
interface ChatMessage {
    username: string;
    message: string;
    wallet_address?: string;
}

interface UseGameSocketReturn {
    gameState: GameState | null;
    isConnected: boolean;
    lastWinnings: number | null;
    chatMessages: ChatMessage[];
    sendPlaceBet: (bets: { [key: string]: number }[]) => void;
    sendChatMessage: (message: string) => void;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://127.0.0.1:8000/ws';

export const useGameWebSocket = (userId: number | null): UseGameSocketReturn => {
    const { fetchUserProfile } = useStore();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastWinnings, setLastWinnings] = useState<number | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    const handleMessage = useCallback((event: MessageEvent) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'game_state':
                setGameState(message.payload);
                if (message.payload.phase === 'BETTING') {
                    setLastWinnings(null);
                }
                break;

            case 'new_chat_message':
                setChatMessages(prevMessages => [...prevMessages, message.payload]);
                break;
            
            case 'recent_chat_messages':
                if (!Array.isArray(message.payload)) {
                    // console.error('Expected an array of chat messages');
                    return;
                }
                setChatMessages(message?.payload?.reverse());
                break;

            case 'spin_start':
                setGameState(prevState => prevState ? {
                    ...prevState,
                    winning_number: message.payload.winningNumber,
                    phase: 'SPINNING',
                } : null);
                break;

            case 'bet_result':
                setLastWinnings(message.payload.winnings);
                setGameState(prevState => prevState ? {
                    ...prevState,
                    phase: 'RESULTS',
                    winning_number: message.payload?.winNum
                } : null);
                fetchUserProfile();
                break;

            case 'balance_update':
                fetchUserProfile();
                break;

            case 'bet_placed':
                console.log('Bet successfully placed for spin:', message.payload.spin_id);
                fetchUserProfile();
                break;

            case 'error':
                break;
        }
    }, [fetchUserProfile]);

    useEffect(() => {
        if (!userId) {
            return;
        }

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
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [userId, handleMessage]);

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

    const sendChatMessage = (message: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const msgPayload = {
                type: 'send_chat_message',
                payload: { message },
            };
            socketRef.current.send(JSON.stringify(msgPayload));
        } else {
            console.error('WebSocket is not connected.');
        }
    };

    return { gameState, isConnected, lastWinnings, chatMessages, sendPlaceBet, sendChatMessage };
};