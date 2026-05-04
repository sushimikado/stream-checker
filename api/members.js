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
      try {
        const u = new URL(url);
        return u.hostname;
      } catch {
        return url;
      }
    }

    function getPlatformIcon(url) {
      if (!url) return "";

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return `<span>▶</span>`;
      }
      if (url.includes("twitch.tv")) {
        return `<span>🎮</span>`;
      }
      if (url.includes("tiktok.com")) {
        return `<span>🎵</span>`;
      }

      return `<span>🔗</span>`;
    }

    function getXIcon() {
      return `<span>𝕏</span>`;
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

      const roles = p["役職"]?.multi_select || [];

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

    const cards = members.map(m => `
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
        <span class="role">${escapeHtml(r.name)}</span>
      `).join("")}
    </div>
  </div>
</div>
`).join("");

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(cards);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
