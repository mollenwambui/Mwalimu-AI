import { NextRequest, NextResponse } from 'next/server';
import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    console.log("Disability identification API called");
    
    // Log environment variable status
    console.log("Mistral API Key status:", {
      hasKey: !!process.env.MISTRAL_API_KEY,
      keyPrefix: process.env.MISTRAL_API_KEY ? process.env.MISTRAL_API_KEY.substring(0, 7) + "..." : "none"
    });
    
    const { characteristics } = await request.json();
    
    if (!characteristics) {
      return NextResponse.json({ error: 'Characteristics are required' }, { status: 400 });
    }

    // Check if Mistral API key is available
    const apiKey = process.env.MISTRAL_API_KEY;
    console.log("Mistral API key available:", !!apiKey);
    
    if (!apiKey) {
      console.error("Mistral API key not found in environment variables");
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    // Identify potential disability using AI
    console.log("Starting disability identification...");
    
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      prompt: `You are an expert special education psychologist and disability specialist.

Based on the following student characteristics, identify the most likely potential disability or learning challenge. Provide a detailed explanation and recommendations for the teacher.

Student characteristics:
 ${characteristics}

Return your response as JSON with this structure:
{
  "suggestedDisability": "Name of the most likely disability or learning challenge",
  "explanation": "Detailed explanation of why this disability might be indicated by the characteristics provided",
  "recommendations": [
    "Specific recommendation 1 for supporting this student",
    "Specific recommendation 2",
    "Specific recommendation 3",
    "Specific recommendation 4",
    "Specific recommendation 5"
  ]
}

Consider common disabilities such as:
- Dyslexia (reading difficulties)
- Dysgraphia (writing difficulties)
- Dyscalculia (math difficulties)
- ADHD (attention and hyperactivity issues)
- Autism Spectrum Disorder (social communication and behavior patterns)
- Visual Impairment
- Hearing Impairment
- Emotional/Behavioral Disorders
- Gifted and Talented (advanced learning needs)

Return ONLY the JSON object, no other text.`,
      maxOutputTokens: 4000,
      temperature: 0.3,
    });
    
    if (!text) {
      throw new Error("Empty response from Mistral AI");
    }
    
    console.log("Mistral AI response received");
    console.log("Raw response length:", text?.length || 0);
    
    // Try to extract JSON from the response
    let jsonText = text.trim();
    
    // Remove any markdown code blocks
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find the JSON object in the response
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON object found in response");
      throw new Error("No JSON object found in AI response");
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    console.log("Extracted JSON length:", jsonText.length);
    
    // Try to parse the JSON
    let result;
    try {
      result = JSON.parse(jsonText);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Initial JSON parse failed:", parseError);
      
      // Try to fix common JSON issues
      let fixedJson = jsonText;
      
      // Fix double-escaped quotes
      fixedJson = fixedJson.replace(/\\"/g, '\\"');
      
      // Fix unescaped newlines in strings
      fixedJson = fixedJson.replace(/(?<!\\)\n/g, '\\n');
      
      // Fix unescaped quotes in strings
      fixedJson = fixedJson.replace(/(?<!\\)"/g, '\\"');
      
      // Remove trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      console.log("Attempting to parse fixed JSON");
      
      try {
        result = JSON.parse(fixedJson);
        console.log("JSON repair successful");
      } catch (secondError) {
        console.error("JSON repair failed:", secondError);
        throw new Error("Failed to parse AI response as JSON after repair attempts");
      }
    }
    
    return NextResponse.json({
      suggestedDisability: result.suggestedDisability || "Unknown",
      explanation: result.explanation || "Unable to determine based on the provided characteristics.",
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
    });
    
  } catch (error) {
    console.error('Error identifying disability:', error);
    return NextResponse.json({ 
      error: 'Failed to identify disability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}