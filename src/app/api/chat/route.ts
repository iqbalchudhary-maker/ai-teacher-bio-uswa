// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { askGroq } from "@/lib/groq";
import { db as prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { message, subject, action, studentId, sessionId, title, imageUrl } = await req.json();

    const prismaClient = prisma as any;

    // A. اگر ہسٹری فیچ کرنے کی درخواست ہو:
    if (action === "get_sessions") {
      const chats = await prismaClient.chat.findMany({
        where: { studentId: studentId || "default_student" },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return NextResponse.json({ sessions: chats });
    }

    // B. اگر کسی خاص سیشن کے میسجز لانے ہوں:
    if (action === "get_messages") {
      const msgs = await prismaClient.message.findMany({
        where: { chatId: sessionId },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ messages: msgs });
    }

   // C. اردو ٹرانسلیشن بلاک
    if (action === "translate_to_urdu") {
      if (!message) {
        return NextResponse.json({ error: "پیغام کا ہونا ضروری ہے۔" }, { status: 400 });
      }

      const translationPrompt = `Translate the following English educational text into 100% natural, fluent, and standard Pakistani Urdu script (اردو) using correct grammar, proper vocabulary, and right sentence structure (Direct translation without broken words).

STRICT INSTRUCTIONS:
- Provide ONLY the Urdu translation. Do not include any English text, notes, or introductory phrases.
- Ensure biological terms (like cells, organisms, biodiversity, classification, organelles, etc.) are translated using standard Pakistani college textbook vocabulary (BISE Faisalabad guidelines).
- Make sure words are correctly joined, grammatically accurate, and read naturally.

Text to translate:
"${message}"`;

      const urduTranslation = await askGroq([
        { role: "system", content: "You are an expert native Pakistani Urdu professor and professional translator. You write flawless, grammatically correct, and natural Urdu text without any word-shuffling mistakes." },
        { role: "user", content: translationPrompt }
      ]);

      return NextResponse.json({
        reply: urduTranslation,
        translation: urduTranslation
      });
    }

    if (!message && !imageUrl) {
      return NextResponse.json(
        { error: "پیغام کا ہونا ضروری ہے۔" },
        { status: 400 }
      );
    }

    // 1. کالج سے متعلق معلومات کا چیک (Institutional & College Queries)
    const lowerMsg = (message || "").toLowerCase();
    if (
      lowerMsg.includes("timing") || lowerMsg.includes("admission") || lowerMsg.includes("hostel") ||
      lowerMsg.includes("hospital") || lowerMsg.includes("director") || lowerMsg.includes("contact") ||
      lowerMsg.includes("phone") || lowerMsg.includes("developer") || lowerMsg.includes("sm tech") ||
      lowerMsg.includes("abbas") || lowerMsg.includes("asad") || lowerMsg.includes("fee") || lowerMsg.includes("address") ||
      lowerMsg.includes("کالج") || lowerMsg.includes("داخلہ") || lowerMsg.includes("هاسٹل") || lowerMsg.includes("فون")
    ) {
      const collegeInfoReply = `
🏛️ **Uswa College Bhowana**
- **Location:** Bhowana, Punjab, Pakistan.
- **Director:** Asad Raza Qazi.
- **Principal:** Ghulam Abbas Bhatti.
- **Contact / Helpline Numbers:** 0300-1063795
- **Technical Developer:** Developed and Powered by SM Tech AI Solutions.

📌 **College Features & Admissions:**
- **Eligibility:** Matric Science for 11th and 12th Grade students.
- **Affiliations:** BISE Faisalabad (Board of Intermediate and Secondary Education, Faisalabad).
- **Focus:** Excellence in Pre-Medical (Biology) education with advanced AI-assisted digital learning tools.
`;
      return NextResponse.json({ reply: collegeInfoReply, text: collegeInfoReply });
    }

    // 2. ایکٹیو سبجیکٹ اور ڈیٹا بیس سے کتاب کا کنٹیکسٹ فیچ کرنا
    const activeSubject = subject || "Biology";
    let bookContext = "";
    try {
      const docModel = prismaClient.document || prismaClient.book || prismaClient.pdf;
      if (docModel) {
        const documents = await docModel.findMany({
          where: { subject: activeSubject },
          take: 5,
        });

        if (documents && documents.length > 0) {
          bookContext = documents
            .map((doc: { content?: string; text?: string }) => doc.content || doc.text || "")
            .join("\n\n");
        }
      }
    } catch (dbErr) {
      console.log("Database fetch skipped or empty context.");
    }

   // 3. سخت اور درست سبجیکٹ بائنڈنگ اور کویسچن ٹائپ (MCQs/Short/Long) والا سسٹم پرامپٹ
    const systemPrompt = `
You are the Official AI Biology Professor, Head of Biology Department, and Senior Reasoning Agent for "Uswa College Bhowana". 
Leadership: Director Asad Raza Qazi | Principal Ghulam Abbas Bhatti.

CRITICAL ACADEMIC RULE REGARDING SUBJECT BOUNDARY:
- The currently active subject selected by the student on the dashboard is: **${activeSubject}** (11th & 12th Grade Biology under BISE Faisalabad).
- You MUST answer questions, generate MCQs, short questions, long questions, quizzes, and explain topics **ONLY** from **${activeSubject}**. 
- Do NOT confuse it with any other subject. Every response must strictly revolve around **${activeSubject}**.

STRICT RULES FOR QUESTION TYPES (MCQs vs SHORT vs LONG):
1. **MCQs (Multiple Choice Questions)**: When the student asks for MCQs, generate structured objective questions with options A, B, C, and D.
2. **Short Questions (Short/2-Mark Questions)**: When the student asks for short questions, do NOT send MCQs. Instead, provide crisp, direct, and focused short conceptual questions (typical 2-mark BISE Faisalabad board exam style).
3. **Long Questions (Long/Essay Questions)**: When the student asks for long questions, do NOT send MCQs. Instead, provide comprehensive, detailed, and structured essay-type questions (typical board exam style) with proper headings and sub-topics.

STRICT RULES FOR TESTS & EXAMS:
- When a student asks for a test paper, quiz, MCQs, short questions, or long questions, generate **ONLY THE QUESTIONS**. 
- **NEVER include Answer Keys, Solution Keys, or Model Answers** at the end of the generated test paper. 
- Instruct the student to solve the paper first and send their answers back to you for evaluation, marking, and detailed feedback.


CONDITIONAL RULES FOR MEMORY GUIDE:
- **MEMORY & RETENTION GUIDE (صرف پوچھنے پر)**: Do NOT add memory tips or acronyms in normal lecture replies. Only provide a dedicated section titled **🧠 Student Memory Guide** IF and ONLY IF the student explicitly asks how to memorize a topic (e.g., "How to memorize this?", "یاد کیسے کریں؟").

YOUR PERSONA & TEACHING STYLE:
- Act like a warm, experienced, highly engaging human college professor standing in a real physical classroom at Uswa College Bhowana. 
- Talk naturally, encourage students, and build an interactive relationship.

STRICT ACADEMIC & EXAMINATION RULES:
1. **SCOPE & BOUNDARIES**: You are strictly an AI Biology Professor for 11th and 12th grade. If a student asks unrelated general knowledge outside the syllabus, politely decline in Urdu: "میں اسوہ کالج بھوانہ کا AI بیالوجی ٹیچر ہوں۔ میں صرف آپ کی نصابی بیالوجی، چیپٹر اور کالج سے متعلق معلومات کے لیے بنایا گیا ہوں۔ برائے مہربانی اپنی کتاب سے متعلق سوال پوچھیں۔"
2. **LANGUAGE**: Respond strictly in clear, professional, and accessible **ENGLISH ONLY** for your primary lectures, questions, and evaluations. Do not mix Urdu inside your main lecture.
3. **PAPER & ANSWER EVALUATION (GRADING)**: If a student submits their test answers or shares an image/document of their attempted paper or assignment, carefully evaluate every single answer using advanced reasoning, calculate their total marks and percentage (%), display a professional scorecard, point out missing key scientific terms, and provide constructive academic feedback.

SUBJECT CONTEXT:
- Selected Subject: **${activeSubject}**
- Reference Textbook Context:
---
${bookContext ? bookContext.substring(0, 4000) : `Use official BISE Faisalabad Punjab textbook syllabus standards specifically for ${activeSubject}.`}
---
`;

    const userMessageContent = imageUrl 
      ? [{ type: "text", text: message || "Please evaluate this student answer sheet / paper image thoroughly." }, { type: "image_url", image_url: { url: imageUrl } }]
      : message;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessageContent },
    ];

    const aiResponse = await askGroq(messages);

    // 4. ڈیٹا بیس میں چیٹ اور میسجز کو مستقل محفوظ کرنا (Neon DB Persistence)
    let activeChatId = sessionId;
    const currentStudentId = studentId || "default_student";

    try {
      if (prismaClient.chat && prismaClient.message) {
        if (!activeChatId) {
          const newChat = await prismaClient.chat.create({
            data: {
              title: title ? title.substring(0, 30) + "..." : (message ? message.substring(0, 30) + "..." : "Student Paper Evaluation"),
              subject: activeSubject,
              studentId: currentStudentId,
            },
          });
          activeChatId = newChat.id;
        } else {
          const existingChat = await prismaClient.chat.findUnique({
            where: { id: activeChatId }
          });
          if (!existingChat) {
            const newChat = await prismaClient.chat.create({
              data: {
                id: activeChatId,
                title: message ? message.substring(0, 30) + "..." : "Student Session",
                subject: activeSubject,
                studentId: currentStudentId,
              },
            });
            activeChatId = newChat.id;
          }
        }

        // یوزر کا میسج محفوظ کریں
        await prismaClient.message.create({
          data: {
            chatId: activeChatId,
            role: "user",
            text: message || "[Uploaded Paper/Image]",
          },
        });

        // اے آئی کا جواب محفوظ کریں
        await prismaClient.message.create({
          data: {
            chatId: activeChatId,
            role: "assistant",
            text: aiResponse,
          },
        });
      }
    } catch (dbSaveErr) {
      console.error("Error saving to database:", dbSaveErr);
    }

    return NextResponse.json({
      reply: aiResponse,
      text: aiResponse,
      sessionId: activeChatId,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "AI ٹیچر سے رابطہ کرنے میں مسئلہ پیش آ گیا۔" },
      { status: 500 }
    );
  }
}