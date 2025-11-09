import { GoogleGenAI } from "@google/genai";
// FIX: Corrected the import path to point to the project root, removing the non-existent 'src' directory.
import { POLICY_DOCUMENT_TEXT } from "../../constants.js";

const handler = async (event) => {
  // Allow OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }

  // Set CORS headers for the actual request
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const { message, history } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required.' }),
      };
    }

    const sanitizedHistory = Array.isArray(history)
      ? history
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }
            const role = entry.role === 'model' ? 'model' : 'user';
            const parts = Array.isArray(entry.parts)
              ? entry.parts
                  .filter((part) => part && typeof part.text === 'string')
                  .map((part) => ({ text: part.text }))
              : [];

            return parts.length ? { role, parts } : null;
          })
          .filter(Boolean)
      : [];

    const chat = ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: {
            systemInstruction: `You are an AI assistant for USAA insurance. Your task is to answer questions about the provided homeowners policy document. Base your answers strictly on the information within the document. If the answer cannot be found, state that the information isn't available in the policy provided. Here is the policy document:\n\n${POLICY_DOCUMENT_TEXT}`
        },
        history: sanitizedHistory
    });

    const result = await chat.sendMessage({ message });
    const text = result.text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
    };
  }
};

export { handler };
