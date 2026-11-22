/* StrongGym — Leitor de comida (apenas na app instalada no telemóvel)
   Tiras uma foto da refeição, indicas os ingredientes e as quantidades e a app calcula
   calorias, proteína, hidratos, açúcares, gordura, gordura saturada, fibra e sal.
   Os valores vêm de uma tabela nutricional local (valores médios por 100 g). */
'use strict';
const FD={photo:null,photoData:null,result:null,text:''};
const fdL=(pt,en)=>SG.L(pt,en);
const fdKey=()=>'stronggym-food-'+(state?.user?.id||'guest');
function fdLoad(){try{return JSON.parse(localStorage.getItem(fdKey()))||[];}catch(_){return [];}}
function fdSave(list){try{localStorage.setItem(fdKey(),JSON.stringify(list.slice(0,30)));return true;}catch(_){try{localStorage.setItem(fdKey(),JSON.stringify(list.slice(0,10).map(x=>({...x,photo:null}))));return true;}catch(__){return false;}}}
const fdNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[-‐–]/g,' ').replace(/\s+/g,' ').trim();
const fdFmt=(n,d=1)=>new Intl.NumberFormat(SG.locale(),{maximumFractionDigits:d}).format(n);

/* ---------- Tabela nutricional ----------
   n: [kcal, proteína, hidratos, açúcares, gordura, saturada, fibra, sódio(mg)] por 100 g/ml
   u: gramas por unidade (ovo, fruta, fatia…); a: sinónimos (PT e EN, sem acentos) */
const FD_DB=[
 ['Peito de frango','Chicken breast',[165,31,0,0,3.6,1,0,74],150,'peito de frango|frango|galinha|chicken breast|chicken'],
 ['Peru','Turkey',[135,29,0,0,2,0.6,0,60],120,'peito de peru|peru|turkey'],
 ['Carne de vaca','Beef',[217,26,0,0,12,4.8,0,60],150,'carne de vaca|vaca|bife|novilho|beef|steak'],
 ['Carne picada','Minced beef',[250,26,0,0,15,6,0,70],0,'carne picada|picado|mince|minced beef|ground beef'],
 ['Porco','Pork',[242,27,0,0,14,5,0,62],150,'lombo de porco|porco|febras?|pork|pork loin'],
 ['Fiambre','Ham',[115,18,1.5,1,4,1.3,0,1100],15,'fiambre|presunto|ham'],
 ['Chouriço','Chorizo',[455,24,2,1,38,14,0,1240],0,'chourico|chorizo'],
 ['Bacon','Bacon',[541,37,1.4,0,42,14,0,1717],10,'bacon|toucinho'],
 ['Salsicha','Sausage',[300,12,2,1,27,10,0,900],45,'salsichas?|sausages?|hot dog'],
 ['Hambúrguer de carne','Beef burger patty',[254,17,1,0,20,8,0,75],110,'hamburguer de carne|beef patty|burger patty'],
 ['Hambúrguer (completo)','Burger (with bun)',[295,17,24,5,14,5.5,1.5,520],220,'hamburguer|burger|cheeseburger'],
 ['Salmão','Salmon',[208,20,0,0,13,3,0,59],150,'salmao|salmon'],
 ['Atum','Tuna',[116,26,0,0,1,0.3,0,250],80,'atum|tuna'],
 ['Pescada','Hake',[82,18,0,0,1,0.2,0,80],150,'pescada|peixe branco|hake|white fish|fish|peixe'],
 ['Bacalhau','Cod',[105,23,0,0,0.9,0.2,0,300],150,'bacalhau|cod'],
 ['Sardinha','Sardines',[208,25,0,0,11,1.5,0,307],50,'sardinhas?|sardines?'],
 ['Camarão','Shrimp',[99,24,0.2,0,0.3,0.1,0,111],0,'camarao|camaroes|gambas|shrimps?|prawns?'],
 ['Ovo','Egg',[143,12.6,0.7,0.4,9.5,3.1,0,142],55,'ovos?|eggs?|omelete|omelette|ovos mexidos|scrambled eggs'],
 ['Clara de ovo','Egg white',[52,11,0.7,0.7,0.2,0,0,166],33,'claras?( de ovo)?|egg whites?'],
 ['Tofu','Tofu',[144,15,3,0.6,8,1.2,2,14],0,'tofu'],
 ['Tempeh','Tempeh',[192,19,9,0,11,2.2,0,9],0,'tempeh'],
 ['Seitan','Seitan',[140,25,4,0,2,0.3,1,300],0,'seitan'],
 ['Lentilhas (cozidas)','Lentils (cooked)',[116,9,20,1.8,0.4,0.1,8,2],0,'lentilhas?|lentils?'],
 ['Grão-de-bico (cozido)','Chickpeas (cooked)',[164,8.9,27,4.8,2.6,0.3,7.6,7],0,'grao de bico|grao|chickpeas?|garbanzo'],
 ['Feijão (cozido)','Beans (cooked)',[127,8.7,23,0.3,0.5,0.1,6.4,2],0,'feijao preto|feijao encarnado|feijao|beans|kidney beans|black beans'],
 ['Arroz branco (cozido)','White rice (cooked)',[130,2.7,28,0.1,0.3,0.1,0.4,1],0,'arroz branco|arroz|rice|white rice'],
 ['Arroz integral (cozido)','Brown rice (cooked)',[111,2.6,23,0.4,0.9,0.2,1.8,5],0,'arroz integral|brown rice'],
 ['Massa (cozida)','Pasta (cooked)',[158,5.8,31,0.6,0.9,0.2,1.8,1],0,'massa|esparguete|macarrao|penne|fusilli|pasta|spaghetti|noodles'],
 ['Massa integral (cozida)','Wholewheat pasta (cooked)',[130,5,26,0.8,1,0.2,3.5,4],0,'massa integral|wholewheat pasta|whole wheat pasta'],
 ['Batata (cozida)','Potato (boiled)',[87,1.9,20,0.9,0.1,0,1.8,4],150,'batatas?|potato(es)?|pure|mashed potato'],
 ['Batata frita','French fries',[312,3.4,41,0.3,15,2.3,3.8,210],0,'batatas? fritas?|fries|french fries|chips'],
 ['Batata-doce','Sweet potato',[90,2,21,6.5,0.2,0,3.3,36],150,'batata doce|batatas doces|sweet potato(es)?'],
 ['Pão','Bread',[265,9,49,5,3.2,0.7,2.7,490],30,'pao|paes|carcaca|papo seco|baguete|bread|bun|roll'],
 ['Pão integral','Wholemeal bread',[247,13,41,6,3.4,0.7,7,450],35,'pao integral|pao de mistura|wholemeal bread|whole wheat bread|wholegrain bread'],
 ['Tostas de arroz','Rice cakes',[387,8,82,0.9,2.8,0.6,4,30],9,'tostas? de arroz|bolachas? de arroz|rice cakes?'],
 ['Aveia','Oats',[389,17,66,1,7,1.2,10.6,2],0,'flocos de aveia|aveia|papas de aveia|oats|oatmeal|porridge'],
 ['Cereais','Breakfast cereal',[357,7.5,84,10,0.4,0.1,3,500],0,'cereais|corn flakes|cornflakes|cereal'],
 ['Granola','Granola',[471,10,64,24,20,4,7,26],0,'granola|muesli'],
 ['Quinoa (cozida)','Quinoa (cooked)',[120,4.4,21,0.9,1.9,0.2,2.8,7],0,'quinoa'],
 ['Cuscuz (cozido)','Couscous (cooked)',[112,3.8,23,0.1,0.2,0,1.4,5],0,'cuscuz|couscous'],
 ['Tortilha / wrap','Tortilla wrap',[310,8,52,3,8,3,3,600],60,'tortilhas?|wraps?|tortillas?'],
 ['Pizza','Pizza',[266,11,33,3.6,10,4.5,2.3,600],110,'pizza'],
 ['Leite meio-gordo','Semi-skimmed milk',[46,3.3,4.8,4.8,1.6,1,0,44],250,'leite meio gordo|leite|milk|semi skimmed milk'],
 ['Leite magro','Skimmed milk',[35,3.4,5,5,0.1,0.1,0,44],250,'leite magro|skimmed milk|skim milk'],
 ['Bebida de soja','Soy drink',[33,3,1.8,1,1.8,0.3,0.6,50],250,'bebida de soja|leite de soja|soy milk|soy drink'],
 ['Bebida de aveia','Oat drink',[46,1,6.6,4,1.5,0.2,0.8,40],250,'bebida de aveia|leite de aveia|oat milk|oat drink'],
 ['Iogurte natural','Plain yoghurt',[61,3.5,4.7,4.7,3.3,2.1,0,46],125,'iogurtes?|yogh?urts?'],
 ['Iogurte grego','Greek yoghurt',[97,9,4,4,5,3.2,0,35],150,'iogurtes? gregos?|greek yogh?urts?'],
 ['Skyr','Skyr',[63,11,4,4,0.2,0.1,0,40],150,'skyr'],
 ['Queijo','Cheese',[357,25,0,0,28,18,0,700],20,'queijo flamengo|queijo|cheddar|cheese'],
 ['Queijo fresco','Fresh cheese',[165,11,3,3,12,8,0,300],65,'queijo fresco|requeijao|cottage|cottage cheese|fresh cheese'],
 ['Mozzarella','Mozzarella',[280,28,3,1,17,10,0,620],0,'mozzarella|mozarela'],
 ['Manteiga','Butter',[717,0.9,0.1,0.1,81,51,0,11],0,'manteiga|butter'],
 ['Azeite','Olive oil',[884,0,0,0,100,14,0,2],0,'azeite|olive oil'],
 ['Óleo','Vegetable oil',[884,0,0,0,100,7,0,0],0,'oleo|vegetable oil|sunflower oil|oil'],
 ['Maionese','Mayonnaise',[680,1,1,1,75,12,0,635],0,'maionese|mayonnaise|mayo'],
 ['Ketchup','Ketchup',[112,1.2,26,22,0.1,0,0.3,907],0,'ketchup'],
 ['Molho de soja','Soy sauce',[53,8,4.9,0.4,0.6,0.1,0.8,5493],0,'molho de soja|soja sauce|soy sauce'],
 ['Molho de tomate','Tomato sauce',[29,1.4,5,4,0.2,0,1.5,400],0,'molho de tomate|polpa de tomate|tomato sauce|passata'],
 ['Açúcar','Sugar',[387,0,100,100,0,0,0,1],0,'acucar|sugar'],
 ['Mel','Honey',[304,0.3,82,82,0,0,0.2,4],0,'mel|honey'],
 ['Manteiga de amendoim','Peanut butter',[588,25,20,9,50,10,6,17],0,'manteiga de amendoim|pasta de amendoim|peanut butter'],
 ['Amendoins','Peanuts',[567,26,16,4,49,7,8.5,18],0,'amendoins?|peanuts?'],
 ['Amêndoas','Almonds',[579,21,22,4.4,50,3.8,12.5,1],1.2,'amendoas?|almonds?'],
 ['Nozes','Walnuts',[654,15,14,2.6,65,6,6.7,2],0,'nozes|noz|walnuts?'],
 ['Cajus','Cashews',[553,18,30,6,44,8,3.3,12],0,'cajus?|cashews?'],
 ['Frutos secos','Mixed nuts',[607,20,21,4,54,7,7,5],0,'frutos secos|mixed nuts|nuts'],
 ['Sementes de chia','Chia seeds',[486,17,42,0,31,3.3,34,16],0,'sementes de chia|chia'],
 ['Chocolate de leite','Milk chocolate',[535,7.7,59,52,30,18,3.4,79],0,'chocolate de leite|chocolate|milk chocolate'],
 ['Chocolate negro','Dark chocolate',[598,7.8,46,24,43,24,11,20],0,'chocolate negro|chocolate preto|dark chocolate'],
 ['Banana','Banana',[89,1.1,23,12,0.3,0.1,2.6,1],120,'bananas?'],
 ['Maçã','Apple',[52,0.3,14,10,0.2,0,2.4,1],180,'macas?|apples?'],
 ['Laranja','Orange',[47,0.9,12,9,0.1,0,2.4,0],160,'laranjas?|oranges?'],
 ['Pera','Pear',[57,0.4,15,10,0.1,0,3.1,1],170,'peras?|pears?'],
 ['Morangos','Strawberries',[32,0.7,7.7,4.9,0.3,0,2,1],12,'morangos?|strawberr(y|ies)'],
 ['Frutos vermelhos','Berries',[57,0.7,14,10,0.3,0,2.4,1],0,'frutos vermelhos|mirtilos?|framboesas?|berries|blueberr(y|ies)|raspberr(y|ies)'],
 ['Uvas','Grapes',[69,0.7,18,16,0.2,0.1,0.9,2],5,'uvas?|grapes?'],
 ['Kiwi','Kiwi',[61,1.1,15,9,0.5,0,3,3],75,'kiwis?'],
 ['Manga','Mango',[60,0.8,15,14,0.4,0.1,1.6,1],200,'mangas?|mangos?|mangoes'],
 ['Ananás','Pineapple',[50,0.5,13,10,0.1,0,1.4,1],0,'ananas|abacaxi|pineapple'],
 ['Abacate','Avocado',[160,2,8.5,0.7,15,2.1,6.7,7],150,'abacates?|avocados?|guacamole'],
 ['Tomate','Tomato',[18,0.9,3.9,2.6,0.2,0,1.2,5],120,'tomates?|tomato(es)?|tomate cherry|cherry tomato(es)?'],
 ['Alface / salada verde','Lettuce / green salad',[15,1.4,2.9,0.8,0.2,0,1.3,28],0,'alface|salada verde|salada|rucula|lettuce|salad|rocket|arugula|mixed greens'],
 ['Brócolos','Broccoli',[35,2.4,7,1.4,0.4,0.1,3.3,41],0,'brocolos|brocolis|broccoli'],
 ['Cenoura','Carrot',[41,0.9,10,4.7,0.2,0,2.8,69],70,'cenouras?|carrots?'],
 ['Espinafres','Spinach',[23,2.9,3.6,0.4,0.4,0.1,2.2,79],0,'espinafres?|spinach'],
 ['Cebola','Onion',[40,1.1,9.3,4.2,0.1,0,1.7,4],110,'cebolas?|onions?'],
 ['Alho','Garlic',[149,6.4,33,1,0.5,0.1,2.1,17],4,'alho|dentes? de alho|garlic'],
 ['Pimento','Bell pepper',[26,1,6,4.2,0.3,0,2.1,4],150,'pimentos?|peppers?|bell peppers?'],
 ['Cogumelos','Mushrooms',[22,3.1,3.3,2,0.3,0,1,5],15,'cogumelos?|mushrooms?'],
 ['Pepino','Cucumber',[15,0.7,3.6,1.7,0.1,0,0.5,2],200,'pepinos?|cucumbers?'],
 ['Courgette','Courgette',[17,1.2,3.1,2.5,0.3,0.1,1,8],200,'curgete|courgettes?|zucchini'],
 ['Milho','Sweetcorn',[96,3.4,21,4.5,1.5,0.2,2.4,15],0,'milho|corn|sweetcorn'],
 ['Ervilhas','Peas',[81,5.4,14,5.7,0.4,0.1,5.1,5],0,'ervilhas?|peas'],
 ['Feijão-verde','Green beans',[31,1.8,7,3.3,0.2,0,2.7,6],0,'feijao verde|green beans'],
 ['Legumes variados','Mixed vegetables',[40,2,7,3,0.3,0,3,30],0,'legumes|vegetais|verduras|hortalicas|vegetables|veggies'],
 ['Sopa de legumes','Vegetable soup',[35,1.5,5,2,1,0.2,1.5,250],300,'sopa de legumes|sopa|caldo verde|vegetable soup|soup'],
 ['Húmus','Hummus',[166,8,14,0.3,9.6,1.4,6,379],0,'humus|hummus'],
 ['Proteína em pó (whey)','Protein powder (whey)',[400,80,8,5,6,3,0,200],30,'whey|proteina em po|proteina|protein powder|protein shake|batido de proteina'],
 ['Refrigerante','Soft drink',[42,0,10.6,10.6,0,0,0,4],330,'refrigerantes?|coca cola|cola|sumol|ice tea|soda|soft drink|coke'],
 ['Sumo de laranja','Orange juice',[45,0.7,10,8.4,0.2,0,0.2,1],250,'sumo de laranja|sumos?|orange juice|juice'],
 ['Cerveja','Beer',[43,0.5,3.6,0,0,0,0,4],330,'cervejas?|imperial|beers?'],
 ['Vinho','Wine',[85,0.1,2.6,0.6,0,0,0,5],150,'vinhos?|wine'],
 ['Café','Coffee',[2,0.1,0,0,0,0,0,2],50,'cafes?|expresso|espresso|coffee'],
 ['Natas','Cream',[340,2,3,3,36,23,0,30],0,'natas|cream'],
 ['Bolachas','Biscuits',[480,6,68,25,20,9,2,350],10,'bolachas?|biscoitos?|biscuits?|cookies?'],
 ['Bolo','Cake',[380,5,55,35,16,6,1,300],80,'bolos?|cake'],
 ['Gelado','Ice cream',[207,3.5,24,21,11,7,0.7,80],60,'gelados?|ice cream'],
 ['Pastel de nata','Custard tart',[298,4.4,37,18,14,6,0.5,120],60,'pasteis? de nata|pastel de belem|custard tarts?'],
 ['Croissant','Croissant',[406,8,46,11,21,12,2.6,470],60,'croissants?'],
];
const FD_CUP={'White rice (cooked)':160,'Brown rice (cooked)':160,'Pasta (cooked)':140,'Wholewheat pasta (cooked)':140,'Oats':80,'Breakfast cereal':30,'Granola':110,'Quinoa (cooked)':185,'Couscous (cooked)':160,'Berries':150,'Strawberries':150,'Grapes':150,'Lentils (cooked)':200,'Chickpeas (cooked)':165,'Beans (cooked)':175,'Lettuce / green salad':50,'Spinach':30,'Broccoli':90,'Mixed vegetables':130,'Sweetcorn':165,'Peas':145,'Mixed nuts':140,'Almonds':140,'Walnuts':100,'Plain yoghurt':245,'Greek yoghurt':245,'Sugar':200};
const FD_TBSP={'Oats':8,'Peanut butter':16,'Honey':21,'Mayonnaise':14,'Sugar':12,'Hummus':15,'Olive oil':13.5,'Vegetable oil':13.5,'Butter':14,'Chia seeds':12,'Protein powder (whey)':8,'Granola':7};
const FD_FOODS=FD_DB.map(([pt,en,n,u,a])=>({pt,en,n,u,re:new RegExp('(^|[^a-z])('+a+')(?![a-z])')}));
/* unidades: gramas por unidade (null = usar a unidade do alimento) */
const FD_UNITS=[
 [/^(kg|quilos?|kilos?)\b/,1000],[/^(g|gr|gramas?|grams?)\b/,1],[/^(ml|mililitros?|millilit(re|er)s?)\b/,1],[/^(l|litros?|lit(re|er)s?)\b/,1000],[/^(cl)\b/,10],
 [/^(colher(es)? de sopa|c\.? ?sopa|tbsp|tablespoons?)\b/,'tbsp'],[/^(colher(es)? de cha|colher(es)? de sobremesa|c\.? ?cha|tsp|teaspoons?)\b/,'tsp'],[/^(colher(es)?|spoons?)\b/,'tbsp'],
 [/^(chavenas?|xicaras?|cups?)\b/,240],[/^(copos?|glass(es)?)\b/,250],[/^(tacas?)\b/,150],[/^(fatias?|slices?)\b/,null],[/^(unidades?|un|pecas?|pieces?|pcs?|x)\b/,null],
 [/^(latas?|cans?)\b/,'can'],[/^(scoops?|medidas?|doses?)\b/,30],[/^(punhados?|mao cheia|handfuls?)\b/,30],[/^(pratos?|plates?)\b/,300],[/^(tigelas?|taças?|bowls?)\b/,300],[/^(pitadas?|pinch(es)?)\b/,0.5],[/^(dentes?|cloves?)\b/,null],[/^(bolas?|scoops? de gelado)\b/,60],[/^(pacotes?|packs?)\b/,null]
];
const FD_WORDNUM={um:1,uma:1,a:1,an:1,one:1,dois:2,duas:2,two:2,tres:3,three:3,quatro:4,four:4,cinco:5,five:5,seis:6,six:6,meio:0.5,meia:0.5,half:0.5,quarto:0.25};
function fdSplit(text){
  return String(text).split(/\n|;|,(?!\d)|\s\+\s|\s(?:e|and|com|with|mais)\s(?=(?:\d|um|uma|dois|duas|tres|meio|meia|a|an|one|two|half|[a-z]))/i).map(s=>s.trim()).filter(Boolean);
}
function fdFind(norm){let best=null;for(const f of FD_FOODS){const m=norm.match(f.re);if(m&&(!best||m[2].length>best.len))best={food:f,len:m[2].length,idx:m.index};}return best;}
function fdParseLine(line){
  const norm=fdNorm(line).replace(/(\d),(\d)/g,'$1.$2');
  const hit=fdFind(norm);
  if(!hit)return {line,food:null};
  const f=hit.food;
  let qty=null,unitG=null,m;
  /* número + unidade, em qualquer posição: "150 g frango", "frango 150g", "2 ovos", "1/2 chávena" */
  const numRe=/(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|meio|meia|half|one|two|three|four|five|six|a|an)\b)\s*(x\s*)?([a-z.]+(?:\s+de\s+(?:sopa|cha|sobremesa))?)?/g;
  while((m=numRe.exec(norm))){
    const raw=m[1];if(/^(a|an)$/.test(raw)&&!m[3])continue;
    let n=/\d/.test(raw)?(raw.includes('/')?raw.split('/').map(Number).reduce((a,b)=>a/b):Number(raw)):FD_WORDNUM[raw];
    if(!n)continue;
    let unitWord=(m[3]||'').trim();
    if(/^(e|and|de|of)$/.test(unitWord))unitWord='';
    let u=null;for(const [re,val] of FD_UNITS){if(re.test(unitWord)){u=val;break;}}
    if(u===null&&unitWord&&FD_UNITS.some(([re])=>re.test(unitWord)))u='item';
    if(u===null)u=unitWord?'item':'item';
    if(u==='tbsp')unitG=FD_TBSP[f.en]||15;
    else if(u==='tsp')unitG=(FD_TBSP[f.en]||15)/3;
    else if(u===240)unitG=FD_CUP[f.en]||240;
    else if(u==='can')unitG=f.u||330;
    else if(u==='item')unitG=f.u||100;
    else if(u!==240)unitG=u;
    qty=n;break;
  }
  if(qty===null){qty=1;unitG=f.u||100;}
  const grams=Math.round(qty*unitG*10)/10;
  return {line,food:f,grams,guessed:!/\d|um|uma|dois|duas|tres|meio|meia|half|one|two/.test(norm)};
}
function fdAnalyse(text){
  const items=fdSplit(text).map(fdParseLine);
  const keys=['kcal','protein','carbs','sugars','fat','saturated','fibre','sodium'];
  const total=Object.fromEntries(keys.map(k=>[k,0]));
  for(const it of items){if(!it.food)continue;const f=it.grams/100;it.values=Object.fromEntries(keys.map((k,i)=>[k,it.food.n[i]*f]));keys.forEach(k=>total[k]+=it.values[k]);}
  total.salt=total.sodium*2.5/1000;
  total.grams=items.reduce((s,i)=>s+(i.food?i.grams:0),0);
  return {items,total,known:items.filter(i=>i.food).length,unknown:items.filter(i=>!i.food)};
}

/* ---------- Deteção da app ---------- */
function fdIsPhone(){const ua=navigator.userAgent||'';return /iPhone|iPod|Android|Mobile/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)||/iPad/.test(ua);}
function fdIsInstalled(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||(window.matchMedia&&matchMedia('(display-mode: fullscreen)').matches)||navigator.standalone===true;}
function fdIsApp(){try{if(localStorage.getItem('stronggym-force-app')==='1')return true;}catch(_){}return fdIsPhone()&&fdIsInstalled();}
function fdIsIOS(){const ua=navigator.userAgent||'';return /iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);}

/* ---------- Ecrã ---------- */
function fdHeading(){return heading(fdL('Leitor de comida','Food scanner')+'<span class="pink">.</span>',fdL('Fotografa a tua refeição, indica os ingredientes e vê os valores nutricionais.','Snap your meal, list the ingredients and see its nutrition facts.'),'',fdL('SÓ NA APP','APP ONLY'));}
function fdGate(){
  const phone=fdIsPhone(),ios=fdIsIOS();
  const _unused=ios?[fdL('Abre este site no <b>Safari</b>.','Open this site in <b>Safari</b>.'),fdL('Toca em <b>Partilhar</b> (o quadrado com a seta).','Tap <b>Share</b> (the square with an arrow).'),fdL('Escolhe <b>Adicionar ao ecrã principal</b> e confirma.','Choose <b>Add to Home Screen</b> and confirm.'),fdL('Abre a StrongGym a partir do ícone no ecrã principal.','Open StrongGym from the icon on your home screen.')]
    :[fdL('Abre este site no <b>Chrome</b> do teu Android.','Open this site in <b>Chrome</b> on your Android.'),fdL('Toca em <b>Instalar app</b> ou no menu <b>⋮</b> → <b>Instalar aplicação</b>.','Tap <b>Install app</b> or the <b>⋮</b> menu → <b>Install app</b>.'),fdL('Confirma a instalação.','Confirm the installation.'),fdL('Abre a StrongGym a partir do ícone da app.','Open StrongGym from the app icon.')];
  return `<div data-no-translate>${fdHeading()}<section class="panel fd-gate"><div class="fd-gate-icon">${icon('camera')}</div><h2>${phone?fdL('Instala a app para usares o leitor','Install the app to use the scanner'):fdL('Disponível apenas na app para telemóvel','Only available in the mobile app')}</h2><p class="muted">${phone?fdL('O leitor de comida usa a câmara e funciona apenas com a StrongGym instalada no teu iPhone ou Android.','The food scanner uses your camera and only works with StrongGym installed on your iPhone or Android.'):fdL('Abre a StrongGym no teu iPhone ou Android, instala a app e usa a câmara para analisar as tuas refeições.','Open StrongGym on your iPhone or Android, install the app and use the camera to analyse your meals.')}</p>
  ${installPrompt&&!ios?`<button class="btn btn-primary" data-action="install-app">${icon('download')}${fdL('Instalar a app','Install the app')}</button>`:''}
  <div class="fd-install"><div class="fd-os ${!phone||ios?'on':''}"><h3>${icon('phone')} iPhone (iOS)</h3><ol>${[fdL('Abre este site no <b>Safari</b>.','Open this site in <b>Safari</b>.'),fdL('Toca em <b>Partilhar</b> (o quadrado com a seta).','Tap <b>Share</b> (the square with an arrow).'),fdL('Escolhe <b>Adicionar ao ecrã principal</b>.','Choose <b>Add to Home Screen</b>.'),fdL('Abre a StrongGym a partir do novo ícone.','Open StrongGym from the new icon.')].map(s=>`<li>${s}</li>`).join('')}</ol></div><div class="fd-os ${!phone||!ios?'on':''}"><h3>${icon('phone')} Android</h3><ol>${[fdL('Abre este site no <b>Chrome</b>.','Open this site in <b>Chrome</b>.'),fdL('Toca em <b>Instalar app</b> ou no menu <b>⋮</b> → <b>Instalar aplicação</b>.','Tap <b>Install app</b> or the <b>⋮</b> menu → <b>Install app</b>.'),fdL('Confirma a instalação.','Confirm the installation.'),fdL('Abre a StrongGym a partir do ícone da app.','Open StrongGym from the app icon.')].map(s=>`<li>${s}</li>`).join('')}</ol></div></div>
  ${!phone?(/^(localhost|127\.|\[::1\])/.test(location.hostname)?`<div class="notice-box vertical-space" style="text-align:left">${icon('info')}<span>${fdL('Estás a usar o endereço local deste computador, que o telemóvel não consegue abrir. Para instalar a app, publica a pasta <b>dist</b> num endereço HTTPS (por exemplo, GitHub Pages) ou, na mesma rede Wi-Fi, inicia o servidor com <b>python server.py --demo --host 0.0.0.0</b> e abre no telemóvel o endereço IP do computador.','You are using this computer\'s local address, which your phone cannot open. To install the app, publish the <b>dist</b> folder on an HTTPS address (for example GitHub Pages) or, on the same Wi-Fi network, start the server with <b>python server.py --demo --host 0.0.0.0</b> and open the computer\'s IP address on your phone.')}</span></div>`:`<p class="small muted fd-url">${fdL('Endereço para abrir no telemóvel:','Address to open on your phone:')} <b>${e(location.origin+location.pathname)}</b></p>`):''}</section></div>`;
}
function foodPage(){
  if(!fdIsApp())return fdGate();
  const r=FD.result;
  const diary=fdLoad(),todayKey=today();
  const todays=diary.filter(x=>x.date===todayKey);
  const dayKcal=todays.reduce((s,x)=>s+x.total.kcal,0);
  let target=null;try{const mp=mpLoad();if(mp.profile&&mp.goalText)target=mpBuild(mp.profile,mp.goalText,mp.override,mpWhere(mp)).met;}catch(_){}
  return `<div data-no-translate>${fdHeading()}
  <section class="panel fd-capture">
    <div class="fd-step"><span class="mp-num">1</span><h2>${fdL('Fotografa a refeição','Snap your meal')}</h2></div>
    <div class="fd-photo ${FD.photo?'has':''}">${FD.photo?`<img src="${FD.photo}" alt="${fdL('Fotografia da refeição','Photo of the meal')}">`:`<div class="fd-photo-empty">${icon('camera')}<span>${fdL('Ainda sem fotografia','No photo yet')}</span></div>`}</div>
    <div class="fd-photo-actions"><label class="btn btn-primary">${icon('camera')}${fdL('Tirar foto','Take photo')}<input type="file" accept="image/*" capture="environment" class="fd-file" hidden></label><label class="btn">${icon('download')}${fdL('Galeria','Gallery')}<input type="file" accept="image/*" class="fd-file" hidden></label>${FD.photo?`<button class="btn btn-ghost" data-action="fd-clear-photo">${icon('close')}${fdL('Remover','Remove')}</button>`:''}</div>
    <div class="fd-step"><span class="mp-num">2</span><h2>${fdL('O que meteste no prato?','What did you put on the plate?')}</h2></div>
    <p class="panel-subtitle">${fdL('Um ingrediente por linha, com a quantidade. Ex.: 150 g frango, 1 chávena de arroz, 2 ovos, 1 colher de sopa de azeite.','One ingredient per line, with the amount. E.g. 150 g chicken, 1 cup of rice, 2 eggs, 1 tbsp olive oil.')}</p>
    <form data-form="food.analyse"><label class="field full"><span class="sr-only">${fdL('Ingredientes','Ingredients')}</span><textarea id="fd-text" name="ingredients" rows="5" required maxlength="2000" placeholder="${e(fdL('150 g peito de frango\n1 chávena de arroz\n100 g brócolos\n1 colher de sopa de azeite','150 g chicken breast\n1 cup of rice\n100 g broccoli\n1 tbsp olive oil'))}">${e(FD.text)}</textarea></label>
    <div class="fd-quick">${[['150 g frango','150 g chicken'],['1 chávena de arroz','1 cup rice'],['2 ovos','2 eggs'],['100 g salada','100 g salad'],['1 colher de sopa de azeite','1 tbsp olive oil'],['1 banana','1 banana'],['1 iogurte grego','1 greek yoghurt'],['2 fatias de pão','2 slices of bread']].map(([pt,en])=>`<button type="button" class="mp-example" data-action="fd-add" data-text="${e(fdL(pt,en))}">+ ${e(fdL(pt,en))}</button>`).join('')}</div>
    <div class="form-actions"><button class="btn btn-primary fd-go" type="submit">${icon('bolt')}${fdL('Analisar refeição','Analyse meal')}</button></div></form>
  </section>
  ${r?fdResult(r,target):''}
  <section class="panel vertical-space">${panelTitle(fdL('O meu diário de hoje','My diary today'),target?fdL(`${Math.round(dayKcal)} de ${target.kcal} kcal do teu My Plan`,`${Math.round(dayKcal)} of ${target.kcal} kcal from your My Plan`):fdL(`${Math.round(dayKcal)} kcal registadas hoje`,`${Math.round(dayKcal)} kcal logged today`))}
  ${target?`<div class="capacity fd-day-bar"><span style="width:${Math.min(100,dayKcal/target.kcal*100)}%"></span></div>`:''}
  ${diary.slice(0,12).map(x=>`<div class="fd-entry">${x.photo?`<img src="${x.photo}" alt="">`:`<span class="class-symbol">${icon('flame')}</span>`}<div class="class-info"><h3>${e(x.title)}</h3><p>${new Date(x.at).toLocaleString(SG.locale(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · P ${fdFmt(x.total.protein,0)} g · ${fdL('H','C')} ${fdFmt(x.total.carbs,0)} g · ${fdL('G','F')} ${fdFmt(x.total.fat,0)} g</p></div><strong class="fd-entry-kcal">${Math.round(x.total.kcal)}<small> kcal</small></strong><button class="icon-btn" data-action="fd-delete" data-id="${e(x.id)}" aria-label="${fdL('Apagar registo','Delete entry')}">${icon('close')}</button></div>`).join('')||empty(fdL('Ainda sem refeições','No meals yet'),fdL('Analisa uma refeição e guarda-a no diário.','Analyse a meal and save it to your diary.'),'flame')}</section></div>`;
}
function fdResult(r,target){
  const t=r.total;
  if(!r.known)return `<section class="panel vertical-space">${empty(fdL('Não reconheci os ingredientes','I could not recognise the ingredients'),fdL('Experimenta nomes simples como "frango", "arroz", "ovo" ou "azeite", com a quantidade.','Try simple names like "chicken", "rice", "egg" or "olive oil", with the amount.'),'info')}</section>`;
  const pk=t.protein*4,ck=t.carbs*4,fk=t.fat*9,sum=Math.max(1,pk+ck+fk);
  const flags=[];
  if(t.protein>=25)flags.push(['green',fdL('Rica em proteína','High in protein')]);
  if(t.fibre>=6)flags.push(['green',fdL('Boa fonte de fibra','Good source of fibre')]);
  if(t.sugars>=25)flags.push(['warn',fdL('Muito açúcar','High in sugar')]);
  if(t.salt>=2)flags.push(['warn',fdL('Muito sal','High in salt')]);
  if(t.saturated>=10)flags.push(['warn',fdL('Muita gordura saturada','High in saturated fat')]);
  const row=(label,val,unit,sub=false,dv=null)=>`<tr class="${sub?'sub':''}"><td>${label}</td><td><b>${fdFmt(val,val<10?1:0)} ${unit}</b></td>${dv?`<td class="muted">${Math.round(val/dv*100)}%</td>`:'<td></td>'}</tr>`;
  return `<section class="panel vertical-space fd-result" id="fd-result">
   <div class="fd-res-head">${FD.photo?`<img src="${FD.photo}" alt="">`:''}<div><span class="eyebrow">${fdL('A TUA REFEIÇÃO','YOUR MEAL')} · ${fdFmt(t.grams,0)} g</span><div class="fd-kcal">${Math.round(t.kcal)}<small> kcal</small></div>${target?`<p class="small muted">${fdL(`${Math.round(t.kcal/target.kcal*100)}% das tuas calorias diárias`,`${Math.round(t.kcal/target.kcal*100)}% of your daily calories`)}</p>`:''}<div class="mp-chips" style="margin-top:10px">${flags.map(([c,l])=>`<span class="mp-chip ${c}">${l}</span>`).join('')}</div></div></div>
   <div class="fd-macros">${[['p',t.protein,pk,fdL('Proteína','Protein')],['c',t.carbs,ck,fdL('Hidratos','Carbs')],['f',t.fat,fk,fdL('Gordura','Fat')]].map(([k,g,kc,l])=>`<div class="fd-macro fd-${k}"><div class="fd-ring" style="--p:${kc/sum*100}%"><span>${Math.round(kc/sum*100)}%</span></div><b>${fdFmt(g,0)} g</b><small>${l}</small></div>`).join('')}</div>
   <table class="data-table fd-table"><thead><tr><th>${fdL('Informação nutricional','Nutrition facts')}</th><th>${fdL('Total','Total')}</th><th>${fdL('% DR*','% RI*')}</th></tr></thead><tbody>
   ${row(fdL('Energia','Energy'),t.kcal,'kcal',false,2000)}${row(fdL('Proteína','Protein'),t.protein,'g',false,50)}${row(fdL('Hidratos de carbono','Carbohydrates'),t.carbs,'g',false,260)}${row(fdL('dos quais açúcares','of which sugars'),t.sugars,'g',true,90)}${row(fdL('Lípidos (gordura)','Fat'),t.fat,'g',false,70)}${row(fdL('dos quais saturados','of which saturates'),t.saturated,'g',true,20)}${row(fdL('Fibra','Fibre'),t.fibre,'g',false,null)}${row(fdL('Sal','Salt'),t.salt,'g',false,6)}</tbody></table>
   <p class="small muted">* ${fdL('Dose de referência para um adulto médio (2000 kcal).','Reference intake of an average adult (2000 kcal).')}</p>
   <h3 class="fd-sub">${fdL('Por ingrediente','Per ingredient')}</h3>
   <div class="table-wrap"><table class="data-table"><thead><tr><th>${fdL('Ingrediente','Ingredient')}</th><th>${fdL('Qtd.','Qty')}</th><th>kcal</th><th>P</th><th>${fdL('H','C')}</th><th>${fdL('G','F')}</th></tr></thead><tbody>${r.items.filter(i=>i.food).map(i=>`<tr><td><strong>${e(SG.L(i.food.pt,i.food.en))}</strong>${i.guessed?`<small class="fd-guess">${fdL('porção estimada','estimated portion')}</small>`:''}</td><td>${fdFmt(i.grams,0)} g</td><td>${Math.round(i.values.kcal)}</td><td>${fdFmt(i.values.protein,1)}</td><td>${fdFmt(i.values.carbs,1)}</td><td>${fdFmt(i.values.fat,1)}</td></tr>`).join('')}</tbody></table></div>
   ${r.unknown.length?`<div class="notice-box vertical-space">${icon('info')}<span>${fdL('Não reconheci','I did not recognise')}: <b>${r.unknown.map(u=>e(u.line)).join(', ')}</b>. ${fdL('Estes itens não entram nas contas.','These items are not counted.')}</span></div>`:''}
   <div class="form-actions"><button class="btn btn-ghost" data-action="fd-new">${fdL('Nova refeição','New meal')}</button><button class="btn btn-primary" data-action="fd-save">${icon('check')}${fdL('Guardar no diário','Save to diary')}</button></div>
   <p class="small muted">${fdL('Valores aproximados com base em médias de tabelas nutricionais. A fotografia serve de registo; os cálculos usam os ingredientes e quantidades que indicaste.','Approximate values based on average nutrition tables. The photo is kept as a record; the numbers come from the ingredients and amounts you entered.')}</p></section>`;
}
function fdCompress(file){
  return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const max=640,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',0.72));};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error(fdL('Não foi possível ler a fotografia.','The photo could not be read.')));};img.src=url;});
}
async function fdHandleFile(input){const file=input.files&&input.files[0];if(!file)return;try{FD.text=$('#fd-text')?.value||FD.text;FD.photo=await fdCompress(file);render();}catch(err){toast(err.message,true);}}
function fdThumb(dataUrl){return new Promise(res=>{if(!dataUrl)return res(null);const img=new Image();img.onload=()=>{const s=160,c=document.createElement('canvas'),k=Math.max(s/img.width,s/img.height);c.width=s;c.height=s;c.getContext('2d').drawImage(img,(s-img.width*k)/2,(s-img.height*k)/2,img.width*k,img.height*k);res(c.toDataURL('image/jpeg',0.6));};img.onerror=()=>res(null);img.src=dataUrl;});}
async function fdHandleAction(action,el){
  switch(action){
    case 'fd-add':{const t=$('#fd-text');if(!t)return;t.value=(t.value.trim()?t.value.trim()+'\n':'')+el.dataset.text;FD.text=t.value;t.focus();return;}
    case 'fd-clear-photo':FD.text=$('#fd-text')?.value||FD.text;FD.photo=null;render();return;
    case 'fd-new':FD.photo=null;FD.result=null;FD.text='';render();window.scrollTo({top:0,behavior:'smooth'});return;
    case 'fd-delete':fdSave(fdLoad().filter(x=>x.id!==el.dataset.id));render();toast(fdL('Registo apagado.','Entry deleted.'));return;
    case 'fd-save':{if(!FD.result)return;const t=FD.result.total;const names=FD.result.items.filter(i=>i.food).map(i=>SG.L(i.food.pt,i.food.en));const title=names.slice(0,3).join(', ')+(names.length>3?'…':'');
      const entry={id:crypto.randomUUID(),at:new Date().toISOString(),date:today(),title,text:FD.text,photo:await fdThumb(FD.photo),total:{kcal:t.kcal,protein:t.protein,carbs:t.carbs,fat:t.fat,sugars:t.sugars,salt:t.salt}};
      const ok=fdSave([entry,...fdLoad()]);FD.photo=null;FD.result=null;FD.text='';render();toast(ok?fdL('Refeição guardada no diário.','Meal saved to your diary.'):fdL('Sem espaço para guardar a refeição neste dispositivo.','No space left to save the meal on this device.'),!ok);return;}
  }
}
function fdHandleSubmit(p){
  const text=String(p.ingredients||'').trim();
  if(!text)throw new Error(fdL('Indica pelo menos um ingrediente.','Enter at least one ingredient.'));
  FD.text=text;FD.result=fdAnalyse(text);render();
  requestAnimationFrame(()=>document.getElementById('fd-result')?.scrollIntoView({behavior:'smooth',block:'start'}));
}
