"use client";

// eslint-disable @typescript-eslint/no-unused-vars


import React, { useState, useMemo } from 'react';
import { Dices, CircleDollarSign, RotateCcw, X } from 'lucide-react';
// import { Wheel } from 'react-custom-roulette';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), {
  ssr: false,
});

type BetType = 'straight' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3';

interface NumberInfo {
  num: number;
  color: 'red' | 'black' | 'green';
  column?: 1 | 2 | 3;
  dozen?: 1 | 2 | 3;
}

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const NUMBER_DETAILS: { [key: number]: NumberInfo } = {
  0: { num: 0, color: 'green' },
  1: { num: 1, color: 'red', column: 1, dozen: 1 }, 2: { num: 2, color: 'black', column: 2, dozen: 1 }, 3: { num: 3, color: 'red', column: 3, dozen: 1 },
  4: { num: 4, color: 'black', column: 1, dozen: 1 }, 5: { num: 5, color: 'red', column: 2, dozen: 1 }, 6: { num: 6, color: 'black', column: 3, dozen: 1 },
  7: { num: 7, color: 'red', column: 1, dozen: 1 }, 8: { num: 8, color: 'black', column: 2, dozen: 1 }, 9: { num: 9, color: 'red', column: 3, dozen: 1 },
  10: { num: 10, color: 'black', column: 1, dozen: 1 }, 11: { num: 11, color: 'black', column: 2, dozen: 1 }, 12: { num: 12, color: 'red', column: 3, dozen: 1 },
  13: { num: 13, color: 'black', column: 1, dozen: 2 }, 14: { num: 14, color: 'red', column: 2, dozen: 2 }, 15: { num: 15, color: 'black', column: 3, dozen: 2 },
  16: { num: 16, color: 'red', column: 1, dozen: 2 }, 17: { num: 17, color: 'black', column: 2, dozen: 2 }, 18: { num: 18, color: 'red', column: 3, dozen: 2 },
  19: { num: 19, color: 'red', column: 1, dozen: 2 }, 20: { num: 20, color: 'black', column: 2, dozen: 2 }, 21: { num: 21, color: 'red', column: 3, dozen: 2 },
  22: { num: 22, color: 'black', column: 1, dozen: 2 }, 23: { num: 23, color: 'red', column: 2, dozen: 2 }, 24: { num: 24, color: 'black', column: 3, dozen: 2 },
  25: { num: 25, color: 'red', column: 1, dozen: 3 }, 26: { num: 26, color: 'black', column: 2, dozen: 3 }, 27: { num: 27, color: 'red', column: 3, dozen: 3 },
  28: { num: 28, color: 'black', column: 1, dozen: 3 }, 29: { num: 29, color: 'black', column: 2, dozen: 3 }, 30: { num: 30, color: 'red', column: 3, dozen: 3 },
  31: { num: 31, color: 'black', column: 1, dozen: 3 }, 32: { num: 32, color: 'red', column: 2, dozen: 3 }, 33: { num: 33, color: 'black', column: 3, dozen: 3 },
  34: { num: 34, color: 'red', column: 1, dozen: 3 }, 35: { num: 35, color: 'black', column: 2, dozen: 3 }, 36: { num: 36, color: 'red', column: 3, dozen: 3 },
};

const PAYOUTS: { [key in BetType]: number } = {
  straight: 35, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
  dozen1: 2, dozen2: 2, dozen3: 2, column1: 2, column2: 2, column3: 2,
};

const CHIP_VALUES = [1, 5, 10, 25, 100];
const CHIP_COLORS: { [key: number]: string } = {
  1: 'bg-blue-500 border-blue-300', 5: 'bg-red-600 border-red-400',
  10: 'bg-green-500 border-green-300', 25: 'bg-gray-800 border-gray-500',
  100: 'bg-purple-600 border-purple-400'
};

// --- HELPER FUNCTIONS ---
const getNumberInfo = (num: number): NumberInfo => {

  if (num == -1) num = 0;
  return NUMBER_DETAILS[num]
}

// --- SVG ICONS ---
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

const BettingTable = ({ onBet, bets, isSpinning }: { onBet: (type: BetType, value: any) => void, bets: { [key: string]: number }, isSpinning: boolean }) => {
  const renderBetChip = (key: string) => bets[key] ? <BetChip amount={bets[key]} /> : null;
  const handleBet = (type: BetType, value: any) => !isSpinning && onBet(type, value);

  const numberRows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
  ];

  return (
    <div className="p-2 bg-green-800 rounded-lg shadow-lg w-full max-w-4xl border-4 border-green-900/50">
      <div className="grid grid-cols-[auto_1fr] gap-1">
        <div className="relative">
          <button onClick={() => handleBet('straight', 0)} disabled={isSpinning} className="w-16 h-full bg-green-700 hover:bg-green-600 text-white font-bold text-2xl rounded-l-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50">
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
                      <button onClick={() => handleBet('straight', num)} disabled={isSpinning} className="w-full h-14 text-white font-bold text-sm transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/10">
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
                <button onClick={() => handleBet(`column${col}` as BetType, col)} disabled={isSpinning} className="w-16 h-full bg-green-700 hover:bg-green-600 text-white font-bold text-sm rounded-r-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50">
                  2:1{renderBetChip(`column${col}`)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div className="relative"><button onClick={() => handleBet('dozen1', '1-12')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">1st 12{renderBetChip('dozen1')}</button></div>
        <div className="relative"><button onClick={() => handleBet('dozen2', '13-24')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">2nd 12{renderBetChip('dozen2')}</button></div>
        <div className="relative"><button onClick={() => handleBet('dozen3', '25-36')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">3rd 12{renderBetChip('dozen3')}</button></div>
      </div>
      <div className="grid grid-cols-6 gap-1 mt-1">
        <div className="relative"><button onClick={() => handleBet('low', '1-18')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">1 to 18{renderBetChip('low')}</button></div>
        <div className="relative"><button onClick={() => handleBet('even', 'even')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">EVEN{renderBetChip('even')}</button></div>
        <div className="relative"><button onClick={() => handleBet('red', 'red')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"><RedDiamond />{renderBetChip('red')}</button></div>
        <div className="relative"><button onClick={() => handleBet('black', 'black')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"><BlackDiamond />{renderBetChip('black')}</button></div>
        <div className="relative"><button onClick={() => handleBet('odd', 'odd')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">ODD{renderBetChip('odd')}</button></div>
        <div className="relative"><button onClick={() => handleBet('high', '19-36')} disabled={isSpinning} className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50">19 to 36{renderBetChip('high')}</button></div>
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

export default function RouletteGamePage() {
  const [balance, setBalance] = useState(1000);
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [selectedChip, setSelectedChip] = useState<number>(1);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number>(-1);
  const [lastNumbers, setLastNumbers] = useState<(number | null)[]>([]);
  const [notification, setNotification] = useState('');

  const totalBet = useMemo(() => Object.values(bets).reduce((acc, amount) => acc + amount, 0), [bets]);
  console.log({bets, totalBet, balance, selectedChip});
  const handleBet = (type: BetType, value: any) => {
    if (spinning || balance < selectedChip) {
      if (balance < selectedChip) setNotification("Not enough balance!");
      return;
    }
    const key = `${type}-${value}`;
    setBalance(prev => prev - selectedChip);
    setBets(prev => ({ ...prev, [key]: (prev[key] || 0) + selectedChip }));
  };

  const handleSpin = () => {
    if (totalBet === 0) {
      setNotification("Place a bet to spin!");
      return;
    }
    // setWinningNumber(null);

    const winNum = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];


    setWinningNumber(winNum);
    setNotification('');
    setSpinning(true);

    // Conclude the spin after the animation finishes
    // setTimeout(() => {
    //   setLastNumbers(prev => [...prev, winNum]);
    //   calculateWinnings(winNum);
    //   setSpinning(false);
    // }, 9000); // Must be > wheel transition duration (8s)
  };

  const calculateWinnings = (winNum: number) => {
    let winnings = 0;
    const winInfo = getNumberInfo(winNum);

    for (const key in bets) {
      const [type, value] = key.split('-');
      const amount = bets[key];
      let isWin = false;

      switch (type as BetType) {
        case 'straight': if (parseInt(value) === winNum) isWin = true; break;
        case 'red': if (winInfo.color === 'red') isWin = true; break;
        case 'black': if (winInfo.color === 'black') isWin = true; break;
        case 'even': if (winNum !== 0 && winNum % 2 === 0) isWin = true; break;
        case 'odd': if (winNum !== 0 && winNum % 2 !== 0) isWin = true; break;
        case 'low': if (winNum >= 1 && winNum <= 18) isWin = true; break;
        case 'high': if (winNum >= 19 && winNum <= 36) isWin = true; break;
        case 'dozen1': if (winNum >= 1 && winNum <= 12) isWin = true; break;
        case 'dozen2': if (winNum >= 13 && winNum <= 24) isWin = true; break;
        case 'dozen3': if (winNum >= 25 && winNum <= 36) isWin = true; break;
        case 'column1': if (winInfo.column === 1) isWin = true; break;
        case 'column2': if (winInfo.column === 2) isWin = true; break;
        case 'column3': if (winInfo.column === 3) isWin = true; break;
      }
      if (isWin) {
        winnings += amount + amount * PAYOUTS[type as BetType];
      }
    }

    if (winnings > 0) {
      setBalance(prev => prev + winnings);
      setNotification(`Winning number: ${winNum}! You won $${winnings.toLocaleString()}!`);
    } else {
      setNotification(`Winning number: ${winNum}. Better luck next time!`);
    }
    setBets({});
  };

  const clearBets = () => {
    if (spinning) return;
    setBalance(prev => prev + totalBet);
    setBets({});
    setNotification('Bets cleared.');
  };

  return (
    <div className="min-h-screen bg-green-800 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-green-900/50 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <Notification message={notification} onClear={() => setNotification('')} />
      <LastNumbers numbers={lastNumbers} />
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 z-10">
        <div className="flex-shrink-0 flex flex-col items-center gap-6 pt-8">
          {/* <RouletteWheel spinning={spinning} winningNumber={winningNumber} /> */}
          <Wheel
            mustStartSpinning={spinning}
            prizeNumber={
              WHEEL_NUMBERS.indexOf(winningNumber) !== -1 ? WHEEL_NUMBERS.indexOf(winningNumber) : 0
            }
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
                    textSize: 18,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'normal',

                  }
                };
              })
            }
            backgroundColors={['#3e3e3e', '#df3423']}
            textColors={['#ffffff']}
            onStopSpinning={() => {
              setSpinning(false);
              if (winningNumber === null) return;
              setLastNumbers(prev => [...prev, winningNumber]);
              calculateWinnings(winningNumber);
            }}
          />
          <div className="bg-black/50 p-4 rounded-lg text-center shadow-lg min-h-[60px] w-full max-w-sm">
            {spinning && <p className="text-xl text-yellow-400 animate-pulse">Spinning...</p>}
            {winningNumber !== null && !spinning && (
              <p className="text-2xl font-bold animate-fade-in">
                Number: <span className={getNumberInfo(winningNumber).color === 'red' ? 'text-red-500' : getNumberInfo(winningNumber).color === 'black' ? 'text-gray-300' : 'text-green-500'}>{winningNumber == -1? 'Bet and Spin' : winningNumber
                }</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex-grow flex items-start justify-center gap-4">
          <BettingTable onBet={handleBet} bets={bets} isSpinning={spinning} />
          <div className="flex flex-col items-center gap-3 bg-black/30 p-3 rounded-lg sticky top-4">
            <span className="text-gray-300 font-bold text-sm">CHIP</span>
            {CHIP_VALUES.map(value => (
              <button key={value} onClick={() => setSelectedChip(value)} className={`w-12 h-12 rounded-full font-bold text-white text-sm border-4 transition-all duration-200 ${CHIP_COLORS[value]} ${selectedChip === value ? 'border-yellow-400 scale-110' : 'border-transparent hover:border-white/50'}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 z-30">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-lg">
            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
              <span className="text-gray-400">Bet:</span>
              <span className="font-bold text-yellow-400">${totalBet.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
              <CircleDollarSign className="text-green-400" size={24} />
              <span className="font-bold text-green-400">${balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={clearBets} disabled={spinning || totalBet === 0} className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
              <RotateCcw size={20} /> Clear
            </button>
            <button onClick={handleSpin} disabled={spinning || totalBet === 0} className="bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors text-lg shadow-lg shadow-green-600/30">
              <Dices size={24} /> SPIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


