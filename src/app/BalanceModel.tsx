"use client";

import { Button, Label, Modal, ModalBody, ModalHeader, TextInput } from "flowbite-react";
import { useState } from "react";
import { useStore } from "@/lib/redux/hooks";

interface BalanceModalProps {
    open: boolean;
    onClose: () => void;
    onDeposit?: (amount: number) => void;
    onClaim?: (amount: number) => void;
    status?: string;
    txHash?: string;
    amount: number;
    setAmount: (amount: number) => void;
    action: string;
    setAction: (action: string) => void;
}

export function BalanceModal({ open, onClose, onDeposit, onClaim, status, txHash, amount, setAmount, action, setAction }: BalanceModalProps) {
    // const [amount, setAmount] = useState(100);
    const { user } = useStore();

    function handleClose() {
        // setAmount(100);
        onClose();
    }
    

    return (
        <Modal show={open} size="md" onClose={handleClose} popup dismissible>
            <div className="rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-xl">
                <ModalHeader className="border-b border-gray-700 pb-2">
                    <p className="text-lg font-semibold text-white">Balance Actions</p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-6">
                        <div className="flex flex-col space-y-1">
                            <p className="text-xl font-bold text-white">Deposit or Claim</p>
                            <span className="text-sm text-gray-400">
                                Current Balance:{" "}
                                <span className="font-medium text-gray-200">{user?.profile?.balance || 0} $tGUGO</span>
                            </span>
                        </div>

                        <div>
                            <Label htmlFor="amount" className="mb-1 text-sm font-medium text-gray-300">
                                Enter Amount
                            </Label>
                            <TextInput
                                id="amount"
                                placeholder="1000"
                                value={amount}
                                min={0}
                                readOnly={action === "Approve" && amount > 0}
                                type="number"
                                className="mt-1 bg-gray-800 text-white border-gray-600 placeholder-gray-500"
                                onChange={(event) => {
                                    if (action === "Approve" && amount>0) return; 
                                    const value = event.target.value;
                                    if (!isNaN(Number(value))) {
                                        setAmount(Number(value));
                                    } else {
                                        setAmount(0);
                                    }
                                    setAction(""); 
                                }}
                            />
                        </div>

                        <div className="flex justify-between gap-3">
                            <Button
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                                disabled={status === 'pending'}
                                onClick={() => {
                                    if (onDeposit) {
                                        setAction("Deposit");
                                        onDeposit(amount);
                                    }
                                    // setAmount(0);
                                }}
                            >
                                Deposit
                            </Button>
                            <Button
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                                disabled={status === 'pending'}
                                onClick={() => {
                                    if (onClaim) {
                                        setAction("Claim");
                                        onClaim(amount);
                                    }
                                    // setAmount(0);
                                }}
                            >
                                Claim
                            </Button>
                        </div>

                        <p className="text-xs text-gray-400 text-center pt-2">
                            If you get any error,{" "}
                            <a
                                href="https://discord.com/invite/sVwW49S8Wv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                            >
                                contact us on Discord
                            </a>
                            .
                        </p>
                        {status !== "idle" && (
                            <p className="text-xs text-gray-400 text-center">
                                {action || "Transaction"} {" "}{
                                    status === "pending" ? "Pending..." : status === "success" ? "Success!" : "Failed!"
                                }{" "}
                                {txHash && status == "success" && (
                                    <a
                                        href={`https://sepolia.abscan.org//tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
                                    >
                                        View Transaction
                                    </a>
                                )}
                            </p>
                        )}
                    </div>
                </ModalBody>
            </div>
        </Modal>
    );
}
