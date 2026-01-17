import { GoogleGenAI, Type } from "@google/genai";
import { QuestionCard } from "../types";

// NOTE: In a real production app, never expose API keys on the client.
// However, for this localized demo/prototype, we access it from env.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateQuestion = async (topic: string = 'general knowledge'): Promise<QuestionCard> => {
  if (!apiKey) {
    return {
      type: 'question',
      text: 'API Key missing. Please set process.env.API_KEY to generate real questions.',
      answer: 'Configuration Error'
    };
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `Generate a random trivia question or a fun group task (minigame) related to: ${topic}.
    If it is a question, provide the answer.
    Output JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['question', 'task'] },
            text: { type: Type.STRING, description: "The question or task instruction" },
            answer: { type: Type.STRING, description: "The answer if it is a question" }
          },
          required: ['type', 'text']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as QuestionCard;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      type: 'question',
      text: "Who is the Greek god of the sea?",
      answer: "Poseidon (Fallback question due to API error)"
    };
  }
};