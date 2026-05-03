export default async function handler(req, res) {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    // 🔒 HTMLエスケープ関数（これが重要）
    function escapeHtml(str) {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    // ① Notion DBからデータ取得
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      }
    });

    const notionData = await notionRes.json();

    // ② チャンネルID抽出
    const channelIds = notionData.results
      .map(page => {
        const prop = page.properties["YouTubeChannelID"];
        if (!prop || !prop.rich_text || prop.rich_text.length === 0) return null;
        return prop.rich_text[0].plain_text;
      })
      .filter(Boolean);

    const results = [];

    // ③ YouTubeライブチェック
    for (const channelId of channelIds) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;

      const r = await fetch(url);
      const data = await r.json();

      if (data.items && data.items.length > 0) {
        const v = data.items[0];

        results.push({
          title: v.snippet?.title || "",
          url: `https://youtube.com/watch?v=${v.id?.videoId || ""}`,
          thumbnail: v.snippet?.thumbnails?.medium?.url || ""
        });
      }
    }

    // ④ HTML生成（安全版）
    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
body {
  margin: 0;
  padding: 24px;
  background: rgba(0,0,0,0);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  color: black;
}

h1 {
  margin-bottom: 24px;
  font-size: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-6px);
}

.thumb {
  width: 100%;
  display: block;
}

.content {
  padding: 16px;
}

.live-badge {
  display: inline-block;
  background: #ff0000;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}

.title {
  margin: 12px 0;
  font-size: 15px;
  line-height: 1.5;
}

.button {
  display: inline-block;
  background: white;
  color: black;
  padding: 10px 14px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
}

.empty {
  opacity: 0.6;
}
</style>
</head>

<body>

<h1>🔴 配信中の参加者</h1>

${
results.length === 0
? `<p class="empty">現在配信中の参加者はいません</p>`
: `
<div class="grid">
${results.map(v => {
  const title = escapeHtml(v.title);
  const thumb = v.thumbnail;
  const url = v.url;

  return `
<div class="card">
  <img class="thumb" src="${thumb}">
  <div class="content">
    <span class="live-badge">🔴 LIVE</span>
    <div class="title">${title}</div>
    <a class="button" href="${url}" target="_blank">
      視聴する
    </a>
  </div>
</div>
`;
}).join("")}
</div>
`
}

</body>
</html>
`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
