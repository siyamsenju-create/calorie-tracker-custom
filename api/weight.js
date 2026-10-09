import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export default async function(req,res) {
 const uid=req.user.id;
 try {
  if(req.method==="DELETE") { const id=String((req.body||{}).id||""); const q=await db.query("DELETE FROM weight_logs WHERE id=$1 AND user_id=$2 RETURNING id",[id,uid]); return q.rowCount?res.json({ok:true}):res.status(404).json({error:"Weight entry not found."}); }
  if(req.method==="GET") { const q=await db.query("SELECT id,weight_kg,log_date,logged_at FROM weight_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 180",[uid]); return res.json({entries:q.rows}); }
  const b=req.body||{}, weight=Number(b.weight_kg), date=DATE_RE.test(String(b.log_date||""))?String(b.log_date):new Date().toISOString().slice(0,10);
  if(!Number.isFinite(weight)||weight<20||weight>=500) return res.status(400).json({error:"Enter a weight from 20 to 499 kg."});
  const q=await db.query("INSERT INTO weight_logs (user_id,weight_kg,log_date) VALUES ($1,$2,$3) RETURNING *",[uid,weight,date]);
  await db.query("UPDATE profiles SET weight_kg=$2,updated_at=now() WHERE user_id=$1",[uid,weight]);
  return res.status(201).json({entry:q.rows[0]});
 } catch(e) { console.error("weight",e); res.status(500).json({error:"Could not save weight entry."}); }
}