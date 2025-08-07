"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Dices, CircleDollarSign, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';

// Custom Hooks and Components
import { useStore } from '@/lib/redux/hooks';
import { useGameWebSocket } from '@/lib/websockets/useGameWebSocket';
import { WalletConnect } from './walletConnect';
import { cancelBet, checkTokenAllowance, claimTokens, placeBet } from '@/services/api';
import { BalanceModal } from './BalanceModel';
import { MANAGER_ABI, MANAGER_CONTRACT_ADDRESS } from "@/lib/contract_data/manager";
import { TOKEN_ABI, TOKEN_CONTRACT_ADDRESS } from "@/lib/contract_data/token";

import {
  useAccount,
  useSwitchChain,
  useWriteContract,
  useReadContract,
  useBalance,
} from "wagmi";

import { ethers, Networkish } from "ethers";
import { abstractTestnet } from 'viem/chains';
import Chat from './chat';
import { IoMdSend } from 'react-icons/io';
import { IoChatboxEllipses } from "react-icons/io5";



const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), {
  ssr: false,
});

// --- TYPES AND CONSTANTS (Unchanged) ---
type BetType = 'straight' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3';

interface NumberInfo {
  num: number;
  color: 'red' | 'black' | 'green';
  column?: 1 | 2 | 3;
  dozen?: 1 | 2 | 3;
}

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const NUMBER_DETAILS: { [key: number]: NumberInfo } = {
  0: { num: 0, color: 'green' }, 1: { num: 1, color: 'red', column: 1, dozen: 1 }, 2: { num: 2, color: 'black', column: 2, dozen: 1 }, 3: { num: 3, color: 'red', column: 3, dozen: 1 }, 4: { num: 4, color: 'black', column: 1, dozen: 1 }, 5: { num: 5, color: 'red', column: 2, dozen: 1 }, 6: { num: 6, color: 'black', column: 3, dozen: 1 }, 7: { num: 7, color: 'red', column: 1, dozen: 1 }, 8: { num: 8, color: 'black', column: 2, dozen: 1 }, 9: { num: 9, color: 'red', column: 3, dozen: 1 }, 10: { num: 10, color: 'black', column: 1, dozen: 1 }, 11: { num: 11, color: 'black', column: 2, dozen: 1 }, 12: { num: 12, color: 'red', column: 3, dozen: 1 }, 13: { num: 13, color: 'black', column: 1, dozen: 2 }, 14: { num: 14, color: 'red', column: 2, dozen: 2 }, 15: { num: 15, color: 'black', column: 3, dozen: 2 }, 16: { num: 16, color: 'red', column: 1, dozen: 2 }, 17: { num: 17, color: 'black', column: 2, dozen: 2 }, 18: { num: 18, color: 'red', column: 3, dozen: 2 }, 19: { num: 19, color: 'red', column: 1, dozen: 2 }, 20: { num: 20, color: 'black', column: 2, dozen: 2 }, 21: { num: 21, color: 'red', column: 3, dozen: 2 }, 22: { num: 22, color: 'black', column: 1, dozen: 2 }, 23: { num: 23, color: 'red', column: 2, dozen: 2 }, 24: { num: 24, color: 'black', column: 3, dozen: 2 }, 25: { num: 25, color: 'red', column: 1, dozen: 3 }, 26: { num: 26, color: 'black', column: 2, dozen: 3 }, 27: { num: 27, color: 'red', column: 3, dozen: 3 }, 28: { num: 28, color: 'black', column: 1, dozen: 3 }, 29: { num: 29, color: 'black', column: 2, dozen: 3 }, 30: { num: 30, color: 'red', column: 3, dozen: 3 }, 31: { num: 31, color: 'black', column: 1, dozen: 3 }, 32: { num: 32, color: 'red', column: 2, dozen: 3 }, 33: { num: 33, color: 'black', column: 3, dozen: 3 }, 34: { num: 34, color: 'red', column: 1, dozen: 3 }, 35: { num: 35, color: 'black', column: 2, dozen: 3 }, 36: { num: 36, color: 'red', column: 3, dozen: 3 },
};

const CHIP_VALUES = [1, 5, 10, 25, 100];
const CHIP_COLORS: { [key: number]: string } = {
  1: 'bg-blue-500 border-blue-300', 5: 'bg-red-600 border-red-400', 10: 'bg-green-500 border-green-300', 25: 'bg-gray-800 border-gray-500', 100: 'bg-purple-600 border-purple-400'
};

const getNumberInfo = (num: number): NumberInfo => NUMBER_DETAILS[num];

// --- CHILD COMPONENTS (Unchanged) ---
const RedDiamond = () => <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5"><path fill="#ef4444" d="M12 2L2 12l10 10 10-10L12 2z"></path></svg>;
const BlackDiamond = () => <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5"><path fill="#18181b" d="M12 2L2 12l10 10 10-10L12 2z"></path></svg>;

const BetChip = ({ amount }: { amount: number }) => {
  const displayAmount = amount > 999 ? `${(amount / 1000).toFixed(0)}k` : amount;
  const colorClass = CHIP_COLORS[Object.keys(CHIP_COLORS).reverse().map(Number).find(val => amount >= val) ?? 1];
  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-xs shadow-md border-2`}>
      {displayAmount}
    </div>
  )
}

const BettingTable = ({ onBet, bets, isBettingPhase }: { onBet: (type: BetType, value: any) => void, bets: { [key: string]: number }, isBettingPhase: boolean }) => {
  const renderBetChip = (key: string) => bets[key] ? <BetChip amount={bets[key]} /> : null;
  const handleBet = (type: BetType, value: any) => isBettingPhase && onBet(type, value);
  const isDisabled = !isBettingPhase;

  const numberRows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
  ];

  return (
    <div className="p-2 bg-green-800/50 rounded-lg shadow-lg w-full max-w-4xl border-4 border-green-900/50">
      <div className="grid grid-cols-[auto_1fr] gap-1">
        <div className="relative">
          <button onClick={() => handleBet('straight', 0)} disabled={isDisabled} className="w-16 h-full bg-green-700 hover:bg-green-600 text-white font-bold text-2xl rounded-l-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50">
            0{renderBetChip('straight-0')}
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-1">
          <div className="grid grid-rows-3 gap-1">
            {numberRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-12 gap-1">
                {row.map(num => {
                  const { color } = getNumberInfo(num);
                  return (
                    <div key={num} className="relative">
                      <button onClick={() => handleBet('straight', num)} disabled={isDisabled} className="w-full h-14 text-white font-bold text-sm transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/10 cursor-pointer">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${color === 'red' ? 'bg-red-600' : 'bg-zinc-900'}`}>
                          {num}
                        </div>
                        {renderBetChip(`straight-${num}`)}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="grid grid-rows-3 gap-1">
            {[3, 2, 1].map(col => (
              <div key={col} className="relative">
                <button onClick={() => handleBet(`column${col}` as BetType, col)} disabled={isDisabled} className="w-16 h-full bg-green-700 hover:bg-green-600 text-white font-bold text-sm rounded-r-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                  2:1{renderBetChip(`column${col}-${col}`)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div className="relative"><button onClick={() => handleBet('dozen1', '1-12')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">1st 12{renderBetChip('dozen1-1-12')}</button></div>
        <div className="relative"><button onClick={() => handleBet('dozen2', '13-24')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">2nd 12{renderBetChip('dozen2-13-24')}</button></div>
        <div className="relative"><button onClick={() => handleBet('dozen3', '25-36')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">3rd 12{renderBetChip('dozen3-25-36')}</button></div>
      </div>
      <div className="grid grid-cols-6 gap-1 mt-1">
        <div className="relative"><button onClick={() => handleBet('low', '1-18')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">1 to 18{renderBetChip('low-1-18')}</button></div>
        <div className="relative"><button onClick={() => handleBet('even', 'even')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">EVEN{renderBetChip('even-even')}</button></div>
        <div className="relative"><button onClick={() => handleBet('red', 'red')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"><RedDiamond />{renderBetChip('red-red')}</button></div>
        <div className="relative"><button onClick={() => handleBet('black', 'black')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"><BlackDiamond />{renderBetChip('black-black')}</button></div>
        <div className="relative"><button onClick={() => handleBet('odd', 'odd')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">ODD{renderBetChip('odd-odd')}</button></div>
        <div className="relative"><button onClick={() => handleBet('high', '19-36')} disabled={isDisabled} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">19 to 36{renderBetChip('high-19-36')}</button></div>
      </div>
    </div>
  );
};

const Notification = ({ message, onClear }: { message: string, onClear: () => void }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-4 animate-fade-in-down">
      <span>{message}</span>
      <button onClick={onClear} className="text-gray-400 hover:text-white"><X size={20} /></button>
    </div>
  )
}

const LastNumbers = ({ numbers }: { numbers: (number | null)[] }) => (
  <div className="absolute top-4 left-4 bg-black/50 p-2 rounded-lg flex gap-1 items-center backdrop-blur-sm z-20">
    <span className="text-xs text-gray-300 mr-2">Last:</span>
    {numbers.slice(-10).map((num, index) => {
      if (num === null) return null;
      const { color } = getNumberInfo(num);
      return (
        <div key={index} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${color === 'red' ? 'bg-red-600' : color === 'black' ? 'bg-zinc-900' : 'bg-green-600'}`}>
          {num}
        </div>
      )
    })}
  </div>
)

// --- MAIN GAME COMPONENT ---
export default function RouletteGamePage() {
  // Local state for UI interaction
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [selectedChip, setSelectedChip] = useState<number>(1);
  const [notification, setNotification] = useState('');

  // Redux store integration
  const { user, setToken, fetchUserProfile, logout } = useStore();
  const balance = user.profile?.balance ?? 0;

  // WebSocket integration
  const { gameState, isConnected, lastWinnings, sendPlaceBet } = useGameWebSocket(user.profile?.id ?? null);

  const isBettingPhase = gameState?.phase === 'BETTING';
  // const mustSpin = gameState?.phase === 'SPINNING';
  const [mustSpin, setMustSpin] = useState(false);
  const prizeNumber = WHEEL_NUMBERS.indexOf(gameState?.winning_number ?? -1);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [action, setAction] = useState("");

  // const { address, chainId } = useAccount();
  const { isConnected: isWalletConnected, address, chainId, } = useAccount();

  const { data: hash, writeContract, isError, isSuccess, status } = useWriteContract()
  const { switchChain } = useSwitchChain();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const spinAudioRef = React.useRef<HTMLAudioElement>(null);
  const winAudioRef = React.useRef<HTMLAudioElement>(null);
  const loseAudioRef = React.useRef<HTMLAudioElement>(null);


  const [audioPlayState, setAudioPlayState] = useState(-1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputChat, setInputChat] = useState("");

  const toggleAudio = () => {
    if (audioPlayState <= 0 && audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current.play().catch(error => console.error("Audio play error:", error));
      setAudioPlayState(1);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlayState(0);
    }
  };

  useEffect(() => {
    if (gameState?.phase !== 'RESULTS' || mustSpin) return;
    if (lastWinnings !== null) {
      if (lastWinnings > 0) {
        setNotification(`You won ${lastWinnings.toLocaleString()} $tGUGO!`);
        if (winAudioRef.current && audioPlayState > 0) {
          try {
            winAudioRef.current.volume = 0.1;
            winAudioRef.current.play().catch(error => console.error("Win audio play error:", error));
          } catch (e) {
          }
        }
      } else {
        setNotification(`No win this round. Better luck next time!`);
        if (loseAudioRef.current && audioPlayState > 0) {
          try {
            loseAudioRef.current.volume = 0.1;
            loseAudioRef.current.play().catch(error => console.error("Lose audio play error:", error));
          } catch (e) {
          }
        }
      }
    }
  }, [lastWinnings, gameState, mustSpin, winAudioRef.current, loseAudioRef.current, audioPlayState]);

  useEffect(() => {
    // handle mustSpin state based on game phase
    if (gameState?.phase === 'SPINNING' && !mustSpin) {
      setMustSpin(true);
      if (spinAudioRef.current && audioPlayState > 0) {
        try {
          spinAudioRef.current.volume = 0.1;
          spinAudioRef.current.play().catch(error => console.error("Spin audio play error:", error));
        } catch (error) {
        }
      }
    } else if (gameState?.phase !== 'SPINNING' && mustSpin) {
      setMustSpin(false);
      if (spinAudioRef.current) {
        try {
          spinAudioRef.current.pause();
          spinAudioRef.current.currentTime = 0;
        } catch (error) {
        }
      }
    }
  }, [gameState?.phase, mustSpin, spinAudioRef.current, audioPlayState]);


  // useEffect(() => {
  // if (mustSpin && spinAudioRef.current) {
  //   if (audioPlayState > 0) {
  //     spinAudioRef.current.volume = 0.1;
  //   } else if (audioPlayState === 0) {
  //     spinAudioRef.current.volume = 0;
  //   }
  //   spinAudioRef.current.play().catch(error => console.error("Spin audio play error:", error));
  // } else if (spinAudioRef.current && !mustSpin) {
  //   spinAudioRef.current.pause();
  //   spinAudioRef.current.currentTime = 0; 
  // }

  // }, [mustSpin, spinAudioRef, audioPlayState]);

  useEffect(() => {
    if (!isWalletConnected) {
      setNotification("Connect your wallet to play.");
    }
    else if (isWalletConnected && address && user?.profile && address.toLowerCase() !== user.profile.wallet_address.toLowerCase()) {
      logout();
      setNotification("Connect your wallet to play.");
    }
    else if (isWalletConnected && notification === "Connect your wallet to play.") {
      setNotification("");
    }
  }, [isWalletConnected, user?.profile, notification]);


  useEffect(() => {
    const CheckFn = async () => {
      if (status == "success" && isSuccess) {
        if (action === "Approve") {
          setTimeout(async () => {
            await handleDeposit(amount);
          }, 1000);
        }
        if (action === "Deposit" || action === "Claim") {
          setTimeout(async () => {
            await fetchUserProfile();
            // setIsBalanceModalOpen(false);
          }, 5000);
        }
        setNotification("Transaction successful! Check your wallet for details.");
      }
    }
    CheckFn();
  }, [status, fetchUserProfile, action, amount, isSuccess]);



  const abstractTestnetNetwork: Networkish = {
    chainId: abstractTestnet.id,
    name: abstractTestnet.name,
    ensAddress: address
  }
  // const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const provider = new ethers.AbstractProvider(abstractTestnetNetwork)
  const token_contract = new ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_ABI,
    provider
  );

  const manager_contract = new ethers.Contract(
    MANAGER_CONTRACT_ADDRESS,
    MANAGER_ABI,
    provider
  );




  const { data: tokenBalanceData } = useBalance({
    address: address,
    token: TOKEN_CONTRACT_ADDRESS,
    chainId: abstractTestnet.id,
  });



  async function handleDeposit(amount: number) {
    if (!address) {
      setNotification("Please connect your wallet first.");
      return;
    }
    if (amount <= 0) {
      setNotification("Amount must be greater than 0.");
      return;
    }

    // match with tokenBalanceData if amount is greater than token balance (amount provided in number(ether) and you may get token balance in number(wei) bigInt so make sure to convert it and then match)
    if (tokenBalanceData && amount > Number(tokenBalanceData.value) / 1e18) {
      setNotification("Insufficient token balance for this deposit.");
      return;
    }


    try {
      const res = await checkTokenAllowance(
        {
          spender_address: MANAGER_CONTRACT_ADDRESS,
          user_address: address
        }
      )
      const userAllowance = res?.allowance ? res?.allowance / 1e18 : 0;
      // console.log("User allowance:", userAllowance, "Amount to deposit:", amount);
      if (userAllowance < amount) {
        setAction("Approve")
        await writeContract(
          {
            abi: TOKEN_ABI,
            address: TOKEN_CONTRACT_ADDRESS,
            functionName: 'approve',
            args: [MANAGER_CONTRACT_ADDRESS, ethers.parseEther(amount.toString())],
          }
        )
        setNotification(`Approve token and then try to deposit $tGUGO again.`);
      }
      else {
        setAction("Deposit")
        await writeContract(
          {
            abi: MANAGER_ABI,
            address: MANAGER_CONTRACT_ADDRESS,
            functionName: 'deposit',
            args: [ethers.parseEther(amount.toString())],
          }
        )
        // setNotification(`Deposited ${amount} $tGUGO successfully, will be reflected in your balance soon.`);
      }
    } catch (error) {
      console.error("Deposit failed:", error);
      setNotification("Deposit failed. Please try again.");
    }
    // setIsBalanceModalOpen(false);
  }


  async function handleClaim(amount: number) {
    if (!address) {
      setNotification("Please connect your wallet first.");
      return;
    }
    if (amount <= 0) {
      setNotification("Amount must be greater than 0.");
      return;
    }
    if (amount > balance) {
      setNotification("Insufficient balance for this claim.");
      return;
    }
    setAction("Claim")
    const res = await claimTokens(amount);
    // setIsBalanceModalOpen(false);
    console.log("Claim response:", res);
    // setNotification('Claim request received. You will receive your tokens within 24 hours.');
    if (res.signature) {
      console.log("Claim response:", res);
      // amount in wei convert
      const amountInWei = ethers.parseEther(res.amount.toString());
      await writeContract(
        {
          abi: MANAGER_ABI,
          address: MANAGER_CONTRACT_ADDRESS,
          functionName: 'claim',
          args: [amountInWei, res.nonce, `0x${res.signature}`]
        }
      )
      // setNotification(`Claimed ${amount} $tGUGO successfully, will be reflected in your balance soon.`);
      setNotification('Confirm the transaction in your wallet to claim tokens.');
    }
  }


  function OnCloseBalanceModal() {
    setIsBalanceModalOpen(false);
  }

  useEffect(() => {
    if (isBettingPhase) {
      setNotification('');
    }
  }, [isBettingPhase]);

  // Memoize total bet amount
  const totalBet = useMemo(() => Object.values(bets).reduce((acc, amount) => acc + amount, 0), [bets]);

  // Effect for handling initial authentication and profile fetching
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setToken(token);
      fetchUserProfile();
    }
  }, [setToken, fetchUserProfile]);

  // Effect for handling win/loss notifications

  // Clear bets when a new betting round starts
  useEffect(() => {
    if (isBettingPhase) {
      setBets({});
    }
  }, [isBettingPhase]);

  // --- ACTION HANDLERS ---
  const handleBet = (type: BetType, value: any) => {
    if (!isBettingPhase || balance < selectedChip) {
      if (balance < selectedChip) setNotification("Not enough balance!");
      return;
    }
    const key = `${type}-${value}`;
    setBets(prev => ({ ...prev, [key]: (prev[key] || 0) + selectedChip }));
  };

  const handlePlaceBets = async () => {
    try {
      if (!isBettingPhase) {
        setNotification("Bets can only be placed during the betting phase.");
        return;
      }
      if (totalBet === 0) {
        setNotification("Please place your bets on the table.");
        return;
      }
      const betsToSend = Object.entries(bets).map(([key, amount]) => ({ [key]: amount }));
      const res = await placeBet(
        { bets: betsToSend }
      )
      if (!res || res?.status !== 'success') {
        setNotification(res?.detail || "Failed to place bets. Please try again.");
        return;
      }
      setNotification('Bets placed!');
      await fetchUserProfile();
    } catch (error: any) {
      setNotification("Failed to place bets. Please try again.");
    }
  };

  const clearBets = async () => {
    try {
      if (!isBettingPhase) {
        setNotification("Bets can only be cleared during the betting phase.");
        return;
      }
      if (!gameState?.spin_id) {
        setNotification("No active spin to cancel bets for.");
        return;
      }
      const res = await cancelBet({
        spin_id: gameState?.spin_id
      })
      if (!res || res?.status !== 'success') {
        setNotification(res?.detail || "Failed to cancel bets. Please try again.");
        return;
      }
      setBets({});
      setNotification('Bets cleared.');
      await fetchUserProfile();
    } catch (error: any) {
      if (isBettingPhase) {
        setBets({});
      } else {
        setNotification("Bets can only be cleared during the betting phase.");
      }
    }
  };


  // disable clicks while spinning

  return (
    <>
      <div className="min-h-screen bg-green-800 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden"
        // style={{ backgroundImage: 'url(/gugoxbearish.png)', backgroundSize: 'cover', backgroundPosition: 'center', objectFit: 'cover' }
        // }
        onClick={() => {
          if (audioRef.current && audioPlayState == -1 && !mustSpin) {
            toggleAudio();
          }
        }
        }
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/gugo_3.mov" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-green-900/20 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <audio ref={audioRef} src="/background_music.mp3" loop />
        <audio ref={spinAudioRef} src="/spin_sound.mp3" />
        <audio ref={winAudioRef} src="/win_sound.mp3" />
        <audio ref={loseAudioRef} src="/lose_sound.mp3" />
        <div className="absolute inset-0 bg-green-900/20 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <Notification message={notification} onClear={() => setNotification('')} />
        <LastNumbers numbers={gameState?.last_numbers ?? []} />

        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 z-10">
          <div className="flex-shrink-0 flex flex-col items-center gap-6 pt-8">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber === -1 ? 0 : prizeNumber}
              innerRadius={5}
              innerBorderColor='#ffffff'
              disableInitialAnimation={true}
              innerBorderWidth={2}
              outerBorderColor='#ffffff'
              outerBorderWidth={4}
              data={
                WHEEL_NUMBERS.map(num => {
                  const { color } = getNumberInfo(num);
                  return {
                    option: `${num}`,
                    style: {
                      backgroundColor: color === 'red' ? '#df3423' : color === 'black' ? '#3e3e3e' : '#00a000',
                      textColor: '#ffffff',
                    }
                  };
                })
              }
              onStopSpinning={() => {
                console.log("Wheel stopped spinning.");
              }}
            />
            <div className="bg-black/50 p-4 rounded-lg text-center shadow-lg min-h-[60px] w-full max-w-sm">
              {gameState?.phase === 'BETTING' && <p className="text-xl text-yellow-400">Place your bets! Timer: {gameState.timer}</p>}
              {gameState?.phase === 'LOCKED' && <p className="text-xl text-red-500 animate-pulse">Bets Locked! Timer: {gameState.timer}</p>}
              {gameState?.phase === 'SPINNING' && <p className="text-xl text-blue-400 animate-pulse">Spinning...</p>}
              {gameState?.phase === 'RESULTS' && (
                mustSpin ? <p className="text-xl text-green-400 animate-pulse">Results are in! Winning number is spinning...</p> :
                  <div className="space-y-1">
                    <p className="text-2xl font-bold animate-fade-in">
                      Winning Number:{" "}
                      <span
                        className={
                          getNumberInfo(gameState.winning_number ?? 0).color === "red"
                            ? "text-red-500"
                            : getNumberInfo(gameState.winning_number ?? 0).color === "black"
                              ? "text-gray-300"
                              : "text-green-500"
                        }
                      >
                        {gameState.winning_number}
                      </span>
                    </p>
                    <p className="text-sm text-gray-300 animate-fade-in delay-500">
                      Betting for next spin starting soon...
                    </p>
                  </div>
              )}
            </div>
          </div>
          <div className="flex-grow flex-col min-[768px]:flex-row flex items-start justify-center gap-4 pb-[150px] min-[768px]:pb-[80px] lg:pb-0">
            <BettingTable onBet={handleBet} bets={bets} isBettingPhase={isBettingPhase} />
            <div className="flex flex-row  min-[768px]:flex-col items-center gap-3 bg-black/50 p-3 rounded-lg sticky top-4 max-[768px]:w-full max-[768px]:justify-center">
              <span className="text-gray-300 font-bold text-sm">CHIP</span>
              {CHIP_VALUES.map(value => (
                <button key={value} onClick={() => setSelectedChip(value)} className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full font-bold text-white text-sm border-4 transition-all duration-200 ${CHIP_COLORS[value]} ${selectedChip === value ? 'border-yellow-400 scale-110' : 'border-transparent hover:border-white/50'}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
        {isChatOpen && (
          <div className="fixed bottom-36 right-6 w-80 max-w-[90vw] h-14 bg-black/50  rounded-lg shadow-2xl z-90 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2">
              <div className="relative w-full ">

                <input
                  type="text"
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-1 outline-none border border-yellow-400 placeholder-gray-400"
                  placeholder="Chat..."
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                />
                <button
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-yellow-400 flex items-center justify-center"
                  aria-label="Send"
                >
                  <IoMdSend size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-36 right-2 w-80 max-w-[90vw]  rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <Chat limit={3} alignRight />
          </div>
        </div>

        <button
          className="fixed bottom-24 right-6 font-bold rounded-lg py-1 px-2 bg-yellow-400 cursor-pointer text-black z-40 shadow-lg"
          onClick={() => setIsChatOpen((prev) => !prev)}
        >
          <IoChatboxEllipses size={24} className="" />
       
        </button>

        <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 z-30 ">
          <div className="w-full max-w-7xl mx-auto flex flex-col min-[768px]:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs lg:text-lg">
              <button onClick={toggleAudio} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-gray-600/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                disabled={mustSpin}
              >
                {audioPlayState > 0 ? <Volume2 size={20} className="text-yellow-400" /> : <VolumeX size={20} className="text-red-400" />}
              </button>
              <div className="flex flex-row items-center gap-2 bg-black/30 p-2 rounded-lg ">
                <span className="text-gray-400">Bet:</span>
                <span className="font-bold text-yellow-400 w-full flex flex-row gap-1">
                  <p>{totalBet.toLocaleString()}</p>
                  <p>$tGUGO</p>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg cursor-pointer " onClick={() => setIsBalanceModalOpen(true)}>
                <CircleDollarSign className="text-green-400" size={20} />
                <span className="font-bold text-green-400 flex flex-row gap-1">
                  <p>{balance.toLocaleString()} </p>
                  <p>$tGUGO</p>
                </span>
              </div>
              {
                user?.profile?.nonce == null || user?.profile?.nonce === 0 ? (
                  <button onClick={() => handleClaim(1)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs lg:text-lg shadow-lg shadow-blue-600/30 cursor-pointer ">
                    Claim Bonus
                  </button>
                ) : null
              }
            </div>
            <div className="flex items-center gap-4">
              <button onClick={clearBets} disabled={!isBettingPhase || totalBet === 0} className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-3 lg:px-6 rounded-lg flex items-center gap-2 transition-colors text-xs lg:text-lg shadow-lg shadow-gray-600/30 cursor-pointer disabled:cursor-not-allowed">
                <RotateCcw size={20} /> Clear
              </button>
              <button onClick={handlePlaceBets} disabled={!isBettingPhase || totalBet === 0} className="bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold lg:py-3 p-2 lg:px-6 rounded-lg flex items-center gap-2 transition-colors text-xs lg:text-lg shadow-lg shadow-green-600/30 cursor-pointer disabled:cursor-not-allowed">
                <Dices size={20} /> PLACE BET
              </button>
              <WalletConnect
                notify={(message, type) => {
                  setNotification(message);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <BalanceModal open={isBalanceModalOpen} onClose={OnCloseBalanceModal} onDeposit={handleDeposit} onClaim={handleClaim} status={status} txHash={hash} amount={amount} setAmount={setAmount} action={action} setAction={setAction} />
    </>
  );
}