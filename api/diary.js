import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT","DELETE"];
function dateOnly(v) { const s=String(v||""); return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:new Date().toISOString().slice(0,10); }
export default async function(req,res) {
  const userId=req.user.id;
  try {
    if(req.method==="GET") {
      const q=await db.query("SELECT * FROM food_logs WHERE user_id=$1 AND log_date=$2 ORDER BY created_at DESC",[userId,dateOnly(req.query.date)]);
      return res.json({entries:q.rows});
    }
    if(req.method==="DELETE") {
      const id=String((req.body||{}).id||"");
      if(!id) return res.status(400).json({error:"Entry id is required."});
      const q=await db.query("DELETE FROM food_logs WHERE id=$1 AND user_id=$2 RETURNING id",[id,userId]);
      return q.rowCount ? res.json({ok:true}) : res.status(404).json({error:"Entry not found."});
    }
    const b=req.body||{}, foodId=String(b.food_id||""), quantity=Number(b.quantity), meal=String(b.meal||"");
    if(!foodId || !Number.isFinite(quantity) || quantity<=0 || quantity>100 || !["Breakfast","Lunch","Dinner","Snacks"].includes(meal)) return res.status(400).json({error:"Choose a food, meal, and quantity above zero."});
    const f=await db.query("SELECT * FROM food_catalog WHERE id=$1 AND (user_id IS NULL OR user_id=$2)",[foodId,userId]);
    if(!f.rows.length) return res.status(404).json({error:"Food not found in your catalogue."});
    const food=f.rows[0], date=dateOnly(b.log_date);
    const values=[userId,food.id,food.name,meal,quantity,Number(food.serving_grams)*quantity,Number(food.calories)*quantity,Number(food.protein)*quantity,Number(food.carbs)*quantity,Number(food.fat)*quantity,Number(food.fiber)*quantity,date];
    if(req.method==="PUT") {
      if(!b.id) return res.status(400).json({error:"Entry id is required."});
      const q=await db.query("UPDATE food_logs SET food_id=$3,food_name=$4,meal=$5,quantity=$6,grams=$7,calories=$8,protein=$9,carbs=$10,fat=$11,fiber=$12,log_date=$13 WHERE user_id=$1 AND id=$2 RETURNING *",[userId,String(b.id),...values.slice(1)]);
      return q.rows.length ? res.json({entry:q.rows[0]}) : res.status(404).json({error:"Entry not found."});
    }
    const q=await db.query("INSERT INTO food_logs (user_id,food_id,food_name,meal,quantity,grams,calories,protein,carbs,fat,fiber,log_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",values);
    res.status(201).json({entry:q.rows[0]});
  } catch(e) { console.error("diary",e); res.status(500).json({error:"Could not save the food entry."}); }
}