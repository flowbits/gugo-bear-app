import { useState, useEffect } from "react";

const dummyMessages = [
  { user: "0xAb...91D2", message: "Red 50 $tGUGO 🔴" },
  { user: "ethKing.eth", message: "RIP my stack 😭" },
  { user: "0xFa...77eB", message: "Spin time 🌀" },
  { user: "moonrider.eth", message: "Green hit! 💸" },
  { user: "0x9c...d432", message: "Claimed faucet ✔️" },
  { user: "luckyduck.eth", message: "3 losses... ouch 😬" },
  { user: "0xDe...1A2b", message: "Going black 🔵" },
  { user: "gamblerDAO.eth", message: "Top player = beast 🥇" },
  { user: "0x4f...78C9", message: "Bonus for streaks?" },
  { user: "spinMaster.eth", message: "All in again 🚀" },
  { user: "0xBe...aF04", message: "Nice UI 👌" },
  { user: "0xCc...e29F", message: "GL everyone 🍀" },
  { user: "rouletteQueen.eth", message: "Red is hot 🔥" },
  { user: "0xDf...901B", message: "GM folks ☀️" },
  { user: "anonPlayer.eth", message: "Green again?! 👀" }
];

interface ChatMessage {
  user: string;
  message: string;
}

interface ChatProps {
  limit?: number;
  alignRight?: boolean;
}

export default function Chat({ limit, alignRight }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [
        ...prev,
        dummyMessages[msgIndex % dummyMessages.length]
      ]);
      setMsgIndex((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [msgIndex]);

  // Limit messages if prop is set
  const shownMessages = limit ? messages.slice(-limit) : messages;

  return (
    <div className={`w-full max-w-[90vw] flex flex-col h-full justify-end`}>
      <div className={`flex flex-col gap-2  ${alignRight ? "items-end" : ""}`}>
        {shownMessages.map((msg, idx) => (
          <div key={idx} className={`bg-black/20 text-white px-3 py-2 rounded-lg w-fit${alignRight ? " self-end bg-black/30" : ""}`}>
            <span className="font-bold text-yellow-300 mr-2">{msg.user}:</span>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}