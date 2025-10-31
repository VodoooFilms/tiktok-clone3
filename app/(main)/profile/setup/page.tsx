"use client";
import MainLayout from "@/app/layouts/MainLayout";
import { useUser } from "@/app/context/user";
import { useProfileSetup } from "@/app/context/profile-setup";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSetupPage() {
  const { user, loading } = useUser();
  const setup = useProfileSetup();
  const router = useRouter();

  // Camera refs for recording (step 2)
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) return; // gated UI below
  }, [user, loading]);

  const stepTitle = useMemo(() => {
    if (setup.step === 1) return "Create AI Profile Image";
    if (setup.step === 2) return "Record or Upload Video Selfie";
    return "Generate Animation";
  }, [setup.step]);

  async function pickSelfieFromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setup.setSelfieUrl(url);
    // Make the uploaded selfie immediately selectable so the user can proceed
    setup.selectImage({ id: "raw", url });
  }

  function improvePrompt() {
    const base = setup.promptOriginal.trim();
    const improved = base
      ? `${base} | cinematic lighting, soft focus, vivid colors, highly detailed, aesthetic portrait`
      : "clean portrait, cinematic lighting, soft focus, vivid colors, highly detailed, aesthetic portrait";
    setup.setPromptImproved(improved);
  }

  async function generateAIImage() {
    if (!setup.selfieUrl) return;
    // Simulate generation by drawing selfie to canvas with a tinted overlay
    const img = new Image();
    img.crossOrigin = "anonymous";
    const attempt = (setup.images.length + 1).toString();
    const tints = ["#10b98188", "#8b5cf688", "#f59e0b88"];
    const tint = tints[setup.images.length] ?? tints[0];
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("failed to load selfie"));
      img.src = setup.selfieUrl as string;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width || 512;
    canvas.height = img.height || 512;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/png");
    setup.pushImage({ id: attempt, url });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      mediaStreamRef.current = stream;
      if (videoEl.current) videoEl.current.srcObject = stream;
      setCountdown(3);
      // countdown 3-2-1 then start for 5s
      let c = 3;
      const interval = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(interval);
          const rec = new MediaRecorder(stream);
          recorderRef.current = rec;
          const chunks: BlobPart[] = [];
          rec.ondataavailable = (ev) => chunks.push(ev.data);
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            setup.setSelfieVideoUrl(url);
            setRecording(false);
            if (videoEl.current) videoEl.current.srcObject = null;
            stream.getTracks().forEach((t) => t.stop());
          };
          rec.start();
          setRecording(true);
          setTimeout(() => rec.stop(), 5000);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("Camera permission denied or unavailable.");
    }
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } catch {}
  }

  async function generateAnimation() {
    if (!setup.selectedImage || !setup.selfieVideoUrl) return;
    setup.setFromSetup(true);
    // Simulate 4s generation
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 4000));
    // Mock result uses the selfie video URL
    setup.setAnimationUrl(setup.selfieVideoUrl);
    router.push("/upload");
  }

  if (!user && !loading) {
    return (
      <MainLayout>
        <section className="p-6">
          <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-white">
            <h1 className="mb-2 text-lg font-semibold">Create your profile</h1>
            <p className="mb-3 text-sm text-neutral-400">Please log in to start your AI profile setup.</p>
            <a href="/auth/callback" className="inline-block rounded-xl bg-emerald-600 px-3 py-2 text-white">Log in</a>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Subtle blurred background accents */}
      <section className="relative min-h-[70vh] p-4 md:p-6 flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        {/* Centered gradient bordered card */}
        <div className="w-full max-w-4xl">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 shadow-xl">
            <div className="rounded-2xl bg-[#0a0a0a]/90 supports-[backdrop-filter]:bg-[#0a0a0a]/80 backdrop-blur px-4 sm:px-6 md:px-8 py-6 md:py-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-neutral-400">Step {setup.step}/3</div>
                <div className="text-base md:text-lg font-semibold text-white">{stepTitle}</div>
              </div>

              {/* STEP 1 */}
              {setup.step === 1 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex w-full justify-center">
                    <div className="relative w-full max-w-xs">
                      {/* Gradient ring avatar */}
                      <div className="mx-auto rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-violet-500">
                        <div className="grid aspect-square w-56 place-items-center rounded-full bg-neutral-950/90 text-neutral-500 overflow-hidden">
                          {setup.selectedImage?.url || setup.selfieUrl ? (
                            <img
                              src={(setup.selectedImage?.url || setup.selfieUrl) as string}
                              alt="preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>Profile preview</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white hover:bg-neutral-900">
                        <input type="file" accept="image/*" className="hidden" onChange={pickSelfieFromFile} />
                        Upload Photo
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white hover:bg-neutral-900">
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={pickSelfieFromFile} />
                        Use Camera
                      </label>
                    </div>
                    <div>
                      <input
                        value={setup.promptOriginal}
                        onChange={(e) => setup.setPromptOriginal(e.target.value)}
                        placeholder="Prompt here..."
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      {setup.promptImproved && (
                        <div className="mt-1 text-xs text-emerald-300">GPT mini: {setup.promptImproved}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={improvePrompt}
                        className="rounded-xl border border-emerald-700/40 bg-emerald-600/10 px-3 py-2 text-emerald-300 hover:bg-emerald-600/20"
                      >
                        GPT mini
                      </button>
                      <button
                        type="button"
                        disabled={!setup.selfieUrl || setup.images.length >= 3}
                        onClick={generateAIImage}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Go Banana 🍌
                      </button>
                      <button
                        type="button"
                        disabled={!setup.selfieUrl}
                        onClick={() => {
                          if (setup.selfieUrl) {
                            setup.selectImage({ id: "raw", url: setup.selfieUrl });
                          }
                          setup.setStep(2);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Skip AI, use my photo
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {setup.images.map((im) => (
                        <button
                          key={im.id}
                          onClick={() => setup.selectImage(im)}
                          className={`h-16 w-16 overflow-hidden rounded-lg border ${
                            setup.selectedImage?.id === im.id ? "border-emerald-500" : "border-neutral-700"
                          }`}
                        >
                          <img src={im.url} alt="gen" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={!setup.selectedImage}
                        onClick={() => setup.setStep(2)}
                        className="rounded-2xl bg-emerald-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {setup.step === 2 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-sm">
                      <div className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-neutral-400">
                        {setup.selectedImage && (
                          <img src={setup.selectedImage.url} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        )}
                        <span>AI avatar</span>
                      </div>
                      {/* Gradient border around video preview */}
                      <div className="rounded-xl p-[2px] bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-violet-500">
                        {setup.selfieVideoUrl ? (
                          <video src={setup.selfieVideoUrl} className="w-full rounded-[10px] bg-black/40" controls playsInline />
                        ) : (
                          <video ref={videoEl} className="w-full rounded-[10px] bg-black/40" autoPlay muted playsInline />
                        )}
                      </div>
                      {countdown !== null && countdown > 0 && (
                        <div className="absolute inset-0 grid place-items-center text-5xl font-bold text-white">{countdown}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-neutral-400">Record or upload your video selfie (max 5s)</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={recording}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Record Video
                      </button>
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white hover:bg-neutral-900">
                        <input
                          type="file"
                          accept="video/*"
                          capture="user"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setup.setSelfieVideoUrl(url);
                          }}
                        />
                        Upload Video
                      </label>
                    </div>
                    {recording && (
                      <button type="button" onClick={stopRecording} className="w-max rounded-xl border border-red-700/50 bg-red-600/10 px-3 py-2 text-red-300">
                        Stop
                      </button>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setup.setSelfieVideoUrl(undefined);
                          setCountdown(null);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white hover:bg-neutral-900"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        disabled={!setup.selfieVideoUrl}
                        onClick={() => setup.setStep(3)}
                        className="rounded-2xl bg-emerald-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {setup.step === 3 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-3">
                      {setup.selectedImage && (
                        <img src={setup.selectedImage.url} alt="ai" className="h-24 w-24 rounded-lg border border-neutral-800 object-cover" />
                      )}
                      {setup.selfieVideoUrl && (
                        <video src={setup.selfieVideoUrl} className="h-24 w-40 rounded-lg border border-neutral-800 object-cover" muted playsInline />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={generateAnimation}
                      disabled={generating}
                      className="mt-2 rounded-2xl bg-emerald-600 px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generating ? "Generating…" : "Generate Animation 🍌"}
                    </button>
                    <div className="text-sm text-neutral-400 flex items-center gap-2">
                      <span>Combining your style and motion…</span>
                      <span className={`inline-block ${generating ? "animate-spin" : ""}`} role="img" aria-label="banana">🍌</span>
                    </div>
                    {generating && (
                      <div className="mt-2 h-1 w-64 overflow-hidden rounded-full bg-neutral-800">
                        <div className="h-full w-1/2 animate-pulse bg-emerald-600"></div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">
                    After generation, you will be redirected to the Post page with the video preloaded.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

