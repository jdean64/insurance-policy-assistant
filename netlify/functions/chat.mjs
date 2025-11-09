import { GoogleGenAI } from "@google/genai";

// We can import the policy text to include in the system prompt.
// Note: This makes the function bundle larger but ensures context is always present.
import { POLICY_DOCUMENT_TEXT } from "../../constants.js";

const handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' }
    };
  }

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
        body: JSON.stringify({ error: 'Message is required.' }),
      };
    }
    
    const chat = ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: {
            systemInstruction: `You are an AI assistant for USAA insurance. Your task is to answer questions about the provided homeowners policy document. Base your answers strictly on the information within the document. If the answer cannot be found, state that the information isn't available in the policy provided. Here is the policy document:\n\n${POLICY_DOCUMENT_TEXT}`
        },
        history: history || []
    });

    const result = await chat.sendMessage(message);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
      },
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
    };
  }
};

export { handler };