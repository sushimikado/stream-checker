
// =========================
// YouTube配信一覧
// =========================

fetch('/api/live')
  .then(res => {
    if (!res.ok) {
      throw new Error('YouTube配信情報の取得に失敗しました');
    }
    return res.text();
  })
  .then(html => {

    const liveElement = document.getElementById('live');

    liveElement.innerHTML = html;


    // =========================
    // Twitch配信一覧
    // =========================

    return fetch('/api/twitch-stream-checker')
      .then(res => {
        if (!res.ok) {
          throw new Error('Twitch配信情報の取得に失敗しました');
        }
        return res.json();
      })
      .then(data => {

        const liveStreams = data.live || [];

        liveStreams.forEach(stream => {

          // カード
          const card = document.createElement('div');
          card.className = 'twitch-card';


          // サムネイル
          const thumbnail = document.createElement('img');
          thumbnail.className = 'twitch-card-thumbnail';
          thumbnail.src = stream.thumbnailUrl;
          thumbnail.alt = stream.title || 'Twitch配信';
          thumbnail.loading = 'lazy';


          // 情報エリア
          const info = document.createElement('div');
          info.className = 'twitch-card-info';


          // 配信者名
          const name = document.createElement('div');
          name.className = 'twitch-card-name';
          name.textContent = stream.name;


          // 配信タイトル
          const title = document.createElement('div');
          title.className = 'twitch-card-title';
          title.textContent = stream.title;


          // ゲーム名
          const game = document.createElement('div');
          game.className = 'twitch-card-game';
          game.textContent = stream.gameName;


          // 視聴者数
          const viewers = document.createElement('div');
          viewers.className = 'twitch-card-viewers';
          viewers.textContent =
            Number(stream.viewerCount).toLocaleString() + '人が視聴中';


          // 情報をまとめる
          info.appendChild(name);
          info.appendChild(title);
          info.appendChild(game);
          info.appendChild(viewers);


          // カードをクリックするとTwitchを開く
          const link = document.createElement('a');
          link.className = 'twitch-card-link';
          link.href = stream.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';


          link.appendChild(thumbnail);
          link.appendChild(info);

          card.appendChild(link);

          liveElement.appendChild(card);

        });

      });

  })
  .catch(error => {
    console.error('配信一覧取得エラー:', error);
  });


// =========================
// メンバー一覧
// =========================

fetch('/api/members')
  .then(res => res.text())
  .then(html => {
    document.getElementById('members').innerHTML = html;
  });
