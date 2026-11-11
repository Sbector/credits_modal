import { drawText, textWidth, wrapText } from './bitmapFont';
import type { Surface } from './surface';

export interface PixelPalette {
  bg: string;
  surface: string;
  border: string;
  fg: string;
  bright: string;
  mid: string;
  dim: string;
}

export interface DialogContent {
  label: string;
  name: string;
  author: string;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const W = 160;
const TOP = 16;
const CLOSE: Rect = { x: 143, y: 0, w: 16, h: 14 };
const SCRAMBLE_MS = 900;
const FRAME_MS = 33;
const SCRAMBLE = '!<>-_\\/[]{}=+*^?#·:01';

function frameRect(ctx: CanvasRenderingContext2D, rect: Rect, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, 1);
  ctx.fillRect(rect.x, rect.y + rect.h - 1, rect.w, 1);
  ctx.fillRect(rect.x, rect.y, 1, rect.h);
  ctx.fillRect(rect.x + rect.w - 1, rect.y, 1, rect.h);
}

export class SceneDialog {
  readonly width = W;
  height = 0;

  private surface: Surface | null = null;
  private palette: PixelPalette;
  private label: string;
  private name: string;
  private authorLines: string[] = [];
  private authorSize = 2;
  private labelY = 0;
  private panel: Rect = { x: 8, y: 0, w: W - 16, h: 0 };
  private lines: string[] = [];
  private nameSize = 2;
  private total = 0;
  private frame = 0;
  private last = -1000;
  private revealed = 0;
  private mode: 'scramble' | 'idle' = 'idle';
  private scrambleStart = 0;
  private focusTarget: 'link' | 'close' | null = null;
  private dither: CanvasPattern | null = null;
  private vignette: CanvasGradient | null = null;

  constructor(palette: PixelPalette, content: DialogContent) {
    this.palette = palette;
    this.label = content.label.toUpperCase();
    this.name = content.name.toUpperCase();
    const author = content.author.trim().toUpperCase();
    if (author) {
      this.authorSize = textWidth(author, 2) <= W - 16 ? 2 : 1;
      this.authorLines =
        this.authorSize === 1 && textWidth(author, 1) > W - 16
          ? wrapText(author, W - 16, 1).slice(0, 2)
          : [author];
    }
    this.computeLayout();
  }

  attach(surface: Surface): void {
    this.surface = surface;
    this.buildDecor();
  }

  getHitRects(): { link: Rect; close: Rect } {
    return {
      link: { x: this.panel.x, y: this.panel.y, w: this.panel.w, h: this.panel.h },
      close: { x: CLOSE.x, y: CLOSE.y, w: CLOSE.w, h: CLOSE.h },
    };
  }

  setFocus(target: 'link' | 'close' | null): void {
    this.focusTarget = target;
  }

  scramble(): void {
    this.mode = 'scramble';
    this.revealed = 0;
    this.scrambleStart = performance.now();
  }

  tick(t: number): void {
    if (t - this.last < FRAME_MS) return;
    this.last = t;
    this.frame += 1;

    let glitch = 0;
    if (this.mode === 'scramble') {
      const progress = Math.min(1, (t - this.scrambleStart) / SCRAMBLE_MS);
      this.revealed = Math.floor(progress * this.total);
      glitch = 1 - progress;
      if (progress >= 1) this.mode = 'idle';
    } else if (Math.random() < 0.012) {
      glitch = 1;
    }

    this.render(true, glitch);
  }

  drawStatic(): void {
    this.revealed = this.total;
    this.mode = 'idle';
    this.render(false, 0);
  }

  private computeLayout(): void {
    const nameMax = W - 20;
    let size = 2;
    let lines = wrapText(this.name, nameMax, size);
    if (lines.length > 2) {
      size = 1;
      lines = wrapText(this.name, nameMax, size);
      if (lines.length > 3) lines = lines.slice(0, 3);
    }
    this.nameSize = size;
    this.lines = lines;
    this.total = lines.reduce((sum, line) => sum + Array.from(line).length, 0);

    const nameBlock = lines.length * 8 * size - 2;
    const authorY = TOP + 8;
    if (this.authorLines.length > 0) {
      this.labelY = authorY + this.authorLines.length * 8 * this.authorSize + 2;
    } else {
      this.labelY = TOP - 2;
    }
    this.panel = {
      x: 8,
      y: this.labelY + 9,
      w: W - 16,
      h: nameBlock + 6,
    };
    this.height = this.panel.y + this.panel.h + 6;
  }

  private buildDecor(): void {
    const surface = this.surface;
    if (!surface) return;
    const ctx = surface.off;

    const tile = document.createElement('canvas');
    tile.width = 2;
    tile.height = 2;
    const tileCtx = tile.getContext('2d');
    if (tileCtx) {
      tileCtx.fillStyle = this.palette.bg;
      tileCtx.fillRect(0, 0, 2, 2);
      tileCtx.fillStyle = this.palette.dim;
      tileCtx.globalAlpha = 0.14;
      tileCtx.fillRect(0, 0, 1, 1);
      tileCtx.fillRect(1, 1, 1, 1);
      this.dither = ctx.createPattern(tile, 'repeat');
    }

    const gradient = ctx.createRadialGradient(
      W / 2,
      this.height * 0.45,
      20,
      W / 2,
      this.height * 0.55,
      W * 0.75,
    );
    gradient.addColorStop(0, 'rgba(17, 19, 21, 0)');
    gradient.addColorStop(1, 'rgba(17, 19, 21, 0.55)');
    this.vignette = gradient;
  }

  private render(cursor: boolean, glitch: number): void {
    const surface = this.surface;
    if (!surface) return;
    const ctx = surface.off;
    const p = this.palette;
    const h = this.height;

    ctx.globalAlpha = 1;
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, h);
    if (this.dither) {
      ctx.fillStyle = this.dither;
      ctx.fillRect(0, 0, W, h);
    }

    ctx.fillStyle = p.surface;
    ctx.fillRect(1, 1, W - 2, 11);
    drawText(ctx, 'CRÉDITOS', 6, 3, p.mid, 1);
    drawText(ctx, 'X', CLOSE.x + 5, 3, this.focusTarget === 'close' ? p.fg : p.dim, 1);

    ctx.fillStyle = p.border;
    ctx.fillRect(1, 12, W - 2, 1);
    if (this.focusTarget === 'close') frameRect(ctx, CLOSE, p.bright);

    let authorY = TOP + 8;
    if (this.authorLines.length > 0) {
      const prefix = 'UNA CREACIÓN DE';
      const prefixW = textWidth(prefix, 1);
      drawText(ctx, prefix, Math.floor((W - prefixW) / 2), TOP, p.dim, 1);
      for (const line of this.authorLines) {
        const lineW = textWidth(line, this.authorSize);
        drawText(ctx, line, Math.floor((W - lineW) / 2), authorY, p.mid, this.authorSize);
        authorY += 8 * this.authorSize;
      }
    }

    const labelW = textWidth(this.label, 1);
    drawText(ctx, this.label, Math.floor((W - labelW) / 2), this.labelY, p.dim, 1);

    const panel = this.panel;
    ctx.fillStyle = p.bg;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    frameRect(ctx, panel, this.focusTarget === 'link' ? p.bright : p.border);

    const lineHeight = 8 * this.nameSize;
    const blockHeight = this.lines.length * lineHeight - 2;
    let y = panel.y + Math.floor((panel.h - blockHeight) / 2);
    let rendered = 0;
    let cursorX = 0;
    let cursorY = y;

    for (const line of this.lines) {
      const glyphs = Array.from(line);
      const count = glyphs.length;
      const lineWidth = count * 6 * this.nameSize - this.nameSize;
      const startX = panel.x + Math.floor((panel.w - lineWidth) / 2);
      let x = startX;

      for (let i = 0; i < count; i += 1) {
        const position = rendered + i;
        const real = position < this.revealed;
        const char = real
          ? glyphs[i]
          : SCRAMBLE[(this.frame * 7 + position * 31) % SCRAMBLE.length];
        drawText(ctx, char, x, y, real ? p.fg : p.mid, this.nameSize);
        x += 6 * this.nameSize;
      }

      cursorX = startX + lineWidth + this.nameSize;
      cursorY = y;
      rendered += count;
      y += lineHeight;
    }

    if (cursor && cursorX < panel.x + panel.w - 2 && Math.floor(this.frame / 15) % 2 === 0) {
      ctx.fillStyle = p.mid;
      ctx.fillRect(cursorX, cursorY, 2 * this.nameSize, 7 * this.nameSize);
    }

    if (glitch > 0) {
      for (let slice = 0; slice < 2; slice += 1) {
        const sy = 2 + Math.floor(Math.random() * (h - 4));
        const sh = 1 + Math.floor(Math.random() * 3);
        const dx = Math.round((Math.random() * 2 - 1) * 4 * glitch);
        ctx.drawImage(ctx.canvas, 0, sy, W, sh, dx, sy, W, sh);
      }
    }

    ctx.fillStyle = 'rgba(17, 19, 21, 0.3)';
    for (let line = 0; line < h; line += 3) {
      ctx.fillRect(0, line, W, 1);
    }

    if (this.vignette) {
      ctx.fillStyle = this.vignette;
      ctx.fillRect(0, 0, W, h);
    }

    frameRect(ctx, { x: 0, y: 0, w: W, h }, p.border);

    surface.present();
  }
}
