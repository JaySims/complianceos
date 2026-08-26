import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;

    const organization = await prisma.organization.findUnique({
      where: {
        id: decoded.organizationId,
      },
      include: {
        documents: true,
        assessments: true,
        users: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message: "Organization not found",
        },
        { status: 404 }
      );
    }

    const recommendations =
      await prisma.recommendation.findMany({
        where: {
          userId: decoded.id,
        },
      });

    return NextResponse.json({
      success: true,
      organization,
      recommendations,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard.",
      },
      { status: 500 }
    );
  }
}
