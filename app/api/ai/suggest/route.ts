import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getAllTasksAndDependencies } from '@/lib/db/queries';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Only active Gemini models: lead with flash-lite for high free-tier availability
const MODELS_TO_TRY = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();

    if (!tasks || tasks.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const { dependencies: existingDeps } = await getAllTasksAndDependencies();

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

    let suggestions: any[] = [];

    for (const modelName of MODELS_TO_TRY) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
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
                      description: 'The ID of the task that must be completed first',
                    },
                    successorId: {
                      type: Type.STRING,
                      description: 'The ID of the task that is blocked',
                    },
                    reason: {
                      type: Type.STRING,
                      description: 'Brief explanation of why this dependency exists',
                    },
                  },
                  required: ['predecessorId', 'successorId', 'reason'],
                },
              },
            },
          });

          const textOutput = response.text?.trim() ?? '[]';
          suggestions = JSON.parse(textOutput);
          break;
        } catch (error: any) {
          if (error?.status === 404) break;
          if (attempt < 2) {
            await delay(attempt * 1000);
          }
        }
      }
      if (suggestions.length > 0) break;
    }

    // Heuristic fallback if models are congested
    if (suggestions.length === 0) {
      for (let i = 0; i < tasks.length - 1; i++) {
        suggestions.push({
          predecessorId: tasks[i].id,
          successorId: tasks[i + 1].id,
          reason: `Sequential lifecycle dependency between ${tasks[i].title} and ${tasks[i + 1].title}`,
        });
      }
    }

    // Filter out suggestions that ALREADY exist in the database or are self-referential
    const filteredSuggestions = suggestions.filter((s) => {
      if (!s.predecessorId || !s.successorId) return false;
      if (s.predecessorId === s.successorId) return false;
      const alreadyExists = existingDeps.some(
        (d) => d.predecessorId === s.predecessorId && d.successorId === s.successorId
      );
      return !alreadyExists;
    });

    return NextResponse.json({ suggestions: filteredSuggestions });
  } catch (error) {
    console.error('AI Suggestion Handler Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
