import React from 'react';
import { StoryEncyclopedia, Character, Relationship } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';

interface StoryEncyclopediaSidebarProps {
  storyEncyclopedia: StoryEncyclopedia;
  onEdit: () => void;
}

const SidebarSection: React.FC<{ title: string; children: React.ReactNode; noPadding?: boolean }> = ({ title, children, noPadding = false }) => (
  <div>
    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">{title}</h3>
    <div className={`space-y-2 text-sm text-slate-300 ${noPadding ? '' : 'bg-slate-800/50 p-3 rounded-md'}`}>
        {children}
    </div>
  </div>
);

const InfoPair: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
    if (!value || value.trim() === '') return null;
    return (
        <div>
            <p className="font-semibold text-slate-200">{label}</p>
            <p className="text-slate-400 whitespace-pre-wrap">{value}</p>
        </div>
    );
};

const CharacterProfile: React.FC<{ character: Character; role: string; lang: 'en' | 'id' }> = ({ character, role, lang }) => {
    if (!character || !character.name) return null;
    
    const labels = lang === 'id' ? {
        name: 'Nama', age: 'Usia', gender: 'Gender', physical: 'Deskripsi Fisik', voice: 'Suara & Gaya Bicara',
        traits: 'Sifat', habits: 'Kebiasaan', goal: 'Tujuan', principles: 'Prinsip', conflict: 'Konflik'
    } : {
        name: 'Name', age: 'Age', gender: 'Gender', physical: 'Physical Description', voice: 'Voice & Speech Style',
        traits: 'Personality', habits: 'Habits', goal: 'Goal', principles: 'Principles', conflict: 'Conflict'
    };

    return (
        <div className="bg-slate-800/50 p-3 rounded-md space-y-2">
            <h4 className="font-bold text-base text-slate-100">{role}: {character.name}</h4>
            <InfoPair label={labels.age} value={character.age} />
            <InfoPair label={labels.gender} value={character.gender} />
            <InfoPair label={labels.physical} value={character.physicalDescription} />
            <InfoPair label={labels.voice} value={character.voiceAndSpeechStyle} />
            <InfoPair label={labels.traits} value={character.personalityTraits} />
            <InfoPair label={labels.habits} value={character.habits} />
            <InfoPair label={labels.goal} value={character.goal} />
            <InfoPair label={labels.principles} value={character.principles} />
            <InfoPair label={labels.conflict} value={character.conflict} />
        </div>
    );
};

const RelationshipDisplay: React.FC<{ relationship: Relationship; lang: 'en' | 'id' }> = ({ relationship, lang }) => {
    const { character1, character2, type, description } = relationship;
    if (!character1 || !character2 || !type) return null;
    return (
        <div>
            <p className="font-semibold text-slate-200">{character1} & {character2}</p>
            <p className="text-slate-400"><span className="font-medium text-indigo-400">[{type}]</span> {description}</p>
        </div>
    );
};

const StoryEncyclopediaSidebar: React.FC<StoryEncyclopediaSidebarProps> = ({ storyEncyclopedia, onEdit }) => {
  const displayGenre = [...storyEncyclopedia.genres, storyEncyclopedia.otherGenre].filter(Boolean).join(', ');
  const lang = storyEncyclopedia.language;
  
  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="w-6 h-6 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-200">Story Encyclopedia</h2>
        </div>
        <button 
          onClick={onEdit}
          className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors"
          title="Edit Story Encyclopedia"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-6">
        
        <SidebarSection title={lang === 'id' ? 'Info Dasar' : 'Basic Info'}>
            <InfoPair label="Title" value={storyEncyclopedia.title} />
            <InfoPair label="Genre" value={displayGenre} />
            <InfoPair label="Setting" value={storyEncyclopedia.setting} />
        </SidebarSection>

        <SidebarSection title={lang === 'id' ? 'Plot Inti' : 'Core Plot'}>
             <InfoPair label="Main Plot" value={storyEncyclopedia.mainPlot} />
        </SidebarSection>
        
        <SidebarSection title={lang === 'id' ? 'Karakter' : 'Characters'} noPadding>
            <CharacterProfile character={storyEncyclopedia.protagonist} role={lang === 'id' ? 'Protagonis' : 'Protagonist'} lang={lang} />
            {storyEncyclopedia.loveInterests?.map((li, index) => (
                li.name && <CharacterProfile key={`li-${index}`} character={li} role={`${lang === 'id' ? 'Pasangan' : 'Love Interest'} #${index + 1}`} lang={lang} />
            ))}
            {storyEncyclopedia.antagonists?.map((ant, index) => (
                ant.name && <CharacterProfile key={`ant-${index}`} character={ant} role={`${lang === 'id' ? 'Antagonis' : 'Antagonist'} #${index + 1}`} lang={lang} />
            ))}
        </SidebarSection>

        {storyEncyclopedia.relationships && storyEncyclopedia.relationships.length > 0 && (
            <SidebarSection title={lang === 'id' ? 'Hubungan' : 'Relationships'}>
                {storyEncyclopedia.relationships.map((rel, index) => (
                    <RelationshipDisplay key={index} relationship={rel} lang={lang} />
                ))}
            </SidebarSection>
        )}
        
        {(storyEncyclopedia.worldBuilding || storyEncyclopedia.magicSystem) && (
             <SidebarSection title={lang === 'id' ? 'Dunia & Aturan' : 'World & Rules'}>
                <InfoPair label="World Building" value={storyEncyclopedia.worldBuilding} />
                <InfoPair label="System/Magic Rules" value={storyEncyclopedia.magicSystem} />
             </SidebarSection>
        )}

        <SidebarSection title={lang === 'id' ? 'Nada (dari 10)' : 'Tone (out of 10)'}>
            <div className="flex justify-between text-center">
                <InfoPair label="Comedy" value={storyEncyclopedia.comedyLevel} />
                <InfoPair label="Romance" value={storyEncyclopedia.romanceLevel} />
                <InfoPair label="Action" value={storyEncyclopedia.actionLevel} />
                {storyEncyclopedia.maturityLevel && parseInt(storyEncyclopedia.maturityLevel, 10) > 1 && (
                    <InfoPair label="Maturity" value={storyEncyclopedia.maturityLevel} />
                )}
            </div>
        </SidebarSection>
        
        <SidebarSection title={lang === 'id' ? 'Gaya Prosa' : 'Prose Style'}>
            <InfoPair label="Style" value={storyEncyclopedia.proseStyle} />
        </SidebarSection>

      </div>
    </aside>
  );
};

export default StoryEncyclopediaSidebar;