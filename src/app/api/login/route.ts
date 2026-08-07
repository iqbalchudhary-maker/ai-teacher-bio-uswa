import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rollNo, password } = body;

    if (!rollNo || !password) {
      return NextResponse.json(
        { success: false, message: "Roll number and password are required." },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: {
        rollNumber: rollNo.trim(),
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found in database." },
        { status: 401 }
      );
    }

    if (student.password !== password) {
      return NextResponse.json(
        { success: false, message: "Incorrect password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      studentId: student.rollNumber,
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}