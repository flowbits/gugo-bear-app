// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { abstractTestnet } from 'viem/chains';


const publicClient = createPublicClient({
    chain: abstractTestnet,
    transport: http(),
});


const SIGNED_MESSAGE = "Welcome! Please sign this message to verify your wallet address and register on our platform.";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, signature } = body;

        if (!address || !signature) {
            return NextResponse.json(
                { error: 'Address and signature are required.' },
                { status: 400 }
            );
        }


        const isValid = await publicClient.verifyMessage({
            address: address,
            message: SIGNED_MESSAGE,
            signature: signature,
        });

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature. Please try again.' },
                { status: 401 }
            );
        }

        console.log(`Signature for ${address} is valid. Registering user...`);

        const backendApiUrl = process.env.BACKEND_API_URL;
        const backendApiKey = process.env.BACKEND_API_KEY;

        if (!backendApiUrl) {
            console.error("BACKEND_API_URL is not defined in .env.local");
            return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
        }

        const backendResponse = await fetch(`${backendApiUrl}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${backendApiKey}`,
            },
            body: JSON.stringify({
                wallet_address: address,
            }),
        });

        if (!backendResponse.ok) {
            // If the backend returned an error, forward it to the frontend.
            const backendError = await backendResponse.json();
            console.error("Error from main backend:", backendError);
            return NextResponse.json(
                { error: backendError.message || 'Failed to register user on the backend.' },
                { status: backendResponse.status }
            );
        }

        const registrationData = await backendResponse.json();


        return NextResponse.json(
            { success: true, message: 'User registered successfully!', data: registrationData },
            { status: 200 }
        );

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
