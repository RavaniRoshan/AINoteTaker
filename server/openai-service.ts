import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "your-api-key");

export interface AiSuggestionOptions {
  promptType: "writing" | "task" | "structure";
  currentText: string;
  noteTitle?: string;
  existingTasks?: string[];
}

export interface AiSuggestionResult {
  suggestion: string;
  confidence: number;
}

export async function generateSuggestion(options: AiSuggestionOptions): Promise<AiSuggestionResult> {
  try {
    // Get the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    let prompt = "";
    
    switch (options.promptType) {
      case "writing":
        prompt = `You are a helpful AI writing assistant. Provide a concise continuation or suggestion for the current text. Keep suggestions under 100 words and make them contextually relevant.
        
Here is the current text in a note titled "${options.noteTitle || 'Untitled Note'}":\n\n${options.currentText}\n\nSuggest a relevant and helpful continuation or addition to this text.

Respond in the following JSON format:
{
  "suggestion": "your suggestion text here",
  "confidence": 0.9
}
Where confidence is a number between 0 and 1 indicating how confident you are in the suggestion.`;
        break;
      case "task":
        prompt = `You are a helpful task management assistant. Based on the existing content and tasks, suggest a relevant new task that would be helpful to add. Keep task suggestions concise and actionable.
        
Here is the current note titled "${options.noteTitle || 'Untitled Note'}" with the following content:\n\n${options.currentText}\n\nExisting tasks:\n${options.existingTasks?.join('\n') || 'No tasks yet.'}\n\nSuggest a relevant new task.

Respond in the following JSON format:
{
  "suggestion": "your task suggestion here",
  "confidence": 0.9
}
Where confidence is a number between 0 and 1 indicating how confident you are in the suggestion.`;
        break;
      case "structure":
        prompt = `You are a document structure expert. Suggest how to better organize or structure the current note. Provide a concise suggestion on headings, sections, or organizational improvements.
        
Here is the current text in a note titled "${options.noteTitle || 'Untitled Note'}":\n\n${options.currentText}\n\nSuggest a way to better structure or organize this note.

Respond in the following JSON format:
{
  "suggestion": "your structure suggestion here",
  "confidence": 0.9
}
Where confidence is a number between 0 and 1 indicating how confident you are in the suggestion.`;
        break;
    }

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
      safetySettings,
    });

    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{"suggestion": "", "confidence": 0.5}';
    const jsonResult = JSON.parse(jsonStr);
    
    return {
      suggestion: jsonResult.suggestion || "No suggestion available at this time.",
      confidence: jsonResult.confidence || 0.5
    };
  } catch (error) {
    console.error("Error generating AI suggestion with Gemini:", error);
    return {
      suggestion: "Unable to generate a suggestion at this time. Please try again later.",
      confidence: 0
    };
  }
}
