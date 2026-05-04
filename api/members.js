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

// 配信プラットフォームアイコン（←ここだけ修正）
function getPlatformIcon(url) {
  if (!url) return "";

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `
    <svg class="icon-svg youtube" viewBox="0 0 24 24">
      <path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.5v-7l6 3.5-6 3.5z"/>
    </svg>`;
  }

  // Twitch
  if (url.includes("twitch.tv")) {
    return `
    <svg class="icon-svg twitch" viewBox="0 0 24 24">
      <path fill="currentColor" d="M4 2L2 6v14h5v4l4-4h3l6-6V2H4zm14 11l-3 3h-4l-3 3v-3H4V4h14v9z"/>
      <path fill="currentColor" d="M15 7h-2v5h2V7zm-4 0H9v5h2V7z"/>
    </svg>`;
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    return `
    <svg class="icon-svg tiktok" viewBox="0 0 24 24">
      <path fill="currentColor" d="M16.5 3c.3 1.7 1.6 3 3.3 3.3v3.2c-1.3 0-2.6-.4-3.8-1.2v6.2c0 3.1-2.5 5.5-5.5 5.5S5 17.6 5 14.5 7.5 9 10.5 9c.3 0 .7 0 1 .1v3.3c-.3-.1-.6-.2-1-.2-1.4 0-2.5 1.1-2.5 2.5S9.1 17 10.5 17s2.5-1.1 2.5-2.5V3h3.5z"/>
    </svg>`;
  }

  // fallback
  return `
  <svg class="icon-svg link" viewBox="0 0 24 24">
    <path fill="currentColor" d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"/>
    <path fill="currentColor" d="M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"/>
  </svg>`;
}

    // Xアイコン
    function getXIcon() {
      return `
      <svg class="icon-svg x" viewBox="0 0 24 24">
          <path fill="currentColor" class="st0" d="M714.16,519.28L1160.89,0h-105.86l-387.89,450.89L357.33,0H0l468.49,681.82L0,1226.37h105.87l409.63-476.15,327.18,476.15h357.33l-485.86-707.09h.03ZM569.16,687.83l-47.47-67.89L144.01,79.69h162.6l304.8,435.99,47.47,67.89,396.2,566.72h-162.6l-323.31-462.45v-.03Z"/>
      </svg>
      `;
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
  --icon-size: 20px; /* ←ここを変えれば全部変わる */
}

body {
  margin: 0;
  padding: 24px;
  font-family: "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
  font-weight: 700;
}

.yomi {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.links {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 24px;
  padding: 0px 0px 0px -3px;
}

.role {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  padding: 1px 10px 3px 10px;
  border-radius: 999px;
  font-size: 11px;
}

/* アイコン */
/* 共通 */
.icon-svg {
  fill: #00ff00
}

/* 個別 */
.icon-svg.x {
  height: 15pt;
}

.icon-svg.youtube {
  height: 12pt;
}

.icon-svg.twitch {
  height: 18pt;
}

.icon-svg.tiktok {
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
