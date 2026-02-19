import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Call backend API to validate token
    const backendUrl = process.env.PY_BACKEND_URL || "http://127.0.0.1:5001/webhook";
    const baseUrl = backendUrl.replace("/webhook", "");
    const validateResponse = await fetch(
      `${baseUrl}/validate-token?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!validateResponse.ok) {
      return NextResponse.json(
        { valid: false, error: "Failed to validate token" },
        { status: validateResponse.status }
      );
    }

    const data = await validateResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

