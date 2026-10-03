'use strict';

const PROCEDURES = [
  { name: 'Лапароскопическая холецистэктомия', profile: 'Общая хирургия', diagnosis: 'Желчнокаменная болезнь' },
  { name: 'Пластика паховой грыжи', profile: 'Общая хирургия', diagnosis: 'Паховая грыжа' },
  { name: 'Операция по поводу катаракты', profile: 'Офтальмология', diagnosis: 'Возрастная катаракта' },
  { name: 'Артроскопия коленного сустава', profile: 'Травматология', diagnosis: 'Повреждение мениска' },
  { name: 'Эндовенозная лазерная облитерация', profile: 'Сосудистая хирургия', diagnosis: 'Варикозная болезнь' },
  { name: 'Септопластика', profile: 'Оториноларингология', diagnosis: 'Искривление перегородки носа' },
];
const CLINICS = [
  { id: 'c1', name: 'Демо-клиника «Уральская»', city: 'Челябинск', procedure: 0, payment: 'both', slots: 4, date: '2026-10-08', price: 68000 },
  { id: 'c2', name: 'Демо-центр «Южный»', city: 'Копейск', procedure: 1, payment: 'oms', slots: 3, date: '2026-10-12', price: 0 },
  { id: 'c3', name: 'Демо-клиника «Ясный взгляд»', city: 'Челябинск', procedure: 2, payment: 'both', slots: 6, date: '2026-10-09', price: 52000 },
  { id: 'c4', name: 'Демо-центр «Движение»', city: 'Миасс', procedure: 3, payment: 'oms', slots: 2, date: '2026-10-14', price: 0 },
  { id: 'c5', name: 'Демо-клиника «Ритм»', city: 'Магнитогорск', procedure: 4, payment: 'paid', slots: 5, date: '2026-10-07', price: 46000 },
  { id: 'c6', name: 'Демо-центр «Дыхание»', city: 'Челябинск', procedure: 5, payment: 'both', slots: 3, date: '2026-10-15', price: 57000 },
];
const STATUS = { waiting: 'Ожидает предложения', review: 'На согласовании', confirmed: 'Приём подтверждён' };
const PAYMENT = { oms: 'ОМС', paid: 'Платно', both: 'ОМС / платно' };
const seed = [
  [1042,58,'Златоуст',0,'oms',true,'waiting',true],
  [1041,67,'Челябинск',2,'both',true,'waiting',false],
  [1040,42,'Копейск',1,'oms',false,'waiting',true],
  [1039,35,'Магнитогорск',4,'paid',true,'waiting',false],
  [1038,49,'Миасс',3,'oms',true,'review',false],
  [1037,29,'Челябинск',5,'both',true,'waiting',true],
  [1036,63,'Сатка',0,'both',true,'review',true],
  [1035,72,'Копейск',2,'oms',true,'confirmed',true],
  [1034,46,'Челябинск',1,'oms',true,'waiting',false],
  [1033,51,'Магнитогорск',4,'both',false,'waiting',true],
  [1032,38,'Златоуст',3,'oms',true,'confirmed',true],
  [1031,32,'Миасс',5,'paid',true,'review',true],
];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = value => new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const ageLabel = age => { const n=age%100; return age+' '+(n>=11&&n<=14?'лет':age%10===1?'год':[2,3,4].includes(age%10)?'года':'лет'); };
let patients, view = 'patients', filters, clinicFilter = null, selectedId = null, toastTimer;

function initialPatients() {
  return seed.map(([id,age,city,procedure,payment,ready,status,travel], index) => {
    const c=CLINICS.find(c=>c.procedure===procedure);
    return { id,age,city,procedure,payment,ready,status,travel,created:`2026-10-${String(3-Math.floor(index/5)).padStart(2,'0')}`,
      offer: status==='waiting'?null:{clinicId:c.id,payment:payment==='paid'?'paid':'oms',date:c.date},
      history:[{text:'Создана пробная заявка',time:'Пример · октябрь 2026'},...(status==='waiting'?[]:[{text:'Добавлено предложение стационара',time:'Исходный демонстрационный сценарий'}]),...(status==='confirmed'?[{text:'Госпитализация согласована в демо',time:'Исходный демонстрационный сценарий'}]:[])] };
  });
}
function resetFilters(){filters={search:'',profile:'',city:'',payment:'',status:''};clinicFilter=null;}
function compatiblePayment(a,b){return a===b||a==='both'||b==='both';}
function matches(p,c){return p.procedure===c.procedure&&compatiblePayment(p.payment,c.payment)&&(p.travel||p.city===c.city);}
function availableSlots(c){return Math.max(0,c.slots-patients.filter(p=>p.status==='confirmed'&&p.offer?.clinicId===c.id).length);}
function matchingClinics(p){return CLINICS.filter(c=>matches(p,c)&&availableSlots(c)>0);}
function counts(){return {all:patients.length,...Object.fromEntries(Object.keys(STATUS).map(s=>[s,patients.filter(p=>p.status===s).length]))};}
function badge(value,type='status'){return `<span class="badge ${esc(value)}">${esc((type==='payment'?PAYMENT:STATUS)[value])}</span>`;}
function announce(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4500);}
function openDialog(id){const d=document.getElementById(id);if(!d.open)d.showModal();}
function closeDialog(id){document.getElementById(id).close();}
function statsHTML(){const n=counts();return `<div class="stats"><div class="stat"><span>Всего заявок</span><strong>${n.all}</strong><small>В демонстрационном реестре</small></div><div class="stat"><span>Ожидают предложения</span><strong>${n.waiting}</strong><small>Можно подобрать стационар</small></div><div class="stat"><span>На согласовании</span><strong>${n.review}</strong><small>Пациент выбирает вариант</small></div><div class="stat accent"><span>Госпитализация подтверждена</span><strong>${n.confirmed}</strong><small>Дата и условия согласованы</small></div></div>`;}
function options(values,selected){return values.map(v=>`<option value="${esc(v)}"${v===selected?' selected':''}>${esc(v)}</option>`).join('');}
function filteredPatients(){return patients.filter(p=>{
  const proc=PROCEDURES[p.procedure];
  return (!filters.search||`Д-${p.id} ${p.city} ${proc.name} ${proc.diagnosis} ${proc.profile}`.toLocaleLowerCase('ru').includes(filters.search.toLocaleLowerCase('ru').trim()))
    &&(!filters.profile||proc.profile===filters.profile)&&(!filters.city||p.city===filters.city)
    &&(!filters.payment||compatiblePayment(p.payment,filters.payment))&&(!filters.status||p.status===filters.status)
    &&(!clinicFilter||matches(p,CLINICS.find(c=>c.id===clinicFilter)));
});}
function tableHTML(){const rows=filteredPatients();return `<div class="results-summary"><span role="status">Найдено заявок: ${rows.length}</span><span class="sort-label">Новые заявки сверху · сценарий на 3 октября 2026</span></div>${rows.length?`<table class="patient-table"><caption class="visually-hidden">Демонстрационные пациенты и планируемые вмешательства</caption><colgroup><col style="width:20%"><col style="width:26%"><col class="payment-col" style="width:12%"><col class="readiness-col" style="width:16%"><col style="width:17%"><col style="width:9%"></colgroup><thead><tr><th>Пациент</th><th>Вмешательство</th><th>Оплата</th><th class="readiness-col">Обследования</th><th>Статус</th><th><span class="visually-hidden">Действия</span></th></tr></thead><tbody>${rows.map(p=>`<tr><td><button class="patient-id" data-open="${p.id}">Пациент Д-${p.id}</button><span class="subline">${ageLabel(p.age)} · ${esc(p.city)}</span></td><td><span class="procedure-title">${PROCEDURES[p.procedure].name}</span><span class="profile-label">${PROCEDURES[p.procedure].profile}</span></td><td>${badge(p.payment,'payment')}</td><td class="readiness-col"><span class="${p.ready?'ready':'not-ready'}">${p.ready?'✓ Собраны':'Нужны уточнения'}</span></td><td>${badge(p.status)}</td><td><button class="row-open" data-open="${p.id}" aria-label="Открыть пациента Д-${p.id}">Открыть</button></td></tr>`).join('')}</tbody></table><div class="table-footer">Показаны все ${rows.length} · Контактные данные в демоверсии отсутствуют</div>`:`<div class="empty"><h3>Подходящих заявок пока нет</h3><p>Измените условия поиска или сбросьте фильтры.</p><button class="button secondary" data-reset-filters>Сбросить фильтры</button></div>`}`;}
function renderPatients(){const n=counts();return `${statsHTML()}${clinicFilter?`<div class="clinic-filter-note"><span>Подбор для ${esc(CLINICS.find(c=>c.id===clinicFilter).name)}</span><button class="text-button" data-reset-filters>Убрать подбор</button></div>`:''}<section class="panel"><div class="panel-header"><h2>Реестр заявок</h2><span class="count-label">${patients.length} пациентов</span></div><div class="tabs" role="group" aria-label="Фильтр по статусу">${[['','Все заявки',n.all],['waiting','Ожидают',n.waiting],['review','На согласовании',n.review],['confirmed','Подтверждены',n.confirmed]].map(([s,label,count])=>`<button class="tab ${filters.status===s?'active':''}" data-status="${s}" aria-pressed="${filters.status===s}">${label}<span>${count}</span></button>`).join('')}</div><div class="filters"><label class="search"><span class="visually-hidden">Поиск по номеру, городу или вмешательству</span><input type="search" id="search" placeholder="Поиск по номеру, городу, вмешательству" value="${esc(filters.search)}"></label><label class="visually-hidden" for="profile-filter">Профиль помощи</label><select class="filter-select" id="profile-filter" data-filter="profile"><option value="">Все профили</option>${options([...new Set(PROCEDURES.map(p=>p.profile))],filters.profile)}</select><label class="visually-hidden" for="city-filter">Город пациента</label><select class="filter-select" id="city-filter" data-filter="city"><option value="">Все города</option>${options([...new Set(patients.map(p=>p.city))].sort(),filters.city)}</select><label class="visually-hidden" for="payment-filter">Вариант оплаты</label><select class="filter-select" id="payment-filter" data-filter="payment"><option value="">Любая оплата</option><option value="oms"${filters.payment==='oms'?' selected':''}>Рассматривают ОМС</option><option value="paid"${filters.payment==='paid'?' selected':''}>Рассматривают платно</option></select></div><div id="table-region">${tableHTML()}</div></section>`;}
function renderClinics(){return `<p class="section-note">Вымышленные клиники и предложения для проверки сценария. Даты и цены — примеры, не действующие условия лечения.</p><div class="clinic-grid">${CLINICS.map(c=>`<article class="clinic-card"><div class="clinic-top"><span class="clinic-icon" aria-hidden="true">⊞</span><div><h3>${c.name}</h3><p>${c.city} · ${PROCEDURES[c.procedure].profile}</p></div></div><div class="clinic-procedure">${PROCEDURES[c.procedure].name}</div><div class="clinic-meta"><div><small>Ближайшая дата в демо</small><strong>${dateLabel(c.date)}</strong></div><div><small>Свободно в сценарии</small><strong>${availableSlots(c)} места</strong></div><div><small>Варианты оплаты</small>${badge(c.payment,'payment')}</div><div><small>${c.payment==='oms'?'Условия':'Пример стоимости'}</small><strong>${c.payment==='oms'?'Приём по ОМС':money(c.price)}</strong></div></div><div class="clinic-bottom"><span class="count-label">${patients.filter(p=>p.status==='waiting'&&matches(p,c)).length} заявок для рассмотрения</span><button class="button secondary" data-clinic-filter="${c.id}">Подобрать пациентов</button></div></article>`).join('')}</div>`;}
function renderJourneys(){return `${statsHTML()}<p class="section-note">Учебный маршрут пациента. Действия не создают настоящего направления и не меняют очередь в больнице.</p><div class="board">${['waiting','review','confirmed'].map(s=>`<section class="board-column"><div class="board-title">${s==='waiting'?'Подбор стационара':s==='review'?'Согласование':'Подтверждён приём'}<span>${patients.filter(p=>p.status===s).length}</span></div>${patients.filter(p=>p.status===s).map(p=>`<article class="journey-card"><button class="patient-id" data-open="${p.id}">Пациент Д-${p.id}</button><span class="subline">${ageLabel(p.age)} · ${p.city}</span><p>${PROCEDURES[p.procedure].name}</p>${p.offer?`<span class="subline">${CLINICS.find(c=>c.id===p.offer.clinicId).name}<br>${dateLabel(p.offer.date)} · ${PAYMENT[p.offer.payment]}</span>`:badge(p.payment,'payment')}<button class="button secondary" data-open="${p.id}">${s==='waiting'?'Подобрать стационар':'Посмотреть маршрут'}</button></article>`).join('')||'<p class="board-empty">Пока нет заявок на этом этапе.</p>'}</section>`).join('')}</div>`;}
function renderAbout(){return `<div class="about-grid"><section class="about-card"><p class="eyebrow">ПРОЙДИТЕ ПУТЬ ПАЦИЕНТА</p><h2>От заявки до согласованной даты</h2><ol><li><strong>Выберите пациента.</strong> Откройте заявку Д-1042 или создайте новую с помощью готовых полей.</li><li><strong>Подберите стационар.</strong> Учитываются вмешательство, оплата и готовность пациента поехать в другой город.</li><li><strong>Предложите вариант.</strong> Выберите ОМС или платный приём и дату. Заявка перейдёт на согласование.</li><li><strong>Подтвердите учебный приём.</strong> Отметьте, что пациент и клиника согласовали условия в сценарии. Результат появится в разделе «Госпитализации».</li></ol><a href="#patients" class="button primary">Открыть реестр</a></section><section class="about-card"><p class="eyebrow">ГРАНИЦЫ ПРОТОТИПА</p><h2>Без реальных медицинских данных</h2><p>Все пациенты, клиники, цены и предложения придуманы. Прототип работает только в текущей вкладке браузера. Обновление страницы восстанавливает исходные примеры.</p><p>Здесь нет регистрации пользователей, настоящих уведомлений, загрузки документов, связи с клиниками и общей базы данных. Демо-координатор — обозначение сценария, а не защищённая учётная запись.</p><p>Совпадение по фильтрам не означает медицинскую пригодность пациента. Показания, обследования и возможность госпитализации оценивает врач.</p><p>Перед использованием с реальными пациентами потребуются защищённый сервер, разграничение доступа, юридические основания обработки и договорённости с медорганизациями.</p></section></div>`;}
function render(){const info={patients:['Пациенты','Помогаем найти подходящий стационар и согласовать лечение.'],clinics:['Возможности клиник','Предложения по плановой помощи в Челябинской области.'],journeys:['Госпитализации','Каждая заявка — с понятным следующим шагом.'],about:['Как работает демо','Проверьте сценарий вместе с врачами перед разработкой реальной системы.']}[view];
  document.getElementById('page-title').textContent=info[0];document.getElementById('crumb').textContent=info[0];document.getElementById('page-description').textContent=info[1];document.getElementById('nav-count').textContent=patients.length;document.getElementById('add-patient').hidden=view==='about';
  document.querySelectorAll('[data-view]').forEach(a=>{a.classList.toggle('active',a.dataset.view===view);if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.getElementById('content').innerHTML=({patients:renderPatients,clinics:renderClinics,journeys:renderJourneys,about:renderAbout})[view]();
}
function navigate(){const next=location.hash.slice(1);view=['patients','clinics','journeys','about'].includes(next)?next:'patients';render();}
function setView(next){view=next;if(location.hash!==`#${next}`)location.hash=next;else render();}
function detailHTML(p){const proc=PROCEDURES[p.procedure];const candidates=matchingClinics(p);return `<div class="dialog-header"><div><p class="eyebrow">ДЕМОНСТРАЦИОННАЯ ЗАЯВКА</p><h2 id="detail-title">Пациент Д-${p.id}</h2><p class="detail-subtitle">${ageLabel(p.age)} · ${p.city} · Добавлен ${dateLabel(p.created)}</p></div><button class="icon-button" data-close="detail-dialog" aria-label="Закрыть карточку">×</button></div>${badge(p.status)}<div class="detail-grid"><div><section class="detail-section"><h3>Потребность в лечении</h3><dl class="detail-info"><div class="span-2"><dt>Планируемое вмешательство</dt><dd><strong>${proc.name}</strong></dd></div><div class="span-2"><dt>Диагноз в учебном примере</dt><dd>${proc.diagnosis}</dd></div><div><dt>Оплата</dt><dd>${PAYMENT[p.payment]}</dd></div><div><dt>Обследования</dt><dd>${p.ready?'Собраны в демо':'Нужны уточнения'}</dd></div><div class="span-2"><dt>География</dt><dd>${p.travel?'Рассматривает другие города области':`Только ${p.city}`}</dd></div></dl><p class="detail-note">Все случаи в демо — плановые. Подбор по параметрам требует последующей оценки врачом.</p></section><section class="detail-section"><h3>Контакты и документы</h3><p class="muted">Вымышленный пациент. Телефон, ФИО и медицинские документы отсутствуют.</p></section><section class="detail-section"><h3>История заявки</h3><ol class="timeline">${p.history.map(h=>`<li>${esc(h.text)}<small>${esc(h.time)}</small></li>`).join('')}</ol></section></div><section><div class="match-title"><h3>${p.status==='waiting'?'Подходящие предложения':'Выбранный вариант'}</h3>${p.status==='waiting'?`<span>${candidates.length} найдено</span>`:''}</div>${!p.ready?'<p class="detail-warning">Обследования требуют уточнения. В демо можно предложить вариант, но подтверждение приёма доступно после отметки о готовности.</p>':''}<div id="offer-region">${p.status==='waiting'?(candidates.length?candidates.map(c=>`<article class="match-card"><h4>${c.name}</h4><p>${c.city} · С ${dateLabel(c.date)} · ${availableSlots(c)} места</p><p>${c.payment==='oms'?'Приём по ОМС':`Доступно: ${PAYMENT[c.payment]} · Пример цены ${money(c.price)}`}</p><button class="button primary" data-stage="${c.id}">Предложить вариант</button></article>`).join(''):'<div class="empty"><h3>Совпадений пока нет</h3><p>В демо нет предложения с подходящими вмешательством, оплатой и городом. Заявка остаётся в ожидании.</p></div>'):currentOfferHTML(p)}</div></section></div>`;}
function openPatient(id){const p=patients.find(p=>p.id===Number(id));if(!p)return;selectedId=p.id;document.getElementById('detail-content').innerHTML=detailHTML(p);openDialog('detail-dialog');}
function currentOfferHTML(p){const c=CLINICS.find(c=>c.id===p.offer.clinicId);return `<div class="offer-panel"><h3>${c.name}</h3><p>${c.city}<br><strong>${dateLabel(p.offer.date)} · ${PAYMENT[p.offer.payment]}</strong>${p.offer.payment==='paid'?`<br>Пример стоимости: ${money(c.price)}`:''}</p>${p.status==='review'?`<form id="confirm-form">${!p.ready?'<label class="checkbox-label"><input type="checkbox" name="ready" required>В сценарии обследования проверены врачом</label>':''}<label class="checkbox-label"><input type="checkbox" name="agreed" required>Пациент выбрал клинику, дата и условия согласованы обеими сторонами в демо</label><button class="button primary" type="submit">Подтвердить в демо</button></form><button class="text-button" data-withdraw>Вернуть к подбору</button>`:'<p class="ready">✓ Госпитализация подтверждена в учебном сценарии</p><p class="muted">Никаких сообщений или направлений не отправлено.</p>'}</div>`;}
function stageOffer(clinicId){const p=patients.find(p=>p.id===selectedId);const c=CLINICS.find(c=>c.id===clinicId);if(!p||p.status!=='waiting'||!c||!matches(p,c)||availableSlots(c)<1)return;
  const pays=['oms','paid'].filter(pay=>compatiblePayment(p.payment,pay)&&compatiblePayment(c.payment,pay));
  document.getElementById('offer-region').innerHTML=`<form class="offer-panel" id="offer-form" data-clinic="${c.id}"><h3>${c.name}</h3><p>Пробное предложение пациенту Д-${p.id}. Связь с пациентом не выполняется.</p><label>Условия приёма<select name="payment">${pays.map(pay=>`<option value="${pay}">${pay==='oms'?'По ОМС':`Платно · пример ${money(c.price)}`}</option>`).join('')}</select></label><label>Предлагаемая дата в сценарии<input type="date" name="date" min="${c.date}" max="2026-12-31" value="${c.date}" required></label><p class="muted">Предложение не бронирует место. Возможность приёма проверяется при подтверждении.</p><button class="button primary" type="submit">Создать пробное предложение</button><button class="text-button" type="button" data-back-detail>Вернуться к предложениям</button></form>`;
  document.querySelector('#offer-form select').focus();
}
function addHistory(p,text){p.history.push({text,time:'Сейчас · действие в демоверсии'});}

patients=initialPatients();resetFilters();
document.getElementById('procedure-select').innerHTML=PROCEDURES.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');
window.addEventListener('hashchange',navigate);
document.addEventListener('click',e=>{const b=e.target.closest('button,[data-clinic-filter]');if(!b)return;
  if(b.dataset.close){closeDialog(b.dataset.close);return;}
  if(b.dataset.open){openPatient(b.dataset.open);return;}
  if(b.hasAttribute('data-status')){filters.status=b.dataset.status;render();return;}
  if(b.hasAttribute('data-reset-filters')){resetFilters();render();return;}
  if(b.dataset.clinicFilter){resetFilters();clinicFilter=b.dataset.clinicFilter;filters.status='waiting';setView('patients');return;}
  if(b.dataset.stage){stageOffer(b.dataset.stage);return;}
  if(b.hasAttribute('data-back-detail')){openPatient(selectedId);return;}
  if(b.hasAttribute('data-withdraw')){const p=patients.find(p=>p.id===selectedId);p.status='waiting';p.offer=null;addHistory(p,'Предложение отменено в демо, возобновлён подбор');render();openPatient(p.id);announce('Заявка возвращена к подбору.');return;}
  if(b.id==='add-patient'){document.getElementById('patient-form').reset();openDialog('form-dialog');return;}
  if(b.id==='reset'){openDialog('reset-dialog');return;}
  if(b.id==='confirm-reset'){patients=initialPatients();resetFilters();closeDialog('reset-dialog');render();announce('Исходные примеры восстановлены.');}
});
document.addEventListener('input',e=>{if(e.target.id==='search'){filters.search=e.target.value;document.getElementById('table-region').innerHTML=tableHTML();}});
document.addEventListener('change',e=>{if(e.target.dataset.filter){filters[e.target.dataset.filter]=e.target.value;document.getElementById('table-region').innerHTML=tableHTML();}});
document.addEventListener('submit',e=>{
  if(!['patient-form','offer-form','confirm-form'].includes(e.target.id))return;e.preventDefault();const f=e.target;const data=new FormData(f);
  if(f.id==='patient-form'){
    const age=Number(data.get('age')),procedure=Number(data.get('procedure')),payment=data.get('payment'),city=data.get('city');
    if(!Number.isInteger(age)||age<18||age>100||!PROCEDURES[procedure]||!PAYMENT[payment]||!['Челябинск','Магнитогорск','Златоуст','Миасс','Копейск','Сатка'].includes(city))return;
    const id=Math.max(...patients.map(p=>p.id))+1;
    patients.unshift({id,age,city,procedure,payment,ready:data.get('ready')==='true',travel:data.has('travel'),status:'waiting',created:'2026-10-03',offer:null,history:[{text:'Создана пробная заявка',time:'Сейчас · действие в демоверсии'}]});
    closeDialog('form-dialog');resetFilters();view='patients';if(location.hash!=='#patients')location.hash='patients';render();announce(`Пробная заявка Д-${id} создана в этой вкладке.`);
  }
  if(f.id==='offer-form'){
    const p=patients.find(p=>p.id===selectedId),c=CLINICS.find(c=>c.id===f.dataset.clinic);const payment=data.get('payment'),date=data.get('date');
    if(!p||p.status!=='waiting'||!c||!matches(p,c)||availableSlots(c)<1||!['oms','paid'].includes(payment)||!compatiblePayment(p.payment,payment)||!compatiblePayment(c.payment,payment)||!/^2026-\d{2}-\d{2}$/.test(date)||date<c.date||date>'2026-12-31')return;
    p.offer={clinicId:c.id,payment,date};p.status='review';addHistory(p,`Предложено: ${c.name}, ${dateLabel(date)}, ${PAYMENT[payment]}`);render();openPatient(p.id);announce('Пробное предложение создано. Никаких сообщений не отправлено.');
  }
  if(f.id==='confirm-form'){
    const p=patients.find(p=>p.id===selectedId);if(!p||p.status!=='review'||!data.has('agreed')||(!p.ready&&!data.has('ready')))return;
    const c=CLINICS.find(c=>c.id===p.offer.clinicId);if(availableSlots(c)<1){const message=document.createElement('p');message.className='detail-warning';message.textContent='Все места в этом сценарии уже заняты. Верните заявку к подбору.';f.replaceWith(message);return;}
    if(!p.ready){p.ready=true;addHistory(p,'Готовность обследований подтверждена в демо');}p.status='confirmed';addHistory(p,'Пациент и клиника согласовали госпитализацию в демо');render();openPatient(p.id);announce('Приём подтверждён только в учебном сценарии.');
  }
});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
navigate();

// Optional browser WebMCP: read the same synthetic registry shown in the UI.
if(document.modelContext?.registerTool){
  const life=new AbortController();
  try{Promise.resolve(document.modelContext.registerTool({name:'read_demo_referrals',description:'Read synthetic referrals in the MedRoute demo. No real patient data. Optional status filter.',inputSchema:{type:'object',properties:{status:{type:'string',enum:['waiting','review','confirmed']}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='status')||(input.status!==undefined&&!Object.hasOwn(STATUS,input.status)))throw new Error('Invalid status filter');return patients.filter(p=>!input.status||p.status===input.status).map(p=>({id:`Д-${p.id}`,city:p.city,procedure:PROCEDURES[p.procedure].name,status:STATUS[p.status],payment:PAYMENT[p.payment]}));}}, {signal:life.signal})).catch(()=>{});}catch{/* Optional API: the demo works without it. */}
  window.addEventListener('pagehide',()=>life.abort(),{once:true});
}
