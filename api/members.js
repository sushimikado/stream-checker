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

    // URL表示用（https削除）
    function formatUrl(url) {
      if (!url) return "";
      return url.replace(/^https?:\/\//, "");
    }

    // 配信プラットフォームアイコン
    function getPlatformIcon(url) {
      if (!url) return "";

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return `<img class="icon-img youtube" src="/icons/youtube.svg">`;
      }
      if (url.includes("twitch.tv")) {
        return `<img class="icon-img twitch" src="/icons/twitch.svg">`;
      }
      if (url.includes("tiktok.com")) {
        return `<img class="icon-img tiktok" src="/icons/tiktok.svg">`;
      }

      return `<img class="icon-img link" src="/icons/link.svg">`;
    }

    // Xアイコン
    function getXIcon() {
      return `<img class="icon-img x" src="/icons/x.svg">`;
    }

    // 役職色
    function getRoleStyle(color) {
      const map = {
        default: "#999",
        gray: "#9e9e9e",
        brown: "#8d6e63",
        orange: "#fb8c00",
        yellow: "#fbc02d",
        green: "#43a047",
        blue: "#1e88e5",
        purple: "#8e24aa",
        pink: "#d81b60",
        red: "#e53935"
      };

      const bg = map[color] || "#999";

      return `
        background: ${bg};
        color: white;
      `;
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
      const other = p["その他URL"]?.url || "";

      const roles = p["役職"]?.multi_select?.map(r => ({
        name: r.name,
        color: r.color
      })) || [];

      let image = "";
      const file = p["画像"]?.files?.[0];
      if (file) {
        image = file.type === "external" ? file.external.url : file.file.url;
      }

      return { name, yomi, order, x, main, sub, other, roles, image };
    });

    members.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.yomi.localeCompare(b.yomi, "ja");
    });

    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
:root {
  --icon-size: 20px; /* ←ここを変えれば全部変わる */
}

body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, sans-serif;
  background: rgba(0,0,0,0);
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

/* 画像ラッパー（3:2固定） */
.image-wrap {
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}

/* 画像トリミング */
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-bottom {
  padding: 12px 16px;
  text-align: left;
}

.name {
  font-weight: bold;
}

.yomi {
  font-size: 12px;
  color: #666;
}

.links {
  margin-top: 10px;
  margin-bottom: 10px;
}

.role {
  display: inline-block;
  padding: 1px 8px 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  margin: -2px 4px 0px 0px;
  color: white;
}

/* アイコン */
/* 共通 */
.icon-img {
  vertical-align: middle;
  transition: transform 0.15s ease;
}

/* 個別サイズ */
.icon-img.x {
  fill: #523f31;
  margin: 0px 3px 0px 0px;
  height: 15pt;
}

.icon-img.youtube {
  fill: #523f31;
  margin: 0px 3px 0px 0px;
  height: 12pt;
}

.icon-img.twitch {
  fill: #523f31;
  margin: 0px 3px 0px 0px;
  height: 18pt;
}

.icon-img.tiktok {
  fill: #523f31;
  margin: 0px 3px 0px 0px;
  height: 18pt;
}

/* hover */
.icon:hover .icon-img {
  transform: scale(1.20);
}

/* その他URL */
.other {
  margin-bottom: 10px;
  font-size: 12px;
  word-break: break-word;
  overflow-wrap: anywhere;
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
  ${m.image ? `
  <div class="image-wrap">
    <img class="avatar" src="${m.image}">
  </div>` : ""}

  <div class="card-bottom">
    <div class="name">${escapeHtml(m.name)}</div>
    <div class="yomi">${escapeHtml(m.yomi)}</div>
    
    <div class="links">
      ${m.x ? `<a class="icon" href="${m.x}" target="_blank">${getXIcon()}</a>` : ""}
      ${m.main ? `<a class="icon" href="${m.main}" target="_blank">${getPlatformIcon(m.main)}</a>` : ""}
      ${m.sub ? `<a class="icon" href="${m.sub}" target="_blank">${getPlatformIcon(m.sub)}</a>` : ""}
    </div>

    ${m.other ? `
      <div class="other">
        <a href="${m.other}" target="_blank">${escapeHtml(formatUrl(m.other))}</a>
      </div>
    ` : ""}
    
    <div class="roles">
     ${m.roles.map(r => `
      <span class="role" style="${getRoleStyle(r.color)}">
        ${escapeHtml(r.name)}
      </span>
    `).join("")}
    </div>
  </div>
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
