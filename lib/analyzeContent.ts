export interface LineAnalysis {
  lineNumber: number;
  originalLine: string;
  suggestedChange?: string;
  reason: string;
  strategy: string; // The teaching strategy behind the suggestion
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  summary: string;
  lines: LineAnalysis[];
  overallScore: number;
  recommendations: string[]; // Overall recommendations for the teacher
}

// Deep, research-backed analysis for each disability
export function analyzeContent(content: string, disability: string): AnalysisResult {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  switch (disability.toLowerCase()) {
    case 'adhd':
      return analyzeForADHD(lines, content);
    case 'dyslexia':
      return analyzeForDyslexia(lines, content);
    case 'anxiety':
      return analyzeForAnxiety(lines, content);
    case 'autism':
      return analyzeForAutism(lines, content);
    case 'visual-impairment':
      return analyzeForVisualImpairment(lines, content);
    case 'hearing-impairment':
      return analyzeForHearingImpairment(lines, content);
    default:
      return {
        summary: 'No specific analysis available for this disability.',
        lines: [],
        overallScore: 50,
        recommendations: []
      };
  }
}

// ADHD Analysis - Based on CHADD and CDC guidelines
function analyzeForADHD(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: Long paragraphs overwhelm working memory
    if (line.length > 150 && !line.includes('\n')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `Break this into 2-3 shorter paragraphs:\n\n1. ${line.substring(0, 60)}...\n2. [Continue next part]`,
        reason: "Students with ADHD have reduced working memory capacity. Long paragraphs overwhelm their cognitive load.",
        strategy: "Chunking information into smaller segments reduces cognitive load and improves retention.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Passive voice reduces engagement
    if (/\b(was|were|is|are)\s+\w+ed\b/.test(line) && line.length > 20) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: convertToActiveVoice(line),
        reason: "Passive voice makes content less engaging and harder to follow for students with ADHD.",
        strategy: "Active voice creates mental imagery and maintains attention by making content more dynamic.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 3: Lack of interactive elements
    if (line.length > 50 && !/\b(you|your|try|think|consider)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\nThink about: How does this apply to your experience?`,
        reason: "Students with ADHD need interactive elements to maintain engagement.",
        strategy: "Adding reflective questions activates the brain's default mode network and improves focus.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 4: Abstract concepts without examples
    if (line.includes('concept') || line.includes('principle')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\nFor example: [Provide a concrete, relatable example]`,
        reason: "Students with ADHD struggle with abstract concepts without concrete anchors.",
        strategy: "Concrete examples create mental hooks that improve memory and understanding.",
        severity: 'high'
      });
      totalScore -= 10;
    }
  });
  
  return {
    summary: `ADHD Analysis: Found ${analysis.length} issues across ${lines.length} lines. Students with ADHD need content that's chunked, interactive, and concrete.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Break content into 2-3 minute segments with movement breaks between",
      "Use color-coding and visual organizers to highlight key information",
      "Incorporate hands-on activities and real-world applications",
      "Provide choices in how students engage with the material",
      "Use timers and visual schedules to help with time management"
    ]
  };
}

// Dyslexia Analysis - Based on International Dyslexia Association guidelines
function analyzeForDyslexia(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: Long sentences are difficult to decode
    if (line.split(' ').length > 12) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: breakIntoShorterSentences(line),
        reason: "Students with dyslexia struggle with decoding long sentences. Each word requires conscious effort.",
        strategy: "Short sentences reduce cognitive load and make decoding more manageable.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Complex vocabulary creates barriers
    if (/(utilize|approximately|nevertheless|consequently|furthermore)/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: simplifyVocabulary(line),
        reason: "Students with dyslexia have limited decoding capacity for complex words.",
        strategy: "Simple vocabulary frees cognitive resources for comprehension rather than decoding.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 3: Dense text without formatting
    if (line.length > 80 && !/[.!?]/.test(line.substring(0, 40))) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line.substring(0, 40)}...\n\n${line.substring(40)}`,
        reason: "Students with dyslexia need visual breaks in text to track their reading position.",
        strategy: "Line breaks and spacing help prevent losing place and improve reading fluency.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 4: Abstract language without context
    if (line.includes('metaphor') || line.includes('symbolize')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/metaphor|symbolize/g, 'direct comparison') + ' [Show concrete example]',
        reason: "Students with dyslexia often take figurative language literally.",
        strategy: "Literal language with concrete examples supports accurate comprehension.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
  });
  
  return {
    summary: `Dyslexia Analysis: Found ${analysis.length} issues across ${lines.length} lines. Focus on decoding support and reading fluency.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Use dyslexia-friendly fonts like OpenDyslexic or Comic Sans",
      "Increase line spacing to 1.5 and use larger font sizes",
      "Provide audio versions of all text content",
      "Use multi-sensory approaches (visual, auditory, kinesthetic)",
      "Allow extra time for reading and writing tasks"
    ]
  };
}

// Anxiety Analysis - Based on Anxiety and Depression Association guidelines
function analyzeForAnxiety(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: High-pressure language increases anxiety
    if (/\b(must|should|required|have to|need to)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(must|should|required|have to)\b/g, 'can') + ' [This is a learning opportunity]',
        reason: "Imperative language creates performance pressure and increases anxiety.",
        strategy: "Permission-based language reduces fear of failure and creates psychological safety.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Test-focused language triggers test anxiety
    if (/\b(test|exam|quiz|assessment|grade)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(test|exam|quiz)\b/g, 'learning check') + ' [This helps you see your progress]',
        reason: "Assessment language triggers test anxiety in many students.",
        strategy: "Framing assessments as learning opportunities reduces threat perception.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 3: Time pressure creates stress
    if (/\b(quickly|rapidly|immediately|fast|soon)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(quickly|rapidly|immediately|fast)\b/g, 'carefully') + ' [Take the time you need]',
        reason: "Time pressure increases stress and reduces cognitive performance.",
        strategy: "Removing time pressure allows for deeper processing and reduces anxiety.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 4: Vague instructions create uncertainty
    if (line.includes('?') && !line.includes('first') && !line.includes('step')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `First: ${line}\n\nRemember: There's no single right answer. Share your thinking.`,
        reason: "Vague instructions create uncertainty and anxiety about expectations.",
        strategy: "Clear, structured instructions with validation reduce performance anxiety.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
  });
  
  return {
    summary: `Anxiety Analysis: Found ${analysis.length} issues across ${lines.length} lines. Focus on creating psychological safety and reducing pressure.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Create predictable routines and clear expectations",
      "Teach and practice relaxation techniques (deep breathing, mindfulness)",
      "Provide advance notice for changes in schedule or activities",
      "Offer choices to give students a sense of control",
      "Normalize mistakes as part of the learning process"
    ]
  };
}

// Autism Analysis - Based on Autism Society guidelines
function analyzeForAutism(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: Figurative language causes literal interpretation
    if (/\b(metaphor|simile|like|as|imagine|pretend)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/like a (\w+)/g, 'similar to $1') + ' [Show actual example]',
        reason: "Students with autism often interpret figurative language literally, leading to confusion.",
        strategy: "Literal language with concrete examples supports accurate understanding.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Implicit instructions create confusion
    if (line.includes('?') && !/\b(first|then|next|finally|step)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `First: ${line}\nThen: [What to do next]`,
        reason: "Students with autism need explicit, sequential instructions.",
        strategy: "Sequential markers provide clear structure and reduce ambiguity.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 3: Emotional language needs visual support
    if (/\b(feel|emotion|mood|attitude|feeling)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\n[Use emotion chart or facial expression cards]`,
        reason: "Students with autism often struggle with identifying and understanding emotions.",
        strategy: "Visual supports make abstract emotional concepts concrete and understandable.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 4: Abstract concepts need concrete examples
    if (line.includes('concept') || line.includes('theory')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\nFor example: [Provide specific, real-world example]`,
        reason: "Students with autism learn best through concrete examples rather than abstract explanations.",
        strategy: "Concrete examples create mental models that improve understanding and retention.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
  });
  
  return {
    summary: `Autism Analysis: Found ${analysis.length} issues across ${lines.length} lines. Focus on literal language, visual supports, and structure.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Use visual supports and social stories for abstract concepts",
      "Provide clear, literal instructions with sequential markers",
      "Maintain consistent routines and prepare for changes in advance",
      "Use special interests to motivate learning",
      "Create structured, predictable learning environments"
    ]
  };
}

// Visual Impairment Analysis - Based on AFB guidelines
function analyzeForVisualImpairment(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: Visual references are inaccessible
    if (/\b(see|look|watch|observe|view|color|red|blue|green)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(see|look at)\b/g, 'examine or experience').replace(/\b(red|blue|green)\b/g, '[describe texture/feel]'),
        reason: "Visual references are not accessible to students with visual impairments.",
        strategy: "Convert visual descriptions to tactile or auditory experiences.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Spatial descriptions need conversion
    if (/\b(above|below|left|right|beside|next to)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(above|below)\b/g, 'in front/behind').replace(/\b(left|right)\b/g, 'to your side'),
        reason: "Spatial descriptions are meaningless without visual reference.",
        strategy: "Body-referential spatial descriptions create understandable orientation.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 3: Graphs/diagrams need alternative descriptions
    if (line.includes('graph') || line.includes('diagram') || line.includes('chart')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\n[Provide detailed verbal description of the visual information]`,
        reason: "Graphs and diagrams are completely inaccessible without proper description.",
        strategy: "Verbal descriptions make visual information accessible through auditory channels.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 4: Layout-dependent information needs alternatives
    if (line.includes('as shown') || line.includes('as pictured')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/as shown|as pictured/g, 'as described') + ' [Provide complete description]',
        reason: "References to visual layout are inaccessible without proper description.",
        strategy: "Complete verbal descriptions ensure equal access to information.",
        severity: 'high'
      });
      totalScore -= 10;
    }
  });
  
  return {
    summary: `Visual Impairment Analysis: Found ${analysis.length} issues across ${lines.length} lines. Focus on converting visual information to accessible formats.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Provide all materials in Braille or large print as needed",
      "Use tactile graphics and 3D models for visual concepts",
      "Ensure all visual information has detailed verbal descriptions",
      "Use screen readers and other assistive technology",
      "Provide hands-on experiences for visual concepts"
    ]
  };
}

// Hearing Impairment Analysis - Based on NAD guidelines
function analyzeForHearingImpairment(lines: string[], content: string): AnalysisResult {
  const analysis: LineAnalysis[] = [];
  let totalScore = 100;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Rule 1: Auditory references are inaccessible
    if (/\b(hear|listen|sound|noise|quiet|loud)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: line.replace(/\b(hear|listen to)\b/g, 'read about').replace(/\b(sound|noise)\b/g, 'visual signal'),
        reason: "Auditory references are not accessible to students with hearing impairments.",
        strategy: "Convert auditory information to visual or written formats.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 2: Verbal instructions need visual support
    if (/\b(say|tell|explain|discuss|describe)\b/.test(line)) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\n[Provide written instructions or visual aids]`,
        reason: "Verbal instructions alone are not accessible without visual support.",
        strategy: "Visual supports ensure equal access to verbal information.",
        severity: 'high'
      });
      totalScore -= 10;
    }
    
    // Rule 3: Group discussions need alternatives
    if (line.includes('discuss') || line.includes('conversation')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\n[Provide written prompts or visual discussion guides]`,
        reason: "Group discussions can be challenging without proper accommodations.",
        strategy: "Visual discussion guides ensure full participation in group activities.",
        severity: 'medium'
      });
      totalScore -= 5;
    }
    
    // Rule 4: Oral presentations need captions
    if (line.includes('presentation') || line.includes('speech')) {
      analysis.push({
        lineNumber,
        originalLine: line,
        suggestedChange: `${line}\n\n[Provide written transcript or visual outline]`,
        reason: "Oral presentations are inaccessible without visual support.",
        strategy: "Written transcripts ensure equal access to spoken content.",
        severity: 'high'
      });
      totalScore -= 10;
    }
  });
  
  return {
    summary: `Hearing Impairment Analysis: Found ${analysis.length} issues across ${lines.length} lines. Focus on converting auditory information to accessible formats.`,
    lines: analysis,
    overallScore: Math.max(0, totalScore),
    recommendations: [
      "Use sign language interpreters when needed",
      "Provide written transcripts for all audio content",
      "Use visual aids and written instructions",
      "Ensure face-to-face communication for lip-reading",
      "Use assistive listening devices when appropriate"
    ]
  };
}

// Helper functions
function breakIntoShorterSentences(line: string): string {
  const words = line.split(' ');
  if (words.length <= 12) return line;
  
  // Remove and remember ending punctuation
  let ending = '';
  let cleanLine = line.trim();
  if (cleanLine.length > 0 && ['.', '?', '!'].includes(cleanLine[cleanLine.length - 1])) {
    ending = cleanLine[cleanLine.length - 1];
    cleanLine = cleanLine.slice(0, -1).trim();
  }
  
  const cleanWords = cleanLine.split(' ');
  if (cleanWords.length <= 12) return line;
  
  // Define the middle third of the sentence
  const thirdPoint = Math.floor(cleanWords.length / 3);
  const twoThirdsPoint = Math.floor(cleanWords.length * 2 / 3);
  
  // Try to split at natural punctuation points first
  for (let i = thirdPoint; i <= twoThirdsPoint; i++) {
    const word = cleanWords[i];
    if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
      const firstPart = cleanWords.slice(0, i + 1).join(' ');
      const secondPart = cleanWords.slice(i + 1).join(' ');
      return `${firstPart}\n${secondPart}${ending}`;
    }
  }
  
  // If no suitable punctuation found, try to split at conjunctions
  const conjunctions = ['and', 'or', 'but', 'yet', 'for', 'nor', 'so', 'while', 'whereas'];
  for (let i = thirdPoint; i <= twoThirdsPoint; i++) {
    const word = cleanWords[i].toLowerCase();
    if (conjunctions.includes(word)) {
      const firstPart = cleanWords.slice(0, i).join(' ') + '.';
      let secondPart = cleanWords.slice(i).join(' ');
      // Capitalize first letter of second part
      secondPart = secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
      return `${firstPart}\n${secondPart}${ending}`;
    }
  }
  
  // If no natural break found, split at the midpoint as a last resort
  const midPoint = Math.floor(cleanWords.length / 2);
  const firstPart = cleanWords.slice(0, midPoint).join(' ') + '.';
  let secondPart = cleanWords.slice(midPoint).join(' ');
  // Capitalize first letter of second part
  secondPart = secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
  return `${firstPart}\n${secondPart}${ending}`;
}

function simplifyVocabulary(line: string): string {
  const replacements: Record<string, string> = {
    'utilize': 'use',
    'approximately': 'about',
    'nevertheless': 'still',
    'consequently': 'so',
    'furthermore': 'also'
  };
  
  let result = line;
  Object.entries(replacements).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    result = result.replace(regex, simple);
  });
  
  return result;
}

function convertToActiveVoice(line: string): string {
  return line.replace(/\b(was|were|is|are)\s+(\w+ed)\s+(\w+)/gi, '$3 $2');
}