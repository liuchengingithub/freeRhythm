import { describe, it, expect } from 'vitest';
import {
  getBaseDuration,
  getDurationInWholeNotes,
  getActualDuration,
  quantizeBeatPosition,
  parseTupletRatio,
  canFitInMeasure,
  getNextBeatPosition,
} from '../Duration';
import type { Note, TimeSignature } from '../../../types/notation';

const defaultTimeSig: TimeSignature = { numerator: 4, denominator: 4 };

const createNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'test',
  value: 'quarter',
  dots: 0,
  isRest: false,
  measureIndex: 0,
  beatPosition: 0,
  ...overrides,
});

describe('Duration calculations', () => {
  describe('getBaseDuration', () => {
    it('returns correct base durations', () => {
      expect(getBaseDuration('whole')).toBe(4);
      expect(getBaseDuration('half')).toBe(2);
      expect(getBaseDuration('quarter')).toBe(1);
      expect(getBaseDuration('eighth')).toBe(0.5);
      expect(getBaseDuration('sixteenth')).toBe(0.25);
      expect(getBaseDuration('thirty-second')).toBe(0.125);
    });
  });

  describe('getDurationInWholeNotes', () => {
    it('calculates simple note values', () => {
      expect(getDurationInWholeNotes(createNote({ value: 'whole' }))).toBe(4);
      expect(getDurationInWholeNotes(createNote({ value: 'half' }))).toBe(2);
      expect(getDurationInWholeNotes(createNote({ value: 'quarter' }))).toBe(1);
      expect(getDurationInWholeNotes(createNote({ value: 'eighth' }))).toBe(0.5);
      expect(getDurationInWholeNotes(createNote({ value: 'sixteenth' }))).toBe(0.25);
    });

    it('calculates dotted notes', () => {
      const dottedQuarter = createNote({ value: 'quarter', dots: 1 });
      expect(getDurationInWholeNotes(dottedQuarter)).toBe(1.5);
      
      const doubleDottedHalf = createNote({ value: 'half', dots: 2 });
      expect(getDurationInWholeNotes(doubleDottedHalf)).toBe(3.5);
    });

    it('calculates tuplets', () => {
      const tripletEighth = createNote({ value: 'eighth', tuplet: '3:2' });
      expect(getDurationInWholeNotes(tripletEighth)).toBeCloseTo(0.5 * 2 / 3);
      
      const tripletSixteenth = createNote({ value: 'sixteenth', tuplet: '3:4' });
      expect(getDurationInWholeNotes(tripletSixteenth)).toBeCloseTo(0.25 * 4 / 3);
    });

    it('combines dots and tuplets', () => {
      const dottedTripletEighth = createNote({ value: 'eighth', dots: 1, tuplet: '3:2' });
      const base = 0.5 * 1.5;
      const withTuplet = base * 2 / 3;
      expect(getDurationInWholeNotes(dottedTripletEighth)).toBeCloseTo(withTuplet);
    });
  });

  describe('getActualDuration (4/4 time)', () => {
    it('returns beats in 4/4', () => {
      expect(getActualDuration(createNote({ value: 'whole' }), defaultTimeSig)).toBe(4);
      expect(getActualDuration(createNote({ value: 'half' }), defaultTimeSig)).toBe(2);
      expect(getActualDuration(createNote({ value: 'quarter' }), defaultTimeSig)).toBe(1);
      expect(getActualDuration(createNote({ value: 'eighth' }), defaultTimeSig)).toBe(0.5);
      expect(getActualDuration(createNote({ value: 'sixteenth' }), defaultTimeSig)).toBe(0.25);
    });

    it('handles dotted notes in 4/4', () => {
      expect(getActualDuration(createNote({ value: 'quarter', dots: 1 }), defaultTimeSig)).toBe(1.5);
      expect(getActualDuration(createNote({ value: 'eighth', dots: 1 }), defaultTimeSig)).toBe(0.75);
    });

    it('handles tuplets in 4/4', () => {
      expect(getActualDuration(createNote({ value: 'eighth', tuplet: '3:2' }), defaultTimeSig)).toBeCloseTo(1/3);
      expect(getActualDuration(createNote({ value: 'quarter', tuplet: '3:2' }), defaultTimeSig)).toBeCloseTo(2/3);
    });
  });

  describe('quantizeBeatPosition', () => {
    it('quantizes to eighth grid', () => {
      expect(quantizeBeatPosition(0.1, 'eighth')).toBe(0);
      expect(quantizeBeatPosition(0.3, 'eighth')).toBe(0.5);
      expect(quantizeBeatPosition(0.6, 'eighth')).toBe(0.5);
      expect(quantizeBeatPosition(0.8, 'eighth')).toBe(1);
    });

    it('quantizes to sixteenth grid', () => {
      expect(quantizeBeatPosition(0.1, 'sixteenth')).toBe(0);
      expect(quantizeBeatPosition(0.15, 'sixteenth')).toBe(0.25);
      expect(quantizeBeatPosition(0.4, 'sixteenth')).toBe(0.5);
      expect(quantizeBeatPosition(0.65, 'sixteenth')).toBe(0.75);
    });
  });

  describe('parseTupletRatio', () => {
    it('parses common ratios', () => {
      expect(parseTupletRatio('3:2')).toEqual({ numerator: 3, denominator: 2 });
      expect(parseTupletRatio('3:4')).toEqual({ numerator: 3, denominator: 4 });
      expect(parseTupletRatio('5:4')).toEqual({ numerator: 5, denominator: 4 });
    });
  });

  describe('canFitInMeasure', () => {
    it('returns true when note fits', () => {
      const notes = [createNote({ value: 'quarter' })];
      expect(canFitInMeasure(notes, createNote({ value: 'quarter' }), defaultTimeSig)).toBe(true);
    });

    it('returns false when measure would overflow', () => {
      const notes = [
        createNote({ value: 'half' }),
        createNote({ value: 'half' }),
      ];
      expect(canFitInMeasure(notes, createNote({ value: 'quarter' }), defaultTimeSig)).toBe(false);
    });

    it('handles exact fit', () => {
      const notes = [createNote({ value: 'half' }), createNote({ value: 'half' })];
      expect(canFitInMeasure(notes, createNote({ value: 'whole' }), defaultTimeSig)).toBe(false);
    });
  });

  describe('getNextBeatPosition', () => {
    it('returns 0 for empty measure', () => {
      expect(getNextBeatPosition([], defaultTimeSig)).toBe(0);
    });

    it('returns sum of note durations', () => {
      const notes = [
        createNote({ value: 'quarter' }),
        createNote({ value: 'eighth' }),
      ];
      expect(getNextBeatPosition(notes, defaultTimeSig)).toBe(1.5);
    });
  });
});
