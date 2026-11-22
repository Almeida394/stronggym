/* Interactive preview only. The Python server serves config.js with DEMO=false. */
window.StrongGymDemo = (() => {
  const key = 'stronggym-demo-v1';
  let data;
  const today = () => new Date().toLocaleDateString('en-CA');
  const uid = () => crypto.randomUUID();
  const copy = x => JSON.parse(JSON.stringify(x));
  async function init() {
    try { data = JSON.parse(localStorage.getItem(key)); } catch (_) { data = null; }
    if (!data || !data.user || !data.classes) {
      const response = await fetch('./demo-seed.json');
      if (!response.ok) throw new Error('Não foi possível carregar a demonstração.');
      data = await response.json();
      const base = new Date(data.classes[0].date+'T12:00:00');
      const shift = Math.round((new Date(today()+'T12:00:00')-base)/86400000);
      const rebase = date => { const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()+shift); return d.toLocaleDateString('en-CA'); };
      for (const c of data.classes) c.date = rebase(c.date);
      for (const v of data.visits) { v.date=rebase(v.date); v.entered=v.date+'T17:30:00'; v.exited=v.date+'T18:40:00'; }
      for (const n of data.notices) n.date=rebase(n.date);
      for (const s of data.admin.shifts) s.date=rebase(s.date);
      for (const p of data.progress) p.date=rebase(p.date);
      data.workout.completedDates=data.workout.completedDates.map(rebase);
      data.admin.visits = data.visits.map(v=>({...v,name:data.user.name,memberId:data.user.id}));
      save();
    }
    else if (!data.plans.some(p=>p.id==='app')) {
      try { const response = await fetch('./demo-seed.json'); if (response.ok) { const seed = await response.json(); for (const p of seed.plans||[]) if (!data.plans.some(x=>x.id===p.id)) data.plans.push(p); save(); } } catch (_) {}
    }
    return state();
  }
  function save() { localStorage.setItem(key,JSON.stringify(data)); }
  function state() {
    data.challengeAwards??={};const result=copy(data), start=new Date(today()+'T00:00:00');
    start.setDate(start.getDate()-((start.getDay()+6)%7));
    const week=start.toLocaleDateString('en-CA');
    result.stats.weeklyVisits=new Set(data.visits.filter(v=>v.date>=week).map(v=>v.date)).size;
    result.stats.points=new Set(data.visits.map(v=>v.date)).size*25+data.workout.completedDates.length*50;
    const month=today().slice(0,7);
    result.challenges.forEach(c=>{c.progress=(c.unit==='treinos'?data.workout.completedDates:data.visits.map(v=>v.date)).filter(d=>d.startsWith(month));c.progress=new Set(c.progress).size;if(c.joined&&c.progress>=c.target)data.challengeAwards[c.id+':'+month]??=c.points;});
    result.stats.points+=Object.values(data.challengeAwards).reduce((sum,points)=>sum+points,0);save();
    result.admin.tickets=copy(data.tickets).map(t=>({...t,name:data.user.name,memberId:data.user.id}));
    return result;
  }
  function need(value,msg) { if(!value) throw new Error(msg); }
  function get(list,id) { const item=list.find(x=>x.id===id);need(item,'Registo não encontrado.');return item; }
  async function action(action,p={}) {
    const snapshot=copy(data);
    try {
      if(action.startsWith('admin.')) need(data.user.role==='admin','Acesso reservado à administração.');
      let message='Alteração guardada.';
      switch(action) {
        case 'account.update': need(p.name?.trim(),'Indica o teu nome.');Object.assign(data.user,{name:p.name.trim(),phone:p.phone,goal:p.goal});break;
        case 'subscription.change': get(data.plans,p.plan);data.user.plan=p.plan;const member=data.admin.members.find(m=>m.id===data.user.id);if(member)member.plan=p.plan;message='Plano alterado em modo de demonstração. Sem cobrança.';break;
        case 'class.book': {
          const c=get(data.classes,p.id);need(!data.bookings.includes(p.id),'Já tens uma reserva nesta aula.');need(c.booked<c.capacity,'Esta aula está esgotada.');need(new Date(c.date+'T'+c.time)>new Date(),'Esta aula já começou.');
          need(!data.classes.some(other=>data.bookings.includes(other.id)&&new Date(c.date+'T'+c.time)<new Date(new Date(other.date+'T'+other.time).getTime()+other.duration*60000)&&new Date(other.date+'T'+other.time)<new Date(new Date(c.date+'T'+c.time).getTime()+c.duration*60000)),'Já tens uma aula reservada neste horário.');data.bookings.push(p.id);c.booked++;message='Lugar reservado. Vemo-nos na aula!';break;
        }
        case 'class.cancel': {const c=get(data.classes,p.id);need(data.bookings.includes(p.id),'Não existe uma reserva.');data.bookings=data.bookings.filter(id=>id!==p.id);c.booked--;message='Reserva cancelada.';break;}
        case 'checkin.toggle': {
          const active=data.visits.find(v=>!v.exited);if(active){active.exited=new Date().toISOString();data.occupancy.current--;const a=data.admin.visits.find(v=>v.id===active.id);if(a)a.exited=active.exited;message='Saída registada. Até ao próximo treino!';}
          else{need(data.occupancy.current<data.occupancy.capacity,'O ginásio atingiu a lotação máxima.');const v={id:uid(),date:today(),entered:new Date().toISOString(),exited:null};data.visits.push(v);data.admin.visits.push({...v,name:data.user.name,memberId:data.user.id});data.occupancy.current++;message='Check-in feito. Bom treino!';}break;
        }
        case 'workout.complete': need(!data.workout.completedDates.includes(today()),'O treino de hoje já foi registado.');data.workout.completedDates.push(today());message='Treino concluído. Mais um passo em frente!';break;
        case 'progress.add': {
          need(p.date && p.date<=today(),'Escolhe uma data até hoje.');need(p.weight>=20&&p.weight<=400,'O peso deve estar entre 20 e 400 kg.');need(p.bodyFat>=1&&p.bodyFat<=70,'A massa gorda deve estar entre 1 e 70%.');need(p.waist>=30&&p.waist<=250,'O perímetro deve estar entre 30 e 250 cm.');const previous=data.progress.find(v=>v.date===p.date);if(previous)Object.assign(previous,p);else data.progress.push({...p,id:uid()});data.progress.sort((a,b)=>a.date.localeCompare(b.date));message='Métricas registadas.';break;
        }
        case 'order.create': {
          if(data.orders.some(o=>o.idempotencyKey===p.idempotencyKey)) {message='Esta encomenda já foi criada.';break;}
          need(Array.isArray(p.items)&&p.items.length,'O carrinho está vazio.');let total=0;const ids=new Set();
          for(const i of p.items){need(Number.isInteger(i.qty)&&i.qty>0&&!ids.has(i.id),'Quantidade inválida.');ids.add(i.id);const pr=get(data.products,i.id);need(pr.stock>=i.qty,'Stock insuficiente: '+pr.name);total+=Math.round(pr.price*100)*i.qty;}
          const items=p.items.map(i=>{const pr=get(data.products,i.id);pr.stock-=i.qty;return {...i,name:pr.name,price:pr.price};});
          data.orders.unshift({id:uid(),date:today(),total:total/100,status:'demo',items,idempotencyKey:p.idempotencyKey});message='Encomenda de demonstração criada. Não foi cobrado qualquer valor.';break;
        }
        case 'challenge.join': get(data.challenges,p.id).joined=true;message='Desafio aceite. Vamos a isso!';break;
        case 'notifications.read': data.notices.forEach(n=>n.read=true);break;
        case 'ticket.create':need(p.subject?.trim()&&p.message?.trim(),'Preenche o assunto e a mensagem.');data.tickets.unshift({...p,id:uid(),date:today(),status:'Aberto',reply:''});message='Pedido enviado. A equipa vai responder aqui.';break;
        case 'admin.lead.add': data.admin.leads.unshift({...p,id:uid(),stage:'Novo',date:today()});break;
        case 'admin.lead.update':need(['Novo','Contactado','Visita marcada','Convertido','Perdido'].includes(p.stage),'Estado inválido.');get(data.admin.leads,p.id).stage=p.stage;break;
        case 'admin.staff.add':data.admin.staff.push({...p,id:uid()});break;
        case 'admin.shift.add':need(p.start<p.end,'A hora de fim deve ser posterior ao início.');need(!data.admin.shifts.some(s=>s.staffId===p.staffId&&s.date===p.date&&s.start<p.end&&s.end>p.start),'Este funcionário já tem um turno nesse horário.');data.admin.shifts.push({...p,id:uid()});break;
        case 'admin.notice.add':data.notices.unshift({...p,id:uid(),date:today(),read:false});message='Aviso publicado para os membros da demonstração.';break;
        case 'admin.ticket.reply':Object.assign(get(data.tickets,p.id),{reply:p.reply,status:'Respondido'});break;
        case 'admin.plan.assign':get(data.admin.members,p.memberId);if(p.memberId===data.user.id)data.workout={...p,id:uid(),trainer:'Equipa StrongGym',completedDates:data.workout.completedDates};else{data.admin.assignedPlans??={};data.admin.assignedPlans[p.memberId]=copy(p);}message='Plano atribuído ao membro.';break;
        case 'admin.class.add':need(p.capacity>=1&&p.capacity<=200,'A capacidade deve ser de 1 a 200 pessoas.');need(new Date(p.date+'T'+p.time)>new Date(),'Escolhe uma data e hora futuras.');need(!data.classes.some(other=>(other.room.toLowerCase()===p.room.toLowerCase()||other.trainer.toLowerCase()===p.trainer.toLowerCase())&&new Date(p.date+'T'+p.time)<new Date(new Date(other.date+'T'+other.time).getTime()+other.duration*60000)&&new Date(other.date+'T'+other.time)<new Date(new Date(p.date+'T'+p.time).getTime()+p.duration*60000)),'A sala ou o instrutor já tem uma aula neste horário.');data.classes.push({...p,id:uid(),booked:0});break;
        case 'admin.access.exit':{const v=get(data.admin.visits,p.id);need(!v.exited,'Esta visita já terminou.');v.exited=new Date().toISOString();const own=data.visits.find(x=>x.id===p.id);if(own)own.exited=v.exited;data.occupancy.current=Math.max(0,data.occupancy.current-1);break;}
        default:throw new Error('Ação indisponível.');
      }
      save();return {ok:true,message};
    } catch(error){data=snapshot;throw error;}
  }
  function role(role){data.user.role=role;save();return state();}
  return {init,state,action,role};
})();
