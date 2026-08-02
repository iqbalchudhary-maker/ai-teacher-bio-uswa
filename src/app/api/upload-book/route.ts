import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string || file?.name.replace(/\.[^/.]+$/, "") || "Untitled Textbook";
    const subject = formData.get("subject") as string || "Biology";
    const grade = formData.get("grade") as string || "11th"; // 11th یا 12th (First Year / Second Year)

    if (!file) {
      return NextResponse.json(
        { error: "Please select a Word (.docx) file." },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract Raw Text from Docx file using Mammoth
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the file." },
        { status: 400 }
      );
    }

    // Save directly to Database using Prisma with grade field
    const newBook = await db.book.create({
      data: {
        title,
        subject,
        grade,
        content: extractedText,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Biology textbook uploaded and saved successfully!",
      book: {
        id: newBook.id,
        title: newBook.title,
        subject: newBook.subject,
        grade: newBook.grade,
      },
    });
  } catch (error: any) {
    console.error("Docx Upload Error:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the book: " + error.message },
      { status: 500 }
    );
  }
}