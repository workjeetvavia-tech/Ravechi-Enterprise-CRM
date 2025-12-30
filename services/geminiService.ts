import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

// Initialize Gemini Client
// In a real Vercel environment, ensure process.env.API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = "gemini-3-flash-preview";

export const generateColdEmail = async (lead: Lead): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment variables.";
  }

  const prompt = `
    You are an expert sales representative for 'Ravechi Enterprises', a leading provider in Gujarat, India.
    Write a professional, warm, and persuasive cold email to a potential client.
    
    Client Details:
    Name: ${lead.name}
    Company: ${lead.company}
    Interests: ${lead.interest.join(", ")}
    State: ${lead.state || 'Gujarat'}
    
    The tone should be professional yet approachable (Gujarati business context friendly).
    Offer a meeting to discuss their bulk requirements.
    Keep it under 200 words.
    Format the output as plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Failed to generate email.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check your API key.";
  }
};

export const analyzeLeadPotential = async (lead: Lead): Promise<string> => {
   if (!process.env.API_KEY) {
    return "API Key is missing.";
  }

  const prompt = `
    Analyze the following sales lead for Ravechi Enterprises (Stationery and IT).
    Provide a brief strategic advice (bullet points) on how to close this deal.
    
    Lead: ${lead.name} (${lead.company})
    Location: ${lead.state || 'Gujarat'}
    Status: ${lead.status}
    Value: ₹${lead.value}
    Interests: ${lead.interest.join(", ")}
    Notes: ${lead.notes}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing lead.";
  }
};

export const suggestBundle = async (products: string[]): Promise<string> => {
     if (!process.env.API_KEY) {
    return "API Key is missing.";
  }

  const prompt = `
    We sell Stationery and IT hardware at Ravechi Enterprises. A customer is interested in: ${products.join(", ")}.
    Suggest a logical "Business Starter Pack" or "Office Bundle" we could upsell them that combines both stationery and IT needs.
    Explain why this bundle adds value.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "No suggestions available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating suggestion.";
  }
};

export const chatWithGemini = async (message: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
    if (!process.env.API_KEY) {
        return "API Key is missing.";
    }

    try {
        const chat = ai.chats.create({
            model: MODEL_NAME,
            history: history,
            config: {
                systemInstruction: "You are a helpful AI assistant for Ravechi Enterprises CRM. You help with business advice, email drafting, CRM data analysis, and technical support for a Stationery and IT business in Gujarat.",
            }
        });
        
        const result = await chat.sendMessage({ message });
        return result.text || "I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Sorry, I encountered an error communicating with Gemini.";
    }
};