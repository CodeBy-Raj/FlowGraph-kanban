import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();

    if (!tasks || tasks.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Map tasks to a lightweight payload for the prompt context
    const taskContext = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
    }));

    const prompt = `Analyze the following software engineering tasks. Suggest logical execution dependencies based on standard development lifecycle practices.
    Only suggest Finish-to-Start relationships (Task A must finish before Task B starts).
    Return an array of dependencies using the exact task IDs provided.
    
    Tasks:
    ${JSON.stringify(taskContext, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              predecessorId: { 
                type: Type.STRING,
                description: "The ID of the task that must be completed first"
              },
              successorId: { 
                type: Type.STRING,
                description: "The ID of the task that is blocked"
              },
              reason: { 
                type: Type.STRING,
                description: "Brief explanation of why this dependency exists"
              }
            },
            required: ["predecessorId", "successorId", "reason"],
          },
        },
      }
    });

    const textOutput = response.text ?? '[]';
    const suggestions = JSON.parse(textOutput);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
