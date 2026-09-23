import { Factory, RenderContext, Stave, StaveNote, Voice, Formatter, Beam, Tuplet, GhostNote } from 'vexflow';
import type { Score, Measure, Note } from '../../types/notation';

const NOTE_VALUE_TO_VEXFLOW: Record<string, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16',
  'thirty-second': '32',
};

const REST_VALUE_TO_VEXFLOW: Record<string, string> = {
  whole: 'wr',
  half: 'hr',
  quarter: 'qr',
  eighth: '8r',
  sixteenth: '16r',
  'thirty-second': '32r',
};

export class VexFlowRenderer {
  private factory: Factory;
  private context: RenderContext;

  constructor(private container: HTMLElement) {
    const width = container.clientWidth || 800;
    const height = 400;
    this.factory = new Factory({ renderer: { elementId: container.id, width, height } });
    this.context = this.factory.getContext();
  }

  setContainer(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = 400;
    this.factory = new Factory({ renderer: { elementId: container.id, width, height } });
    this.context = this.factory.getContext();
  }

  render(score: Score, options: {
    pxPerBeat?: number;
    highlightMeasure?: number;
    highlightBeat?: number;
    showGrid?: boolean;
  } = {}) {
    const { pxPerBeat = 80, highlightMeasure, highlightBeat, showGrid = true } = options;
    
    this.clear();
    
    const measures = score.measures;
    const marginLeft = 40;
    const marginTop = 20;
    const staveHeight = 120;
    
    let currentX = marginLeft;
    let currentY = marginTop;
    const maxWidth = (this.container.clientWidth || 800) - 80;
    
    measures.forEach((measure, measureIndex) => {
      const measureBeats = measure.timeSignature.numerator;
      const measureWidth = Math.max(measureBeats * pxPerBeat, 160);
      
      if (currentX + measureWidth > maxWidth && measureIndex > 0) {
        currentX = marginLeft;
        currentY += staveHeight + 40;
      }
      
      const stave = new Stave(currentX, currentY, measureWidth);
      
      if (measureIndex === 0 || 
          measures[measureIndex - 1].timeSignature.numerator !== measure.timeSignature.numerator ||
          measures[measureIndex - 1].timeSignature.denominator !== measure.timeSignature.denominator) {
        stave.addTimeSignature(`${measure.timeSignature.numerator}/${measure.timeSignature.denominator}`);
      }
      
      stave.setContext(this.context).draw();
      
      if (showGrid) {
        this.drawGridLines(stave, measure, pxPerBeat);
      }
      
      if (measure.notes.length > 0) {
        this.renderNotes(measure, stave, pxPerBeat, measureIndex === highlightMeasure, highlightBeat || 0);
      }
      
      if (measureIndex === highlightMeasure) {
        this.drawPlayhead(stave, highlightBeat || 0, pxPerBeat);
      }
      
      currentX += measureWidth + 20;
    });
  }

  private drawGridLines(stave: Stave, measure: Measure, pxPerBeat: number) {
    const ctx = this.context;
    const beats = measure.timeSignature.numerator;
    
    for (let beat = 0; beat <= beats; beat++) {
      const x = stave.getX() + beat * pxPerBeat;
      const isDownbeat = beat === 0;
      
      ctx.setLineWidth(isDownbeat ? 1.5 : 0.5);
      ctx.setStrokeStyle(isDownbeat ? '#999' : '#ddd');
      ctx.beginPath();
      ctx.moveTo(x, stave.getY());
      ctx.lineTo(x, stave.getY() + stave.getHeight());
      ctx.stroke();
    }
  }

  private renderNotes(
    measure: Measure, 
    stave: Stave, 
    pxPerBeat: number,
    isHighlighted: boolean,
    highlightBeat: number
  ) {
    const voice = new Voice({
      numBeats: measure.timeSignature.numerator,
      beatValue: measure.timeSignature.denominator,
      resolution: 4096,
    });

    const vfNotes: (StaveNote | GhostNote)[] = [];

    measure.notes.forEach((note) => {
      const vexDuration = this.getVexFlowDuration(note);
      const isRest = note.isRest;
      
      let vfNote: StaveNote | GhostNote;
      
      if (isRest) {
        vfNote = new StaveNote({
          keys: ['b/4'],
          duration: vexDuration,
          dots: note.dots,
        });
      } else {
        vfNote = new StaveNote({
          keys: ['b/4'],
          duration: vexDuration,
          dots: note.dots,
        });
        
        if (note.notehead === 'x') {
          // Use GhostNote for x notehead (muted/percussive)
          vfNote = new GhostNote({
            duration: vexDuration,
            dots: note.dots,
          });
        }
      }

      vfNotes.push(vfNote);
    });

    if (vfNotes.length === 0) return;

    voice.addTickables(vfNotes as StaveNote[]);

    const beams = Beam.generateBeams(vfNotes as StaveNote[]);
    beams.forEach(beam => beam.setContext(this.context).draw());

    const tuplets = this.findTuplets(vfNotes as StaveNote[], measure.notes);
    tuplets.forEach(tuplet => tuplet.setContext(this.context).draw());

    const formatter = new Formatter();
    formatter.joinVoices([voice]);
    formatter.format([voice], stave.getWidth() - 40);
    voice.draw(this.context, stave);

    if (isHighlighted && highlightBeat >= 0) {
      this.drawBeatHighlight(stave, highlightBeat, pxPerBeat);
    }
  }

  private findTuplets(vfNotes: StaveNote[], notes: Note[]): Tuplet[] {
    const tuplets: Tuplet[] = [];
    let i = 0;
    
    while (i < notes.length) {
      const note = notes[i];
      if (!note.tuplet) {
        i++;
        continue;
      }
      
      const ratio = note.tuplet;
      const tupletNotes: StaveNote[] = [];
      let j = i;
      
      while (j < notes.length && notes[j].tuplet === ratio) {
        tupletNotes.push(vfNotes[j]);
        j++;
      }
      
      if (tupletNotes.length > 1) {
        const [num, den] = ratio.split(':').map(Number);
        const tuplet = new Tuplet(tupletNotes, {
          numNotes: num,
          notesOccupied: den,
          location: Tuplet.LOCATION_TOP,
        });
        tuplets.push(tuplet);
      }
      
      i = j;
    }
    
    return tuplets;
  }

  private getVexFlowDuration(note: Note): string {
    const base = NOTE_VALUE_TO_VEXFLOW[note.value] || 'q';
    if (note.isRest) {
      return REST_VALUE_TO_VEXFLOW[note.value] || 'qr';
    }
    
    let duration = base;
    if (note.dots === 1) duration += 'd';
    else if (note.dots === 2) duration += 'dd';
    
    return duration;
  }

  private drawPlayhead(stave: Stave, beat: number, pxPerBeat: number) {
    const ctx = this.context;
    const x = stave.getX() + beat * pxPerBeat;
    
    ctx.setLineWidth(2);
    ctx.setStrokeStyle('#e53935');
    ctx.beginPath();
    ctx.moveTo(x, stave.getY() - 5);
    ctx.lineTo(x, stave.getY() + stave.getHeight() + 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, stave.getY() - 10, 5, 0, 2 * Math.PI, false);
    ctx.setFillStyle('#e53935');
    ctx.fill();
  }

  private drawBeatHighlight(stave: Stave, beat: number, pxPerBeat: number) {
    const ctx = this.context;
    const x = stave.getX() + beat * pxPerBeat;
    
    ctx.setFillStyle('rgba(33, 150, 243, 0.15)');
    ctx.fillRect(x - pxPerBeat / 2, stave.getY(), pxPerBeat, stave.getHeight());
  }

  clear() {
    this.context.clear();
  }

  getSVG(): SVGElement | null {
    return this.container.querySelector('svg');
  }
}
