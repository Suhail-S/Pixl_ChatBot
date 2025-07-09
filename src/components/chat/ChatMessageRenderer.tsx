"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/store/chatStore";

export const ChatMessageRenderer: React.FC<{ message: ChatMessage }> = ({ message }) => {
  switch (message.type) {
    case "options":
    case "form":
    case "custom":
      return <>{message.payload}</>;
    case "text":
    default:
      return (
        <ReactMarkdown
          components={{
            p: (props) => (
              <p className="prose prose-invert break-words text-xs" {...props} />
            ),
          }}
        >
          {message.text || ""}
        </ReactMarkdown>
      );
  }
};

export default ChatMessageRenderer;
