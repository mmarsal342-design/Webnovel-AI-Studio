import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import StoryEncyclopediaSetup from './components/StoryEncyclopediaSetup';
import StoryEncyclopediaSidebar from './components/StoryEncyclopediaSidebar';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { StoryEncyclopedia, Character } from './types';

type SavingStatus = 'idle' | 'saving' | 'saved';

const createEmptyCharacter = (nameOrDesc: string = ''): Character => ({
  name: nameOrDesc,
  age: '',
  gender: '',
  physicalDescription: '',
  voiceAndSpeechStyle: '',
  personalityTraits: '',
  habits: '',
  goal: '',
  principles: '',
  conflict: '',
});

const migrateStoryData = (data: any): StoryEncyclopedia => {
    let parsed = { ...data }; // work on a copy

    // Stage 1: Handle very old formats (loveInterest1/2/3, single antagonist string)
    if (parsed.loveInterest1 && !parsed.loveInterests) {
        parsed.loveInterests = [parsed.loveInterest1, parsed.loveInterest2, parsed.loveInterest3].filter(Boolean);
    }
    if (parsed.antagonist && typeof parsed.antagonist === 'string' && !parsed.antagonists) {
        parsed.antagonists = [parsed.antagonist];
    }
    delete parsed.loveInterest1;
    delete parsed.loveInterest2;
    delete parsed.loveInterest3;
    delete parsed.antagonist;

    // Stage 2: Migrate flat protagonist fields and string arrays for characters to the new Character object structure.
    if (parsed.protagonistName !== undefined || !parsed.protagonist) {
        const newProtagonist = createEmptyCharacter();
        newProtagonist.name = parsed.protagonistName || '';
        newProtagonist.age = parsed.protagonistAge || '';
        newProtagonist.personalityTraits = parsed.protagonistPersonality || '';
        newProtagonist.goal = parsed.protagonistGoal || '';
        newProtagonist.conflict = parsed.protagonistConflict || '';
        parsed.protagonist = newProtagonist;

        delete parsed.protagonistName;
        delete parsed.protagonistAge;
        delete parsed.protagonistPersonality;
        delete parsed.protagonistGoal;
        delete parsed.protagonistConflict;
    }

    if (!parsed.loveInterests) parsed.loveInterests = [];
    if (!parsed.antagonists) parsed.antagonists = [];

    // Migrate loveInterests if it's still a string array
    if (parsed.loveInterests.length > 0 && typeof parsed.loveInterests[0] === 'string') {
      parsed.loveInterests = parsed.loveInterests.map((desc: string) => createEmptyCharacter(desc));
    }

    // Migrate antagonists if it's still a string array
    if (parsed.antagonists.length > 0 && typeof parsed.antagonists[0] === 'string') {
      parsed.antagonists = parsed.antagonists.map((desc: string) => createEmptyCharacter(desc));
    }

    // Stage 3: Ensure gender field exists on all characters
     if (parsed.protagonist && parsed.protagonist.gender === undefined) {
       parsed.protagonist.gender = '';
     }
     if (parsed.loveInterests) {
         parsed.loveInterests.forEach((c: Character) => { if (c.gender === undefined) c.gender = ''; });
     }
     if (parsed.antagonists) {
          parsed.antagonists.forEach((c: Character) => { if (c.gender === undefined) c.gender = ''; });
     }

    // Stage 4: Ensure relationships field exists
    if (parsed.relationships === undefined) {
      parsed.relationships = [];
    }
    
    // Stage 5: Rename voiceDescription to voiceAndSpeechStyle
    const renameVoiceField = (character: any) => {
        if (character && character.voiceDescription !== undefined) {
            character.voiceAndSpeechStyle = character.voiceDescription;
            delete character.voiceDescription;
        }
    };
    
    renameVoiceField(parsed.protagonist);
    if (parsed.loveInterests) parsed.loveInterests.forEach(renameVoiceField);
    if (parsed.antagonists) parsed.antagonists.forEach(renameVoiceField);

    return parsed as StoryEncyclopedia;
};


const App: React.FC = () => {
  const [storyEncyclopedia, setStoryEncyclopedia] = useState<StoryEncyclopedia | null>(() => {
    try {
      const saved = localStorage.getItem('storyEncyclopedia');
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return migrateStoryData(parsed);

    } catch (error) {
      console.error("Failed to parse or migrate storyEncyclopedia from localStorage", error);
      return null;
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');
  
  const saveTimeoutRef = useRef<number | null>(null);

  const triggerSave = useCallback((data: StoryEncyclopedia | null) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSavingStatus('saving');

    saveTimeoutRef.current = window.setTimeout(() => {
        if (data) {
            localStorage.setItem('storyEncyclopedia', JSON.stringify(data));
        } else {
            localStorage.removeItem('storyEncyclopedia');
        }
        setSavingStatus('saved');
        saveTimeoutRef.current = window.setTimeout(() => setSavingStatus('idle'), 2000);
    }, 1000);

  }, []);

  useEffect(() => {
    if (storyEncyclopedia) {
      triggerSave(storyEncyclopedia);
    }
    
    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
  }, [storyEncyclopedia, triggerSave]);

  const handleStorySubmit = (data: StoryEncyclopedia) => {
    const oldTitle = storyEncyclopedia?.title;
    if (oldTitle && oldTitle !== data.title) {
        localStorage.removeItem(`chatMessages_${oldTitle}`);
    }
    setStoryEncyclopedia(data);
    setIsEditing(false);
  };

  const handleEditRequest = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleStartNew = () => {
      const confirmMessage = storyEncyclopedia?.language === 'id'
        ? 'Anda yakin ingin memulai cerita baru? Ensiklopedia cerita dan riwayat obrolan Anda saat ini akan dihapus.'
        : 'Are you sure you want to start a new story? Your current story encyclopedia and chat history will be deleted.';

      if (window.confirm(confirmMessage)) {
          if(storyEncyclopedia?.title) {
              localStorage.removeItem(`chatMessages_${storyEncyclopedia.title}`);
          }
          localStorage.removeItem('storyEncyclopedia');
          
          setStoryEncyclopedia(null);
          setIsEditing(false);

          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          setSavingStatus('idle');
      }
  };
  
  const handleDownload = () => {
    if (!storyEncyclopedia) return;

    const jsonString = JSON.stringify(storyEncyclopedia, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = storyEncyclopedia.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `webnovel-ai-studio_${safeTitle || 'story'}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const result = event.target?.result;
                  if (typeof result !== 'string') {
                      throw new Error("File could not be read as text.");
                  }
                  const importedData = JSON.parse(result);
                  const migratedData = migrateStoryData(importedData);

                  const lang = migratedData.language || 'en';
                  const confirmMessage = lang === 'id' 
                      ? 'Mengunggah cerita baru akan menimpa cerita Anda saat ini dan riwayat obrolan. Lanjutkan?'
                      : 'Uploading a new story will overwrite your current story and chat history. Continue?';

                  if (storyEncyclopedia && !window.confirm(confirmMessage)) {
                      return;
                  }

                  if (storyEncyclopedia?.title && storyEncyclopedia.title !== migratedData.title) {
                       localStorage.removeItem(`chatMessages_${storyEncyclopedia.title}`);
                  }
                  
                  setStoryEncyclopedia(migratedData);
                  setIsEditing(false);

              } catch (err) {
                  console.error("Failed to upload file:", err);
                  const lang = storyEncyclopedia?.language || 'en';
                  const alertMessage = lang === 'id' 
                      ? 'Gagal mengunggah file. Pastikan file tersebut adalah file ekspor JSON yang valid dari Webnovel AI Studio.'
                      : 'Failed to upload file. Please ensure it is a valid JSON export file from Webnovel AI Studio.';
                  alert(alertMessage);
              }
          };
          reader.readAsText(file);
      };
      input.click();
  };


  const renderSaveStatus = () => {
      const lang = storyEncyclopedia?.language || 'en';
      switch(savingStatus) {
          case 'saving':
              return <span className="text-sm text-slate-400">{lang === 'id' ? 'Menyimpan...' : 'Saving...'}</span>;
          case 'saved':
              return <span className="text-sm text-green-400">✓ {lang === 'id' ? 'Tersimpan' : 'Saved'}</span>;
          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-200">
              Webnovel AI Studio
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {storyEncyclopedia && renderSaveStatus()}
            <button
                onClick={handleUpload}
                className="text-sm bg-slate-700 text-slate-300 hover:bg-indigo-600/50 hover:text-indigo-300 hover:border-indigo-500 border border-transparent px-3 py-1 rounded-md transition-colors flex items-center gap-2"
                title={storyEncyclopedia?.language === 'id' ? 'Unggah Cerita (.json)' : 'Upload Story (.json)'}
            >
                <UploadIcon className="w-4 h-4" />
                {storyEncyclopedia?.language === 'id' ? 'Unggah' : 'Upload'}
            </button>
            <button
                onClick={handleDownload}
                disabled={!storyEncyclopedia}
                className="text-sm bg-slate-700 text-slate-300 hover:bg-indigo-600/50 hover:text-indigo-300 hover:border-indigo-500 border border-transparent px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={storyEncyclopedia?.language === 'id' ? 'Unduh Cerita (.json)' : 'Download Story (.json)'}
            >
                <DownloadIcon className="w-4 h-4" />
                {storyEncyclopedia?.language === 'id' ? 'Unduh' : 'Download'}
            </button>
            {storyEncyclopedia && (
              <button 
                onClick={handleStartNew}
                className="text-sm bg-slate-700 text-slate-300 hover:bg-rose-600/50 hover:text-rose-300 hover:border-rose-500 border border-transparent px-3 py-1 rounded-md transition-colors"
              >
                {storyEncyclopedia.language === 'id' ? 'Mulai Cerita Baru' : 'Start New Story'}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto flex overflow-hidden">
        {storyEncyclopedia && !isEditing ? (
          <div className="flex flex-grow w-full h-[calc(100vh-73px)]">
            <StoryEncyclopediaSidebar storyEncyclopedia={storyEncyclopedia} onEdit={handleEditRequest} />
            <div className="flex-grow h-full p-4">
              <ChatWindow storyEncyclopedia={storyEncyclopedia} key={storyEncyclopedia.title} />
            </div>
          </div>
        ) : (
          <div className="w-full p-4">
            <StoryEncyclopediaSetup 
              onStoryCreate={handleStorySubmit} 
              initialData={storyEncyclopedia}
              onCancel={storyEncyclopedia ? handleCancelEdit : undefined}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;