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

    function formatUrl(url) {
      if (!url) return "";
      return url.replace(/^https?:\/\//, "");
    }

    // ✅ SVGアイコン（完全制御版）
    function getPlatformIcon(url) {
      if (!url) return "";

      if (url.includes("youtube")) {
        return {
          type: "youtube",
          svg: `<svg class="icon-svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M23.5 6.2s-.2-1.7-.9-2.5c-.9-1-1.9-1-2.4-1.1C16.8 2.2 12 2.2 12 2.2s-4.8 0-8.2.4c-.5.1-1.5.1-2.4 1.1C.7 4.5.5 6.2.5 6.2S0 8.2 0 10.2v1.6c0 2 .5 4 .5 4s.2 1.7.9 2.5c.9 1 2.1 1 2.6 1.1 1.9.2 8 .4 8 .4s4.8 0 8.2-.4c.5-.1 1.5-.1 2.4-1.1.7-.8.9-2.5.9-2.5s.5-2 .5-4v-1.6c0-2-.5-4-.5-4zM9.5 14.5v-7l6.5 3.5-6.5 3.5z"/>
          </svg>`
        };
      }

      if (url.includes("twitch")) {
        return {
          type: "twitch",
          svg: `<svg class="icon-svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4.3 0L0 4.3v15.4h5.1V24l4.3-4.3h3.4L19.7 13V0H4.3zm13.7 12.6l-3.4 3.4h-3.4l-3.4 3.4v-3.4H3.4V1.7h14.6v10.9z"/>
          </svg>`
        };
      }

      if (url.includes("tiktok")) {
        return {
          type: "tiktok",
          svg: `<svg class="icon-svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21 8.6a7.5 7.5 0 01-4.4-1.4v6.3a5.5 5.5 0 11-5.5-5.5c.4 0 .8 0 1.2.1v3a2.5 2.5 0 102.5 2.5V0h3a4.5 4.5 0 004.2 4.5v4.1z"/>
          </svg>`
        };
      }

      return {
        type: "link",
        svg: `<svg class="icon-svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M3.9 12a5 5 0 017.1 0l1.4 1.4-1.4 1.4L9.6 13.4a3 3 0 10-4.2 4.2l1.4 1.4a3 3 0 004.2 0l1.4-1.4 1.4 1.4-1.4 1.4a5 5 0 01-7.1 0l-1.4-1.4a5 5 0 010-7.1z"/>
        </svg>`
      };
    }

    function getXIcon() {
      return `<svg class="icon-svg" viewBox="0 0 24 24">
        <path fill="currentColor" d="M18 2h3l-7 8 8 12h-6l-5-7-6 7H2l8-9L2 2h6l5 6 5-6z"/>
      </svg>`;
    }

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
      return `background:${map[color] || "#999"};color:white;`;
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

      return {
        name: p["名前"]?.title?.[0]?.plain_text || "",
        yomi: p["よみがな"]?.rich_text?.[0]?.plain_text || "",
        order: p["管理用"]?.number ?? 9999,
        x: p["X"]?.url || "",
        main: p["配信"]?.url || "",
        sub: p["配信サブ"]?.url || "",
        other: p["その他URL"]?.url || "",
        roles: p["役職"]?.multi_select?.map(r => ({
          name: r.name,
          color: r.color
        })) || [],
        image: p["画像"]?.files?.[0]
          ? (p["画像"].files[0].type === "external"
              ? p["画像"].files[0].external.url
              : p["画像"].files[0].file.url)
          : ""
      };
    });

    members.sort((a, b) => a.order - b.order || a.yomi.localeCompare(b.yomi, "ja"));

    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">

<style>
body {
  margin:0;
  padding:24px;
  font-family:"Noto Sans JP",sans-serif;
  background:transparent;
}

.grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:20px;
}

.card {
  background:white;
  border-radius:8px;
  overflow:hidden;
  box-shadow:0 6px 18px rgba(0,0,0,0.08);
}

.image-wrap {
  aspect-ratio:3/2;
  overflow:hidden;
}

.avatar {
  width:100%;
  height:100%;
  object-fit:cover;
}

.card-bottom {
  padding:12px 16px;
}

.links {
  display:flex;
  gap:8px;
  margin:10px 0;
}

.icon {
  display:inline-flex;
  align-items:center;
  color:#666;
}

/* サイズ個別 */
.icon.youtube .icon-svg { height:14px; }
.icon.twitch  .icon-svg { height:18px; }
.icon.tiktok  .icon-svg { height:18px; }
.icon.x       .icon-svg { height:14px; }

/* hover */
.icon:hover { color:#000; }
.icon:hover .icon-svg { transform:scale(1.15); }

.roles {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
}

.role {
  font-size:11px;
  padding:2px 10px;
  border-radius:999px;
}
</style>
</head>

<body>

<div class="grid">
${members.map(m => {
  const main = getPlatformIcon(m.main);
  const sub = getPlatformIcon(m.sub);

  return `
<div class="card">
  ${m.image ? `<div class="image-wrap"><img class="avatar" src="${m.image}"></div>` : ""}

  <div class="card-bottom">
    <div>${escapeHtml(m.name)}</div>
    <div style="font-size:12px;color:#666">${escapeHtml(m.yomi)}</div>

    <div class="links">
      ${m.x ? `<a class="icon x" href="${m.x}" target="_blank">${getXIcon()}</a>` : ""}
      ${m.main ? `<a class="icon ${main.type}" href="${m.main}" target="_blank">${main.svg}</a>` : ""}
      ${m.sub ? `<a class="icon ${sub.type}" href="${m.sub}" target="_blank">${sub.svg}</a>` : ""}
    </div>

    ${m.other ? `<div style="font-size:12px"><a href="${m.other}" target="_blank">${escapeHtml(formatUrl(m.other))}</a></div>` : ""}

    <div class="roles">
      ${m.roles.map(r => `<span class="role" style="${getRoleStyle(r.color)}">${escapeHtml(r.name)}</span>`).join("")}
    </div>
  </div>
</div>`;
}).join("")}
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
