export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  off: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number;
  fit(availW: number, availH: number, maxScale: number): number;
  present(): void;
}

export function createSurface(canvas: HTMLCanvasElement, width: number, height: number): Surface {
  const ctx = canvas.getContext('2d', { alpha: false });
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const off = offCanvas.getContext('2d', { alpha: false });
  if (!ctx || !off) throw new Error('Canvas 2D no disponible');

  canvas.width = width;
  canvas.height = height;

  const surface: Surface = {
    canvas,
    ctx,
    off,
    width,
    height,
    scale: 1,
    fit(availW: number, availH: number, maxScale: number): number {
      let scale = Math.min(availW / width, availH / height, maxScale);
      if (scale >= 2) scale = Math.floor(scale);
      surface.scale = Math.max(1, scale);
      canvas.style.width = `${Math.round(width * surface.scale)}px`;
      canvas.style.height = `${Math.round(height * surface.scale)}px`;
      return surface.scale;
    },
    present(): void {
      ctx.drawImage(offCanvas, 0, 0);
    },
  };

  return surface;
}
