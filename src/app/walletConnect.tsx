import { ConnectKitButton } from "connectkit";
import { useAbstractClient } from "@abstract-foundation/agw-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/redux/hooks";


export const WalletConnect = ({ notify }:
    { notify?: (message: string, type?: 'success' | 'error') => void }
) => {

    const { setToken, fetchUserProfile, user } = useStore();


    const { data: agwClient } = useAbstractClient();
    const [signature, setSignature] = useState<string | null>(null);

    async function signMessage() {
        try {
            if (!agwClient) return;

            const signature = await agwClient.signMessage({
                message: "Welcome! Please sign this message to verify your wallet address and register on our platform.",
            });

            if (!signature) {
                if (notify) notify("No signature returned. Please try again.", 'error');
                return;
            }

            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: agwClient.account?.address,
                    signature,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (notify) notify(`Error: ${errorData.error || 'Failed to verify signature.'}`, 'error');
                return;
            }

            setSignature(signature);

            const data = await res.json();
            if (data?.success && data?.data?.access_token) {
                // localStorage.setItem('access_token', data.data.access_token);
                setToken(data.data.access_token);
                await fetchUserProfile();

                if (notify) notify("Wallet connected and verified successfully!", 'success');
            }

        } catch (error) {
            if (error instanceof Error) {
                const err_msg = error.message || "Unknown error signing message";
                if (notify) notify(`Error: ${err_msg.slice(0, 50)}`, 'error');

            }
        }
    }

    useEffect(() => {
        if (user?.profile) return;
        fetchUserProfile()
    }, []);

    return (
        <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, truncatedAddress, ensName }) => {
                return (
                    <button
                        onClick={() => {
                            if (isConnected && !user?.profile) {
                                signMessage();
                                return;
                            }
                            if (show) show();
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors text-lg shadow-lg shadow-green-600/30"
                    >
                        {isConnecting && !isConnected && "Connecting..."}
                        {isConnected && !user?.profile ? "Sign Message" : isConnected && (ensName ?? truncatedAddress)}
                        {!isConnected && !isConnecting && "Connect Wallet"}
                    </button>
                );
            }}
        </ConnectKitButton.Custom>
    );
};