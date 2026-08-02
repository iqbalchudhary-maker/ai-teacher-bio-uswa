import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { rollNumber, name, password } = await req.json();

    if (!rollNumber || !name || !password) {
      return NextResponse.json(
        { error: "All information must be provided" },
        { status: 400 }
      );
    }

    // Check existing student
    const existingStudent = await db.student.findUnique({
      where: { rollNumber },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "This roll number already exists" },
        { status: 400 }
      );
    }

    // Save simple plain text password directly
    const student = await db.student.create({
      data: {
        rollNumber,
        name,
        password, // Simple Password
      },
    });

    return NextResponse.json({
      message: "Student registered successfully",
      student: { id: student.id, rollNumber: student.rollNumber, name: student.name },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while creating the student" },
      { status: 500 }
    );
  }
}