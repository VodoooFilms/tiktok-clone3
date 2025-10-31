export async function blobToBase64(blob: Blob): Promise<{ base64Data: string; mimeType: string }> {
  const mimeType = blob.type || "image/png";
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64Data = btoa(binary);
  return { base64Data, mimeType };
}

export async function urlToBase64(url: string): Promise<{ base64Data: string; mimeType: string }> {
  // Blob URLs are not reliably fetch-able; use canvas to extract pixels
  if (url.startsWith("blob:")) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Failed to load blob image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 512;
    canvas.height = img.naturalHeight || img.height || 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    const base64Data = dataUrl.split(",")[1] || "";
    return { base64Data, mimeType: "image/png" };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load image");
  const blob = await res.blob();
  return blobToBase64(blob);
}
