import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, imageUrl } = await request.json();

    if (!email || !imageUrl) {
      return NextResponse.json(
        { error: "Email and image URL are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { email },
      data: { image: imageUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user image:", error);
    return NextResponse.json(
      { error: "Failed to update user image" },
      { status: 500 }
    );
  }
} 