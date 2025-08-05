"use client";

import { Button, Label, Modal, ModalBody, ModalHeader, TextInput } from "flowbite-react";
import { useState } from "react";
import { useStore } from "@/lib/redux/hooks";


interface BalanceModalProps {
    open: boolean;
    onClose: () => void;
    onDeposit?: (amount: number) => void;
    onClaim?: (amount: number) => void;
}
export function BalanceModal(
    { open, onClose, onDeposit, onClaim }: BalanceModalProps
) {
    const [amount, setAmount] = useState(100);
    const { user } = useStore();

    function handleClose() {
        setAmount(100);
        onClose();
    }

    return (
        <Modal show={open} size="md" onClose={handleClose} popup dismissible>
            <ModalHeader />
            <ModalBody>
                <div className="space-y-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                        Deposit or Claim Balance
                        <span className="text-sm text-gray-200"> (Balance: {user?.profile?.balance || 0} $tGUGO)</span>
                    </h3>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email">Enter Amount to deposit/claim</Label>
                        </div>
                        <TextInput
                            id="amount"
                            placeholder="1000"
                            value={amount}
                            min={0}
                            type="number"
                            onChange={(event) => {
                                const value = event.target.value;

                                if (!isNaN(Number(value))) {
                                    setAmount(Number(value));
                                } else {
                                    setAmount(0);
                                }
                            }}
                        />
                    </div>

                    <div className="w-full flex flex-row justify-between">
                        <Button onClick={() => {
                            if (onDeposit) {
                                onDeposit(amount);
                            }
                            setAmount(0);
                        }}
                        >Deposit</Button>
                        <Button
                            onClick={() => {
                                if (onClaim) {
                                    onClaim(amount);
                                }
                                setAmount(0);
                            }}
                        >Claim</Button>
                    </div>

                </div>
            </ModalBody>
        </Modal>
    );
}
