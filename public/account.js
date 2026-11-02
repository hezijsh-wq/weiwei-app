// Email OTP auth and opt-in private snapshots. Community remains a local demo.
let accountConfig = null, accountSession = null, cloudRevision = null;
let accountLoading = true, accountBusy = false, pendingEmail = '', otpCooldown = 0;
let guestState = null;
const accountBaseProfile = profile;
const localPersist = persist;
const accountClientId = 'star.account.session';
function capturePrivate(){return {version:1,identity,notebook,saved,badgeDates,badgeDisplay};}
function validatePrivate(data){
 if(!data || data.version!==1 || !data.identity || typeof data.identity.nickname!=='string' || data.identity.nickname.length>24 || typeof data.identity.anniversary!=='string')throw new Error('存档格式不受支持，未替换当前记录。');
 if(data.identity.anniversary&&!/^\d{4}-\d{2}-\d{2}$/.test(data.identity.anniversary))throw new Error('存档日期格式不正确。');
 if(!Array.isArray(data.notebook)||data.notebook.length>10000||!data.notebook.every(n=>n&&/^[a-zA-Z0-9-]+$/.test(n.id)&&typeof n.title==='string'&&n.title.length<=80&&typeof n.body==='string'&&n.body.length<=5000&&/^\d{4}-\d{2}-\d{2}$/.test(n.date)))throw new Error('手账存档格式不正确。');
 if(!Array.isArray(data.saved)||!data.saved.every(id=>typeof id==='string'&&/^[a-z0-9-]+$/i.test(id)))throw new Error('收藏存档格式不正确。');
 const known=badgeCatalog.map(b=>b.id);
 if(!data.badgeDates||typeof data.badgeDates!=='object'||Array.isArray(data.badgeDates)||!Object.entries(data.badgeDates).every(([key,value])=>known.includes(key)&&typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)))throw new Error('徽章存档格式不正确。');
 if(!Array.isArray(data.badgeDisplay)||data.badgeDisplay.length>3||!data.badgeDisplay.every(id=>known.includes(id)&&data.badgeDates[id]))throw new Error('徽章展示格式不正确。');
 return JSON.parse(JSON.stringify(data));
}
function restorePrivate(data){const s=validatePrivate(data);identity=s.identity;notebook=s.notebook;saved=s.saved;badgeDates=s.badgeDates;badgeDisplay=s.badgeDisplay;}
// Authenticated changes remain in memory until explicitly uploaded. Preserve guest files.
persist=function(key,value){if(!accountSession)localPersist(key,value);};
function writeSession(session){
 accountSession=session;
 try{if(session)sessionStorage.setItem(accountClientId,JSON.stringify(session));else sessionStorage.removeItem(accountClientId);}catch{ /* in-memory session still works */ }
}
function accountPanel(){
 if(accountLoading)return '<section class="account-panel"><p>正在检查账号服务…</p></section>';
 if(!accountConfig)return `<section class="account-panel"><div><div class="eyebrow">YOUR SPACE, EVERYWHERE</div><h2>让回忆，跟你去每一台设备</h2><p>邮箱登录与云端存档尚未开放。本机收藏和手账仍可正常使用。</p></div><span class="account-status">等待服务接入</span></section>`;
 if(accountSession)return `<section class="account-panel signed-in"><div><div class="eyebrow">CONNECTED TO YOUR CONSTELLATION</div><h2>你的私人云端空间</h2><p>${escapeHTML(accountSession.user.email || '已验证邮箱')} · ${cloudRevision===null?'尚未读取云端状态':'云端版本 '+cloudRevision}</p><p>先读取云端版本，再选择上传。刷新或关闭前请上传修改；不会自动覆盖另一台设备的记录。</p></div><div class="account-actions"><button class="primary" id="cloud-download" ${accountBusy?'disabled':''}>读取云端存档</button><button class="primary" id="cloud-upload" ${accountBusy||cloudRevision===null?'disabled':''}>上传当前存档</button><button class="text-button" id="account-logout" ${accountBusy?'disabled':''}>退出账号</button></div></section>`;
 return `<section class="account-panel"><div><div class="eyebrow">YOUR SPACE, EVERYWHERE</div><h2>用邮箱，开启你的星间</h2><p>首次验证将创建账号，无需密码。登录不自动上传本机记录。</p></div><form id="account-email-form"><label for="account-email">邮箱地址</label><div class="account-input-row"><input id="account-email" type="email" autocomplete="email" name="email" required maxlength="254" value="${escapeHTML(pendingEmail)}" placeholder="you@example.com"><button class="primary" ${accountBusy?'disabled':''}>发送验证码</button></div></form>${pendingEmail?`<form id="account-verify-form"><label for="account-code">发送至 ${escapeHTML(pendingEmail)} 的验证码</label><div class="account-input-row"><input id="account-code" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" placeholder="邮件中的数字验证码"><button class="primary" ${accountBusy?'disabled':''}>验证并登录</button></div></form>`:''}<p class="source-note">登录即表示同意创建私人存档账号。当前服务处于测试阶段，不支持站内注销；请勿提交敏感信息。</p></section>`;
}
profile=function(){let content=accountBaseProfile();if(accountSession){content=content.replace('当前为本机体验 · 尚未登录 · 数据仅保存在此浏览器，清理浏览器数据会丢失。','已登录 · 手动同步模式 · 当前修改需点击上传才会保存到云端。');content=content.replace('尚未登录','已登录');}return accountPanel()+content;};
const firstBadge=badgeCatalog.find(b=>b.id==='first');
firstBadge.description='首次成功验证邮箱并登录后获得。仅为平台纪念徽章，不代表官方认证。';
function authError(error){
 if(error.message?.includes('SYNC_CONFLICT'))return '其他设备已更新存档。请先导出本机备份，再读取云端版本，避免覆盖。';
 if(error.status===429)return '操作太频繁，请稍后再试。';
 if(error.status===401||error.status===403)return '验证已过期或当前请求未获授权，请重新登录。';
 if(error.status===400)return '邮箱或验证码无效、已过期，或邮件服务尚未配置好，请检查后重试。';
 if(error.status===404||error.status===406)return '云端存档服务尚未准备好，请联系站点维护者。';
 if(error.message==='Failed to fetch')return '网络连接失败，当前本机记录未改变，请稍后重试。';
 return error.safeMessage || '操作未完成。请检查服务配置或网络后重试，当前记录未被替换。';
}
async function serviceRequest(path,body,token,method='POST'){
 const result=await fetch(accountConfig.url+path,{method,headers:{apikey:accountConfig.key,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await result.json().catch(()=>null);
 if(!result.ok){const error=new Error(data?.message||data?.msg||'Service request failed');error.status=result.status;throw error;}
 return data;
}
async function accessToken(){
 if(!accountSession)throw new Error('Not signed in');
 if(accountSession.expires_at>Date.now()/1000+60)return accountSession.access_token;
 const session=await serviceRequest('/auth/v1/token?grant_type=refresh_token',{refresh_token:accountSession.refresh_token});
 if(!session?.access_token||session.user?.id!==accountSession.user.id)throw new Error('Invalid refresh');
 writeSession({...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+session.expires_in});
 return accountSession.access_token;
}
function sessionSnapshot(){return JSON.parse(JSON.stringify({private:capturePrivate(),posts,comments,reminders,likes}));}
function enterAccount(session){
 guestState=sessionSnapshot();
 writeSession({...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+session.expires_in});
 cloudRevision=null;
 // Start from empty account state. Local records import only with explicit permission.
 identity={nickname:'收藏星光的人',anniversary:''};notebook=[];saved=[];badgeDates={first:localDay()};badgeDisplay=[];
 posts=[];comments={};reminders=[];likes=[];
}
async function runAccount(action){if(accountBusy)return;accountBusy=true;render();try{await action();}catch(error){toast(authError(error));}finally{accountBusy=false;render();}}
document.addEventListener('submit',event=>{
 if(event.target.id==='account-email-form'){
  event.preventDefault();const email=new FormData(event.target).get('email').trim();
  if(Date.now()<otpCooldown){toast('请等待一分钟后再次发送验证码');return;}
  runAccount(async()=>{await serviceRequest('/auth/v1/otp',{email,create_user:true});pendingEmail=email;otpCooldown=Date.now()+60000;toast('验证码已发送，请查看邮箱及垃圾邮件文件夹');});
 }
 if(event.target.id==='account-verify-form'){
  event.preventDefault();const token=new FormData(event.target).get('code').trim(),email=pendingEmail;
  runAccount(async()=>{const session=await serviceRequest('/auth/v1/verify',{email,token,type:'email'});if(!session?.access_token||!session.user?.id)throw new Error('Invalid auth response');enterAccount(session);pendingEmail='';toast('登录成功，本机旧记录尚未上传');});
 }
});
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.id==='cloud-download')runAccount(async()=>{
  const token=await accessToken();const rows=await serviceRequest('/rest/v1/fan_spaces?select=data,revision',null,token,'GET');
  if(!Array.isArray(rows)||rows.length>1)throw new Error('Unexpected response');
  if(!rows.length){cloudRevision=0;toast('云端还没有存档，可导入本机记录后上传');return;}
  const data=validatePrivate(rows[0].data);
  if(!confirm('读取云端会替换当前页面里的收藏、手账和名片。建议先导出备份。是否继续？'))return;
  restorePrivate(data);badgeDates.first ||=localDay();cloudRevision=rows[0].revision;toast('云端存档已读取');
 });
 if(b.id==='cloud-upload')runAccount(async()=>{
  if(cloudRevision===null)return;
  if(!confirm('将当前收藏、名片、私人手账和徽章保存到你的账号？本地社区帖子与评论不会上传。'))return;
  const snapshot=validatePrivate(capturePrivate());if(new Blob([JSON.stringify(snapshot)]).size>1000000){toast('存档超过 1MB，请先导出备份并精简内容');return;}
  const revision=await serviceRequest('/rest/v1/rpc/save_fan_space',{snapshot,expected_revision:cloudRevision},await accessToken());
  if(!Number.isSafeInteger(revision)||revision<1)throw new Error('Invalid revision');cloudRevision=revision;toast('私人存档已保存到云端');
 });
 if(b.id==='account-import'){
  if(!accountSession||!guestState)return;
  if(!confirm('导入登录前的本机收藏、手账与名片，会替换当前页面的对应记录。尚不会上传云端，是否继续？'))return;
  restorePrivate(guestState.private);badgeDates.first ||=localDay();render();toast('已导入本机记录；确认内容后可上传云端');
 }
 if(b.id==='account-logout')runAccount(async()=>{
  if(!confirm('退出会丢弃当前未上传的修改，请先上传或导出备份。确定退出？'))return;
  // Remote revocation must succeed before claiming this session is signed out.
  const token=await accessToken();await serviceRequest('/auth/v1/logout',null,token);
  writeSession(null);cloudRevision=null;
  if(guestState){restorePrivate(guestState.private);({posts,comments,reminders,likes}=guestState);guestState=null;}
  toast('已退出账号，恢复登录前的本机空间');
 });
});
const previousAccountPanel=accountPanel;
accountPanel=function(){return previousAccountPanel()+(accountSession&&guestState?'<div class="account-import"><span>登录前的本机收藏和手账还在，是否带进账号？</span><button class="text-button" id="account-import">导入本机记录 →</button></div>':'');};
(async()=>{
 try{
  const response=await fetch('/api/config',{cache:'no-store'});const config=await response.json();
  if(!response.ok||!config.configured) return;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||typeof config.key!=='string')return;
  accountConfig=config;
  let session;try{session=JSON.parse(sessionStorage.getItem(accountClientId));}catch{}
  if(session?.refresh_token&&session?.user?.id){
   accountSession=session;
   try{const token=await accessToken();const user=await serviceRequest('/auth/v1/user',null,token,'GET');if(user.id!==session.user.id)throw new Error('Invalid identity');enterAccount({...accountSession,user});}
   catch{writeSession(null);toast('登录状态已过期，请重新验证邮箱');}
  }
 }catch{ /* Keep local mode available if the API is unavailable. */ }
 finally{accountLoading=false;render();}
})();
