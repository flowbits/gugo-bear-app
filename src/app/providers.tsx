"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { abstractTestnet, abstract } from "viem/chains"; 
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";

export const config = createConfig({
    connectors: [abstractWalletConnector()],
    chains: [abstractTestnet],
    transports: {
        [abstractTestnet.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export default function AbstractWalletWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}