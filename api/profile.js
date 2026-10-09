import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
export default async function(req,res) {
 const uid=req.user.id;
 try {
  await db.query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",[uid]);
  if(req.method==="GET") { const q=await db.query("SELECT * FROM profiles WHERE user_id=$1",[uid]); return res.json({profile:q.rows[0]}); }
  const old=(await db.query("SELECT * FROM profiles WHERE user_id=$1",[uid])).rows[0], b=req.body||{};
  const pick=(key, fallback)=>Object.prototype.hasOwnProperty.call(b,key)?b[key]:fallback;
  const numberOrNull=(v)=>v===null||v===""||v===undefined?null:Number(v);
  const age=numberOrNull(pick("age",old.age)), height=numberOrNull(pick("height_cm",old.height_cm)), weight=numberOrNull(pick("weight_kg",old.weight_kg)), goalWeight=numberOrNull(pick("goal_weight_kg",old.goal_weight_kg));
  const goal=Number(pick("daily_calorie_goal",old.daily_calorie_goal)), protein=Number(pick("protein_goal",old.protein_goal)), carbs=Number(pick("carbs_goal",old.carbs_goal)), fat=Number(pick("fat_goal",old.fat_goal)), water=Number(pick("water_goal_ml",old.water_goal_ml)), factor=Number(pick("activity_factor",old.activity_factor));
  const sex=String(pick("sex",old.sex)||"unspecified"), name=String(pick("display_name",old.display_name)||"Friend").trim().slice(0,80);
  if(!name||![goal,protein,carbs,fat,water,factor].every(Number.isFinite)||goal<500||goal>10000||protein<0||carbs<0||fat<0||water<250||water>10000||factor<1.1||factor>2.2||![null,age].every(v=>v===null||(Number.isFinite(v)&&v>=13&&v<=110))||![null,height].every(v=>v===null||(Number.isFinite(v)&&v>=80&&v<=250))||![null,weight,goalWeight].every(v=>v===null||(Number.isFinite(v)&&v>0&&v<500))||!["male","female","unspecified"].includes(sex)) return res.status(400).json({error:"Please check your profile measurements and daily goals."});
  const q=await db.query("UPDATE profiles SET display_name=$2,daily_calorie_goal=$3,protein_goal=$4,carbs_goal=$5,fat_goal=$6,water_goal_ml=$7,weight_kg=$8,goal_weight_kg=$9,age=$10,sex=$11,height_cm=$12,activity_factor=$13,updated_at=now() WHERE user_id=$1 RETURNING *",[uid,name,goal,protein,carbs,fat,water,weight,goalWeight,age,sex,height,factor]);
  return res.json({profile:q.rows[0]});
 } catch(e) { console.error("profile",e); res.status(500).json({error:"Could not save profile."}); }
}