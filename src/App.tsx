import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Cloud, Wind, Thermometer, MapPin, Loader2, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { runAgent, ChatMessage } from "./services/geminiService";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Hello! I'm your AI Weather Agent. Ask me about the weather anywhere in the world!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await runAgent(input, messages);
      const modelMessage: ChatMessage = { role: "model", content: response };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error running agent:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Cloud size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">MCP Weather Agent</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Powered by Gemini & Open-Meteo</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Thermometer size={18} />
            <Wind size={18} />
            <MapPin size={18} />
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto px-6 py-8 pb-32">
        <div className="space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-sm text-gray-500 font-medium italic">Agent is retrieving weather data...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f5f5f5] via-[#f5f5f5] to-transparent">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about the weather in London, Tokyo, or New York..."
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 pr-16 shadow-xl shadow-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">
            Model Context Protocol Demonstration • Gemini 3 Flash
          </p>
        </div>
      </footer>
    </div>
  );
}
