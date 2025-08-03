
import { configureStore } from '@reduxjs/toolkit';
import { userSlice, userReducer } from './slices/userSlice';
import { transactionsSlice, transactionsReducer } from './slices/transactionsSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        transactions: transactionsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
