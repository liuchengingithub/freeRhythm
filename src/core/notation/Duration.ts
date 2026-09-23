import type { 
  Note, 
  TimeSignature, 
  NoteValue, 
  TupletRatio 
} from '../../types/notation';
import { BASE_DURATION_MAP } from '../../types/notation';

export function getBaseDuration(value: NoteValue): number {
  return BASE_DURATION_MAP[value];
}

export function getDurationInWholeNotes(note: Note): number {
  let dur = BASE_DURATION_MAP[note.value];
  
  if (note.dots > 0) {
    let addition = dur * 0.5;
    for (let i = 0; i < note.dots; i++) {
      dur += addition;
      addition *= 0.5;
    }
  }
  
  if (note.tuplet) {
    const [n, d] = note.tuplet.split(':').map(Number);
    dur *= d / n;
  }
  
  return dur;
}

export function getDurationInBeats(note: Note, timeSig: TimeSignature): number {
  const durationInWhole = getDurationInWholeNotes(note);
  return durationInWhole * (timeSig.denominator / 4);
}

export function getActualDuration(note: Note, timeSig: TimeSignature): number {
  return getDurationInBeats(note, timeSig);
}

export function quantizeBeatPosition(
  beatPos: number, 
  subdivision: 'eighth' | 'sixteenth'
): number {
  const grid = subdivision === 'sixteenth' ? 0.25 : 0.5;
  return Math.round(beatPos / grid) * grid;
}

export function parseTupletRatio(ratio: TupletRatio): { numerator: number; denominator: number } {
  const [n, d] = ratio.split(':').map(Number);
  return { numerator: n, denominator: d };
}

export function formatDuration(beats: number): string {
  if (beats >= 4) return `${beats / 4} whole`;
  if (beats >= 2) return `${beats / 2} half`;
  if (beats >= 1) return `${beats} quarter`;
  if (beats >= 0.5) return `${beats / 0.5} eighth`;
  if (beats >= 0.25) return `${beats / 0.25} sixteenth`;
  return `${beats / 0.125} thirty-second`;
}

export function canFitInMeasure(notes: Note[], newNote: Note, timeSig: TimeSignature): boolean {
  const totalBeats = notes.reduce((sum, n) => sum + getActualDuration(n, timeSig), 0);
  const newNoteBeats = getActualDuration(newNote, timeSig);
  const maxBeats = timeSig.numerator;
  return totalBeats + newNoteBeats <= maxBeats + 0.0001;
}

export function getNextBeatPosition(notes: Note[], timeSig: TimeSignature): number {
  return notes.reduce((sum, n) => sum + getActualDuration(n, timeSig), 0);
}
