import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,signInAnonymously,signInWithEmailAndPassword,signOut,updatePassword,reauthenticateWithCredential,EmailAuthProvider} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,updateDoc,collection,getDocs,deleteDoc,onSnapshot,serverTimestamp,writeBatch} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {firebaseConfig,ADMIN_EMAIL} from "./firebase-config.js";
import {CONTENT_VERSION,ZONES,DEFAULT_QUESTIONS,DEFAULT_MESSAGES} from "./questions.js";

const GAME_VERSION = "2026-08-26-v4-delivery";
const fb=initializeApp(firebaseConfig),auth=getAuth(fb),db=getFirestore(fb);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], shuffle=a=>[...a].sort(()=>Math.random()-.5), rand=a=>a[Math.floor(Math.random()*a.length)];
let settings={gameOpen:true,forceStop:false,previewEnabled:false,messages:structuredClone(DEFAULT_MESSAGES)},questions=structuredClone(DEFAULT_QUESTIONS),student=null,progress=null,currentQuestion=null,answerAttempt=0,deliveryAttempt=0,studentCache=[],selectedAdminClass=1;

function show(id){
  $$(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top:0});
  $("#topProgress").classList.toggle("hidden",!["#screen-world","#screen-case","#screen-delivery","#screen-badge"].includes(id));
}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add("hidden"),2200);}
function modal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modalClose").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()}
const sid=(c,n)=>`${c}-${String(n).padStart(2,"0")}`;
const solvedIds=()=>Object.entries(progress?.solved||{}).filter(([,v])=>v?.done).map(([k])=>k);
const totalSolved=()=>solvedIds().length;
const zoneSolved=z=>questions.filter(q=>q.zone===z&&progress?.solved?.[q.id]?.done).length;
const questionById=id=>questions.find(q=>q.id===id);
const unsolved=()=>questions.filter(q=>!progress?.solved?.[q.id]?.done);
function renderTop(){$("#topProgress strong").textContent=`${totalSolved()}/20`}
function zoneLabel(z){return ZONES[z]?.label||z}
function shortZoneFull(z){return ZONES[z]?.full||""}

function setupSelectors(){
  $("#classSelect").innerHTML=Array.from({length:7},(_,i)=>`<option value="${i+1}">${i+1}반</option>`).join("");
  $("#numberSelect").innerHTML=Array.from({length:28},(_,i)=>`<option value="${i+1}">${i+1}번</option>`).join("");
  $("#statsClassSelect").innerHTML=`<option value="all">전체</option>`+Array.from({length:7},(_,i)=>`<option value="${i+1}">${i+1}반</option>`).join("");
  $("#classTabs").innerHTML=Array.from({length:7},(_,i)=>`<button data-class="${i+1}" class="${i===0?"active":""}">${i+1}반</button>`).join("");
}
setupSelectors();

async function ensureAnon(){if(auth.currentUser?.email===ADMIN_EMAIL)await signOut(auth);if(!auth.currentUser)await signInAnonymously(auth)}
async function loadSettings(){try{const s=await getDoc(doc(db,"config","settings"));if(s.exists())settings={...settings,...s.data()};else await setDoc(doc(db,"config","settings"),settings)}catch(e){console.warn(e)}renderHomeState()}
async function loadQuestions(){try{const r=doc(db,"config","questions"),s=await getDoc(r),d=s.exists()?s.data():null;if(d?.contentVersion===CONTENT_VERSION&&Array.isArray(d.items))questions=d.items;else{questions=structuredClone(DEFAULT_QUESTIONS);await setDoc(r,{items:questions,contentVersion:CONTENT_VERSION,updatedAt:serverTimestamp()})}}catch(e){console.warn(e)}}
function renderHomeState(){$("#closedBanner").classList.toggle("hidden",settings.gameOpen);$("#startBtn").disabled=!settings.gameOpen;$("#startBtn").style.opacity=settings.gameOpen?"1":".55"}
onSnapshot(doc(db,"config","settings"),s=>{if(s.exists()){settings={...settings,...s.data()};renderHomeState();if(!settings.gameOpen&&settings.forceStop&&["screen-world","screen-case","screen-delivery","screen-badge"].some(x=>$(`#${x}`).classList.contains("active"))){toast("선생님이 게임을 마감했습니다.");setTimeout(()=>show("#screen-home"),800)}}});

$("#startBtn").onclick=async()=>{
  if(!settings.gameOpen)return toast("현재 게임이 마감되었습니다.");
  const cls=+$("#classSelect").value,num=+$("#numberSelect").value,name=$("#nameInput").value.trim();
  if(!name)return toast("이름을 입력해 주세요.");
  await ensureAnon();
  const id=sid(cls,num),r=doc(db,"students",id),s=await getDoc(r);
  if(s.exists()){
    const d=s.data();
    if(d.name&&d.name!==name)return toast("등록된 이름과 다릅니다. 이름을 확인해 주세요.");
    if(d.progress?.gameVersion!==GAME_VERSION){
      modal(`<h2>게임이 새롭게 바뀌었어요!</h2><p>이번 버전에서는 사건을 해결한 뒤 인권 배지를 직접 알맞은 마을에 배달합니다.</p><button id="newVersionBtn" class="primary xl">새 게임 시작</button>`);
      $("#newVersionBtn").onclick=async()=>{closeModal();await createStudent(id,cls,num,name)};return;
    }
    student={id,cls,num,name};progress=d.progress;
    if(progress.completed){showResult();return}
    modal(`<h2>이어할까요?</h2><p>현재 <strong>${totalSolved()} / 20</strong>개의 인권 배지를 배달했습니다.</p><div class="row-actions"><button id="resumeBtn" class="primary">이어하기</button><button id="restartBtn" class="ghost">처음부터</button></div>`);
    $("#resumeBtn").onclick=()=>{closeModal();enterWorld()};
    $("#restartBtn").onclick=async()=>{if(confirm("기존 기록을 지우고 처음부터 시작할까요?")){closeModal();await createStudent(id,cls,num,name)}};
  }else await createStudent(id,cls,num,name);
};

async function createStudent(id,cls,num,name){
  student={id,cls,num,name};
  progress={
    gameVersion:GAME_VERSION,
    solved:{},
    answers:{},
    deliveries:{},
    startedAt:new Date().toISOString(),
    completed:false,
    completedAt:null,
    currentQuestionId:null
  };
  await setDoc(doc(db,"students",id),{cls,num,name,status:"doing",progress,updatedAt:serverTimestamp()});
  enterWorld();
}
async function save(){
  try{await updateDoc(doc(db,"students",student.id),{progress,status:progress.completed?"done":"doing",updatedAt:serverTimestamp()})}
  catch(e){console.error(e);toast("잠시 저장하지 못했어요. 인터넷 연결을 확인해 주세요.")}
}

function enterWorld(){
  $("#studentBadge").textContent=`${student.cls}반 ${student.num}번 ${student.name}`;
  renderWorld();
  show("#screen-world");
}
function renderWorld(){
  const total=totalSolved();
  $("#worldCount").textContent=`${total}/20`;
  $("#worldBar").style.width=`${total/20*100}%`;
  Object.keys(ZONES).forEach(z=>{
    const n=zoneSolved(z);
    const el=$(`#world-${z}`);
    if(el)el.textContent=`${n}/${ZONES[z].target}`;
  });
  $("#worldMessage").textContent=
    total===0?"첫 번째 사건을 만나볼까요?":
    total<5?"좋아! 인권지도가 하나씩 채워지고 있어요.":
    total<10?"벌써 여러 마을에 배지를 배달했어요!":
    total<15?"절반 넘었어! 이제 어떤 권리인지 감이 오지?":
    total<20?"거의 다 왔어! 마지막 배지까지 가보자!":
    "인권지도 완성!";
  renderTop();
  if(total===20&&!progress.completed)showResult();
}

$("#worldHomeBtn").onclick=()=>show("#screen-home");
$("#getCaseBtn").onclick=()=>openNextCase();

function openNextCase(){
  const remain=unsolved();
  if(!remain.length)return showResult();
  // Mix categories so students cannot infer category from sequence.
  currentQuestion=shuffle(remain)[0];
  progress.currentQuestionId=currentQuestion.id;
  answerAttempt=0;
  deliveryAttempt=0;
  renderCase();
  save();
}
function renderCase(){
  $("#caseLocation").textContent=`${currentQuestion.emoji} ${currentQuestion.location}`;
  $("#caseCount").textContent=`배지 ${totalSolved()+1} / 20`;
  $("#caseSituation").textContent=currentQuestion.situation;
  $("#caseFeedback").className="feedback hidden";
  $("#toDeliveryBtn").classList.add("hidden");
  const distractors=shuffle(questions.filter(q=>q.id!==currentQuestion.id).map(q=>q.right)).slice(0,3);
  const choices=shuffle([currentQuestion.right,...distractors]);
  $("#caseOptions").innerHTML=choices.map(x=>`<button>${x}</button>`).join("");
  $$("#caseOptions button").forEach(b=>b.onclick=()=>answerCase(b.textContent));
  show("#screen-case");
  renderTop();
}
$("#caseBackBtn").onclick=enterWorld;

async function answerCase(choice){
  answerAttempt++;
  const ok=choice===currentQuestion.right;
  const a=progress.answers[currentQuestion.id]||{tries:[],firstCorrect:null,revealed:false};
  a.tries.push(choice);
  if(a.firstCorrect===null)a.firstCorrect=ok;
  progress.answers[currentQuestion.id]=a;

  if(ok){
    $("#caseFeedback").className="feedback good";
    $("#caseFeedback").innerHTML=`<strong>${rand(settings.messages?.correct||DEFAULT_MESSAGES.correct)}</strong><br>${currentQuestion.explanation}`;
    $("#caseOptions").innerHTML="";
    $("#toDeliveryBtn").classList.remove("hidden");
  }else if(answerAttempt===1){
    $("#caseFeedback").className="feedback warn";
    $("#caseFeedback").textContent=rand(settings.messages?.firstWrong||DEFAULT_MESSAGES.firstWrong);
  }else{
    a.revealed=true;
    $("#caseFeedback").className="feedback warn";
    $("#caseFeedback").innerHTML=`정답은 <strong>「${currentQuestion.right}」</strong>예요.<br>${currentQuestion.explanation}<br><small>${settings.messages?.secondWrong||DEFAULT_MESSAGES.secondWrong}</small>`;
    $("#caseOptions").innerHTML="";
    $("#toDeliveryBtn").classList.remove("hidden");
  }
  await save();
}

$("#toDeliveryBtn").onclick=()=>openDelivery();
function openDelivery(){
  $("#deliveryEmoji").textContent=currentQuestion.emoji;
  $("#deliveryRight").textContent=currentQuestion.right;
  $("#deliveryExplanation").textContent=currentQuestion.explanation;
  $("#deliveryFeedback").className="feedback hidden";
  deliveryAttempt=0;
  $$(".delivery-zone").forEach(b=>{b.disabled=false;b.onclick=()=>answerDelivery(b.dataset.zone)});
  show("#screen-delivery");
  renderTop();
}
$("#deliveryBackBtn").onclick=()=>renderCase();

async function answerDelivery(zone){
  deliveryAttempt++;
  const ok=zone===currentQuestion.zone;
  const d=progress.deliveries[currentQuestion.id]||{tries:[],firstCorrect:null,revealed:false};
  d.tries.push(zone);
  if(d.firstCorrect===null)d.firstCorrect=ok;
  progress.deliveries[currentQuestion.id]=d;

  if(ok){
    $("#deliveryFeedback").className="feedback good";
    $("#deliveryFeedback").innerHTML=`<strong>배송 성공!</strong> 「${currentQuestion.right}」은(는) <strong>${zoneLabel(zone)}</strong>로 보내면 돼요.`;
    $$(".delivery-zone").forEach(b=>b.disabled=true);
    await save();
    setTimeout(()=>completeDelivery(false),650);
  }else if(deliveryAttempt===1){
    $("#deliveryFeedback").className="feedback warn";
    $("#deliveryFeedback").innerHTML=`한 번 더 생각해 볼까? <strong>${currentQuestion.right}</strong>은 어떤 삶을 보장하는 권리일까요?`;
  }else{
    d.revealed=true;
    $("#deliveryFeedback").className="feedback warn";
    $("#deliveryFeedback").innerHTML=`이 배지는 <strong>${zoneLabel(currentQuestion.zone)}</strong>로 보내면 돼요.<br><small>${shortZoneFull(currentQuestion.zone)}</small>`;
    $$(".delivery-zone").forEach(b=>b.disabled=true);
    await save();
    setTimeout(()=>completeDelivery(true),850);
  }
}
async function completeDelivery(revealed){
  progress.solved[currentQuestion.id]={
    done:true,
    zone:currentQuestion.zone,
    right:currentQuestion.right,
    answerRevealed:!!progress.answers[currentQuestion.id]?.revealed,
    deliveryRevealed:revealed,
    at:new Date().toISOString()
  };
  await save();
  $("#earnedEmoji").textContent=currentQuestion.emoji;
  $("#earnedRight").textContent=currentQuestion.right;
  $("#earnedExplanation").textContent=currentQuestion.explanation;
  $("#earnedVillage").innerHTML=`📦 <strong>${zoneLabel(currentQuestion.zone)}</strong>에 배달 완료`;
  show("#screen-badge");
  renderTop();
}
$("#nextCaseBtn").onclick=()=>openNextCase();
$("#badgeWorldBtn").onclick=enterWorld;

async function showResult(){
  if(!progress.completed){progress.completed=true;progress.completedAt=new Date().toISOString();await save()}
  renderTop();show("#screen-result");
}
$("#finishBtn").onclick=()=>settings.previewEnabled?show("#screen-preview"):show("#screen-done");
$("#previewCloseBtn").onclick=()=>show("#screen-done");
$("#doneHomeBtn").onclick=()=>show("#screen-home");

$("#adminEntryBtn").onclick=()=>{modal(`<h2>관리자 로그인</h2><p class="micro">관리자 번호를 입력하세요.</p><input id="adminPinInput" type="password" inputmode="numeric" placeholder="관리자 번호"><button id="adminLoginSubmit" class="primary xl" style="margin-top:12px">로그인</button>`);$("#adminLoginSubmit").onclick=adminLogin;$("#adminPinInput").addEventListener("keydown",e=>{if(e.key==="Enter")adminLogin()})}
async function adminLogin(){const pin=$("#adminPinInput").value.trim();if(!pin)return toast("관리자 번호를 입력해 주세요.");try{if(auth.currentUser)await signOut(auth);await signInWithEmailAndPassword(auth,ADMIN_EMAIL,pin);closeModal();await loadAdmin();show("#screen-admin")}catch(e){console.error(e);toast("관리자 번호를 확인해 주세요.")}}
async function loadAdmin(){await loadSettings();await loadQuestions();await refreshStudents();renderAdminSettings();renderEditors();renderMessages();renderStats()}
$("#adminLogoutBtn").onclick=async()=>{await signOut(auth);await ensureAnon();show("#screen-home")};$("#adminPreviewBtn").onclick=()=>show("#screen-home");
$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".admin-panel").forEach(x=>x.classList.remove("active"));$(`#admin-${b.dataset.tab}`).classList.add("active");if(b.dataset.tab==="students")renderStudentTable();if(b.dataset.tab==="stats")renderStats()});
function renderAdminSettings(){$("#gameStatusText").textContent=settings.gameOpen?"진행 중":"마감";$("#forceStopToggle").checked=!!settings.forceStop;$("#previewToggle").checked=!!settings.previewEnabled;$("#previewStateText").textContent=settings.previewEnabled?"사용 중":"사용 안 함"}
async function saveSettings(p){settings={...settings,...p};await setDoc(doc(db,"config","settings"),settings,{merge:true});renderAdminSettings()}
$("#openGameBtn").onclick=()=>saveSettings({gameOpen:true});$("#closeGameBtn").onclick=()=>confirm("게임을 마감할까요?")&&saveSettings({gameOpen:false,forceStop:$("#forceStopToggle").checked});$("#reopenGameBtn").onclick=()=>saveSettings({gameOpen:true});$("#forceStopToggle").onchange=()=>saveSettings({forceStop:$("#forceStopToggle").checked});$("#previewToggle").onchange=()=>saveSettings({previewEnabled:$("#previewToggle").checked});
$("#changeAdminPinBtn").onclick=async()=>{const o=$("#currentAdminPin").value.trim(),n=$("#newAdminPin").value.trim();if(!/^\d{6,}$/.test(n))return toast("새 번호는 숫자 6자리 이상으로 해 주세요.");try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(ADMIN_EMAIL,o));await updatePassword(auth.currentUser,n);$("#currentAdminPin").value=$("#newAdminPin").value="";toast("관리자 번호를 변경했습니다.")}catch(e){console.error(e);toast("현재 관리자 번호를 확인해 주세요.")}};
async function refreshStudents(){const s=await getDocs(collection(db,"students"));studentCache=s.docs.map(d=>({id:d.id,...d.data()}));const joined=studentCache.length,done=studentCache.filter(x=>x.progress?.completed).length;$("#statJoined").textContent=joined;$("#statDone").textContent=done;$("#statDoing").textContent=joined-done;renderStudentTable()}
$("#classTabs").onclick=e=>{if(!e.target.dataset.class)return;selectedAdminClass=+e.target.dataset.class;$$("#classTabs button").forEach(b=>b.classList.toggle("active",+b.dataset.class===selectedAdminClass));renderStudentTable()};$("#studentSearch").oninput=renderStudentTable;
function renderStudentTable(){const q=$("#studentSearch").value.trim().toLowerCase(),rows=studentCache.filter(s=>s.cls===selectedAdminClass).filter(s=>!q||String(s.num).includes(q)||(s.name||"").toLowerCase().includes(q)),map=new Map(rows.map(r=>[r.num,r]));$("#studentTableBody").innerHTML=Array.from({length:28},(_,i)=>{const n=i+1,s=map.get(n);if(!s)return `<tr><td>${n}</td><td>-</td><td>미참여</td><td>0/20</td><td>-</td><td></td></tr>`;const a=Object.values(s.progress?.answers||{}),first=a.filter(x=>x.firstCorrect).length,solved=Object.values(s.progress?.solved||{}).filter(x=>x.done).length;return `<tr><td>${n}</td><td>${s.name||""}</td><td>${s.progress?.completed?"✅ 완료":"진행 중"}</td><td>${solved}/20</td><td>${first}/${a.length||0}</td><td><button class="ghost small reset-student" data-id="${s.id}">초기화</button></td></tr>`}).join("");$$(".reset-student").forEach(b=>b.onclick=async()=>{if(confirm("이 학생의 기록을 초기화할까요?")){await deleteDoc(doc(db,"students",b.dataset.id));await refreshStudents()}})}
$("#downloadCsvBtn").onclick=()=>{const h=["반","번호","이름","완료 여부","배지 수","첫 시도 정답률","도움 받은 사건","시작 시각","완료 시각"],rows=studentCache.map(s=>{const a=Object.values(s.progress?.answers||{}),f=a.filter(x=>x.firstCorrect).length,hp=a.filter(x=>x.revealed).length,sol=Object.values(s.progress?.solved||{}).filter(x=>x.done).length;return[s.cls,s.num,s.name,s.progress?.completed?"완료":"미완료",sol,a.length?Math.round(f/a.length*100)+"%":"",hp,s.progress?.startedAt||"",s.progress?.completedAt||""]}),esc=v=>`"${String(v??"").replaceAll('"','""')}"`,csv="\uFEFF"+[h,...rows].map(r=>r.map(esc).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`인권마을_결과_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)};
function renderEditors(){$("#questionEditorList").innerHTML=questions.map((q,i)=>`<details class="editor-item" data-i="${i}"><summary>${i+1}. ${q.location} — ${q.right}</summary><div class="editor-grid"><label>장소<input data-k="location" value="${q.location}"></label><label>아이콘<input data-k="emoji" value="${q.emoji}"></label><label class="span-2">상황<textarea data-k="situation" rows="3">${q.situation}</textarea></label><label class="span-2">정답 권리<input data-k="right" value="${q.right}"></label><label class="span-2">정답 설명<textarea data-k="explanation" rows="2">${q.explanation}</textarea></label><button class="primary save-question">이 사건 저장</button></div></details>`).join("");$$(".save-question").forEach(btn=>btn.onclick=async()=>{const d=btn.closest(".editor-item"),i=+d.dataset.i,q={...questions[i]};d.querySelectorAll("[data-k]").forEach(el=>q[el.dataset.k]=el.value);questions[i]=q;await setDoc(doc(db,"config","questions"),{items:questions,contentVersion:CONTENT_VERSION,updatedAt:serverTimestamp()});toast("사건을 저장했습니다.")})}
$("#resetQuestionsBtn").onclick=async()=>{if(!confirm("모든 사건을 기본값으로 되돌릴까요?"))return;questions=structuredClone(DEFAULT_QUESTIONS);await setDoc(doc(db,"config","questions"),{items:questions,contentVersion:CONTENT_VERSION,updatedAt:serverTimestamp()});renderEditors();toast("기본 사건으로 되돌렸습니다.")};
function renderMessages(){const m=settings.messages||DEFAULT_MESSAGES;$("#wrongMessageList").innerHTML=(m.firstWrong||[]).map(x=>`<div class="message-row"><input value="${x}"><button class="ghost small del">삭제</button></div>`).join("");$("#correctMessageList").innerHTML=(m.correct||[]).map(x=>`<div class="message-row"><input value="${x}"><button class="ghost small del">삭제</button></div>`).join("");$("#secondWrongMessage").value=m.secondWrong||"";bindDel()}
function bindDel(){$$(".del").forEach(b=>b.onclick=()=>b.parentElement.remove())}
$("#addWrongMessageBtn").onclick=()=>{$("#wrongMessageList").insertAdjacentHTML("beforeend",`<div class="message-row"><input value="한 번 더 생각해 볼까?"><button class="ghost small del">삭제</button></div>`);bindDel()};$("#addCorrectMessageBtn").onclick=()=>{$("#correctMessageList").insertAdjacentHTML("beforeend",`<div class="message-row"><input value="정답! 배지 발견 ✨"><button class="ghost small del">삭제</button></div>`);bindDel()};
$("#saveMessagesBtn").onclick=()=>saveSettings({messages:{firstWrong:$$('#wrongMessageList input').map(x=>x.value.trim()).filter(Boolean),secondWrong:$("#secondWrongMessage").value.trim(),correct:$$('#correctMessageList input').map(x=>x.value.trim()).filter(Boolean)}}).then(()=>toast("문구를 저장했습니다."));
$("#statsClassSelect").onchange=renderStats;function renderStats(){const cls=$("#statsClassSelect")?.value||"all",students=studentCache.filter(s=>cls==="all"||String(s.cls)===cls),data=questions.map(q=>{let total=0,wrong=0;students.forEach(s=>{const a=s.progress?.answers?.[q.id];if(a&&a.firstCorrect!==null){total++;if(!a.firstCorrect)wrong++}});return{name:q.right,total,rate:total?Math.round(wrong/total*100):0}}).sort((a,b)=>b.rate-a.rate).slice(0,10);$("#confusionList").innerHTML=data.map((d,i)=>`<div class="confusion-row"><span class="rank">${i+1}</span><span>${d.name}<small style="display:block;color:#737b88">응답 ${d.total}명</small></span><strong>${d.rate}%</strong></div>`).join("")}
$("#resetAllBtn").onclick=async()=>{if(!confirm("전체 학생 기록을 삭제합니다. 정말 계속할까요?"))return;if(prompt("확인을 위해 '전체삭제'라고 입력해 주세요.")!=="전체삭제")return toast("취소되었습니다.");const s=await getDocs(collection(db,"students")),batch=writeBatch(db);s.docs.forEach(d=>batch.delete(d.ref));await batch.commit();await refreshStudents();toast("전체 학생 기록을 삭제했습니다.")};

(async()=>{try{await loadSettings();await loadQuestions()}catch(e){console.error(e);toast("Firebase 설정을 확인해 주세요.")}})();
