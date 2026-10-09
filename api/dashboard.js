import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : new Date().toISOString().slice(0,10); }
export default async function(req, res) {
  try {
    const userId = req.user.id, date = validDate(req.query.date);
    await db.query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
    const [p, foods, activities, water, weights] = await Promise.all([
      db.query("SELECT * FROM profiles WHERE user_id = $1", [userId]),
      db.query("SELECT * FROM food_logs WHERE user_id = $1 AND log_date = $2 ORDER BY created_at DESC", [userId, date]),
      db.query("SELECT * FROM activity_logs WHERE user_id = $1 AND log_date = $2 ORDER BY created_at DESC", [userId, date]),
      db.query("SELECT COALESCE(SUM(amount_ml),0) AS water_ml FROM water_logs WHERE user_id = $1 AND log_date = $2", [userId, date]),
      db.query("SELECT weight_kg, log_date FROM weight_logs WHERE user_id = $1 ORDER BY log_date DESC LIMIT 30", [userId])
    ]);
    const profile = p.rows[0];
    const foodTotals = foods.rows.reduce((a,f) => { a.calories += Number(f.calories); a.protein += Number(f.protein); a.carbs += Number(f.carbs); a.fat += Number(f.fat); a.fiber += Number(f.fiber); return a; }, {calories:0,protein:0,carbs:0,fat:0,fiber:0});
    const exerciseCalories = activities.rows.reduce((n,a) => n + Number(a.calories), 0);
    let bmr = null, tdee = null;
    if (profile.weight_kg && profile.height_cm && profile.age) {
      const sexTerm = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
      bmr = Math.round(10 * Number(profile.weight_kg) + 6.25 * Number(profile.height_cm) - 5 * Number(profile.age) + sexTerm);
      tdee = Math.round(bmr * Number(profile.activity_factor || 1.35) + exerciseCalories);
    }
    res.json({date,profile,foods:foods.rows,activities:activities.rows,foodTotals,exerciseCalories,waterMl:Number(water.rows[0].water_ml),weights:weights.rows,bmr,tdee,budgetLeft:Math.round(Number(profile.daily_calorie_goal)+exerciseCalories-foodTotals.calories),energyBalance:tdee===null?null:Math.round(foodTotals.calories-tdee)});
  } catch(e) { console.error("dashboard",e); res.status(500).json({error:"Could not load your dashboard. Please try again."}); }
}