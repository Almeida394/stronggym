/* StrongGym — My Plan
   1) dados (idade, sexo, altura, peso) → 2) objetivo escrito livremente → 3) plano de treino e alimentar.
   O texto do objetivo é interpretado localmente (PT e EN) por palavras-chave. O plano fica guardado neste navegador. */
'use strict';
const MP={step:null,override:null};
const mpL=(pt,en)=>SG.L(pt,en);
const mpKey=()=>'stronggym-myplan-'+(state?.user?.id||'guest');
function mpLoad(){try{return JSON.parse(localStorage.getItem(mpKey()))||{};}catch(_){return {};}}
function mpSave(d){try{localStorage.setItem(mpKey(),JSON.stringify(d));}catch(_){}}
const mpNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,"'");
const mpNum=s=>Number(String(s).replace(',','.'));
const mpRound=(n,step=5)=>Math.max(step,Math.round(n/step)*step);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const mpFmt=n=>new Intl.NumberFormat(SG.locale(),{maximumFractionDigits:1}).format(n);

/* ---------- Interpretação do objetivo ---------- */
const MP_WORDNUM={um:1,uma:1,one:1,dois:2,duas:2,two:2,tres:3,three:3,quatro:4,four:4,cinco:5,five:5,seis:6,six:6,sete:7,seven:7};
const MP_GOALS={
  lose:/(perder|baixar|tirar|reduzir|queimar|eliminar)\s+(de\s+)?(peso|gordura|barriga|kilos|quilos|kg|\d)|emagrec|secar|perda de peso|lose\s+(some\s+)?(weight|fat|belly|\d)|weight\s*loss|fat\s*loss|burn\s+fat|slim|get\s+lean|cut(ting)?\b|drop\s+\d/,
  gain:/massa\s*(muscular|magra)?|musculo|hipertrofia|crescer|ganhar\s+(peso|\d|kilos|quilos)|aumentar\s+(o\s+)?peso|ficar\s+(maior|grande)|volume|bulk|build\s+muscle|gain\s+(weight|muscle|mass|\d)|muscle|bigger|hypertrophy|mass\b/,
  strength:/\bforca|mais\s+forte|powerlift|levantar\s+mais|strength|stronger|lift\s+(more|heavier)|\b1\s*rm\b|personal\s+record|\bpr\b/,
  endurance:/resistencia|cardio|correr|corrida|maratona|meia.maratona|\d+\s*km|folego|stamina|endurance|\brun(ning)?\b|marathon|\bcycling\b|ciclismo|triatlo|triathlon|aerobic/,
  tone:/tonific|definir|definicao|definido|tonificar|\btone(d)?\b|sculpt|defined|firm/,
  health:/saude|bem.estar|mobilidade|postura|stress|ansiedade|sentir.me\s+melhor|sentir\s+melhor|energia|dormir\s+melhor|health|healthy|wellness|well.being|mobility|posture|feel\s+better|flexib/
};
const MP_FOCUS={
  legs:/perna|coxa|quadricep|\blegs?\b|thigh|quads?\b/,
  glutes:/glute|rabo|nadega|bum\b|booty|butt\b/,
  arms:/braco|bicep|tricep|\barms?\b/,
  abs:/abdomin|abdominais|barriga|six.pack|tanquinho|\babs\b|\bcore\b|belly/,
  back:/(?<!dor\s(nas|na|de)\s)costas(?!\s*(doi|magoad))|dorsal|\bback\s+(muscles|width)|\blats\b/,
  chest:/peito|peitoral|\bchest\b|\bpecs?\b/,
  shoulders:/ombros(?!\s*(doi|magoad))|deltoide|\bshoulders\b(?!\s+(hurt|pain))/
};
const MP_INJ={
  knee:/joelho|knee|menisco|ligamento cruzado|acl\b/,
  back:/dor(es)?\s+(nas|na|de|lombar|nas costas)|lombar|hernia|coluna|ciatica|back\s*(pain|problem|injur)|bad\s+back|lower\s+back|costas\s+(doi|magoad)|sciatica|disc/,
  shoulder:/(dor|lesao|problema|tendinite|luxacao)\w*\s+(no|nos|do|dos|de|ao)?\s*ombro|ombros?\s+(doi|magoad|lesionad)|shoulder\s*(pain|injur|problem|hurt)|rotator|(bad|injured|sore)\s+shoulder|shoulders?\s+hurt/,
  wrist:/pulso|punho|wrist|tunel carpico|carpal/,
  ankle:/tornozelo|ankle|entorse/
};
const MP_ALLERGY={
  nuts:/(alerg\w*|allerg\w*)[^.]*\b(frutos\s+secos|nozes|amendoa|cajus?|avela|nuts?|almond|cashew|walnut|hazelnut)/,
  peanut:/(alerg\w*|allerg\w*)[^.]*\b(amendoim|peanuts?)/,
  shellfish:/(alerg\w*|allerg\w*)[^.]*\b(marisco|camarao|shellfish|shrimp|prawn)/,
  fish:/(alerg\w*|allerg\w*)[^.]*\b(peixe|fish)/,
  egg:/(alerg\w*|allerg\w*)[^.]*\b(ovos?|eggs?)/,
  soy:/(alerg\w*|allerg\w*)[^.]*\b(soja|soy)/,
  dairy:/(alerg\w*|allerg\w*)[^.]*\b(leite|lacticinios|laticinios|milk|dairy)/,
};
const MP_DISLIKE_MAP=[
  [/peixe|fish/,'fish'],[/carne|meat/,'meat'],[/frango|chicken/,'chicken'],[/ovo|egg/,'egg'],[/atum|tuna/,'tuna'],[/salmao|salmon/,'salmon'],[/tofu/,'tofu'],
  [/leite|milk/,'milk'],[/iogurte|yogh?urt/,'yogurt'],[/queijo|cheese/,'cheese'],[/aveia|oat/,'oats'],[/banana/,'banana'],[/brocolos|broccoli/,'broccoli'],
  [/arroz|rice/,'rice'],[/massa|pasta/,'pasta'],[/batata.doce|sweet potato/,'sweetpotato'],[/batata|potato/,'potato'],[/lentilha|lentil/,'lentils'],[/grao|chickpea/,'chickpeas'],
  [/abacate|avocado/,'avocado'],[/peru|turkey/,'turkey'],[/vaca|beef/,'beef'],[/quinoa/,'quinoa'],[/marisco|camarao|shrimp|seafood/,'shellfish'],[/pescada|hake|white fish/,'hake'],
  [/manteiga de amendoim|peanut butter/,'peanut'],[/whey|batido|shake|proteina em po|protein powder/,'whey'],[/cogumelo|mushroom/,'mushroom']
];

function mpParse(text,profile){
  const raw=String(text||''),t=mpNorm(raw),r={goal:null,goals:[],detected:true,target:null,weeks:null,days:null,minutes:null,place:'gym',equipment:[],level:null,focus:[],injuries:[],diet:[],allergies:[],dislikes:[],meals:null};
  const scores={};for(const [k,re] of Object.entries(MP_GOALS)){const m=t.match(new RegExp(re.source,'g'));if(m)scores[k]=m.length;}
  /* peso alvo */
  const kg='(\\d+(?:[.,]\\d+)?)\\s*(kg|kilos?|quilos?|kgs)';
  let m;
  if((m=t.match(new RegExp('(perder|baixar|tirar|lose|drop|shed|reduzir)\\s+(uns\\s+|cerca\\s+de\\s+|about\\s+|around\\s+)?'+kg))))r.target=+(profile.weight-mpNum(m[3])).toFixed(1),scores.lose=(scores.lose||0)+2;
  else if((m=t.match(new RegExp('(ganhar|aumentar|gain|put\\s+on|add)\\s+(uns\\s+|cerca\\s+de\\s+|about\\s+|around\\s+)?'+kg))))r.target=+(profile.weight+mpNum(m[3])).toFixed(1),scores.gain=(scores.gain||0)+2;
  else if((m=t.match(new RegExp('(chegar\\s+(aos|ao|a)|ficar\\s+com|pesar|para\\s+os|reach|get\\s+to|weigh|down\\s+to|up\\s+to|target)\\s+(os\\s+)?'+kg)))){const v=mpNum(m[4]);r.target=v;if(v<profile.weight-0.5)scores.lose=(scores.lose||0)+2;else if(v>profile.weight+0.5)scores.gain=(scores.gain||0)+2;}
  else if((m=t.match(/(\d+(?:[.,]\d+)?)\s*(lbs?|pounds)/))){const lb=mpNum(m[1])*0.4536;if(/lose|drop|perder/.test(t))r.target=+(profile.weight-lb).toFixed(1);else if(/gain|ganhar/.test(t))r.target=+(profile.weight+lb).toFixed(1);}
  if(r.target!==null&&(r.target<30||r.target>250))r.target=null;
  if((m=t.match(/(\d+)\s*(semanas|weeks)/)))r.weeks=+m[1];else if((m=t.match(/(\d+)\s*(meses|months)/)))r.weeks=+m[1]*4.3;
  /* objetivo principal */
  const order=['lose','gain','strength','endurance','tone','health'];
  r.goals=order.filter(k=>scores[k]).sort((a,b)=>scores[b]-scores[a]||order.indexOf(a)-order.indexOf(b));
  r.goal=r.goals[0]||null;
  if(!r.goal){r.detected=false;r.goal='health';}
  /* dias e duração */
  const dayRe=/(\d|um|uma|duas|dois|tres|quatro|cinco|seis|two|three|four|five|six)\s*(x|vezes|dias|days|times|treinos|sessoes|sessions)\s*(por|a|na|per|a\s+week|each|every)?\s*(semana|week)?/;
  if((m=t.match(dayRe))){const n=/\d/.test(m[1])?+m[1]:MP_WORDNUM[m[1]];if(n)r.days=Math.min(6,Math.max(2,n));}
  else if(/todos\s+os\s+dias|every\s*day|daily|diariamente/.test(t))r.days=6;
  if((m=t.match(/(\d{2,3})\s*(min|minutos|minutes|mins)\b/)))r.minutes=+m[1];
  else if(/meia\s+hora|half\s+(an\s+)?hour/.test(t))r.minutes=30;
  else if(/(uma|1)\s*(hora|h\b)|an\s+hour|1\s*hour/.test(t))r.minutes=60;
  else if(/hora\s+e\s+meia|1h30|hour\s+and\s+a\s+half/.test(t))r.minutes=75;
  if(r.minutes)r.minutes=Math.min(90,Math.max(20,r.minutes));
  /* local e equipamento */
  const home=/\bem\s+casa\b|\bcasa\b|\bhome\b|apartamento|apartment|sala\s+de\s+estar|living\s+room|garagem|garage/.test(t),gym=/ginasio|\bgym\b|ginasios/.test(t);
  r.place=home&&gym?'hybrid':home?'home':'gym';
  const eq=[['d',/halter|dumbbell/],['k',/kettlebell/],['b',/elastic|banda|bands?\b|resistance\s+band/],['p',/barra\s+(de\s+)?(elevac|fixa|pull)|pull.?up\s+bar|chin.?up\s+bar|barra\s+na\s+porta/],['bench',/banco|bench/],['rope',/corda|jump\s*rope|skipping/],['bike',/bicicleta\s+(estatica|em\s+casa)|exercise\s+bike|stationary\s+bike/]];
  for(const [k,re] of eq)if(re.test(t))r.equipment.push(k);
  /* nível */
  if(/iniciante|principiante|comecar|comecando|nunca\s+treinei|sem\s+experiencia|beginner|first\s+time|never\s+(trained|worked)|just\s+start|newbie|novato|pouca\s+experiencia/.test(t))r.level='beginner';
  else if(/avancad|experiente|competi|advanced|experienced|\d+\s*(anos|years)\s+(de\s+treino|a\s+treinar|training|lifting)/.test(t))r.level='advanced';
  else if(/intermedi|intermediate|algum(a)?\s+experiencia|some\s+experience/.test(t))r.level='intermediate';
  /* lesões (antes do foco para não confundir "costas") */
  for(const [k,re] of Object.entries(MP_INJ))if(re.test(t))r.injuries.push(k);
  for(const [k,re] of Object.entries(MP_FOCUS))if(re.test(t)&&!(k==='back'&&r.injuries.includes('back'))&&!(k==='shoulders'&&r.injuries.includes('shoulder')))r.focus.push(k);
  if(/corpo\s+(todo|inteiro)|full\s*body|whole\s+body/.test(t))r.focus=['full'];
  /* alimentação */
  if(/vegan[oa]?\b|vegan\b|plant.based|100%\s*vegetal/.test(t))r.diet.push('vegan');
  else if(/vegetarian[oa]?|vegetarian|nao\s+como\s+carne|don'?t\s+eat\s+meat|no\s+meat|sem\s+carne/.test(t))r.diet.push('vegetarian');
  else if(/pescetarian|pescatarian|pescetarian/.test(t))r.diet.push('pescatarian');
  if(/lactose|sem\s+leite|dairy.free|no\s+dairy|sem\s+(lacticinios|laticinios)/.test(t))r.diet.push('lactose');
  if(/gluten|celiac|doenca\s+celiaca/.test(t))r.diet.push('gluten');
  for(const [k,re] of Object.entries(MP_ALLERGY))if(re.test(t))r.allergies.push(k);
  if(/alerg\w*\s+(a|ao|aos|as)?\s*(frutos\s+secos)|nut\s+allerg/.test(t)&&!r.allergies.includes('nuts'))r.allergies.push('nuts');
  if(r.allergies.includes('dairy')&&!r.diet.includes('lactose'))r.diet.push('lactose');
  const dislikeRe=/(nao\s+gosto\s+(de|do|da|dos|das)|detesto|odeio|nao\s+como|nao\s+suporto|don'?t\s+(like|eat)|do\s+not\s+(like|eat)|hate|can'?t\s+stand|dislike)\s+([^.;,!?]+)/g;
  for(const mm of t.matchAll(dislikeRe)){
    const chunk=mm[mm.length-1];if(/^\s*(treinar|correr|cardio|train|running|run|exercis|acordar|wake)/.test(chunk))continue;
    for(const [re,key] of MP_DISLIKE_MAP)if(re.test(chunk)&&!r.dislikes.includes(key))r.dislikes.push(key);
  }
  if(r.dislikes.includes('meat')&&!r.diet.length)r.diet.push('nomeat');
  if((m=t.match(/(\d)\s*(refeicoes|refeicao|meals?)/)))r.meals=Math.min(6,Math.max(3,+m[1]));
  return r;
}

/* ---------- Cálculos ---------- */
function mpMetrics(p,goal,days){
  const bmi=p.weight/((p.height/100)**2);
  const bmr=10*p.weight+6.25*p.height-5*p.age+(p.sex==='m'?5:-161);
  const factor={2:1.375,3:1.45,4:1.55,5:1.65,6:1.725}[days]||1.45;
  const tdee=bmr*factor;
  const adj={lose:-0.2,gain:0.12,strength:0.05,endurance:0,tone:-0.1,health:0}[goal];
  let kcal=tdee*(1+adj);
  const floor=p.sex==='m'?1500:1200;
  if(goal==='lose'||goal==='tone')kcal=Math.max(kcal,floor,bmr*1.05);
  if(p.age<18)kcal=Math.max(kcal,tdee);
  kcal=Math.round(kcal/10)*10;
  const pkg={lose:2,gain:1.8,strength:1.8,tone:1.8,endurance:1.5,health:1.4}[goal];
  const protein=Math.round(p.weight*pkg),fat=Math.round(kcal*(goal==='endurance'?0.25:0.28)/9),carbs=Math.max(50,Math.round((kcal-protein*4-fat*9)/4));
  const water=Math.round((p.weight*35+days*70)/100)/10;
  return {bmi,bmr:Math.round(bmr),tdee:Math.round(tdee),kcal,protein,fat,carbs,water};
}
function mpBmiLabel(b){return b<18.5?mpL('Abaixo do peso','Underweight'):b<25?mpL('Peso normal','Healthy weight'):b<30?mpL('Excesso de peso','Overweight'):mpL('Obesidade','Obesity');}

/* ---------- Base de exercícios ----------
   w: onde/material ('g' ginásio, 'h' só peso corporal, 'd' halteres, 'k' kettlebell, 'b' elásticos, 'p' barra de elevações, 'bench' banco)
   x: lesões a evitar */
const MP_EX={
  squat:[['Agachamento com barra','Barbell back squat',['g'],['knee','back']],['Agachamento goblet','Goblet squat',['g','d','k'],['knee']],['Leg press','Leg press',['g'],['knee']],['Agachamento com peso corporal','Bodyweight squat',['h'],['knee']],['Ponte de glúteos','Glute bridge',['g','h'],[]]],
  hinge:[['Peso morto romeno','Romanian deadlift',['g'],['back']],['Peso morto romeno com halteres','Dumbbell Romanian deadlift',['d'],['back']],['Kettlebell swing','Kettlebell swing',['k'],['back']],['Leg curl na máquina','Machine leg curl',['g'],[]],['Ponte de glúteos unilateral','Single-leg glute bridge',['h'],[]]],
  lunge:[['Agachamento búlgaro','Bulgarian split squat',['g','d','h'],['knee']],['Afundos à retaguarda','Reverse lunges',['g','d','h'],['knee']],['Step-up no banco','Bench step-ups',['g','bench'],['knee']],['Abdução de anca com elástico','Banded hip abduction',['g','b'],[]],['Elevação lateral da perna, deitado','Side-lying leg raise',['h'],[]]],
  glute:[['Hip thrust com barra','Barbell hip thrust',['g'],[]],['Hip thrust com halter','Dumbbell hip thrust',['d'],[]],['Ponte de glúteos com pausa','Paused glute bridge',['h'],[]]],
  pushH:[['Supino com barra','Barbell bench press',['g'],['shoulder','wrist']],['Supino com halteres','Dumbbell bench press',['g','d'],['shoulder']],['Chest press na máquina','Machine chest press',['g'],[]],['Flexões','Push-ups',['h'],['wrist','shoulder']],['Flexões inclinadas','Incline push-ups',['h'],['wrist']],['Press de peito com elástico','Banded chest press',['b'],[]],['Prancha com toque no ombro','Plank shoulder taps',['h'],['wrist','shoulder']],['Isometria de peito (palmas juntas)','Chest squeeze isometric',['h'],[]]],
  pushH2:[['Supino inclinado com halteres','Incline dumbbell press',['g','d'],['shoulder']],['Aberturas na polia','Cable fly',['g'],['shoulder']],['Flexões com pés elevados','Decline push-ups',['h'],['shoulder','wrist']],['Flexões com pausa em baixo','Pause push-ups',['h'],['shoulder','wrist']],['Isometria de peito (palmas juntas)','Chest squeeze isometric',['h'],[]]],
  pushV:[['Press de ombros com halteres','Dumbbell shoulder press',['g','d'],['shoulder']],['Press de ombros com elástico','Banded shoulder press',['b'],['shoulder']],['Pike push-ups','Pike push-ups',['h'],['shoulder','wrist']],['Face pull','Face pull',['g','b'],[]],['Elevações em Y deitado','Prone Y-raises',['h'],[]]],
  lateral:[['Elevações laterais com halteres','Dumbbell lateral raises',['g','d'],['shoulder']],['Elevações laterais com elástico','Banded lateral raises',['b'],['shoulder']],['Elevações em Y deitado','Prone Y-raises',['h'],[]]],
  pullV:[['Puxada na polia','Lat pulldown',['g'],[]],['Elevações','Pull-ups',['p'],['shoulder']],['Puxada com elástico','Banded lat pulldown',['b'],[]],['Remada invertida debaixo de uma mesa','Table inverted row',['h'],[]]],
  pullH:[['Remada sentada na polia','Seated cable row',['g'],[]],['Remada com halter','One-arm dumbbell row',['g','d'],[]],['Remada com kettlebell','Kettlebell row',['k'],['back']],['Remada com elástico','Banded row',['b'],[]],['Remada com toalha na porta','Door towel row',['h'],[]]],
  rear:[['Face pull','Face pull',['g','b'],[]],['Aberturas invertidas com halteres','Dumbbell reverse fly',['d'],[]],['Elevações em T deitado','Prone T-raises',['h'],[]]],
  biceps:[['Curl com halteres','Dumbbell curl',['g','d'],[]],['Curl com elástico','Banded curl',['b'],[]],['Curl com toalha (isométrico)','Towel isometric curl',['h'],[]]],
  triceps:[['Tríceps na polia','Cable triceps pushdown',['g'],[]],['Extensão de tríceps com halter','Dumbbell triceps extension',['d'],['shoulder']],['Extensão de tríceps com elástico','Banded triceps extension',['b'],[]],['Fundos numa cadeira','Chair dips',['h'],['shoulder','wrist']],['Flexões fechadas inclinadas','Close-grip incline push-ups',['h'],['wrist']],['Extensão de tríceps no chão (isométrico)','Floor triceps isometric',['h'],[]]],
  calves:[['Gémeos na máquina','Machine calf raises',['g'],['ankle']],['Elevação de gémeos','Standing calf raises',['h'],['ankle']],['Gémeos sentado','Seated calf raises',['g','h'],[]]],
  core:[['Prancha','Plank',['g','h'],['wrist']],['Dead bug','Dead bug',['g','h'],[]],['Bird dog','Bird dog',['g','h'],[]],['Pallof press','Pallof press',['g','b'],[]],['Prancha lateral','Side plank',['g','h'],['shoulder']],['Abdominais bicicleta','Bicycle crunches',['g','h'],['back']],['Elevação de pernas suspenso','Hanging leg raise',['g','p'],['back','shoulder']]]
};
const MP_DAYS={
  fbA:{pt:'Corpo inteiro A',en:'Full body A',p:['squat','pushH','pullV','hinge','lateral','core','biceps']},
  fbB:{pt:'Corpo inteiro B',en:'Full body B',p:['hinge','pushV','pullH','lunge','pushH2','core','triceps']},
  fbC:{pt:'Corpo inteiro C',en:'Full body C',p:['lunge','pushH','pullH','glute','rear','core','calves']},
  upper:{pt:'Tronco superior',en:'Upper body',p:['pushH','pullH','pushV','pullV','lateral','biceps','triceps']},
  lower:{pt:'Tronco inferior',en:'Lower body',p:['squat','hinge','lunge','glute','calves','core','core']},
  push:{pt:'Empurrar · peito, ombros e tríceps',en:'Push · chest, shoulders & triceps',p:['pushH','pushV','pushH2','lateral','triceps','core','triceps']},
  pull:{pt:'Puxar · costas e bíceps',en:'Pull · back & biceps',p:['pullV','pullH','rear','pullH','biceps','core','biceps']},
  legs:{pt:'Pernas e glúteos',en:'Legs & glutes',p:['squat','hinge','lunge','glute','calves','core','core']}
};
const MP_FOCUS_PATTERN={legs:'lunge',glutes:'glute',arms:'biceps',abs:'core',back:'pullH',chest:'pushH2',shoulders:'lateral'};
const MP_WEEK={2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};

function mpAvailable(place,equipment){
  if(place==='gym')return new Set(['g','d','k','p','bench']);
  return new Set(['h',...equipment]);
}
function mpPick(pattern,avail,injuries,variant=0,used=new Set()){
  const list=MP_EX[pattern].filter(x=>x[2].some(w=>avail.has(w))&&!x[3].some(i=>injuries.includes(i)));
  const pool=list.filter(x=>!used.has(x[0]));
  const src=pool.length?pool:list;
  if(!src.length)return null;
  return src[Math.min(variant,src.length-1)];
}
function mpScheme(goal,level,accessory){
  const s={strength:[4,'4–6','2–3 min'],gain:[4,'8–12','90 s'],lose:[3,'12–15','45 s'],tone:[3,'12–15','60 s'],endurance:[3,'15–20','30–45 s'],health:[3,'10–12','60 s']}[goal].slice();
  if(accessory){s[0]=Math.min(s[0],3);if(goal==='strength')s[1]='8–10',s[2]='90 s';}
  if(level==='beginner')s[0]=Math.max(2,s[0]-1);
  if(level==='advanced'&&!accessory)s[0]+=1;
  return s;
}
function mpCardio(kind,injuries,place,equipment){
  const lowImpact=injuries.includes('knee')||injuries.includes('ankle')||injuries.includes('back');
  const machine=place==='home'?(equipment.includes('bike')?mpL('bicicleta estática','stationary bike'):lowImpact?mpL('marcha rápida no lugar ou caminhada','brisk walking'):equipment.includes('rope')?mpL('corda de saltar','jump rope'):mpL('corrida ou caminhada rápida','running or brisk walking')):(lowImpact?mpL('bicicleta ou elíptica','bike or elliptical'):mpL('passadeira, bicicleta ou remo','treadmill, bike or rower'));
  const run=lowImpact?mpL('bicicleta/elíptica','bike/elliptical'):mpL('corrida','running');
  return {
    hiit:[mpL(`Finalizador HIIT (${machine})`,`HIIT finisher (${machine})`),'8×','20 s / 40 s'],
    liss:{pt:'Cardio contínuo e mobilidade',en:'Steady cardio & mobility',items:[[mpL('Aquecimento progressivo','Progressive warm-up'),'1×','8 min'],[mpL(`Cardio moderado (${machine}) — consegues falar, mas não cantar`,`Moderate cardio (${machine}) — you can talk but not sing`),'1×','30–40 min'],[mpL('Mobilidade: anca, coluna torácica e ombros','Mobility: hips, thoracic spine and shoulders'),'1×','10 min']]},
    intervals:{pt:'Intervalos',en:'Intervals',items:[[mpL('Aquecimento leve','Easy warm-up'),'1×','10 min'],[mpL(`Intervalos de ${run}: 2 min forte / 2 min leve`,`${run} intervals: 2 min hard / 2 min easy`),'6–8×','4 min'],[mpL('Retorno à calma e alongamentos','Cool-down and stretching'),'1×','8 min']]},
    tempo:{pt:'Ritmo sustentado',en:'Tempo session',items:[[mpL('Aquecimento leve','Easy warm-up'),'1×','10 min'],[mpL(`${run} a ritmo confortavelmente difícil`,`${run} at a comfortably hard pace`),'1×','20–25 min'],[mpL('Retorno à calma','Cool-down'),'1×','5–10 min']]},
    long:{pt:'Sessão longa e fácil',en:'Long easy session',items:[[mpL(`${run} a ritmo fácil e conversável`,`Easy conversational ${run}`),'1×','45–70 min'],[mpL('Alongamentos e mobilidade','Stretching and mobility'),'1×','10 min']]},
    easy:{pt:'Recuperação ativa',en:'Active recovery',items:[[mpL('Cardio muito leve','Very easy cardio'),'1×','25–30 min'],[mpL('Mobilidade e respiração','Mobility and breathing'),'1×','15 min']]}
  };
}
function mpSplit(goal,days,level){
  const beginner=level==='beginner';
  if(goal==='endurance')return {2:['intervals','fbA'],3:['intervals','fbA','long'],4:['intervals','fbA','tempo','long'],5:['intervals','fbA','tempo','fbB','long'],6:['intervals','fbA','tempo','fbB','easy','long']}[days];
  if(goal==='gain'||goal==='strength')return {2:['fbA','fbB'],3:beginner?['fbA','fbB','fbC']:['push','pull','legs'],4:['upper','lower','upper','lower'],5:['push','pull','legs','upper','lower'],6:['push','pull','legs','push','pull','legs']}[days];
  if(goal==='lose')return {2:['fbA','fbB'],3:['fbA','fbB','fbC'],4:['upper','lower','liss','fbC'],5:['upper','lower','liss','upper','lower'],6:['upper','lower','liss','upper','lower','liss']}[days];
  return {2:['fbA','fbB'],3:['fbA','fbB','fbC'],4:['upper','lower','upper','lower'],5:['upper','lower','liss','upper','lower'],6:['upper','lower','liss','upper','lower','liss']}[days];
}
function mpTraining(r,p){
  const days=r.days,minutes=r.minutes,level=r.level;
  const count=minutes<=25?4:minutes<=35?5:minutes<=50?6:7;
  const split=mpSplit(r.goal,days,level);
  const cardio=mpCardio(null,r.injuries,r.place,r.equipment);
  const weekNames=[0,1,2,3,4,5,6].map(i=>new Date(2024,0,1+i).toLocaleDateString(SG.locale(),{weekday:'long'}));
  const slots=MP_WEEK[days];
  const seen={};
  return split.map((key,i)=>{
    const place=r.place==='hybrid'?(i%2?'home':'gym'):r.place;
    const where=place==='home'?mpL('Casa','Home'):mpL('Ginásio','Gym');
    if(cardio[key]&&cardio[key].items)return {day:cap(weekNames[slots[i]]),title:SG.L(cardio[key].pt,cardio[key].en),where,cardio:true,items:cardio[key].items.map(([n,s,rest])=>({name:n,sets:s,reps:rest,rest:''}))};
    const tpl=MP_DAYS[key],avail=mpAvailable(place,r.equipment),variant=seen[key]=(seen[key]??-1)+1;
    let patterns=tpl.p.slice(0,count);
    const lowerP=['lunge','glute'],upperP=['biceps','pushH2','pullH','lateral'];
    const pushP=['triceps','pushH2','lateral'],pullP=['biceps','pullH'];
    const fits=fp=>fp==='core'||(['lower','legs'].includes(key)?lowerP.includes(fp):key==='push'?pushP.includes(fp):key==='pull'?pullP.includes(fp):key==='upper'?upperP.includes(fp):true);
    const focus=[...new Set(r.focus.filter(f=>f!=='full').map(f=>f==='arms'&&key==='push'?'triceps':MP_FOCUS_PATTERN[f]).filter(fp=>fp&&fits(fp)))];
    focus.forEach((fp,n)=>{if(!patterns.includes(fp))patterns.splice(Math.min(patterns.length,2+n),0,fp);});
    while(patterns.length>count+1){const idx=patterns.map((x,i)=>i).reverse().find(i=>!focus.includes(patterns[i]));if(idx===undefined)break;patterns.splice(idx,1);}
    const used=new Set(),items=[];
    patterns.forEach((pt,idx)=>{const ex=mpPick(pt,avail,r.injuries,variant,used);if(!ex)return;used.add(ex[0]);const [sets,reps,rest]=mpScheme(r.goal,level,idx>=3);items.push({name:SG.L(ex[0],ex[1]),sets:sets+'×',reps,rest,focus:focus.includes(pt)});});
    if(r.goal==='lose'||r.goal==='tone'){const h=cardio.hiit;items.push({name:h[0],sets:h[1],reps:h[2],rest:'',finisher:true});}
    if(r.goal==='health')items.push({name:mpL('Mobilidade e alongamentos','Mobility and stretching'),sets:'1×',reps:'5–10 min',rest:'',finisher:true});
    return {day:cap(weekNames[slots[i]]),title:SG.L(tpl.pt,tpl.en),where,items};
  });
}

/* ---------- Alimentação ---------- */
/* nutrientes por 100 g: [proteína, hidratos, gordura, kcal] */
const MP_PROT=[
  {k:'chicken',pt:'Peito de frango grelhado',en:'Grilled chicken breast',n:[31,0,3.6,165],t:['meat']},
  {k:'turkey',pt:'Peru grelhado',en:'Grilled turkey',n:[29,0,2,135],t:['meat']},
  {k:'salmon',pt:'Salmão no forno',en:'Baked salmon',n:[20,0,13,208],t:['fish']},
  {k:'beef',pt:'Carne de vaca magra',en:'Lean beef',n:[26,0,10,200],t:['meat']},
  {k:'hake',pt:'Pescada cozida',en:'Poached hake',n:[18,0,1,82],t:['fish']},
  {k:'tuna',pt:'Atum ao natural',en:'Tuna in water',n:[26,0,1,116],t:['fish']},
  {k:'eggs',pt:'Omelete de ovos',en:'Egg omelette',n:[13,1,10,150],t:['egg']},
  {k:'tofu',pt:'Tofu salteado',en:'Stir-fried tofu',n:[15,2,8,144],t:['soy']},
  {k:'tempeh',pt:'Tempeh grelhado',en:'Grilled tempeh',n:[19,9,11,192],t:['soy']},
  {k:'lentils',pt:'Estufado de lentilhas',en:'Lentil stew',n:[9,20,0.4,116],t:[]},
  {k:'chickpeas',pt:'Grão-de-bico salteado',en:'Sautéed chickpeas',n:[9,27,2.6,164],t:[]},
  {k:'shellfish',pt:'Camarão salteado',en:'Sautéed shrimp',n:[24,0,0.3,99],t:['shellfish']}
];
const MP_CARB=[
  {k:'rice',pt:'Arroz integral',en:'Brown rice',n:[2.6,23,0.9,111],t:[]},
  {k:'sweetpotato',pt:'Batata-doce assada',en:'Roasted sweet potato',n:[1.6,20,0.1,86],t:[]},
  {k:'pasta',pt:'Massa integral',en:'Wholewheat pasta',n:[5,26,1,130],t:['gluten'],alt:{gluten:['Massa de grão ou arroz','Chickpea or rice pasta']}},
  {k:'quinoa',pt:'Quinoa',en:'Quinoa',n:[4.4,21,1.9,120],t:[]},
  {k:'potato',pt:'Batata cozida',en:'Boiled potatoes',n:[2,17,0.1,77],t:[]},
  {k:'couscous',pt:'Cuscuz',en:'Couscous',n:[3.8,23,0.2,112],t:['gluten'],alt:{gluten:['Milho-painço','Millet']}}
];
const MP_VEG=[['Brócolos e cenoura','Broccoli and carrots','broccoli'],['Salada verde e tomate','Green salad and tomato',''],['Legumes salteados','Sautéed vegetables',''],['Espinafres e cogumelos','Spinach and mushrooms','mushroom'],['Feijão-verde e couve','Green beans and cabbage','']];
/* pequenos-almoços, lanches e ceias: itens [pt, en, quantidade, unidade, etiquetas, chave] com referência de kcal */
const MP_SMALL={
  breakfast:[
    {ref:480,items:[['Flocos de aveia','Rolled oats',60,'g',['gluten'],'oats'],['Leite','Milk',250,'ml',['dairy'],'milk'],['Banana','Banana',1,'un',[],'banana'],['Manteiga de amendoim','Peanut butter',15,'g',['peanut'],'peanut']]},
    {ref:470,items:[['Ovos mexidos','Scrambled eggs',3,'un',['egg'],'egg'],['Pão integral','Wholegrain bread',2,'fatias',['gluten'],'bread'],['Abacate','Avocado',40,'g',[],'avocado'],['Laranja','Orange',1,'un',[],'']]},
    {ref:430,items:[['Iogurte grego natural','Plain Greek yoghurt',200,'g',['dairy'],'yogurt'],['Granola','Granola',40,'g',['gluten','nuts'],'oats'],['Frutos vermelhos','Berries',100,'g',[],'']]},
    {ref:450,items:[['Tofu mexido com curcuma','Turmeric tofu scramble',150,'g',['soy'],'tofu'],['Pão integral','Wholegrain bread',2,'fatias',['gluten'],'bread'],['Tomate','Tomato',1,'un',[],''],['Kiwi','Kiwi',2,'un',[],'']]}
  ],
  snack:[
    {ref:250,items:[['Iogurte natural','Plain yoghurt',170,'g',['dairy'],'yogurt'],['Maçã','Apple',1,'un',[],''],['Nozes','Walnuts',15,'g',['nuts'],'']]},
    {ref:260,items:[['Pão integral','Wholegrain bread',1,'fatias',['gluten'],'bread'],['Queijo fresco','Fresh cheese',60,'g',['dairy'],'cheese'],['Fiambre de peru','Turkey ham',2,'fatias',['meat'],'turkey']]},
    {ref:240,items:[['Batido de proteína (whey)','Protein shake (whey)',30,'g',['dairy'],'whey'],['Banana','Banana',1,'un',[],'banana']]},
    {ref:230,items:[['Húmus','Hummus',60,'g',[],'chickpeas'],['Palitos de cenoura e pepino','Carrot and cucumber sticks',150,'g',[],''],['Tostas de arroz','Rice cakes',2,'un',[],'rice']]},
    {ref:220,items:[['Tostas de arroz','Rice cakes',2,'un',[],'rice'],['Abacate','Avocado',50,'g',[],'avocado'],['Pera','Pear',1,'un',[],'']]}
  ],
  supper:[
    {ref:150,items:[['Queijo fresco batido','Quark / cottage cheese',150,'g',['dairy'],'cheese'],['Canela','Cinnamon',1,'q.b.',[],'']]},
    {ref:150,items:[['Iogurte de soja natural','Plain soy yoghurt',150,'g',['soy'],'yogurt'],['Sementes de chia','Chia seeds',10,'g',[],'']]},
    {ref:140,items:[['Chá sem açúcar','Unsweetened tea',1,'chávena',[],''],['Amêndoas','Almonds',15,'g',['nuts'],''],['Kiwi','Kiwi',1,'un',[],'']]}
  ]
};
const MP_SUB={
  dairy:{lactose:{Leite:['Leite sem lactose','Lactose-free milk'],'Iogurte grego natural':['Iogurte grego sem lactose','Lactose-free Greek yoghurt'],'Iogurte natural':['Iogurte sem lactose','Lactose-free yoghurt'],'Queijo fresco':['Queijo fresco sem lactose','Lactose-free fresh cheese'],'Queijo fresco batido':['Queijo fresco batido sem lactose','Lactose-free quark'],'Batido de proteína (whey)':['Whey isolada (quase sem lactose)','Whey isolate (very low lactose)']},
         vegan:{Leite:['Bebida de soja','Soy drink'],'Iogurte grego natural':['Iogurte de soja natural','Plain soy yoghurt'],'Iogurte natural':['Iogurte de soja natural','Plain soy yoghurt'],'Queijo fresco':['Abacate esmagado','Mashed avocado'],'Queijo fresco batido':['Iogurte de soja natural','Plain soy yoghurt'],'Batido de proteína (whey)':['Proteína de ervilha em pó','Pea protein powder']}},
  gluten:{'Flocos de aveia':['Aveia certificada sem glúten','Certified gluten-free oats'],'Pão integral':['Pão sem glúten','Gluten-free bread'],Granola:['Granola sem glúten','Gluten-free granola']},
  nuts:{Nozes:['Sementes de abóbora','Pumpkin seeds'],Amêndoas:['Sementes de girassol','Sunflower seeds'],Granola:['Flocos de milho sem açúcar','Unsweetened corn flakes']},
  peanut:{'Manteiga de amendoim':['Creme de sementes de girassol','Sunflower seed butter']},
  egg:{'Ovos mexidos':['Tofu mexido','Tofu scramble']},
  meat:{'Fiambre de peru':['Húmus','Hummus',40,'g']}
};
function mpBanned(r){
  const b=new Set(r.allergies);
  if(r.diet.includes('vegan'))['meat','fish','shellfish','egg'].forEach(x=>b.add(x));
  if(r.diet.includes('vegetarian'))['meat','fish','shellfish'].forEach(x=>b.add(x));
  if(r.diet.includes('pescatarian')||r.diet.includes('nomeat'))b.add('meat');
  if(r.dislikes.includes('fish'))b.add('fish');
  if(r.dislikes.includes('egg'))b.add('egg');
  if(r.dislikes.includes('shellfish'))b.add('shellfish');
  if(r.allergies.includes('fish'))b.add('fish');
  return b;
}
function mpSmallMeal(kind,kcal,r,banned,idx){
  const vegan=r.diet.includes('vegan'),noDairy=vegan||r.diet.includes('lactose');
  const options=MP_SMALL[kind].map(o=>{
    let ok=true;
    const items=o.items.map(([pt,en,q,u,tags,key])=>{
      let name=[pt,en];
      if(tags.includes('dairy')&&noDairy){const s=MP_SUB.dairy[vegan?'vegan':'lactose'][pt];if(s)name=s;else ok=false;}
      if(tags.includes('gluten')&&r.diet.includes('gluten')){const s=MP_SUB.gluten[pt];if(s)name=s;else ok=false;}
      if(tags.includes('nuts')&&(banned.has('nuts'))){const s=MP_SUB.nuts[pt];if(s)name=s;else ok=false;}
      if(tags.includes('peanut')&&(banned.has('peanut')||banned.has('nuts'))){const s=MP_SUB.peanut[pt];if(s)name=s;else ok=false;}
      if(tags.includes('egg')&&banned.has('egg')){const s=MP_SUB.egg[pt];if(s&&!banned.has('soy'))name=s;else ok=false;}
      if(tags.includes('meat')&&banned.has('meat')){const s=MP_SUB.meat[pt];if(s){name=s;if(s[2]){q=s[2];u=s[3];}}else ok=false;}
      if(tags.includes('soy')&&banned.has('soy'))ok=false;
      if(key&&r.dislikes.includes(key))ok=false;
      return {name,q,u};
    });
    return ok?{ref:o.ref,items}:null;
  }).filter(Boolean);
  if(!options.length)return [];
  const pick=[options[idx%options.length],options[(idx+1)%options.length]].filter((o,i,a)=>a.indexOf(o)===i);
  return pick.map(o=>{const f=kcal/o.ref;return {kcal:Math.round(kcal/10)*10,items:o.items.map(it=>({name:SG.L(it.name[0],it.name[1]),amount:mpAmount(it.q*f,it.u)}))};});
}
function mpAmount(q,u){
  const units={un:['un.','pc'],fatias:['fatia(s)','slice(s)'],'q.b.':['q.b.','to taste'],'chávena':['chávena','cup']};
  if(u==='g'||u==='ml')return mpRound(q,5)+' '+u;
  if(u==='q.b.')return SG.L('q.b.','to taste');
  if(u==='chávena')return '1 '+SG.L('chávena','cup');
  const n=u==='fatias'?Math.max(1,Math.round(q*2)/2):Math.max(1,Math.round(q));return mpFmt(n)+' '+SG.L(units[u][0],units[u][1]);
}
function mpMainMeal(kcal,protein,r,banned,idx){
  let prots=MP_PROT.filter(p=>!p.t.some(t=>banned.has(t))&&!r.dislikes.includes(p.k)&&!(p.k==='chicken'&&r.dislikes.includes('meat')));
  if(r.diet.includes('vegan'))prots=prots.filter(p=>!p.t.includes('egg'));
  if(!prots.length)prots=MP_PROT.filter(p=>['lentils','chickpeas'].includes(p.k));
  const carbs=MP_CARB.filter(c=>!r.dislikes.includes(c.k));
  const vegs=MP_VEG.filter(v=>!v[2]||!r.dislikes.includes(v[2]));
  const out=[];
  for(let o=0;o<2;o++){
    const p=prots[(idx*2+o)%prots.length],c=carbs[(idx*2+o+1)%carbs.length],v=vegs[(idx+o)%vegs.length];
    const plantOnly=p.n[0]<12;
    let pg=mpRound(Math.min(plantOnly?350:250,protein*0.9/(p.n[0]/100)),10);
    let left=kcal-pg*p.n[3]/100-60-45;
    let cg=mpRound(Math.min(400,Math.max(plantOnly?40:60,left/(c.n[3]/100))),10);
    const cName=c.t.includes('gluten')&&r.diet.includes('gluten')?c.alt.gluten:[c.pt,c.en];
    const items=[{name:SG.L(p.pt,p.en),amount:pg+' g'},{name:SG.L(cName[0],cName[1]),amount:SG.L(`${cg} g (cozido)`,`${cg} g (cooked)`)},{name:SG.L(v[0],v[1]),amount:'200 g'},{name:SG.L('Azeite','Olive oil'),amount:'5 ml'}];
    if(r.diet.includes('vegan')&&plantOnly)items.push({name:SG.L('Sementes de abóbora','Pumpkin seeds'),amount:'15 g'});
    out.push({kcal:Math.round(kcal/10)*10,items});
  }
  return out;
}
function mpNutrition(r,met){
  const meals=r.meals||(r.goal==='gain'?5:4);
  const layouts={3:[['breakfast',.3],['lunch',.4],['dinner',.3]],4:[['breakfast',.25],['lunch',.35],['snack',.15],['dinner',.25]],5:[['breakfast',.22],['snack',.1],['lunch',.3],['snack',.13],['dinner',.25]],6:[['breakfast',.2],['snack',.1],['lunch',.28],['snack',.12],['dinner',.22],['supper',.08]]};
  const names={breakfast:['Pequeno-almoço','Breakfast'],lunch:['Almoço','Lunch'],dinner:['Jantar','Dinner'],snack:['Lanche','Snack'],supper:['Ceia','Late snack']};
  const times={3:['08:00','13:00','20:00'],4:['08:00','13:00','16:30','20:00'],5:['07:30','10:30','13:00','16:30','20:00'],6:['07:30','10:30','13:00','16:30','19:30','22:00']}[meals];
  const banned=mpBanned(r);let snackIdx=0;
  return layouts[meals].map(([kind,f],i)=>{
    const kcal=met.kcal*f;
    let label=SG.L(...names[kind]);
    if(kind==='snack'&&i<2)label=SG.L('Meio da manhã','Mid-morning');
    const options=kind==='lunch'||kind==='dinner'?mpMainMeal(kcal,met.protein*f,r,banned,kind==='lunch'?0:1):mpSmallMeal(kind,kcal,r,banned,kind==='snack'?snackIdx++*2:0);
    return {label,time:times[i],kcal:Math.round(kcal/10)*10,options};
  });
}

/* ---------- Construção do plano ---------- */
function mpBuild(profile,goalText,override,where){
  const parsed=mpParse(goalText,profile);
  const r={...parsed};
  if(where&&where.place){r.place=where.place;r.equipment=[...new Set([...(where.equipment||[]).filter(x=>x!=='none'&&x!=='mat'),...(where.place==='gym'?[]:r.equipment)])];if(where.place==='gym')r.equipment=[];}
  if(override)r.goal=override;
  const warnings=[];
  const bmi=profile.weight/((profile.height/100)**2);
  if(!r.days)r.days=r.goal==='gain'||r.goal==='strength'?4:3;
  if(!r.minutes)r.minutes=r.level==='advanced'?60:45;
  if(!r.level)r.level='beginner';
  if(r.goal==='lose'&&bmi<18.5){r.goal='health';warnings.push(mpL('O teu IMC já está abaixo do recomendado, por isso não criámos um défice calórico. O plano foca-se em saúde e força.','Your BMI is already below the recommended range, so no calorie deficit was applied. The plan focuses on health and strength.'));}
  if(profile.age<18)warnings.push(mpL('Tens menos de 18 anos: treina com acompanhamento de um adulto ou treinador e evita dietas restritivas.','You are under 18: train with a coach or adult supervising and avoid restrictive diets.'));
  if(r.injuries.length)warnings.push(mpL('Retirámos exercícios que costumam agravar as zonas que referiste. Se houver dor, para e fala com um fisioterapeuta.','We removed exercises that commonly aggravate the areas you mentioned. If anything hurts, stop and see a physiotherapist.'));
  const met=mpMetrics(profile,r.goal,r.days);
  let eta=null;
  if(r.target){const diff=r.target-profile.weight;const rate=diff<0?0.5:0.25;eta=Math.ceil(Math.abs(diff)/rate);if(Math.abs(diff)<0.5)eta=null;
    if(diff<0&&r.target/((profile.height/100)**2)<18.5)warnings.push(mpL('O peso-alvo indicado fica abaixo de um IMC saudável. Recomendamos falar com um profissional de saúde.','Your target weight falls below a healthy BMI. We recommend talking to a health professional.'));}
  return {r,met,eta,warnings,training:mpTraining(r,profile),nutrition:mpNutrition(r,met)};
}

/* ---------- Etiquetas ---------- */
const MP_LABEL={
  goal:{lose:['Perder peso','Lose weight'],gain:['Ganhar massa muscular','Build muscle'],strength:['Ganhar força','Get stronger'],endurance:['Melhorar a resistência','Improve endurance'],tone:['Tonificar','Tone up'],health:['Saúde e bem-estar','Health & wellbeing']},
  level:{beginner:['Iniciante','Beginner'],intermediate:['Intermédio','Intermediate'],advanced:['Avançado','Advanced']},
  place:{gym:['Ginásio','Gym'],home:['Casa','Home'],hybrid:['Ginásio + casa','Gym + home']},
  equipment:{d:['halteres','dumbbells'],k:['kettlebell','kettlebell'],b:['elásticos','bands'],p:['barra de elevações','pull-up bar'],bench:['banco','bench'],rope:['corda','jump rope'],bike:['bicicleta','bike']},
  focus:{legs:['pernas','legs'],glutes:['glúteos','glutes'],arms:['braços','arms'],abs:['abdominais','abs'],back:['costas','back'],chest:['peito','chest'],shoulders:['ombros','shoulders'],full:['corpo inteiro','full body']},
  injury:{knee:['joelho','knee'],back:['costas','back'],shoulder:['ombro','shoulder'],wrist:['pulso','wrist'],ankle:['tornozelo','ankle']},
  diet:{vegan:['Vegano','Vegan'],vegetarian:['Vegetariano','Vegetarian'],pescatarian:['Pescetariano','Pescatarian'],lactose:['Sem lactose','Lactose-free'],gluten:['Sem glúten','Gluten-free'],nomeat:['Sem carne','No meat']},
  allergy:{nuts:['frutos secos','tree nuts'],peanut:['amendoim','peanuts'],shellfish:['marisco','shellfish'],fish:['peixe','fish'],egg:['ovo','egg'],soy:['soja','soy'],dairy:['leite','milk']},
  dislike:{fish:['peixe','fish'],meat:['carne','meat'],chicken:['frango','chicken'],egg:['ovos','eggs'],tuna:['atum','tuna'],salmon:['salmão','salmon'],tofu:['tofu','tofu'],milk:['leite','milk'],yogurt:['iogurte','yoghurt'],cheese:['queijo','cheese'],oats:['aveia','oats'],banana:['banana','banana'],broccoli:['brócolos','broccoli'],rice:['arroz','rice'],pasta:['massa','pasta'],sweetpotato:['batata-doce','sweet potato'],potato:['batata','potato'],lentils:['lentilhas','lentils'],chickpeas:['grão','chickpeas'],avocado:['abacate','avocado'],turkey:['peru','turkey'],beef:['vaca','beef'],quinoa:['quinoa','quinoa'],shellfish:['marisco','shellfish'],hake:['pescada','hake'],peanut:['manteiga de amendoim','peanut butter'],whey:['batidos de proteína','protein shakes'],mushroom:['cogumelos','mushrooms']}
};
const mpLab=(group,key)=>{const v=MP_LABEL[group][key];return v?SG.L(v[0],v[1]):key;};
function mpChips(r,profile,showDefaults=true){
  const c=[];const chip=(label,value,tone='')=>c.push(`<span class="mp-chip ${tone}"><small>${label}</small>${value}</span>`);
  chip(mpL('Objetivo','Goal'),mpLab('goal',r.goal)+(r.detected===false?' *':''),'pink');
  if(r.goals&&r.goals.length>1)chip(mpL('Também','Also'),r.goals.slice(1).map(g=>mpLab('goal',g)).join(', '));
  if(r.target)chip(mpL('Peso-alvo','Target weight'),mpFmt(r.target)+' kg');
  if(r.weeks)chip(mpL('Prazo','Timeframe'),Math.round(r.weeks)+' '+mpL('semanas','weeks'));
  if(r.days||showDefaults)chip(mpL('Treinos','Workouts'),(r.days||'—')+' '+mpL('por semana','per week'));
  if(r.minutes)chip(mpL('Duração','Duration'),r.minutes+' min');
  chip(mpL('Local','Where'),mpLab('place',r.place)+(r.place!=='gym'?' · '+(r.equipment.length?r.equipment.map(e=>mpLab('equipment',e)).join(', '):mpL('peso corporal','bodyweight')):''));
  if(r.level)chip(mpL('Nível','Level'),mpLab('level',r.level));
  if(r.focus.length)chip(mpL('Foco','Focus'),r.focus.map(f=>mpLab('focus',f)).join(', '));
  if(r.injuries.length)chip(mpL('Cuidado com','Careful with'),r.injuries.map(i=>mpLab('injury',i)).join(', '),'warn');
  if(r.diet.length)chip(mpL('Alimentação','Diet'),r.diet.map(d=>mpLab('diet',d)).join(', '),'green');
  if(r.allergies.length)chip(mpL('Alergias','Allergies'),r.allergies.map(a=>mpLab('allergy',a)).join(', '),'warn');
  if(r.dislikes.length)chip(mpL('Não gostas de','You dislike'),r.dislikes.map(d=>mpLab('dislike',d)).join(', '));
  if(r.meals)chip(mpL('Refeições','Meals'),r.meals+' '+mpL('por dia','per day'));
  return c.join('');
}

/* ---------- Ecrãs ---------- */
function mpAppOnly(){const u=state?.user;if(!u||u.role==='admin')return false;const p=(state.plans||[]).find(x=>x.id===u.plan);return !!(p&&p.appOnly)||u.plan==='app';}
function mpWhere(saved){const w=saved.where;if(!w)return w;return mpAppOnly()?{...w,place:'home'}:w;}
function mpPlanNote(){return mpAppOnly()?`<div class="mp-plan-note">${icon('crown')}<div><b>${mpL('Plano Mensal','Monthly plan')}</b> — ${mpL('inclui o plano alimentar e o plano de treino em casa. Para teres treinos no ginásio, muda para o Essential, Premium ou Elite.','includes the meal plan and the home training plan. To get gym workouts, switch to Essential, Premium or Elite.')}<br><button class="link-btn" data-route="account">${mpL('Ver planos','See plans')}${icon('arrow')}</button></div></div>`:'';}
const MP_EQUIP=[['none','Nenhum (só peso corporal)','None (bodyweight only)'],['d','Halteres','Dumbbells'],['k','Kettlebell','Kettlebell'],['b','Elásticos','Resistance bands'],['p','Barra de elevações','Pull-up bar'],['bench','Banco','Bench'],['mat','Tapete','Mat'],['rope','Corda de saltar','Jump rope'],['bike','Bicicleta estática','Exercise bike']];
function mpWhereLabel(w){if(!w)return '';const eq=(w.equipment||[]).filter(x=>x!=='none'&&x!=='mat');return mpLab('place',w.place)+(w.place!=='gym'?' · '+(eq.length?eq.map(e=>mpLab('equipment',e)).join(', '):mpL('peso corporal','bodyweight')):'');}
const MP_EXAMPLES=[
  ['Quero perder 6 kg em 3 meses, treinar 3 vezes por semana no ginásio, 45 minutos. Sou iniciante.','I want to lose 6 kg in 3 months, train 3 times a week at the gym for 45 minutes. I am a beginner.'],
  ['Ganhar massa muscular nos braços e peito, 4 dias por semana, 60 min. Sou vegetariano.','Build muscle in my arms and chest, 4 days a week, 60 min. I am vegetarian.'],
  ['Tonificar pernas e glúteos em casa com halteres e elásticos, 30 minutos, sem lactose.','Tone my legs and glutes at home with dumbbells and bands, 30 minutes, lactose-free.'],
  ['Melhorar a resistência para correr 10 km. Tenho dores no joelho e não gosto de peixe.','Improve my endurance to run 10 km. I have knee pain and I don\'t like fish.']
];
function mpProgress(step){const steps=[mpL('Os teus dados','Your details'),mpL('Onde treinas','Where you train'),mpL('O teu objetivo','Your goal'),mpL('O teu plano','Your plan')];return `<div class="mp-steps" aria-label="${mpL('Progresso','Progress')}">${steps.map((s,i)=>`<div class="mp-step ${i<step?'done':''} ${i===step?'active':''}"><span>${i<step?icon('check'):i+1}</span>${s}</div>`).join('<i></i>')}</div><div class="mp-bar"><span style="width:${(step+1)/4*100}%"></span></div>`;}
function mpHeading(){return heading('My Plan<span class="pink">.</span>',mpL('Treino e alimentação à tua medida, criados a partir dos teus dados e do teu objetivo.','Training and nutrition built around your details and your goal.'),'',mpL('PLANO PERSONALIZADO','PERSONALISED PLAN'));}
function myPlanPage(){
  const saved=mpLoad();
  let step=MP.step||(saved.plan&&saved.where?'result':!saved.profile?'data':!saved.where?'place':'goal');
  if(step!=='data'&&!saved.profile)step='data';
  if((step==='goal'||step==='result')&&!saved.where)step='place';
  if(step==='result'&&!saved.goalText)step='goal';
  MP.step=step;
  const p=saved.profile||{};
  if(step==='data')return `<div data-no-translate>${mpHeading()}${mpProgress(0)}<section class="panel mp-card"><div class="mp-card-head"><span class="mp-num">01</span><div><h2>${mpL('Vamos conhecer-te','Let\'s get to know you')}</h2><p class="panel-subtitle">${mpL('Usamos estes dados para calcular as tuas calorias, macronutrientes e a carga de treino.','We use these details to calculate your calories, macros and training load.')}</p></div></div><form data-form="myplan.data"><div class="form-grid mp-grid">
    ${field(mpL('Altura (cm)','Height (cm)'),'height',p.height||'','number','required min="120" max="230" step="1" inputmode="numeric" placeholder="175"')}
    ${field(mpL('Peso (kg)','Weight (kg)'),'weight',p.weight||'','number','required min="30" max="300" step="0.1" inputmode="decimal" placeholder="72"')}
    ${field(mpL('Idade','Age'),'age',p.age||'','number','required min="13" max="99" step="1" inputmode="numeric" placeholder="25"')}
    <fieldset class="field mp-sex"><legend>${mpL('Sexo (para o cálculo das calorias)','Sex (for the calorie calculation)')}</legend><label><input type="radio" name="sex" value="m" ${p.sex!=='f'?'checked':''}><span>${mpL('Masculino','Male')}</span></label><label><input type="radio" name="sex" value="f" ${p.sex==='f'?'checked':''}><span>${mpL('Feminino','Female')}</span></label></fieldset>
    </div><div class="form-actions"><button class="btn btn-primary" type="submit">${mpL('Continuar','Continue')}${icon('arrow')}</button></div></form></section></div>`;
  if(step==='place'){const appOnly=mpAppOnly();const w={...(saved.where||{place:appOnly?'home':'gym',equipment:[]})};if(appOnly)w.place='home';const opts=[['gym','dumbbell',mpL('Ginásio','Gym'),mpL('Máquinas, barras e halteres à disposição.','Machines, barbells and dumbbells available.')],['home','user',mpL('Casa','Home'),mpL('Treinos com o teu peso corporal ou o material que tens.','Bodyweight or the equipment you own.')],['hybrid','arrow',mpL('Ambos','Both'),mpL('Alterna dias no ginásio com dias em casa.','Alternate gym days with home days.')]];
    return `<div data-no-translate>${mpHeading()}${mpProgress(1)}<section class="panel mp-card"><div class="mp-card-head"><span class="mp-num">02</span><div><h2>${mpL('Onde vais treinar?','Where will you train?')}</h2><p class="panel-subtitle">${mpL('O plano de treino é montado com os exercícios que consegues fazer nesse local.','Your training plan is built with exercises you can do there.')}</p></div></div>
    ${mpPlanNote()}<form data-form="myplan.place" class="mp-place-form"><div class="mp-places">${opts.map(([v,ic,t,d])=>{const locked=appOnly&&v!=='home';return `<label class="mp-place ${locked?'locked':''}"><input type="radio" name="place" value="${v}" ${w.place===v?'checked':''} ${locked?'disabled':''}><span>${icon(ic)}<b>${t}</b><small>${locked?mpL('Não incluído no plano Mensal.','Not included in the Monthly plan.'):d}</small></span></label>`;}).join('')}</div>
    <fieldset class="mp-equip"><legend>${mpL('Que material tens em casa?','What equipment do you have at home?')}</legend><div class="mp-equip-grid">${MP_EQUIP.map(([v,pt,en])=>`<label><input type="checkbox" name="equip" value="${v}" ${(w.equipment||[]).includes(v)?'checked':''}><span>${SG.L(pt,en)}</span></label>`).join('')}</div><p class="small muted">${mpL('Se não tiveres nada, usamos apenas o peso corporal.','If you have nothing, we will use bodyweight only.')}</p></fieldset>
    <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="mp-edit-data">${mpL('Voltar','Back')}</button><button class="btn btn-primary" type="submit">${mpL('Continuar','Continue')}${icon('arrow')}</button></div></form></section></div>`;}
  if(step==='goal'){const bmi=p.weight/((p.height/100)**2);return `<div data-no-translate>${mpHeading()}${mpProgress(2)}<section class="panel mp-card"><div class="mp-card-head"><span class="mp-num">03</span><div><h2>${mpL('Qual é o teu objetivo?','What is your goal?')}</h2><p class="panel-subtitle">${mpL('Escreve à tua maneira. Podes referir quantos dias e minutos queres treinar, o teu nível, zonas a focar, lesões, alimentação, alergias ou alimentos de que não gostas.','Write it your own way. You can mention how many days and minutes you want to train, your level, areas to focus on, injuries, diet, allergies or foods you dislike.')}</p></div></div>
    <div class="mp-profile-line"><span>${p.height} cm</span><span>${mpFmt(p.weight)} kg</span><span>${p.age} ${mpL('anos','years')}</span><span>${mpL('IMC','BMI')} ${mpFmt(bmi)}</span><span>${mpWhereLabel(mpWhere(saved))}</span><button class="link-btn" data-action="mp-edit-place">${mpL('Mudar local','Change place')}${icon('arrow')}</button><button class="link-btn" data-action="mp-edit-data">${mpL('Editar dados','Edit details')}${icon('arrow')}</button></div>
    <form data-form="myplan.goal"><label class="field full">${mpL('O meu objetivo','My goal')}<textarea id="mp-goal" name="goal" required minlength="3" maxlength="1000" rows="4" placeholder="${e(SG.L(MP_EXAMPLES[0][0],MP_EXAMPLES[0][1]))}">${e(saved.goalText||'')}</textarea></label>
    <div class="mp-examples"><span class="small muted">${mpL('Experimenta um exemplo:','Try an example:')}</span>${MP_EXAMPLES.map((x,i)=>`<button type="button" class="mp-example" data-action="mp-example" data-id="${i}">${e(SG.L(x[0],x[1]))}</button>`).join('')}</div>
    <div class="mp-understood"><div class="eyebrow">${icon('bolt')} ${mpL('O que percebi','What I understood')}</div><div id="mp-preview" class="mp-chips">${mpPreview(saved.goalText||'',p,mpWhere(saved))}</div></div>
    <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="mp-edit-place">${mpL('Voltar','Back')}</button><button class="btn btn-primary" type="submit">${mpL('Criar o meu plano','Create my plan')}${icon('arrow')}</button></div></form></section></div>`;}
  /* resultado */
  const plan=mpBuild(p,saved.goalText,saved.override,mpWhere(saved));MP.override=saved.override||null;
  const {r,met,eta,warnings,training,nutrition}=plan;
  const bmi=met.bmi;
  return `<div data-no-translate>${mpHeading()}${mpProgress(3)}
  <section class="mp-hero"><div><span class="badge">${icon('bolt')} ${mpLab('goal',r.goal)}</span><h2>${mpL('O teu plano está pronto','Your plan is ready')}<span class="pink">.</span></h2><p class="mp-quote">“${e(saved.goalText)}”</p><div class="mp-chips">${mpChips(r,p)}</div>${r.detected===false?`<p class="small muted" style="margin-top:12px">* ${mpL('Não identifiquei um objetivo claro, por isso assumi saúde e bem-estar. Podes ajustar ao lado.','I could not identify a clear goal, so I assumed health & wellbeing. You can adjust it here.')}</p>`:''}</div>
  <div class="mp-hero-side"><label class="field">${mpL('Ajustar objetivo','Adjust goal')}<select id="mp-override">${Object.keys(MP_LABEL.goal).map(g=>`<option value="${g}" ${g===r.goal?'selected':''}>${mpLab('goal',g)}</option>`).join('')}</select></label><div class="mp-hero-actions">${button(mpL('Mudar objetivo','Change goal'),'mp-edit-goal','',false,'message')}${button(mpL('Mudar local de treino','Change where I train'),'mp-edit-place','',false,'pin')}${button(mpL('Editar dados','Edit details'),'mp-edit-data','',false,'user')}${button(mpL('Imprimir','Print'),'mp-print','',false,'download')}</div></div></section>
  ${mpPlanNote()}${warnings.map(w=>`<div class="notice-box">${icon('info')}<span>${w}</span></div>`).join('')}
  <div class="metric-grid">${metric(mpL('Calorias diárias','Daily calories'),`${met.kcal}<small> kcal</small>`,mpL(`Manutenção ≈ ${met.tdee} kcal`,`Maintenance ≈ ${met.tdee} kcal`),'flame',true)}${metric(mpL('Proteína','Protein'),`${met.protein}<small> g</small>`,`${mpL('Hidratos','Carbs')} ${met.carbs} g · ${mpL('Gordura','Fat')} ${met.fat} g`,'bolt')}${metric(mpL('IMC','BMI'),mpFmt(bmi),mpBmiLabel(bmi),'scale')}${metric(mpL('Água','Water'),`${mpFmt(met.water)}<small> L</small>`,eta?mpL(`Meta em ≈ ${eta} semanas`,`Target in ≈ ${eta} weeks`):mpL('Por dia, mais nos dias de treino','Per day, more on training days'),'heart')}</div>
  <div class="mp-macros" role="img" aria-label="${mpL('Distribuição de macronutrientes','Macronutrient split')}">${[['p',met.protein*4,mpL('Proteína','Protein')],['c',met.carbs*4,mpL('Hidratos','Carbs')],['f',met.fat*9,mpL('Gordura','Fat')]].map(([k,v,l])=>`<span class="mp-m-${k}" style="flex:${v}"><b>${l}</b> ${Math.round(v/met.kcal*100)}%</span>`).join('')}</div>
  <div class="section-header"><h2>${icon('dumbbell')} ${mpL('Plano de treino semanal','Weekly training plan')}</h2><span class="badge neutral">${r.days} ${mpL('dias','days')} · ${r.minutes} min · ${mpLab('level',r.level)}</span></div>
  <div class="mp-week">${training.map((d,i)=>`<article class="panel mp-day ${d.cardio?'cardio':''}"><div class="mp-day-top"><span class="mp-day-name">${d.day}</span><span class="badge ${d.cardio?'success':'neutral'}">${d.where}</span></div><h3>${String.fromCharCode(65+i)} · ${d.title}</h3><ol>${d.items.map(x=>`<li class="${x.finisher?'finisher':''} ${x.focus?'focus':''}"><span>${e(x.name)}${x.focus?` <em>${mpL('foco','focus')}</em>`:''}</span><small>${x.sets} ${x.reps?'· '+x.reps:''}${x.rest?' · '+mpL('descanso','rest')+' '+x.rest:''}</small></li>`).join('')}</ol></article>`).join('')}</div>
  <section class="panel vertical-space mp-tips">${panelTitle(mpL('Como progredir','How to progress'))}<div class="three-cols"><div><h3 class="pink">${mpL('Sobrecarga progressiva','Progressive overload')}</h3><p class="small muted">${mpL('Quando completares todas as séries no topo das repetições, aumenta ligeiramente o peso ou as repetições.','When you hit the top of the rep range on every set, add a little weight or a few reps.')}</p></div><div><h3 class="pink">${mpL('Aquecimento','Warm-up')}</h3><p class="small muted">${mpL('5–10 minutos de cardio leve e mobilidade, mais 1–2 séries leves do primeiro exercício.','5–10 minutes of easy cardio and mobility, plus 1–2 light sets of your first exercise.')}</p></div><div><h3 class="pink">${mpL('Recuperação','Recovery')}</h3><p class="small muted">${mpL('Dorme 7–9 horas e deixa pelo menos um dia de descanso entre treinos do mesmo grupo muscular.','Sleep 7–9 hours and leave at least one rest day between sessions for the same muscle group.')}</p></div></div></section>
  <div class="section-header"><h2>${icon('flame')} ${mpL('Plano alimentar','Meal plan')}</h2><span class="badge neutral">${met.kcal} kcal · ${nutrition.length} ${mpL('refeições','meals')}</span></div>
  <div class="mp-meals">${nutrition.map(m=>`<article class="panel mp-meal"><div class="mp-meal-top"><div><span class="mp-time">${m.time}</span><h3>${m.label}</h3></div><span class="chip">≈ ${m.kcal} kcal</span></div>${m.options.map((o,i)=>`<div class="mp-option"><span class="mp-opt-label">${mpL('Opção','Option')} ${String.fromCharCode(65+i)}</span><ul>${o.items.map(it=>`<li><span>${e(it.name)}</span><b>${e(it.amount)}</b></li>`).join('')}</ul></div>`).join('')||`<p class="small muted">${mpL('Sem opções compatíveis — fala com um nutricionista.','No compatible options — please talk to a nutritionist.')}</p>`}</article>`).join('')}</div>
  <div class="notice-box vertical-space">${icon('shield')}<span>${mpL('Plano orientativo gerado automaticamente. Não substitui o acompanhamento de um médico, nutricionista ou personal trainer, sobretudo se tiveres alguma condição de saúde.','This plan is generated automatically as general guidance. It does not replace a doctor, dietitian or personal trainer, especially if you have a health condition.')}</span></div></div>`;
}
function mpPreview(text,profile,where){
  if(!String(text).trim())return `<span class="small muted">${mpL('Começa a escrever e vou mostrando aqui o que entendi.','Start typing and I will show what I understood here.')}</span>`;
  const r=mpParse(text,profile);
  if(where&&where.place){r.place=where.place;r.equipment=where.place==='gym'?[]:[...new Set([...(where.equipment||[]).filter(x=>x!=='none'&&x!=='mat'),...r.equipment])];}
  return mpChips(r,profile,false)+(r.detected===false?`<span class="small muted">${mpL('Ainda não percebi o objetivo principal (ex.: perder peso, ganhar massa, força, resistência, tonificar, saúde).','I have not spotted the main goal yet (e.g. lose weight, build muscle, strength, endurance, tone, health).')}</span>`:'');
}
function mpHandleAction(action,el){
  const saved=mpLoad();
  switch(action){
    case 'mp-example':{const t=$('#mp-goal');const x=MP_EXAMPLES[Number(el.dataset.id)];t.value=SG.L(x[0],x[1]);t.dispatchEvent(new Event('input',{bubbles:true}));t.focus();return true;}
    case 'mp-edit-data':MP.step='data';render();return true;
    case 'mp-edit-goal':MP.step='goal';render();return true;
    case 'mp-edit-place':MP.step='place';render();return true;
    case 'mp-print':window.print();return true;
  }
  return false;
}
function mpHandleSubmit(action,p,form){
  const saved=mpLoad();
  if(action==='myplan.place'){
    const place=mpAppOnly()?'home':['gym','home','hybrid'].includes(p.place)?p.place:'gym';
    const equipment=place==='gym'?[]:new FormData(form).getAll('equip').filter(x=>MP_EQUIP.some(e=>e[0]===x));
    mpSave({...saved,where:{place,equipment},plan:saved.plan&&!!saved.goalText});MP.step=saved.goalText&&saved.plan?'result':'goal';render();window.scrollTo({top:0,behavior:'instant'});
    if(MP.step==='result')toast(mpL('Plano atualizado para o novo local de treino.','Plan updated for your new training place.'));return true;
  }
  if(action==='myplan.data'){
    const profile={height:mpNum(p.height),weight:mpNum(p.weight),age:mpNum(p.age),sex:p.sex==='f'?'f':'m'};
    if(!(profile.height>=120&&profile.height<=230&&profile.weight>=30&&profile.weight<=300&&profile.age>=13&&profile.age<=99))throw new Error(mpL('Confirma a altura, o peso e a idade.','Please check your height, weight and age.'));
    mpSave({...saved,profile,plan:false});MP.step=saved.where?'goal':'place';render();window.scrollTo({top:0,behavior:'instant'});return true;
  }
  if(action==='myplan.goal'){
    const goalText=String(p.goal||'').trim();
    if(goalText.length<3)throw new Error(mpL('Descreve o teu objetivo.','Describe your goal.'));
    mpSave({...saved,goalText,override:null,plan:true,createdAt:new Date().toISOString()});MP.step='result';render();window.scrollTo({top:0,behavior:'instant'});toast(mpL('O teu plano está pronto!','Your plan is ready!'));return true;
  }
  return false;
}
function mpOverride(value){const saved=mpLoad();mpSave({...saved,override:value});render();}
