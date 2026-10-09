(() => {
  "use strict";
  const API = (window.__HATCHABLE__ && window.__HATCHABLE__.api) || "/api";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  let selectedDate = localDate();
  let dashboard = null, foodsShown = [], selectedFood = null, activeCategory = "", toastTimer = null, searchSequence = 0;
  function localDate(d=new Date()) { return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function dateObj(v) { const a=String(v||"").split("-").map(Number); return new Date(a[0],a[1]-1,a[2]||1); }
  function prettyDate(v) { const d=dateObj(v); return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); }
  function num(v) { return Math.round(Number(v)||0).toLocaleString("en-IN"); }
  function grams(v) { const n=Number(v)||0; return (Math.round(n*10)/10).toLocaleString("en-IN",{maximumFractionDigits:1}); }
  function esc(v) { return String(v==null?"":v).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function foodIcon(food) { const c=String(food.category||"").toLowerCase(), n=String(food.name||"").toLowerCase(); if(n.includes("dosa")||n.includes("idli")||n.includes("pongal")||n.includes("upma")) return "◉"; if(c.includes("fruit")) return "◌"; if(c.includes("beverage")) return "◍"; if(c.includes("bread")) return "◒"; if(c.includes("sweet")) return "✺"; if(c.includes("street")) return "✳"; if(c.includes("rice")||c.includes("grain")) return "◈"; if(c.includes("curry")||c.includes("protein")) return "❋"; return "◉"; }
  async function api(path, options={}) {
    const opts={method:options.method||"GET",headers:Object.assign({},options.headers||{})};
    if(options.body!==undefined) { opts.headers["Content-Type"]="application/json"; opts.body=JSON.stringify(options.body); }
    const response=await fetch(API+path,opts);
    let data={}; try { data=await response.json(); } catch(e) {}
    if(response.status===401) { window.location.href="/login?next=%2F"; throw new Error("Please sign in to continue."); }
    if(!response.ok) throw new Error(data.error||"Something went wrong. Please try again.");
    return data;
  }
  function toast(message,error=false) {
    const box=$("#toast"); box.textContent=message; box.classList.toggle("error",error); box.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove("show"),2900);
  }
  function setBusy(form,busy) { const b=form.querySelector('button[type="submit"]'); if(!b)return; if(busy){b.dataset.original=b.textContent;b.disabled=true;b.textContent="Saving…";}else{b.disabled=false;b.textContent=b.dataset.original||b.textContent;} }
  function setActivePage(name) {
    const valid=["home","diary","activity","progress","profile"].includes(name)?name:"home";
    $$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+valid));
    $$("[data-page-link]").forEach(b=>b.classList.toggle("active",b.dataset.pageLink===valid));
    if(valid==="profile") fillProfileForm();
    if(valid==="progress") loadWeightHistory();
    if(valid==="diary"||valid==="home"||valid==="activity") loadDashboard();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function updateDateUI() {
    const isToday=selectedDate===localDate();
    $("#date-line").textContent=(isToday?"Today":"Selected day")+", "+prettyDate(selectedDate);
    $("#pretty-date").textContent=isToday?"Today":prettyDate(selectedDate);
    $("#hero-day-tag").textContent=isToday?"TODAY":prettyDate(selectedDate).toUpperCase();
    $("#day-picker").value=selectedDate;
  }
  function setRing(eaten,goal) {
    const pct=goal>0?Math.max(0,Math.min(100,eaten/goal*100)):0, offset=395.84*(1-pct/100);
    $("#calorie-ring").style.strokeDashoffset=String(offset);
    $("#calorie-bar").style.width=pct+"%";
    $("#calorie-percent").textContent=Math.round(eaten/Math.max(goal,1)*100)+"%";
    $("#calorie-progress-copy").textContent=eaten===0?"A fresh start. Log your first meal.":eaten<goal?"You're building your day, one meal at a time.":eaten===goal?"You've reached today's intake goal.":"You've gone over today's intake goal.";
  }
  function macro(id,value,goal) {
    $("#"+id+"-value").textContent=grams(value)+" g";
    $("#"+id+"-goal-copy").textContent="of "+grams(goal)+" g";
    $("#"+id+"-bar").style.width=Math.min(100,Number(goal)>0?Number(value)/Number(goal)*100:0)+"%";
  }
  function renderMealCards(target, items) {
    const meals=[["Breakfast","☼","breakfast"],["Lunch","◒","lunch"],["Dinner","☾","dinner"],["Snacks","✳","snacks"]];
    target.innerHTML=meals.map(([meal,icon,cls])=>{
      const entries=items.filter(f=>f.meal===meal), total=entries.reduce((s,f)=>s+Number(f.calories),0);
      const content=entries.length?entries.map(f=>'<div class="meal-entry"><div><div class="food-name">'+esc(f.food_name)+'</div><span class="food-description">'+grams(f.quantity)+' × serving · '+num(f.grams)+' g</span></div><div class="entry-kcal">'+num(f.calories)+' kcal</div><button class="delete-entry" data-delete-food="'+esc(f.id)+'" aria-label="Delete '+esc(f.food_name)+'" title="Remove entry">×</button></div>').join(''):'<div class="empty-meal">Nothing logged here yet.'+(target.id==="home-meals"?' <button data-add-meal="'+meal+'">＋ Add to '+meal.toLowerCase()+'</button>':'')+'</div>';
      return '<article class="meal-card"><div class="meal-card-header"><div class="meal-title-group"><span class="meal-icon '+cls+'">'+icon+'</span><div><strong>'+meal+'</strong><small>'+entries.length+' item'+(entries.length===1?'':'s')+'</small></div></div><div class="meal-calories"><strong>'+num(total)+' kcal</strong><small>'+ (entries.length?'logged':'not logged')+'</small></div></div>'+content+'</article>';
    }).join('');
  }
  function renderDashboard(data) {
    dashboard=data; updateDateUI();
    const p=data.profile||{}, t=data.foodTotals||{}, foods=data.foods||[], acts=data.activities||[];
    const eaten=Number(t.calories)||0, goal=Number(p.daily_calorie_goal)||2000, left=Number(data.budgetLeft);
    $("#calories-eaten").textContent=num(eaten); $("#calorie-goal").innerHTML=num(goal)+' <i>kcal</i>';
    $("#calories-left").innerHTML=(left<0?num(Math.abs(left))+" over":num(left))+' <i>kcal</i>';
    setRing(eaten,goal); $("#burned-calories").innerHTML=num(data.exerciseCalories)+' <small>kcal</small>';
    $("#tdee-number").innerHTML=(data.tdee==null?"—":num(data.tdee))+' <small>kcal</small>';
    $("#tdee-caption").textContent=data.tdee==null?"Add age, height and weight to estimate your daily burn.":"Baseline estimate + logged exercise; actual needs vary.";
    $("#protein-goal-copy").textContent="of "+grams(p.protein_goal||100)+" g";
    $("#carbs-goal-copy").textContent="of "+grams(p.carbs_goal||250)+" g";
    $("#fat-goal-copy").textContent="of "+grams(p.fat_goal||65)+" g";
    macro("protein",t.protein||0,p.protein_goal||100); macro("carbs",t.carbs||0,p.carbs_goal||250); macro("fat",t.fat||0,p.fat_goal||65);
    $("#water-value").textContent=num(data.waterMl)+" ml"; $("#water-goal-copy").textContent="of "+num(p.water_goal_ml||2500)+" ml"; $("#water-bar").style.width=Math.min(100,(Number(data.waterMl)||0)/Math.max(1,Number(p.water_goal_ml)||2500)*100)+"%";
    $("#welcome-subtitle").textContent=p.display_name?"Good to see you, "+p.display_name+". Here's how your day is shaping up.":"A little awareness goes a long way.";
    $("#avatar").textContent=(p.display_name||"C").trim().slice(0,1).toUpperCase();
    $("#energy-note").innerHTML='<span class="note-symbol">i</span><p><strong>Know your numbers.</strong> '+(data.energyBalance===null?'Add age, height and weight in your profile to estimate total daily energy expenditure.':'Your estimated energy balance today is '+(data.energyBalance>0?'+':'')+num(data.energyBalance)+' kcal (food intake minus estimated total expenditure).')+' Food and exercise values are estimates, not medical measurements.</p>';
    renderMealCards($("#home-meals"),foods); renderMealCards($("#diary-meals"),foods);
    const summary=[["Calories",eaten,"kcal"],["Protein",grams(t.protein||0),"g"],["Carbs",grams(t.carbs||0),"g"],["Fat",grams(t.fat||0),"g"]];
    $("#diary-summary").innerHTML=summary.map(x=>'<div class="summary-pill"><small>'+x[0]+'</small><strong>'+x[1]+' <span>'+x[2]+'</span></strong></div>').join('');
    renderActivities(acts);
    renderWeightOverview(data.weights||[],p);
    fillProfileForm();
  }
  async function loadDashboard() {
    try { const d=await api("/dashboard?date="+encodeURIComponent(selectedDate)); renderDashboard(d); }
    catch(e) { toast(e.message,true); }
  }
  function renderActivities(items) {
    const list=$("#activity-list");
    $("#activity-total-burn").innerHTML=num(items.reduce((a,x)=>a+Number(x.calories),0))+' <small>kcal</small>';
    $("#activity-minutes-total").textContent=items.reduce((a,x)=>a+Number(x.minutes),0)+" minutes logged on "+prettyDate(selectedDate);
    $("#activity-count").textContent=items.length;
    if(!items.length) { list.innerHTML='<div class="activity-list-empty">No movement logged for this day yet. A short walk counts.</div>'; return; }
    const symbols={Walking:"↗",Running:"⌁",Cycling:"◉","Strength training":"▦",Gym:"▦",Swimming:"≈",Yoga:"✳",Sports:"◈",Other:"＋"};
    list.innerHTML=items.map(a=>'<article class="activity-row"><div class="activity-emblem">'+(symbols[a.activity]||"↗")+'</div><div class="activity-row-main"><strong>'+esc(a.activity)+'</strong><span>'+num(a.minutes)+' min'+(a.distance_km!=null?' · '+grams(a.distance_km)+' km':'')+' · '+esc(a.intensity||"moderate")+' intensity · '+(a.source==="manual"?'manual/device entry':'estimated')+'</span></div><div class="activity-row-cal"><strong>'+num(a.calories)+' kcal</strong><span>'+(a.source==="manual"?'Entered':'Estimate')+'</span></div><button class="delete-activity" data-delete-activity="'+esc(a.id)+'" aria-label="Delete activity">×</button></article>').join('');
  }
  function renderWeightOverview(weights,profile) {
    const ordered=[...(weights||[])].sort((a,b)=>String(a.log_date).localeCompare(String(b.log_date)));
    const latest=ordered.length?Number(ordered[ordered.length-1].weight_kg):Number(profile.weight_kg)||null;
    $("#latest-weight").innerHTML=(latest?grams(latest):"—")+' <small>kg</small>';
    const target=profile.goal_weight_kg?Number(profile.goal_weight_kg):null;
    $("#goal-weight-view").innerHTML=(target?grams(target):"—")+' <small>kg</small>';
    $("#weight-count").textContent=String((weights||[]).length);
    if(ordered.length>1) {
      const delta=Number(ordered[ordered.length-1].weight_kg)-Number(ordered[ordered.length-2].weight_kg);
      $("#weight-change-copy").textContent=(delta>0?"+":"")+grams(delta)+" kg since last check-in";
    } else $("#weight-change-copy").textContent=ordered.length?"Your first recorded check-in":"Add your first check-in";
    $("#goal-distance-copy").textContent=target&&latest?grams(Math.abs(latest-target))+" kg from your set goal":"Set a goal in your profile";
  }
  function fillProfileForm() {
    const form=$("#profile-form"); if(!form||!dashboard||!dashboard.profile)return;
    const p=dashboard.profile;
    ["display_name","age","sex","height_cm","weight_kg","goal_weight_kg","activity_factor","daily_calorie_goal","water_goal_ml","protein_goal","carbs_goal","fat_goal"].forEach(k=>{if(form.elements[k]&&document.activeElement!==form.elements[k])form.elements[k].value=p[k]===null||p[k]===undefined?"":p[k];});
  }
  async function loadWeightHistory() {
    try {
      const data=await api("/weight");
      const entries=data.entries||[];
      const box=$("#weight-history");
      if(!entries.length) box.innerHTML='<div class="activity-list-empty">No weight entries yet. Your first check-in will appear here.</div>';
      else box.innerHTML=entries.map(e=>'<div class="history-row"><time>'+esc(prettyDate(String(e.log_date).slice(0,10)))+'</time><strong>'+grams(e.weight_kg)+' kg</strong></div>').join('');
      drawWeightChart(entries);
      if(dashboard) renderWeightOverview(entries,dashboard.profile||{});
    } catch(e) { toast(e.message,true); }
  }
  function drawWeightChart(entries) {
    const box=$("#weight-chart"), arr=[...(entries||[])].sort((a,b)=>String(a.log_date).localeCompare(String(b.log_date)));
    if(!arr.length) { box.innerHTML='<div class="chart-empty">Record your weight to see your trend here.</div>'; return; }
    if(arr.length===1) { box.innerHTML='<div class="chart-empty">One check-in saved at '+grams(arr[0].weight_kg)+' kg. Add another check-in to see a trend.</div>'; return; }
    const vals=arr.map(e=>Number(e.weight_kg)), lo=Math.min(...vals), hi=Math.max(...vals), pad=(hi-lo)*.2||1, min=lo-pad, max=hi+pad, width=600, height=190, left=38, right=20, top=20, bottom=34;
    const x=i=>left+(width-left-right)*i/(arr.length-1), y=v=>top+(height-top-bottom)*(max-v)/(max-min);
    const points=vals.map((v,i)=>x(i)+","+y(v)).join(" ");
    const ticks=[max,(max+min)/2,min];
    const grid=ticks.map(v=>'<line x1="'+left+'" x2="'+(width-right)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e9ede5" stroke-dasharray="3 5"/><text x="0" y="'+(y(v)+4)+'" fill="#8c9688" font-size="10">'+grams(v)+'</text>').join("");
    const circles=vals.map((v,i)=>'<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.5" fill="#315b3e" stroke="#fff" stroke-width="2"><title>'+esc(arr[i].log_date)+': '+grams(v)+' kg</title></circle>').join("");
    const dates=[arr[0],arr[Math.floor((arr.length-1)/2)],arr[arr.length-1]];
    const labels=dates.map((d,i)=>'<text x="'+(i===0?left:i===1?width/2:width-right)+'" y="'+(height-8)+'" text-anchor="'+(i===0?"start":i===1?"middle":"end")+'" font-size="10" fill="#8c9688">'+esc(String(d.log_date).slice(5,10))+'</text>').join("");
    box.innerHTML='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Weight trend chart in kilograms">'+grid+'<polyline points="'+points+'" fill="none" stroke="#5b8a63" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+circles+labels+'</svg>';
  }
  function mealAtNow() { const h=new Date().getHours(); return h<11?"Breakfast":h<15?"Lunch":h<19?"Snacks":"Dinner"; }
  function openFoodDialog(meal) {
    const d=$("#food-dialog"); if(meal) $("#log-food-form").elements.meal.value=meal;
    $("#food-search").value=""; $("#log-food-form").classList.add("hidden"); $("#custom-food-form").classList.add("hidden"); $("#food-results").classList.remove("hidden");
    selectedFood=null; searchFoods("");
    if(!$("#food-dialog").open) d.showModal();
    setTimeout(()=>$("#food-search").focus(),80);
  }
  function closeFoodDialog() { $("#food-dialog").close(); }
  async function searchFoods(term) {
    const id=++searchSequence, box=$("#food-results"); box.innerHTML='<div class="loading">Finding your food…</div>';
    try {
      const data=await api("/foods?q="+encodeURIComponent(term||"")+"&category="+encodeURIComponent(activeCategory));
      if(id!==searchSequence)return;
      foodsShown=data.foods||[];
      if(!foodsShown.length) { box.innerHTML='<div class="empty-search">No matching food found. Try another name or add a custom food.</div>'; return; }
      box.innerHTML=foodsShown.map(f=>'<button class="food-result" data-select-food="'+esc(f.id)+'"><span class="food-result-emoji">'+foodIcon(f)+'</span><span class="food-result-info"><strong>'+esc(f.name)+'</strong><small>'+esc(f.serving_label)+' · '+esc(f.region||"Indian")+' · '+(f.estimate?"Estimated values":"Reference values")+'</small></span><span class="food-result-cal"><strong>'+num(f.calories)+' kcal</strong><small>'+grams(f.protein)+' g protein</small></span></button>').join('');
    } catch(e) { if(id===searchSequence)box.innerHTML='<div class="empty-search">'+esc(e.message)+'</div>'; }
  }
  function selectFood(food) {
    selectedFood=food; $("#selected-food-name").textContent=food.name; $("#selected-food-serving").textContent=(food.serving_label||"1 serving")+" · "+num(food.serving_grams)+" g";
    $("#selected-food-kcal").textContent=num(food.calories)+" kcal per serving";
    $("#log-food-form").classList.remove("hidden"); $("#custom-food-form").classList.add("hidden");
    $("#log-food-form").elements.quantity.value="1"; $("#log-food-form").elements.meal.value=mealAtNow();
    updatePortionPreview(); $("#log-food-form").scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function updatePortionPreview() {
    if(!selectedFood)return;
    const q=Math.max(0,Number($("#log-food-form").elements.quantity.value)||0);
    $("#portion-preview").textContent=grams(q)+" serving"+(q===1?"":"s")+" · "+num(Number(selectedFood.calories)*q)+" kcal · "+num(Number(selectedFood.serving_grams)*q)+" g · "+grams(Number(selectedFood.protein)*q)+" g protein";
  }
  async function saveFood(event) {
    event.preventDefault(); if(!selectedFood)return;
    const form=event.currentTarget, b=new FormData(form), body={food_id:selectedFood.id,quantity:Number(b.get("quantity")),meal:b.get("meal"),log_date:selectedDate};
    setBusy(form,true);
    try { await api("/diary",{method:"POST",body}); closeFoodDialog(); await loadDashboard(); toast("Added "+selectedFood.name+" to your diary."); }
    catch(e) { toast(e.message,true); } finally { setBusy(form,false); }
  }
  async function saveCustomFood(event) {
    event.preventDefault(); const form=event.currentTarget,b=new FormData(form);
    const body={name:b.get("name"),serving_grams:Number(b.get("serving_grams")),calories:Number(b.get("calories")),protein:Number(b.get("protein")),carbs:Number(b.get("carbs")),fat:Number(b.get("fat")),fiber:Number(b.get("fiber")),category:"Custom",region:"Custom",diet:"vegetarian",serving_label:"1 serving"};
    setBusy(form,true);
    try {
      const data=await api("/foods",{method:"POST",body});
      toast("Custom food saved. Add it to your diary when ready.");
      selectedFood=data.food; selectFood(data.food); $("#food-search").value=data.food.name; $("#food-results").classList.add("hidden"); $("#custom-food-form").classList.add("hidden");
      $("#log-food-form").elements.meal.value=mealAtNow();
    } catch(e) { toast(e.message,true); } finally { setBusy(form,false); }
  }
  async function addWater(amount) {
    try { await api("/water",{method:"POST",body:{amount_ml:amount,log_date:selectedDate}}); await loadDashboard(); toast("Added "+num(amount)+" ml of water."); }
    catch(e) { toast(e.message,true); }
  }
  async function deleteFood(id) {
    if(!confirm("Remove this food entry from your diary?"))return;
    try { await api("/diary",{method:"DELETE",body:{id}}); await loadDashboard(); toast("Food entry removed."); }
    catch(e) { toast(e.message,true); }
  }
  async function deleteActivity(id) {
    if(!confirm("Remove this activity entry?"))return;
    try { await api("/activity",{method:"DELETE",body:{id}}); await loadDashboard(); toast("Activity removed."); }
    catch(e) { toast(e.message,true); }
  }
  async function saveActivity(event) {
    event.preventDefault(); const form=event.currentTarget,b=new FormData(form), body={activity:b.get("activity"),minutes:Number(b.get("minutes")),intensity:b.get("intensity"),distance_km:b.get("distance_km")||null,calories:b.get("calories")||null,log_date:selectedDate};
    setBusy(form,true);
    try { const r=await api("/activity",{method:"POST",body}); form.reset(); form.elements.minutes.value=30; form.elements.intensity.value="moderate"; await loadDashboard(); toast((r.activity.source==="manual"?"Saved device calorie value.":"Activity saved with an estimated burn of "+num(r.activity.calories)+" kcal.")); }
    catch(e) { toast(e.message,true); } finally { setBusy(form,false); }
  }
  async function saveProfile(event) {
    event.preventDefault(); const form=event.currentTarget,f=new FormData(form);
    const body={display_name:f.get("display_name"),age:f.get("age")===""?null:Number(f.get("age")),sex:f.get("sex"),height_cm:f.get("height_cm")===""?null:Number(f.get("height_cm")),weight_kg:f.get("weight_kg")===""?null:Number(f.get("weight_kg")),goal_weight_kg:f.get("goal_weight_kg")===""?null:Number(f.get("goal_weight_kg")),activity_factor:Number(f.get("activity_factor")),daily_calorie_goal:Number(f.get("daily_calorie_goal")),water_goal_ml:Number(f.get("water_goal_ml")),protein_goal:Number(f.get("protein_goal")),carbs_goal:Number(f.get("carbs_goal")),fat_goal:Number(f.get("fat_goal"))};
    setBusy(form,true);
    try { const r=await api("/profile",{method:"PUT",body}); toast("Profile and daily goals updated."); await loadDashboard(); fillProfileForm(); }
    catch(e) { toast(e.message,true); } finally { setBusy(form,false); }
  }
  async function saveWeight(event) {
    event.preventDefault(); const form=event.currentTarget, weight=Number(form.elements.weight_kg.value); setBusy(form,true);
    try { await api("/weight",{method:"POST",body:{weight_kg:weight,log_date:selectedDate}}); form.reset(); toast("Weight check-in saved."); await loadDashboard(); await loadWeightHistory(); }
    catch(e) { toast(e.message,true); } finally { setBusy(form,false); }
  }
  async function boot() {
    try {
      if(window.hatchable&&window.hatchable.auth) {
        const session=await window.hatchable.auth.getSession();
        if(!session||!session.user){window.location.href="/login?next=%2F";return;}
      }
      updateDateUI();
      await loadDashboard();
    } catch(e) { console.error(e); }
  }
  $$("[data-page-link]").forEach(b=>b.addEventListener("click",()=>setActivePage(b.dataset.pageLink)));
  $("#signout").addEventListener("click",async()=>{try{await window.hatchable.auth.signOut();}finally{window.location.href="/login";}});
  $("#mobile-signout").addEventListener("click",async()=>{try{await window.hatchable.auth.signOut();}finally{window.location.href="/login";}});
  $("#date-button").addEventListener("click",()=>{const p=$("#day-picker"); if(p.showPicker)p.showPicker();else p.click();});
  $("#day-picker").addEventListener("change",async e=>{if(!e.target.value)return;selectedDate=e.target.value;updateDateUI();await loadDashboard();});
  ["#add-food-top","#add-food-main","#diary-add-food","#bottom-add"].forEach(s=>$(s).addEventListener("click",()=>openFoodDialog()));
  $("#close-food-dialog").addEventListener("click",closeFoodDialog);
  $("#food-dialog").addEventListener("click",e=>{if(e.target===$("#food-dialog"))closeFoodDialog();});
  $("#food-search").addEventListener("input",e=>{activeCategory=$(".filter-chip.active")?.dataset.foodCategory||""; searchFoods(e.target.value.trim());});
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>{$$(".filter-chip").forEach(x=>x.classList.toggle("active",x===b));activeCategory=b.dataset.foodCategory||"";searchFoods($("#food-search").value.trim());}));
  $("#food-results").addEventListener("click",e=>{const b=e.target.closest("[data-select-food]");if(!b)return;const f=foodsShown.find(x=>x.id===b.dataset.selectFood);if(f)selectFood(f);});
  $("#log-food-form").addEventListener("submit",saveFood);
  $("#log-food-form").elements.quantity.addEventListener("input",updatePortionPreview);
  $("#change-selected-food").addEventListener("click",()=>{$("#log-food-form").classList.add("hidden");$("#food-results").classList.remove("hidden");selectedFood=null;});
  $("#show-custom-food").addEventListener("click",()=>{$("#custom-food-form").classList.remove("hidden");$("#log-food-form").classList.add("hidden");$("#food-results").classList.add("hidden");$("#custom-food-form").scrollIntoView({behavior:"smooth",block:"nearest"});});
  $("#cancel-custom-food").addEventListener("click",()=>{$("#custom-food-form").classList.add("hidden");$("#food-results").classList.remove("hidden");});
  $("#custom-food-form").addEventListener("submit",saveCustomFood);
  $("#home-meals").addEventListener("click",e=>{const b=e.target.closest("[data-add-meal]");if(b)openFoodDialog(b.dataset.addMeal);});
  $("#diary-meals").addEventListener("click",e=>{const b=e.target.closest("[data-delete-food]");if(b)deleteFood(b.dataset.deleteFood);});
  $("#home-meals").addEventListener("click",e=>{const b=e.target.closest("[data-delete-food]");if(b)deleteFood(b.dataset.deleteFood);});
  $("#activity-list").addEventListener("click",e=>{const b=e.target.closest("[data-delete-activity]");if(b)deleteActivity(b.dataset.deleteActivity);});
  $$("[data-water]").forEach(b=>b.addEventListener("click",()=>addWater(Number(b.dataset.water))));
  $("#activity-form").addEventListener("submit",saveActivity);
  $("#profile-form").addEventListener("submit",saveProfile);
  $("#weight-form").addEventListener("submit",saveWeight);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#food-dialog").open)closeFoodDialog();});
  boot();
})();