"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import mermaid from "mermaid";

interface Message {
  id?: string;
  role: "user" | "assistant";
  text: string;
  translatedText?: string;
  isTranslating?: boolean;
  showDiagram?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] = useState("Biology 11th");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentId, setStudentId] = useState<string>("default_roll_no");

  // Cookie-based Authentication Protection (Prevents infinite redirect loop)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };

      const rollNo = getCookie("studentRollNo");

      if (!rollNo) {
        router.push("/login");
      } else {
        setStudentId(rollNo);
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Welcome to Uswa College Bhowana! I am your AI Biology Professor. Which chapter or topic would you like to cover today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Question State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  }, []);

  useEffect(() => {
    mermaid.contentLoaded();
  }, [messages]);

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

    if (isAuthenticated && studentId && studentId !== "default_roll_no") {
      fetchStudentSessions();
    }
  }, [isAuthenticated, studentId]);

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
        text: `Welcome! I am your AI Professor for ${selectedSubject}. Which chapter or topic would you like to start today?`,
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
    utterance.lang = "en-US";

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(index);
    window.speechSynthesis.speak(utterance);
  };

  // Manual Translation Handler (Roman Urdu)
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
        const finalTranslation = data.translation || data.reply || "";
        
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === index
              ? { ...msg, translatedText: finalTranslation, isTranslating: false }
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

  // Toggle Diagram Visibility
  const handleToggleDiagram = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, showDiagram: !msg.showDiagram } : msg
      )
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage("");

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

        const finalMessages: Message[] = [
          ...newMessages,
          { role: "assistant", text: replyText },
        ];

        setMessages(finalMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Edit Question Handler
  const handleEditSubmit = async (index: number) => {
    if (!editText.trim()) return;
    
    const truncatedMessages = messages.slice(0, index);
    setMessages(truncatedMessages);
    setEditingIndex(null);
    setEditingIndex(null);
    setInputMessage(editText);
    setEditText("");

    const userText = editText;
    const newMessages: Message[] = [...truncatedMessages, { role: "user", text: userText }];
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

        setMessages([...newMessages, { role: "assistant", text: replyText }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      document.cookie = "studentRollNo=; path=/; max-age=0";
    }
    router.push("/login");
  };

  // Show loading state while checking authentication to prevent redirect loops
  if (!isAuthenticated) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-slate-100 text-slate-700 font-bold text-sm">
        Verifying student session...
      </div>
    );
  }

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
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md border border-blue-500 shrink-0 overflow-hidden">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-white truncate">Uswa College</span>
            <span className="text-[10px] text-blue-400 font-medium">Bhowana</span>
          </div>
        </div>

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
            Recent Chats
          </div>
          {sessions.length === 0 ? (
            <div className="text-slate-500 italic px-2 text-[11px]">No saved chats yet.</div>
          ) : (
            sessions.map((session: any, index: number) => (
              <button
                key={`${session.id}-${index}`}
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

            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold shadow-xs overflow-hidden">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex flex-col text-left">
              <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">
                Uswa College Bhowana
              </h1>
              <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">
                AI Biology Learning Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">📚 Subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="Biology 11th">Biology 11th</option>
                <option value="Biology 12th">Biology 12th</option>
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
          {messages.map((msg, index) => {
            const hasDiagram = msg.role === "assistant" && msg.text.includes("```mermaid");

            return (
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
                  {msg.role === "user" ? (
                    <div>
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs outline-none border border-blue-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSubmit(index)}
                              className="bg-white text-blue-600 px-3 py-1 rounded font-bold text-xs hover:bg-blue-50 cursor-pointer"
                            >
                              Save & Submit
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="bg-blue-700 text-white px-3 py-1 rounded text-xs hover:bg-blue-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-4">
                          <div className="whitespace-pre-wrap leading-relaxed font-sans text-left text-xs md:text-sm">
                            {msg.text}
                          </div>
                          <button
                            onClick={() => {
                              setEditingIndex(index);
                              setEditText(msg.text);
                            }}
                            className="text-blue-200 hover:text-white text-[11px] underline shrink-0 cursor-pointer font-medium"
                            title="Edit Question"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5 font-sans leading-relaxed text-slate-800 text-left">
                      {msg.text.split("\n").map((line, lineIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;

                        if (trimmed.startsWith("```mermaid") || trimmed.startsWith("```") || (hasDiagram && trimmed.includes("-->"))) {
                          return null;
                        }

                        const cleanLine = trimmed.replace(/^#{1,6}\s*/, "");
                        const isHeading = trimmed.startsWith("#") || trimmed.startsWith("**") || trimmed.endsWith(":");

                        return (
                          <div
                            key={lineIdx}
                            className={`${
                              isHeading
                                ? "font-bold text-blue-900 text-sm md:text-base mt-3 border-l-4 border-blue-600 pl-3 bg-blue-50/50 py-1 rounded-r-lg text-left"
                                : "text-slate-700 text-xs md:text-sm pl-1 text-left"
                            }`}
                          >
                            {cleanLine.replace(/\*\*/g, "")}
                          </div>
                        );
                      })}

                      {hasDiagram && msg.showDiagram && (
                        <div className="my-4 p-4 bg-slate-50 border border-blue-200 rounded-xl overflow-x-auto text-center">
                          <div className="mermaid">
                            {msg.text.split("```mermaid")[1]?.split("```")[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.translatedText && (
                    <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-50/90 p-3 md:p-4 rounded-xl text-slate-900 font-medium text-sm leading-relaxed shadow-inner">
                      <span className="text-blue-700 font-bold block mb-1 text-xs tracking-wide">🌐 Roman Urdu Translation:</span>
                      <div className="text-slate-800 text-xs md:text-sm">
                        {msg.translatedText}
                      </div>
                    </div>
                  )}

                  {msg.role === "assistant" && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-start gap-3 text-xs flex-wrap">
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
                        🌐 {msg.isTranslating ? "Translating..." : msg.translatedText ? "Hide Roman Urdu" : "Show Roman Urdu"}
                      </button>

                      {hasDiagram && (
                        <button
                          onClick={() => handleToggleDiagram(index)}
                          className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold cursor-pointer transition bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200"
                        >
                          🎨 {msg.showDiagram ? "Hide Diagram" : "Show Diagram"}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          alert("Answer copied to clipboard!");
                        }}
                        className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-bold cursor-pointer transition bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        📋 Copy Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-500 animate-pulse shadow-xs">
                AI Professor is generating lecture...
              </div>
            </div>
          )}
        </div>

        {/* CHAT INPUT AREA */}
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