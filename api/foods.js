import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST"];
export default async function(req,res) {
  const userId=req.user.id;
  try {
    if(req.method==="POST") {
      const b=req.body||{}, name=String(b.name||"").trim().slice(0,100);
      const calories=Number(b.calories), protein=Number(b.protein||0), carbs=Number(b.carbs||0), fat=Number(b.fat||0), fiber=Number(b.fiber||0), grams=Number(b.serving_grams||100);
      if(!name || ![calories,protein,carbs,fat,fiber,grams].every(Number.isFinite) || calories<0 || protein<0 || carbs<0 || fat<0 || fiber<0 || grams<=0 || [protein,carbs,fat,fiber].some(n=>n>1000) || calories>10000) return res.status(400).json({error:"Enter a food name, positive serving weight, and valid nutrition values."});
      const q=await db.query("INSERT INTO food_catalog (user_id,name,aliases,region,category,diet,meal_types,serving_label,serving_grams,calories,protein,carbs,fat,fiber,source_note,estimate) VALUES ($1,$2,ARRAY[]::text[],$3,$4,$5,ARRAY['Breakfast','Lunch','Dinner','Snacks'],$6,$7,$8,$9,$10,$11,$12,'User-entered nutrition; verify against recipe/label',TRUE) RETURNING *",[userId,name,String(b.region||"Custom").slice(0,40),String(b.category||"Custom").slice(0,40),String(b.diet||"vegetarian"),String(b.serving_label||"1 serving").slice(0,40),grams,calories,protein,carbs,fat,fiber]);
      return res.status(201).json({food:q.rows[0]});
    }
    const term=String(req.query.q||"").trim().slice(0,80), category=String(req.query.category||"").trim().slice(0,40), diet=String(req.query.diet||"").trim().slice(0,24);
    const q=await db.query("SELECT id,name,aliases,region,category,diet,meal_types,serving_label,serving_grams,calories,protein,carbs,fat,fiber,source_note,estimate FROM food_catalog WHERE (user_id IS NULL OR user_id=$1) AND ($2='' OR name ILIKE $3 OR array_to_string(aliases,' ') ILIKE $3 OR region ILIKE $3) AND ($4='' OR category=$4 OR region=$4) AND ($5='' OR diet=$5) ORDER BY CASE WHEN name ILIKE $3 THEN 0 ELSE 1 END,name LIMIT 100",[userId,term,"%"+term+"%",category,diet]);
    res.json({foods:q.rows});
  } catch(e) { console.error("foods",e); res.status(500).json({error:"Food catalogue request failed."}); }
}