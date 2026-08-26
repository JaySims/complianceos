import { NextResponse } from "next/server";
import { executeExecutiveAI } from "@/lib/orchestrator/aiOrchestrator";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await executeExecutiveAI({
      message: body.message ?? "",
    });

    return NextResponse.json(result);

  } catch (error) {

    return NextResponse.json(
      {
        error: "Unable to process Executive AI request.",
      },
      { status: 500 }
    );
  }
}
