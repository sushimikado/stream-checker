export default async function handler(req, res) {
  return res.status(200).json({
    token: process.env.NOTION_TOKEN
  });
}
