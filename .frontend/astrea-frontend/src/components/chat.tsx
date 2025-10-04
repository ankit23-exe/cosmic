import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Bot, User } from 'lucide-react';
import Graph3DModal from './Graph3DModal';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Props to let consumers hook custom send handler or customize the initial message
interface ChatProps {
  onSendMessage?: (message: string) => Promise<string> | string;
  initialMessage?: string;
}

const Chat: React.FC<ChatProps> = ({
  onSendMessage,
  initialMessage = "Hello! I'm Cosmic AI, your exploration assistant. How can I help you navigate the universe of knowledge today?",
}: ChatProps) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q')?.trim();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: initialMessage,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoSentRef = useRef(false);
  const lastResponseRef = useRef<any>(null);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const lastQuestionRef = useRef<string | null>(null);
  const [isNodeQuerying, setIsNodeQuerying] = useState(false);

  // Remove the graph-derived "Links:" section from the answer text
  const sanitizeAnswer = (answer: string): string => {
    if (!answer) return answer;
    const marker = '\n\nLinks:';
    const idx = answer.indexOf(marker);
    if (idx !== -1) {
      return answer.slice(0, idx).trim();
    }
    return answer;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll only after more than the initial greeting message exists
  useEffect(() => {
    if (messages.length <= 1) return; // avoid jumping on initial open
    scrollToBottom();
  }, [messages]);

  // If there's a query param ?q=..., auto-send it once on mount
  useEffect(() => {
    const sendInitial = async () => {
      // Guard against React 18 StrictMode double-invoking effects in dev
      if (hasAutoSentRef.current || !initialQuery) return;
      hasAutoSentRef.current = true;
      // Push the user's message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: initialQuery,
        isUser: true,
        timestamp: new Date(),
      };
      lastQuestionRef.current = initialQuery;
      setMessages((prev: Message[]) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        // Always call the backend at localhost:3000/chat with JSON { question }
        const res = await fetch('http://localhost:3000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: initialQuery })
        });
        const data = await res.json();
        lastResponseRef.current = data; // store full response JSON
  const text = sanitizeAnswer(data?.answer ?? 'No answer available.');
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, aiResponse]);
      } catch (err) {
        console.error('Initial chat error:', err);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I encountered an error while connecting to the server.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    };
    sendInitial();
    // only once on mount for the initial query value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAIResponse = (): string => {
    const responses = [
      "That's a fascinating question! Let me illuminate the cosmic depths of knowledge for you...",
      "Excellent inquiry! The universe of information reveals that...",
      "Your curiosity shines bright! Here's what I've discovered in the vast expanse of data...",
      "How intriguing! Allow me to guide you through this stellar topic...",
      "What a brilliant question! The cosmic neural networks suggest...",
      "Your quest for knowledge is admirable! From the stellar database, I can tell you...",
      "That's a thought-provoking question! Let me navigate through the cosmic knowledge base...",
      "Wonderful! Your inquiry has activated my stellar processing cores. Here's what emerged...",
    ];

    const topics = [
      "This concept intertwines with quantum mechanics and the fundamental nature of reality itself.",
      "The answer spans across multiple dimensions of understanding, each more fascinating than the last.",
      "This touches on ancient wisdom while embracing cutting-edge scientific discoveries.",
      "The solution lies in the beautiful intersection of logic, creativity, and cosmic harmony.",
      "This involves complex algorithms that mirror the patterns found throughout the universe.",
      "The response encompasses both practical applications and theoretical frameworks.",
      "This connects to broader themes of innovation, discovery, and human potential.",
      "The answer involves multiple layers of analysis, each revealing deeper insights.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return `${randomResponse} ${randomTopic}`;
  };

  const handleSendMessage = async () => {
    // Prevent double submit while a request is in-flight
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

  setMessages((prev: Message[]) => [...prev, userMessage]);
    const currentInput = inputText;
    lastQuestionRef.current = currentInput;
    setInputText('');
    setIsTyping(true);

    try {
      let aiText: string;

      // Always call the backend at localhost:3000/chat with JSON { question }
      try {
        const res = await fetch('http://localhost:3000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: currentInput })
        });
        const data = await res.json();
        lastResponseRef.current = data; // store full response JSON
  aiText = sanitizeAnswer(data?.answer ?? 'No answer available.');
      } catch (e) {
        // Fallback to provided handler or local simulated response if server fails
        if (onSendMessage) {
          aiText = await Promise.resolve(onSendMessage(currentInput));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
          aiText = generateAIResponse();
        }
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev: Message[]) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Error generating response:', err);
      setIsTyping(false);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I encountered an error while processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorResponse]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // When a node is clicked in the 3D graph, auto-ask the backend for details
  const handleNodeClick = async (node: { id: string; label?: string; type?: string }) => {
    if (isNodeQuerying) return;
    setIsNodeQuerying(true);
    const subject = node.label || node.id;
    const followup = `Explain more about ${subject}.`;
    // show the follow-up as a user message and update the title context
    const userMessage: Message = {
      id: Date.now().toString(),
      text: followup,
      isUser: true,
      timestamp: new Date(),
    };
    lastQuestionRef.current = followup;
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: followup })
      });
      const data = await res.json();
      lastResponseRef.current = data;
      const aiText = sanitizeAnswer(data?.answer ?? 'No answer available.');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      }]);
      // Keep modal open and it will pick up updated graph from lastResponseRef via props
    } catch (err) {
      console.error('Node follow-up error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I couldn’t fetch more about ${subject}.`,
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsNodeQuerying(false);
      setIsTyping(false);
    }
  };

  const hasGraph = Boolean(
    lastResponseRef.current &&
    lastResponseRef.current.graph &&
    Array.isArray(lastResponseRef.current.graph.nodes) &&
    Array.isArray(lastResponseRef.current.graph.edges) &&
    lastResponseRef.current.graph.nodes.length > 0
  );

  return (
    <>
  <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(circle_at_30%_30%,#1b1f23,transparent_60%)]" />

      {/* Stars Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
  <header className="p-6 border-b border-[color:var(--border-color)] bg-[color:var(--bg-alt)]/80 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[color:var(--bg-surface)] border border-[color:var(--accent)] shadow-sm">
              <Bot className="w-5 h-5 text-[color:var(--accent)]" />
            </div>
            <h1 className="text-2xl font-semibold text-[color:var(--text-primary)] tracking-wide">Cosmic AI</h1>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </header>

        {/* Chat Messages */}
  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[color:var(--bg-root)]">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border ${message.isUser ? 'border-[color:var(--accent)] bg-[color:var(--bg-surface-alt)]' : 'border-[color:var(--border-color)] bg-[color:var(--bg-surface)]'} shadow` }>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-6 py-4 rounded-xl border transition-all duration-300 ${message.isUser ? 'bg-[color:var(--bg-surface-alt)] border-[color:var(--accent)] text-[color:var(--text-primary)] shadow-sm' : 'bg-[color:var(--bg-surface)] border-[color:var(--border-color)] text-[color:var(--text-secondary)]'} hover:border-[color:var(--accent-hover)]` }>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div className={`mt-2 text-xs opacity-60 ${message.isUser ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-end space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] shadow-sm">
                    <Bot className="w-4 h-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <div className="bg-[color:var(--bg-surface-alt)] border border-[color:var(--border-color)] px-6 py-4 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Graph CTA (appears when graph data is available) */}
        {hasGraph && (
          <div className="px-6 pt-2">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsGraphOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm shadow-lg hover:from-emerald-600 hover:to-cyan-600 transition"
                >
                  View 3D Graph
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
  <div className="p-6 border-t border-[color:var(--border-color)] bg-[color:var(--bg-alt)]/70 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything…"
                  className="neutral-input w-full px-6 py-4 placeholder-[color:var(--text-dim)]"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="neutral-button p-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {hasGraph && (
      <Graph3DModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        graph={lastResponseRef.current?.graph ?? null}
        title={`3D Graph for: ${lastQuestionRef.current ?? 'query'}`}
        onNodeClick={handleNodeClick}
      />
    )}
    </>
  );
}

export default Chat;