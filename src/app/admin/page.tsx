// src/app/admin/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab State: 'students' | 'upload' | 'teacher'
  const [activeTab, setActiveTab] = useState<"students" | "upload" | "teacher">("students");

  // Form States
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [grade, setGrade] = useState("11th"); // First Year or Second Year
  const [chapter, setChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [studentMsg, setStudentMsg] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);

  // Default Admin Access Key
  const ADMIN_SECRET_KEY = "admin123";

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_SECRET_KEY) {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("❌ Incorrect admin password!");
    }
  };

  // 1. Create Student Logic
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentMsg("");
    setLoadingStudent(true);

    try {
      const res = await fetch("/api/create-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber, name, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setStudentMsg("✅ " + data.message);
        setRollNumber("");
        setName("");
        setPassword("");
      } else {
        setStudentMsg("❌ " + (data.error || "Failed to register student"));
      }
    } catch (err) {
      setStudentMsg("❌ Server connection error");
    } finally {
      setLoadingStudent(false);
    }
  };

  // 2. Upload Word (.docx) Book Logic
  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !chapter) {
      setUploadMsg("❌ Please provide file and book title");
      return;
    }

    setUploadMsg("");
    setLoadingBook(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);
    formData.append("grade", grade);
    formData.append("title", chapter);

    try {
      const res = await fetch("/api/upload-book", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadMsg("✅ " + data.message);
        setChapter("");
        setFile(null);
      } else {
        setUploadMsg("❌ " + (data.error || "Failed to upload book"));
      }
    } catch (err) {
      setUploadMsg("❌ Server connection error");
    } finally {
      setLoadingBook(false);
    }
  };

  // IF NOT AUTHENTICATED: Show Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Admin Login (AI Biology Teacher)</h1>
            <p className="text-xs text-gray-500 mt-1">Uswa College Bhowana</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Admin Password (Admin Key)
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full p-3 text-sm border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 text-center font-bold">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 text-sm rounded-xl transition shadow"
            >
              Access Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: Show Admin Control Panel
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-blue-900 text-white p-6 rounded-2xl shadow flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Uswa College Bhowana - Admin Control Panel</h1>
            <p className="text-xs text-blue-200 mt-0.5">Director: Asad Raza Qazi | Principal: Ghulam Abbas Bhatti</p>
          </div>
          <button
            onClick={() => setIsAdminAuthenticated(false)}
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-2 rounded-lg font-bold transition"
          >
            Logout
          </button>
        </header>

        {/* 3 Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white rounded-xl p-1.5 shadow-xs gap-2">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition text-center ${
              activeTab === "students"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            👨‍🎓 Registered Student
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition text-center ${
              activeTab === "upload"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📚 Upload Biology Book
          </button>

          <button
            onClick={() => setActiveTab("teacher")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition text-center ${
              activeTab === "teacher"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            👨‍🏫 Use AI Teacher
          </button>
        </div>

        {/* TAB 1: Registered Student Form */}
        {activeTab === "students" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
              👨‍🎓 Register New Student
            </h2>
            <form onSubmit={handleCreateStudent} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. USWA-2026-001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Password
                </label>
                <input
                  type="text"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loadingStudent}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
              >
                {loadingStudent ? "Saving Student..." : "Save Student"}
              </button>

              {studentMsg && (
                <p className="text-xs text-center font-semibold mt-2">{studentMsg}</p>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: Upload Complete Word Book Form */}
        {activeTab === "upload" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">
              📚 Upload Biology Textbook (.docx)
            </h2>
            <form onSubmit={handleUploadBook} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Biology">Biology (بائیالوجی)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Class / Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="11th">11th Grade (First Year)</option>
                  <option value="12th">12th Grade (Second Year)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Book Title / Chapter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Biology First Year Official Textbook"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Word Document File (.docx / .doc)
                </label>
                <input
                  type="file"
                  accept=".docx,.doc"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs p-2 border rounded-lg bg-gray-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loadingBook}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
              >
                {loadingBook ? "Processing and saving book..." : "Upload Book"}
              </button>

              {uploadMsg && (
                <p className="text-xs text-center font-semibold mt-2">{uploadMsg}</p>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: Use Teacher Link */}
        {activeTab === "teacher" && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center space-y-4">
            <div className="text-4xl">👨‍🏫</div>
            <h2 className="text-base font-bold text-gray-800">Use AI Biology Teacher Dashboard</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Navigate directly to the AI Biology Teacher dashboard to ask questions and test responses for Uswa College students.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-8 rounded-xl transition shadow"
              >
                Go to AI Teacher Dashboard ➔
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}