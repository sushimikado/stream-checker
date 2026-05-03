const html = `
<html>
<head>
<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 24px;
  background: #0f0f0f;
  color: white;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: #1c1c1c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  transition: transform .2s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.thumb {
  width: 100%;
  display: block;
}

.content {
  padding: 16px;
}

.live {
  display: inline-block;
  background: #ff0000;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}

.title {
  margin: 12px 0;
  font-size: 16px;
  line-height: 1.4;
}

.button {
  display: inline-block;
  background: white;
  color: black;
  padding: 10px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: bold;
}
</style>
</head>
<body>
${
results.length === 0
? "<p>現在配信中の参加者はいません</p>"
: `
<div class="grid">
${results.map(v => `
<div class="card">
  <img class="thumb" src="${v.thumbnail}">
  <div class="content">
    <span class="live">🔴 LIVE</span>
    <div class="title">${v.title}</div>
    <a class="button" href="${v.url}" target="_blank">
      視聴する
    </a>
  </div>
</div>
`).join("")}
</div>
`
}
</body>
</html>
`;
