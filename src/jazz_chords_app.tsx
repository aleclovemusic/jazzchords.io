// to start: cd "jazz-chords" && npm run dev
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Trash2, Info, X, MessageSquare } from 'lucide-react';

const JazzChordsApp = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const currentlyPlayingRef = useRef<OscillatorNode[]>([]);
  const currentGainNodesRef = useRef<GainNode[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [bassNote, setBassNote] = useState<string | null>(null);
  const [voicing, setVoicing] = useState<'closed' | 'open'>('closed');
  const [inversion, setInversion] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [soundType, setSoundType] = useState<'default' | 'piano' | 'electric' | 'organ' | 'synth'>('default');
  const [activeNotes, setActiveNotes] = useState<Array<{ note: string; octave: number }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [lastPlayed, setLastPlayed] = useState<{
    root: string;
    chordType: { name: string; intervals: number[] };
    bass?: string | null;
  } | null>(null);
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [fixedTonic, setFixedTonic] = useState<string | null>(null);
  const [showRoman, setShowRoman] = useState<boolean>(true);

  type ProgressChord = {
    id: string;
    root: string;
    chordType: { name: string; intervals: number[] };
    inversion: number;
    octave: number;
    bass?: string | null;
    voicing?: 'closed' | 'open';
    measure: number;
    beat: number;
    durationBeats: number;
  };

  const [measures, setMeasures] = useState<number>(4);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);
  const [bpm, setBpm] = useState<number>(120);
  const [progression, setProgression] = useState<ProgressChord[]>([]);
  // Removed draggingId and progressionPlaying as they are unused
  const gridRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; startSlot: number; duration: number } | null>(null);
  const progressionRef = useRef<ProgressChord[]>(progression);

  useEffect(() => {
    progressionRef.current = progression;
  }, [progression]);

  const roots = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  
  const chordTypes = [
    { name: '7', intervals: [0, 4, 7, 10] },
    { name: 'maj7', intervals: [0, 4, 7, 11] },
    { name: 'min7', intervals: [0, 3, 7, 10] },
    { name: 'm7♭5', intervals: [0, 3, 6, 10] },
    { name: 'dim7', intervals: [0, 3, 6, 9] },
    { name: 'maj9', intervals: [0, 4, 7, 11, 14] },
    { name: '9', intervals: [0, 4, 7, 10, 14] },
    { name: 'min9', intervals: [0, 3, 7, 10, 14] },
    { name: 'maj11', intervals: [0, 4, 7, 11, 14, 17] },
    { name: '11', intervals: [0, 4, 7, 10, 14, 17] },
    { name: 'min11', intervals: [0, 3, 7, 10, 14, 17] },
    { name: 'maj13', intervals: [0, 4, 7, 11, 14, 21] },
    { name: '13', intervals: [0, 4, 7, 10, 14, 21] },
    { name: 'min13', intervals: [0, 3, 7, 10, 14, 21] },
    { name: '7♯11', intervals: [0, 4, 7, 10, 18] },
    { name: '7♭9', intervals: [0, 4, 7, 10, 13] },
    { name: '7♯9', intervals: [0, 4, 7, 10, 15] },
    { name: 'alt', intervals: [0, 4, 6, 10, 13] },
    { name: 'sus2', intervals: [0, 2, 7] },
    { name: 'sus4', intervals: [0, 5, 7] },
    { name: '7sus4', intervals: [0, 5, 7, 10] },
    { name: '6', intervals: [0, 4, 7, 9] },
    { name: 'min6', intervals: [0, 3, 7, 9] },
    { name: 'add9', intervals: [0, 4, 7, 14] },
    { name: 'minadd9', intervals: [0, 3, 7, 14] },
    { name: 'dim', intervals: [0, 3, 6] },
    { name: 'aug', intervals: [0, 4, 8] },
    { name: '5', intervals: [0, 7] },
  ];

  // Preset standards
  type PresetStandard = {
    name: string;
    bpm: number;
    beatsPerMeasure: number;
    progression: Array<{ 
      root: string; 
      chordType: string; 
      bass?: string; 
      duration: number;
      voicing?: 'closed' | 'open';
      octave?: number;
      inversion?: number;
    }>;
  };

  const presets: PresetStandard[] = [
    {
      name: 'C Jam Blues',
      bpm: 120,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Yardbird Suite',
      bpm: 140,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: '6', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2, bass: 'D' },
        { root: 'C', chordType: 'maj7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'A', chordType: '7', duration: 4 }, 
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4, bass: 'B' },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2  },
        { root: 'D', chordType: 'min7', duration: 2, bass: 'F' },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'C', chordType: '6', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2, bass: 'D' },
        { root: 'C', chordType: 'maj7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'A', chordType: '7', duration: 4 }, 
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4, bass: 'B' },
        { root: 'C', chordType: '6', duration: 4 },
        { root: 'C', chordType: '6', duration: 2 },
        { root: 'B', chordType: '7♭9', duration: 2 },
        
        { root: 'E', chordType: 'min7', duration: 4 },
        { root: 'F♯', chordType: 'min7♭5', duration: 2 },
        { root: 'B', chordType: '7♭9', duration: 2 },
        { root: 'E', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2 },
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'C', chordType: '6', duration: 4},
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2, bass: 'D' },
        { root: 'C', chordType: 'maj7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'A', chordType: '7', duration: 4 }, 
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'C', chordType: '6', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
      ],
    },
    {
      name: 'All The Things You Are',
      bpm: 160,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'G', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'G', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'maj7', duration: 4 },
        { root: 'F♯', chordType: 'min7♭5', duration: 4 },
        { root: 'B', chordType: '7♭9', duration: 4 },
        { root: 'E', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 2 },
        { root: 'A', chordType: 'min7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
      ],
    },
    {
      name: 'Autumn Leaves',
      bpm: 120,
      beatsPerMeasure: 4,
      progression: [
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'E', chordType: 'min7♭5', duration: 4 },
        { root: 'A', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'E', chordType: 'min7♭5', duration: 4 },
        { root: 'A', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7♭5', duration: 4 },
        { root: 'D', chordType: '7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'E', chordType: 'min7♭5', duration: 4 },
        { root: 'A', chordType: '7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'So What',
      bpm: 160,
      beatsPerMeasure: 4,
      progression: [
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'Take Five',
      bpm: 180,
      beatsPerMeasure: 5,
      progression: [
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'C', chordType: 'maj7', duration: 5 },
        { root: 'C', chordType: 'maj7', duration: 5 },
        { root: 'C', chordType: 'maj7', duration: 5 },
        { root: 'C', chordType: 'maj7', duration: 5 },
        { root: 'F♯', chordType: 'min7♭5', duration: 5 },
        { root: 'B', chordType: '7♭9', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
        { root: 'E', chordType: 'min7', duration: 5 },
      ],
    },
    {
      name: 'Girl from Ipanema',
      bpm: 160,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Misty',
      bpm: 100,
      beatsPerMeasure: 4,
      progression: [
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 2 },
        { root: 'E♭', chordType: '7', duration: 2 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'min7', duration: 2 },
        { root: 'D♭', chordType: '7', duration: 2 },
        { root: 'G', chordType: 'min7', duration: 2 },
        { root: 'C', chordType: '7', duration: 2 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 2 },
        { root: 'E♭', chordType: '7', duration: 2 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'min7', duration: 2 },
        { root: 'D♭', chordType: '7', duration: 2 },
        { root: 'G', chordType: 'min7', duration: 2 },
        { root: 'C', chordType: '7', duration: 2 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 2 },
        { root: 'B♭', chordType: 'maj7', duration: 2 },
        { root: 'A', chordType: 'min7♭5', duration: 2 },
        { root: 'D', chordType: '7', duration: 2 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 2 },
        { root: 'F', chordType: '7', duration: 2 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 2 },
        { root: 'E♭', chordType: '7', duration: 2 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'min7', duration: 2 },
        { root: 'D♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 2 },
        { root: 'F', chordType: '7', duration: 2 },
        { root: 'F', chordType: 'min7', duration: 2 },
        { root: 'B♭', chordType: '7', duration: 2 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'Round Midnight',
      bpm: 120,
      beatsPerMeasure: 4,
      progression: [
        { root: 'B', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'min7', duration: 4 },
        { root: 'D♭', chordType: '7', duration: 4 },
        { root: 'G♭', chordType: 'maj7', duration: 4 },
        { root: 'C♭', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'In a Sentimental Mood',
      bpm: 80,
      beatsPerMeasure: 4,
      progression: [
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'Days of Wine and Roses',
      bpm: 140,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Fly Me to the Moon',
      bpm: 120,
      beatsPerMeasure: 4,
      progression: [
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'min7♭5', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'min7♭5', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'min7♭5', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'min7♭5', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'My Funny Valentine',
      bpm: 80,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7♭5', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'min7♭5', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'A♭', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 2 },
        { root: 'D', chordType: 'min7♭5', duration: 2 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'Body and Soul',
      bpm: 70,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C♯', chordType: 'min7', duration: 4, voicing: 'open', octave: -1 },
        { root: 'F♯', chordType: 'maj7', duration: 4, bass: 'A♯', voicing: 'closed' },
        { root: 'B', chordType: 'maj7', duration: 4, voicing: 'open', inversion: 1 },
        { root: 'B', chordType: 'min7', duration: 4, bass: 'D', voicing: 'closed' },
        { root: 'E', chordType: '7', duration: 4, voicing: 'open', inversion: 2 },
        { root: 'A', chordType: 'maj7', duration: 4, voicing: 'closed' },
        { root: 'D♯', chordType: 'min7', duration: 4, bass: 'F♯', voicing: 'open' },
        { root: 'G♯', chordType: '7', duration: 4, voicing: 'closed', inversion: 1, octave: 1 },
      ],
    },
    {
      name: 'Summertime',
      bpm: 90,
      beatsPerMeasure: 4,
      progression: [
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'F♯', chordType: 'min7♭5', duration: 4 },
        { root: 'B', chordType: '7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'F♯', chordType: 'min7♭5', duration: 4 },
        { root: 'B', chordType: '7', duration: 4 },
        { root: 'E', chordType: '7', duration: 2 },
        { root: 'A', chordType: 'min7', duration: 2 },
        { root: 'E', chordType: '7', duration: 2 },
        { root: 'A', chordType: 'min7', duration: 2 },
      ],
    },
    {
      name: 'Bye Bye Blackbird',
      bpm: 160,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'min7', duration: 4 },
        { root: 'E', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Satin Doll',
      bpm: 200,
      beatsPerMeasure: 4,
      progression: [
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2 },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2 },
        { root: 'E', chordType: 'min7', duration: 2 },
        { root: 'A', chordType: '7', duration: 2 },
        { root: 'A', chordType: 'min7', duration: 2 },
        { root: 'D', chordType: '7', duration: 2 },
        { root: 'G', chordType: 'maj7', duration: 2 },
        { root: 'C', chordType: 'maj7', duration: 2 },
        { root: 'G', chordType: 'min7', duration: 2 },
        { root: 'C', chordType: '7', duration: 2 },
        { root: 'A', chordType: 'min7', duration: 2 },
        { root: 'D', chordType: '7', duration: 2 },
        { root: 'D', chordType: 'min7', duration: 2 },
        { root: 'G', chordType: '7', duration: 2 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'Tune Up',
      bpm: 180,
      beatsPerMeasure: 4,
      progression: [
        { root: 'D♯', chordType: 'maj7', duration: 2 },
        { root: 'D♯', chordType: 'maj7', duration: 2 },
        { root: 'E♯', chordType: 'maj7', duration: 2 },
        { root: 'E♯', chordType: 'maj7', duration: 2 },
        { root: 'F♯', chordType: 'maj7', duration: 2 },
        { root: 'F♯', chordType: 'maj7', duration: 2 },
        { root: 'F', chordType: 'maj7', duration: 2 },
        { root: 'F', chordType: 'maj7', duration: 2 },
      ],
    },
    {
      name: 'Giant Steps',
      bpm: 260,
      beatsPerMeasure: 4,
      progression: [
        { root: 'B', chordType: 'maj7', duration: 2, voicing: 'closed' },
        { root: 'D', chordType: '7', duration: 2, voicing: 'open' },
        { root: 'G', chordType: 'maj7', duration: 2, bass: 'B', voicing: 'closed' },
        { root: 'B♭', chordType: '7', duration: 2, voicing: 'open' },
        { root: 'E♭', chordType: 'maj7', duration: 4, voicing: 'closed' },
        { root: 'F♯', chordType: '7', duration: 4, bass: 'A♯', voicing: 'open' },
        { root: 'B', chordType: 'maj7', duration: 4, voicing: 'closed' },
        { root: 'B', chordType: 'maj7', duration: 4, inversion: 2 },
      ],
    },
    {
      name: 'Blue Bossa',
      bpm: 180,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'All Blues',
      bpm: 120,
      beatsPerMeasure: 4,
      progression: [
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'Cantaloupe Island',
      bpm: 140,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 4 },
        { root: 'B♭', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
      ],
    },
    {
      name: 'Maiden Voyage',
      bpm: 130,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'E♭', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'Oleo',
      bpm: 260,
      beatsPerMeasure: 4,
      progression: [
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'C♯', chordType: 'min7', duration: 4 },
        { root: 'F♯', chordType: '7', duration: 4 },
        { root: 'B', chordType: 'maj7', duration: 4 },
        { root: 'B', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'Ornithology',
      bpm: 280,
      beatsPerMeasure: 4,
      progression: [
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'B♭', chordType: 'maj7', duration: 4 },
        { root: 'G', chordType: 'min7', duration: 4 },
        { root: 'C', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Confirmation',
      bpm: 280,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'F', chordType: 'maj7', duration: 4 },
        { root: 'D', chordType: 'min7', duration: 4 },
        { root: 'G', chordType: '7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'A', chordType: 'min7', duration: 4 },
        { root: 'D', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Billie\'s Bounce',
      bpm: 200,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'C', chordType: '7', duration: 4 },
        { root: 'B♭', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
        { root: 'F', chordType: '7', duration: 4 },
      ],
    },
    {
      name: 'Chelsea Bridge',
      bpm: 100,
      beatsPerMeasure: 4,
      progression: [
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'D♭', chordType: 'maj7', duration: 4 },
        { root: 'D♭', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
        { root: 'C', chordType: 'maj7', duration: 4 },
      ],
    },
    {
      name: 'Watermelon Man',
      bpm: 140,
      beatsPerMeasure: 4,
      progression: [
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
        { root: 'F', chordType: 'min7', duration: 4 },
      ],
    },
  ];

  const applyPreset = (preset: PresetStandard) => {
    // Set BPM and beats per measure
    setBpm(preset.bpm);
    setBeatsPerMeasure(preset.beatsPerMeasure);
    
    // Calculate total beats needed and convert to measures
    const totalBeatsNeeded = preset.progression.reduce((sum, chord) => sum + chord.duration, 0);
    const measuresNeeded = Math.ceil(totalBeatsNeeded / preset.beatsPerMeasure);
    setMeasures(Math.max(4, Math.round(measuresNeeded / 4) * 4));

    // Create progression array
    const newProgression: ProgressChord[] = [];
    let totalBeatsUsed = 0;
    preset.progression.forEach((chord, index) => {
      const chordTypeObj = chordTypes.find(ct => ct.name === chord.chordType) || chordTypes[0];
      const newId = String(Date.now()) + Math.random().toString(36).slice(2, 6) + index;
      
      // Calculate measure and beat based on cumulative chord duration
      const measureNumber = Math.floor(totalBeatsUsed / preset.beatsPerMeasure) + 1;
      const beatInMeasure = (totalBeatsUsed % preset.beatsPerMeasure) + 1;
      
      const progressChord: ProgressChord = {
        id: newId,
        root: chord.root,
        chordType: chordTypeObj,
        inversion: chord.inversion ?? 0,
        octave: chord.octave ?? octaveShift,
        bass: chord.bass || bassNote,
        voicing: chord.voicing ?? voicing,
        measure: measureNumber,
        beat: beatInMeasure,
        durationBeats: chord.duration,
      };
      newProgression.push(progressChord);
      totalBeatsUsed += chord.duration;
    });

    setProgression(newProgression);
  };

  useEffect(() => {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioCtx();
    setAudioContext(ctx);
    return () => {
      // don't return the Promise from close() Ã¢â‚¬â€ keep cleanup synchronous
      if (ctx && typeof ctx.close === 'function') {
        void ctx.close();
      }
    };
  }, []);

  // Enharmonic display toggle: when true, display sharps as their enharmonic flats
  const [useFlats, setUseFlats] = useState<boolean>(false);
  // Circle of fifths visibility toggle
  const [showCircleOfFifths, setShowCircleOfFifths] = useState<boolean>(true);
  const enharmonicMap: Record<string, string> = {
    'C♯': 'D♭',
    'D♯': 'E♭',
    'F♯': 'G♭',
    'G♯': 'A♭',
    'A♯': 'B♭',
  };
  const displayNote = (note: string) => {
    if (!useFlats) return note;
    return enharmonicMap[note] ?? note;
  };

  // Normalize note names to match the roots array (convert flats to sharps)
  const normalizeNote = (note: string): string => {
    const flatToSharpMap: Record<string, string> = {
      'D♭': 'C♯',
      'E♭': 'D♯', 
      'G♭': 'F♯',
      'A♭': 'G♯',
      'B♭': 'A♯'
    };
    return flatToSharpMap[note] ?? note;
  };

  const noteToFreq = (note: string): number => {
    const noteIndex = roots.indexOf(note);
    return 440 * Math.pow(2, (noteIndex - 9) / 12);
  };

  const getChordNotes = (
    root: string,
    chordType: { name: string; intervals: number[] },
    inversionOverride?: number,
    octaveShiftOverride?: number,
    bassOverride?: string | null,
    voicingOverride?: 'closed' | 'open',
  ): Array<{ note: string; octave: number }> => {
    const normalizedRoot = normalizeNote(root);
    const rootIndex = roots.indexOf(normalizedRoot);
    const shift = typeof octaveShiftOverride === 'number' ? octaveShiftOverride : octaveShift;
    let notes: Array<{ note: string; octave: number }> = chordType.intervals.map((interval: number) => {
      const noteIndex = (rootIndex + interval) % 12;
      const octaveOffset = Math.floor((rootIndex + interval) / 12);
      return { note: roots[noteIndex], octave: 4 + octaveOffset + shift };
    });

    // Apply inversion (use override if provided)
    const inv = typeof inversionOverride === 'number' ? inversionOverride : inversion;
    // const bassForCalc = typeof bassOverride !== 'undefined' ? bassOverride : bassNote; // unused
    // Apply inversion to the chord tones regardless of whether a separate bass note is present.
    if (inv > 0 && notes.length > 0) {
      for (let i = 0; i < inv % notes.length; i++) {
        const shifted = notes.shift();
        if (shifted) {
          notes.push({ ...shifted, octave: shifted.octave + 1 });
        }
      }
    }

    // Apply voicing (use override if provided)
    const effectiveVoicing = typeof voicingOverride !== 'undefined' ? voicingOverride : voicing;
    if (effectiveVoicing === 'open') {
      // If any adjacent interval is exactly 3 or 4 semitones, raise even-indexed notes (0,2,4,...) by one octave.
      const semitoneValue = (n: { note: string; octave: number }) => {
        const noteIdx = roots.indexOf(n.note);
        return noteIdx + n.octave * 12;
      };

      let voiced = notes.map(n => ({ ...n }));
      let needRaise = false;

      for (let i = 0; i < voiced.length - 1; i++) {
        const a = semitoneValue(voiced[i]);
        const b = semitoneValue(voiced[i + 1]);
        let dist = (b - a) % 12;
        if (dist <= 0) dist += 12;
        // strict check: exactly 3 or exactly 4 semitones are not acceptable
        if (dist === 3 || dist === 4) {
          needRaise = true;
          break;
        }
      }

      if (needRaise) {
        // raise odd-indexed notes instead of even-indexed (try the opposite)
        for (let i = 1; i < voiced.length; i += 2) {
          voiced[i].octave += 1;
        }
      }

      notes = voiced;
    }

    // Apply bass note if selected (use override if provided)
    const bassFinal = typeof bassOverride !== 'undefined' ? bassOverride : bassNote;
    if (bassFinal) {
      const normalizedBass = normalizeNote(bassFinal);
      notes = notes.filter(n => n.note !== normalizedBass);
      notes.unshift({ note: normalizedBass, octave: 3 });
    }

    return notes;
  };

  const playChord = (
    root: string,
    chordType: { name: string; intervals: number[] },
    inversionOverride?: number,
    octaveOverride?: number,
    bassOverride?: string | null,
    voicingOverride?: 'closed' | 'open',
  ): void => {
    const notes = getChordNotes(root, chordType, inversionOverride, octaveOverride, bassOverride, voicingOverride);
    // remember last played chord (store bass at time of play)
    setLastPlayed({ root, chordType, bass: typeof bassOverride !== 'undefined' ? bassOverride : bassNote });
    // Visual feedback regardless of audio availability (persist until next chord)
    setActiveNotes(notes);

    if (muted || !audioContext) return;

    stopCurrentChord();

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    notes.forEach((noteObj: { note: string; octave: number }) => {
      const freq = noteToFreq(noteObj.note) * Math.pow(2, noteObj.octave - 4);
      const vol = volume; // Master volume
      const attackTime = 0.01; // 10ms attack
      
      if (soundType === 'default') {
        // Simple sine wave - clean and clear
        const osc = audioContext!.createOscillator();
        const gain = audioContext!.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        const targetGain = (0.15 / notes.length) * vol;
        gain.gain.setValueAtTime(0.001, audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, audioContext!.currentTime + attackTime);
        osc.connect(gain);
        gain.connect(audioContext!.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 2);
      } else if (soundType === 'piano') {
        // Piano-like: fundamental + soft harmonics
        const harmonics = [1, 2, 3, 4];
        const gains = [1, 0.4, 0.2, 0.1];
        harmonics.forEach((h, i) => {
          const osc = audioContext!.createOscillator();
          const gain = audioContext!.createGain();
          osc.frequency.value = freq * h;
          osc.type = 'sine';
          const targetGain = (0.12 / notes.length) * gains[i] * vol;
          gain.gain.setValueAtTime(0.001, audioContext!.currentTime);
          gain.gain.exponentialRampToValueAtTime(targetGain, audioContext!.currentTime + attackTime);
          osc.connect(gain);
          gain.connect(audioContext!.destination);
          osc.start();
          oscillators.push(osc);
          gainNodes.push(gain);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 2);
        });
      } else if (soundType === 'electric') {
        // Electric piano: triangle with slight detuning
        [-2, 0, 2].forEach(detune => {
          const osc = audioContext!.createOscillator();
          const gain = audioContext!.createGain();
          osc.frequency.value = freq;
          osc.detune.value = detune;
          osc.type = 'triangle';
          const targetGain = (0.1 / notes.length) * vol;
          gain.gain.setValueAtTime(0.001, audioContext!.currentTime);
          gain.gain.exponentialRampToValueAtTime(targetGain, audioContext!.currentTime + attackTime);
          osc.connect(gain);
          gain.connect(audioContext!.destination);
          osc.start();
          oscillators.push(osc);
          gainNodes.push(gain);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 1.5);
        });
      } else if (soundType === 'organ') {
        // Organ: square wave with drawbar-like harmonics
        const harmonics = [1, 2, 3, 4, 6, 8];
        const gains = [1, 0.8, 0.6, 0.5, 0.3, 0.2];
        harmonics.forEach((h, i) => {
          const osc = audioContext!.createOscillator();
          const gain = audioContext!.createGain();
          osc.frequency.value = freq * h;
          osc.type = i === 0 ? 'square' : 'sine';
          const targetGain = (0.06 / notes.length) * gains[i] * vol;
          gain.gain.setValueAtTime(0.001, audioContext!.currentTime);
          gain.gain.exponentialRampToValueAtTime(targetGain, audioContext!.currentTime + attackTime);
          osc.connect(gain);
          gain.connect(audioContext!.destination);
          osc.start();
          oscillators.push(osc);
          gainNodes.push(gain);
          // Organ sustains longer
          gain.gain.setValueAtTime(targetGain, audioContext!.currentTime + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 2);
        });
      } else if (soundType === 'synth') {
        // Synth pad: filtered sawtooth
        const osc = audioContext!.createOscillator();
        const filter = audioContext!.createBiquadFilter();
        const gain = audioContext!.createGain();
        osc.frequency.value = freq;
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 2;
        const synthGain = (0.08 / notes.length) * vol;
        gain.gain.setValueAtTime(0.001, audioContext!.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext!.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        // 10ms attack for synth as well
        gain.gain.exponentialRampToValueAtTime(synthGain, audioContext!.currentTime + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 2.5);
      }
    });

    currentlyPlayingRef.current = oscillators;
    currentGainNodesRef.current = gainNodes;

    // Auto-cleanup after natural decay (only if these are still the active oscillators)
    const theseOscillators = oscillators;
    setTimeout(() => {
      // Only clean up if these are still the current oscillators
      if (currentlyPlayingRef.current === theseOscillators) {
        theseOscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        currentlyPlayingRef.current = [];
        currentGainNodesRef.current = [];
      }
    }, 2500);
  };

  const playNote = (note: string, octave: number) => {
    const freq = noteToFreq(note) * Math.pow(2, octave - 4);
    setActiveNotes([{ note, octave }]);
    if (muted || !audioContext) return;
    stopCurrentChord();
    try {
      const oscillators: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];
      const attackTime = 0.01; // 10ms attack
      
      if (soundType === 'default') {
        const vol = volume;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const targetGain = 0.25 * vol;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, audioContext.currentTime + attackTime);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
      } else if (soundType === 'piano') {
        const vol = volume;
        const harmonics = [1, 2, 3];
        const gains = [1, 0.3, 0.15];
        harmonics.forEach((h, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq * h;
          const targetGain = 0.2 * gains[i] * vol;
          gain.gain.setValueAtTime(0.001, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(targetGain, audioContext.currentTime + attackTime);
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start();
          oscillators.push(osc);
          gainNodes.push(gain);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
        });
      } else if (soundType === 'electric') {
        const vol = volume;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const targetGain = 0.25 * vol;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, audioContext.currentTime + attackTime);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
      } else if (soundType === 'organ') {
        const vol = volume;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        const targetGain = 0.12 * vol;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, audioContext.currentTime + attackTime);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        gain.gain.setValueAtTime(targetGain, audioContext.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
      } else if (soundType === 'synth') {
        const vol = volume;
        const osc = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        const targetGain = 0.15 * vol;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, audioContext.currentTime + attackTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        oscillators.push(osc);
        gainNodes.push(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
      }
      
      currentlyPlayingRef.current = oscillators;
      currentGainNodesRef.current = gainNodes;
      
      // Auto-cleanup after natural decay (only if these are still the active oscillators)
      const theseOscillators = oscillators;
      setTimeout(() => {
        if (currentlyPlayingRef.current === theseOscillators) {
          theseOscillators.forEach(o => { try { o.stop(); } catch (e) {} });
          currentlyPlayingRef.current = [];
          currentGainNodesRef.current = [];
        }
      }, 1500);
    } catch (e) {
      // ignore
    }
  };

  const bumpOctave = (delta: number) => {
    const newShift = Math.max(-4, Math.min(4, octaveShift + delta));
    setOctaveShift(newShift);
    if (lastPlayed) {
      const chordLen = Math.max(1, lastPlayed.chordType.intervals.length);
      // replay with current inversion and new octave shift
      playChord(lastPlayed.root, lastPlayed.chordType, inversion % chordLen, newShift);
    }
  };

  // Progression helpers
  const timeoutsRef = useRef<number[]>([]);
  const resizingRef = useRef<{
    id: string;
    startX: number;
    startBeat: number;
    startDuration: number;
    side: 'left' | 'right';
  } | null>(null);
  const [tileFocusedId, setTileFocusedId] = useState<string | null>(null);
  type PreviewPlacement = { measure: number; beat: number; duration: number; splitTargetId?: string; splitExistingNewDur?: number; splitMovingDur?: number };
  const [previewPlacement, setPreviewPlacement] = useState<PreviewPlacement | null>(null);
  const previewRef = useRef<PreviewPlacement | null>(null);

  const removeFromProgression = (id: string) => {
    setProgression(prev => prev.filter(p => p.id !== id));
  };

  const updateChordBass = (id: string, newBass: string | null) => {
    setProgression(prev => prev.map(chord => 
      chord.id === id ? { ...chord, bass: newBass } : chord
    ));
  };

  // clicking outside any chord tile should clear tile focus (collapse play/delete)
  useEffect(() => {
    const onDocClick = (evt: MouseEvent) => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;
      // if clicked anywhere inside a chord tile, keep selection
      if (target.closest && target.closest('[data-chord-id]')) return;
      setTileFocusedId(null);
    };
    window.addEventListener('click', onDocClick);
    return () => window.removeEventListener('click', onDocClick);
  }, []);

  const slotIndexFor = (measure: number, beat: number) => (measure - 1) * beatsPerMeasure + (beat - 1);

  const slotRangeForItem = (item: ProgressChord) => {
    const start = slotIndexFor(item.measure, item.beat);
    const end = start + Math.max(1, item.durationBeats) - 1;
    return { start, end };
  };

  const findNextAvailableSlot = (movingId: string, desiredSlot: number, duration: number) => {
    const totalSlots = measures * beatsPerMeasure;
    const items = progression.filter(p => p.id !== movingId).map(slotRangeForItem);
    for (let s = desiredSlot; s <= totalSlots - duration; s++) {
      const e = s + duration - 1;
      let conflict = false;
      for (const it of items) {
        if (!(e < it.start || s > it.end)) { conflict = true; break; }
      }
      if (!conflict) {
        const measure = Math.floor(s / beatsPerMeasure) + 1;
        const beat = (s % beatsPerMeasure) + 1;
        return { measure, beat };
      }
    }
    return null;
  };

  // const moveProgressionItem = (id: string, dir: number) => { /* ...unused... */ };

  // const changeDuration = (id: string, delta: number) => { /* ...unused... */ };

  const handleResizeStart = (e: React.PointerEvent, ch: ProgressChord, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = (e as unknown as PointerEvent).clientX;

    // store the side to handle left/right resize logic
    resizingRef.current = {
      id: ch.id,
      startX: clientX,
      startBeat: ch.beat,
      startDuration: ch.durationBeats,
      side,
    };

    // set global cursor
    // const prevCursor = document.body.style.cursor; // unused
    document.body.style.cursor = 'ew-resize';

    const onPointerMove = (evt: PointerEvent) => {
      if (!resizingRef.current || !resizingRef.current.id) return;
      const id = resizingRef.current.id;
      const item = progression.find(p => p.id === id);
      if (!item) return;
      const measureEl = document.querySelector(`[data-measure="${item.measure}"]`) as HTMLElement | null;
      if (!measureEl) return;

      const cellWidth = measureEl.clientWidth / beatsPerMeasure;
      const dx = evt.clientX - resizingRef.current.startX;
      const deltaBeats = Math.round(dx / cellWidth);

      setProgression(prev => prev.map(it => {
        if (it.id !== id) return it;
        const totalSlots = measures * beatsPerMeasure;
        const startIdx = slotIndexFor(it.measure, it.beat);
        // const endIdx = startIdx + Math.max(1, it.durationBeats) - 1; // unused

        if (resizingRef.current!.side === 'right') {
          const maxDurByEnd = totalSlots - startIdx;
          const desired = resizingRef.current!.startDuration + deltaBeats;
          const newDur = Math.max(1, Math.min(desired, maxDurByEnd));
          return { ...it, durationBeats: newDur };
        } else {
          // left side: move the left edge (beat position), keep right edge (end) mostly the same
          // dragging right (positive dx) should move the chord later (higher beat number)
          const currentStartBeat = resizingRef.current!.startBeat;
          const newStartBeat = Math.max(1, currentStartBeat + deltaBeats);
          
          // Keep the original end position, adjust duration accordingly
          const originalEndBeat = currentStartBeat + resizingRef.current!.startDuration - 1;
          const newDuration = originalEndBeat - newStartBeat + 1;
          
          // Check we don't go negative and stay within bounds
          if (newDuration < 1) {
            return it; // Can't shrink further
          }
          
          return { ...it, beat: newStartBeat, durationBeats: newDuration };
        }
      }).map((item, _idx, arr) => {
        // After resizing, handle overlaps by shortening overlapping chords
        if (item.id === id) {
          // This is the resized chord
          const newStart = slotIndexFor(item.measure, item.beat);
          const newEnd = newStart + item.durationBeats - 1;
          
          // Find and shorten any chords that overlap with this resized chord
          arr.forEach(other => {
            if (other.id !== id) {
              const oStart = slotIndexFor(other.measure, other.beat);
              const oEnd = oStart + other.durationBeats - 1;
              
              // Check if there's an overlap
              if (!(newEnd < oStart || newStart > oEnd)) {
                // There's an overlap
                if (newStart > oStart && newStart <= oEnd) {
                  // Resized chord starts inside the other chord, shorten it
                  const newOtherDur = newStart - oStart;
                  if (newOtherDur > 0) {
                    other.durationBeats = newOtherDur;
                  } else {
                    // Mark for deletion by setting duration to 0 (we'll filter these)
                    other.durationBeats = 0;
                  }
                } else if (newStart <= oStart && newEnd >= oEnd) {
                  // Resized chord completely covers the other, mark for deletion
                  other.durationBeats = 0;
                }
              }
            }
          });
        }
        return item;
      }).filter(item => item.durationBeats > 0));
    };

    const onPointerUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const clearScheduled = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const clearProgression = () => {
    if (!window.confirm('Clear the entire progression? This cannot be undone.')) return;
    clearScheduled();
    stopCurrentChord();
    setProgression([]);
    setPreviewPlacement(null);
    previewRef.current = null;
    setTileFocusedId(null);
    // setProgressionPlaying(false); // removed unused
  };

  const playProgression = () => {
    clearScheduled();
    const msPerBeat = 60000 / bpm;
    const sequence = [...progression].sort((a, b) => (a.measure - b.measure) || (a.beat - b.beat));
    if (sequence.length === 0) return;
    // setProgressionPlaying(true); // removed unused
    sequence.forEach(item => {
      const slotIndex = (item.measure - 1) * beatsPerMeasure + (item.beat - 1);
      const delay = Math.round(slotIndex * msPerBeat);
      const t = window.setTimeout(() => {
        playChord(item.root, item.chordType, item.inversion, item.octave, item.bass ?? null, item.voicing);
      }, delay);
      timeoutsRef.current.push(t);
    });
    // schedule stop flag after last chord + its duration
    const last = sequence[sequence.length - 1];
    const lastSlotIndex = (last.measure - 1) * beatsPerMeasure + (last.beat - 1);
    const totalMs = Math.round((lastSlotIndex + last.durationBeats) * msPerBeat) + 100;
    const endT = window.setTimeout(() => {
      // setProgressionPlaying(false); // removed unused
      clearScheduled();
    }, totalMs);
    timeoutsRef.current.push(endT);
  };

  const stopProgression = () => {
    clearScheduled();
    stopCurrentChord();
  };

  // Determine chord quality (major/minor) from chord type name
  const getChordQuality = (chordTypeName: string): 'major' | 'minor' | 'dominant' | 'other' => {
    const name = chordTypeName.toLowerCase();
    
    // Minor chord types
    if (name.includes('min') || name.includes('m7') || name.includes('m9') || name.includes('m6') || 
        name.includes('m11') || name.includes('m13') || name === 'm') {
      return 'minor';
    }
    
    // Dominant/7th chords (considered major quality for circle of fifths)
    if (name === '7' || name === '9' || name === '11' || name === '13' || name.includes('7sus') || 
        name === 'alt' || name.includes('7♯5') || name.includes('7♭5') || name.includes('7♯9') || 
        name.includes('7♭9') || name.includes('7♯11') || name.includes('7♭13')) {
      return 'major'; // Dominant chords light up major tiles
    }
    
    // Major chord types
    if (name.includes('maj') || name === '6' || name.includes('add9') || name.includes('sus2') || 
        name.includes('sus4') || name === '' || name.includes('♯11') || name.includes('6/9')) {
      return 'major';
    }
    
    // Diminished and augmented chords
    if (name.includes('dim') || name.includes('aug') || name.includes('°') || name.includes('+')) {
      return 'other';
    }
    
    return 'major'; // Default to major for unknown types
  };

  // MIDI export helpers
  // const noteToMidi = (note: string, octave: number) => { /* ...unused... */ };

  const writeVarLen = (value: number, out: number[]) => {
    let buffer = value & 0x7f;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= ((value & 0x7f) | 0x80);
    }
    while (true) {
      out.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  };

  const exportProgressionAsMIDI = () => {
    // simple single-track MIDI with chords as simultaneous note-ons
    const ticksPerQuarter = 480;
    // const msPerQuarter = 60000 / bpm; // unused
    // const ticksPerMs = ticksPerQuarter / msPerQuarter; // unused

    const events: number[] = [];
    // tempo meta
    const mpqn = Math.round(60000000 / bpm);
    // header: will build later

    // Build track events
    const seq = [...progression].sort((a, b) => (a.measure - b.measure) || (a.beat - b.beat));
    let lastTick = 0;
    seq.forEach(item => {
      const slotIndex = (item.measure - 1) * beatsPerMeasure + (item.beat - 1);
      const tick = Math.round(slotIndex * (ticksPerQuarter * (4 / beatsPerMeasure)) );
      const delta = tick - lastTick;
      writeVarLen(delta, events);
      // build notes via getChordNotes so bass and voicing are included
      const notes = getChordNotes(item.root, item.chordType, item.inversion, item.octave, item.bass ?? null, item.voicing);
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (i > 0) writeVarLen(0, events); // zero delta for simultaneous note-ons
        const noteIndex = roots.indexOf(n.note);
        const midiNote = 12 + noteIndex + n.octave * 12;
        events.push(0x90, midiNote & 0xff, 0x64);
      }
      lastTick = tick;
      // note-offs after duration
      const offDelta = Math.round(item.durationBeats * ticksPerQuarter);
      writeVarLen(offDelta, events);
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (i > 0) writeVarLen(0, events); // zero delta between simultaneous note-offs
        const noteIndex = roots.indexOf(n.note);
        const midiNote = 12 + noteIndex + n.octave * 12;
        events.push(0x80, midiNote & 0xff, 0x40);
      }
      lastTick += offDelta;
    });

    // end of track
    writeVarLen(0, events);
    events.push(0xff, 0x2f, 0x00);

    // Build header and track chunks
    const header = [] as number[];
    // MThd
    header.push(...[0x4d,0x54,0x68,0x64]);
    header.push(...[0x00,0x00,0x00,0x06]);
    header.push(...[0x00,0x00]); // format 0
    header.push(...[0x00,0x01]); // one track
    header.push((ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff);

    const trackData = [] as number[];
    // tempo meta at start
    trackData.push(0x00, 0xff, 0x51, 0x03);
    trackData.push((mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);
    trackData.push(...events);

    const trackHeader = [0x4d,0x54,0x72,0x6b];
    const trackLen = trackData.length;
    const trackLenBytes = [(trackLen >> 24) & 0xff, (trackLen >> 16) & 0xff, (trackLen >> 8) & 0xff, trackLen & 0xff];

    const bytes = new Uint8Array([...header, ...trackHeader, ...trackLenBytes, ...trackData]);
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progression.mid';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stopCurrentChord = (): void => {
    // Immediately stop all current oscillators with a very fast fade
    const oscs = currentlyPlayingRef.current;
    const gains = currentGainNodesRef.current;
    
    if (audioContext && gains.length > 0) {
      const now = audioContext.currentTime;
      gains.forEach(gain => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03); // 30ms fade
        } catch (e) {}
      });
    }
    
    // Stop oscillators after brief fade
    oscs.forEach(osc => {
      try {
        if (typeof osc.stop === 'function') osc.stop(audioContext ? audioContext.currentTime + 0.04 : 0);
      } catch (e) {}
    });
    
    currentlyPlayingRef.current = [];
    currentGainNodesRef.current = [];
  };

  const cycleInversion = () => {
    if (lastPlayed) {
      const chordLen = Math.max(1, lastPlayed.chordType.intervals.length);
      const next = (inversion + 1) % chordLen;
      setInversion(next);
      // replay the last chord with the new inversion
      playChord(lastPlayed.root, lastPlayed.chordType, next);
    } else {
      setInversion(prev => prev + 1);
    }
  };

  const getChordDisplay = (root: string, chordType: { name: string }): string => {
    let display = displayNote(root) + chordType.name;
    if (bassNote) {
      display += '/' + displayNote(bassNote);
    }
    return display;
  };

  const isNoteActive = (note: string, octave: number): boolean => {
    return activeNotes.some(n => n.note === note && n.octave === octave);
  };

  // Keyboard component
  const PianoKeyboard = () => {
    const octaves = [1, 2, 3, 4, 5, 6, 7];
    
    const renderOctave = (octave: number) => {
      const keys = [
        { note: 'C', isBlack: false },
        { note: 'C♯', isBlack: true },
        { note: 'D', isBlack: false },
        { note: 'D♯', isBlack: true },
        { note: 'E', isBlack: false },
        { note: 'F', isBlack: false },
        { note: 'F♯', isBlack: true },
        { note: 'G', isBlack: false },
        { note: 'G♯', isBlack: true },
        { note: 'A', isBlack: false },
        { note: 'A♯', isBlack: true },
        { note: 'B', isBlack: false },
      ];

      return (
        <div className="relative inline-block">
          <div className="text-xs text-center mb-1 opacity-50">Oct {octave}</div>
          {/* White keys */}
          <div className="flex">
            {keys.filter(k => !k.isBlack).map((key) => (
              <div
                key={`${key.note}-${octave}-white`}
                onClick={() => playNote(key.note, octave)}
                role="button"
                tabIndex={0}
                className={`cursor-pointer w-10 h-32 border-2 border-gray-700 rounded-b-lg transition-all duration-150 ${
                  isNoteActive(key.note, octave)
                    ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50'
                    : 'bg-gradient-to-b from-white to-gray-100'
                }`}
                style={{ boxShadow: isNoteActive(key.note, octave) ? '0 0 20px rgba(234, 179, 8, 0.6)' : 'none' }}
              >
                <div className="text-xs text-center mt-24 text-gray-600">{displayNote(key.note)}</div>
              </div>
            ))}
          </div>
          {/* Black keys */}
          <div className="absolute top-6 left-0 flex pointer-events-none">
            {keys.map((key, idx) => {
              if (!key.isBlack) return null;
              const position = idx === 1 ? 28 : idx === 3 ? 68 : idx === 6 ? 148 : idx === 8 ? 188 : 228;
              return (
                <div
                  key={`${key.note}-${octave}-black`}
                  onClick={() => playNote(key.note, octave)}
                  role="button"
                  tabIndex={0}
                  className={`absolute cursor-pointer w-6 h-20 rounded-b-lg transition-all duration-150 pointer-events-auto ${
                    isNoteActive(key.note, octave)
                      ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50'
                      : 'bg-gradient-to-b from-gray-800 to-black'
                  }`}
                  style={{ 
                    left: `${position}px`,
                    boxShadow: isNoteActive(key.note, octave) ? '0 0 20px rgba(234, 179, 8, 0.8)' : 'none',
                    zIndex: 10
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    };

    const renderOctaveMobile = (octave: number) => {
      const keys = [
        { note: 'C', isBlack: false },
        { note: 'C♯', isBlack: true },
        { note: 'D', isBlack: false },
        { note: 'D♯', isBlack: true },
        { note: 'E', isBlack: false },
        { note: 'F', isBlack: false },
        { note: 'F♯', isBlack: true },
        { note: 'G', isBlack: false },
        { note: 'G♯', isBlack: true },
        { note: 'A', isBlack: false },
        { note: 'A♯', isBlack: true },
        { note: 'B', isBlack: false },
      ].reverse();

      return (
        <div className="relative inline-block mb-6">
          <div className="text-xs mb-1 opacity-50 absolute -left-10 top-1/2 -translate-y-1/2">Oct {octave}</div>
          {/* White keys */}
          <div className="flex flex-col ml-8">
                {keys.filter(k => !k.isBlack).map((key) => (
              <div
                key={`${key.note}-${octave}-white`}
                className={`h-10 w-20 border-2 border-gray-700 transition-all duration-150 ${
                  isNoteActive(key.note, octave)
                    ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50'
                    : 'bg-gradient-to-r from-white to-gray-100'
                }`}
              >
                    <div className="text-xs ml-1 text-gray-600">{displayNote(key.note)}</div>
              </div>
            ))}
          </div>
          {/* Black keys */}
          <div className="absolute top-0 right-0 flex flex-col pointer-events-none ml-8">
            {keys.map((key, idx) => {
              if (!key.isBlack) return null;
              const positions = [10, 50, 130, 170, 210];
              const posIdx = [10, 8, 6, 3, 1].indexOf(12 - idx - 1);
              if (posIdx === -1) return null;
              return (
                <div
                  key={`${key.note}-${octave}-black`}
                  onClick={() => playNote(key.note, octave)}
                  role="button"
                  tabIndex={0}
                  className={`absolute h-6 w-12 transition-all duration-150 cursor-pointer pointer-events-auto ${
                    isNoteActive(key.note, octave)
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50'
                      : 'bg-gradient-to-r from-gray-800 to-black'
                  }`}
                  style={{ 
                    top: `${positions[posIdx]}px`,
                    right: 0,
                    zIndex: 10
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <>
        {/* Desktop - Sticky horizontal keyboard */}
        <div className="hidden lg:block sticky top-0 z-30 bg-black bg-opacity-50 backdrop-blur-sm py-4 border-b-2 border-white border-opacity-20">
          <div className="flex justify-center items-end gap-0 overflow-x-auto pb-2 px-4">
            {octaves.map(octave => renderOctave(octave))}
          </div>
        </div>

        {/* Mobile - Sidebar */}
        <div className="lg:hidden">
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-purple-600 text-white px-2 py-6 rounded-l-lg shadow-lg"
          >
            {sidebarOpen ? 'Ã¢â€ â€™' : 'Ã°Å¸Å½Â¹'}
          </button>

          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`fixed top-0 right-0 h-full w-40 bg-gradient-to-l from-gray-900 to-gray-800 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="p-4">
              <div className="flex flex-col items-center space-y-0">
                {octaves.slice().reverse().map(octave => renderOctaveMobile(octave))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // const romanDegrees: { degree: string; offset: number }[] = [
  //   { degree: 'I', offset: 0 },
  //   { degree: 'ii', offset: 2 },
  //   { degree: 'iii', offset: 4 },
  //   { degree: 'IV', offset: 5 },
  //   { degree: 'V', offset: 7 },
  //   { degree: 'vi', offset: 9 },
  //   { degree: 'viiÃ‚Â°', offset: 11 },
  // ];

  // const getRomanMapping = (tonic: string) => { /* ...unused... */ };

  const degreeForRoot = (root: string, tonic: string) => {
    const tIdx = roots.indexOf(tonic);
    if (tIdx === -1) return '';
    const idx = roots.indexOf(root);
    const diff = (idx - tIdx + 12) % 12;
    
    // Map all 12 semitone intervals to scale degrees
    // With sharps by default, flats when useFlats is true
    const degreesWithSharps: Record<number, string> = {
      0: '1',      // Tonic
      1: '♯1',     // Sharp 1
      2: '2',      // Second
      3: '♯2',     // Sharp 2
      4: '3',      // Third
      5: '4',      // Fourth
      6: '♯4',     // Sharp 4
      7: '5',      // Fifth
      8: '♯5',     // Sharp 5
      9: '6',      // Sixth
      10: '♯6',    // Sharp 6
      11: '7',     // Seventh
    };
    
    const degreesWithFlats: Record<number, string> = {
      0: '1',      // Tonic
      1: '♭2',     // Flat 2
      2: '2',      // Second
      3: '♭3',     // Flat 3
      4: '3',      // Third
      5: '4',      // Fourth
      6: '♭5',     // Flat 5
      7: '5',      // Fifth
      8: '♭6',     // Flat 6
      9: '6',      // Sixth
      10: '♭7',    // Flat 7
      11: '7',     // Seventh
    };
    
    const degreeMap = useFlats ? degreesWithFlats : degreesWithSharps;
    return degreeMap[diff] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-2xl border-b border-slate-700">
              <h2 className="text-2xl font-bold text-amber-400">How to Use Jazz Chords</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 pt-4 space-y-3 text-slate-300 overflow-y-auto">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Selecting Chords</h3>
                  <p>Click on a root note (C, D, E, etc.) from the piano-style keyboard to select it. Sharp notes are on the top row. Then choose a chord type from the sidebar on the right.</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Adding to Progression</h3>
                  <p>Click the small <span className="text-amber-400">+</span> button on any root note to add that chord to your progression grid. Chords will fill the grid from left to right.</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Progression Grid</h3>
                  <p>Drag chords in the grid to rearrange them. Resize by dragging the edges. Each cell represents one beat. Click a chord to edit it, or use the trash icon to delete.</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Playback Controls</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Closed/Open:</strong> Choose closed or open voicing</li>
                    <li><strong>Cycle Inversion:</strong> Change chord inversions</li>
                    <li><strong>Octave +/-:</strong> Shift the chord up or down</li>
                    <li><strong>Sound:</strong> Select different instrument sounds</li>
                    <li><strong>Volume/Mute:</strong> Control audio output</li>
                  </ul>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Additional Options</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Enharmonic:</strong> Toggle between ♯ and ♭ note names</li>
                    <li><strong>Scale Degrees:</strong> Show note relationships</li>
                    <li><strong>Fixed Tonic:</strong> Set a key center for analysis</li>
                    <li><strong>Bass Note:</strong> Add a slash chord bass note</li>
                    <li><strong>Circle of Fifths:</strong> Visual reference for chord relationships</li>
                  </ul>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Export</h3>
                  <p>Use <strong>Export MIDI</strong> to download your progression as a MIDI file for use in your DAW. Set BPM and time signature before exporting.</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Keyboard */}
      <PianoKeyboard />
      
      {/* Header */}
      <div className="p-4 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">jazzchords.io</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 transition-all"
            title="How to use"
          >
            <Info size={20} className="text-amber-400" />
          </button>
        </div>
        
        {/* Controls */}
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Root selector - Piano keyboard layout */}
          <div className="flex flex-col items-center gap-4">
            {/* Piano keyboard grid - 14 columns */}
            <div style={{ width: '100%', maxWidth: '560px', display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '4px', padding: '0 8px' }}>
              {/* TOP ROW - Black keys (sharps) */}
              
              {/* Empty space before C# */}
              <div style={{ gridColumn: '1 / 2' }}></div>
              
              {/* C# */}
              <div key="C#" style={{ gridColumn: '2 / 4', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('C♯')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-xs ${selectedRoot === 'C♯' ? 'bg-gradient-to-b from-slate-600 to-slate-800 scale-110 text-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300'} border border-slate-600`}
                >
                  {displayNote('C♯')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('C♯', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add C# to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'C♯',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 11,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'C♯' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'C♯' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* D# */}
              <div key="D#" style={{ gridColumn: '4 / 6', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('D♯')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-xs ${selectedRoot === 'D♯' ? 'bg-gradient-to-b from-slate-600 to-slate-800 scale-110 text-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300'} border border-slate-600`}
                >
                  {displayNote('D♯')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('D♯', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add D# to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'D♯',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 11,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'D♯' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'D♯' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* Empty space between D# and F# (gap) */}
              <div style={{ gridColumn: '6 / 8' }}></div>

              {/* F# */}
              <div key="F#" style={{ gridColumn: '8 / 10', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('F♯')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-xs ${selectedRoot === 'F♯' ? 'bg-gradient-to-b from-slate-600 to-slate-800 scale-110 text-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300'} border border-slate-600`}
                >
                  {displayNote('F♯')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('F♯', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add F# to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'F♯',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 11,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'F♯' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'F♯' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* G# */}
              <div key="G#" style={{ gridColumn: '10 / 12', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('G♯')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-xs ${selectedRoot === 'G♯' ? 'bg-gradient-to-b from-slate-600 to-slate-800 scale-110 text-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300'} border border-slate-600`}
                >
                  {displayNote('G♯')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('G♯', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add G# to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'G♯',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 11,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'G♯' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'G♯' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* A# */}
              <div key="A#" style={{ gridColumn: '12 / 14', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('A♯')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-xs ${selectedRoot === 'A♯' ? 'bg-gradient-to-b from-slate-600 to-slate-800 scale-110 text-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-300'} border border-slate-600`}
                >
                  {displayNote('A♯')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('A♯', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add A# to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'A♯',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 11,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'A♯' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'A♯' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* Empty space after A# */}
              <div style={{ gridColumn: '14 / 15' }}></div>

              {/* BOTTOM ROW - White keys (naturals) */}
              
              {/* C */}
              <div key="C" style={{ gridColumn: '1 / 3', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('C')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'C' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('C')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('C', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add C to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'C',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'C' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'C' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* D */}
              <div key="D" style={{ gridColumn: '3 / 5', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('D')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'D' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('D')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('D', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add D to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'D',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'D' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'D' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* E */}
              <div key="E" style={{ gridColumn: '5 / 7', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('E')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'E' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('E')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('E', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add E to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'E',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'E' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'E' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* F */}
              <div key="F" style={{ gridColumn: '7 / 9', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('F')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'F' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('F')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('F', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add F to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'F',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'F' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'F' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* G */}
              <div key="G" style={{ gridColumn: '9 / 11', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('G')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'G' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('G')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('G', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add G to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'G',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'G' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'G' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* A */}
              <div key="A" style={{ gridColumn: '11 / 13', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('A')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'A' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('A')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('A', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add A to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'A',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'A' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'A' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>

              {/* B */}
              <div key="B" style={{ gridColumn: '13 / 15', aspectRatio: '1' }} className="relative">
                <button
                  onClick={() => setSelectedRoot('B')}
                  className={`w-full h-full rounded-lg font-semibold transition-all flex items-center justify-center text-sm ${selectedRoot === 'B' ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 scale-110' : 'bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'}`}
                >
                  {displayNote('B')}
                </button>
                {showRoman && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-75 bg-black bg-opacity-40 px-1 rounded pointer-events-none">
                    {degreeForRoot('B', fixedTonic ?? selectedRoot)}
                  </div>
                )}
                <button
                  title="Add B to progression"
                  onClick={() => {
                    const chordType = chordTypes[0];
                    const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                    const duration = beatsPerMeasure;
                    const desiredSlot = 0;
                    const found = findNextAvailableSlot(newId, desiredSlot, duration);
                    if (!found) return;
                    const newItem: ProgressChord = {
                      id: newId,
                      root: 'B',
                      chordType: chordType,
                      inversion: 0,
                      octave: octaveShift,
                      bass: bassNote,
                      voicing: voicing,
                      measure: found.measure,
                      beat: found.beat,
                      durationBeats: duration,
                    };
                    setProgression(prev => [...prev, newItem]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-6px',
                    zIndex: 2,
                    boxShadow: '0 2px 6px 0 rgba(251,191,36,0.4)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedRoot === 'B' ? '#ffffff' : 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                    color: selectedRoot === 'B' ? '#1e293b' : '#1e293b',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
                </button>
              </div>
            </div>



            {/* Controls below root notes */}
            <div className="flex flex-wrap gap-6 justify-center items-center">
              

              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">Enharmonic</div>
                <button
                  onClick={() => setUseFlats(!useFlats)}
                  aria-pressed={useFlats}
                  className="relative w-20 h-10 rounded-full p-1 transition-all bg-slate-700 border border-slate-600"
                >
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-white pointer-events-none">
                    <span className="text-lg font-medium">♭</span>
                    <span className="text-lg font-medium">♯</span>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: 32, height: 32, left: useFlats ? '2px' : 'calc(100% - 34px)', transition: 'left 200ms cubic-bezier(.2,.9,.2,1)', border: '2px solid white', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)' }}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">Scale Degrees</div>
                <button
                  onClick={() => setShowRoman(!showRoman)}
                  aria-pressed={showRoman}
                  className="relative w-20 h-10 rounded-full p-1 transition-all bg-slate-700 border border-slate-600"
                >
                  <div className="absolute inset-0 flex items-center justify-between px-3.5 text-xs text-white opacity-90 pointer-events-none">
                    <span>✕</span>
                    <span>✓</span>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: 32, height: 32, left: showRoman ? 'calc(100% - 34px)' : '2px', transition: 'left 200ms cubic-bezier(.2,.9,.2,1)', border: '2px solid white', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)' }}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Fixed Tonic</label>
                <select
                  value={fixedTonic ?? ''}
                  onChange={(e) => setFixedTonic(e.target.value || null)}
                  className="bg-gradient-to-b from-slate-700 to-slate-800 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                >
                  <option value="">None</option>
                  {roots.map(r => (
                    <option key={r} value={r}>{displayNote(r)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bass note selector */}
          <div className="space-y-3">
            <div className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-slate-600"></span>
              Bass Note (Optional)
              <span className="w-8 h-px bg-slate-600"></span>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex bg-slate-800/50 rounded-xl p-2 backdrop-blur-sm border border-slate-700/50">
                <button
                  onClick={() => setBassNote(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !bassNote 
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  None
                </button>
                <div className="w-px bg-slate-700 mx-2"></div>
                <div className="flex gap-1">
                  {roots.map((root) => {
                    const isSharp = root.includes('#');
                    const isSelected = bassNote === root;
                    return (
                      <button
                        key={root}
                        onClick={() => setBassNote(root)}
                        className={`relative px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[2.25rem] ${
                          isSelected
                            ? isSharp
                              ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-400 ring-2 ring-amber-400/50'
                              : 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900'
                            : isSharp
                              ? 'bg-slate-900/80 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        {displayNote(root)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Voicing and other controls */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setVoicing('closed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  voicing === 'closed' 
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900' 
                    : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 hover:from-slate-600 hover:to-slate-700 border border-slate-600'
                }`}
              >
                Closed
              </button>
              <button
                onClick={() => setVoicing('open')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  voicing === 'open' 
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900' 
                    : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 hover:from-slate-600 hover:to-slate-700 border border-slate-600'
                }`}
              >
                Open
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={cycleInversion}
                className="px-4 py-2 rounded-lg bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white text-sm font-medium transition-all duration-200"
              >
                Cycle Inversion: {inversion % (lastPlayed ? Math.max(1, lastPlayed.chordType.intervals.length) : 4)}
              </button>
              <button
                onClick={() => bumpOctave(-1)}
                className="px-3 py-2 rounded-lg bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white text-sm font-medium border border-slate-500 transition-all duration-200"
                title="Octave down"
              >
                Oct -
              </button>
              <div className="px-3 py-2 text-sm font-medium text-slate-300">{octaveShift >= 0 ? `+${octaveShift}` : octaveShift}</div>
              <button
                onClick={() => bumpOctave(1)}
                className="px-3 py-2 rounded-lg bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white text-sm font-medium border border-slate-500 transition-all duration-200"
                title="Octave up"
              >
                Oct +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sound</label>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as 'default' | 'piano' | 'electric' | 'organ' | 'synth')}
                className="bg-gradient-to-b from-slate-700 to-slate-800 text-white px-3 py-2 rounded-lg text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <option value="default">Default</option>
                <option value="piano">Piano</option>
                <option value="electric">Electric Piano</option>
                <option value="organ">Organ</option>
                <option value="synth">Synth Pad</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 accent-amber-400"
              />
              <span className="text-xs text-slate-400 w-8">{Math.round(volume * 100)}%</span>
            </div>

            <button
              onClick={() => {
                if (!muted) {
                  // When muting, stop all currently playing sounds
                  stopCurrentChord();
                }
                setMuted(!muted);
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                muted 
                  ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900'
                  : 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white'
              }`}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      </div>

      {/* Chord buttons grid + Progression controls */}
      <div className="p-4 max-w-7xl mx-auto">
        {/* Chord buttons grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3 mb-8">
          {chordTypes.map(chordType => (
            <div key={chordType.name} className="relative">
              <button
                onClick={() => playChord(selectedRoot, chordType)}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 
                           p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200
                           active:scale-95 font-bold text-base border-2 border-white border-opacity-30 w-full h-full"
              >
                {getChordDisplay(selectedRoot, chordType)}
              </button>
              <button
                title="Add chord to progression"
                onClick={() => {
                  const newId = String(Date.now()) + Math.random().toString(36).slice(2,6);
                  const duration = beatsPerMeasure;
                  const desiredSlot = 0;
                  const found = findNextAvailableSlot(newId, desiredSlot, duration);
                  if (!found) return;
                  const newItem: ProgressChord = {
                    id: newId,
                    root: selectedRoot,
                    chordType,
                    inversion: inversion % Math.max(1, chordType.intervals.length),
                    octave: octaveShift,
                    bass: bassNote,
                    voicing: voicing,
                    measure: found.measure,
                    beat: found.beat,
                    durationBeats: duration,
                  };
                  setProgression(prev => [...prev, newItem]);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  zIndex: 2,
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.20)',
                  color: '#222',
                  borderRadius: '9999px',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{position: 'relative', top: '-1px', left: '0.5px', fontWeight: 700}}>+</span>
              </button>
            </div>
          ))}
        </div>

        {/* Preset Browser */}
        <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold text-sm text-slate-300">Load Preset:</label>
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  const preset = presets.find(p => p.name === e.target.value);
                  if (preset) {
                    applyPreset(preset);
                    e.target.value = '';
                  }
                }
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 text-white text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              defaultValue=""
            >
              <option value="">Select a standard...</option>
              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-400">Presets will set BPM, time signature, and fill the progression grid</span>
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="text-sm text-slate-400">Show Circle of Fifths</div>
              <button
                onClick={() => setShowCircleOfFifths(!showCircleOfFifths)}
                aria-pressed={showCircleOfFifths}
                className="relative w-20 h-10 rounded-full p-1 transition-all duration-200 bg-slate-700 border border-slate-600"
              >
                <div className="absolute inset-0 flex items-center justify-between px-3.5 text-xs text-white opacity-90 pointer-events-none">
                  <span>✕</span>
                  <span>✓</span>
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full"
                  style={{ width: 32, height: 32, left: showCircleOfFifths ? 'calc(100% - 34px)' : '2px', transition: 'left 200ms cubic-bezier(.2,.9,.2,1)', border: '2px solid white', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)' }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Circle of Fifths Visualizer */}
        {showCircleOfFifths && <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-base tracking-wide">Circle of Fifths</h3>
            
            {/* Traditional Circle of Fifths Layout with Circular Arc Slices */}
            <div className="relative w-96 h-96 flex items-center justify-center">
              
              {/* SVG container for all circular elements */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" style={{ overflow: 'visible' }}>
                {/* Outer decorative ring */}
                <circle cx="160" cy="160" r="154" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

                {/* Animated sparkle clock line - rendered FIRST so it's behind everything */}
                {(() => {
                  const majorOrder = ['C','G','D','A','E','B','F♯','C♯','A♭','E♭','B♭','F'];
                  const minorOrder = ['A','E','B','F♯','C♯','G♯','D♯','A♯','F','C','G','D'];
                  let angleDeg: number | null = null;
                  let glowColor = '';
                  let accentColor = '';
                  if (lastPlayed) {
                    const quality = getChordQuality(lastPlayed.chordType.name);
                    if (quality === 'major') {
                      const idx = majorOrder.findIndex(n => normalizeNote(n) === normalizeNote(lastPlayed.root));
                      if (idx >= 0) angleDeg = (idx * 30) - 90;
                      glowColor = 'rgba(56, 189, 248, 0.6)';
                      accentColor = '#38bdf8';
                    } else if (quality === 'minor') {
                      const idx = minorOrder.findIndex(n => normalizeNote(n) === normalizeNote(lastPlayed.root));
                      if (idx >= 0) angleDeg = (idx * 30) - 90;
                      glowColor = 'rgba(251, 191, 36, 0.6)';
                      accentColor = '#fbbf24';
                    }
                  }
                  if (angleDeg === null) return null;
                  const rad = (angleDeg * Math.PI) / 180;
                  const cx = 160, cy = 160;
                  const innerR = 44, outerR = 165;
                  const x1 = cx + innerR * Math.cos(rad);
                  const y1 = cy + innerR * Math.sin(rad);
                  const x2 = cx + outerR * Math.cos(rad);
                  const y2 = cy + outerR * Math.sin(rad);
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      {/* Glow layer */}
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={glowColor} strokeWidth="8" strokeLinecap="round" style={{ filter: 'blur(4px)' }} />
                      {/* Core line */}
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
                      {/* Sparkle dot at tip */}
                      <circle cx={x2} cy={y2} r="5" fill={accentColor} style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }} />
                    </g>
                  );
                })()}

                {/* Outer arc slices - Major keys */}
                {['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'A♭', 'E♭', 'B♭', 'F'].map((note, index) => {
                  const startAngle = (index * 30 - 15 - 90) * Math.PI / 180;
                  const endAngle = (index * 30 + 15 - 90) * Math.PI / 180;
                  const innerR = 88;
                  const outerR = 150;
                  const cx = 160, cy = 160;
                  
                  const x1 = cx + outerR * Math.cos(startAngle);
                  const y1 = cy + outerR * Math.sin(startAngle);
                  const x2 = cx + outerR * Math.cos(endAngle);
                  const y2 = cy + outerR * Math.sin(endAngle);
                  const x3 = cx + innerR * Math.cos(endAngle);
                  const y3 = cy + innerR * Math.sin(endAngle);
                  const x4 = cx + innerR * Math.cos(startAngle);
                  const y4 = cy + innerR * Math.sin(startAngle);
                  
                  const isActive = lastPlayed && 
                    normalizeNote(lastPlayed.root) === normalizeNote(note) && 
                    getChordQuality(lastPlayed.chordType.name) === 'major';
                  
                  const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
                  
                  return (
                    <path
                      key={`major-slice-${note}`}
                      d={path}
                      fill={isActive ? '#0ea5e9' : '#334155'}
                      className="cursor-pointer transition-all duration-150"
                      style={{ opacity: isActive ? 1 : 0.95 }}
                      onClick={() => {
                        const maj7Type = chordTypes.find(ct => ct.name === 'maj7');
                        if (maj7Type) playChord(note, maj7Type);
                      }}
                    >
                      <title>{displayNote(note)} Major</title>
                    </path>
                  );
                })}

                {/* Inner arc slices - Minor keys */}
                {['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'F', 'C', 'G', 'D'].map((note, index) => {
                  const startAngle = (index * 30 - 15 - 90) * Math.PI / 180;
                  const endAngle = (index * 30 + 15 - 90) * Math.PI / 180;
                  const innerR = 42;
                  const outerR = 85;
                  const cx = 160, cy = 160;
                  
                  const x1 = cx + outerR * Math.cos(startAngle);
                  const y1 = cy + outerR * Math.sin(startAngle);
                  const x2 = cx + outerR * Math.cos(endAngle);
                  const y2 = cy + outerR * Math.sin(endAngle);
                  const x3 = cx + innerR * Math.cos(endAngle);
                  const y3 = cy + innerR * Math.sin(endAngle);
                  const x4 = cx + innerR * Math.cos(startAngle);
                  const y4 = cy + innerR * Math.sin(startAngle);
                  
                  const isActive = lastPlayed && 
                    normalizeNote(lastPlayed.root) === normalizeNote(note) && 
                    getChordQuality(lastPlayed.chordType.name) === 'minor';
                  
                  const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
                  
                  return (
                    <path
                      key={`minor-slice-${note}`}
                      d={path}
                      fill={isActive ? '#f59e0b' : '#475569'}
                      className="cursor-pointer transition-all duration-150"
                      style={{ opacity: isActive ? 1 : 0.95 }}
                      onClick={() => {
                        const min7Type = chordTypes.find(ct => ct.name === 'min7');
                        if (min7Type) playChord(note, min7Type);
                      }}
                    >
                      <title>{displayNote(note)} Minor</title>
                    </path>
                  );
                })}

                {/* Ring separator between outer and inner */}
                <circle cx="160" cy="160" r="86.5" fill="none" stroke="rgba(20,20,20,0.95)" strokeWidth="3" />
                <circle cx="160" cy="160" r="86.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Center hub */}
                <circle cx="160" cy="160" r="40" fill="#1e293b" stroke="#334155" strokeWidth="2" />

                {/* Major chord labels */}
                {['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'A♭', 'E♭', 'B♭', 'F'].map((note, index) => {
                  const angle = (index * 30 - 90) * Math.PI / 180;
                  const radius = 119;
                  const x = 160 + radius * Math.cos(angle);
                  const y = 160 + radius * Math.sin(angle);
                  
                  const isActive = lastPlayed && 
                    normalizeNote(lastPlayed.root) === normalizeNote(note) && 
                    getChordQuality(lastPlayed.chordType.name) === 'major';
                  
                  return (
                    <text
                      key={`major-label-${note}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-bold pointer-events-none"
                      style={{ 
                        fontSize: '14px',
                        fill: '#ffffff',
                        filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none'
                      }}
                    >
                      {displayNote(note)}
                    </text>
                  );
                })}

                {/* Minor chord labels */}
                {['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'F', 'C', 'G', 'D'].map((note, index) => {
                  const angle = (index * 30 - 90) * Math.PI / 180;
                  const radius = 64;
                  const x = 160 + radius * Math.cos(angle);
                  const y = 160 + radius * Math.sin(angle);
                  
                  const isActive = lastPlayed && 
                    normalizeNote(lastPlayed.root) === normalizeNote(note) && 
                    getChordQuality(lastPlayed.chordType.name) === 'minor';
                  
                  return (
                    <text
                      key={`minor-label-${note}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-bold pointer-events-none"
                      style={{ 
                        fontSize: '11px',
                        fill: '#ffffff',
                        filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none'
                      }}
                    >
                      {displayNote(note)}m
                    </text>
                  );
                })}

                {/* Center text */}
                <text x="160" y="160" textAnchor="middle" dominantBaseline="central" className="fill-slate-300 font-semibold" style={{ fontSize: '13px' }}>
                  ♭ ↔ ♯
                </text>
              </svg>
            </div>
            
            <div className="text-xs opacity-50 text-center">
              Clockwise adds sharps (♯), counterclockwise adds flats (♭)
            </div>
          </div>
        </div>}

        {/* Progression controls below chords grid */}
        <div className="mb-4 flex items-center gap-4 w-full">
          <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
            <label className="text-sm text-slate-400">Measures</label>
            <input
              type="number"
              value={measures}
              min={4}
              max={32}
              step={4}
              onChange={e => {
                let v = Number(e.target.value) || 4;
                // clamp and snap to multiple of 4
                v = Math.max(4, Math.min(32, Math.round(v / 4) * 4));
                setMeasures(v);
              }}
              className="w-20 px-3 py-2 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 text-white text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <label className="text-sm text-slate-400">Beats/measure</label>
            <input type="number" value={beatsPerMeasure} min={1} onChange={e => setBeatsPerMeasure(Math.max(1, Number(e.target.value)))} className="w-20 px-3 py-2 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 text-white text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            <label className="text-sm text-slate-400">BPM</label>
            <input type="number" value={bpm} min={30} max={300} onChange={e => setBpm(Math.max(30, Number(e.target.value)))} className="w-20 px-3 py-2 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 text-white text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            <button onClick={() => playProgression()} className="px-4 py-2 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-medium transition-all duration-200">Play Progression</button>
            <button onClick={() => stopProgression()} className="px-4 py-2 rounded-lg bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-medium transition-all duration-200">Stop</button>
            <button onClick={() => exportProgressionAsMIDI()} className="px-4 py-2 rounded-lg bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-sm font-medium transition-all duration-200">Export MIDI</button>
          </div>
          <div className="flex-0 ml-auto">
            <button onClick={() => clearProgression()} title="Clear all progression items" className="px-4 py-2 rounded-lg bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white flex items-center gap-2 text-sm font-medium transition-all duration-200">
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>

        {/* Progression grid below controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <div className="flex-1 min-w-0">
            <div className="mb-2 font-semibold text-base">Progression Grid</div>
            <div ref={gridRef} className="w-full overflow-x-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(4, minmax(200px, 1fr))`, gap: '0.5rem' }}>
              {Array.from({ length: measures }).map((_, mIdx) => {
                  const isLastMeasure = mIdx === measures - 1;
                  const chordsInMeasure = progression.filter(p => p.measure === mIdx + 1);
                  const measureHasFocus = progression.some(p => p.measure === mIdx + 1 && p.id === tileFocusedId);
                  const measureMinH = measureHasFocus ? '120px' : '60px';
                  return (
                    <div key={mIdx} data-measure={mIdx + 1} className={`relative p-2 ${isLastMeasure ? '' : 'border-r border-white border-opacity-20'}`}>
                      <div className="text-xs mb-2 opacity-60">{mIdx + 1}</div>
                      <div className="relative" style={{ minHeight: measureMinH }}>
                        {/* beat cells - visual columns but positioned absolutely so tiles can be leftÃ¢â€ â€™right */}
                        {Array.from({ length: beatsPerMeasure }).map((__, bIdx) => {
                          const leftPct = (bIdx / beatsPerMeasure) * 100;
                          const widthPct = 100 / beatsPerMeasure;
                          return (
                            <div
                              key={`cell-${mIdx}-${bIdx}`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const id = e.dataTransfer.getData('text/plain');
                                if (!id) return;
                                const desiredSlot = slotIndexFor(mIdx + 1, bIdx + 1);
                                const moving = progression.find(p => p.id === id);
                                if (!moving) return;
                                
                                // Attempt to place at desired slot, handling overlaps
                                const totalSlots = measures * beatsPerMeasure;
                                const others = progression.filter(p => p.id !== id).map(slotRangeForItem);
                                
                                // Check if we can fit without overlaps
                                let canFit = true;
                                for (let s = desiredSlot; s < desiredSlot + moving.durationBeats && s < totalSlots; s++) {
                                  for (const o of others) {
                                    if (s >= o.start && s <= o.end) {
                                      canFit = false;
                                      break;
                                    }
                                  }
                                  if (!canFit) break;
                                }
                                
                                // If overlaps exist, shorten overlapping chords
                                setProgression(prev => {
                                  const updated = [...prev];
                                  const moveIdx = updated.findIndex(p => p.id === id);
                                  if (moveIdx === -1) return prev;
                                  
                                  const moving = updated[moveIdx];
                                  const newStart = desiredSlot;
                                  const newEnd = desiredSlot + moving.durationBeats - 1;
                                  
                                  // Remove from current position
                                  updated.splice(moveIdx, 1);
                                  
                                  // Find overlaps and shorten them
                                  for (let i = updated.length - 1; i >= 0; i--) {
                                    const p = updated[i];
                                    const oStart = slotIndexFor(p.measure, p.beat);
                                    const oEnd = oStart + p.durationBeats - 1;
                                    
                                    if (!(newEnd < oStart || newStart > oEnd)) {
                                      // There's an overlap
                                      if (newStart > oStart) {
                                        const newDur = newStart - oStart;
                                        if (newDur > 0) {
                                          updated[i] = { ...p, durationBeats: newDur };
                                        } else {
                                          updated.splice(i, 1);
                                        }
                                      } else {
                                        updated.splice(i, 1);
                                      }
                                    }
                                  }
                                  
                                  // Add the moved chord at new position
                                  const m = Math.floor(newStart / beatsPerMeasure) + 1;
                                  const b = (newStart % beatsPerMeasure) + 1;
                                  updated.push({ ...moving, measure: m, beat: b });
                                  
                                  return updated;
                                });
                              }}
                              className="absolute top-0 bottom-0 border-b border-white border-opacity-8"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%`, zIndex: 1 }}
                            />
                          );
                        })}

                        {/* render preview placement if it falls in this measure */}
                        {previewPlacement && previewPlacement.measure === mIdx + 1 && (() => {
                          const pl = previewPlacement;
                          const plLeft = ((pl.beat - 1) / beatsPerMeasure) * 100;
                          const plWidth = (pl.duration / beatsPerMeasure) * 100;
                          return (
                            <div
                              aria-hidden
                              style={{ position: 'absolute', left: `calc(${plLeft}% + 2px)`, width: `calc(${plWidth}% - 4px)`, top: 6, zIndex: 19 }}
                              className="pointer-events-none rounded bg-white bg-opacity-15 border border-white border-opacity-30"
                            />
                          );
                        })()}

                        {/* render chord tiles positioned leftÃ¢â€ â€™right and sized by beat percentage */}
                        {chordsInMeasure.map(ch => {
                          const left = ((ch.beat - 1) / beatsPerMeasure) * 100;
                          const width = (Math.max(1, ch.durationBeats) / beatsPerMeasure) * 100;
                          return (
                            <div
                              key={ch.id}
                              data-chord-id={ch.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer!.effectAllowed = 'move';
                                e.dataTransfer!.setData('text/plain', ch.id);
                              }}
                              tabIndex={0}
                              onClick={() => setTileFocusedId(ch.id)}
                              onFocus={() => setTileFocusedId(ch.id)}
                              onBlur={(e) => {
                                // don't clear focus if the newly focused element is still inside this chord tile
                                const related = (e as any).relatedTarget || (e.nativeEvent && (e.nativeEvent as any).relatedTarget) as HTMLElement | null;
                                if (related && related.closest && related.closest('[data-chord-id]')) return;
                                setTileFocusedId(prev => prev === ch.id ? null : prev);
                              }}
                              style={{ position: 'absolute', left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)`, top: 0, zIndex: 10 }}
                              className="group p-2 bg-white bg-opacity-5 rounded flex flex-col items-center text-sm overflow-visible"
                            >
                              {/* left resize handle */}
                              <div
                                onPointerDown={(e) => handleResizeStart(e as any, ch, 'left')}
                                className={`absolute top-1/2 -translate-y-1/2 h-6 w-4 ${tileFocusedId === ch.id ? 'opacity-100' : tileFocusedId ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150 flex items-center justify-center cursor-ew-resize touch-none`}
                                style={{ left: '-4px', background: 'rgba(0,0,0,1)', borderRadius: 2}}
                                title={tileFocusedId === ch.id ? "Drag left edge" : ""}
                                aria-hidden
                              >
                                <div style={{ width: 2, height: 8, background: '#9CA3AF', transform: 'translateX(-1px)', borderRadius: 2 }} />
                                <div style={{ width: 2, height: 14, background: '#9CA3AF', transform: 'translateX(1px)', borderRadius: 2, opacity: 0.9 }} />
                              </div>

                              <div className="w-full text-center px-1">
                                <div className="text-sm font-semibold break-words line-clamp-2" title={`${displayNote(ch.root)}${ch.chordType.name}${ch.bass ? ` / ${displayNote(ch.bass as string)}` : ''}`}>{displayNote(ch.root)}{ch.chordType.name}{ch.bass ? ` / ${displayNote(ch.bass as string)}` : ''}</div>
                                {tileFocusedId === ch.id && (
                                  <>
                                    <div className="mt-1 flex gap-1 justify-center">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); playChord(ch.root, ch.chordType, ch.inversion, ch.octave, ch.bass ?? null, ch.voicing); setTileFocusedId(ch.id); }}
                                        title="Play"
                                        className="p-1 bg-green-600 text-white rounded-full hover:scale-105 transition-transform"
                                      >
                                        <Play size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeFromProgression(ch.id); setTileFocusedId(null); }}
                                        title="Delete"
                                        className="p-1 bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    
                                    {/* Individual chord bass note editor */}
                                    <div className="mt-2 p-1 bg-black bg-opacity-20 rounded">
                                      <div className="text-xs text-center text-gray-300 mb-1">Bass Note</div>
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateChordBass(ch.id, null); }}
                                          className={`px-1 py-0.5 text-xs rounded transition-colors ${
                                            !ch.bass ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                          }`}
                                          title="No bass note (use chord root)"
                                        >
                                          ✕
                                        </button>
                                        {roots.map(root => (
                                          <button
                                            key={root}
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateChordBass(ch.id, root); }}
                                            className={`px-1 py-0.5 text-xs rounded transition-colors ${
                                              ch.bass === root ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                            }`}
                                            title={`Set bass note to ${displayNote(root)}`}
                                          >
                                            {displayNote(root)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* right resize handle */}
                              <div
                                onPointerDown={(e) => handleResizeStart(e as any, ch, 'right')}
                                className={`absolute top-1/2 -translate-y-1/2 h-6 w-4 ${tileFocusedId === ch.id ? 'opacity-100' : tileFocusedId ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150 flex items-center justify-center cursor-ew-resize touch-none`}
                                style={{ right: '-6px', background: 'rgba(0,0,0,1)', borderRadius: 2 }}
                                title={tileFocusedId === ch.id ? "Drag right edge" : ""}
                                aria-hidden
                              >
                                <div style={{ width: 2, height: 14, background: '#9CA3AF', transform: 'translateX(-1px)', borderRadius: 2 }} />
                                <div style={{ width: 2, height: 8, background: '#9CA3AF', transform: 'translateX(1px)', borderRadius: 2, opacity: 0.9 }} />
                              </div>

                              {/* drag handle (hover/touch friendly) - start custom pointer drag */}
                              <div
                                className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 flex items-center justify-center cursor-grab"
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const target = e.currentTarget as HTMLElement;
                                  target.setPointerCapture((e as unknown as PointerEvent).pointerId);
                                  
                                  const pt = e as unknown as PointerEvent;
                                  const slot = slotIndexFor(ch.measure, ch.beat);
                                  draggingRef.current = { id: ch.id, startX: pt.clientX, startY: pt.clientY, startSlot: slot, duration: ch.durationBeats };

                                  // Define handlers in scope
                                  const onPointerMove = (evt: PointerEvent) => {
                                    if (!draggingRef.current) return;
                                    const grid = gridRef.current;
                                    if (!grid) return;
                                    const rect = grid.getBoundingClientRect();
                                    const columnsPerRow = Math.min(measures, 4);
                                    const measureWidth = rect.width / columnsPerRow;
                                    const measureHeight = grid.firstElementChild ? (grid.firstElementChild as HTMLElement).clientHeight : 120;
                                    let x = evt.clientX - rect.left;
                                    let y = evt.clientY - rect.top;
                                    x = Math.max(0, Math.min(rect.width - 1, x));
                                    y = Math.max(0, Math.min(rect.height - 1, y));
                                    const col = Math.floor(x / measureWidth);
                                    const row = Math.floor(y / measureHeight);
                                    let measureIdx = row * columnsPerRow + col;
                                    measureIdx = Math.max(0, Math.min(measures - 1, measureIdx));
                                    const withinMeasureX = x - col * measureWidth;
                                    const beat = Math.floor(withinMeasureX / (measureWidth / beatsPerMeasure)) + 1;
                                    const desiredSlot = measureIdx * beatsPerMeasure + (beat - 1);
                                    const moving = progressionRef.current.find(p => p.id === draggingRef.current!.id);
                                    if (!moving) return;

                                    // compute free contiguous space starting at desiredSlot (excluding moving item)
                                    const totalSlots = measures * beatsPerMeasure;
                                    const others = progressionRef.current.filter(p => p.id !== moving.id).map(slotRangeForItem);

                                    const isSlotFree = (s: number) => {
                                      for (const o of others) {
                                        if (s >= o.start && s <= o.end) return false;
                                      }
                                      return true;
                                    };

                                    let s = desiredSlot;
                                    while (s < totalSlots && isSlotFree(s)) s++;
                                    const maxFit = s - desiredSlot;

                                    if (maxFit > 0) {
                                      // we can fit at least some beats here; show preview with the smaller of moving.duration and maxFit
                                      const useDur = Math.min(Math.max(1, moving.durationBeats), maxFit);
                                      const m = Math.floor(desiredSlot / beatsPerMeasure) + 1;
                                      const b = (desiredSlot % beatsPerMeasure) + 1;
                                      const newPr = { measure: m, beat: b, duration: useDur };
                                      setPreviewPlacement(newPr);
                                      previewRef.current = newPr;
                                    } else {
                                      // no free slot starting here Ã¢â‚¬â€ try splitting the occupying chord if present
                                      const occupier = progressionRef.current.find(p => {
                                        const occStart = slotIndexFor(p.measure, p.beat);
                                        const occEnd = occStart + p.durationBeats - 1;
                                        return desiredSlot >= occStart && desiredSlot <= occEnd && p.id !== moving.id;
                                      });
                                      if (occupier) {
                                        const occStart = slotIndexFor(occupier.measure, occupier.beat);
                                        const occEnd = occStart + occupier.durationBeats - 1;
                                        const orig = occupier.durationBeats;
                                        if (orig > 1) {
                                          // Determine if dropping in left or right half
                                          const dropInRight = desiredSlot > occStart + Math.floor(orig / 2) - 1;
                                          let movingDur, existingDur, splitAt;
                                          if (dropInRight) {
                                            // Place moving in right half
                                            splitAt = occEnd - Math.floor(orig / 2) + 1;
                                            movingDur = occEnd - splitAt + 1;
                                            existingDur = orig - movingDur;
                                            const m = Math.floor(splitAt / beatsPerMeasure) + 1;
                                            const b = (splitAt % beatsPerMeasure) + 1;
                                            const newPr2 = { measure: m, beat: b, duration: movingDur, splitTargetId: occupier.id, splitExistingNewDur: existingDur, splitMovingDur: movingDur };
                                            setPreviewPlacement(newPr2);
                                            previewRef.current = newPr2;
                                          } else {
                                            // Place moving in left half (default)
                                            splitAt = occStart;
                                            movingDur = Math.ceil(orig / 2);
                                            existingDur = orig - movingDur;
                                            const m = Math.floor(splitAt / beatsPerMeasure) + 1;
                                            const b = (splitAt % beatsPerMeasure) + 1;
                                            const newPr2 = { measure: m, beat: b, duration: movingDur, splitTargetId: occupier.id, splitExistingNewDur: existingDur, splitMovingDur: movingDur };
                                            setPreviewPlacement(newPr2);
                                            previewRef.current = newPr2;
                                          }
                                        } else {
                                          // can't split a single-beat chord; show preview anyway at desired location
                                          const m = Math.floor(desiredSlot / beatsPerMeasure) + 1;
                                          const b = (desiredSlot % beatsPerMeasure) + 1;
                                          const newPr2 = { measure: m, beat: b, duration: Math.max(1, moving.durationBeats) };
                                          setPreviewPlacement(newPr2);
                                          previewRef.current = newPr2;
                                        }
                                      } else {
                                        // no occupier at desired slot; show preview at desired location
                                        const m = Math.floor(desiredSlot / beatsPerMeasure) + 1;
                                        const b = (desiredSlot % beatsPerMeasure) + 1;
                                        const newPr2 = { measure: m, beat: b, duration: Math.max(1, moving.durationBeats) };
                                        setPreviewPlacement(newPr2);
                                        previewRef.current = newPr2;
                                      }
                                    }
                                  }
                                  // End drag preview logic
                                  // Remove preview and listeners on pointer up
                                  const onPointerUp = (evt: PointerEvent) => {
                                    // Clean up state immediately before any state changes
                                    setPreviewPlacement(null);
                                    const preview = previewRef.current;
                                    const moveId = draggingRef.current?.id;
                                    previewRef.current = null;
                                    draggingRef.current = null;
                                    window.removeEventListener('pointermove', onPointerMove);
                                    window.removeEventListener('pointerup', onPointerUp);
                                    
                                    // Try to release pointer capture
                                    try {
                                      const target = evt.target as HTMLElement;
                                      if (target && target.releasePointerCapture) {
                                        target.releasePointerCapture(evt.pointerId);
                                      }
                                    } catch (e) {
                                      // Ignore if already released
                                    }
                                    
                                    // Now commit the move if we have a valid preview
                                    if (preview && moveId) {
                                      setProgression(prev => {
                                        const updated = [...prev];
                                        const moveIdx = updated.findIndex(p => p.id === moveId);
                                        if (moveIdx === -1) return prev;
                                        
                                        const moving = updated[moveIdx];
                                        const newPos = { measure: preview.measure, beat: preview.beat, durationBeats: preview.duration };
                                        const newStart = slotIndexFor(preview.measure, preview.beat);
                                        const newEnd = newStart + preview.duration - 1;
                                        
                                        // Remove from current position temporarily
                                        updated.splice(moveIdx, 1);
                                        
                                        // Find any chords that overlap with new position
                                        const overlapping = updated.filter((p) => {
                                          const oStart = slotIndexFor(p.measure, p.beat);
                                          const oEnd = oStart + p.durationBeats - 1;
                                          return !(newEnd < oStart || newStart > oEnd);
                                        });
                                        
                                        // If split case, modify the overlapping chord
                                        if ('splitTargetId' in preview && preview.splitTargetId) {
                                          const targetIdx = updated.findIndex(p => p.id === preview.splitTargetId);
                                          if (targetIdx !== -1 && preview.splitExistingNewDur !== undefined) {
                                            updated[targetIdx] = { ...updated[targetIdx], durationBeats: preview.splitExistingNewDur };
                                          }
                                          updated.push({ ...moving, ...newPos });
                                        } else {
                                          // For overlapping chords, shorten or remove them
                                          for (const overlap of overlapping) {
                                            const oIdx = updated.findIndex(p => p.id === overlap.id);
                                            if (oIdx !== -1) {
                                              const oStart = slotIndexFor(overlap.measure, overlap.beat);
                                              // If new chord starts inside overlap, shorten it
                                              if (newStart > oStart) {
                                                const newDur = newStart - oStart;
                                                if (newDur > 0) {
                                                  updated[oIdx] = { ...overlap, durationBeats: newDur };
                                                } else {
                                                  updated.splice(oIdx, 1);
                                                }
                                              } else {
                                                // new chord completely overlaps, remove
                                                updated.splice(oIdx, 1);
                                              }
                                            }
                                          }
                                          updated.push({ ...moving, ...newPos });
                                        }
                                        
                                        return updated;
                                      });
                                    }
                                  };
                                  window.addEventListener('pointermove', onPointerMove);
                                  window.addEventListener('pointerup', onPointerUp);
                                }}
                              >
                                <div className="bg-white bg-opacity-10 rounded-md p-1 flex items-center justify-center">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-95">
                                    <path d="M12 5v14" />
                                    <path d="M5 12h14" />
                                    <path d="M3 12l3-3" strokeWidth="1.4" />
                                    <path d="M3 12l3 3" strokeWidth="1.4" />
                                    <path d="M21 12l-3-3" strokeWidth="1.4" />
                                    <path d="M21 12l-3 3" strokeWidth="1.4" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 pb-8">
          <div className="max-w-2xl mx-auto bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare size={24} className="text-amber-400" />
              <h3 className="text-lg font-semibold">Feedback & Suggestions</h3>
            </div>
            <p className="text-slate-400 mb-4">
              Have ideas for new features, found a bug, or just want to share your thoughts? We'd love to hear from you!
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:feedback@jazzchords.io"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-medium hover:from-amber-300 hover:to-amber-400 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                Send Feedback
              </a>
              <a
                href="https://github.com/jazzchords/jazzchords.io/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 font-medium hover:from-slate-600 hover:to-slate-700 border border-slate-600 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Report Issue
              </a>
              <a
                href="https://buymeacoffee.com/aleclove"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-yellow-400 to-yellow-500 text-slate-900 font-medium hover:from-yellow-300 hover:to-yellow-400 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/>
                </svg>
                Buy Me a Coffee
              </a>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              Built with ♥ for jazz musicians and composers everywhere. © {new Date().getFullYear()} jazzchords.io
            </p>
          </div>
        </div>
      </div>
  );
}

export default JazzChordsApp;

