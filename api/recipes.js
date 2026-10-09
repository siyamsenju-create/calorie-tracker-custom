import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function(req,res) {
 const uid=req.user.id;
 try {
  if(req.method==="DELETE") {
   const recipeId=String((req.body||{}).id||"");
   if(!UUID.test(recipeId)) return res.status(400).json({error:"A valid recipe id is required."});
   const found=await db.query("SELECT food_id FROM recipes WHERE user_id=$1 AND id=$2",[uid,recipeId]);
   if(!found.rows.length) return res.status(404).json({error:"Recipe not found."});
   await db.query("DELETE FROM recipes WHERE user_id=$1 AND id=$2",[uid,recipeId]);
   await db.query("DELETE FROM food_catalog WHERE id=$1 AND user_id=$2",[found.rows[0].food_id,uid]);
   return res.json({ok:true});
  }
  if(req.method==="GET") {
   const id=String(req.query.id||"");
   const q=id?await db.query("SELECT * FROM recipes WHERE user_id=$1 AND id=$2",[uid,id]):await db.query("SELECT * FROM recipes WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[uid]);
   const rows=[];
   for(const recipe of q.rows) {
    const ing=await db.query("SELECT food_id,food_name,quantity,grams,calories,protein,carbs,fat,fiber FROM recipe_ingredients WHERE recipe_id=$1 AND user_id=$2 ORDER BY id",[recipe.id,uid]);
    rows.push({...recipe,ingredients:ing.rows});
   }
   return res.json({recipes:rows});
  }
  const b=req.body||{}, name=String(b.name||"").trim().slice(0,100), servings=Number(b.servings), items=Array.isArray(b.ingredients)?b.ingredients:[];
  if(!name||!Number.isFinite(servings)||servings<=0||servings>100||items.length<1||items.length>30) return res.status(400).json({error:"A recipe needs a name, 1–100 servings, and 1–30 ingredients."});
  const normalized=[];
  for(const item of items) {
   const id=String(item.food_id||""), quantity=Number(item.quantity);
   if(!UUID.test(id)||!Number.isFinite(quantity)||quantity<=0||quantity>100) return res.status(400).json({error:"Each ingredient needs a valid catalogue food and quantity above zero."});
   normalized.push({id,quantity});
  }
  const ids=[...new Set(normalized.map(i=>i.id))];
  const found=await db.query("SELECT * FROM food_catalog WHERE id=ANY($1::uuid[]) AND (user_id IS NULL OR user_id=$2)",[ids,uid]);
  const byId=new Map(found.rows.map(f=>[f.id,f]));
  if(ids.some(id=>!byId.has(id))) return res.status(400).json({error:"One or more ingredients are unavailable in your food catalogue."});
  let totalGrams=0,totalCalories=0,totalProtein=0,totalCarbs=0,totalFat=0,totalFiber=0;
  const ingredients=normalized.map(i=>{const f=byId.get(i.id),g=Number(f.serving_grams)*i.quantity,c=Number(f.calories)*i.quantity,p=Number(f.protein)*i.quantity,cb=Number(f.carbs)*i.quantity,ft=Number(f.fat)*i.quantity,fi=Number(f.fiber)*i.quantity;totalGrams+=g;totalCalories+=c;totalProtein+=p;totalCarbs+=cb;totalFat+=ft;totalFiber+=fi;return {id:f.id,name:f.name,quantity:i.quantity,grams:g,calories:c,protein:p,carbs:cb,fat:ft,fiber:fi};});
  const recipeId=crypto.randomUUID(), foodId=crypto.randomUUID(), perServing={grams:totalGrams/servings,calories:totalCalories/servings,protein:totalProtein/servings,carbs:totalCarbs/servings,fat:totalFat/servings,fiber:totalFiber/servings};
  const statements=[
   {sql:"INSERT INTO recipes (id,user_id,name,servings,serving_grams,calories,protein,carbs,fat,fiber,food_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",params:[recipeId,uid,name,servings,perServing.grams,perServing.calories,perServing.protein,perServing.carbs,perServing.fat,perServing.fiber,foodId]},
   {sql:"INSERT INTO food_catalog (id,user_id,name,aliases,region,category,diet,meal_types,serving_label,serving_grams,calories,protein,carbs,fat,fiber,source_note,estimate,recipe_id) VALUES ($1,$2,$3,ARRAY[]::text[],'Custom','Custom','vegetarian',ARRAY['Breakfast','Lunch','Dinner','Snacks'],$4,$5,$6,$7,$8,$9,$10,$11,TRUE,$12)",params:[foodId,uid,name, "1 serving of "+name,perServing.grams,perServing.calories,perServing.protein,perServing.carbs,perServing.fat,perServing.fiber,"Recipe estimate from ingredients; omitted oil, ghee or recipe details change nutrition",recipeId]}
  ];
  for(const ing of ingredients) statements.push({sql:"INSERT INTO recipe_ingredients (recipe_id,food_id,food_name,quantity,grams,calories,protein,carbs,fat,fiber,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",params:[recipeId,ing.id,ing.name,ing.quantity,ing.grams,ing.calories,ing.protein,ing.carbs,ing.fat,ing.fiber,uid]});
  await db.transaction(statements);
  return res.status(201).json({recipe:{id:recipeId,name,servings,serving_grams:perServing.grams,calories:perServing.calories,protein:perServing.protein,carbs:perServing.carbs,fat:perServing.fat,fiber:perServing.fiber,food_id:foodId,ingredients},food:{id:foodId,name,region:"Custom",category:"Custom",diet:"vegetarian",serving_label:"1 serving of "+name,serving_grams:perServing.grams,calories:perServing.calories,protein:perServing.protein,carbs:perServing.carbs,fat:perServing.fat,fiber:perServing.fiber,source_note:"Recipe estimate from ingredients",estimate:true}});
 } catch(e) { console.error("recipes",e); res.status(500).json({error:"Could not save the recipe."}); }
}