import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export default async function(req,res) {
 const uid=req.user.id;
 try {
  const date=DATE_RE.test(String((req.query||{}).date||(req.body||{}).log_date||""))?String((req.query||{}).date||(req.body||{}).log_date):new Date().toISOString().slice(0,10);
  if(req.method==="GET") { const q=await db.query("SELECT * FROM water_logs WHERE user_id=$1 AND log_date=$2 ORDER BY created_at DESC",[uid,date]); const total=q.rows.reduce((s,r)=>s+Number(r.amount_ml),0); return res.json({entries:q.rows,totalMl:total}); }
  if(req.method==="DELETE") { const id=String((req.body||{}).id||""); const q=await db.query("DELETE FROM water_logs WHERE id=$1 AND user_id=$2 RETURNING id",[id,uid]); return q.rowCount?res.json({ok:true}):res.status(404).json({error:"Water entry not found."}); }
  const amount=Number((req.body||{}).amount_ml);
  if(!Number.isInteger(amount)||amount<1||amount>5000) return res.status(400).json({error:"Water amount must be between 1 and 5000 ml."});
  const q=await db.query("INSERT INTO water_logs (user_id,amount_ml,log_date) VALUES ($1,$2,$3) RETURNING *",[uid,amount,date]);
  return res.status(201).json({entry:q.rows[0]});
 } catch(e) { console.error("water",e); res.status(500).json({error:"Could not save water intake."}); }
}