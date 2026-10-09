import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export default async function(req,res) {
 const uid=req.user.id;
 try {
  if(req.method==="GET") { const date=DATE_RE.test(String(req.query.date||""))?String(req.query.date):new Date().toISOString().slice(0,10); const q=await db.query("SELECT * FROM activity_logs WHERE user_id=$1 AND log_date=$2 ORDER BY created_at DESC",[uid,date]); return res.json({activities:q.rows}); }
  if(req.method==="DELETE") { const q=await db.query("DELETE FROM activity_logs WHERE id=$1 AND user_id=$2 RETURNING id",[String((req.body||{}).id||""),uid]); return q.rowCount?res.json({ok:true}):res.status(404).json({error:"Activity not found."}); }
  const b=req.body||{}, activity=String(b.activity||""), minutes=Number(b.minutes), distance=b.distance_km===""||b.distance_km==null?null:Number(b.distance_km);
  const allowed={Walking:3.5,Running:8.5,Cycling:6.8,"Strength training":5,Gym:5.5,Swimming:7,Yoga:2.8,Sports:7,Other:3.5};
  if(!Object.prototype.hasOwnProperty.call(allowed,activity)||!Number.isInteger(minutes)||minutes<1||minutes>1440||(distance!==null&&(!Number.isFinite(distance)||distance<0||distance>1000))) return res.status(400).json({error:"Choose an activity and enter a valid duration and optional distance."});
  const intensity=String(b.intensity||"moderate");
  if(!["light","moderate","vigorous"].includes(intensity)) return res.status(400).json({error:"Choose a valid intensity."});
  const profile=(await db.query("SELECT weight_kg FROM profiles WHERE user_id=$1",[uid])).rows[0];
  const weight=Number(profile?.weight_kg||70), modifier=intensity==="light"?-1.1:intensity==="vigorous"?2:0;
  const caloriesInput=b.calories;
  const isManual=caloriesInput!==undefined&&caloriesInput!==null&&caloriesInput!=="";
  const calories=isManual?Number(caloriesInput):Math.round(Math.max(1,allowed[activity]+modifier)*3.5*weight/200*minutes);
  if(!Number.isFinite(calories)||calories<0||calories>10000) return res.status(400).json({error:"Enter a valid calorie value."});
  const date=DATE_RE.test(String(b.log_date||""))?String(b.log_date):new Date().toISOString().slice(0,10);
  const method=isManual?"User-entered from a device or exercise machine":"MET-based estimate using profile weight, activity and duration";
  const q=await db.query("INSERT INTO activity_logs (user_id,activity,minutes,distance_km,calories,intensity,source,method,log_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",[uid,activity,minutes,distance,calories,intensity,isManual?"manual":"estimated",method,date]);
  return res.status(201).json({activity:q.rows[0]});
 } catch(e) { console.error("activity",e); res.status(500).json({error:"Could not save activity."}); }
}