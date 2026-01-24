import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, User, RefreshCw, Info, HelpCircle, TrendingUp } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { marketIndicators, sectorData, stocks } from '@/data/stockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
  
    // Initialize messages from localStorage or default
    useEffect(() => {
      const savedMessages = localStorage.getItem('lasa_chat_history');
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (e) {
          setDefaultWelcome();
        }
      } else {
        setDefaultWelcome();
      }
    }, []);
  
    const setDefaultWelcome = () => {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I am your LASA Finance AI assistant. 🚀\n\nI can help you analyze market metrics, explain financial terms, or guide you through the dashboard features. What would you like to know?',
          timestamp: new Date(),
        },
      ]);
    };
  
    // Persist messages
    useEffect(() => {
      if (messages.length > 0) {
        localStorage.setItem('lasa_chat_history', JSON.stringify(messages));
      }
    }, [messages]);
  
    useEffect(() => {
      if (scrollRef.current) {
        // Use requestAnimationFrame to ensure the DOM has updated before scrolling
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
    }, [messages, isTyping, isOpen]);


  const generateResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    // 1. Stock Queries
    const foundStock = stocks.find(s => 
      q.includes(s.symbol.toLowerCase()) || q.includes(s.name.toLowerCase())
    );

    if (foundStock) {
      let sectorInfo = "";
      for (const [sector, sectorStocks] of Object.entries(sectorData)) {
        const stockInData = sectorStocks.find(s => s.symbol === foundStock.symbol);
        if (stockInData) {
          sectorInfo = `It's in the ${sector} sector. Currently, it has a support level at ₹${stockInData.support} and resistance at ₹${stockInData.resistance}.`;
          break;
        }
      }
      return `I found details for **${foundStock.name} (${foundStock.symbol})**. ${sectorInfo} The overall trend for this sector is looking stable based on our latest telemetry.`;
    }

    // 2. Market Indicators
    if (q.includes('rsi')) {
      return `The **Relative Strength Index (RSI)** is currently at **${marketIndicators.rsi.value}**. This suggests the market is in a **${marketIndicators.rsi.verdict}** state. Generally, an RSI above 70 indicates overbought conditions, while below 30 is oversold.`;
    }

    if (q.includes('sentiment') || q.includes('mood') || q.includes('fear') || q.includes('greed')) {
      return `Overall market sentiment is **${marketIndicators.overall.verdict}** with a confidence score of **${marketIndicators.overall.value}/100**. The breakdown shows ${marketIndicators.sentiment.buy}% Bulls, ${marketIndicators.sentiment.sell}% Bears, and ${marketIndicators.sentiment.hold}% Neutral players.`;
    }

    if (q.includes('ml') || q.includes('machine learning') || q.includes('prediction')) {
      return `Our Machine Learning model is currently **${marketIndicators.ml.verdict}** with a **${marketIndicators.ml.confidence}% confidence level**. It analyzes over 50 technical parameters to predict short-term momentum.`;
    }

    // 3. Website Help / Features
    if (q.includes('how to') || q.includes('use') || q.includes('help') || q.includes('features')) {
      return `LASA Dashboard offers three main sections:\n1. **Market Dashboard**: High-level overview of indicators.\n2. **Stock Analysis**: Deep dive into specific stocks with interactive charts.\n3. **Sector Analysis**: Comparative view of different market segments.\n\nYou can navigate using the top bar!`;
    }

    if (q.includes('about') || q.includes('what is lasa') || q.includes('who are you')) {
      return `LASA (Live Analytics & Sentiment Analysis) is a next-gen financial dashboard designed to provide real-time market insights using technical indicators and machine learning. I'm your virtual assistant here to make sense of all that data!`;
    }

    // 4. Financial Definitions
    if (q.includes('support') || q.includes('resistance')) {
      return `**Support** is the price level where a downtrend tends to pause due to a concentration of demand. **Resistance** is the level where an uptrend pauses due to a concentration of supply. Our charts highlight these levels automatically for you!`;
    }

    if (q.includes('ema')) {
      return `**EMA (Exponential Moving Average)** is a type of moving average that places a greater weight and significance on the most recent data points. We use EMA 20, 50, and 200 to identify trends.`;
    }

    // 5. Greetings
    if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
      return "Hello! I'm LASA AI. How can I help you navigate the markets today? You can ask me about specific stocks, market sentiment, or how to use this dashboard.";
    }

    if (q.includes('thank')) {
      return "You're very welcome! Feel free to ask if you have more doubts. Happy trading! 📈";
    }

    // 6. Fallback
    return "I'm not quite sure about that specific query, but I can tell you that the current market mood is " + marketIndicators.overall.verdict + " with an RSI of " + marketIndicators.rsi.value + ". Would you like to know more about a specific stock or sector?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking with variable delay
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(currentInput),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, delay);
  };

  const clearChat = () => {
    localStorage.removeItem('lasa_chat_history');
    setDefaultWelcome();
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen ? 'bg-destructive hover:bg-destructive/90 rotate-90' : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accent"></span>
            </span>
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] max-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <GlassCard 
            className="h-[550px] overflow-hidden border-primary/20 shadow-2xl backdrop-blur-xl p-0 flex flex-col"
            contentClassName="h-full flex flex-col"
          >
              {/* Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-primary/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">LASA Intelligence</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">System Functional</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={clearChat} title="Clear conversation">
                    <RefreshCw className="h-4 w-4 opacity-50 hover:opacity-100" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4 opacity-50" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
                <ScrollArea className="flex-1 min-h-0 h-full w-full" viewportRef={scrollRef}>
                <div className="space-y-6 p-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex items-center gap-2 mb-1.5 px-1 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                          m.role === 'user' 
                            ? 'bg-primary/20 border-primary/30' 
                            : 'bg-secondary border-border'
                        }`}>
                          {m.role === 'user' ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                          {m.role === 'user' ? 'Guest' : 'LASA Expert'}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-secondary/80 border border-border/50 dark:bg-white/[0.03] dark:border-white/10 rounded-tl-none backdrop-blur-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center border bg-secondary border-border">
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">LASA Expert</span>
                      </div>
                      <div className="bg-secondary/50 border border-border/50 dark:bg-white/[0.03] dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] backdrop-blur-sm">
                        <div className="flex gap-1.5 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Suggestions */}
              {!isTyping && messages.length < 4 && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
                  {['RSI status?', 'Top stocks?', 'About LASA'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); handleSend(); }}
                      className="text-[11px] bg-primary/10 border border-primary/20 rounded-full px-3 py-1 whitespace-nowrap hover:bg-primary/20 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-secondary/20 dark:bg-white/[0.02] backdrop-blur-md flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="relative group"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about stocks, RSI, or help..."
                    className="w-full bg-background border border-border rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isTyping}
                    className={`absolute right-1.5 top-1.5 h-9 w-9 rounded-xl transition-all duration-300 ${
                      input.trim() ? 'bg-primary scale-100 opacity-100' : 'bg-muted scale-90 opacity-0 pointer-events-none'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-[9px] text-center mt-3 text-muted-foreground/60 uppercase tracking-widest font-medium">
                  Powered by LASA Intelligence Engine
                </p>
              </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};
