import React, { useState } from "react";
import Sidebar from "../components/chatbot/ChatSideBar";
import MainChat from "@/components/chatbot/MainChat";

const ChatbotPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex justify-end">
      <div className="max-w-[1920px] mx-auto w-full p-4 sm:p-6 md:p-12 xl:p-[100px]">
        <MainChat />
      </div>
    <div className="absolute xsm:relative">
        <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </div>
    </div>
  );
};

export default ChatbotPage;
