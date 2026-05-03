// ── Canvas 텍스트 오버레이 — 한글을 AI 모델 대신 Canvas API로 렌더링 ─────
// AI 이미지 모델은 한글 글자를 깨진 형태로 출력함.
// 해결책: 배경 이미지 생성 후 Canvas API로 한글 텍스트를 직접 합성.

export interface TextOverlayOptions {
  text: string;
  position: 'top' | 'middle' | 'bottom';
  color: string;                  // hex or rgba (e.g. '#ffffff')
  fontSizeRatio?: number;         // 이미지 너비 대비 비율, 기본 0.042
}

export function overlayText(
  imageSrc: string,               // data: URI (data:image/...;base64,...)
  opts: TextOverlayOptions,
): Promise<string> {              // returns data: URI (PNG) with text baked in
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d')!;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const fontSize   = Math.round(img.naturalWidth * (opts.fontSizeRatio ?? 0.042));
      const lineHeight = fontSize * 1.3;
      const maxWidth   = img.naturalWidth * 0.82;

      // 한글을 지원하는 시스템 폰트 스택
      ctx.font         = `700 ${fontSize}px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif`;
      ctx.fillStyle    = opts.color;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur   = fontSize * 0.35;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // 줄바꿈: maxWidth 초과 시 다음 줄
      const words = opts.text.split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line); line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      const totalH = lines.length * lineHeight;
      const yStart = opts.position === 'top'
        ? img.naturalHeight * 0.13
        : opts.position === 'bottom'
          ? img.naturalHeight * 0.87 - totalH + lineHeight * 0.5
          : img.naturalHeight * 0.5  - totalH * 0.5 + lineHeight * 0.5;

      lines.forEach((l, i) => {
        ctx.fillText(l, img.naturalWidth / 2, yStart + i * lineHeight);
      });

      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
