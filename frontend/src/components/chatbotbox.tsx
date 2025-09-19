// src/components/Chatbot.tsx
import React, { useState } from "react";
import { IoIosArrowDropdown} from "react-icons/io";
import chatbot from "../assets/images/bot1.png";

const Chatbot: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
 

  const toggleChatbot = () => {
    setIsExpanded(!isExpanded);
  };




  return (
    <div
      className={`fixed bottom-8 right-8 z-50 py-5 ${
        isExpanded ? "border rounded-xl" : ""
      } `}
    >
      <div
        className={`${
          isExpanded ? "w-80 h-96" : "w-20 h-20"
        }  rounded-lg px-4  transition-all duration-300 ease-in-out`}
      >
        {/* Chatbot Header */}
        <div className="flex justify-between items-center cursor-pointer">
          <div className="flex items-center ">
            {isExpanded && (
              <img
                src={chatbot}
                alt="AI Sprint Chatbot"
                className="w-16 h-16 rounded-full"
              />
            )}
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleChatbot}
              className="text-gray-600 hover:text-blue-500 ml-2 flex items-center"
            >
              {isExpanded ? (
                <IoIosArrowDropdown size={24} className="mr-2" />
              ) : (
                // <IoIosArrowUp size={24} className="mr-2" />

                <div className=" w-28 h-28  p-1">
                  <img src={chatbot} className="mr-2 w-full h-full" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Chatbox */}
        {isExpanded && (
          <div className="mt-4 h-60 overflow-auto bg-gray-50 p-2 rounded-xl shadow-inner">
            {/* Chat content */}
            <div className="flex flex-col space-y-4">
              <div className="p-3  text-blue-800 ">
                Hello! How can I assist you today?
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className=" flex items-center mt-5">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-full">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;