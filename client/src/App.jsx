import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import YouTube from "react-youtube";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "英语" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日语" },
  { value: "ko", label: "韩语" },
  { value: "es", label: "西班牙语" },
  { value: "fr", label: "法语" },
  { value: "de", label: "德语" }
];

const TARGET_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "英语" },
  { value: "ja", label: "日语" },
  { value: "ko", label: "韩语" },
  { value: "es", label: "西班牙语" },
  { value: "fr", label: "法语" },
  { value: "de", label: "德语" }
];

function cleanText(text) {
  return (text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [captionLang, setCaptionLang] = useState("en");
  const [targetLang, setTargetLang] = useState("zh");
  const [captions, setCaptions] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  const playerRef = useRef(null);
  const pollRef = useRef(null);

  const cleanedCaptions = useMemo(
    () => captions.map((item) => ({ ...item, text: cleanText(item.text) })),
    [captions]
  );

  const currentIndex = useMemo(() => {
    if (!cleanedCaptions.length) return -1;
    return cleanedCaptions.findIndex(
      (item) => currentTime >= item.start && currentTime <= item.start + item.dur
    );
  }, [cleanedCaptions, currentTime]);

  const currentCaption = cleanedCaptions[currentIndex] || null;
  const currentTranslation = translations[currentIndex] || "";

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const handleReady = (event) => {
    playerRef.current = event.target;
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 200);
  };

  const handleLoad = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("loading");
    setCaptions([]);
    setTranslations([]);
    setSource("");
    setVideoId("");

    try {
      const captionsResponse = await axios.get("/api/captions", {
        params: { videoUrl, lang: captionLang }
      });

      const { captions: rawCaptions, source: sourceName, videoId: id } = captionsResponse.data;
      const cleaned = (rawCaptions || []).map((item) => ({
        ...item,
        text: cleanText(item.text)
      }));

      setCaptions(cleaned);
      setSource(sourceName);
      setVideoId(id);

      if (!cleaned.length) {
        setStatus("idle");
        setError("没有找到字幕，请尝试其他语言或视频。");
        return;
      }

      setStatus("translating");
      const translationResponse = await axios.post("/api/translate", {
        texts: cleaned.map((item) => item.text),
        targetLang,
        sourceLang: captionLang
      });

      setTranslations(translationResponse.data.translations || []);
      setStatus("ready");
    } catch (err) {
      const message = err.response?.data?.error || err.message || "加载失败";
      setError(message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <header className="max-w-6xl mx-auto mb-10">
        <p className="text-sm uppercase tracking-[0.25em] text-mint">Live Translate</p>
        <h1 className="text-4xl md:text-5xl font-serif text-sand mt-2">
          YouTube 实时字幕翻译
        </h1>
        <p className="text-sand/70 mt-3 max-w-2xl">
          输入 YouTube 视频链接，自动抓取字幕并同步翻译。支持手动字幕与自动字幕。
        </p>
      </header>

      <section className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-sand text-ink rounded-3xl p-6 shadow-soft">
          <form className="grid gap-4" onSubmit={handleLoad}>
            <div className="grid gap-2">
              <label className="text-sm font-medium">YouTube 视频 URL</label>
              <input
                className="w-full rounded-xl border border-ink/10 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">字幕语言</label>
                <select
                  className="rounded-xl border border-ink/10 bg-white/90 px-3 py-3"
                  value={captionLang}
                  onChange={(event) => setCaptionLang(event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">翻译目标</label>
                <select
                  className="rounded-xl border border-ink/10 bg-white/90 px-3 py-3"
                  value={targetLang}
                  onChange={(event) => setTargetLang(event.target.value)}
                >
                  {TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="bg-ink text-sand py-3 rounded-xl font-semibold hover:bg-ink/90 transition"
              disabled={status === "loading" || status === "translating"}
            >
              {status === "loading" && "获取字幕中..."}
              {status === "translating" && "翻译中..."}
              {status === "idle" && "开始翻译"}
              {status === "ready" && "重新加载"}
            </button>
          </form>

          <div className="mt-6 grid gap-3">
            {error && <p className="text-coral font-medium">{error}</p>}
            {source && (
              <div className="text-xs uppercase tracking-[0.2em] text-ink/60">
                字幕来源: {source === "manual" ? "手动字幕" : "自动字幕"}
              </div>
            )}
          </div>

          <div className="mt-8 aspect-video rounded-2xl overflow-hidden bg-ink">
            {videoId ? (
              <YouTube
                videoId={videoId}
                onReady={handleReady}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: { rel: 0, modestbranding: 1 }
                }}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sand/60">
                视频将在这里播放
              </div>
            )}
          </div>
        </div>

        <div className="bg-ink/60 border border-sand/10 rounded-3xl p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">实时字幕</h2>
            <span className="text-xs text-sand/60">同步更新</span>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="bg-sand text-ink rounded-2xl p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-ink/50">原文</p>
              <p className="mt-3 text-lg font-medium min-h-[3rem]">
                {currentCaption?.text || "播放视频以显示字幕"}
              </p>
            </div>

            <div className="bg-ocean text-sand rounded-2xl p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-sand/60">翻译</p>
              <p className="mt-3 text-lg font-medium min-h-[3rem]">
                {currentTranslation || "翻译结果将在这里显示"}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm uppercase tracking-[0.3em] text-sand/50">字幕列表</h3>
            <div className="mt-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-hidden space-y-3">
              {cleanedCaptions.map((item, index) => (
                <button
                  key={`${item.start}-${index}`}
                  className={`w-full text-left rounded-2xl p-4 transition border border-transparent ${
                    index === currentIndex
                      ? "bg-mint text-ink border-mint"
                      : "bg-ink/50 text-sand/80 hover:bg-ink/70"
                  }`}
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.seekTo(item.start, true);
                    }
                  }}
                >
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {translations[index] ? translations[index] : "翻译中..."}
                  </p>
                </button>
              ))}
              {!cleanedCaptions.length && (
                <div className="text-sand/50">还没有字幕数据</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
