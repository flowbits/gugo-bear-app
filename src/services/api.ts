
interface UserProfile {
    id: number;
    wallet_address: string;
    balance: number;
    created_at: string; // Dates are typically strings in JSON
}

interface Bet {
    [x: string]: number;
}

interface PlaceBetPayload {
    bets: Bet[];
}

interface CancelBetPayload {
    spin_id: string;
}
interface SignatureResponse {
    signature: string;
    nonce: number | null;
}

interface AllowanceResponse {
    allowance: number;
}

interface SignatureRequest {
    amount: number;
}

interface AllowanceRequest {
    spender_address: string;
    user_address?: string; 
}

// --- Helper Function to Get Auth Headers ---

/**
 * Retrieves the access token from localStorage and constructs the Authorization header.
 * Throws an error if the token is not found, as it's required for these calls.
 * NOTE: This will only work on the client-side.
 * @returns {HeadersInit} The headers object with the Authorization token.
 */
const getAuthHeaders = (): HeadersInit => {
    // Ensure this code only runs in the browser where localStorage is available.
    if (typeof window === 'undefined') {
        throw new Error("localStorage is not available on the server-side.");
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Authentication token not found. Please log in.');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

// Use environment variables for your API's base URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';


// --- API Service Functions ---

/**
 * Fetches the profile of the currently authenticated user.
 * @returns {Promise<UserProfile>} The user's profile data.
 */
export const getUserProfile = async (): Promise<UserProfile> => {
    console.log("Fetching user profile...");
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch user profile.');
    }

    return response.json();
};

/**
 * Places a bet for the current user.
 * @param {PlaceBetPayload} payload - The bets to be placed.
 * @returns {Promise<any>} The response data from the server.
 */
export const placeBet = async (payload: PlaceBetPayload): Promise<any> => {
    console.log("Placing bet:", payload);
    const response = await fetch(`${API_BASE_URL}/bets/place`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to place bet.');
    }

    return response.json();
};

/**
 * Cancels a previously placed bet for the current user.
 * @param {CancelBetPayload} payload - The spin_id of the bet to cancel.
 * @returns {Promise<any>} The response data from the server.
 */
export const cancelBet = async (payload: CancelBetPayload): Promise<any> => {
    console.log("Canceling bet for spin:", payload.spin_id);
    const response = await fetch(`${API_BASE_URL}/bets/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to cancel bet.');
    }

    return response.json();
};


/**
 * Claims a specific amount of tokens for the current user.
 * @param {number} amount - The amount of tokens to claim.
 * @returns {Promise<SignatureResponse>} The signature response from the server.
 */
export const claimTokens = async (amount: number): Promise<SignatureResponse> => {
    console.log("Requesting claim for amount:", amount);
    const response = await fetch(`${API_BASE_URL}/users/claim_request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to claim tokens.');
    }

    return response.json();
}


/** * Checks the ERC20 token allowance for the current user.
 * @param {AllowanceRequest} request - The request containing spender address and optional user address.
 * @returns {Promise<AllowanceResponse>} The allowance response from the server.
 */
export const checkTokenAllowance = async (request: AllowanceRequest): Promise<AllowanceResponse> => {
    console.log("Checking token allowance for spender:", request.spender_address);
    const response = await fetch(`${API_BASE_URL}/users/check-allowance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to check token allowance.');
    }

    return response.json();
};