// lib/analyzeContent.ts
import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export interface LineAnalysis {
  lineNumber: number;
  originalLine: string;
  suggestedChange?: string;
  reason: string;
  strategy: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  summary: string;
  lines: LineAnalysis[];
  overallScore: number;
  recommendations: string[];
}

export async function analyzeContent(content: string, disability: string): Promise<AnalysisResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  console.log("Checking Mistral API key...", {
    hasKey: !!apiKey,
    keyPreview: apiKey?.substring(0, 7) + "..."
  });
  
  if (!apiKey || apiKey.trim() === '') {
    console.log("No Mistral API key found, using fallback analysis");
    return fallbackAnalysis(content, disability);
  }
  
  try {
    console.log("Calling Mistral AI for detailed line-by-line analysis...");
    
    // Split content into lines for the AI to analyze
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Limit content size to avoid token limits
    const maxLines = 50;
    const contentLines = lines.slice(0, maxLines);
    const numberedContent = contentLines.map((line, index) => `${index + 1}. ${line}`).join('\n');
    
    if (lines.length > maxLines) {
      console.log(`Content truncated from ${lines.length} to ${maxLines} lines for analysis`);
    }
    
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      prompt: `You are an expert special education teacher and accessibility specialist.

Analyze the following educational content for a student with ${disability}. Return your analysis as a JSON object with this structure:
{
  "summary": "A detailed summary of the overall accessibility",
  "overallScore": 75,
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3",
    "Specific recommendation 4",
    "Specific recommendation 5"
  ],
  "lines": [
    {
      "lineNumber": 1,
      "originalLine": "exact text from line",
      "suggestedChange": "improved accessible version",
      "reason": "detailed explanation of the problem",
      "strategy": "research-based teaching strategy",
      "severity": "high"
    }
  ]
}

Content to analyze:
 ${numberedContent}

Return ONLY the JSON object, no other text.`,
  maxOutputTokens: 3000, // ✅ updated property name
      temperature: 0.3,
    });
    
    console.log("Mistral AI response received");
    console.log("Raw response length:", text?.length || 0);
    
    if (!text) {
      throw new Error("Empty response from Mistral AI");
    }
    
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
    
    // Validate and transform the result
    const analysisResult: AnalysisResult = {
      summary: result.summary || `Analysis for ${disability} completed.`,
      overallScore: Math.min(100, Math.max(0, result.overallScore || 70)),
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [
        "Consider breaking content into smaller sections",
        "Use more visual aids and examples",
        "Provide clear structure and organization",
        "Use simpler language where possible",
        "Add more interactive elements"
      ],
      lines: Array.isArray(result.lines) ? result.lines.map((line: any) => ({
        lineNumber: line.lineNumber || 0,
        originalLine: line.originalLine || '',
        suggestedChange: line.suggestedChange || '',
        reason: line.reason || 'Accessibility concern identified',
        strategy: line.strategy || 'Evidence-based teaching practice',
        severity: ['low', 'medium', 'high'].includes(line.severity) ? line.severity : 'medium'
      })) : []
    };
    
    console.log("Final analysis result:", {
      summary: analysisResult.summary,
      overallScore: analysisResult.overallScore,
      recommendationsCount: analysisResult.recommendations.length,
      issuesFound: analysisResult.lines.length
    });
    
    return analysisResult;
    
  } catch (error) {
    console.error('Error analyzing content with Mistral AI:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('capacity exceeded') || error.message.includes('429')) {
        console.log('Rate limit exceeded, using fallback with helpful message');
        return rateLimitFallback(content, disability);
      }
      
      if (error.message.includes('Failed to parse AI response as JSON')) {
        console.log('JSON parsing failed, using simple analysis fallback');
        return simpleAnalysisFallback(content, disability);
      }
    }
    
    return fallbackAnalysis(content, disability);
  }
}

// Simple analysis fallback when JSON parsing fails
function simpleAnalysisFallback(content: string, disability: string): AnalysisResult {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const analysis: LineAnalysis[] = [];
  
  // Simple analysis based on content length and complexity
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for long lines
    if (line.length > 100) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: breakIntoShorterSentences(line),
        reason: `Long sentences can be difficult for students with ${disability} to process.`,
        strategy: "Break information into smaller, more manageable chunks.",
        severity: 'medium'
      });
    }
    
    // Check for complex words
    const complexWords = /(utilize|implement|facilitate|conceptualize|nevertheless|furthermore)/.test(line);
    if (complexWords) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: simplifyVocabulary(line),
        reason: `Complex vocabulary can create barriers for students with ${disability}.`,
        strategy: "Use simpler, more familiar language to improve comprehension.",
        severity: 'low'
      });
    }
  });
  
  return {
    summary: `Basic analysis for ${disability} completed. The AI service had difficulty processing this content, but we've identified some potential accessibility issues.`,
    lines: analysis,
    overallScore: Math.max(0, 100 - (analysis.length * 10)),
    recommendations: [
      "Use shorter sentences and simpler language",
      "Break content into smaller sections",
      "Provide visual aids and examples",
      "Consider the specific needs of students with disabilities",
      "Test your content with diverse learners"
    ]
  };
}

// Fallback for rate limiting
function rateLimitFallback(content: string, disability: string): AnalysisResult {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  return {
    summary: `⚠️ Mistral API is currently at capacity. Please try again in a few minutes.`,
    lines: [],
    overallScore: 0,
    recommendations: [
      "Wait 1-2 minutes and try again",
      "Try during off-peak hours for better availability",
      "Consider upgrading to a paid tier for guaranteed access",
      `Content has ${lines.length} lines to analyze for ${disability} accessibility`
    ]
  };
}

// Minimal fallback when API key is missing
function fallbackAnalysis(content: string, disability: string): AnalysisResult {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  return {
    summary: `🔑 Mistral API key needed. Get free API key at: https://console.mistral.ai/`,
    lines: [],
    overallScore: 0,
    recommendations: [
      "Get free Mistral API key at: https://console.mistral.ai/",
      "Add MISTRAL_API_KEY to your .env file",
      "Restart your development server",
      "Mistral AI offers generous free tier for developers"
    ]
  };
}

// Helper functions
function breakIntoShorterSentences(line: string): string {
  const words = line.split(' ');
  if (words.length <= 12) return line;
  
  // Try to split at natural punctuation points
  const punctuationIndex = words.findIndex((word, index) => 
    index > 5 && index < words.length - 5 && 
    (word.endsWith(',') || word.endsWith(';') || word.endsWith(':'))
  );
  
  if (punctuationIndex !== -1) {
    const firstPart = words.slice(0, punctuationIndex + 1).join(' ');
    const secondPart = words.slice(punctuationIndex + 1).join(' ');
    return `${firstPart}\n${secondPart}`;
  }
  
  // If no punctuation, split at conjunctions
  const conjunctionIndex = words.findIndex((word, index) => 
    index > 5 && index < words.length - 5 && 
    ['and', 'or', 'but', 'yet', 'for', 'nor', 'so'].includes(word.toLowerCase())
  );
  
  if (conjunctionIndex !== -1) {
    const firstPart = words.slice(0, conjunctionIndex).join(' ') + '.';
    const secondPart = words.slice(conjunctionIndex).join(' ');
    return `${firstPart}\n${secondPart}`;
  }
  
  // Split at midpoint as last resort
  const midPoint = Math.floor(words.length / 2);
  const firstPart = words.slice(0, midPoint).join(' ') + '.';
  const secondPart = words.slice(midPoint).join(' ');
  return `${firstPart}\n${secondPart}`;
}

function simplifyVocabulary(line: string): string {
  const replacements: Record<string, string> = {
    'utilize': 'use',
    'approximately': 'about',
    'nevertheless': 'still',
    'consequently': 'so',
    'furthermore': 'also',
    'implement': 'use',
    'facilitate': 'help',
    'conceptualize': 'understand'
  };
  
  let result = line;
  Object.entries(replacements).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    result = result.replace(regex, simple);
  });
  
  return result;
}