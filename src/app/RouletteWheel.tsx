"use client";

import React, { useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';


const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), {
    ssr: false,
});

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const getNumberInfo = (num: number) => {
    const details: { [key: number]: { color: 'red' | 'black' | 'green' } } = {
        0: { color: 'green' }, 1: { color: 'red' }, 2: { color: 'black' }, 3: { color: 'red' }, 4: { color: 'black' }, 5: { color: 'red' }, 6: { color: 'black' }, 7: { color: 'red' }, 8: { color: 'black' }, 9: { color: 'red' }, 10: { color: 'black' }, 11: { color: 'black' }, 12: { color: 'red' }, 13: { color: 'black' }, 14: { color: 'red' }, 15: { color: 'black' }, 16: { color: 'red' }, 17: { color: 'black' }, 18: { color: 'red' }, 19: { color: 'red' }, 20: { color: 'black' }, 21: { color: 'red' }, 22: { color: 'black' }, 23: { color: 'red' }, 24: { color: 'black' }, 25: { color: 'red' }, 26: { color: 'black' }, 27: { color: 'red' }, 28: { color: 'black' }, 29: { color: 'black' }, 30: { color: 'red' }, 31: { color: 'black' }, 32: { color: 'red' }, 33: { color: 'black' }, 34: { color: 'red' }, 35: { color: 'black' }, 36: { color: 'red' },
    };
    return details[num];
};


interface RouletteWheelProps {
    // phase: string | undefined;
    // winning_number: number | undefined | null;
    mustSpin: boolean;
    prizeNumber: number;
    spin_id: any;
    setMustSpin: (value: boolean) => void;
}


const RouletteWheelComponent = ({  spin_id, mustSpin, prizeNumber, setMustSpin }: RouletteWheelProps) => {
    // const [mustSpin, setMustSpin] = useState(false);
    // const [prizeNumber, setPrizeNumber] = useState(0);

    const wheelData = useMemo(() => {
        return WHEEL_NUMBERS.map(num => {
            const { color } = getNumberInfo(num);
            return {
                option: `${num}`,
                style: {
                    backgroundColor: color === 'red' ? '#df3423' : color === 'black' ? '#3e3e3e' : '#00a000',
                    textColor: '#ffffff',
                }
            };
        });
    }, []);

    // useEffect(() => {
    //     if (phase === 'SPINNING') {
    //         const winningIndex = WHEEL_NUMBERS.indexOf(winning_number ?? 0);
    //         setPrizeNumber(winningIndex === -1 ? 0 : winningIndex);
    //         setMustSpin(true);
    //     }
    // }, [phase, winning_number, spin_id]); 

    return (
        <Wheel
            key={spin_id} 
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={wheelData}
            onStopSpinning={() => {
                setMustSpin(false); 
            }}
            innerRadius={5}
            innerBorderColor='#ffffff'
            disableInitialAnimation={true}
            innerBorderWidth={2}
            outerBorderColor='#ffffff'
            outerBorderWidth={4}
        />
    );
};

export const RouletteWheel = memo(RouletteWheelComponent);