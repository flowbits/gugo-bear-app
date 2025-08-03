import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { placeBet as placeBetAPI, cancelBet as cancelBetAPI } from '@/services/api';

// Define the shape of a single transaction
interface Transaction {
    id: string; // e.g., spin_id or a unique transaction hash
    type: 'bet_placed' | 'bet_cancelled';
    status: 'succeeded' | 'failed';
    amount?: number;
    details: any; // The full response from the API
    timestamp: string;
}

// Define the state for this slice
interface TransactionsState {
    items: Transaction[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialTransactionsState: TransactionsState = {
    items: [],
    loading: 'idle',
    error: null,
};

// Define payload types for our thunks
export interface PlaceBetPayload {
    bets: { number: number; amount: number }[];
}

export interface CancelBetPayload {
    spin_id: string;
}

// Async thunk for placing a bet
export const placeBet = createAsyncThunk('transactions/placeBet', async (payload: PlaceBetPayload, { rejectWithValue }) => {
    try {
        const response = await placeBetAPI(payload);
        return { type: 'bet_placed', response };
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});

// Async thunk for canceling a bet
export const cancelBet = createAsyncThunk('transactions/cancelBet', async (payload: CancelBetPayload, { rejectWithValue }) => {
    try {
        const response = await cancelBetAPI(payload);
        return { type: 'bet_cancelled', response };
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});


export const transactionsSlice = createSlice({
    name: 'transactions',
    initialState: initialTransactionsState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle Place Bet
            .addCase(placeBet.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(placeBet.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                const { response } = action.payload;
                state.items.unshift({ // Add to the beginning of the list
                    id: response.spin_id,
                    type: 'bet_placed',
                    status: 'succeeded',
                    amount: response.bets.reduce((sum: number, bet: any) => sum + bet.amount, 0),
                    details: response,
                    timestamp: new Date().toISOString(),
                });
            })
            .addCase(placeBet.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            })
            // Handle Cancel Bet
            .addCase(cancelBet.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(cancelBet.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                const { response } = action.payload;
                state.items.unshift({
                    id: `cancel-${Date.now()}`, // Create a unique ID
                    type: 'bet_cancelled',
                    status: 'succeeded',
                    details: response,
                    timestamp: new Date().toISOString(),
                });
            })
            .addCase(cancelBet.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const transactionsReducer = transactionsSlice.reducer;