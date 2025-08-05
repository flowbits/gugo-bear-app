
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserProfile as fetchUserProfileAPI } from '@/services/api'; 

// Define the shape of the user profile data
interface UserProfile {
    id: number | null;
    wallet_address: string;
    balance: number;
    created_at: string;
    nonce?: number | null; // Optional field for nonce
}

// Define the state for this slice
interface UserState {
    profile: UserProfile | null;
    token: string | null;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: UserState = {
    profile: null,
    token: null,
    loading: 'idle',
    error: null,
};


export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        const profileData = await fetchUserProfileAPI();
        return profileData;
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            if (typeof window !== 'undefined') {
                localStorage.setItem('access_token', action.payload);
            }
        },
        logout: (state) => {
            state.profile = null;
            state.token = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.loading = 'succeeded';
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { setToken, logout } = userSlice.actions;
export const userReducer = userSlice.reducer;
