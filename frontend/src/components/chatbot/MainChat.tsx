// import { Mic, Paperclip, Send, Sparkles } from "lucide-react";
// import { Input } from "../ui/Input";
// import { Button } from "../ui/Button";
// import { Card, CardContent } from "../ui/Card";
// // import { DropdownSection } from "./DropDown";

// function MainChat() {
//   const quickActions = [
//       {
//       label: "Govenment structure",
//       sub: "Explore Government hierarchy",
//     },
//     {
//       label: "Smart Search",
//       sub: "Find notes instantly",
//     },

//     {
//       label: "Organized Categories",
//       sub: "Navigate by folder",
//     },
//     {
//       label: "Trending Notes",
//       sub: "See popular materials",
//     },
//     {
//       label: "Save & Bookmark",
//       sub: "Quick access later",
//     },
//   ];

//   return (
//     <div className="">
//       <header className="mb-2 sm:mb-4 md:mb-6 xl:mb-10">
//         <h1 className="font-popins text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-medium xl:mb-2 leading-tight">
//           Hey, <span className="text-[#2EF2B8]">Dilshan</span>
//         </h1>
//         <p className="font-popins text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">
//           How Can I Assist You Today?
//         </p>
//       </header>

//       {/* Message box */}
//       <div className="flex items-center w-full bg-[#0D1520] bg-opacity-70 border border-[#34495E]/40 rounded-full px-2 sm:px-4 py-1 sm:py-2 xl:py-3 backdrop-blur-md">
//         <Sparkles className="opacity-60 w-4 sm:w-5" />
//         <Input
//           placeholder="Message with…"
//           className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:opacity-40 text-sm"
//         />
//         <div className="flex items-center gap-2">
//           <Paperclip
//             className="cursor-pointer opacity-70 hover:opacity-100 w-4 sm:w-5"
//           />
//           <Mic
//             className="cursor-pointer opacity-70 hover:opacity-100 w-4 sm:w-5"
//           />
//           <Button
//             variant="ghost"
//             // size="icon"
//             className="hover:bg-transparent"
//           >
//             <Send className="w-4 sm:w-5" />
//           </Button>
//         </div>
//       </div>

//       {/* Quick actions */}
//       <div className="mt-6 xl:mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         {quickActions.map((qa) => (
//           <Card
//             key={qa.label}
//             className="bg-[#0D1520]/80 border-[#34495E]/40 text-left hover:ring-1 hover:ring-[#2EF2B8]/50 transition-all"
//           >
//             <CardContent className="p-2 md:p-4">
//               <h3 className="text-xs lg:text-sm font-semibold md:mb-1">{qa.label}</h3>
//               <p className="text-xs opacity-60 leading-snug">{qa.sub}</p>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default MainChat;

import { useState } from "react";
import { Mic, Paperclip, Send, Sparkles } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import axios from "axios";
import { FormEvent } from "react";

interface ChatEntry {
  user: string;
  bot: string | { answer: string; sources?: string[] };
  sources?: string[];
}

function MainChat() {
  const quickActions = [
    {
      label: "Government structure",
      sub: "Explore Government hierarchy",
    },
    {
      label: "Smart Search",
      sub: "Find notes instantly",
    },
    {
      label: "Organized Categories",
      sub: "Navigate by folder",
    },
    {
      label: "Trending Notes",
      sub: "See popular materials",
    },
    {
      label: "Save & Bookmark",
      sub: "Quick access later",
    },
  ];

  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<ChatEntry[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      setResponses((prev) => [
        ...prev,
        { user: message, bot: "", sources: [] },
      ]);

      // Use { question: message } to match the backend
      const res = await axios.post(`${import.meta.env.VITE_SERVER_API}/ask`, {
        question: message,
      });

      if (res.status !== 200) throw new Error("Failed to get response");

      const botResponse = res.data;

      console.log("Bot response:", botResponse.response);

      setResponses((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            bot: botResponse.answer.response || botResponse,
            sources: botResponse.sources || [],
          },
        ];
      });
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };
  console.log("Responses are:", responses);

  return (
    <div className="">
      <header className="mb-2 sm:mb-4 md:mb-6 xl:mb-10">
        <h1 className="font-popins text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-medium xl:mb-2 leading-tight">
          Hey, <span className="text-[#2EF2B8]">Dilshan</span>
        </h1>
        <p className="font-popins text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium">
          How Can I Assist You Today?
        </p>
      </header>

      {/* Chat history and response display */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        {responses.map((r, i) => (
          <div key={i} className="mb-3">
            <div className="ml-auto w-fit bg-[#2EF2B8]/10 border border-[#2EF2B8]/20 rounded-lg px-4 py-2 mb-2 text-xl">
              {r.user}
            </div>

            {r.bot && (
              <div className="bg-[#0D1520]/70 border border-[#34495E]/40 rounded-lg px-4 py-2 whitespace-pre-line text-xl">
                {typeof r.bot === "string" ? r.bot : JSON.stringify(r.bot)}
              </div>
            )}
          </div>
        ))}
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      </div>

      {/* Message box */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center w-full bg-[#0D1520] bg-opacity-70 border border-[#34495E]/40 rounded-full px-2 sm:px-4 py-1 sm:py-2 xl:py-3 backdrop-blur-md">
          <Sparkles className="opacity-60 w-4 sm:w-5" />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message with…"
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:opacity-40 text-sm"
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <Paperclip className="cursor-pointer opacity-70 hover:opacity-100 w-4 sm:w-5" />
            <Mic className="cursor-pointer opacity-70 hover:opacity-100 w-4 sm:w-5" />
            <Button
              type="submit"
              variant="ghost"
              className="hover:bg-transparent"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-spin">↻</span>
              ) : (
                <Send className="w-4 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Quick actions */}
      <div className="mt-6 xl:mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickActions.map((qa) => (
          <Card
            key={qa.label}
            className="bg-[#0D1520]/80 border-[#34495E]/40 text-left hover:ring-1 hover:ring-[#2EF2B8]/50 transition-all"
          >
            <CardContent className="p-2 md:p-4">
              <h3 className="text-xs lg:text-sm font-semibold md:mb-1">
                {qa.label}
              </h3>
              <p className="text-xs opacity-60 leading-snug">{qa.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MainChat;
