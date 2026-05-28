import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from env, or a fallback if not set.
// We check if it exists so we can gracefully fallback in the UI if the user hasn't set it yet.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const hasApiKey = () => API_KEY.length > 0;

export type AssessmentQuestion = {
  id: number;
  question: string;
  options: string[];
  correctOption: number;
  type: 'text';
};

export async function generateAssessmentQuestions(language: string): Promise<AssessmentQuestion[]> {
  if (!hasApiKey()) {
    throw new Error('API Key is missing');
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  const prompt = `Generate exactly 10 multiple-choice questions for learning ${language}. 
  The difficulty MUST be distributed as follows:
  - Questions 1 to 3 (id 0-2): Easy level (basic vocabulary, simple greetings)
  - Questions 4 to 7 (id 3-6): Intermediate level (sentence structure, common phrases)
  - Questions 8 to 10 (id 7-9): Hard level (complex grammar, idioms, advanced vocabulary)
  
  CRITICAL INSTRUCTION: Generate completely random and varied questions. Do not repeat the same concepts every time. (Random seed: ${Math.random()})
  
  The 'question' text MUST be in English.
  The 4 'options' MUST be written in the native ${language} script.
  Output JSON array. Keys: id (0-9), question (string), options (4 strings), correctOption (0-3), type ("text").`;

  try {
    const result = await model.generateContent(prompt);
    
    const text = result.response.text();
    // Clean up potential markdown formatting if the model still includes it
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as AssessmentQuestion[];
  } catch (error) {
    console.error("Error generating assessment:", error);
    throw error;
  }
}

export async function generateTutorResponse(chatHistory: string, userMessage: string, userLevel: string = "Beginner - Level 1", userLanguage: string = "Tamil"): Promise<string> {
  if (!hasApiKey()) {
    return "Please set your Gemini API key in the .env file to chat with me!";
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `You are a hilarious, witty, and slightly sarcastic comedy AI language tutor! 
  You respond to the user like a fun stand-up comedian or a quirky movie character.
  The user is practicing a new language: ${userLanguage}. 
  CRITICAL: The user is currently at proficiency level: ${userLevel}. 
  If they are a Beginner, use simple words but keep the jokes punchy. 
  If they are Intermediate, add some clever wordplay. 
  If they are Pro, use witty cultural idioms and advanced sarcasm!
  
  Here is the recent chat history:
  ${chatHistory}
  
  User just said: "${userMessage}"
  
  REQUIREMENTS: 
  - Be extremely funny, witty, and engaging.
  - Make it feel like a snappy comedy dialogue.
  - EXTREME LENGTH LIMIT: Maximum 10-15 words total per response. It must be ONE very short punchy sentence. NO EXCEPTIONS.
  - Ask them to translate or say a word in ${userLevel.includes("Beginner") ? "simple" : "advanced"} terms, but keep the instruction very brief.
  - ALWAYS include the native script for ${userLanguage} (e.g. தமிழ் if Tamil, हिन्दी if Hindi) next to the transliterated word. Example: "Nandri (நன்றி)".
  - Use 1-2 emojis!`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating tutor response:", error);
    return "I'm having trouble thinking right now. Please try again later.";
  }
}

export async function generatePracticeLesson(skill: string, level: string, language: string): Promise<AssessmentQuestion[]> {
  if (!hasApiKey()) {
    throw new Error('API Key is missing');
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `You are an expert language tutor teaching ${language}. 
  The user is currently at the proficiency level: ${level}.
  Create exactly 50 multiple-choice practice questions focused specifically on the topic of [${skill}].
  
  CRITICAL INSTRUCTION: Select a COMPLETELY RANDOM, highly varied set of 50 words, phrases, or grammar rules from a massive pool. Do not repeat the same exercises every time. Shuffle your selection. (Random seed: ${Math.random()})
  
  CRITICAL DIFFICULTY INSTRUCTIONS:
  - If ${level} includes "Beginner", make the exercises very simple, using basic, common words and short sentences.
  - If ${level} includes "Intermediate", use conversational grammar and moderate vocabulary.
  - If ${level} includes "Pro", use complex structures, advanced vocabulary, and challenging scenarios.
  
  The 'question' text MUST be in English.
  The 4 'options' MUST be written in the native ${language} script.
  Output JSON array. Keys: id (0-49), question (string), options (4 strings), correctOption (0-3), type ("text").`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as AssessmentQuestion[];
  } catch (error) {
    console.error("Error generating practice lesson:", error);
    throw error;
  }
}

export type SentenceQuestion = {
  id: number;
  english: string;
  correctOrder: string[];
  scrambledWords: string[];
};

export async function generateSentenceLesson(level: string, language: string): Promise<SentenceQuestion[]> {
  if (!hasApiKey()) throw new Error('API Key is missing');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are a language tutor teaching ${language}. The user is at level: ${level}.
  Create 5 sentence-building exercises.
  
  CRITICAL INSTRUCTION: Create completely random and varied sentences. Do not use the same sentences every time. Choose unexpected topics. (Random seed: ${Math.random()})
  
  CRITICAL DIFFICULTY INSTRUCTIONS:
  - If ${level} includes "Beginner", use very short 3-4 word sentences with simple foundational words.
  - If ${level} includes "Intermediate", use 5-7 word sentences with moderate grammar.
  - If ${level} includes "Pro", use long, complex sentences with idioms or advanced clauses.

  For each exercise:
  1. Provide a sentence in English ('english').
  2. Provide the translation in ${language} as an array of words in the exact correct order ('correctOrder').
  3. Provide the same words, plus 2-3 extra distractor words in ${language}, completely scrambled/randomized ('scrambledWords').

  Output JSON array of objects with keys: id (0-4), english (string), correctOrder (string array), scrambledWords (string array).`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as SentenceQuestion[];
  } catch (error) {
    console.error("Error generating sentence lesson:", error);
    throw error;
  }
}

export type Flashcard = {
  id: number;
  term: string;
  translation: string;
  emoji: string;
};

export async function generateFlashcardLesson(skill: string, level: string, language: string): Promise<Flashcard[]> {
  if (!hasApiKey()) throw new Error('API Key is missing');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are an expert language teacher teaching ${language}. The user is at level: ${level}.
  Create 10 flashcards for the topic [${skill}].
  
  CRITICAL INSTRUCTION: Select a COMPLETELY RANDOM, highly varied set of 10 words from a massive pool of ${language} vocabulary suitable for this level. DO NOT output the same common words every time. Shuffle your selection. (Random seed: ${Math.random()})
  
  DIFFICULTY:
  - "Beginner": simple nouns (animals, food, colors, family) or basic verbs.
  - "Intermediate": intermediate phrases, emotions, weather, or conversational terms.
  - "Pro": advanced vocabulary, idioms, professional terms, or abstract concepts.

  'term' MUST be the native ${language} word/phrase.
  'translation' MUST be the English translation.
  'emoji' MUST be a single, colorful Unicode emoji (e.g. 🐶, 🍎, 🏃) that visually represents the term perfectly.
  
  Output a JSON array of EXACTLY 10 objects with keys: id (0-9), term (string), translation (string), emoji (string).`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as Flashcard[];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}

export type ReadingStory = {
  title: string;
  titleEnglish: string;
  paragraphs: Array<{ native: string; english: string; }>;
  questions: Array<{ question: string; options: string[]; correctOption: number; }>;
};

export async function generateReadingLesson(level: string, language: string): Promise<ReadingStory> {
  if (!hasApiKey()) throw new Error('API Key is missing');

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are a language teacher teaching ${language}. The user is at level: ${level}.
  Create a short reading comprehension story in ${language}.
  
  CRITICAL INSTRUCTION: Write a COMPLETELY RANDOM, highly varied story. Choose a unique topic, characters, or situation every single time. DO NOT write the same common topics over and over again. Be creative. (Random seed: ${Math.random()})
  
  CRITICAL DIFFICULTY INSTRUCTIONS: 
  - If ${level} includes "Beginner", write 3-4 very simple sentences about daily life, animals, or food.
  - If ${level} includes "Intermediate", write a short paragraph about a cultural event or a trip with moderate vocabulary.
  - If ${level} includes "Pro", write a complex story, folk tale, or article with advanced grammar and idioms.
  
  Provide the following in your JSON response:
  1. 'title': Story title in ${language}.
  2. 'titleEnglish': English translation of the title.
  3. 'paragraphs': An array of objects representing the sentences or paragraphs of the story. Each object must have a 'native' string (${language}) and an 'english' string.
  4. 'questions': An array of exactly 3 multiple-choice comprehension questions in English about the story to verify understanding. Each question must have 'question' (string), 'options' (array of 4 English strings), and 'correctOption' (number 0-3).
  
  Output a single JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as ReadingStory;
  } catch (error) {
    console.error("Error generating reading lesson:", error);
    throw error;
  }
}
