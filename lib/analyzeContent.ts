import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export interface SuggestedImage {
  description: string;
  altText: string;
  placement: 'before' | 'after' | 'beside';
  questionNumber: number|null;
}

export interface LineAnalysis {
  lineNumber: number;
  originalLine: string;
  suggestedChange?: string;
  reason: string;
  strategy: string;
  severity: 'low' | 'medium' | 'high';
  suggestedImages?: SuggestedImage[];
}

export interface AnalysisResult {
  summary: string;
  lines: LineAnalysis[];
  overallScore: number;
  recommendations: string[];
  suggestedImages?: SuggestedImage[];
}

export interface ExamAnalysisResult {
  originalExam: string;
  adaptedExam: string;
  summary: string;
  changesMade: number;
  recommendations: string[];
  suggestedImages: SuggestedImage[];
}

// Deep, research-backed analysis for each disability using ChatGPT
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

Analyze the following educational content for a student with ${disability}. 
Focus on creating content that is accessible and effective for students with ${disability}.

For each line that has accessibility issues, provide:
- lineNumber: the exact line number (starting from 1)
- originalLine: the exact text of that line
- suggestedChange: a completely rewritten version that is accessible and effective for students with ${disability}
- reason: detailed explanation of why the original line is problematic for students with ${disability}
- strategy: the specific teaching strategy or research-based approach behind your suggestion
- severity: 'low', 'medium', or 'high' based on how much the issue impacts learning
- suggestedImages: an array of image suggestions that could help make the content more accessible (optional)

Also provide:
- summary: a concise summary of the overall accessibility (2-3 sentences)
- overallScore: an overall accessibility score from 0 to 100
- recommendations: an array of 3-5 overall recommendations for the teacher
- suggestedImages: an array of general image suggestions for the entire content (optional)

For image suggestions, include:
- description: what the image should show
- altText: accessible alt text for the image
- placement: where the image should be placed ('before', 'after', or 'beside')
- questionNumber: which question or section the image relates to (if applicable)

Image suggestions should be simple, clear, and directly related to helping students with ${disability} understand the content.

Return your analysis as JSON with this exact structure:
{
  "summary": "A detailed 3-4 sentence summary of the overall accessibility of this content for students with ${disability}",
  "overallScore": 85,
  "recommendations": [
    "Specific recommendation 1 for teaching this content to students with ${disability}",
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
      "strategy": "research-based teaching strategy used",
      "severity": "high",
      "suggestedImages": [
        {
          "description": "A simple diagram showing the water cycle",
          "altText": "Water cycle diagram showing evaporation, condensation, and precipitation",
          "placement": "beside",
          "questionNumber": 1
        }
      ]
    }
  ],
  "suggestedImages": [
    {
      "description": "A timeline showing historical events",
      "altText": "Timeline with key dates and events in chronological order",
      "placement": "before",
      "questionNumber": null
    }
  ]
}

IMPORTANT: Be as detailed as possible. Identify as many issues as you can find. Don't skip lines that could be improved. Include relevant image suggestions where they would be most helpful.

Content with line numbers:
 ${numberedContent}

Provide detailed, actionable suggestions for EACH problematic line. Return ONLY the JSON object with properly escaped strings, no other text.`,
      maxOutputTokens: 4000,
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
        severity: ['low', 'medium', 'high'].includes(line.severity) ? line.severity : 'medium',
        suggestedImages: Array.isArray(line.suggestedImages) ? line.suggestedImages.map((img: any) => ({
          description: img.description || '',
          altText: img.altText || '',
          placement: ['before', 'after', 'beside'].includes(img.placement) ? img.placement : 'beside',
          questionNumber: img.questionNumber || 0
        })) : []
      })) : [],
      suggestedImages: Array.isArray(result.suggestedImages) ? result.suggestedImages.map((img: any) => ({
        description: img.description || '',
        altText: img.altText || '',
        placement: ['before', 'after', 'beside'].includes(img.placement) ? img.placement : 'beside',
        questionNumber: img.questionNumber || null
      })) : []
    };
    
    console.log("Final analysis result:", {
      summary: analysisResult.summary,
      overallScore: analysisResult.overallScore,
      recommendationsCount: analysisResult.recommendations.length,
      issuesFound: analysisResult.lines.length,
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

// Exam adaptation function
export async function adaptExam(content: string, disability: string): Promise<ExamAnalysisResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    return {
      originalExam: content,
      adaptedExam: content,
      summary: "API key not configured. Please add MISTRAL_API_KEY to your environment variables.",
      changesMade: 0,
      recommendations: ["Configure the Mistral API key to use exam adaptation features."],
      suggestedImages: []
    };
  }
  
  try {
    // Limit content size to avoid token limits
    const maxContentLength = 6000;
    let examContent = content;
    
    if (content.length > maxContentLength) {
      console.log(`Content truncated from ${content.length} to ${maxContentLength} characters for exam adaptation`);
      examContent = content.substring(0, maxContentLength) + "\n\n[Note: Content was truncated due to length limitations]";
    }
    
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      prompt: `You are an expert special education teacher specializing in creating accessible assessments.

Your task is to adapt an exam for a student with ${disability}. The goal is to maintain the same questions, content, and difficulty level while making the exam more accessible.

IMPORTANT REQUIREMENTS:
1. Keep ALL questions exactly the same - do not change the meaning or difficulty
2. Do not add or remove any questions
3. Maintain the same structure and format
4. Only change the wording to make it more accessible
5. Ensure the adapted exam tests the same knowledge and skills
6. Suggest relevant images that could help make the exam more accessible
7. Consider alternative answer formats to accommodate different learning needs

ALTERNATIVE ANSWER FORMATS:
For questions that require written responses, consider adapting them to these alternative formats:
- Multiple choice: Provide 3-4 options with one correct answer
- True/False: Convert statements to true/false format
- Two or three choice questions: Simplify options to reduce cognitive load
- Short essay: Break down complex essay questions into smaller, structured parts
- Matching picture to word: Include visual elements where appropriate
- Fill in the blanks: Provide word banks for difficult vocabulary
- Diagram labeling: Include visual elements with labels to identify

Adaptation strategies for ${disability}:
- Dyslexia: Use simpler vocabulary, shorter sentences, clearer formatting, add supportive images
- Dysgraphia: Simplify instructions, provide more space for answers, use multiple choice, add visual cues
- Dyscalculia: Simplify math language, provide examples, break down complex problems, add visual representations
- ADHD: Break down instructions into smaller steps, use bullet points, reduce distractions, add engaging images
- Autism: Use literal language, avoid idioms, provide clear structure, use visual supports, add predictable images
- Visual Impairment: Ensure all content is screen-reader friendly, describe visual elements, suggest tactile graphics
- Hearing Impairment: Provide written instructions for all audio content, suggest visual aids

Image Suggestions:
- Suggest images that help clarify questions or concepts
- Images should be simple, clear, and directly related to the content
- Provide alt text for each image for accessibility
- Specify where each image should be placed (before, after, or beside the question)

Return your response as JSON with this structure:
{
  "originalExam": "The original exam content as provided",
  "adaptedExam": "The adapted exam content",
  "summary": "Brief summary of changes made",
  "changesMade": 5,
  "recommendations": [
    "Recommendation 1 for administering the adapted exam",
    "Recommendation 2",
    "Recommendation 3"
  ],
  "suggestedImages": [
    {
      "description": "A simple diagram showing the water cycle",
      "altText": "Water cycle diagram showing evaporation, condensation, and precipitation",
      "placement": "beside",
      "questionNumber": 3
    },
    {
      "description": "Picture of a clock showing 3:45",
      "altText": "Analog clock showing the time as three forty-five",
      "placement": "after",
      "questionNumber": 7
    }
  ]
}

Exam to adapt:
 ${examContent}

Return ONLY the JSON object, no other text.`,
      maxOutputTokens: 4000,
      temperature: 0.3,
    });
    
    if (!text) {
      throw new Error("Empty response from Mistral AI");
    }
    
    console.log("Raw AI response for exam adaptation:", text);
    
    // Extract JSON from response
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
    console.log("Extracted JSON:", jsonText);
    
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      
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
    
    return {
      originalExam: result.originalExam || content,
      adaptedExam: result.adaptedExam || content,
      summary: result.summary || "Exam adaptation completed.",
      changesMade: result.changesMade || 0,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      suggestedImages: Array.isArray(result.suggestedImages) ? result.suggestedImages.map((img: any) => ({
        description: img.description || '',
        altText: img.altText || '',
        placement: ['before', 'after', 'beside'].includes(img.placement) ? img.placement : 'beside',
        questionNumber: img.questionNumber || 0
      })) : []
    };
    
  } catch (error) {
    console.error('Error adapting exam with Mistral AI:', error);
    
    // Return a more informative fallback
    return {
      originalExam: content,
      adaptedExam: content,
      summary: "Failed to adapt exam. The AI service encountered an error. Please try again later.",
      changesMade: 0,
      recommendations: [
        "Try uploading a shorter exam",
        "Check your internet connection",
        "Ensure the exam content is clear and readable",
        "Try again later when the AI service is available"
      ],
      suggestedImages: []
    };
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
        severity: 'medium',
        suggestedImages: [
          {
            description: `Visual aid to help understand the concept in line ${lineNumber}`,
            altText: `Diagram illustrating the main concept in line ${lineNumber}`,
            placement: 'beside',
            questionNumber: lineNumber
          }
        ]
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
        severity: 'low',
        suggestedImages: [
          {
            description: `Visual vocabulary support for complex terms in line ${lineNumber}`,
            altText: `Illustration showing the meaning of complex terms in line ${lineNumber}`,
            placement: 'before',
            questionNumber: lineNumber
          }
        ]
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
    ],
    suggestedImages: [
      {
        description: "General visual aid to support content comprehension",
        altText: "Illustration showing key concepts from the content",
        placement: "before",
        questionNumber: null
      }
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
    ],
    suggestedImages: []
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
    ],
    suggestedImages: []
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
    const firstPart = words.slice(0, conjunctionIndex).join(' ');
    const secondPart = words.slice(conjunctionIndex).join(' ');
    return `${firstPart}\n${secondPart}`;
  }
  
  // If no punctuation or conjunction found, split in the middle
  const midPoint = Math.floor(words.length / 2);
  const firstPart = words.slice(0, midPoint).join(' ');
  const secondPart = words.slice(midPoint).join(' ');
  return `${firstPart}\n${secondPart}`;
}

function simplifyVocabulary(line: string): string {
  const complexToSimple: Record<string, string> = {
    'utilize': 'use',
    'implement': 'carry out',
    'facilitate': 'help',
    'conceptualize': 'understand',
    'nevertheless': 'still',
    'furthermore': 'also',
    'consequently': 'so',
    'subsequently': 'after',
    'additionally': 'also',
    'approximately': 'about',
    'sufficient': 'enough',
    'demonstrate': 'show',
    'indicate': 'show',
    'initiate': 'start',
    'terminate': 'end',
    'commence': 'begin',
    'ascertain': 'find out',
    'elucidate': 'explain',
    'enumerate': 'list',
    'expedite': 'speed up',
    'investigate': 'look into',
    'substantiate': 'prove',
    'utilization': 'use',
    'methodology': 'method',
    'parameters': 'limits',
    'advantageous': 'helpful',
    'detrimental': 'harmful',
    'endeavor': 'try',
    'numerous': 'many',
    'substantial': 'large',
    'significant': 'important',
    'acquire': 'get',
    'assistance': 'help',
    'beneficial': 'helpful',
    'components': 'parts',
    'designate': 'name',
    'disseminate': 'spread',
    'eliminate': 'get rid of',
    'establish': 'set up',
    'exhibit': 'show',
    'fabricate': 'make',
    'identify': 'find',
    'illustrate': 'show',
    'inquire': 'ask',
    'maintain': 'keep',
    'modify': 'change',
    'necessitate': 'require',
    'obtain': 'get',
    'participate': 'take part',
    'perceive': 'see',
    'perform': 'do',
    'possess': 'have',
    'provide': 'give',
    'receive': 'get',
    'regarding': 'about',
    'require': 'need',
    'select': 'choose',
    'transmit': 'send',
  };

  // Replace complex words with simpler alternatives
  let simplifiedLine = line;
  
  // Sort keys by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(complexToSimple).sort((a, b) => b.length - a.length);
  
  for (const complexWord of sortedKeys) {
    const simpleWord = complexToSimple[complexWord];
    
    // Create regex to match whole words only (with word boundaries)
    const regex = new RegExp(`\\b${complexWord}\\b`, 'gi');
    
    // Replace while preserving original case
    simplifiedLine = simplifiedLine.replace(regex, (match) => {
      // If the original word was capitalized, capitalize the simple word
      if (match[0] === match[0].toUpperCase()) {
        return simpleWord.charAt(0).toUpperCase() + simpleWord.slice(1);
      }
      return simpleWord;
    });
  }
  
  return simplifiedLine;
}