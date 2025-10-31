export async function imageUrlToSquareBase64(url: string): Promise<{ base64Data: string; mimeType: string }> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Failed to load image"));
    img.src = url;
  });
  const w = img.naturalWidth || img.width || 512;
  const h = img.naturalHeight || img.height || 512;
  const size = Math.min(w, h);
  const sx = Math.floor((w - size) / 2);
  const sy = Math.floor((h - size) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
  const dataUrl = canvas.toDataURL("image/png");
  const base64Data = dataUrl.split(",")[1] || "";
  return { base64Data, mimeType: "image/png" };
}

