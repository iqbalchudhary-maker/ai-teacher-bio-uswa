"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Message {
  id?: string;
  role: "user" | "assistant";
  text: string;
  translatedText?: string;
  isTranslating?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] = useState("Biology");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Identification
  const [studentId, setStudentId] = useState("student_uswa_01");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Welcome to Uswa College Bhowana! I am your AI Biology Professor. Which chapter or topic would you like to cover today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [wasVoiceInput, setWasVoiceInput] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // 1. Fetching chat history for the logged-in student from Neon DB
  useEffect(() => {
    const fetchStudentSessions = async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_sessions",
            studentId: studentId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error("Failed to load sessions from DB", err);
      }
    };

    if (studentId) {
      fetchStudentSessions();
    }
  }, [studentId]);

  // 2. Loading messages for a previous session
  const loadSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setIsSidebarOpen(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_messages",
          sessionId: session.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.messages) {
        const loadedMsgs: Message[] = data.messages.map((m: any) => ({
          role: m.role,
          text: m.text,
        }));
        setMessages(loadedMsgs);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
    setMessages([
      {
        role: "assistant",
        text: `Welcome! I am your AI Biology Professor for ${selectedSubject}. Which chapter or topic would you like to start today?`,
      },
    ]);
  };

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
          isListeningRef.current = false;
          setWasVoiceInput(true);
        };

        recognition.onerror = () => {
          setIsListening(false);
          isListeningRef.current = false;
        };

        recognition.onend = () => {
          setIsListening(false);
          isListeningRef.current = false;
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Please use Google Chrome for voice input support.");
      return;
    }

    try {
      if (isListeningRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        isListeningRef.current = false;
      } else {
        recognitionRef.current.start();
      }
    } catch (err) {
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const speakText = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    if (isSpeaking === index) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const hasUrdu = /[\u0600-\u06FF]/.test(text);
    utterance.lang = hasUrdu ? "ur-PK" : "en-US";

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(index);
    window.speechSynthesis.speak(utterance);
  };

  // Manual Translation Handler
  const handleToggleTranslateMessage = async (index: number) => {
    const targetMsg = messages[index];

    if (targetMsg.translatedText) {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === index ? { ...msg, translatedText: undefined } : msg
        )
      );
      return;
    }

    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, isTranslating: true } : msg))
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: targetMsg.text,
          action: "translate_to_urdu",
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        const finalUrduText = data.translation || data.reply || "";
        
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === index
              ? { ...msg, translatedText: finalUrduText, isTranslating: false }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg, i) => (i === index ? { ...msg, isTranslating: false } : msg))
        );
      }
    } catch (err) {
      console.error("Translation failed", err);
      setMessages((prev) =>
        prev.map((msg, i) => (i === index ? { ...msg, isTranslating: false } : msg))
      );
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    const isVoiceInputTurn = wasVoiceInput;

    setInputMessage("");
    setWasVoiceInput(false);

    const newMessages: Message[] = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          subject: selectedSubject,
          sessionId: currentSessionId,
          studentId: studentId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const replyText = data.reply || data.text;
        if (data.sessionId && !currentSessionId) {
          setCurrentSessionId(data.sessionId);
          setSessions((prev) => [
            { id: data.sessionId, title: userText, createdAt: new Date().toLocaleDateString() },
            ...prev,
          ]);
        }

        const newAssistantIndex = newMessages.length;
        const finalMessages: Message[] = [
          ...newMessages,
          { role: "assistant", text: replyText },
        ];

        setMessages(finalMessages);

        if (isVoiceInputTurn) {
          setTimeout(() => {
            speakText(replyText, newAssistantIndex);
          }, 300);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="flex h-dvh w-screen bg-slate-100 text-left overflow-hidden" dir="ltr">
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* LEFT SIDEBAR FOR CHAT HISTORY */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-2"
          >
            ➕ New Chat Session
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden ml-2 text-slate-400 hover:text-white p-1 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs">
          <div className="text-slate-400 font-semibold mb-2 px-2 text-[11px] uppercase tracking-wider">
            Your Previous Lectures
          </div>
          {sessions.length === 0 ? (
            <div className="text-slate-500 italic px-2 text-[11px]">No saved chats yet.</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session)}
                className={`w-full text-left p-2.5 rounded-lg text-xs truncate transition cursor-pointer flex items-center justify-between ${
                  currentSessionId === session.id
                    ? "bg-slate-800 text-blue-400 font-semibold border border-slate-700"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span className="truncate">💬 {session.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Uswa College Bhowana | SM Tech AI
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-slate-50">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center justify-between gap-2 shadow-xs shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold"
            >
              ☰
            </button>
            
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.jpeg" 
                alt="Uswa College Logo" 
                width={36} 
                height={36} 
                className="rounded-full object-cover border border-slate-200 shadow-xs" 
              />
              <div className="flex flex-col text-left">
                <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">
                  Uswa College Bhowana
                </h1>
                <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">
                  AI Biology Learning Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">📚 Class:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-sm sm:max-w-none"
              >
                <option value="Biology">Biology (General)</option>
                <option value="11th Biology">11th Grade (First Year)</option>
                <option value="12th Biology">12th Grade (Second Year)</option>
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-2.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              🚪 <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-100/70">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[95%] md:max-w-[80%] rounded-2xl p-4 md:p-5 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none font-normal text-left"
                    : "bg-white border border-slate-200 text-slate-900 rounded-bl-none text-left"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-2.5 font-sans leading-relaxed text-slate-800 text-left">
                    {msg.text.split("\n").map((line, lineIdx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;

                      const isHeading = trimmed.startsWith("**") || trimmed.startsWith("1.") || trimmed.startsWith("-") || trimmed.endsWith(":");

                      return (
                        <div
                          key={lineIdx}
                          className={`${
                            isHeading
                              ? "font-bold text-blue-900 text-sm md:text-base mt-3 border-l-4 border-blue-600 pl-3 bg-blue-50/50 py-1 rounded-r-lg text-left"
                              : "text-slate-700 text-xs md:text-sm pl-1 text-left"
                          }`}
                        >
                          {trimmed.replace(/\*\*/g, "")}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-left text-xs md:text-sm">
                    {msg.text}
                  </div>
                )}

                {msg.translatedText && (
                  <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-50/90 p-3 md:p-4 rounded-xl text-slate-900 font-medium text-sm leading-loose shadow-inner" dir="rtl">
                    <span className="text-blue-700 font-bold block mb-2 text-xs tracking-wide text-left" dir="ltr">🌐 Urdu Translation:</span>
                    <div className="font-urdu text-right text-slate-800 text-xs md:text-sm" style={{ fontFamily: "Jameel Noori Nastaleeq, Noto Nastaliq Urdu, sans-serif" }}>
                      {msg.translatedText}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-start gap-4 text-xs">
                    <button
                      onClick={() => speakText(msg.text, index)}
                      className="flex items-center gap-1 text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      {isSpeaking === index ? "⏹️ Stop" : "🔊 Listen"}
                    </button>

                    <button
                      onClick={() => handleToggleTranslateMessage(index)}
                      disabled={msg.isTranslating}
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer transition bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      🌐 {msg.isTranslating ? "Translating..." : msg.translatedText ? "Hide Urdu" : "Show Urdu"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-500 animate-pulse shadow-xs">
                AI Biology Professor is generating lecture...
              </div>
            </div>
          )}
        </div>

        {/* CHAT INPUT AREA (Sticky & Fully Visible on Mobile) */}
        <div className="bg-white border-t border-slate-300 p-3 md:p-4 shrink-0 shadow-md z-20">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 md:p-3 rounded-xl border font-bold text-sm transition flex items-center justify-center cursor-pointer shrink-0 ${
                isListening
                  ? "bg-red-600 text-white animate-bounce border-red-600 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="Voice Input"
            >
              {isListening ? "🔴" : "🎙️"}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question or click mic..."
              className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition text-left"
            />

            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}