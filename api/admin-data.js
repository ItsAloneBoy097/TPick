import { db } from "hatchable";

export const access = "admin";
export const methods = ["GET", "POST", "PUT", "DELETE"];

export default async function (req, res) {
  const body = req.body || {};
  const table = body.table || req.query?.table;
  const id = body.id || req.query?.id;

  if (!["portfolio_items", "clients", "page_views"].includes(table)) {
    return res.status(400).json({ error: "Invalid table" });
  }

  if (req.method === "GET") {
    if (table === "portfolio_items") {
      const { rows } = await db.query("SELECT * FROM portfolio_items ORDER BY position ASC");
      return res.json(rows);
    }
    if (table === "clients") {
      const { rows } = await db.query("SELECT * FROM clients ORDER BY position ASC");
      return res.json(rows);
    }
    const { rows } = await db.query("SELECT id, created_at, session_id, is_mobile, screen_width, screen_height, country FROM page_views ORDER BY created_at ASC");
    return res.json(rows);
  }

  if (table === "portfolio_items") {
    if (req.method === "POST") {
      const { title="New Thumbnail", views="0 views", creator="Used by", img="", is_featured=false, position=0 } = body;
      const { rows } = await db.query("INSERT INTO portfolio_items (title, views, creator, img, is_featured, position) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [title,views,creator,img,is_featured,position]);
      return res.json(rows[0]);
    }
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (req.method === "PUT") {
      const { title, views, creator, img, is_featured, position } = body;
      await db.query("UPDATE portfolio_items SET title=$1, views=$2, creator=$3, img=$4, is_featured=$5, position=$6 WHERE id=$7", [title,views,creator,img,is_featured,position,id]);
      return res.json({ ok: true });
    }
    await db.query("DELETE FROM portfolio_items WHERE id=$1", [id]);
    return res.json({ ok: true });
  }

  if (table === "clients") {
    if (req.method === "POST") {
      const { name="New Client", handle="", subscribers="0", img="", link="", position=0 } = body;
      const { rows } = await db.query("INSERT INTO clients (name, handle, subscribers, img, link, position) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [name,handle,subscribers,img,link,position]);
      return res.json(rows[0]);
    }
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (req.method === "PUT") {
      const { name, handle, subscribers, img, link, position } = body;
      await db.query("UPDATE clients SET name=$1, handle=$2, subscribers=$3, img=$4, link=$5, position=$6 WHERE id=$7", [name,handle,subscribers,img,link,position,id]);
      return res.json({ ok: true });
    }
    await db.query("DELETE FROM clients WHERE id=$1", [id]);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not supported" });
}