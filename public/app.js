const $ = s => document.querySelector(s);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(key, fallback) { try { return JSON.parse(localStorage.getItem('star.' + key)) ?? fallback; } catch { return fallback; } }
function persist(key, value) { try { localStorage.setItem('star.' + key, JSON.stringify(value)); } catch { toast('浏览器存储不可用，本次操作仅在当前页面保留'); } }
let saved = load('saved', []), posts = load('posts', []), comments = load('comments', {}), reminders = load('reminders', []), likes = load('likes', []);
let person = 'all', query = '', page = 'home';
const people = {heechul:'金希澈',han:'韩庚',jae:'金在中'};
const photos = {
 concert:'/concert.svg',
 mic:'/mic.svg',
 music:'/music.svg',
 sky:'/concert.svg'
};
const news = [
 {id:'n1',person:'heechul',type:'节目手记',title:'镜头亮起的瞬间，依然是熟悉的快乐',image:photos.mic,date:'灵感示例',body:'在这里整理希澈的公开节目、采访和有趣片段。正式资讯将附上原始发布时间、官方来源与链接，方便你安心追更。'},
 {id:'n2',person:'han',type:'舞台收藏',title:'灯光与掌声之间，重温热爱的舞台',image:photos.concert,date:'灵感示例',body:'把韩庚值得反复观看的舞台放进自己的收藏册。未来可按演出年份、歌曲和节目搜索，并跳转至官方视频。'},
 {id:'n3',person:'jae',type:'音乐时刻',title:'戴上耳机，让喜欢的声音陪你一会儿',image:photos.music,date:'灵感示例',body:'为金在中的音乐留一个位置：专辑故事、现场感想与你的单曲循环。此卡片用于演示内容呈现，不代表真实发布动态。'}
];
const memories = [
 {id:'m1',year:'2026',person:'all',title:'把今天，变成未来想起的一天',body:'记下你今天听到的一首歌、重看的一段舞台，或一个让你开心的瞬间。时间线会把这些细小的喜欢串起来。'},
 {id:'m2',year:'2015',person:'han',title:'你收藏的那一束舞台灯光',body:'这是一个舞台回忆条目的展示示例。正式收录时，会补充活动名称、准确日期与公开来源。'},
 {id:'m3',year:'2010',person:'jae',title:'一首歌，通向一段旧时光',body:'还记得第一次认真听见这个声音的时候吗？把那首歌和当时的故事一起存下来。此条目不对应具体历史事件。'},
 {id:'m4',year:'2005',person:'heechul',title:'故事的开头，留给第一次心动',body:'每个人的入坑时刻都不一样。这里可以珍藏你的初遇，也可以从有来源的公开资料慢慢开始考古。此条目为示例。'}
];
const events = [
 {id:'e1',day:'06',week:'FRI',person:'all',title:'周末一起重温经典舞台',sub:'11 月 · 社区主题活动示例'},
 {id:'e2',day:'12',week:'THU',person:'han',title:'我的珍藏歌单分享日',sub:'11 月 · 粉丝活动示例'},
 {id:'e3',day:'21',week:'SAT',person:'jae',title:'写一封寄给时光的信',sub:'11 月 · 回忆征集示例'}
];
const initialPosts = [{id:'welcome',person:'all',author:'一颗小星星',title:'你是从哪个瞬间开始喜欢他们的？',body:'有些歌，前奏一响就回到了那一年。想在这里慢慢收集大家的入坑故事，也把属于自己的那一页青春留下来。',sample:true}];
const routes = [['home','⌂','首页'],['archive','◷','时光馆'],['calendar','▦','追星日历'],['community','☷','粉丝社区'],['profile','♧','我的收藏']];
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2600); }
function filters() { return `<div class="filters" aria-label="人物筛选">${[['all','全部星光'],...Object.entries(people)].map(([id,name])=>`<button class="filter ${person===id?'active':''}" data-person="${id}" aria-pressed="${person===id}">${id==='all'?'✦':`<i class="dot ${id}"></i>`}${name}</button>`).join('')}</div>`; }
function tag(id) { return `<span class="tag ${id}">${people[id] || '共同的回忆'}</span>`; }
function saveButton(id) { return `<button class="save ${saved.includes(id)?'saved':''}" data-save="${id}" aria-label="${saved.includes(id)?'取消收藏':'收藏'}" aria-pressed="${saved.includes(id)}">${saved.includes(id)?'♥':'♡'}</button>`; }
function newsCard(n) { return `<article class="card"><div class="image-wrap"><img class="card-image" src="${n.image}" alt="${n.type}氛围配图，非艺人照片" loading="lazy"><span class="image-badge">${n.type} · 示例</span></div><div class="card-body">${tag(n.person)}<h3><button class="text-button card-open" style="font:inherit;color:inherit;text-align:left;padding:0" data-detail="${n.id}">${n.title}</button></h3><div class="card-meta"><span>${n.date} · 星间编辑室</span>${saveButton(n.id)}</div></div></article>`; }
function eventCard(e,full=false) { return `<div class="event"><div class="event-day">${e.day}<small>${e.week}</small></div><div class="event-body">${e.title}<small>${e.sub}</small></div>${full?`<button class="primary" data-remind="${e.id}">${reminders.includes(e.id)?'已加入清单 ✓':'加入清单'}</button>`:''}</div>`; }
function heading(title,en,action,target) { return `<div class="section-heading"><h2>${title}<small>${en}</small></h2>${action?`<a class="text-button" href="#${target}">${action} ↗</a>`:''}</div>`; }
function home() {
 const date = new Date();
 return `<section class="hello"><div><div class="eyebrow">A LITTLE SPACE FOR OUR STARS</div><h1>把喜欢，写进时光里 <span style="color:#a1ab88;font-size:20px">✧</span></h1><p>新的故事与旧的心动，都在这里相遇。</p></div><div class="date-note">${new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(date)}<span>EVERY DAY IS A MEMORY</span></div></section>${filters()}<section class="hero"><div class="hero-art"></div><div class="hero-copy"><span class="hero-label">✧ 那年今天 · OUR MEMORY</span><h2>那年今天，<br>我们在看什么？</h2><p>一段舞台，一首熟悉的歌，一场未完的青春。<br>翻开时光的这一页，找回当时心动的自己。</p><button class="primary" data-detail="today">开启今日回忆 <span style="margin-left:20px">→</span></button></div><div class="hero-bottom"><span>01</span> ━━━ 03 &nbsp; A MOMENT TO REMEMBER</div></section><div class="home-grid"><div>${heading('星光新鲜事','WHAT’S NEW','查看全部','news')}<div class="news-grid">${news.filter(n=>person==='all'||n.person===person).map(newsCard).join('')}</div><section class="community-preview">${heading('在这里，遇见同频的你','OUR LITTLE CORNER','去社区逛逛','community')}<a class="memory-note" href="#community"><div class="note-avatar">☁</div><div><p>“ 有些歌，前奏一响就回到了那一年。 ”</p><small>一颗小星星 &nbsp; · &nbsp; 回忆树洞 · 示例讨论</small></div><div class="note-heart">♡ &nbsp; 一起聊聊</div></a></section></div><aside><section class="calendar-panel"><h2>别错过的小日子 <span>▦</span></h2><div class="calendar-month">NOVEMBER · 活动排版示例</div>${events.map(e=>eventCard(e)).join('')}<a href="#calendar" class="text-button calendar-link">打开完整日历 &nbsp; →</a></section><div class="quote">“ 因为喜欢，平凡的日子也有了光。 ”<small>LITTLE THINGS, LASTING LOVE</small></div></aside></div>`;
}
function archive() { const list=memories.filter(m=>(person==='all'||m.person===person||m.person==='all')&&(m.title+m.body+m.year).includes(query)); return `<div class="eyebrow">THE MOMENTS WE KEEP</div><h1 class="page-heading">时光馆</h1><p class="intro">把每一次心动，放回它在时间里的位置。以下为时间线展示示例。</p>${filters()}<input class="search" id="memory-search" aria-label="搜索时光" placeholder="搜索年份、故事或关键词…" value="${escapeHTML(query)}"><div class="timeline" id="timeline">${timeline(list)}</div>`; }
function timeline(list) { return list.map(m=>`<section class="timeline-item"><h3>${m.year}</h3><article class="card">${tag(m.person)}<h2 style="font-size:16px;font-weight:500">${m.title}</h2><p>${m.body}</p><div class="card-meta"><span>回忆示例 · 尚未关联历史资料</span>${saveButton(m.id)}</div></article></section>`).join('')||'<p class="empty">还没有找到这段时光，换个关键词试试。</p>'; }
function postCard(p) { return `<article class="card post"><div class="post-top"><span class="note-avatar">✧</span><span>${escapeHTML(p.author)}<br><small>${p.sample?'示例讨论':'我的本地帖子'}</small></span>${tag(p.person)}</div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.body)}</p><button class="text-button" data-like="${p.id}">${likes.includes(p.id)?'♥ 已喜欢':'♡ 喜欢'}</button><button class="text-button" data-discuss="${p.id}">☷ 留言 ${ (comments[p.id]||[]).length || ''}</button>${!p.sample?`<button class="text-button" data-delete="${p.id}">删除我的帖子</button>`:''}</article>`; }
function community() { return `<div class="eyebrow">SAME STARS, SHARED STORIES</div><h1 class="page-heading">遇见同频的你</h1><p class="intro">聊聊舞台，也聊聊那些因为喜欢而变好的日子。帖子仅保存在此浏览器，尚未连接在线社区。</p>${filters()}<form id="post-form" class="post-form"><input name="title" required maxlength="80" placeholder="为你的故事写个标题" aria-label="帖子标题"><textarea name="body" required maxlength="3000" placeholder="分享你的入坑瞬间、舞台感想或追星日记…" aria-label="帖子正文"></textarea><select name="person" aria-label="帖子专区"><option value="all">共同交流区</option value="heechul">金希澈专区</option><option value="han">韩庚专区</option><option value="jae">金在中专区</option></select><button class="primary" type="submit">留下我的故事 ↗</button></form>${[...posts,...initialPosts].filter(p=>person==='all'||p.person===person).map(postCard).join('')||'<p class="empty">这个专区还没有故事，留下第一篇吧。</p>'}`; }
function profile() { const items=[...news,...memories].filter(n=>saved.includes(n.id)); return `<div class="eyebrow">MY LITTLE UNIVERSE</div><h1 class="page-heading">我的星间</h1><section class="profile-banner"><h2>你好，收藏星光的人 ✧</h2><p>${saved.length} 份心动收藏 &nbsp; · &nbsp; ${posts.length} 篇追星日记 &nbsp; · &nbsp; ${reminders.length} 个活动清单</p><p>你的收藏和故事保存在当前浏览器，无需登录。清理浏览器数据会移除这些记录。</p></section>${heading('我的收藏册','SAVED MOMENTS')}<div class="full-grid">${items.map(n=>n.image?newsCard(n):`<article class="card post">${tag(n.person)}<h3>${n.title}</h3><p>${n.body}</p>${saveButton(n.id)}</article>`).join('')||'<div class="empty" style="grid-column:1/-1">收藏还空着。点击内容上的 ♡，留住你的第一个心动瞬间。</div>'}</div>${reminders.length?`<section style="margin-top:30px">${heading('我的活动清单','LITTLE DATES')}<div class="events-page">${events.filter(e=>reminders.includes(e.id)).map(e=>eventCard(e,true)).join('')}</div><p class="source-note">清单仅作本地记录，不会发送系统通知。活动均为示例。</p></section>`:''}`; }
function render() {
 page=location.hash.slice(1)||'home'; if(![...routes.map(r=>r[0]),'news'].includes(page))page='home';
 $('nav').innerHTML=routes.map(([id,icon,label])=>`<a href="#${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span class="nav-icon">${icon}</span>${label}</a>`).join('');
 $('#page-name').textContent=page==='news'?'星光新鲜事':routes.find(r=>r[0]===page)[2];
 $('#app').innerHTML=({home,archive,community,profile,calendar:()=>`<div class="eyebrow">DATES TO LOOK FORWARD TO</div><h1 class="page-heading">别错过的小日子</h1><p class="intro">十一月 · 以下均为社区活动示例，不代表艺人真实行程。加入清单仅保存在本地，不发送通知。</p>${filters()}<div class="events-page">${events.filter(e=>person==='all'||e.person===person||e.person==='all').map(e=>eventCard(e,true)).join('')}</div>`,news:()=>`<div class="eyebrow">LET THE GOOD STORIES FIND YOU</div><h1 class="page-heading">星光新鲜事</h1><p class="intro">三份热爱，在这里相遇。以下是内容样式示例，尚未接入真实资讯。</p>${filters()}<div class="full-grid">${news.filter(n=>person==='all'||n.person===person).map(newsCard).join('')}</div>`})[page]();
}
function showDiscussion(id,title) {
 $('#detail-content').innerHTML=`<div class="eyebrow">A PAGE OF OUR MEMORY</div><h2>${escapeHTML(title)}</h2>${id==='today'?`<img class="detail-image" src="${photos.concert}" alt="演出灯光氛围配图"><p>闭上眼睛，想一想：第一次让你反复重看的舞台，是哪一个？当时的你，又在过着怎样的生活？</p><p class="source-note">今日回忆主题示例 · 尚未收录有来源的“历史上的今天”资料，不对应真实历史事件。</p>`:''}<div class="comment-list"><div class="eyebrow">把你的那一页青春，留在这里</div><div id="comments">${commentMarkup(id)}</div></div><form class="comment-form" id="comment-form" data-id="${id}"><input name="comment" required maxlength="500" aria-label="回忆留言" placeholder="那时候的我…"><button class="primary" type="submit">留下回忆</button></form><p class="source-note">留言仅在此浏览器保存。</p>`;
 $('#detail').showModal();
}
function commentMarkup(id){return (comments[id]||[]).map(c=>`<div class="comment-item"><span class="tag">我 · 一颗小星星</span><br>${escapeHTML(c)}</div>`).join('')||'<p>这一页还空着，写下你的第一个回忆吧。</p>';}
document.addEventListener('click',e=>{
 const b=e.target.closest('button'); if(!b)return;
 if(b.dataset.person){person=b.dataset.person;render();}
 if(b.dataset.save){const id=b.dataset.save;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];persist('saved',saved);render();if($('#detail').open)b.outerHTML=saveButton(id);toast(saved.includes(id)?'这份心动，已放进收藏册':'已取消收藏');}
 if(b.dataset.remind){const id=b.dataset.remind;reminders=reminders.includes(id)?reminders.filter(x=>x!==id):[...reminders,id];persist('reminders',reminders);render();toast('活动清单已更新 · 不会发送通知');}
 if(b.dataset.like){const id=b.dataset.like;likes=likes.includes(id)?likes.filter(x=>x!==id):[...likes,id];persist('likes',likes);render();}
 if(b.dataset.delete){posts=posts.filter(p=>p.id!==b.dataset.delete);persist('posts',posts);render();toast('已删除本地帖子');}
 if(b.dataset.discuss){const p=[...posts,...initialPosts].find(p=>p.id===b.dataset.discuss);if(p)showDiscussion(p.id,p.title);}
 if(b.dataset.detail){if(b.dataset.detail==='today'){showDiscussion('today','那年今天，我们在看什么？');return;}const n=news.find(n=>n.id===b.dataset.detail);if(n){$('#detail-content').innerHTML=`${tag(n.person)}<h2>${n.title}</h2><img class="detail-image" src="${n.image}" alt="${n.type}氛围配图"><p>${n.body}</p><p class="source-note">内容展示示例 · 图片为通用氛围配图，并非艺人照片。</p>${saveButton(n.id)}`;$('#detail').showModal();}}
});
document.addEventListener('submit',e=>{
 if(e.target.id==='post-form'){e.preventDefault();const f=new FormData(e.target);const title=f.get('title').trim(),body=f.get('body').trim();if(!title||!body){toast('标题和故事需要填写文字哦');return;}posts.unshift({id:crypto.randomUUID(),author:'一颗小星星 · 我',person:f.get('person'),title,body});persist('posts',posts);person='all';render();toast('故事已保存在当前浏览器');}
 if(e.target.id==='comment-form'){e.preventDefault();const id=e.target.dataset.id;const value=new FormData(e.target).get('comment').trim();if(!value){toast('写下一些文字，再留下回忆吧');return;}comments[id]=[...(comments[id]||[]),value];persist('comments',comments);$('#comments').innerHTML=commentMarkup(id);e.target.reset();toast('回忆已珍藏');}
});
document.addEventListener('input',e=>{if(e.target.id==='memory-search'){query=e.target.value;$('#timeline').innerHTML=timeline(memories.filter(m=>(person==='all'||m.person===person||m.person==='all')&&(m.title+m.body+m.year).includes(query)));}});
$('#close-dialog').onclick=()=>{$('#detail').close();render();};
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){e.target.close();render();}}});
$('#detail').addEventListener('cancel',()=>render());
$('#profile-button').onclick=()=>{location.hash='profile';};
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
render();
