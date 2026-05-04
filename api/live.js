const cards = results.map(v => {
  const title = escapeHtml(v.title);

  return `
<a class="card-link" href="${v.url}" target="_blank">
  <div class="card">
    <img class="thumb" src="${v.thumbnail}">
    <div class="content">
      <span class="live-badge">LIVE</span>
      <div class="title">${title}</div>
    </div>
  </div>
</a>
`;
}).join("");

const html = `
<div class="wrapper">
${
results.length === 0
? `<p class="empty">現在配信中の参加者はいません</p>`
: `<div class="grid">${cards}</div>`
}
</div>
`;
