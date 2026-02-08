const { getSubtitles } = require('youtube-captions-scraper');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { videoId, lang = 'en' } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    const captions = await getSubtitles({ videoID: videoId, lang });
    res.json(captions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
