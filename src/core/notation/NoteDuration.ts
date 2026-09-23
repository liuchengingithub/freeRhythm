import type { NoteValue, RhythmNote, TupletRatio } from '../../types/rhythm';

/**
 * 计算音符的实际时值（以四分音符为 1 拍）
 */
export function getNoteDuration(value: NoteValue, dots: number = 0, tuplet?: TupletRatio): number {
  const baseDurations: Record<NoteValue, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
  };

  let duration = baseDurations[value];

  // 处理附点
  if (dots > 0) {
    let dotValue = duration / 2;
    for (let i = 0; i < dots; i++) {
      duration += dotValue;
      dotValue /= 2;
    }
  }

  // 处理连音
  if (tuplet) {
    const [num, den] = tuplet.split(':').map(Number);
    duration = duration * (den / num);
  }

  return duration;
}

/**
 * 计算小节的总时值
 */
export function getMeasureTotalDuration(notes: RhythmNote[]): number {
  return notes.reduce((sum, note) => {
    return sum + getNoteDuration(note.value, note.dots, note.tuplet);
  }, 0);
}

/**
 * 检查是否可以添加音符到小节
 */
export function canAddNoteToMeasure(
  currentDuration: number,
  maxDuration: number,
  newNoteDuration: number,
  allowPartial: boolean = false
): boolean {
  const totalAfterAdd = currentDuration + newNoteDuration;
  
  if (allowPartial) {
    return totalAfterAdd <= maxDuration;
  }
  
  return Math.abs(totalAfterAdd - maxDuration) < 0.0001 || totalAfterAdd < maxDuration;
}

/**
 * 获取小节还差多少拍
 */
export function getMeasureRemaining(currentDuration: number, maxDuration: number): number {
  const remaining = maxDuration - currentDuration;
  return Math.max(0, remaining);
}

/**
 * 获取小节是否已满
 */
export function isMeasureComplete(currentDuration: number, maxDuration: number): boolean {
  return Math.abs(currentDuration - maxDuration) < 0.0001;
}

/**
 * 获取小节是否超过
 */
export function isMeasureOverflow(currentDuration: number, maxDuration: number): boolean {
  return currentDuration > maxDuration;
}