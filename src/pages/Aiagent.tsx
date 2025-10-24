'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FiSend,
  FiTrash2,
  FiRefreshCcw,
  FiDatabase,
  FiSettings,
  FiGrid,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const CHAT_HISTORY_LIMIT = 10;

export default function SQLAgentChat() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('sqlAgentChat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTool, setCurrentTool] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toolPhases = [
    { icon: <FiSettings />, label: 'Calling Schema' },
    { icon: <FiDatabase />, label: 'Reading Database' },
    { icon: <FiGrid />, label: 'Analyzing Tables' },
  ];

  useEffect(() => {
    localStorage.setItem(
      'sqlAgentChat',
      JSON.stringify(messages.slice(-CHAT_HISTORY_LIMIT))
    );
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (loading) {
      setCurrentTool(0);
      const interval = setInterval(() => {
        setCurrentTool(prev =>
          prev < toolPhases.length - 1 ? prev + 1 : prev
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const apiUrl = import.meta.env.VITE_API_URL;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const historyForAPI = updatedMessages
        .slice(-CHAT_HISTORY_LIMIT)
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
        .join('\n');

      const { data } = await axios.post(`${apiUrl}/sqlagent`, {
        messages: historyForAPI,
      });

      const botMessage = { sender: 'bot', text: data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setTimeout(() => setLoading(false), 800);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearChat = () => {
    localStorage.removeItem('sqlAgentChat');
    setMessages([]);
  };

  const renderMessage = (msg: any, index: number) => {
    const isBot = msg.sender === 'bot';
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}
      >
        <div
          className={`mb-3 px-3 sm:px-4 py-2 sm:py-3 max-w-[90vw] sm:max-w-[85%] text-[15px] rounded-2xl break-words ${
            isBot ? 'bg-[#1c1c1c] text-gray-100' : 'bg-accent text-white'
          }`}
        >
          {isBot ? <MarkdownRenderer content={msg.text} /> : msg.text}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-gray-100 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1e1e1e] bg-background/90 backdrop-blur-md">
        <h1 className="text-base ml-10 font-semibold text-gray-100 tracking-wide">
          SQL AI
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-100 transition-colors"
            title="Clear Chat"
          >
            <FiTrash2 size={18} />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-100 transition-colors"
            title="Restart"
          >
            <FiRefreshCcw size={18} />
          </button>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-5 md:px-7 py-4 sm:py-6 flex flex-col space-y-4 scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center text-gray-400"
            >
              <div className="text-4xl mb-3">💬</div>
              <div className="text-lg font-medium text-gray-300">
                Start a conversation
              </div>
              <p className="text-sm text-gray-500 mt-1 max-w-full sm:max-w-xs">
                Ask anything about SQL queries or database logic.<br />
                <span className="text-gray-400 italic">
                  e.g. “Write a query to find top 5 customers by revenue”
                </span>
              </p>
            </motion.div>
          )}

          {messages.map(renderMessage)}

          {/* Tool-calling indicator */}
          {loading && (
            <motion.div
              key="tool-line"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start w-full"
            >
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1a1a1a] rounded-full px-4 py-2 shadow-sm">
                <motion.span
                  key={currentTool}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-gray-500">
                    {toolPhases[currentTool].icon}
                  </span>
                  <span>{toolPhases[currentTool].label}</span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ...
                  </motion.span>
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      {/* Input area */}
      <div className="sticky bottom-0 left-0 w-full bg-background backdrop-blur-lg  p-2 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 min-w-[0] w-full sm:w-auto bg-[#1a1a1a] text-gray-100 text-[15px] px-4 py-3 rounded-xl border border-[#2a2a2a] focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/60 placeholder-gray-500 transition-all"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="p-3 bg-accent hover:bg-[#007aff] rounded-xl flex items-center justify-center disabled:opacity-50 transition-all"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
