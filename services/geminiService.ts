import { GoogleGenAI, Chat, Type } from "@google/genai";
import { ModelType, StoryEncyclopedia, StoryArcAct, Character, Relationship } from '../types';
import { SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ID, MAX_THINKING_BUDGET, PROSE_STYLES_EN } from '../constants';

// This function assumes process.env.API_KEY is available in the environment.
const initializeGenAI = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const formatCharacterForPrompt = (character: Character, role: string): string => {
    if (!character || !character.name) return `\n**${role}:** N/A`;
    return `
**${role}:**
- Name: ${character.name || 'N/A'}
- Age: ${character.age || 'N/A'}
- Gender: ${character.gender || 'N/A'}
- Physical Description: ${character.physicalDescription || 'N/A'}
- Voice & Speech Style: ${character.voiceAndSpeechStyle || 'N/A'}
- Personality Traits: ${character.personalityTraits || 'N/A'}
- Habits: ${character.habits || 'N/A'}
- Goal: ${character.goal || 'N/A'}
- Principles: ${character.principles || 'N/A'}
- Core Conflict: ${character.conflict || 'N/A'}
`;
}

const formatRelationshipsForPrompt = (relationships: Relationship[]): string => {
    if (!relationships || relationships.length === 0) return 'N/A';
    return relationships.map(rel => 
        `- ${rel.character1} & ${rel.character2}: [${rel.type}] ${rel.description}`
    ).join('\n');
};

const formatStoryEncyclopediaForPrompt = (storyEncyclopedia: StoryEncyclopedia): string => {
    const allGenres = [...storyEncyclopedia.genres, storyEncyclopedia.otherGenre].filter(Boolean).join(', ');
    const storyArcString = storyEncyclopedia.storyArc.map(act => `- ${act.title}: ${act.description}`).join('\n');
    
    const protagonistString = formatCharacterForPrompt(storyEncyclopedia.protagonist, 'PROTAGONIST');
    const loveInterestsString = storyEncyclopedia.loveInterests?.map((li, i) => formatCharacterForPrompt(li, `LOVE INTEREST #${i + 1}`)).join('') || 'N/A';
    const antagonistsString = storyEncyclopedia.antagonists?.map((ant, i) => formatCharacterForPrompt(ant, `ANTAGONIST #${i + 1}`)).join('') || 'N/A';
    const relationshipsString = formatRelationshipsForPrompt(storyEncyclopedia.relationships);

    return `
--- STORY ENCYCLOPEDIA CONTEXT ---

**TITLE:** ${storyEncyclopedia.title}
**GENRE:** ${allGenres}
**SETTING:** ${storyEncyclopedia.setting}

**CORE PLOT:** ${storyEncyclopedia.mainPlot}

**CHARACTERS:**
${protagonistString}
${loveInterestsString}
${antagonistsString}

**RELATIONSHIPS:**
${relationshipsString}

${storyEncyclopedia.worldBuilding ? `\n**WORLD BUILDING:** ${storyEncyclopedia.worldBuilding}` : ''}
${storyEncyclopedia.magicSystem ? `\n**MAGIC/SYSTEM RULES:** ${storyEncyclopedia.magicSystem}` : ''}

**STORY ARC:**
${storyArcString}

**TONE & STYLE:**
- Comedy: ${storyEncyclopedia.comedyLevel}/10
- Romance: ${storyEncyclopedia.romanceLevel}/10
- Action: ${storyEncyclopedia.actionLevel}/10
${storyEncyclopedia.maturityLevel && parseInt(storyEncyclopedia.maturityLevel, 10) > 1 ? `- Maturity: ${storyEncyclopedia.maturityLevel}/10` : ''}
- Prose: ${storyEncyclopedia.proseStyle}

--- END OF CONTEXT ---

Based on this context, assist the user in developing their story.
`;
}

export const createChatSession = (isThinkingMode: boolean, storyEncyclopedia: StoryEncyclopedia): Chat => {
    const ai = initializeGenAI();
    
    const systemInstruction = storyEncyclopedia.language === 'id' ? SYSTEM_INSTRUCTION_ID : SYSTEM_INSTRUCTION_EN;
    const dynamicSystemInstruction = systemInstruction + formatStoryEncyclopediaForPrompt(storyEncyclopedia);
    const model = isThinkingMode ? ModelType.PRO : ModelType.FLASH;

    const config: any = {
        systemInstruction: dynamicSystemInstruction,
    };

    if (model === ModelType.PRO && isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: MAX_THINKING_BUDGET };
    }

    const chat = ai.chats.create({
        model: model,
        config: config,
    });

    return chat;
};

// --- Story Encyclopedia Generation Service ---

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        age: { type: Type.STRING },
        gender: { type: Type.STRING },
        physicalDescription: { type: Type.STRING, description: "A 1-2 sentence description of their physical appearance." },
        voiceAndSpeechStyle: { type: Type.STRING, description: "A short description of their physical voice AND their typical speech patterns (e.g., speaks quickly, uses sarcasm, has a catchphrase)." },
        personalityTraits: { type: Type.STRING, description: "A 1-2 sentence summary of their key personality traits." },
        habits: { type: Type.STRING, description: "A short description of a notable habit or quirk." },
        goal: { type: Type.STRING, description: "Their primary motivation or goal in the story." },
        principles: { type: Type.STRING, description: "A core principle or value they live by." },
        conflict: { type: Type.STRING, description: "The central internal or external conflict they face." },
    },
    required: ["name", "age", "gender", "physicalDescription", "voiceAndSpeechStyle", "personalityTraits", "habits", "goal", "principles", "conflict"]
};

const relationshipSchema = {
    type: Type.OBJECT,
    properties: {
        character1: { type: Type.STRING, description: "The name of the first character in the relationship." },
        character2: { type: Type.STRING, description: "The name of the second character in the relationship." },
        type: { type: Type.STRING, description: "The type of relationship (e.g., 'Rivals', 'Childhood Friends', 'Mentor-Mentee')." },
        description: { type: Type.STRING, description: "A 1-sentence description of their dynamic." },
    },
    required: ["character1", "character2", "type", "description"]
};

const generationConfig: any = {
    basic: {
        prompt: (idea: string, selectedGenres: string[]) => `Based on the user's idea: "${idea}" and their chosen genres: "${selectedGenres.join(', ')}", generate the basic info for a webnovel. Come up with a fitting title, a setting, a planned number of chapters (between 100-300), and words per chapter (between 1500-3000).`,
        schema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the webnovel." },
                setting: { type: Type.STRING, description: "A one or two sentence description of the story's setting." },
                totalChapters: { type: Type.STRING, description: "A number between 100 and 300." },
                wordsPerChapter: { type: Type.STRING, description: "A number between 1500 and 3000." },
            },
            required: ["title", "setting", "totalChapters", "wordsPerChapter"]
        }
    },
    core: {
        prompt: (context: string) => `Based on the following story context: \n\n${context}\n\nGenerate all core story elements. This includes:\n1. A compelling main plot summary (3-5 sentences).\n2. A DETAILED profile for the main protagonist (including their gender).\n3. A DETAILED profile for TWO compelling love interests. IMPORTANT: The love interests MUST have a different gender from the protagonist (whose gender is specified in their profile in the context).\n4. A DETAILED profile for ONE compelling antagonist.\n5. For each character, provide: name, age, gender, physical description, voice & speech style, key personality traits, habits, a primary goal, core principles, and a central conflict.\n6. If the story genres (visible in the context) include Fantasy, Sci-Fi, etc., generate a brief (2-3 sentences) description for 'worldBuilding'. If not relevant, return an empty string.\n7. If the story genres (visible in the context) include System, Fantasy, etc., generate a brief (2-3 sentences) description for 'magicSystem'. If not relevant, return an empty string.`,
        schema: {
            type: Type.OBJECT,
            properties: {
                mainPlot: { type: Type.STRING },
                protagonist: characterSchema,
                loveInterests: {
                    type: Type.ARRAY,
                    description: "An array of 2 detailed love interest profiles.",
                    items: characterSchema
                },
                antagonists: {
                    type: Type.ARRAY,
                    description: "An array of 1 detailed antagonist profile.",
                    items: characterSchema
                },
                worldBuilding: { type: Type.STRING, description: "Optional: World-building details. Can be an empty string if not relevant to the genre." },
                magicSystem: { type: Type.STRING, description: "Optional: Magic/System rules. Can be an empty string if not relevant to the genre." },
            },
            required: ["mainPlot", "protagonist", "loveInterests", "antagonists"]
        }
    },
    mainPlot: {
        prompt: (context: string) => `Based on the story context provided below, generate a compelling main plot summary in 3-5 sentences.\n\n${context}`,
        schema: { type: Type.OBJECT, properties: { mainPlot: { type: Type.STRING, description: "A 3-5 sentence summary of the main plot." } }, required: ["mainPlot"] }
    },
    protagonist: {
        prompt: (context: string) => `Based on the story context provided below, generate a detailed profile for the main protagonist. Provide: name, age, gender, physical description, voice & speech style, key personality traits, habits, a primary goal, core principles, and a central conflict.`,
        schema: characterSchema
    },
    loveInterest: {
        prompt: (context: string) => `Based on the story context provided below, create one compelling and unique love interest. The protagonist's details (including gender) are in the context. The love interest you create MUST have a different gender from the protagonist. Provide a detailed profile including: name, age, gender, physical description, voice & speech style, key personality traits, habits, a primary goal, core principles, and a central conflict related to the protagonist.`,
        schema: characterSchema
    },
    antagonist: {
        prompt: (context: string) => `Based on the story context provided below, create one compelling antagonist. Provide a detailed profile including: name, age, gender, physical description, voice & speech style, key personality traits, habits, a primary goal, core principles, and a central conflict with the protagonist.`,
        schema: characterSchema
    },
    relationships: {
        prompt: (context: string) => `Based on the character profiles in the context below, generate a list of 3-5 interesting and potentially conflict-driving relationships between them. For each relationship, define who is involved, the type of relationship, and a short description of their dynamic.\n\n${context}`,
        schema: {
            type: Type.OBJECT,
            properties: {
                relationships: {
                    type: Type.ARRAY,
                    items: relationshipSchema
                }
            },
            required: ["relationships"]
        }
    },
    worldBuilding: {
        prompt: (context: string) => `Based on the story context provided below, describe the key world-building details in 2-3 sentences. This is for genres like Fantasy, Sci-Fi, etc.\n\n${context}`,
        schema: { type: Type.OBJECT, properties: { worldBuilding: { type: Type.STRING, description: "Key aspects of the world building."} }, required: ["worldBuilding"] }
    },
    magicSystem: {
        prompt: (context: string) => `Based on the story context provided below, describe the magic or power system in 2-3 sentences. This is for genres like System, Fantasy, Wuxia, etc.\n\n${context}`,
        schema: { type: Type.OBJECT, properties: { magicSystem: { type: Type.STRING, description: "Description of the rules of magic or the 'System'." } }, required: ["magicSystem"] }
    },
    singleArcAct: {
        prompt: (context: string, index: number, total: number) => `Based on the story context provided below, generate a title and a 1-2 sentence description for Act ${index + 1} of a ${total}-act story structure.\n\n${context}`,
        schema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["title", "description"]
        }
    },
    arc: {
        prompt: (context: string) => `Based on the following story context: \n\n${context}\n\nGenerate a 4-act story arc. For each act, provide a title and a 1-2 sentence description of what happens.`,
        schema: {
            type: Type.OBJECT,
            properties: {
                storyArc: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["title", "description"]
                    }
                }
            },
            required: ["storyArc"]
        }
    },
    tone: {
        prompt: (context: string) => `Based on the following story context: \n\n${context}\n\nSuggest the tone and style. Provide a comedy, romance, and action level from 1-10. If the context contains mature genres, also suggest a maturity level from 1-10, otherwise default maturity to "1". Also, choose the most fitting prose style.`,
        schema: {
            type: Type.OBJECT,
            properties: {
                comedyLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                romanceLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                actionLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                maturityLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                proseStyle: { type: Type.STRING, description: "The most fitting prose style." },
            },
            required: ["comedyLevel", "romanceLevel", "actionLevel", "maturityLevel", "proseStyle"]
        }
    }
};

export const generateStoryEncyclopediaSection = async (
    section: string,
    storyEncyclopedia: Partial<StoryEncyclopedia>,
    language: 'en' | 'id',
    idea?: string,
    index?: number,
): Promise<any> => {
    const ai = initializeGenAI();
    const configKey = Object.keys(generationConfig).find(key => section.startsWith(key)) || '';
    const config = generationConfig[configKey];
    if (!config) throw new Error(`Invalid section for generation: ${section}`);

    const langInstruction = language === 'id' 
        ? 'Generate the entire JSON response strictly in Bahasa Indonesia, translating any English concepts in the prompt naturally.' 
        : 'Generate the entire JSON response strictly in English, translating any Indonesian concepts in the prompt naturally.';

    let prompt = '';
    const context = JSON.stringify(storyEncyclopedia, null, 2);

    if (section === 'basic') {
        if (!idea) throw new Error("An initial idea is required to generate basic info.");
        const selectedGenres = [...(storyEncyclopedia.genres || []), storyEncyclopedia.otherGenre || ''].filter(Boolean);
        prompt = config.prompt(idea, selectedGenres);
    } else if (section.startsWith('singleArcAct')) {
        const actIndex = index ?? 0;
        const totalActs = storyEncyclopedia.storyArc?.length || 4;
        prompt = config.prompt(context, actIndex, totalActs);
    } else {
        prompt = config.prompt(context);
    }

    const finalPrompt = `${langInstruction}\n\n${prompt}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: config.schema,
            }
        });

        const jsonString = response.text.trim();
        
        try {
            const generatedData = JSON.parse(jsonString);
            
            if (section === 'tone' && language === 'id') {
                const matchingStyle = PROSE_STYLES_EN.find(s => s.value.toLowerCase().includes(generatedData.proseStyle.toLowerCase().split(' ')[0]));
                if (matchingStyle) {
                    const translatedStyle = PROSE_STYLES_EN.indexOf(matchingStyle);
                    generatedData.proseStyle = PROSE_STYLES_EN[translatedStyle].value;
                }
            }
            if(section.startsWith('loveInterest') || section.startsWith('antagonist') || section.startsWith('protagonist')) {
                return generatedData as Character;
            }

            return generatedData;
        } catch (parseError) {
            console.error("Failed to parse JSON response from AI:", jsonString);
            throw new Error("The AI returned a response that was not valid JSON. Please try generating again.");
        }

    } catch (error) {
        console.error(`Error generating section ${section}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate ${section} section: ${error.message}`);
        }
        throw new Error(`Failed to generate ${section} section. Please try again.`);
    }
};