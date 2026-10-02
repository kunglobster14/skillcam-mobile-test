const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

let lang=localStorage.getItem("skillcam-language")||"th";
let poseLandmarker=null;
let currentFile=null;
let currentAnalysis=null;
let resultURL=null;
let overlayVisible=true;

const IDX={
  left_shoulder:11,right_shoulder:12,left_elbow:13,right_elbow:14,left_wrist:15,right_wrist:16,
  left_hip:23,right_hip:24,left_knee:25,right_knee:26,left_ankle:27,right_ankle:28,
  left_heel:29,right_heel:30,left_foot:31,right_foot:32
};

const T={
th:{
brandSub:"AI Visual Coach · Badminton Smash",learnTab:"เรียน",analyzeTab:"วิเคราะห์",progressTab:"พัฒนาการ",
heroEyebrow:"ทดลอง AI Coach",heroTitle:"ถ่ายหรือเลือกคลิป แล้วดูว่า AI เห็นอะไรในท่า Smash",
heroText:"AI จะหาจังหวะตี จำแนก Standing / Moving / Jump-like และวิเคราะห์ Footwork เฉพาะเมื่อพบการเคลื่อนที่จริง",
how1:"เลือกคลิป",how1s:"1 Smash ต่อคลิปดีที่สุด",how2:"กดวิเคราะห์",how2s:"AI ทำงานบน iPhone",how3:"ดู Visual Coach",how3s:"Skeleton + มุม + คำแนะนำ",how4:"ฝึกใหม่",how4s:"เปรียบเทียบกับครั้งก่อน",
chooseTitle:"เลือกคลิป Smash",chooseHelp:"ควรเห็นเต็มตัว เท้าไม่ถูกบัง และกล้องนิ่ง",tester:"ชื่อ/รหัสผู้ทดสอบ",pickVideo:"แตะเพื่อเลือกวิดีโอ",fileHint:"สูงสุด 200 MB · วิเคราะห์ช่วงต้นสูงสุด 30 วินาที",
consent:"ยินยอมให้วิเคราะห์คลิปบนอุปกรณ์นี้",saveProgress:"เก็บผลไว้ใน Safari เพื่อดูพัฒนาการ",analyzeBtn:"วิเคราะห์ด้วย AI Coach",chooseFirst:"เลือกคลิปก่อน",
resultEyebrow:"ผลการวิเคราะห์",resultTitle:"AI Coach",whatSaw:"AI เห็นอะไร",visualTitle:"Visual Coach",visualHelp:"ตรวจว่าจังหวะที่ AI เลือกตรงกับ Smash ของคุณก่อน",
currentPose:"ท่าที่ตรวจพบ",guidePose:"แนวทางทดลองปรับ",contactBtn:"ไปที่จังหวะตี",hideOverlay:"ซ่อนเส้น",showOverlay:"แสดงเส้น",
coachAdvice:"AI Coach แนะนำให้ลองปรับ",referenceNote:"คำแนะนำนี้เป็น development reference ยังไม่ใช่มาตรฐานโค้ชที่ผ่านการรับรอง",
footworkTitle:"Footwork / การเข้าตำแหน่ง",details:"ดูค่ารายละเอียด",nextTitle:"ทำอะไรต่อ",retry:"เลือกคลิปใหม่แล้ววิเคราะห์อีกครั้ง",viewProgress:"ดูพัฒนาการ",
learnEyebrow:"เรียนก่อนฝึก",learnTitle:"Smash มีลำดับการเคลื่อนไหวอย่างไร",learnText:"ใช้เป็นแผนที่การฝึก ไม่ใช่สูตรท่าตายตัว เพราะรูปร่าง มุมกล้อง และรูปแบบ Smash แตกต่างกัน",
movementModes:"AI เลือกสิ่งที่จะวิเคราะห์ตามคลิป",standingLearn:"เน้น Contact, แขน, ลำตัว และ Recovery โดยไม่สร้างคะแนน Footwork",
movingLearn:"เพิ่ม Approach, ฐานเท้า, Balance และการกลับตำแหน่ง",jumpLearn:"เพิ่มการยกตัว ฐานเท้า การลงพื้น และ Recovery แบบ proxy",startAnalyze:"ไปวิเคราะห์คลิป",
progressEyebrow:"Progress",progressTitle:"ดูการเปลี่ยนแปลงจากคลิปที่บันทึกไว้",progressText:"แสดงว่าค่าที่วัดเปลี่ยนอย่างไร โดยยังไม่ฟันธงว่า “ดีขึ้น” จนกว่าเกณฑ์จะผ่านการตรวจจากโค้ชจริง",
phase1:"เตรียมตัว",phase1d:"ตั้งฐาน มองจังหวะ และเตรียมลำตัวให้พร้อมเคลื่อน",phase2:"เข้าหาลูก",phase2d:"ถ้าต้องเคลื่อน ให้เข้าไปถึงตำแหน่งตีโดยไม่เสียสมดุล",
phase3:"โหลดแรง",phase3d:"ใช้ขาและลำตัวเตรียมส่งแรงขึ้นสู่การตี",phase4:"เหวี่ยงแขน",phase4d:"หมุนลำตัวและส่งแขนขึ้นอย่างต่อเนื่อง",
phase5:"สัมผัส",phase5d:"ให้แขนทำงานได้เต็มโดยไม่ฝืนลำตัว",phase6:"ลงพื้น",phase6d:"รับน้ำหนักหลังตีด้วยฐานที่ควบคุมได้",phase7:"คืนตัว",phase7d:"กลับสู่ท่าพร้อมสำหรับลูกถัดไป",
selected:"เลือกแล้ว",tooLarge:"คลิปเกิน 200 MB",needConsent:"กรุณายินยอมให้วิเคราะห์คลิปก่อน",loadingModel:"กำลังโหลด AI Pose model ครั้งแรก...",analyzing:"กำลังอ่านการเคลื่อนไหวในคลิป...",analysisFail:"วิเคราะห์ไม่สำเร็จ",
modelFail:"โหลด AI model ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",poseLow:"ตรวจจับร่างกายไม่ชัดพอ ควรถ่ายใหม่ให้เห็นเต็มตัวและเท้า",
standing:"Standing Smash",moving:"Moving Smash",jump:"Jump-like Smash",unclassified:"ยังจำแนกไม่ได้",
poseConfidence:"ความชัดของ Pose",movementConfidence:"ความมั่นใจประเภทการเคลื่อนไหว",contactAt:"AI คาดว่าจังหวะตีอยู่ที่",seconds:"วินาที",hittingSide:"ข้างที่ใช้ตี",left:"ซ้าย",right:"ขวา",
multiContact:"พบหลายจังหวะที่คล้ายการตีเหนือศีรษะ ควรใช้คลิปที่มี 1 Smash เพื่อให้ AI เลือก contact แม่นขึ้น",
confirmContact:"ขั้นแรก: กด “ไปที่จังหวะตี” แล้วตรวจว่า AI เลือก Smash ถูกจังหวะหรือไม่",
standingFoot:"คลิปนี้มีการเคลื่อนเข้าหาลูกน้อย จึงไม่สร้างคะแนน Footwork และไม่ถือว่าเป็นข้อผิดพลาด",
movingFoot:"AI พบการเคลื่อนเข้าหาจังหวะตี จึงเพิ่มการดู Approach, ฐานเท้า, Balance และ Recovery",
jumpFoot:"AI พบการยกตัวแบบ Jump-like จึงเพิ่มการดูฐานเท้า การลงตัว และ Recovery แบบ proxy",
adviceElbow:"แขนข้างตียังงอค่อนข้างมากในเฟรมที่ AI เลือก ลองทดลองให้จุดสัมผัสสูง/ไกลจากลำตัวขึ้นเล็กน้อย แล้วดูว่าแขนเหยียดต่อเนื่องขึ้นหรือไม่",
adviceKnee:"ช่วงเตรียม AI เห็นการงอเข่าน้อย ลองลดศูนย์ถ่วงเล็กน้อยก่อนส่งแรงจากขาไปลำตัวและแขน",
adviceTorso:"ลำตัวเอียงมากในภาพ 2D ควรตรวจมุมกล้องและสมดุลก่อนสรุปว่าเป็นปัญหาท่าทาง",
adviceBalance:"สะโพกเบี่ยงจากกึ่งกลางฐานเท้าค่อนข้างมาก ลองจัดฐานเท้าให้รับน้ำหนักได้สมดุลขึ้น",
adviceRecovery:"หลังตี AI ใช้เวลานานกว่าจะเห็นฐานเท้ากลับมาสมดุล ลองฝึกลงพื้นแล้วกลับสู่ท่า ready ให้ต่อเนื่องขึ้น",
adviceClear:"ยังไม่พบสัญญาณเตือนหลักจาก development reference ในจังหวะที่เลือก ให้เน้นความสม่ำเสมอและตรวจว่า contact frame ถูกต้อง",
guideElbow:"แนวทางทดลอง: ให้แขนมีพื้นที่เหยียดมากขึ้น",guideBalance:"แนวทางทดลอง: ให้สะโพกใกล้กึ่งกลางฐานเท้ามากขึ้น",
next1:"ตรวจจังหวะตีที่ AI เลือกก่อนเชื่อคำแนะนำ",next2:"ลองแก้เพียง 1 จุดจากคำแนะนำ แล้วถ่ายใหม่",next3:"เก็บผลไว้เพื่อเทียบว่าค่าการเคลื่อนไหวเปลี่ยนอย่างไร",
saved:"วิเคราะห์สำเร็จและบันทึกผลใน Progress แล้ว",notSaved:"วิเคราะห์สำเร็จ (ไม่ได้บันทึกประวัติ)",
noHistory:"ยังไม่มีประวัติที่บันทึกไว้",history:"ประวัติการวิเคราะห์",compare:"เปรียบเทียบ 2 ครั้งล่าสุด",needTwo:"ต้องมีอย่างน้อย 2 ครั้งจึงจะเปรียบเทียบได้",
metric_elbow_extension:"การเหยียดศอก",metric_shoulder_line_angle:"มุมแนวไหล่",metric_deepest_knee_angle:"มุมเข่าที่งอลึกสุด",metric_torso_lean:"การเอียงลำตัว",metric_recovery_time_proxy:"เวลาคืนตัวโดยประมาณ",
metric_approach_travel:"ระยะเคลื่อนเข้าหาจังหวะตี",metric_base_width_ratio:"ฐานเท้าเทียบความกว้างไหล่",metric_balance_offset:"สะโพกเบี่ยงจากกึ่งกลางฐานเท้า",metric_return_travel:"การเคลื่อนหลังตี",
cameraNote:"ค่าทั้งหมดเป็น 2D measurement/proxy และขึ้นกับมุมกล้อง"
},
en:{
brandSub:"AI Visual Coach · Badminton Smash",learnTab:"Learn",analyzeTab:"Analyze",progressTab:"Progress",
heroEyebrow:"Try AI Coach",heroTitle:"Choose a clip and see what AI detects in your smash",
heroText:"AI finds the hitting moment, classifies Standing / Moving / Jump-like, and analyzes footwork only when movement is actually present.",
how1:"Choose clip",how1s:"One smash per clip works best",how2:"Analyze",how2s:"AI runs on your iPhone",how3:"Visual Coach",how3s:"Skeleton + angles + guidance",how4:"Practice again",how4s:"Compare with previous attempts",
chooseTitle:"Choose a smash clip",chooseHelp:"Keep the full body and feet visible with a stable camera",tester:"Tester name / ID",pickVideo:"Tap to choose a video",fileHint:"Up to 200 MB · first 30 seconds analyzed",
consent:"I consent to on-device analysis",saveProgress:"Save results in Safari for progress comparison",analyzeBtn:"Analyze with AI Coach",chooseFirst:"Choose a clip first",
resultEyebrow:"Analysis result",resultTitle:"AI Coach",whatSaw:"What AI saw",visualTitle:"Visual Coach",visualHelp:"First confirm that AI selected the intended smash moment",
currentPose:"Detected pose",guidePose:"Development guide",contactBtn:"Go to contact moment",hideOverlay:"Hide overlay",showOverlay:"Show overlay",
coachAdvice:"AI Coach: what to try",referenceNote:"These suggestions use development references and are not yet coach-validated standards.",
footworkTitle:"Footwork / Positioning",details:"Show detailed measurements",nextTitle:"What to do next",retry:"Choose another clip and analyze again",viewProgress:"View progress",
learnEyebrow:"Learn first",learnTitle:"How does a smash movement sequence work?",learnText:"Use this as a practice map, not a rigid formula. Body shape, camera view, and smash type vary.",
movementModes:"AI changes what it analyzes based on the clip",standingLearn:"Focuses on contact, arm, torso and recovery without inventing a footwork score",
movingLearn:"Adds approach, foot base, balance and return movement",jumpLearn:"Adds vertical movement, base, landing and recovery proxies",startAnalyze:"Analyze a clip",
progressEyebrow:"Progress",progressTitle:"See measurement changes across saved clips",progressText:"Shows how measurements changed without automatically labeling them as improvements before coach validation.",
phase1:"Preparation",phase1d:"Set the base, track the shot, and prepare the torso to move",phase2:"Approach",phase2d:"When movement is needed, get into hitting position without losing balance",
phase3:"Load",phase3d:"Use legs and torso to prepare force transfer",phase4:"Swing",phase4d:"Rotate and drive the arm upward continuously",
phase5:"Contact",phase5d:"Reach a position where the hitting arm can work freely",phase6:"Landing",phase6d:"Accept body weight with a controllable base",phase7:"Recovery",phase7d:"Return to a ready position for the next shot",
selected:"Selected",tooLarge:"Clip is over 200 MB",needConsent:"Please consent to analysis first",loadingModel:"Loading the AI pose model for the first time...",analyzing:"Reading movement from the video...",analysisFail:"Analysis failed",
modelFail:"AI model could not load. Check your internet connection and try again.",poseLow:"Pose detection is too unclear. Re-record with the full body and feet visible.",
standing:"Standing Smash",moving:"Moving Smash",jump:"Jump-like Smash",unclassified:"Unclassified",
poseConfidence:"Pose confidence",movementConfidence:"Movement classification confidence",contactAt:"AI inferred contact at",seconds:"seconds",hittingSide:"Hitting side",left:"left",right:"right",
multiContact:"Multiple overhead-action candidates were detected. Use one smash per clip for more reliable contact selection.",
confirmContact:"First step: tap “Go to contact moment” and confirm that AI selected the intended smash.",
standingFoot:"Little approach movement was detected, so no footwork score is created and this is not treated as a fault.",
movingFoot:"Approach movement was detected, so approach, base, balance and recovery proxies are included.",
jumpFoot:"Jump-like vertical movement was detected, so base, landing and recovery proxies are included.",
adviceElbow:"The hitting arm remains fairly bent at the selected frame. Try contacting slightly higher/farther from the body and see whether extension becomes more continuous.",
adviceKnee:"AI saw relatively little knee flexion during preparation. Experiment with a slightly lower center of mass before transferring force upward.",
adviceTorso:"Torso lean is large in the 2D view. Check camera perspective and balance before treating this as a technique issue.",
adviceBalance:"The hips are offset from the midpoint of the foot base. Try a more controlled base and weight position.",
adviceRecovery:"AI took longer to detect a balanced base after contact. Practice landing and returning to ready more continuously.",
adviceClear:"No major development-reference alert was found at the selected moment. Focus on consistency and verify the contact frame.",
guideElbow:"Development guide: create more room for arm extension",guideBalance:"Development guide: bring hips closer to the foot-base midpoint",
next1:"Confirm the AI-selected contact moment before relying on guidance",next2:"Change only one suggested point, then record again",next3:"Save results to compare how movement measurements change",
saved:"Analysis complete and saved to Progress",notSaved:"Analysis complete (history not saved)",
noHistory:"No saved history yet",history:"Analysis history",compare:"Compare latest two sessions",needTwo:"At least two saved sessions are needed for comparison",
metric_elbow_extension:"Elbow extension",metric_shoulder_line_angle:"Shoulder line angle",metric_deepest_knee_angle:"Deepest knee angle",metric_torso_lean:"Torso lean",metric_recovery_time_proxy:"Recovery time proxy",
metric_approach_travel:"Approach travel",metric_base_width_ratio:"Foot-base / shoulder width",metric_balance_offset:"Hip offset from foot-base midpoint",metric_return_travel:"Post-contact travel",
cameraNote:"All measurements are 2D proxies and depend on camera angle"
}};

function t(k){return T[lang][k]||T.en[k]||k}
function pct(v){return Math.round((v||0)*100)+"%"}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function mid(a,b){return a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:null}
function angle(a,b,c){
  const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;
  const d=Math.hypot(ux,uy)*Math.hypot(vx,vy);if(!d)return null;
  return Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/d)))*180/Math.PI
}
function lineAngle(a,b){return Math.abs(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI)}
function conf(j,names){const a=names.map(n=>j[n]?.visibility||0);return a.reduce((x,y)=>x+y,0)/(a.length||1)}
function visible(p){return p&&(p.visibility==null||p.visibility>=.35)}
function median(a){const b=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!b.length)return null;const m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2}

function showStatus(text,type=""){
  const el=$("#statusBox");el.textContent=text;el.className="status "+type;el.classList.remove("hidden")
}
function hideStatus(){$("#statusBox").classList.add("hidden")}

function setView(name){
  ["learn","analyze","progress"].forEach(n=>$("#"+n+"View").classList.toggle("hidden",n!==name));
  $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  if(name==="progress")loadProgress();
  window.scrollTo({top:0,behavior:"smooth"})
}

function applyLanguage(){
  document.documentElement.lang=lang;
  $("#languageSelect").value=lang;
  $$("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  renderLearn();
  if(currentAnalysis)renderResult(currentAnalysis);
}

async function initPose(){
  if(poseLandmarker)return poseLandmarker;
  showStatus(t("loadingModel"),"loading");
  try{
    const mod=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm");
    const vision=await mod.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    poseLandmarker=await mod.PoseLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"},
      runningMode:"VIDEO",numPoses:1,minPoseDetectionConfidence:.45,minPosePresenceConfidence:.45,minTrackingConfidence:.45
    });
    return poseLandmarker
  }catch(e){
    console.error(e);
    throw new Error(t("modelFail"))
  }
}

function movementLabel(v){return v==="standing"?t("standing"):v==="moving"?t("moving"):v==="jump_like"?t("jump"):t("unclassified")}

function compute(frames){
  if(frames.length<3)throw new Error(t("poseLow"));
  const side=["left","right"].map(s=>({s,y:Math.min(...frames.map(f=>f.joints[s+"_wrist"]?.y??9))})).sort((a,b)=>a.y-b.y)[0].s;
  const scored=frames.map((f,i)=>{
    const w=f.joints[side+"_wrist"],sh=f.joints[side+"_shoulder"];
    if(!visible(w)||!visible(sh))return null;
    return{i,time:f.time,score:w.y-.25*dist(w,sh),raised:w.y<sh.y}
  }).filter(Boolean);
  if(!scored.length)throw new Error(t("poseLow"));

  const local=[];
  scored.forEach((c,k)=>{
    if(!c.raised)return;
    const p=scored[Math.max(0,k-2)],n=scored[Math.min(scored.length-1,k+2)];
    if(c.score<=p.score&&c.score<=n.score)local.push(c)
  });
  const candidates=[];
  local.sort((a,b)=>a.score-b.score).forEach(c=>{if(candidates.every(x=>Math.abs(x.time-c.time)>.9))candidates.push(c)});
  const chosen=candidates[0]||[...scored].sort((a,b)=>a.score-b.score)[0];
  const ci=chosen.i,j=frames[ci].joints;

  const arm=[side+"_shoulder",side+"_elbow",side+"_wrist"],ec=conf(j,arm);
  const elbow=ec>=.45?angle(j[arm[0]],j[arm[1]],j[arm[2]]):null;
  const sc=conf(j,["left_shoulder","right_shoulder"]);
  const shoulder=sc>=.45?lineAngle(j.left_shoulder,j.right_shoulder):null;

  let knee=null,kc=0;
  frames.slice(0,ci+1).forEach(fr=>["left","right"].forEach(s=>{
    const ns=[s+"_hip",s+"_knee",s+"_ankle"],c=conf(fr.joints,ns);
    if(c>=.45){const v=angle(fr.joints[ns[0]],fr.joints[ns[1]],fr.joints[ns[2]]);if(v!=null&&(knee==null||v<knee)){knee=v;kc=c}}
  }));

  const tc=conf(j,["left_shoulder","right_shoulder","left_hip","right_hip"]);
  let torso=null;
  if(tc>=.45){const sm=mid(j.left_shoulder,j.right_shoulder),hm=mid(j.left_hip,j.right_hip);torso=Math.abs(Math.atan2(sm.x-hm.x,-(sm.y-hm.y))*180/Math.PI)}

  const hipPts=frames.map(fr=>mid(fr.joints.left_hip,fr.joints.right_hip)).filter(Boolean);
  const scales=frames.map(fr=>{const sm=mid(fr.joints.left_shoulder,fr.joints.right_shoulder),hm=mid(fr.joints.left_hip,fr.joints.right_hip);return sm&&hm?dist(sm,hm):null});
  const scale=Math.max(median(scales)||.12,.04);
  let travel=0;
  for(let a=0;a<hipPts.length;a++)for(let b=a+1;b<hipPts.length;b++)travel=Math.max(travel,dist(hipPts[a],hipPts[b]));
  const travelBody=travel/scale;
  const ys=hipPts.map(p=>p.y),rise=ys.length?(median(ys)-Math.min(...ys))/scale:0;

  let movement="standing",movementConf=.6;
  if(rise>.42){movement="jump_like";movementConf=Math.min(1,.55+(rise-.42)*.8)}
  else if(travelBody>.72){movement="moving";movementConf=Math.min(1,.55+(travelBody-.72)*.35)}
  else movementConf=Math.min(1,.6+(.72-travelBody)*.35);

  let recovery=null,rc=0;
  frames.slice(ci+1).some(fr=>{
    const c=conf(fr.joints,["left_ankle","right_ankle","left_hip","right_hip"]);if(c<.5)return false;
    const hm=mid(fr.joints.left_hip,fr.joints.right_hip),span=Math.max(dist(fr.joints.left_hip,fr.joints.right_hip),1e-5);
    const ld=Math.abs(fr.joints.left_ankle.x-hm.x),rd=Math.abs(fr.joints.right_ankle.x-hm.x);
    if(Math.abs(ld-rd)/span<.8){recovery=fr.time-frames[ci].time;rc=c;return true}return false
  });

  const contactHip=mid(j.left_hip,j.right_hip),firstHip=hipPts[0],lastHip=hipPts.at(-1);
  const shoulderW=j.left_shoulder&&j.right_shoulder?Math.max(dist(j.left_shoulder,j.right_shoulder),.02):null;
  const ankleMid=mid(j.left_ankle,j.right_ankle),ankleW=j.left_ankle&&j.right_ankle?dist(j.left_ankle,j.right_ankle):null;
  const approach=firstHip&&contactHip?dist(firstHip,contactHip)/scale:null;
  const ret=contactHip&&lastHip?dist(contactHip,lastHip)/scale:null;
  const base=ankleW&&shoulderW?ankleW/shoulderW:null;
  const bal=contactHip&&ankleMid&&shoulderW?Math.abs(contactHip.x-ankleMid.x)/shoulderW:null;

  const metrics={
    elbow_extension:{value:elbow==null?null:+elbow.toFixed(1),unit:"°",confidence:+ec.toFixed(2)},
    shoulder_line_angle:{value:shoulder==null?null:+shoulder.toFixed(1),unit:"°",confidence:+sc.toFixed(2)},
    deepest_knee_angle:{value:knee==null?null:+knee.toFixed(1),unit:"°",confidence:+kc.toFixed(2)},
    torso_lean:{value:torso==null?null:+torso.toFixed(1),unit:"°",confidence:+tc.toFixed(2)},
    recovery_time_proxy:{value:recovery==null?null:+recovery.toFixed(2),unit:"s",confidence:+rc.toFixed(2)}
  };
  if(movement!=="standing"){
    metrics.approach_travel={value:approach==null?null:+approach.toFixed(2),unit:"body",confidence:+movementConf.toFixed(2)};
    metrics.base_width_ratio={value:base==null?null:+base.toFixed(2),unit:"x",confidence:+conf(j,["left_ankle","right_ankle","left_shoulder","right_shoulder"]).toFixed(2)};
    metrics.balance_offset={value:bal==null?null:+bal.toFixed(2),unit:"x shoulder",confidence:+conf(j,["left_ankle","right_ankle","left_hip","right_hip"]).toFixed(2)};
    metrics.return_travel={value:ret==null?null:+ret.toFixed(2),unit:"body",confidence:+movementConf.toFixed(2)}
  }
  const vals=Object.values(metrics).filter(m=>m.value!=null).map(m=>m.confidence);
  const overall=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;

  return{
    version:"v6",hitting_side:side,contact_time:+frames[ci].time.toFixed(2),contact_joints:j,
    contact_candidate_count:candidates.length,movement_type:movement,movement_confidence:+movementConf.toFixed(2),
    body_travel:+travelBody.toFixed(2),jump_rise:+rise.toFixed(2),metrics,overall_confidence:+overall.toFixed(3),
    status:overall<.55?"needs_rerecord":"ok"
  }
}

async function analyzeVideo(file){
  const pl=await initPose();
  showStatus(t("analyzing"),"loading");
  const url=URL.createObjectURL(file),video=document.createElement("video");
  video.src=url;video.muted=true;video.playsInline=true;video.preload="auto";
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(lang==="th"?"โหลดข้อมูลวิดีโอช้าเกินไป":"Video metadata timed out")),15000);
    video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};
    video.onerror=()=>{clearTimeout(timer);reject(new Error(lang==="th"?"เปิดวิดีโอไม่ได้":"Could not open video"))}
  });
  const duration=Math.min(video.duration,30),frames=[],sampleEvery=.2;
  let last=-99,done=false;
  const capture=tm=>{
    if(tm-last<sampleEvery-.02)return;last=tm;
    const r=pl.detectForVideo(video,Math.round(tm*1000)),lm=r.landmarks?.[0];if(!lm)return;
    const joints={};Object.entries(IDX).forEach(([name,i])=>{const p=lm[i];if(p)joints[name]={x:p.x,y:p.y,visibility:p.visibility??0}});
    frames.push({time:tm,joints})
  };
  await new Promise(async(resolve,reject)=>{
    const timeout=setTimeout(()=>{if(!done){try{video.pause()}catch{}reject(new Error(lang==="th"?"การอ่านวิดีโอใช้เวลานานเกินไป":"Video analysis timed out"))}},Math.max(45000,duration*5000));
    const finish=()=>{if(done)return;done=true;clearTimeout(timeout);try{video.pause()}catch{}resolve()};
    try{
      video.currentTime=0;video.playbackRate=2;
      if("requestVideoFrameCallback" in HTMLVideoElement.prototype){
        const loop=(_,meta)=>{
          if(done)return;const tm=Math.min(meta.mediaTime??video.currentTime,duration);
          try{capture(tm)}catch(e){clearTimeout(timeout);reject(e);return}
          if(video.currentTime>=duration||video.ended){finish();return}
          video.requestVideoFrameCallback(loop)
        };video.requestVideoFrameCallback(loop)
      }else{
        const loop=()=>{
          if(done)return;try{capture(Math.min(video.currentTime,duration))}catch(e){clearTimeout(timeout);reject(e);return}
          if(video.currentTime>=duration||video.ended){finish();return}requestAnimationFrame(loop)
        };requestAnimationFrame(loop)
      }
      video.onended=finish;await video.play()
    }catch(e){clearTimeout(timeout);reject(e)}
  });
  URL.revokeObjectURL(url);
  const a=compute(frames);a.video_duration=video.duration;a.frame_count=frames.length;return a
}

function adviceFor(a){
  const m=a.metrics,out=[];
  if(m.elbow_extension?.value!=null&&m.elbow_extension.value<145)out.push(["attention",t("adviceElbow"),t("guideElbow")]);
  if(m.deepest_knee_angle?.value!=null&&m.deepest_knee_angle.value>155)out.push(["attention",t("adviceKnee"),""]);
  if(m.torso_lean?.value!=null&&m.torso_lean.value>35)out.push(["check",t("adviceTorso"),""]);
  if(a.movement_type!=="standing"&&m.balance_offset?.value!=null&&m.balance_offset.value>.75)out.push(["attention",t("adviceBalance"),t("guideBalance")]);
  if(m.recovery_time_proxy?.value!=null&&m.recovery_time_proxy.value>1.5)out.push(["attention",t("adviceRecovery"),""]);
  if(!out.length)out.push(["ok",t("adviceClear"),""]);
  return out.slice(0,3)
}

function metricLabel(k){return t("metric_"+k)}
function renderResult(a){
  currentAnalysis=a;
  $("#analysisCard").classList.remove("hidden");
  $("#movementBadge").textContent=movementLabel(a.movement_type);
  $("#poseBadge").textContent=t("poseConfidence")+" "+pct(a.overall_confidence);

  let html="<p>"+t("contactAt")+" <b>"+a.contact_time+" "+t("seconds")+"</b> · "+t("hittingSide")+": <b>"+t(a.hitting_side)+"</b></p>";
  html+="<p class='note'>"+t("movementConfidence")+": "+pct(a.movement_confidence)+"</p>";
  if(a.contact_candidate_count>1)html+="<div class='status loading'>"+t("multiContact")+"</div>";
  $("#summaryText").innerHTML=html;

  $("#adviceList").innerHTML=adviceFor(a).map((x,i)=>"<div class='advice "+x[0]+"'><b>"+(i+1)+".</b> "+x[1]+(x[2]?"<small>"+x[2]+"</small>":"")+"</div>").join("");

  $("#footworkText").innerHTML="<p>"+(a.movement_type==="standing"?t("standingFoot"):a.movement_type==="jump_like"?t("jumpFoot"):t("movingFoot"))+"</p>";

  $("#metricsGrid").innerHTML=Object.entries(a.metrics).map(([k,m])=>
    "<div class='metric'><small>"+metricLabel(k)+"</small><strong>"+(m.value==null?"—":m.value+" "+m.unit)+"</strong><small>Confidence "+pct(m.confidence)+"</small></div>"
  ).join("")+"<p class='note'>"+t("cameraNote")+"</p>";

  $("#nextActions").innerHTML="<ol class='next-list'><li>"+t("next1")+"</li><li>"+t("next2")+"</li><li>"+t("next3")+"</li></ol>";
  $("#contactWarning").textContent=t("confirmContact");

  if(resultURL)URL.revokeObjectURL(resultURL);
  resultURL=URL.createObjectURL(currentFile);
  const v=$("#resultVideo");v.src=resultURL;
  v.onloadedmetadata=()=>jumpToContact();
  setTimeout(()=>$("#analysisCard").scrollIntoView({behavior:"smooth",block:"start"}),120)
}

function jumpToContact(){
  if(!currentAnalysis)return;
  const v=$("#resultVideo");v.pause();v.currentTime=Math.max(0,currentAnalysis.contact_time);
  const draw=()=>{drawOverlay();v.removeEventListener("seeked",draw)};
  v.addEventListener("seeked",draw);setTimeout(drawOverlay,350)
}

function drawOverlay(){
  const a=currentAnalysis,v=$("#resultVideo"),c=$("#poseCanvas");if(!a||!v.videoWidth)return;
  c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);if(!overlayVisible)return;
  const j=a.contact_joints,xy=p=>[p.x*c.width,p.y*c.height];
  const pairs=[["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["left_shoulder","left_hip"],["right_shoulder","right_hip"],["left_hip","right_hip"],["left_hip","left_knee"],["left_knee","left_ankle"],["right_hip","right_knee"],["right_knee","right_ankle"]];
  ctx.strokeStyle="rgba(34,197,94,.96)";ctx.fillStyle="rgba(34,197,94,.96)";ctx.lineWidth=Math.max(4,c.width/220);
  pairs.forEach(([a,b])=>{if(!visible(j[a])||!visible(j[b]))return;const p=xy(j[a]),q=xy(j[b]);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke()});
  Object.values(j).forEach(p=>{if(!visible(p))return;const q=xy(p);ctx.beginPath();ctx.arc(q[0],q[1],Math.max(5,c.width/180),0,Math.PI*2);ctx.fill()});

  ctx.font=Math.max(18,Math.round(c.width/36))+"px -apple-system,sans-serif";ctx.fillStyle="#fff";ctx.strokeStyle="rgba(0,0,0,.75)";ctx.lineWidth=5;
  const labels=[];
  if(a.metrics.elbow_extension?.value!=null)labels.push("Elbow "+a.metrics.elbow_extension.value+"°");
  if(a.metrics.deepest_knee_angle?.value!=null)labels.push("Knee "+a.metrics.deepest_knee_angle.value+"°");
  if(a.metrics.torso_lean?.value!=null)labels.push("Torso "+a.metrics.torso_lean.value+"°");
  labels.forEach((x,i)=>{ctx.strokeText(x,18,38+i*36);ctx.fillText(x,18,38+i*36)});

  ctx.save();ctx.setLineDash([18,12]);ctx.strokeStyle="rgba(59,130,246,.98)";ctx.lineWidth=Math.max(4,c.width/220);
  if(a.metrics.elbow_extension?.value!=null&&a.metrics.elbow_extension.value<145){
    const e=j[a.hitting_side+"_elbow"],s=j[a.hitting_side+"_shoulder"];
    if(visible(e)&&visible(s)){const ep=xy(e),sp=xy(s),vx=ep[0]-sp[0],vy=ep[1]-sp[1],mag=Math.hypot(vx,vy)||1;ctx.beginPath();ctx.moveTo(...ep);ctx.lineTo(ep[0]+vx/mag*c.width*.12,ep[1]+vy/mag*c.width*.12);ctx.stroke()}
  }
  if(a.metrics.balance_offset?.value!=null&&a.metrics.balance_offset.value>.75){
    const hm=mid(j.left_hip,j.right_hip),am=mid(j.left_ankle,j.right_ankle);
    if(hm&&am){const hp=xy(hm),ap=xy(am);ctx.beginPath();ctx.moveTo(hp[0],hp[1]);ctx.lineTo(ap[0],hp[1]);ctx.stroke()}
  }
  ctx.restore()
}

function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("skillcam-local",2);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("sessions"))db.createObjectStore("sessions",{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function saveSession(s){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("sessions","readwrite");tx.objectStore("sessions").put(s);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function getSessions(){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction("sessions").objectStore("sessions").getAll();r.onsuccess=()=>resolve((r.result||[]).filter(x=>x.analysis?.version==="v6").sort((a,b)=>b.created_at.localeCompare(a.created_at)));r.onerror=()=>reject(r.error)})}

async function loadProgress(){
  const all=await getSessions();
  if(!all.length){$("#progressSummary").innerHTML="<p>"+t("noHistory")+"</p>";$("#historyList").innerHTML="";return}
  const latest=all[0],prev=all[1];
  let compare="<h2>"+t("compare")+"</h2>";
  if(!prev)compare+="<p class='note'>"+t("needTwo")+"</p>";
  else{
    const keys=["elbow_extension","deepest_knee_angle","torso_lean","recovery_time_proxy"];
    compare+="<div class='progress-grid'>"+keys.map(k=>{
      const c=latest.analysis.metrics[k]?.value,p=prev.analysis.metrics[k]?.value,d=c!=null&&p!=null?c-p:null;
      return"<div class='progress-box'><small>"+metricLabel(k)+"</small><strong>"+(d==null?"—":(d>0?"+":"")+d.toFixed(2))+"</strong><small>"+(p??"—")+" → "+(c??"—")+"</small></div>"
    }).join("")+"</div><p class='note'>"+t("cameraNote")+"</p>"
  }
  $("#progressSummary").innerHTML=compare;
  $("#historyList").innerHTML="<h2>"+t("history")+"</h2>"+all.slice(0,10).map(s=>"<div class='history-item'><div><b>"+s.player_name+"</b><div class='note'>"+new Date(s.created_at).toLocaleString()+"</div></div><div><span class='badge'>"+movementLabel(s.analysis.movement_type)+"</span><div class='note'>Pose "+pct(s.analysis.overall_confidence)+"</div></div></div>").join("")
}

function renderLearn(){
  const phases=[[1,"phase1","phase1d"],[2,"phase2","phase2d"],[3,"phase3","phase3d"],[4,"phase4","phase4d"],[5,"phase5","phase5d"],[6,"phase6","phase6d"],[7,"phase7","phase7d"]];
  $("#phaseGrid").innerHTML=phases.map(p=>"<div class='phase-card'><span>"+p[0]+"</span><h3>"+t(p[1])+"</h3><p>"+t(p[2])+"</p></div>").join("")
}

$("#languageSelect").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("skillcam-language",lang);applyLanguage()});
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#startAnalyzeBtn").addEventListener("click",()=>setView("analyze"));
$("#progressBtn").addEventListener("click",()=>setView("progress"));
$("#contactBtn").addEventListener("click",jumpToContact);
$("#overlayBtn").addEventListener("click",function(){overlayVisible=!overlayVisible;this.textContent=overlayVisible?t("hideOverlay"):t("showOverlay");drawOverlay()});
$("#retryBtn").addEventListener("click",()=>{$("#videoInput").value="";currentFile=null;currentAnalysis=null;$("#analysisCard").classList.add("hidden");$("#videoPicker").classList.remove("selected");$("#fileMeta").textContent=t("fileHint");$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");hideStatus();setView("analyze");window.scrollTo({top:0,behavior:"smooth"})});

$("#videoInput").addEventListener("change",e=>{
  const f=e.target.files?.[0];currentFile=f||null;
  if(!f){$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");return}
  const mb=(f.size/1024/1024).toFixed(1);
  $("#videoPicker").classList.add("selected");$("#fileMeta").textContent=f.name+" · "+mb+" MB · "+t("selected");
  $("#analyzeBtn").disabled=f.size>200*1024*1024;$("#analyzeBtnText").textContent=f.size>200*1024*1024?t("tooLarge"):t("analyzeBtn");
  if(f.size>200*1024*1024)showStatus(t("tooLarge"),"error");else hideStatus()
});

$("#analyzeBtn").addEventListener("click",async()=>{
  if(!currentFile){showStatus(t("chooseFirst"),"error");return}
  if(!$("#consentAnalysis").checked){showStatus(t("needConsent"),"error");return}
  const btn=$("#analyzeBtn");btn.disabled=true;$("#analyzeBtnText").textContent=t("analyzing");
  try{
    const a=await analyzeVideo(currentFile);
    renderResult(a);
    if(a.status==="needs_rerecord"){showStatus(t("poseLow"),"error");return}
    const session={id:crypto.randomUUID(),player_name:$("#playerName").value.trim()||"Player",analysis:a,created_at:new Date().toISOString()};
    if($("#saveProgress").checked){await saveSession(session);showStatus(t("saved"),"success")}else showStatus(t("notSaved"),"success")
  }catch(e){console.error(e);showStatus(t("analysisFail")+": "+(e.message||e),"error")}
  finally{btn.disabled=false;$("#analyzeBtnText").textContent=t("analyzeBtn")}
});

applyLanguage();
renderLearn();
