import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCheer = async (score: number, gameName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, exciting, and funny congratulatory message for a child who just scored ${score} points in a typing game called "${gameName}". Keep it under 15 words. Use emojis.`,
    });
    return response.text || "Great job! You are a typing superstar! 🌟";
  } catch (error) {
    console.error("Gemini cheer error:", error);
    return "Awesome job! Keep practicing! 🚀";
  }
};

export const generatePracticeWords = async (allowedLetters: string[], focusLetters: string[]): Promise<string[]> => {
  try {
    // Filter out punctuation for word generation to avoid confusion
    const allowedStr = allowedLetters.filter(c => /^[a-z]$/i.test(c)).join(', ');
    const focusStr = focusLetters.filter(c => /^[a-z]$/i.test(c)).join(', ');

    // If we only have punctuation or very few letters, fallback handles it
    if (allowedStr.length === 0) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a list of 10 simple, child-friendly real words.
      Rules:
      1. Use ONLY these letters: ${allowedStr}.
      2. Try to include these letters if possible: ${focusStr}.
      3. Return a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return []; 
    return JSON.parse(jsonText) as string[];

  } catch (error) {
    console.error("Gemini word gen error:", error);
    return []; 
  }
};