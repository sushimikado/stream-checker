export default async function handler(req, res) {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    function escapeHtml(str) {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      }
    });

    const notionData = await notionRes.json();

    const channelIds = notionData.results
      .map(page => {
        const prop = page.properties["YouTubeChannelID"];
        if (!prop || !prop.rich_text || prop.rich_text.length === 0) return null;
        return prop.rich_text[0].plain_text;
      })
      .filter(Boolean);

    const results = [];

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

    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
body {
  margin: 0;
  padding: 16px;
  background: transparent; /* ← ここ重要 */
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* コンテナ */
.wrapper {
  max-width: 1100px;
  margin: 0 auto;
}

/* グリッド */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* カード */
.card {
  background: white;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.12);
}

/* サムネ */
.thumb {
  width: 100%;
  display: block;
}

/* コンテンツ */
.content {
  padding: 16px;
}

/* LIVEバッジ */
.live-badge {
  display: inline-block;
  background: #ff3b30;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

/* タイトル */
.title {
  margin: 10px 0 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

/* ボタン */
.button {
  display: inline-block;
  background: #111;
  color: white;
  padding: 8px 14px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

/* 空状態 */
.empty {
  color: #666;
  font-size: 14px;
}
</style>
</head>

<body>

<div class="wrapper">

${
results.length === 0
? `<p class="empty">現在配信中の参加者はいません</p>`
: `
<div class="grid">
${results.map(v => {
  const title = escapeHtml(v.title);

  return `
<div class="card">
  <img class="thumb" src="${v.thumbnail}">
  <div class="content">
    <span class="live-badge">LIVE</span>
    <div class="title">${title}</div>
    <a class="button" href="${v.url}" target="_blank">
      視聴する
    </a>
  </div>
</div>
`;
}).join("")}
</div>
`
}

</div>

</body>
</html>
`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
