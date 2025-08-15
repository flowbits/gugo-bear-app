import { useEffect, useRef } from "react";

interface ChatMessage {
  username: string;
  message: string;
  wallet_address?: string;
}

interface ChatProps {
  limit?: number;
  alignRight?: boolean;
  messages: ChatMessage[];
  isChatOpen?: boolean;
  user_wallet_address?: string;
}

export default function Chat({
  limit,
  alignRight,
  messages = [],
  isChatOpen = false,
  user_wallet_address
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shownMessages = isChatOpen ? messages : (limit ? messages.slice(-limit) : messages);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  return (
    <div className="w-full max-w-[90vw] flex flex-col h-full justify-end">
      <div
        className={`
          flex flex-col gap-2
          ${alignRight ? "items-end" : ""}
          ${isChatOpen
            ? "h-[400px] overflow-y-auto md:p-1 rounded-lg bg-black/60 min-[1024]:bg-black/40 custom-scrollbar"
            : ""
          }
        `}
      >
        {shownMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`
              bg-black/30 text-white px-3 py-2 rounded-lg w-fit
              ${alignRight ? "self-end bg-black/30" : ""}
            `}
          >
            <span className="font-bold text-yellow-300 mr-2">{
              msg?.wallet_address === user_wallet_address ? "You" : msg.username?.length <=20 ? msg.username : `${msg.username.slice(0, 6)}...${msg.username.slice(-4)}`
              }:</span>
            <span>{msg.message}</span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}