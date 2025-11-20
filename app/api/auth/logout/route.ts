// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies(); // ⭐ FIXED

    const sessionToken = cookieStore.get("session-token")?.value;

    if (sessionToken) {
      await prisma.session.delete({
        where: { sessionToken },
      });
    }

    const response = NextResponse.json({ success: true });

    // Clear cookie
    response.cookies.set("session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
