// Personal memories stay local until an authenticated backend is connected.
const baseProfile = profile;
let notebook = load('notebook', []);
let identity = load('identity', {nickname:'收藏星光的人', anniversary:''});
let badgeDates = load('badgeDates', {});
let badgeDisplay = load('badgeDisplay', []);
const badgeCatalog = [
 {id:'first',icon:'✦',name:'初遇星间',subtitle:'THE FIRST HELLO',description:'首次注册账号后获得。账号服务尚未接入，当前无法领取。'},
 {id:'collector',icon:'♡',name:'心动收藏家',subtitle:'MOMENTS COLLECTOR',description:'收藏 10 条不同内容后获得。当前示例内容不足 10 条，待内容库扩充后开放。'},
 {id:'writer',icon:'✎',name:'回忆落笔人',subtitle:'THE MEMORY KEEPER',description:'保存第一篇私人追星手账后获得。'},
 {id:'anniversary',icon:'❋',name:'同行周年',subtitle:'ANOTHER YEAR TOGETHER',description:'设置真实入坑日期，在至少一周年后的纪念日到访获得。2 月 29 日在平年按 2 月 28 日计算。'},
 {id:'together',icon:'◎',name:'共同的那一天',subtitle:'A DAY WE SHARE',description:'参与正式开放的社区主题活动后获得。当前示例活动不计入，等待活动开放。'}
];
function localDay(){return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function anniversaryReady(){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(identity.anniversary))return false;
 const today=localDay(),year=Number(today.slice(0,4));
 let mmdd=identity.anniversary.slice(5);
 if(mmdd==='02-29'&&new Date(year,1,29).getMonth()!==1)mmdd='02-28';
 return year>Number(identity.anniversary.slice(0,4))&&today.slice(5)===mmdd;
}
function refreshBadges(){
 const earned=[];
 if(notebook.length)earned.push('writer');
 if(new Set(saved).size>=10)earned.push('collector');
 if(anniversaryReady())earned.push('anniversary');
 let changed=false;
 for(const id of earned)if(!badgeDates[id]){badgeDates[id]=localDay();changed=true;}
 if(changed)persist('badgeDates',badgeDates);
}
function badgeCard(b){const earned=Boolean(badgeDates[b.id]),displayed=badgeDisplay.includes(b.id);return `<article class="badge-card ${earned?'earned':'locked'}"><button class="badge-art" data-badge="${b.id}" aria-label="查看${b.name}详情"><span>${b.icon}</span><i>STAR MEMORY</i></button><div class="badge-subtitle">${b.subtitle}</div><h3>${b.name}</h3><p>${earned?'获得于 '+badgeDates[b.id]:'尚未解锁'}</p>${earned?`<button class="badge-toggle" data-display-badge="${b.id}" aria-pressed="${displayed}">${displayed?'✓ 已佩戴':'＋ 展示徽章'}</button>`:`<button class="badge-toggle" data-badge="${b.id}">查看获得条件</button>`}</article>`;}
profile=function(){
 refreshBadges();
 const original=baseProfile();
 const rest=original.slice(original.indexOf('<div class="section-heading">'));
 return `<div class="eyebrow">MY PRIVATE CONSTELLATION</div><h1 class="page-heading">我的星间</h1><p class="intro">让每一次心动，都有地方珍藏。</p><section class="member-cover"><div class="member-orbit">✦</div><div class="member-label">STAR MEMORY · PERSONAL EDITION</div><div class="member-main"><div class="member-avatar">${escapeHTML(identity.nickname.slice(0,1))}</div><div><h2>${escapeHTML(identity.nickname)}</h2><p>${identity.anniversary?'从 '+escapeHTML(identity.anniversary)+' 开始，喜欢有了自己的日期':'每一个喜欢的瞬间，都值得被记住。'}</p><div class="worn-badges">${badgeDisplay.filter(id=>badgeDates[id]).map(id=>{const b=badgeCatalog.find(b=>b.id===id);return b?`<button data-badge="${id}">${b.icon} ${b.name}</button>`:'';}).join('')||'<span>你的徽章故事，从第一篇手账开始</span>'}</div></div></div><div class="member-stats"><div><strong>${saved.length}</strong><span>心动收藏</span></div><div><strong>${notebook.length}</strong><span>私人手账</span></div><div><strong>${Object.keys(badgeDates).length}</strong><span>纪念徽章</span></div><div><strong>${reminders.length}</strong><span>期待的小日子</span></div></div></section><div class="local-notice">◌ 当前为本机体验 · 尚未登录 · 数据仅保存在此浏览器，清理浏览器数据会丢失。<button class="text-button" id="export-memory">导出备份 ↓</button></div><section class="identity-panel"><div><div class="eyebrow">A LITTLE ABOUT YOU</div><h2>你的追星名片</h2><p>不需要真实姓名，按自己的节奏留下纪念。</p></div><form id="identity-form"><label>昵称<input name="nickname" maxlength="24" required value="${escapeHTML(identity.nickname)}"></label><label>入坑日期<input name="anniversary" type="date" max="${localDay()}" value="${escapeHTML(identity.anniversary)}"></label><button class="primary">保存名片</button></form></section><section class="badge-section">${heading('星光徽章展柜','THE LITTLE HONORS')}<p class="intro">每一枚都有故事。自选最多三枚展示，不排名，不因断签降级。</p><div class="badge-grid">${badgeCatalog.map(badgeCard).join('')}</div></section><section class="notebook-section">${heading('我的私人手账','LET THE MEMORIES STAY')}<p class="intro">只写给自己的一页，不会发布到社区。</p><form class="post-form" id="notebook-form"><input name="title" placeholder="今天想记住的事" aria-label="手账标题" required maxlength="80"><textarea name="body" placeholder="那首歌、那个舞台，还有那时候的我…" aria-label="私人手账正文" required maxlength="5000"></textarea><button class="primary">珍藏这一页 ↗</button></form><div class="notebook-list">${notebook.map(n=>`<article class="notebook-entry"><div class="eyebrow">${escapeHTML(n.date)} · 仅自己可见</div><h3>${escapeHTML(n.title)}</h3><p>${escapeHTML(n.body)}</p><button class="text-button" data-remove-note="${n.id}">删除此页</button></article>`).join('')||'<div class="empty">第一篇手账还在等你落笔。可以从一首最近常听的歌开始。</div>'}</div></section>${rest}`;
};
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.badge){const badge=badgeCatalog.find(x=>x.id===b.dataset.badge);if(!badge)return;$('#detail-content').innerHTML=`<div class="eyebrow">A LITTLE HONOR, A LASTING MEMORY</div><div class="badge-detail-art">${badge.icon}</div><h2>${badge.name}</h2><p>${badge.description}</p><p>${badgeDates[badge.id]?'已获得 · '+badgeDates[badge.id]:'尚未获得'}</p><p class="source-note">纪念与成长徽章不代表官方认证。当前获得记录仅保存在本机。</p>`;$('#detail').showModal();}
 if(b.dataset.displayBadge){const id=b.dataset.displayBadge;if(!badgeDates[id])return;if(badgeDisplay.includes(id))badgeDisplay=badgeDisplay.filter(x=>x!==id);else if(badgeDisplay.length<3)badgeDisplay.push(id);else {toast('最多展示三枚徽章，先取下一枚再试试');return;}persist('badgeDisplay',badgeDisplay);render();}
 if(b.dataset.removeNote){if(!confirm('确定删除这篇私人手账？删除后无法恢复，获得的纪念徽章会保留。'))return;notebook=notebook.filter(n=>n.id!==b.dataset.removeNote);persist('notebook',notebook);render();toast('已删除这篇手账');}
 if(b.id==='export-memory'){const data={version:1,exportedAt:new Date().toISOString(),identity,notebook,badgeDates,badgeDisplay,saved,posts,comments,reminders,likes};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='星间私人备份-'+localDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('备份包含私人手账，请妥善保管');}
});
document.addEventListener('submit',event=>{
 if(event.target.id==='identity-form'){event.preventDefault();const form=new FormData(event.target),nickname=form.get('nickname').trim(),anniversary=form.get('anniversary');if(!nickname){toast('请填写昵称');return;}if(anniversary&&anniversary>localDay()){toast('入坑日期不能晚于今天');return;}identity={nickname,anniversary};persist('identity',identity);render();toast('追星名片已保存在本机');}
 if(event.target.id==='notebook-form'){event.preventDefault();const form=new FormData(event.target),title=form.get('title').trim(),body=form.get('body').trim();if(!title||!body){toast('写下标题和回忆，再珍藏这一页吧');return;}notebook.unshift({id:crypto.randomUUID(),date:localDay(),title,body});persist('notebook',notebook);const first=!badgeDates.writer;refreshBadges();render();toast(first?'已解锁「回忆落笔人」纪念徽章':'这页回忆已珍藏');}
});
render();
