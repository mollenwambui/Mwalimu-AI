// app/api/reports/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reportData = await request.json();

    // Validate required fields
    if (!reportData.title) {
      return NextResponse.json({ message: "Report title is required" }, { status: 400 });
    }

    // Check if a report with the same title already exists for this user
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: session.user.id,
        title: reportData.title,
      },
    });

    if (existingReport) {
      // Update existing report
      const updatedReport = await prisma.report.update({
        where: { id: existingReport.id },
        data: {
          studentInfo: reportData.studentInfo,
          subjects: reportData.subjects,
          personalDevelopment: reportData.personalDevelopment,
          endOfYearReport: reportData.endOfYearReport,
        },
      });

      return NextResponse.json({ 
        message: "Report updated successfully", 
        reportId: updatedReport.id 
      });
    } else {
      // Create new report
      const newReport = await prisma.report.create({
        data: {
          userId: session.user.id,
          title: reportData.title,
          studentInfo: reportData.studentInfo,
          subjects: reportData.subjects,
          personalDevelopment: reportData.personalDevelopment,
          endOfYearReport: reportData.endOfYearReport,
        },
      });

      return NextResponse.json({ 
        message: "Report created successfully", 
        reportId: newReport.id 
      });
    }
  } catch (error) {
    console.error("Save report error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}