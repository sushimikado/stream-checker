export default async function handler(req, res) {

  try {

    // =========================
    // 環境変数
    // =========================

    const NOTION_TOKEN =
      process.env.NOTION_TOKEN;

    const NOTION_MEMBERS_DATABASE_ID =
      process.env.NOTION_MEMBERS_DATABASE_ID;

    const TWITCH_CLIENT_ID =
      process.env.TWITCH_CLIENT_ID;

    const TWITCH_CLIENT_SECRET =
      process.env.TWITCH_CLIENT_SECRET;


    // =========================
    // 環境変数チェック
    // =========================

    if (!NOTION_TOKEN) {
      throw new Error(
        "NOTION_TOKEN が設定されていません"
      );
    }

    if (!NOTION_MEMBERS_DATABASE_ID) {
      throw new Error(
        "NOTION_MEMBERS_DATABASE_ID が設定されていません"
      );
    }

    if (!TWITCH_CLIENT_ID) {
      throw new Error(
        "TWITCH_CLIENT_ID が設定されていません"
      );
    }

    if (!TWITCH_CLIENT_SECRET) {
      throw new Error(
        "TWITCH_CLIENT_SECRET が設定されていません"
      );
    }


    // =========================
    // Notionからメンバー取得
    // =========================

// =========================
// NotionデータソースID取得
// =========================

const databaseRes = await fetch(
  `https://api.notion.com/v1/databases/${NOTION_MEMBERS_DATABASE_ID}`,
  {
    method: "GET",

    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2025-09-03"
    }
  }
);

if (!databaseRes.ok) {
  const errorText = await databaseRes.text();

  throw new Error(
    `Notion Database API エラー: ${databaseRes.status} ${errorText}`
  );
}

const databaseData = await databaseRes.json();

const dataSourceId = databaseData.data_sources?.[0]?.id;

if (!dataSourceId) {
  throw new Error("NotionのデータソースIDを取得できませんでした");
}

const notionRes = await fetch(
  `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03"
    },
    body: JSON.stringify({})
  }
);

if (!notionRes.ok) {
  const errorText = await notionRes.text();
  throw new Error(`Notionデータソース取得エラー: ${notionRes.status} ${errorText}`);
}

const notionData = await notionRes.json();

if (!dataSourceId) {
  throw new Error(
    "NotionのデータソースIDを取得できませんでした"
  );
}


// =========================
// Notionメンバー取得
// =========================

const notionRes = await fetch(
  `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
  {
    method: "POST",

    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03"
    }
  }
);

if (!notionRes.ok) {
  const errorText = await notionRes.text();

  throw new Error(
    `Notion Query API エラー: ${notionRes.status} ${errorText}`
  );
}

const notionData = await notionRes.json();

    // =========================
    // TwitchIDを取得
    // =========================

    const members =
      notionData.results
        .map(page => {

          const p =
            page.properties;

          const name =
            (p["名前"]?.title || [])
              .map(t =>
                t.plain_text || ""
              )
              .join("")
              .trim();


          const twitchId =
            p["TwitchID"]?.rich_text?.[0]?.plain_text
              ?.trim()
              .toLowerCase() || "";


          return {
            name,
            twitchId
          };

        })
        .filter(member =>
          member.twitchId
        );


    // =========================
    // TwitchIDがない場合
    // =========================

    if (members.length === 0) {

      res.setHeader(
        "Content-Type",
        "application/json"
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      return res.status(200).json({
        live: []
      });

    }


    // =========================
    // Twitch App Access Token
    // =========================

    const tokenRes =
      await fetch(
        "https://id.twitch.tv/oauth2/token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },

          body:
            new URLSearchParams({

              client_id:
                TWITCH_CLIENT_ID,

              client_secret:
                TWITCH_CLIENT_SECRET,

              grant_type:
                "client_credentials"

            })
        }
      );


    if (!tokenRes.ok) {

      const errorText =
        await tokenRes.text();

      throw new Error(
        `Twitch Token API エラー: ${tokenRes.status} ${errorText}`
      );

    }


    const tokenData =
      await tokenRes.json();


    const accessToken =
      tokenData.access_token;


    // =========================
    // Twitch配信状況取得
    // =========================

    const params =
      new URLSearchParams();


    members.forEach(member => {

      params.append(
        "user_login",
        member.twitchId
      );

    });


    const streamRes =
      await fetch(
        `https://api.twitch.tv/helix/streams?${params.toString()}`,
        {
          method: "GET",

          headers: {

            "Authorization":
              `Bearer ${accessToken}`,

            "Client-Id":
              TWITCH_CLIENT_ID

          }
        }
      );


    if (!streamRes.ok) {

      const errorText =
        await streamRes.text();

      throw new Error(
        `Twitch Streams API エラー: ${streamRes.status} ${errorText}`
      );

    }


    const streamData =
      await streamRes.json();


    // =========================
    // Notion情報とTwitch情報を結合
    // =========================

    const live =
      (streamData.data || [])
        .map(stream => {

          const member =
            members.find(
              m =>
                m.twitchId ===
                stream.user_login
            );


          return {

            twitchId:
              stream.user_login,

            name:
              member?.name ||
              stream.user_name,

            title:
              stream.title,

            gameName:
              stream.game_name,

            viewerCount:
              stream.viewer_count,

            startedAt:
              stream.started_at,

            thumbnailUrl:
              stream.thumbnail_url
                .replace(
                  "{width}",
                  "640"
                )
                .replace(
                  "{height}",
                  "360"
                ),

            url:
              `https://www.twitch.tv/${stream.user_login}`

          };

        });


    // =========================
    // JSON返却
    // =========================

    res.setHeader(
      "Content-Type",
      "application/json"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );


    return res.status(200).json({
      live
    });


  } catch (e) {

    console.error(
      "Twitch Stream Checker Error:",
      e
    );


    return res.status(500).json({

      error:
        e.message ||
        "Twitch配信情報の取得に失敗しました"

    });

  }

}
