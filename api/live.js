export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  // ① Notionから参加者取得
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
    .map(page => page.properties.YouTubeChannelID?.rich_text?.[0]?.plain_text)
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
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id.videoId}`,
        thumbnail: v.snippet.thumbnails.medium.url
      });
    }
  }

  // ④ HTMLで返す（iframe用）
  const html = `
    <html>
      <body style="font-family:sans-serif;">
        ${
          results.length === 0
            ? "<p>現在配信中の参加者はいません</p>"
            : results.map(v => `
              <div style="margin-bottom:20px;">
                <a href="${v.url}" target="_blank">
                  <img src="${v.thumbnail}" width="240"/>
                  <p>${v.title}</p>
                </a>
              </div>
            `).join("")
        }
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
