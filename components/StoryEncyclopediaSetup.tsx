import React, { useState, useMemo, useEffect } from 'react';
import { StoryEncyclopedia, StoryArcAct, Character, Relationship } from '../types';
import { GENRES_EN, GENRES_ID, PROSE_STYLES_EN, PROSE_STYLES_ID } from '../constants';
import { generateStoryEncyclopediaSection } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';

interface StoryEncyclopediaSetupProps {
  onStoryCreate: (data: StoryEncyclopedia) => void;
  initialData?: StoryEncyclopedia | null;
  onCancel?: () => void;
}

const createEmptyCharacter = (): Character => ({
  name: '', age: '', gender: '', physicalDescription: '', voiceAndSpeechStyle: '',
  personalityTraits: '', habits: '', goal: '', principles: '', conflict: ''
});

const createEmptyRelationship = (): Relationship => ({
    character1: '',
    character2: '',
    type: '',
    description: ''
});

const initialFormData: StoryEncyclopedia = {
  language: 'en',
  title: '',
  genres: [],
  otherGenre: '',
  setting: '',
  totalChapters: '',
  wordsPerChapter: '',
  mainPlot: '',
  protagonist: createEmptyCharacter(),
  loveInterests: [createEmptyCharacter()],
  antagonists: [createEmptyCharacter()],
  relationships: [],
  magicSystem: '',
  worldBuilding: '',
  storyArc: [{ title: 'Act 1', description: '' }],
  comedyLevel: '5',
  romanceLevel: '5',
  actionLevel: '5',
  maturityLevel: '1',
  proseStyle: PROSE_STYLES_EN[0].value,
};


type GeneratingSection = string | null;

const GenerateButton: React.FC<{onClick: () => void; disabled: boolean; isLoading: boolean; lang: 'en' | 'id'}> = ({ onClick, disabled, isLoading, lang}) => (
    <button 
        type="button" 
        onClick={onClick}
        disabled={disabled || isLoading}
        className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold text-indigo-300 bg-slate-700/50 rounded-md border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
        {isLoading ? (
            <>
                <SpinnerIcon className="w-4 h-4" />
                {lang === 'id' ? 'Menghasilkan...' : 'Generating...'}
            </>
        ) : (
            <>
                <SparklesIcon className="w-4 h-4" />
                {lang === 'id' ? 'Buat dengan AI' : 'Generate with AI'}
            </>
        )}
    </button>
);

const SubGenerateButton: React.FC<{onClick: () => void; isLoading: boolean; title: string;}> = ({ onClick, isLoading, title }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        title={title}
        className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
    >
        {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
    </button>
);

const ClearButton: React.FC<{onClick: () => void; title: string}> = ({ onClick, title }) => (
    <button
        type="button"
        onClick={onClick}
        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-900/50 rounded-md transition-colors"
        title={title}
    >
        <TrashIcon className="w-4 h-4" />
    </button>
);


const FormSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean; onGenerate?: () => void; generateDisabled?: boolean; isGenerating?: boolean; onClear?: () => void; lang: 'en' | 'id' }> = ({ title, children, grid = true, onGenerate, generateDisabled = false, isGenerating = false, onClear, lang }) => (
  <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
    <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
      <h3 className="text-xl font-bold text-indigo-400">{title}</h3>
      <div className="flex items-center gap-2">
        {onClear && <ClearButton onClick={onClear} title={lang === 'id' ? 'Bersihkan bagian ini' : 'Clear this section'} />}
        {onGenerate && <GenerateButton onClick={onGenerate} disabled={generateDisabled} isLoading={!!isGenerating} lang={lang} />}
      </div>
    </div>
    <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>{children}</div>
  </div>
);

const FormField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; isTextArea?: boolean; fullWidth?: boolean; onGenerate?: () => void; isGenerating?: boolean; generateTitle?: string; placeholder?: string; }> = ({ label, name, value, onChange, isTextArea = false, fullWidth = false, onGenerate, isGenerating, generateTitle, placeholder }) => (
  <div className={fullWidth ? 'col-span-1 md:col-span-2' : ''}>
    <div className="flex items-center justify-between mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
        {onGenerate && <SubGenerateButton onClick={onGenerate} isLoading={!!isGenerating} title={generateTitle || 'Generate'} />}
    </div>
    {isTextArea ? (
      <textarea id={name} name={name} value={value || ''} onChange={onChange} rows={3} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
    ) : (
      <input id={name} type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
    )}
  </div>
);

const CharacterForm: React.FC<{ character: Character; onChange: (field: keyof Character, value: string) => void; lang: 'en' | 'id'; }> = ({ character, onChange, lang }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.name as keyof Character, e.target.value);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={lang === 'id' ? 'Nama' : 'Name'} name="name" value={character.name} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-x-2">
                <FormField label={lang === 'id' ? 'Usia' : 'Age'} name="age" value={character.age} onChange={handleChange} />
                <FormField label={lang === 'id' ? 'Gender' : 'Gender'} name="gender" value={character.gender} onChange={handleChange} />
            </div>
            <FormField label={lang === 'id' ? 'Deskripsi Fisik' : 'Physical Description'} name="physicalDescription" value={character.physicalDescription} onChange={handleChange} isTextArea fullWidth />
            <FormField 
                label={lang === 'id' ? 'Suara & Gaya Bicara' : 'Voice & Speech Style'} 
                name="voiceAndSpeechStyle" 
                value={character.voiceAndSpeechStyle} 
                onChange={handleChange} 
                isTextArea 
                fullWidth 
                placeholder={lang === 'id' ? 'contoh: Suara bariton yang tenang; bicara perlahan dan terukur, sering menggunakan kiasan.' : 'e.g., A calm baritone voice; speaks slowly and deliberately, often using metaphors.'}
            />
            <FormField label={lang === 'id' ? 'Sifat Kepribadian' : 'Personality Traits'} name="personalityTraits" value={character.personalityTraits} onChange={handleChange} isTextArea fullWidth />
            <FormField label={lang === 'id' ? 'Kebiasaan/Kekhasan' : 'Habits/Quirks'} name="habits" value={character.habits} onChange={handleChange} isTextArea fullWidth />
            <FormField label={lang === 'id' ? 'Tujuan/Motivasi' : 'Goal/Motivation'} name="goal" value={character.goal} onChange={handleChange} isTextArea fullWidth />
            <FormField label={lang === 'id' ? 'Prinsip/Nilai' : 'Principles/Values'} name="principles" value={character.principles} onChange={handleChange} isTextArea fullWidth />
            <FormField label={lang === 'id' ? 'Konflik Inti' : 'Core Conflict'} name="conflict" value={character.conflict} onChange={handleChange} isTextArea fullWidth />
        </div>
    );
};


const StoryEncyclopediaSetup: React.FC<StoryEncyclopediaSetupProps> = ({ onStoryCreate, initialData, onCancel }) => {
  const [formData, setFormData] = useState<StoryEncyclopedia>(initialData || initialFormData);
  const [language, setLanguage] = useState<'en' | 'id'>(initialData?.language || 'en');
  const [initialIdea, setInitialIdea] = useState('');
  const [generatingSection, setGeneratingSection] = useState<GeneratingSection>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;
  
  const GENRES = language === 'id' ? GENRES_ID : GENRES_EN;
  const PROSE_STYLES = language === 'id' ? PROSE_STYLES_ID : PROSE_STYLES_EN;

  const showWorldBuilding = formData.genres.some(g => ['Transmigration', 'Fantasy', 'Sci-Fi', 'Transmigrasi', 'Fiksi Ilmiah'].includes(g));
  const showMagicSystem = formData.genres.some(g => ['System', 'Fantasy', 'Wuxia', 'Xianxia', 'Sistem'].includes(g));
  const showMaturityLevel = formData.genres.some(g => ['Mature', 'Dewasa'].includes(g));

  const allCharacters = useMemo(() => {
    return [
      formData.protagonist,
      ...formData.loveInterests,
      ...formData.antagonists
    ].filter(c => c && c.name && c.name.trim() !== '');
  }, [formData.protagonist, formData.loveInterests, formData.antagonists]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setLanguage(initialData.language);
    }
  }, [initialData]);

  useEffect(() => {
      if (!isEditing) {
          setFormData(prev => ({ ...prev, language }));
      }
  }, [language, isEditing]);


  const isBasicInfoReady = useMemo(() => initialIdea.trim() !== '' && (formData.genres.length > 0 || formData.otherGenre.trim() !== ''), [initialIdea, formData.genres, formData.otherGenre]);
  const isBasicInfoComplete = useMemo(() => formData.title.trim() !== '' && (formData.genres.length > 0 || formData.otherGenre.trim() !== '') && formData.setting.trim() !== '', [formData]);
  const isCoreStoryComplete = useMemo(() => isBasicInfoComplete && formData.mainPlot.trim() !== '' && formData.protagonist.name.trim() !== '', [isBasicInfoComplete, formData]);
  const isStoryArcComplete = useMemo(() => isCoreStoryComplete && formData.storyArc.length > 0 && formData.storyArc.every(act => act.title.trim() !== '' && act.description.trim() !== ''), [isCoreStoryComplete, formData]);


  const handleGenerate = async (section: string, index?: number) => {
    setGeneratingSection(section + (index !== undefined ? `_${index}` : ''));
    setError(null);
    try {
      const result = await generateStoryEncyclopediaSection(section, formData, language, initialIdea, index);
      
      if (section === 'protagonist') {
          setFormData(prev => ({ ...prev, protagonist: result as Character }));
      } else if (section === 'loveInterest' && index !== undefined) {
          setFormData(prev => {
              const newLoveInterests = [...prev.loveInterests];
              newLoveInterests[index] = result as Character;
              return { ...prev, loveInterests: newLoveInterests };
          });
      } else if (section === 'antagonist' && index !== undefined) {
          setFormData(prev => {
              const newAntagonists = [...prev.antagonists];
              newAntagonists[index] = result as Character;
              return { ...prev, antagonists: newAntagonists };
          });
      } else if (section === 'singleArcAct' && index !== undefined) {
          setFormData(prev => {
              const newStoryArc = [...prev.storyArc];
              newStoryArc[index] = result as StoryArcAct;
              return { ...prev, storyArc: newStoryArc };
          });
      }
      else {
          setFormData(prev => ({ ...prev, ...result }));
      }

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleClearSection = (section: 'core' | 'relationships' | 'arc' | 'tone') => {
      let clearedFields: Partial<StoryEncyclopedia> = {};
      switch(section) {
          case 'core':
              clearedFields = {
                  mainPlot: '', protagonist: createEmptyCharacter(),
                  loveInterests: [createEmptyCharacter()], antagonists: [createEmptyCharacter()], 
                  magicSystem: '', worldBuilding: ''
              };
              break;
          case 'relationships':
              clearedFields = { relationships: [] };
              break;
          case 'arc':
              clearedFields = { storyArc: [{ title: language === 'id' ? 'Babak 1' : 'Act 1', description: '' }] };
              break;
          case 'tone':
              clearedFields = {
                  comedyLevel: '5', romanceLevel: '5', actionLevel: '5', maturityLevel: '1',
                  proseStyle: PROSE_STYLES[0].value,
              };
              break;
      }
      setFormData(prev => ({ ...prev, ...clearedFields }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenreChange = (genre: string) => {
    setFormData(prev => {
        const currentGenres = prev.genres;
        const newGenres = currentGenres.includes(genre)
            ? currentGenres.filter(g => g !== genre)
            : [...prev.genres, genre];
        
        const updatedData = { ...prev, genres: newGenres };

        if (!isEditing) {
            if (!newGenres.some(g => ['Transmigration', 'Fantasy', 'Sci-Fi', 'Transmigrasi', 'Fiksi Ilmiah'].includes(g))) {
                updatedData.worldBuilding = '';
            }
            if (!newGenres.some(g => ['System', 'Fantasy', 'Wuxia', 'Xianxia', 'Sistem'].includes(g))) {
                updatedData.magicSystem = '';
            }
        }
        
        return updatedData;
    });
  };

  const handleCharacterChange = (listName: 'loveInterests' | 'antagonists', index: number, field: keyof Character, value: string) => {
      setFormData(prev => {
          const newList = [...prev[listName]];
          newList[index] = { ...newList[index], [field]: value };
          return { ...prev, [listName]: newList };
      });
  };

  const handleProtagonistChange = (field: keyof Character, value: string) => {
      setFormData(prev => ({
          ...prev,
          protagonist: { ...prev.protagonist, [field]: value }
      }));
  };

  const addDynamicListItem = (listName: 'loveInterests' | 'antagonists') => {
      setFormData(prev => ({
          ...prev,
          [listName]: [...prev[listName], createEmptyCharacter()]
      }));
  };

  const removeDynamicListItem = (listName: 'loveInterests' | 'antagonists', index: number) => {
      setFormData(prev => ({
          ...prev,
          [listName]: prev[listName].filter((_, i) => i !== index)
      }));
  };

  const handleRelationshipChange = (index: number, field: keyof Relationship, value: string) => {
    setFormData(prev => {
      const newRelationships = [...prev.relationships];
      newRelationships[index] = { ...newRelationships[index], [field]: value };
      return { ...prev, relationships: newRelationships };
    });
  };

  const addRelationship = () => {
    setFormData(prev => ({
      ...prev,
      relationships: [...prev.relationships, createEmptyRelationship()]
    }));
  };

  const removeRelationship = (index: number) => {
    setFormData(prev => ({
      ...prev,
      relationships: prev.relationships.filter((_, i) => i !== index)
    }));
  };


  const handleArcChange = (index: number, field: keyof StoryArcAct, value: string) => {
    setFormData(prev => {
        const newArc = [...prev.storyArc];
        newArc[index] = { ...newArc[index], [field]: value };
        return { ...prev, storyArc: newArc };
    });
  };

  const handleAddAct = () => {
      setFormData(prev => ({
          ...prev,
          storyArc: [...prev.storyArc, { title: `${language === 'id' ? 'Babak' : 'Act'} ${prev.storyArc.length + 1}`, description: '' }]
      }));
  };

  const handleRemoveAct = (index: number) => {
      if (formData.storyArc.length <= 1) return;
      setFormData(prev => ({
          ...prev,
          storyArc: prev.storyArc.filter((_, i) => i !== index)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalData = { ...formData };
    if (!finalData.genres.some(g => ['Transmigration', 'Fantasy', 'Sci-Fi', 'Transmigrasi', 'Fiksi Ilmiah'].includes(g))) finalData.worldBuilding = '';
    if (!finalData.genres.some(g => ['System', 'Fantasy', 'Wuxia', 'Xianxia', 'Sistem'].includes(g))) finalData.magicSystem = '';
    if (!finalData.genres.some(g => ['Mature', 'Dewasa'].includes(g))) finalData.maturityLevel = '1';
    if (isEditing && initialData?.title && formData.title !== initialData.title) {
        if (!window.confirm('You have changed the story title. This will delete the chat history associated with the old title and start a new one. Are you sure?')) {
            return;
        }
    }
    onStoryCreate(finalData);
  };

  const selectedProseStyle = PROSE_STYLES.find(s => s.value === formData.proseStyle);


  return (
    <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-100">{isEditing ? (language === 'id' ? 'Edit Ensiklopedia Cerita Anda' : 'Edit Your Story Encyclopedia') : (language === 'id' ? 'Buat Ensiklopedia Cerita Anda' : 'Create Your Story Encyclopedia')}</h2>
            <p className="text-slate-400 mt-2">{isEditing ? (language === 'id' ? 'Sempurnakan detail dunia Anda.' : 'Refine the details of your world.') : (language === 'id' ? 'Mulai dengan ide inti, lalu biarkan AI membantu Anda membangun dunia, langkah demi langkah.' : 'Start with a core idea, then let AI help you build the world, step by step.')}</p>
        </div>
        
        {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-md mb-6 text-center">
                <strong>{language === 'id' ? 'Pembuatan Gagal' : 'Generation Failed'}:</strong> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            {!isEditing && (
                <>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold text-indigo-400 mb-2">{language === 'id' ? 'Pilih Bahasa' : 'Choose Language'}</h3>
                    <p className="text-slate-400 mb-4 text-sm">{language === 'id' ? 'Bahasa ini akan digunakan oleh AI untuk semua generasi konten.' : 'This language will be used by the AI for all content generation.'}</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-md font-medium transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            English
                        </button>
                        <button type="button" onClick={() => setLanguage('id')} className={`px-4 py-2 rounded-md font-medium transition-colors ${language === 'id' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            Bahasa Indonesia
                        </button>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
                    <h3 className="text-xl font-bold text-indigo-400">{language === 'id' ? 'Percikan Kreasi' : 'The Spark of Creation'}</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'id' ? '1. Tulis ide ceritamu' : '1. Write your story idea'}</label>
                        <p className="text-slate-400 mb-2 text-xs">{language === 'id' ? 'Jelaskan cerita Anda dalam satu kalimat. Ini adalah benih untuk semua yang akan datang.' : 'Describe your story in one sentence. This is the seed for everything that follows.'}</p>
                        <textarea value={initialIdea} onChange={e => setInitialIdea(e.target.value)} placeholder={language === 'id' ? 'contoh: Sebuah opera luar angkasa tentang seorang pembuat roti yang menemukan pesawat legendaris terbuat dari roti.' : 'e.g., A space opera about a baker who discovers a legendary starship made of bread.'} rows={2} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">{language === 'id' ? '2. Pilih genre-mu' : '2. Choose your genres'}</label>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(genre => (
                                <label key={genre} className="flex items-center space-x-2 cursor-pointer bg-slate-700 px-3 py-1 rounded-full text-sm">
                                    <input type="checkbox" checked={formData.genres.includes(genre)} onChange={() => handleGenreChange(genre)} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500"/>
                                    <span>{genre}</span>
                                </label>
                            ))}
                        </div>
                        <input type="text" name="otherGenre" value={formData.otherGenre} onChange={handleChange} placeholder={language === 'id' ? 'Lainnya (sebutkan)' : 'Other (specify)'} className="mt-3 w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
                    </div>
                </div>
                </>
            )}

            <FormSection title={language === 'id' ? 'Info Dasar' : 'Basic Info'} onGenerate={() => handleGenerate('basic')} generateDisabled={!isBasicInfoReady && !isEditing} isGenerating={generatingSection === 'basic'} lang={language}>
                 {!isEditing && (<p className="col-span-1 md:col-span-2 text-sm text-slate-400 -mt-2 mb-4">{language === 'id' ? "Setelah Anda memberikan ide dan memilih genre, klik 'Buat dengan AI' untuk menghasilkan judul, latar, dan detail lainnya." : "Once you've provided an idea and chosen genres, click 'Generate with AI' to create a title, setting, and other details."}</p>)}
                <FormField label={language === 'id' ? 'Judul' : 'Title'} name="title" value={formData.title} onChange={handleChange} fullWidth/>
                <FormField label={language === 'id' ? 'Latar' : 'Setting'} name="setting" value={formData.setting} onChange={handleChange} isTextArea fullWidth />
                <FormField label={language === 'id' ? 'Total Rencana Bab' : 'Total Chapters Planned'} name="totalChapters" value={formData.totalChapters} onChange={handleChange} />
                <FormField label={language === 'id' ? 'Target Kata per Bab' : 'Target Words Per Chapter'} name="wordsPerChapter" value={formData.wordsPerChapter} onChange={handleChange} />
            </FormSection>

            <FormSection title={language === 'id' ? 'Elemen Cerita Inti' : 'Core Story Elements'} onGenerate={() => handleGenerate('core')} generateDisabled={!isBasicInfoComplete} isGenerating={generatingSection === 'core'} onClear={() => handleClearSection('core')} lang={language}>
                <FormField label={language === 'id' ? 'Plot Utama (3-5 kalimat)' : 'Main Plot (3-5 sentences)'} name="mainPlot" value={formData.mainPlot} onChange={handleChange} isTextArea fullWidth onGenerate={() => handleGenerate('mainPlot')} isGenerating={generatingSection === 'mainPlot'} generateTitle={language === 'id' ? 'Buat Plot Utama' : 'Generate Main Plot'} />
                
                <div className="col-span-1 md:col-span-2 bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                         <h4 className="font-semibold text-slate-200">{language === 'id' ? 'Protagonis' : 'Protagonist'}</h4>
                         <SubGenerateButton onClick={() => handleGenerate('protagonist')} isLoading={generatingSection === 'protagonist'} title={language === 'id' ? 'Buat Protagonis' : 'Generate Protagonist'} />
                    </div>
                    <CharacterForm character={formData.protagonist} onChange={handleProtagonistChange} lang={language} />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-3">
                    <h4 className="font-semibold text-slate-200">{language === 'id' ? 'Pasangan' : 'Love Interests'}</h4>
                    {formData.loveInterests.map((li, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 rounded-lg bg-slate-700/50">
                             <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-300">#{index + 1}</h5>
                                <div className="flex items-center gap-2">
                                     <SubGenerateButton onClick={() => handleGenerate('loveInterest', index)} isLoading={generatingSection === `loveInterest_${index}`} title={language === 'id' ? 'Buat Pasangan' : 'Generate Love Interest'} />
                                     <button type="button" onClick={() => removeDynamicListItem('loveInterests', index)} className="p-1.5 text-slate-400 hover:text-rose-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <CharacterForm character={li} onChange={(field, value) => handleCharacterChange('loveInterests', index, field, value)} lang={language} />
                        </div>
                    ))}
                    <button type="button" onClick={() => addDynamicListItem('loveInterests')} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                       {language === 'id' ? '+ Tambah Pasangan' : '+ Add Love Interest'}
                    </button>
                </div>

                 <div className="col-span-1 md:col-span-2 space-y-3">
                    <h4 className="font-semibold text-slate-200">{language === 'id' ? 'Antagonis/Rintangan' : 'Antagonists/Obstacles'}</h4>
                    {formData.antagonists.map((ant, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 rounded-lg bg-slate-700/50">
                            <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-300">#{index + 1}</h5>
                                <div className="flex items-center gap-2">
                                    <SubGenerateButton onClick={() => handleGenerate('antagonist', index)} isLoading={generatingSection === `antagonist_${index}`} title={language === 'id' ? 'Buat Antagonis' : 'Generate Antagonist'} />
                                    <button type="button" onClick={() => removeDynamicListItem('antagonists', index)} className="p-1.5 text-slate-400 hover:text-rose-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                           <CharacterForm character={ant} onChange={(field, value) => handleCharacterChange('antagonists', index, field, value)} lang={language} />
                        </div>
                    ))}
                    <button type="button" onClick={() => addDynamicListItem('antagonists')} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                       {language === 'id' ? '+ Tambah Antagonis' : '+ Add Antagonist'}
                    </button>
                </div>
                
                {showWorldBuilding && <FormField label={language === 'id' ? 'Pembangunan Dunia' : 'World Building'} name="worldBuilding" value={formData.worldBuilding || ''} onChange={handleChange} isTextArea fullWidth onGenerate={() => handleGenerate('worldBuilding')} isGenerating={generatingSection === 'worldBuilding'} generateTitle={language === 'id' ? 'Buat Pembangunan Dunia' : 'Generate World Building'} />}
                {showMagicSystem && <FormField label={language === 'id' ? 'Aturan Sistem/Sihir' : 'System/Magic Rules'} name="magicSystem" value={formData.magicSystem || ''} onChange={handleChange} isTextArea fullWidth onGenerate={() => handleGenerate('magicSystem')} isGenerating={generatingSection === 'magicSystem'} generateTitle={language === 'id' ? 'Buat Aturan Sistem/Sihir' : 'Generate System/Magic Rules'} />}
            </FormSection>
            
            <FormSection title={language === 'id' ? 'Hubungan Karakter' : 'Character Relationships'} grid={false} onGenerate={() => handleGenerate('relationships')} generateDisabled={allCharacters.length < 2} isGenerating={generatingSection === 'relationships'} onClear={() => handleClearSection('relationships')} lang={language}>
              {allCharacters.length < 2 ? (
                <p className="text-sm text-slate-400 text-center">{language === 'id' ? 'Anda memerlukan setidaknya dua karakter dengan nama untuk mendefinisikan hubungan.' : 'You need at least two named characters to define relationships.'}</p>
              ) : (
                <>
                  {formData.relationships.map((rel, index) => (
                    <div key={index} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative">
                      <div className="flex items-center gap-2">
                          <select
                            value={rel.character1}
                            onChange={(e) => handleRelationshipChange(index, 'character1', e.target.value)}
                            className="w-full bg-slate-600 text-slate-200 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                              <option value="">{language === 'id' ? 'Pilih Karakter 1' : 'Select Character 1'}</option>
                              {allCharacters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <span className="text-slate-400">&</span>
                           <select
                            value={rel.character2}
                            onChange={(e) => handleRelationshipChange(index, 'character2', e.target.value)}
                            className="w-full bg-slate-600 text-slate-200 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                              <option value="">{language === 'id' ? 'Pilih Karakter 2' : 'Select Character 2'}</option>
                              {allCharacters.filter(c => c.name !== rel.character1).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                           <button type="button" onClick={() => removeRelationship(index)} className="p-1.5 text-slate-400 hover:text-rose-400"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                       <input
                            type="text"
                            placeholder={language === 'id' ? 'Jenis Hubungan (e.g., Rival, Teman Masa Kecil)' : 'Relationship Type (e.g., Rivals, Childhood Friends)'}
                            value={rel.type}
                            onChange={(e) => handleRelationshipChange(index, 'type', e.target.value)}
                            className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <textarea
                            placeholder={language === 'id' ? 'Deskripsi singkat dinamika mereka...' : 'A short description of their dynamic...'}
                            value={rel.description}
                            onChange={(e) => handleRelationshipChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                  ))}
                  <button type="button" onClick={addRelationship} className="w-full text-center py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                    {language === 'id' ? '+ Tambah Hubungan' : '+ Add Relationship'}
                  </button>
                </>
              )}
            </FormSection>

            <FormSection title={language === 'id' ? 'Alur Cerita' : 'Story Arc'} grid={false} onGenerate={() => handleGenerate('arc')} generateDisabled={!isCoreStoryComplete} isGenerating={generatingSection === 'arc'} onClear={() => handleClearSection('arc')} lang={language}>
                {formData.storyArc.map((act, index) => (
                    <div key={index} className="p-3 bg-slate-700/50 rounded-md relative">
                        <div className="flex items-center justify-between mb-2">
                            <input type="text" value={act.title} onChange={(e) => handleArcChange(index, 'title', e.target.value)} placeholder={language === 'id' ? 'Judul Babak (contoh: Babak 1: Permulaan)' : 'Act Title (e.g., Act 1: The Beginning)'} className="flex-grow bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <div className="flex items-center">
                                <SubGenerateButton onClick={() => handleGenerate('singleArcAct', index)} isLoading={generatingSection === `singleArcAct_${index}`} title={language === 'id' ? `Buat Babak ${index + 1}` : `Generate Act ${index + 1}`} />
                                {formData.storyArc.length > 1 && (<button type="button" onClick={() => handleRemoveAct(index)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>)}
                            </div>
                        </div>
                        <textarea value={act.description} onChange={(e) => handleArcChange(index, 'description', e.target.value)} rows={2} placeholder={language === 'id' ? 'Deskripsi babak ini...' : 'Description of this act...'} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                ))}
                <button type="button" onClick={handleAddAct} className="w-full text-center py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                    {language === 'id' ? 'Tambah Babak' : 'Add Act'}
                </button>
            </FormSection>

            <FormSection title={language === 'id' ? 'Nada & Gaya' : 'Tone & Style'} onGenerate={() => handleGenerate('tone')} generateDisabled={!isStoryArcComplete} isGenerating={generatingSection === 'tone'} onClear={() => handleClearSection('tone')} lang={language}>
                <div>
                    <FormField label={language === 'id' ? 'Tingkat Komedi (1-10)' : 'Comedy Level (1-10)'} name="comedyLevel" value={formData.comedyLevel} onChange={handleChange} />
                    <p className="text-xs text-slate-400 mt-1">{language === 'id' ? 'Mengontrol frekuensi lelucon, dialog jenaka, dan situasi ringan.' : 'Controls the frequency of jokes, witty banter, and lighthearted situations.'}</p>
                </div>
                 <div>
                    <FormField label={language === 'id' ? 'Tingkat Romansa (1-10)' : 'Romance Level (1-10)'} name="romanceLevel" value={formData.romanceLevel} onChange={handleChange} />
                    <p className="text-xs text-slate-400 mt-1">{language === 'id' ? 'Menentukan fokus pada pengembangan hubungan romantis dan keintiman emosional.' : 'Determines the focus on developing romantic relationships and emotional intimacy.'}</p>
                </div>
                 <div>
                    <FormField label={language === 'id' ? 'Tingkat Aksi (1-10)' : 'Action Level (1-10)'} name="actionLevel" value={formData.actionLevel} onChange={handleChange} />
                     <p className="text-xs text-slate-400 mt-1">{language === 'id' ? 'Menentukan jumlah pertempuran, konflik, dan urutan adegan cepat.' : 'Dictates the amount of combat, conflict, and fast-paced sequences.'}</p>
                </div>
                {showMaturityLevel && (<div><FormField label={language === 'id' ? 'Tingkat Dewasa (1-10)' : 'Maturity Level (1-10)'} name="maturityLevel" value={formData.maturityLevel} onChange={handleChange} /><p className="text-xs text-slate-400 mt-1">{language === 'id' ? 'Mengontrol eksplisitas tema, bahasa, dan adegan dewasa.' : 'Controls the explicitness of adult themes, language, and scenes.'}</p></div>)}
                <div className="col-span-1 md:col-span-2">
                    <label htmlFor="proseStyle" className="block text-sm font-medium text-slate-300 mb-1">{language === 'id' ? 'Gaya Prosa' : 'Prose Style'}</label>
                    <select id="proseStyle" name="proseStyle" value={formData.proseStyle} onChange={handleChange} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200">
                        {PROSE_STYLES.map(style => <option key={style.value} value={style.value}>{style.value}</option>)}
                    </select>
                    {selectedProseStyle && (<p className="text-xs text-slate-400 mt-2 bg-slate-700/50 p-2 rounded-md">{selectedProseStyle.description}</p>)}
                </div>
            </FormSection>

            <div className="flex justify-center items-center gap-4 pt-4">
                {onCancel && (<button type="button" onClick={onCancel} className="text-slate-400 font-bold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors duration-300">{language === 'id' ? 'Batal' : 'Cancel'}</button>)}
                <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-indigo-600/30" disabled={!isStoryArcComplete} title={!isStoryArcComplete ? (language === 'id' ? 'Harap isi semua bagian sebelumnya sebelum membuat dunia cerita.' : "Please fill out all previous sections before creating the story world.") : (isEditing ? (language === 'id' ? 'Simpan Perubahan Cerita' : 'Save Changes to Story') : (language === 'id' ? 'Buat Dunia Ceritaku' : 'Create My Story World'))}>
                    {isEditing ? (language === 'id' ? 'Simpan Perubahan' : 'Save Changes') : (language === 'id' ? 'Buat Dunia Ceritaku' : 'Create My Story World')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default StoryEncyclopediaSetup;