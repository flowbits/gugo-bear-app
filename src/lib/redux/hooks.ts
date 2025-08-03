import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { fetchUserProfile, setToken, logout } from './slices/userSlice';
import { placeBet, cancelBet } from './slices/transactionsSlice';
import { AppDispatch, RootState } from './store';
import { PlaceBetPayload, CancelBetPayload } from './slices/transactionsSlice';
/**
 * A custom hook to access the Redux store's state and actions.
 * This simplifies component logic by providing state and bound action creators.
 */
export const useStore = () => {
    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: RootState) => state.user);
    const transactions = useSelector((state: RootState) => state.transactions);

    const boundActions = {
        setToken: useCallback((token: string) => dispatch(setToken(token)), [dispatch]),
        logout: useCallback(() => dispatch(logout()), [dispatch]),
        fetchUserProfile: useCallback(() => dispatch(fetchUserProfile()), [dispatch]),
        placeBet: useCallback((payload: PlaceBetPayload) => dispatch(placeBet(payload)), [dispatch]),
        cancelBet: useCallback((payload: CancelBetPayload) => dispatch(cancelBet(payload)), [dispatch]),
    };

    return {
        user,
        transactions,
        ...boundActions,
    };
};
