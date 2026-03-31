import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getWeather } from "./weatherService";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });

const getWeatherTool: FunctionDeclaration = {
  name: "getWeather",
  description: "Get the current weather for a specific location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The city and state, e.g. San Francisco, CA",
      },
    },
    required: ["location"],
  },
};

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function runAgent(
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction:
          "You are a helpful AI weather agent. You use the 'getWeather' tool to fetch real-time weather data for any location the user asks about. Always use the retrieved data to generate a detailed and helpful response. If the user asks for weather in multiple places, call the tool for each. If the user asks something unrelated to weather, answer politely but remind them you are a weather specialist.",
        tools: [{ functionDeclarations: [getWeatherTool] }],
      },
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    let response = await chat.sendMessage({ message: prompt });

    // Handle tool calls
    const functionCalls = response.functionCalls;
    if (functionCalls) {
      const toolResults = [];
      for (const call of functionCalls) {
        if (call.name === "getWeather") {
          const { location } = call.args as { location: string };
          try {
            const weather = await getWeather(location);
            toolResults.push({
              name: call.name,
              id: call.id,
              response: {
                content: `The current weather in ${weather.location} is ${weather.condition} with a temperature of ${weather.temperature}°C and wind speed of ${weather.windSpeed} km/h.`,
              },
            });
          } catch (err: any) {
            toolResults.push({
              name: call.name,
              id: call.id,
              response: {
                content: `Error: ${err.message || `Could not find weather for ${location}.`}`,
              },
            });
          }
        }
      }

      // Send tool results back to the model
      response = await chat.sendMessage({
        message: toolResults.map((res) => ({
          functionResponse: {
            name: res.name,
            id: res.id,
            response: res.response,
          },
        })),
      });
    }

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Agent error:", error);
    return "An error occurred while processing your request.";
  }
}
