import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, onSnapshot, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";
import { DEFAULT_QUESTIONS, DEFAULT_MESSAGES, ZONES } from "./questions.js";

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const shuffle = a => [...a].sort(()=>Math.random()-.5);
const nowISO = () => new Date().toISOString();
const rand = arr => arr[Math.floor(Math.random()*arr.length)];

let settings={gameOpen:true,forceStop:false,previewEnabled:false,messages:structuredClone(DEFAULT_MESSAGES)};
let questions=structuredClone(DEFAULT_QUESTIONS);
let currentStudent=null,currentProgress=null,orderedQuestions=[],currentQuestion=null;
let answerAttempt=0,zoneAttempt=0,selectedAdminClass=1,studentCache=[];

function showScreen(id){ $$(".screen").forEach(x=>x.classList.remove("active")); $(id).classList.add("active"); window.scrollTo({top:0}); }
function toast(msg){ const t=$("#toast");t.textContent=msg;t.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add("hidden"),2400); }
function openModal(html){ $("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden"); }
function closeModal(){ $("#modal").classList.add("hidden"); }
$("#modalClose").onclick=closeModal; $("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});

function setupSelectors(){
  $("#classSelect").innerHTML=Array.from({length:7},(_,i)=>`<option value="${i+1}">${i+1}반</option>`).join("");
  $("#numberSelect").innerHTML=Array.from({length:28},(_,i)=>`<option value="${i+1}">${i+1}번</option>`).join("");
  $("#statsClassSelect").innerHTML=`<option value="all">전체</option>`+Array.from({length:7},(_,i)=>`<option value="${i+1}">${i+1}반</option>`).join("");
  $("#classTabs").innerHTML=Array.from({length:7},(_,i)=>`<button data-class="${i+1}" class="${i===0?'active':''}">${i+1}반</button>`).join("");
}
setupSelectors();

async function ensureAnon(){ if(auth.currentUser?.email===ADMIN_EMAIL) await signOut(auth); if(!auth.currentUser) await signInAnonymously(auth); }
async function loadSettings(){
  try{const s=await getDoc(doc(db,"config","settings")); if(s.exists())settings={...settings,...s.data()}; else await setDoc(doc(db,"config","settings"),settings);}catch(e){console.warn(e)}
  renderHomeState();
}
async function loadQuestions(){
  try{const s=await getDoc(doc(db,"config","questions")); if(s.exists()&&Array.isArray(s.data().items))questions=s.data().items; else await setDoc(doc(db,"config","questions"),{items:DEFAULT_QUESTIONS,updatedAt:serverTimestamp()});}catch(e){console.warn(e)}
}
function renderHomeState(){ $("#closedBanner").classList.toggle("hidden",settings.gameOpen); $("#startBtn").disabled=!settings.gameOpen; $("#startBtn").style.opacity=settings.gameOpen?"1":".5"; }
onSnapshot(doc(db,"config","settings"),s=>{ if(s.exists()){settings={...settings,...s.data()};renderHomeState();if(!settings.gameOpen&&settings.forceStop&&$("#screen-game").classList.contains("active")){toast("선생님이 게임을 마감했습니다.");setTimeout(()=>showScreen("#screen-home"),900);}} });

const sid=(c,n)=>`${c}-${String(n).padStart(2,"0")}`;
$("#startBtn").onclick=async()=>{
  if(!settings.gameOpen)return toast("현재 게임이 마감되었습니다.");
  const cls=+$("#classSelect").value,num=+$("#numberSelect").value,name=$("#nameInput").value.trim();
  if(!name)return toast("이름을 입력해 주세요."); await ensureAnon();
  const id=sid(cls,num),ref=doc(db,"students",id),snap=await getDoc(ref);
  if(snap.exists()){
    const d=snap.data(); if(d.name&&d.name!==name)return toast("등록된 이름과 다릅니다. 이름을 확인해 주세요.");
    if(d.progress?.completed){openModal(`<h2>이미 완료한 기록이 있어요.</h2><p>${cls}반 ${num}번 ${name} 학생은 이미 인권지도를 완성했습니다.</p><div class="row-actions"><button id="resumeDone" class="primary">완성 화면 보기</button><button id="restartDone" class="ghost">처음부터 다시 하기</button></div>`);$("#resumeDone").onclick=()=>{closeModal();currentStudent={id,cls,num,name};currentProgress=d.progress;showScreen("#screen-result");};$("#restartDone").onclick=()=>confirmRestart(id,cls,num,name);return;}
    openModal(`<h2>진행하던 기록이 있습니다.</h2><p><strong>${d.progress?.doneCount||0} / 20</strong>까지 진행했습니다.</p><div class="row-actions"><button id="resumeBtn" class="primary">이어하기</button><button id="restartBtn" class="ghost">처음부터 다시 하기</button></div>`);
    $("#resumeBtn").onclick=()=>{closeModal();currentStudent={id,cls:d.cls,num:d.num,name:d.name};currentProgress=d.progress;startGame();};$("#restartBtn").onclick=()=>confirmRestart(id,cls,num,name);
  }else await createStudent(id,cls,num,name);
};
async function confirmRestart(id,cls,num,name){closeModal();if(confirm("기존 진행 기록이 삭제됩니다. 처음부터 다시 시작할까요?"))await createStudent(id,cls,num,name);}
async function createStudent(id,cls,num,name){
  const order=[...shuffle(questions.filter(q=>q.difficulty==="easy")),...shuffle(questions.filter(q=>q.difficulty==="normal")),...shuffle(questions.filter(q=>q.difficulty==="hard"))].map(q=>q.id);
  currentStudent={id,cls,num,name};currentProgress={order,index:0,doneCount:0,completed:false,answers:{},zoneAnswers:{},startedAt:nowISO(),completedAt:null};
  await setDoc(doc(db,"students",id),{cls,num,name,status:"doing",progress:currentProgress,updatedAt:serverTimestamp()});startGame();
}
function startGame(){orderedQuestions=currentProgress.order.map(id=>questions.find(q=>q.id===id)).filter(Boolean);$("#studentBadge").textContent=`${currentStudent.cls}반 ${currentStudent.num}번 ${currentStudent.name}`;renderMap();loadCurrentQuestion();showScreen("#screen-game");}
function renderMap(){
  $("#progressText").textContent=`${currentProgress.doneCount} / ${questions.length}`;$("#progressBar").style.width=`${currentProgress.doneCount/questions.length*100}%`;
  for(const z of Object.keys(ZONES)){const vals=Object.values(currentProgress.zoneAnswers||{}).filter(v=>v.zone===z&&v.done);$(`#count-${z}`).textContent=`${vals.length}/5`;$(`#chips-${z}`).innerHTML=vals.map(v=>`<i>${v.short}</i>`).join("");}
}
function loadCurrentQuestion(){if(currentProgress.index>=orderedQuestions.length)return showResult();currentQuestion=orderedQuestions[currentProgress.index];answerAttempt=0;zoneAttempt=0;renderStep1();}
function renderStep1(){
  $("#phaseTitle").textContent="상황을 읽고 가장 관련된 인권을 찾아보세요.";$("#stepPill").textContent="STEP 1 · 상황 → 인권";$("#questionText").textContent=currentQuestion.situation;$("#feedback").className="feedback hidden";$("#nextStepBtn").classList.add("hidden");
  $("#answerOptions").innerHTML=shuffle([currentQuestion.right,...currentQuestion.wrong]).map(x=>`<button>${x}</button>`).join(""); $$("#answerOptions button").forEach(b=>b.onclick=()=>checkRight(b.textContent));
}
async function checkRight(choice){
  answerAttempt++;const ok=choice===currentQuestion.right;const a=currentProgress.answers[currentQuestion.id]||{tries:[],firstCorrect:null,revealed:false};a.tries.push(choice);if(a.firstCorrect===null)a.firstCorrect=ok;currentProgress.answers[currentQuestion.id]=a;
  if(ok){$("#feedback").className="feedback good";$("#feedback").innerHTML=`<strong>${rand(settings.messages?.correct||DEFAULT_MESSAGES.correct)}</strong><br>${currentQuestion.explanation}`;$("#answerOptions").innerHTML="";$("#nextStepBtn").classList.remove("hidden");$("#nextStepBtn").textContent="인권지도에 분류하기";$("#nextStepBtn").onclick=renderStep2;}
  else if(answerAttempt===1){$("#feedback").className="feedback warn";$("#feedback").textContent=rand(settings.messages?.firstWrong||DEFAULT_MESSAGES.firstWrong);}
  else{a.revealed=true;$("#feedback").className="feedback warn";$("#feedback").innerHTML=`이 상황과 가장 관련 있는 것은 <strong>「${currentQuestion.right}」</strong>예요.<br>${currentQuestion.explanation}<br><small>${settings.messages?.secondWrong||DEFAULT_MESSAGES.secondWrong}</small>`;$("#answerOptions").innerHTML="";$("#nextStepBtn").classList.remove("hidden");$("#nextStepBtn").textContent="인권지도에 분류하기";$("#nextStepBtn").onclick=renderStep2;}
  await saveProgress();
}
function renderStep2(){
  $("#phaseTitle").textContent="이 인권은 인권지도의 어느 영역에 들어갈까요?";$("#stepPill").textContent="STEP 2 · 인권 → 인권지도";$("#questionText").innerHTML=`<strong>${currentQuestion.right}</strong><br><span style="font-size:14px;color:#6f7a89">${currentQuestion.explanation}</span>`;$("#answerOptions").innerHTML="";$("#feedback").className="feedback hidden";$("#nextStepBtn").classList.add("hidden");
  $$(".zone").forEach(z=>z.onclick=()=>checkZone(z.dataset.zone));
}
async function checkZone(zone){
  zoneAttempt++;if(zone===currentQuestion.zone){$("#feedback").className="feedback good";$("#feedback").textContent="좋아요! 인권지도에 추가되었습니다.";await completeQuestion(zone,false);}else if(zoneAttempt===1){$("#feedback").className="feedback warn";$("#feedback").textContent="이 권리는 어느 영역과 가장 관련 있을까요? 다시 선택해 봅시다!";}else{$("#feedback").className="feedback warn";$("#feedback").innerHTML=`이 권리는 <strong>「${ZONES[currentQuestion.zone].label}」</strong>에 넣어 볼 수 있어요.`;await sleep(700);await completeQuestion(currentQuestion.zone,true);}
}
function shortName(r){const m={"표현의 자유":"표현","종교·양심의 자유":"종교·양심","사생활을 보호받을 권리":"사생활","이동하고 살 곳을 정할 자유":"이동·거주","평화롭게 모이고 단체를 만들 자유":"모임·단체","차별받지 않을 권리":"차별금지","생명과 신체의 안전을 보호받을 권리":"생명·안전","강제로 붙잡히거나 갇히지 않을 권리":"자의적 구금 금지","고문이나 잔혹한 대우를 받지 않을 권리":"고문 금지","법 앞에서 평등하게 보호받을 권리":"법 앞의 평등","교육받을 권리":"교육","일하고 정당한 대우를 받을 권리":"노동","휴식할 권리":"휴식","사회보장을 받을 권리":"사회보장","건강·주거를 포함해 인간다운 생활을 할 권리":"건강·주거","정치에 참여할 권리":"정치 참여","문화생활에 참여할 권리":"문화","깨끗하고 건강한 환경에서 살 권리":"환경","평화롭게 살아갈 권리":"평화","인권이 실제로 보장되는 사회에서 살 권리":"인권 보장 사회"};return m[r]||r;}
async function completeQuestion(zone,revealed){$$(".zone").forEach(z=>z.onclick=null);currentProgress.zoneAnswers[currentQuestion.id]={zone,right:currentQuestion.right,short:shortName(currentQuestion.right),tries:zoneAttempt,revealed,done:true};currentProgress.doneCount++;currentProgress.index++;await saveProgress();renderMap();await sleep(500);loadCurrentQuestion();}
async function saveProgress(){
  $("#saveState").textContent="저장 중…";try{await updateDoc(doc(db,"students",currentStudent.id),{progress:currentProgress,status:currentProgress.completed?"done":"doing",updatedAt:serverTimestamp()});$("#saveState").textContent="저장됨";}catch(e){console.error(e);$("#saveState").textContent="저장 재시도 필요";toast("잠시 저장하지 못했어요. 인터넷 연결을 확인해 주세요.");}
}
async function showResult(){if(currentProgress&&!currentProgress.completed){currentProgress.completed=true;currentProgress.completedAt=nowISO();await saveProgress();}showScreen("#screen-result");}
$("#quitBtn").onclick=()=>showScreen("#screen-home");$("#finishBtn").onclick=()=>settings.previewEnabled?showScreen("#screen-preview"):showScreen("#screen-done");$("#previewCloseBtn").onclick=()=>showScreen("#screen-done");$("#doneHomeBtn").onclick=()=>showScreen("#screen-home");

$("#adminEntryBtn").onclick=()=>{openModal(`<h2>관리자 로그인</h2><p class="micro">관리자 번호를 입력하세요.</p><input id="adminPinInput" type="password" inputmode="numeric" placeholder="관리자 번호"><button id="adminLoginSubmit" class="primary xl" style="margin-top:12px">로그인</button>`);$("#adminLoginSubmit").onclick=adminLogin;$("#adminPinInput").addEventListener("keydown",e=>{if(e.key==="Enter")adminLogin();});};
async function adminLogin(){const pin=$("#adminPinInput").value.trim();if(!pin)return toast("관리자 번호를 입력해 주세요.");try{if(auth.currentUser)await signOut(auth);await signInWithEmailAndPassword(auth,ADMIN_EMAIL,pin);closeModal();await loadAdmin();showScreen("#screen-admin");}catch(e){console.error(e);toast("관리자 번호를 확인해 주세요.");}}
async function loadAdmin(){await loadSettings();await loadQuestions();await refreshStudents();renderQuestionEditors();renderMessages();renderAdminSettings();renderStats();}
$("#adminLogoutBtn").onclick=async()=>{await signOut(auth);await ensureAnon();showScreen("#screen-home");};$("#adminPreviewBtn").onclick=()=>showScreen("#screen-home");

$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".admin-panel").forEach(x=>x.classList.remove("active"));$(`#admin-${b.dataset.adminTab}`).classList.add("active");if(b.dataset.adminTab==="students")renderStudentTable();if(b.dataset.adminTab==="stats")renderStats();});
function renderAdminSettings(){$("#gameStatusText").textContent=settings.gameOpen?"진행 중":"마감";$("#forceStopToggle").checked=!!settings.forceStop;$("#previewToggle").checked=!!settings.previewEnabled;$("#previewStateText").textContent=settings.previewEnabled?"사용 중":"사용 안 함";}
async function saveSettingsPatch(p){settings={...settings,...p};await setDoc(doc(db,"config","settings"),settings,{merge:true});renderAdminSettings();}
$("#openGameBtn").onclick=()=>saveSettingsPatch({gameOpen:true});$("#closeGameBtn").onclick=()=>confirm("게임을 마감할까요?")&&saveSettingsPatch({gameOpen:false,forceStop:$("#forceStopToggle").checked});$("#reopenGameBtn").onclick=()=>saveSettingsPatch({gameOpen:true});$("#forceStopToggle").onchange=()=>saveSettingsPatch({forceStop:$("#forceStopToggle").checked});$("#previewToggle").onchange=()=>saveSettingsPatch({previewEnabled:$("#previewToggle").checked});
$("#changeAdminPinBtn").onclick=async()=>{const old=$("#currentAdminPin").value.trim(),nw=$("#newAdminPin").value.trim();if(!/^\d{6,}$/.test(nw))return toast("새 관리자 번호는 숫자 6자리 이상으로 해 주세요.");try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(ADMIN_EMAIL,old));await updatePassword(auth.currentUser,nw);$("#currentAdminPin").value=$("#newAdminPin").value="";toast("관리자 번호를 변경했습니다.");}catch(e){console.error(e);toast("현재 관리자 번호를 확인해 주세요.");}};

async function refreshStudents(){const s=await getDocs(collection(db,"students"));studentCache=s.docs.map(d=>({id:d.id,...d.data()}));const joined=studentCache.length,done=studentCache.filter(x=>x.progress?.completed).length;$("#statJoined").textContent=joined;$("#statDone").textContent=done;$("#statDoing").textContent=joined-done;renderStudentTable();}
$("#classTabs").addEventListener("click",e=>{if(!e.target.dataset.class)return;selectedAdminClass=+e.target.dataset.class;$$("#classTabs button").forEach(b=>b.classList.toggle("active",+b.dataset.class===selectedAdminClass));renderStudentTable();});$("#studentSearch").oninput=renderStudentTable;
function renderStudentTable(){const q=$("#studentSearch").value.trim().toLowerCase();const rows=studentCache.filter(s=>s.cls===selectedAdminClass).filter(s=>!q||String(s.num).includes(q)||(s.name||"").toLowerCase().includes(q)).sort((a,b)=>a.num-b.num),m=new Map(rows.map(r=>[r.num,r]));$("#studentTableBody").innerHTML=Array.from({length:28},(_,i)=>{const n=i+1,s=m.get(n);if(!s)return `<tr><td>${n}</td><td>-</td><td>미참여</td><td>0/20</td><td>-</td><td></td></tr>`;const a=Object.values(s.progress?.answers||{}),first=a.filter(x=>x.firstCorrect).length;return `<tr><td>${n}</td><td>${s.name}</td><td>${s.progress?.completed?"✅ 완료":"진행 중"}</td><td>${s.progress?.doneCount||0}/20</td><td>${first}/${a.length||0}</td><td><button class="ghost small reset-student" data-id="${s.id}">초기화</button></td></tr>`;}).join("");$$(".reset-student").forEach(b=>b.onclick=async()=>{if(confirm("이 학생의 기록을 초기화할까요?")){await deleteDoc(doc(db,"students",b.dataset.id));await refreshStudents();}});}
$("#downloadCsvBtn").onclick=()=>{const h=["반","번호","이름","완료 여부","완료 문항 수","첫 시도 정답률","도움 받은 문항 수","시작 시각","완료 시각"];const r=studentCache.map(s=>{const a=Object.values(s.progress?.answers||{}),f=a.filter(x=>x.firstCorrect).length,hp=a.filter(x=>x.revealed).length;return [s.cls,s.num,s.name,s.progress?.completed?"완료":"미완료",s.progress?.doneCount||0,a.length?Math.round(f/a.length*100)+"%":"",hp,s.progress?.startedAt||"",s.progress?.completedAt||""];});const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;const csv="\uFEFF"+[h,...r].map(x=>x.map(esc).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`인권지도_결과_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);};

function renderQuestionEditors(){$("#questionEditorList").innerHTML=questions.map((q,i)=>`<details class="editor-item" data-i="${i}"><summary>${i+1}. ${q.right}</summary><div class="editor-grid"><label class="span-2">상황<textarea data-k="situation" rows="3">${q.situation}</textarea></label><label>정답 권리<input data-k="right" value="${q.right}"></label><label>난이도<select data-k="difficulty"><option value="easy" ${q.difficulty==="easy"?"selected":""}>쉬움</option><option value="normal" ${q.difficulty==="normal"?"selected":""}>보통</option><option value="hard" ${q.difficulty==="hard"?"selected":""}>생각하기</option></select></label><label>오답 1<input data-w="0" value="${q.wrong[0]}"></label><label>오답 2<input data-w="1" value="${q.wrong[1]}"></label><label>오답 3<input data-w="2" value="${q.wrong[2]}"></label><label>분류<select data-k="zone">${Object.entries(ZONES).map(([k,v])=>`<option value="${k}" ${q.zone===k?"selected":""}>${v.label}</option>`).join("")}</select></label><label class="span-2">정답 설명<textarea data-k="explanation" rows="2">${q.explanation}</textarea></label><button class="primary save-question" type="button">이 문제 저장</button></div></details>`).join("");$$(".save-question").forEach(btn=>btn.onclick=async()=>{const d=btn.closest(".editor-item"),i=+d.dataset.i,q={...questions[i],wrong:[...questions[i].wrong]};d.querySelectorAll("[data-k]").forEach(el=>q[el.dataset.k]=el.value);d.querySelectorAll("[data-w]").forEach(el=>q.wrong[+el.dataset.w]=el.value);questions[i]=q;await setDoc(doc(db,"config","questions"),{items:questions,updatedAt:serverTimestamp()});toast("문제를 저장했습니다.");});}
$("#resetQuestionsBtn").onclick=async()=>{if(!confirm("모든 문제를 처음 기본값으로 되돌릴까요?"))return;questions=structuredClone(DEFAULT_QUESTIONS);await setDoc(doc(db,"config","questions"),{items:questions,updatedAt:serverTimestamp()});renderQuestionEditors();toast("기본 문제로 되돌렸습니다.");};
function renderMessages(){const m=settings.messages||DEFAULT_MESSAGES;$("#wrongMessageList").innerHTML=(m.firstWrong||[]).map(x=>`<div class="message-row"><input value="${x}"><button class="ghost small del-msg">삭제</button></div>`).join("");$("#correctMessageList").innerHTML=(m.correct||[]).map(x=>`<div class="message-row"><input value="${x}"><button class="ghost small del-msg">삭제</button></div>`).join("");$("#secondWrongMessage").value=m.secondWrong||"";bindDeletes();}
function bindDeletes(){$$(".del-msg").forEach(b=>b.onclick=()=>b.parentElement.remove());}
$("#addWrongMessageBtn").onclick=()=>{$("#wrongMessageList").insertAdjacentHTML("beforeend",`<div class="message-row"><input value="다시 한번 생각해 볼까요?"><button class="ghost small del-msg">삭제</button></div>`);bindDeletes();};$("#addCorrectMessageBtn").onclick=()=>{$("#correctMessageList").insertAdjacentHTML("beforeend",`<div class="message-row"><input value="좋아요!"><button class="ghost small del-msg">삭제</button></div>`);bindDeletes();};
$("#saveMessagesBtn").onclick=async()=>{const firstWrong=$$("#wrongMessageList input").map(x=>x.value.trim()).filter(Boolean),correct=$$("#correctMessageList input").map(x=>x.value.trim()).filter(Boolean),secondWrong=$("#secondWrongMessage").value.trim();await saveSettingsPatch({messages:{firstWrong,correct,secondWrong}});toast("문구를 저장했습니다.");};
$("#statsClassSelect").onchange=renderStats;function renderStats(){const cls=$("#statsClassSelect")?.value||"all",students=studentCache.filter(s=>cls==="all"||String(s.cls)===cls),data=questions.map(q=>{let total=0,wrong=0;students.forEach(s=>{const a=s.progress?.answers?.[q.id];if(a&&a.firstCorrect!==null){total++;if(!a.firstCorrect)wrong++;}});return{name:q.right,total,rate:total?Math.round(wrong/total*100):0};}).sort((a,b)=>b.rate-a.rate).slice(0,10);$("#confusionList").innerHTML=data.map((d,i)=>`<div class="confusion-row"><span class="rank">${i+1}</span><span>${d.name}<small style="display:block;color:#6f7a89">응답 ${d.total}명</small></span><strong>${d.rate}%</strong></div>`).join("");}
$("#resetAllBtn").onclick=async()=>{if(!confirm("전체 학생 기록을 삭제합니다. 정말 계속할까요?"))return;if(prompt("확인을 위해 '전체삭제'라고 입력해 주세요.")!=="전체삭제")return toast("취소되었습니다.");const s=await getDocs(collection(db,"students")),batch=writeBatch(db);s.docs.forEach(d=>batch.delete(d.ref));await batch.commit();await refreshStudents();toast("전체 학생 기록을 삭제했습니다.");};

(async()=>{try{await loadSettings();await loadQuestions();}catch(e){console.error(e);toast("Firebase 설정을 확인해 주세요.");}})();
