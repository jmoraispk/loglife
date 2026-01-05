import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
    const vapiPrivateKey = process.env.VAPI_PRIVATE_KEY;

    if (!vapiPrivateKey) {
      return NextResponse.json(
        { error: 'VAPI_PRIVATE_KEY is not configured' },
        { status: 500 }
      );
    }

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }

    // Fetch assistant from VAPI API
    const response = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${vapiPrivateKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch assistant: ${errorText}` },
        { status: response.status }
      );
    }

    const assistant = await response.json();

    // Extract system prompt from model.messages
    const systemMessage = assistant.model?.messages?.find(
      (msg: { role: string }) => msg.role === 'system'
    );

    if (!systemMessage || !systemMessage.content) {
      return NextResponse.json(
        { error: 'System prompt not found in assistant configuration' },
        { status: 404 }
      );
    }

    const currentPrompt = systemMessage.content;
    
    // Get user habits from backend API
    // Extract token from request (we'll pass it as a query parameter from the client)
    const token = request.nextUrl.searchParams.get("token");
    
    let habitsText = "";
    if (token) {
      try {
        // Call backend API to get user habits
        const backendUrl = process.env.PY_BACKEND_URL || "http://127.0.0.1:5001/webhook";
        const baseUrl = backendUrl.replace("/webhook", "");
        const habitsResponse = await fetch(
          `${baseUrl}/user-habits?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json",
            },
          }
        );
        
        if (habitsResponse.ok) {
          const habitsData = await habitsResponse.json();
          habitsText = habitsData.habits || "";
        } else {
          console.error("Failed to fetch user habits:", habitsResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching user habits:", error);
        // Continue without habits if there's an error
      }
    }
    
    // Prepend habits to the start of the system prompt
    const modifiedPrompt = habitsText ? `${habitsText}${currentPrompt}` : currentPrompt;
    
    // Create modified messages array with updated system prompt
    // This will be passed via assistantOverrides.model.messages (per-call only, doesn't update saved assistant)
    const modifiedMessages = assistant.model.messages.map((msg: { role: string; content: string }) => 
      msg.role === 'system' 
        ? { ...msg, content: modifiedPrompt }
        : msg
    );

    // Return the full model structure needed for assistantOverrides
    // VAPI requires provider and other model properties when overriding messages
    const modelOverride = {
      provider: assistant.model.provider,
      model: assistant.model.model,
      messages: modifiedMessages,
      // Include other model properties if they exist (temperature, etc.)
      ...(assistant.model.temperature !== undefined && { temperature: assistant.model.temperature }),
      ...(assistant.model.maxTokens !== undefined && { maxTokens: assistant.model.maxTokens }),
      ...(assistant.model.topP !== undefined && { topP: assistant.model.topP }),
    };

    return NextResponse.json({
      originalPrompt: currentPrompt,
      modifiedPrompt: modifiedPrompt,
      model: modelOverride,
    });
  } catch (error) {
    console.error('Error fetching assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

