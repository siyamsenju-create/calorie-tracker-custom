import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function(req,res) {
 const uid=req.user.id, body=req.body||{};
 try {
  if(req.method==="GET") {
   const q=await db.query("SELECT f.id,f.name,f.aliases,f.region,f.category,f.diet,f.meal_types,f.serving_label,f.serving_grams,f.calories,f.protein,f.carbs,f.fat,f.fiber,f.source_note,f.estimate,fav.created_at AS favorited_at FROM favorites fav JOIN food_catalog f ON f.id=fav.food_id WHERE fav.user_id=$1 ORDER BY fav.created_at DESC LIMIT 500",[uid]);
   return res.json({favorites:q.rows});
  }
  const id=String(body.food_id||"");
  if(!UUID.test(id)) return res.status(400).json({error:"Choose a valid food first."});
  if(req.method==="DELETE") {
   const q=await db.query("DELETE FROM favorites WHERE user_id=$1 AND food_id=$2 RETURNING food_id",[uid,id]);
   return q.rowCount?res.json({ok:true}):res.status(404).json({error:"Food was not in your favourites."});
  }
  const food=await db.query("SELECT id FROM food_catalog WHERE id=$1 AND (user_id IS NULL OR user_id=$2)",[id,uid]);
  if(!food.rows.length) return res.status(404).json({error:"Food not found."});
  await db.query("INSERT INTO favorites (user_id,food_id) VALUES ($1,$2) ON CONFLICT (user_id,food_id) DO NOTHING",[uid,id]);
  return res.status(201).json({ok:true});
 } catch(e) { console.error("favorites",e); res.status(500).json({error:"Could not update favourites."}); }
}