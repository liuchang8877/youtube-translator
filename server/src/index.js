import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { getSubtitles } from "youtube-captions-scraper";

dotenv.config();

const app = express();
const port = process.env.PORT || 5174;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

const translateUrl = process.env.LIBRETRANSLATE_URL || "https://libretranslate.de/translate";
const translateApiKey = process.env.LIBRETRANSLATE_API_KEY || "";

const translationCache = new Map();

function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return id;
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2];
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2];
      }
    }
    return "";
  } catch (error) {
    return "";
  }
}

async function fetchCaptions(videoId, lang) {
  try {
    const manual = await getSubtitles({ videoID: videoId, lang });
    if (manual && manual.length > 0) {
      return { source: "manual", captions: manual };
    }
  } catch (error) {
    // Ignore and try auto captions below.
  }

  try {
    const auto = await getSubtitles({ videoID: videoId, lang, auto: true });
    if (auto && auto.length > 0) {
      return { source: "auto", captions: auto };
    }
  } catch (error) {
    // Ignore and throw after.
  }

  throw new Error("No captions found for this video and language.");
}

async function translateText(text, targetLang, sourceLang) {
  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const payload = {
    q: text,
    source: sourceLang || "auto",
    target: targetLang,
    format: "text"
  };

  if (translateApiKey) {
    payload.api_key = translateApiKey;
  }

  const response = await axios.post(translateUrl, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000
  });

  const translated = response.data.translatedText || "";
  translationCache.set(cacheKey, translated);
  return translated;
}

async function translateBatch(texts, targetLang, sourceLang) {
  const results = [];
  for (const text of texts) {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      results.push("");
      continue;
    }
    const translated = await translateText(trimmed, targetLang, sourceLang);
    results.push(translated);
  }
  return results;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/captions", async (req, res) => {
  const { videoUrl, lang = "en" } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: "Missing videoUrl" });
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const { source, captions } = await fetchCaptions(videoId, lang);
    res.json({ videoId, lang, source, captions });
  } catch (error) {
    res.status(404).json({ error: error.message || "Captions not found" });
  }
});

app.post("/api/translate", async (req, res) => {
  const { texts, targetLang = "zh", sourceLang = "auto" } = req.body || {};
  if (!Array.isArray(texts)) {
    return res.status(400).json({ error: "texts must be an array" });
  }

  try {
    const translations = await translateBatch(texts, targetLang, sourceLang);
    res.json({ translations });
  } catch (error) {
    res.status(500).json({
      error: "Translation failed",
      detail: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
