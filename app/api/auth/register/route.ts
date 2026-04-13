import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUserStore } from "@/lib/userStore";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    // Validate input
    if (!email || !name || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get user store and check if user exists
    const users = getUserStore();
    if (users.has(email)) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user-${Date.now()}`;
    users.set(email, {
      id: userId,
      email,
      name,
      password: hashedPassword,
      role: "none",
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: userId,
          email,
          name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
