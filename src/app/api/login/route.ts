// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rollNumber, password } = body;

    // 1. Check if roll number and password are provided
    if (!rollNumber || !password) {
      return NextResponse.json(
        { error: "Please enter both roll number and password" },
        { status: 400 }
      );
    }

    // 2. Find student by roll number in the database
    const student = await db.student.findUnique({
      where: { rollNumber: rollNumber.trim() },
    });

    // If student does not exist
    if (!student) {
      return NextResponse.json(
        { error: "Incorrect roll number or password" },
        { status: 401 }
      );
    }

    // 3. Match plain text password
    if (student.password !== password) {
      return NextResponse.json(
        { error: "Incorrect roll number or password" },
        { status: 401 }
      );
    }

    // 4. Generate session token for login
    const token = await signToken({
      id: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
    });

    const response = NextResponse.json({
      message: "Login successful",
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
      },
    });

    // 5. Save cookie and grant access
    response.cookies.set("student_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Days
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "An error occurred on the server" },
      { status: 500 }
    );
  }
}