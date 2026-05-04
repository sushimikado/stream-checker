export default async function handler(req, res) {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    function escapeHtml(str) {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    // 🔽 プラットフォーム判定
    function getPlatformIcon(url) {
      if (!url) return "";

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return `<img src="/icons/youtube.svg">`;
      }
      if (url.includes("twitch.tv")) {
        return `<img src="/icons/twitch.svg">`;
      }
      if (url.includes("tiktok.com")) {
        return `<img src="/icons/tiktok.svg">`;
      }

      return `<img src="/icons/link.svg">`;
    }

    // 🔽 Xアイコン（←これを使う）
    function getXIcon() {
      return `<img src="/icons/x.svg">`;
    }

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      }
    });

    const data = await notionRes.json();

    const members = data.results.map(page => {
      const p = page.properties;

      const name = p["名前"]?.title?.[0]?.plain_text || "";
      const yomi = p["よみがな"]?.rich_text?.[0]?.plain_text || "";

      const order = p["管理用"]?.number ?? 9999;

      const x = p["X"]?.url || "";
      const main = p["配信"]?.url || "";
      const sub = p["配信サブ"]?.url || "";

      // ✅ 追加
      const other = p["その他URL"]?.url || "";

      const roles = p["役職"]?.multi_select?.map(r => r.name) || [];

      let image = "";
      const file = p["画像"]?.files?.[0];
      if (file) {
        image = file.type === "external" ? file.external.url : file.file.url;
      }

      return { name, yomi, order, x, main, sub, other, roles, image };
    });

    // 🔽 並び替え
    members.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.yomi.localeCompare(b.yomi, "ja");
    });

    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, sans-serif;
  background: #fafafa;
}

h1 {
  margin-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  padding: 16px;
  text-align: center;
}

.avatar {
  width: 100%;
  border-radius: 12px;
}

.name {
  font-weight: bold;
  margin-top: 10px;
}

.yomi {
  font-size: 12px;
  color: #666;
}

.roles {
  margin: 8px 0;
}

.role {
  display: inline-block;
  background: #eee;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  margin: 2px;
}

.links {
  margin-top: 10px;
}

/* アイコン */
.icon img {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  transition: transform 0.15s ease;
}

.icon:hover img {
  transform: scale(1.15);
}

/* その他URL */
.other {
  margin-top: 8px;
  font-size: 12px;
  word-break: break-all;
}

.other a {
  color: #555;
  text-decoration: underline;
}
</style>
</head>

<body>

<h1>メンバー一覧</h1>

<div class="grid">
${members.map(m => `
<div class="card">
  ${m.image ? `<img class="avatar" src="${m.image}">` : ""}

  <div class="name">${escapeHtml(m.name)}</div>
  <div class="yomi">${escapeHtml(m.yomi)}</div>

  <div class="roles">
    ${m.roles.map(r => `<span class="role">${escapeHtml(r)}</span>`).join("")}
  </div>

  <div class="links">
    ${m.x ? `<a class="icon" href="${m.x}" target="_blank">${getXIcon()}</a>` : ""}
    ${m.main ? `<a class="icon" href="${m.main}" target="_blank">${getPlatformIcon(m.main)}</a>` : ""}
    ${m.sub ? `<a class="icon" href="${m.sub}" target="_blank">${getPlatformIcon(m.sub)}</a>` : ""}
  </div>

  ${m.other ? `
    <div class="other">
      <a href="${m.other}" target="_blank">${escapeHtml(m.other)}</a>
    </div>
  ` : ""}
</div>
`).join("")}
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
