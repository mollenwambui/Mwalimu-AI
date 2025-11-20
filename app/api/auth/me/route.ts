// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    // Check if session exists and is not expired
    if (!session) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    if (session.expires < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id }
      });
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = session.user;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}