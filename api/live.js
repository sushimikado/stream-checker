export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  const channelIds = [
    "UCxxxxxxxxxxxx"
  ];

  const results = [];

  for (const channelId of channelIds) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    if (data.items && data.items.length > 0) {
      const v = data.items[0];

      results.push({
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id.videoId}`,
        thumbnail: v.snippet.thumbnails.medium.url
      });
    }
  }

  res.status(200).json(results);
}
