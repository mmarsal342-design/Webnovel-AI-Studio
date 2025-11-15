export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  author: MessageAuthor;
  text: string;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
}

export interface StoryArcAct {
  title: string;
  description: string;
}

// NEW: A detailed structure for characters.
export interface Character {
  name: string;
  age: string;
  gender: string;
  physicalDescription: string;
  voiceAndSpeechStyle: string;
  personalityTraits: string;
  habits: string;
  goal: string;
  principles: string;
  conflict: string;
}

// NEW: Defines a relationship between two characters.
export interface Relationship {
  character1: string; // Name of the first character
  character2: string; // Name of the second character
  type: string;       // e.g., "Rivals", "Allies", "Family"
  description: string; // A short description of their dynamic
}

export interface StoryEncyclopedia {
  // Language
  language: 'en' | 'id';

  // Basic Info
  title: string;
  genres: string[];
  otherGenre: string;
  setting: string;
  totalChapters: string;
  wordsPerChapter: string;

  // Core Story Elements
  mainPlot: string;
  protagonist: Character;
  loveInterests: Character[];
  antagonists: Character[];
  relationships: Relationship[]; // NEWLY ADDED
  magicSystem?: string;
  worldBuilding?: string;

  // Story Arc
  storyArc: StoryArcAct[];

  // Tone & Style
  comedyLevel: string;
  romanceLevel: string;
  actionLevel: string;
  maturityLevel: string;
  proseStyle: string;
}