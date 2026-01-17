import { GoogleGenAI, Type } from "@google/genai";
import { QuestionCard } from "../types";

// Safety: This file is currently not used in the UI, but we remove process.env
// to prevent browser crashes if it gets imported.
const apiKey = ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateQuestion = async (topic: string = 'general knowledge'): Promise<QuestionCard> => {
  if (!apiKey) {
    return {
      type: 'question',
      text: 'API Key ontbreekt. Stel een key in om de AI te gebruiken.',
      answer: 'Configuratie Fout'
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
      text: "Fout bij genereren vraag.",
      answer: "Error"
    };
  }
};