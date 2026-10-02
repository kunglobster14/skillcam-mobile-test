const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

let lang=localStorage.getItem("skillcam-language")||"th";
let coarseLandmarker=null;
let preciseLandmarker=null;
let currentFile=null;
let currentAnalysis=null;
let currentSessionId=null;
let resultURL=null;
let overlayVisible=true;

const IDX={
  nose:0,left_shoulder:11,right_shoulder:12,left_elbow:13,right_elbow:14,left_wrist:15,right_wrist:16,
  left_hip:23,right_hip:24,left_knee:25,right_knee:26,left_ankle:27,right_ankle:28,
  left_heel:29,right_heel:30,left_foot:31,right_foot:32
};

const T={
th:{
brandSub:"AI Visual Coach · Accuracy-first Prototype",learnTab:"เรียน",analyzeTab:"วิเคราะห์",progressTab:"พัฒนาการ",
heroEyebrow:"Accuracy Mode",heroTitle:"วัดท่า Smash จากเฟรมจริง แล้วค่อยเปรียบเทียบกับท่าอ้างอิง",
heroText:"AI จะหาเฟรมที่น่าจะเป็นจังหวะตีให้ก่อน จากนั้นใช้โมเดลละเอียดวัดองศา 3D โดยประมาณบนเฟรมที่คุณยืนยัน",
how1:"เลือกคลิป",how1s:"1 Smash ต่อคลิปดีที่สุด",how2:"AI หาเฟรม",how2s:"ค้นหาช่วงตีแบบเร็ว",how3:"ยืนยันและวัด",how3s:"ขยับเฟรม + Full model",how4:"เทียบ Reference",how4s:"ให้คะแนนเมื่อมีข้อมูลโค้ช",
chooseTitle:"เลือกคลิป Smash",chooseHelp:"เพื่อความแม่น: เห็นเต็มตัว เท้าไม่ถูกบัง กล้องนิ่ง และมี 1 Smash ต่อคลิป",tester:"ชื่อ/รหัสผู้ทดสอบ",pickVideo:"แตะเพื่อเลือกวิดีโอ",fileHint:"สูงสุด 200 MB · วิเคราะห์ช่วงต้นสูงสุด 30 วินาที",
cameraView:"มุมกล้อง",cameraSide:"ด้านข้างประมาณ 90°",cameraRear:"ด้านหลัง",cameraFront:"ด้านหน้า",cameraDiag:"เฉียง/ไม่แน่ใจ",
consent:"ยินยอมให้วิเคราะห์คลิปบนอุปกรณ์นี้",saveProgress:"เก็บผลไว้ใน Safari เพื่อดูพัฒนาการ",
analyzeBtn:"เริ่มวิเคราะห์",chooseFirst:"เลือกคลิปก่อน",selected:"เลือกแล้ว",tooLarge:"คลิปเกิน 200 MB",needConsent:"กรุณายินยอมให้วิเคราะห์คลิปก่อน",
loadingFast:"กำลังโหลดโมเดลสำหรับหาเฟรมตี...",loadingPrecise:"กำลังโหลด Full pose model สำหรับวัดองศา...",analyzing:"กำลังค้นหาจังหวะตีในคลิป...",measuring:"กำลังวัดเฟรมนี้แบบละเอียด...",
analysisFail:"วิเคราะห์ไม่สำเร็จ",modelFail:"โหลด AI model ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",poseLow:"ตรวจจับร่างกายไม่ชัดพอ ควรถ่ายใหม่ให้เห็นเต็มตัวและเท้า",
resultEyebrow:"Accuracy Result",resultTitle:"AI Measurement",whatSaw:"AI หาเฟรมอะไรให้",visualTitle:"องศาบนตัวผู้เล่น",visualHelp:"เส้นและ arc ถูกวางบนข้อต่อของเฟรมที่กำลังวัด ไม่ใช่เส้นกราฟิกตกแต่ง",
currentPose:"กระดูก/ข้อต่อที่ตรวจพบ",guidePose:"Arc ขององศาที่วัด",contactBtn:"กลับไปเฟรมที่ AI เลือก",hideOverlay:"ซ่อนการวัด",showOverlay:"แสดงการวัด",
accuracyTitle:"ยืนยันเฟรมและวัดองศา",accuracyHelp:"AI เลือกเฟรมให้ก่อน แต่คุณสามารถขยับประมาณ 1 เฟรมแล้ววัดใหม่จนตรงกับจังหวะที่ต้องการ",measureFrame:"วัดเฟรมนี้แบบละเอียด",
modeCoarse:"รอบแรก: Lite model ใช้หาเฟรมเท่านั้น",modePrecise:"เฟรมยืนยัน: Full model + 3D world landmarks ใช้วัดองศา",
angleTitle:"องศาที่วัดได้จากเฟรมนี้",referenceTitle:"เปรียบเทียบกับท่าอ้างอิง",
referencePending:"ยังไม่ให้คะแนน “ถูก/ผิด” เพราะเรายังไม่มี Reference Pose ที่โค้ชรับรองสำหรับประเภท Smash และมุมกล้องนี้ การให้คะแนนก่อนมี reference จะทำให้ผู้ใช้ฝึกผิดได้",
referenceNeed:"ขั้นต่อไปของระบบ: เก็บคลิปตัวอย่างจากโค้ชจริง แยก Standing / Moving / Jump-like และแยกมุมกล้อง แล้วกำหนดช่วงอ้างอิงของแต่ละ phase",
coachAdvice:"คำอธิบายจากการวัด",referenceNote:"ตอนนี้แสดงข้อสังเกตจากค่าที่วัด ไม่ถือเป็นคำตัดสินว่าท่าถูกหรือผิด",
footworkTitle:"Footwork / การเข้าตำแหน่ง",details:"ดูข้อมูลเทคนิค",nextTitle:"ทำอะไรต่อ",retry:"เลือกคลิปใหม่",viewProgress:"ดูพัฒนาการ",
standing:"Standing Smash",moving:"Moving Smash",jump:"Jump-like Smash",unclassified:"ยังจำแนกไม่ได้",poseConfidence:"Pose confidence",movementConfidence:"Movement confidence",
contactAt:"AI เสนอเฟรมที่",seconds:"วินาที",hittingSide:"ข้างที่ใช้ตี",left:"ซ้าย",right:"ขวา",multiContact:"พบหลายช่วงที่คล้ายการตีเหนือศีรษะ ควรใช้คลิปที่มี 1 Smash เพื่อให้เลือกเฟรมแม่นขึ้น",
confirmContact:"หากเฟรมยังเร็วหรือช้า ให้ใช้ปุ่ม −0.033s / +0.033s แล้วกด “วัดเฟรมนี้แบบละเอียด”",
standingFoot:"คลิปนี้มีการเคลื่อนเข้าหาลูกน้อย จึงไม่สร้างคะแนน Footwork",movingFoot:"พบการเคลื่อนเข้าหาจังหวะตี จึงวัด Approach / Base / Balance / Recovery",jumpFoot:"พบการยกตัวแบบ Jump-like จึงวัดการยกตัว ฐานเท้า และ Recovery แบบ proxy",
obsElbow:"ศอกข้างตี",obsShoulder:"มุมแขนบนเทียบลำตัว",obsLeftKnee:"เข่าซ้าย",obsRightKnee:"เข่าขวา",obsTorso:"ลำตัวเอียง",
threeD:"3D estimate",twoD:"2D image",difference:"ต่างกัน",confidence:"ความมั่นใจ",
noPrecise:"ยังไม่ได้วัดเฟรมแบบละเอียด",cameraWarning:"ค่าจากกล้องเดียวเป็นการประมาณ 3D จาก AI ไม่ใช่การวัด motion-capture จริง ควรใช้มุมกล้องเดิมทุกครั้งเมื่อเทียบพัฒนาการ",
next1:"ตรวจว่าภาพหยุดตรงจังหวะที่ต้องการหรือไม่",next2:"ขยับเฟรมทีละประมาณ 0.033 วินาทีแล้ววัดใหม่ถ้ายังไม่ตรง",next3:"ใช้มุมกล้องเดิมในการทดสอบครั้งถัดไปเพื่อให้เทียบกันได้",
saved:"บันทึก measurement นี้ใน Progress แล้ว",notSaved:"วัดสำเร็จ แต่ไม่ได้บันทึกประวัติ",
learnEyebrow:"ก่อนใช้ Accuracy Mode",learnTitle:"การฝึกจาก AI ต้องวัด phase เดียวกันทุกครั้ง",learnText:"ค่ามุมจะมีความหมายเมื่อเฟรมและมุมกล้องสอดคล้องกัน การเปรียบเทียบคนละ phase หรือคนละมุมกล้องจะทำให้ผลหลอกตา",
movementModes:"หลักการของ SkillCam Accuracy",standingLearn:"Standing: วัดแขน ลำตัว เข่า และ recovery แต่ไม่สร้าง Footwork ที่ไม่มีในคลิป",movingLearn:"Moving: เพิ่มการเข้าหาลูก ฐานเท้า และ balance",jumpLearn:"Jump-like: เพิ่มการยกตัว/ลงพื้น แต่ยังเป็น proxy จากกล้องเดียว",startAnalyze:"เริ่มวิเคราะห์",
phase1:"Preparation",phase1d:"แยกเฟรมเตรียมให้ชัด",phase2:"Approach",phase2d:"วัดเฉพาะเมื่อมีการเคลื่อนเข้าหาลูก",phase3:"Load",phase3d:"วัดเข่า/ลำตัวช่วงโหลดแรง",phase4:"Swing",phase4d:"ดูการเปลี่ยนมุมของแขนและลำตัว",phase5:"Contact",phase5d:"ยืนยันเฟรมเองก่อนใช้ค่าองศา",phase6:"Landing",phase6d:"วัดฐานและ balance หลังตี",phase7:"Recovery",phase7d:"ดูเวลาคืนตัว",
progressEyebrow:"Measurement History",progressTitle:"เปรียบเทียบค่าที่วัดจากเฟรมยืนยัน",progressText:"เปรียบเทียบเฉพาะค่าที่ใช้ Full model วัด และควรใช้ประเภท Smash + มุมกล้องเดียวกัน",
noHistory:"ยังไม่มี measurement ที่บันทึกไว้",history:"ประวัติ Measurement",compare:"เทียบ 2 ครั้งล่าสุด",needTwo:"ต้องมีอย่างน้อย 2 ครั้งจึงจะเปรียบเทียบได้",
metric_elbow_3d:"ศอกข้างตี 3D",metric_shoulder_3d:"แขนบน/ลำตัว 3D",metric_left_knee_3d:"เข่าซ้าย 3D",metric_right_knee_3d:"เข่าขวา 3D",metric_torso_tilt_3d:"ลำตัวเอียง 3D",
metric_elbow_2d:"ศอกข้างตี 2D",metric_shoulder_2d:"แขนบน/ลำตัว 2D",metric_left_knee_2d:"เข่าซ้าย 2D",metric_right_knee_2d:"เข่าขวา 2D",
metric_recovery_time_proxy:"Recovery proxy",metric_approach_travel:"Approach travel",metric_balance_offset:"Balance offset"
},
en:{
brandSub:"AI Visual Coach · Accuracy-first Prototype",learnTab:"Learn",analyzeTab:"Analyze",progressTab:"Progress",
heroEyebrow:"Accuracy Mode",heroTitle:"Measure the actual selected frame first, then compare with a validated reference",
heroText:"AI proposes a hitting frame, then a higher-detail model measures estimated 3D joint angles on the frame you confirm.",
how1:"Choose clip",how1s:"One smash per clip works best",how2:"AI finds frame",how2s:"Fast first-pass search",how3:"Confirm + measure",how3s:"Frame step + Full model",how4:"Reference compare",how4s:"Score only after coach validation",
chooseTitle:"Choose a smash clip",chooseHelp:"For accuracy: full body and feet visible, stable camera, one smash per clip",tester:"Tester name / ID",pickVideo:"Tap to choose a video",fileHint:"Up to 200 MB · first 30 seconds analyzed",
cameraView:"Camera view",cameraSide:"Side about 90°",cameraRear:"Rear",cameraFront:"Front",cameraDiag:"Diagonal / unsure",
consent:"I consent to on-device analysis",saveProgress:"Save measurements in Safari for progress",analyzeBtn:"Start analysis",chooseFirst:"Choose a clip first",selected:"Selected",tooLarge:"Clip is over 200 MB",needConsent:"Please consent to analysis first",
loadingFast:"Loading fast pose model...",loadingPrecise:"Loading Full pose model for angle measurement...",analyzing:"Searching the clip for the hitting phase...",measuring:"Measuring this frame with the Full model...",
analysisFail:"Analysis failed",modelFail:"AI model could not load. Check your internet connection and try again.",poseLow:"Pose detection is too unclear. Re-record with full body and feet visible.",
resultEyebrow:"Accuracy Result",resultTitle:"AI Measurement",whatSaw:"AI-proposed frame",visualTitle:"Angles on the player",visualHelp:"Lines and angle arcs are anchored to detected joints on the measured frame, not decorative graphics.",
currentPose:"Detected joints/skeleton",guidePose:"Measured angle arcs",contactBtn:"Return to AI frame",hideOverlay:"Hide measurement",showOverlay:"Show measurement",
accuracyTitle:"Confirm frame and measure angles",accuracyHelp:"AI proposes a frame first. Step roughly one frame and re-measure until it matches the moment you want.",measureFrame:"Measure this frame precisely",
modeCoarse:"First pass: Lite model is used only to find the phase",modePrecise:"Confirmed frame: Full model + 3D world landmarks are used for angles",
angleTitle:"Angles measured on this frame",referenceTitle:"Compare with reference pose",
referencePending:"No “correct/incorrect” score yet because there is no coach-validated reference pose for this smash type and camera view. Scoring before validation could teach the wrong movement.",
referenceNeed:"Next system step: collect real coach reference clips by Standing / Moving / Jump-like and camera view, then define reference ranges for each phase.",
coachAdvice:"Measurement interpretation",referenceNote:"These are observations from measured angles, not a verdict that technique is correct or incorrect.",
footworkTitle:"Footwork / Positioning",details:"Technical data",nextTitle:"What to do next",retry:"Choose another clip",viewProgress:"View progress",
standing:"Standing Smash",moving:"Moving Smash",jump:"Jump-like Smash",unclassified:"Unclassified",poseConfidence:"Pose confidence",movementConfidence:"Movement confidence",
contactAt:"AI proposed",seconds:"seconds",hittingSide:"Hitting side",left:"left",right:"right",multiContact:"Multiple overhead-action phases were found. Use one smash per clip for more reliable frame selection.",
confirmContact:"If the frame is early or late, use −0.033s / +0.033s and press “Measure this frame precisely”.",
standingFoot:"Little approach movement was found, so no footwork score is invented.",movingFoot:"Approach movement was found, so Approach / Base / Balance / Recovery are measured.",jumpFoot:"Jump-like movement was found, so vertical movement, base and recovery are treated as proxies.",
obsElbow:"Hitting elbow",obsShoulder:"Upper arm vs torso",obsLeftKnee:"Left knee",obsRightKnee:"Right knee",obsTorso:"Torso tilt",
threeD:"3D estimate",twoD:"2D image",difference:"difference",confidence:"confidence",noPrecise:"No precise-frame measurement yet",
cameraWarning:"A single camera gives AI-estimated 3D, not motion-capture ground truth. Use the same camera view each time for progress comparisons.",
next1:"Confirm that the frozen image is the intended moment",next2:"Step roughly 0.033 seconds and re-measure if early/late",next3:"Keep the same camera view on future tests for comparable measurements",
saved:"This measurement was saved to Progress",notSaved:"Measurement complete without saving history",
learnEyebrow:"Before Accuracy Mode",learnTitle:"AI training feedback must compare the same movement phase",learnText:"Angles are meaningful only when phase and camera view are consistent. Comparing different phases or views can be misleading.",
movementModes:"SkillCam Accuracy principles",standingLearn:"Standing: arm, torso, knees and recovery; no invented footwork",movingLearn:"Moving: add approach, base and balance",jumpLearn:"Jump-like: add vertical/landing proxies, still from one camera",startAnalyze:"Start analysis",
phase1:"Preparation",phase1d:"Separate a clear preparation frame",phase2:"Approach",phase2d:"Measure only when approach movement exists",phase3:"Load",phase3d:"Measure knee and torso during load",phase4:"Swing",phase4d:"Track arm/torso angle changes",phase5:"Contact",phase5d:"Confirm the frame before trusting angles",phase6:"Landing",phase6d:"Measure base and balance after impact",phase7:"Recovery",phase7d:"Track return-to-ready timing",
progressEyebrow:"Measurement History",progressTitle:"Compare confirmed-frame measurements",progressText:"Only Full-model measurements are compared; keep smash type and camera view consistent.",
noHistory:"No saved precise measurements yet",history:"Measurement history",compare:"Compare latest two",needTwo:"At least two measurements are required",
metric_elbow_3d:"Hitting elbow 3D",metric_shoulder_3d:"Upper arm / torso 3D",metric_left_knee_3d:"Left knee 3D",metric_right_knee_3d:"Right knee 3D",metric_torso_tilt_3d:"Torso tilt 3D",
metric_elbow_2d:"Hitting elbow 2D",metric_shoulder_2d:"Upper arm / torso 2D",metric_left_knee_2d:"Left knee 2D",metric_right_knee_2d:"Right knee 2D",
metric_recovery_time_proxy:"Recovery proxy",metric_approach_travel:"Approach travel",metric_balance_offset:"Balance offset"
}};

function t(k){return T[lang][k]||T.en[k]||k}
function pct(v){return Math.round((v||0)*100)+"%"}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist2(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function mid2(a,b){return a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:null}
function mid3(a,b){return a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2}:null}
function angle2(a,b,c){
  if(!a||!b||!c)return null;
  const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};
  const d=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);if(!d)return null;
  return Math.acos(clamp((u.x*v.x+u.y*v.y)/d,-1,1))*180/Math.PI
}
function angle3(a,b,c){
  if(!a||!b||!c)return null;
  const u={x:a.x-b.x,y:a.y-b.y,z:a.z-b.z},v={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};
  const d=Math.hypot(u.x,u.y,u.z)*Math.hypot(v.x,v.y,v.z);if(!d)return null;
  return Math.acos(clamp((u.x*v.x+u.y*v.y+u.z*v.z)/d,-1,1))*180/Math.PI
}
function vectorAngle3(u,v){
  const d=Math.hypot(u.x,u.y,u.z)*Math.hypot(v.x,v.y,v.z);if(!d)return null;
  return Math.acos(clamp((u.x*v.x+u.y*v.y+u.z*v.z)/d,-1,1))*180/Math.PI
}
function visibility(j,names){const xs=names.map(n=>j[n]?.visibility??0);return xs.reduce((a,b)=>a+b,0)/(xs.length||1)}
function visible(p){return p&&(p.visibility==null||p.visibility>=.35)}
function median(xs){const a=xs.filter(Number.isFinite).slice().sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function round(v,d=1){return v==null?null:+v.toFixed(d)}
function dictFromLandmarks(arr){
  const d={};for(const [name,i] of Object.entries(IDX)){const p=arr?.[i];if(p)d[name]={x:p.x,y:p.y,z:p.z??0,visibility:p.visibility??p.presence??1}}return d
}

function showStatus(text,type=""){const e=$("#statusBox");e.textContent=text;e.className="status "+type;e.classList.remove("hidden")}
function hideStatus(){$("#statusBox").classList.add("hidden")}

function setView(name){
  ["learn","analyze","progress"].forEach(n=>$("#"+n+"View").classList.toggle("hidden",n!==name));
  $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  if(name==="progress")loadProgress();window.scrollTo({top:0,behavior:"smooth"})
}
function movementLabel(v){return v==="standing"?t("standing"):v==="moving"?t("moving"):v==="jump_like"?t("jump"):t("unclassified")}

async function loadVision(){
  return await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm")
}
async function initCoarse(){
  if(coarseLandmarker)return coarseLandmarker;
  showStatus(t("loadingFast"),"loading");
  try{
    const mod=await loadVision();
    const vision=await mod.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    coarseLandmarker=await mod.PoseLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"},
      runningMode:"VIDEO",numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5
    });
    return coarseLandmarker
  }catch(e){console.error(e);throw new Error(t("modelFail"))}
}
async function initPrecise(){
  if(preciseLandmarker)return preciseLandmarker;
  showStatus(t("loadingPrecise"),"loading");
  try{
    const mod=await loadVision();
    const vision=await mod.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    preciseLandmarker=await mod.PoseLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"},
      runningMode:"IMAGE",numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.5
    });
    return preciseLandmarker
  }catch(e){console.error(e);throw new Error(t("modelFail"))}
}

function coarseCompute(frames){
  if(frames.length<3)throw new Error(t("poseLow"));
  const side=["left","right"].map(s=>({s,y:Math.min(...frames.map(f=>f.joints[s+"_wrist"]?.y??9))})).sort((a,b)=>a.y-b.y)[0].s;
  const scored=frames.map((f,i)=>{
    const w=f.joints[side+"_wrist"],sh=f.joints[side+"_shoulder"],el=f.joints[side+"_elbow"];
    if(!visible(w)||!visible(sh)||!visible(el))return null;
    const e=angle2(sh,el,w)??90;
    const reach=dist2(w,sh);
    return{i,time:f.time,score:w.y-.18*reach-.10*(e/180),raised:w.y<sh.y}
  }).filter(Boolean);
  if(!scored.length)throw new Error(t("poseLow"));
  const local=[];
  scored.forEach((c,k)=>{
    if(!c.raised)return;
    const p=scored[Math.max(0,k-2)],n=scored[Math.min(scored.length-1,k+2)];
    if(c.score<=p.score&&c.score<=n.score)local.push(c)
  });
  const candidates=[];
  [...local].sort((a,b)=>a.score-b.score).forEach(c=>{if(candidates.every(x=>Math.abs(x.time-c.time)>.9))candidates.push(c)});
  const chosen=candidates[0]||[...scored].sort((a,b)=>a.score-b.score)[0];

  const hips=frames.map(f=>mid2(f.joints.left_hip,f.joints.right_hip)).filter(Boolean);
  const scales=frames.map(f=>{const s=mid2(f.joints.left_shoulder,f.joints.right_shoulder),h=mid2(f.joints.left_hip,f.joints.right_hip);return s&&h?dist2(s,h):null});
  const scale=Math.max(median(scales)||.12,.04);
  let travel=0;for(let a=0;a<hips.length;a++)for(let b=a+1;b<hips.length;b++)travel=Math.max(travel,dist2(hips[a],hips[b]));
  const ys=hips.map(p=>p.y),rise=ys.length?(median(ys)-Math.min(...ys))/scale:0,travelBody=travel/scale;
  let movement="standing",movementConf=.6;
  if(rise>.42){movement="jump_like";movementConf=clamp(.55+(rise-.42)*.8,.55,1)}
  else if(travelBody>.72){movement="moving";movementConf=clamp(.55+(travelBody-.72)*.35,.55,1)}
  else movementConf=clamp(.6+(.72-travelBody)*.35,.6,1);

  return{
    version:"v7",hitting_side:side,contact_time:round(chosen.time,3),contact_candidate_count:candidates.length,
    movement_type:movement,movement_confidence:round(movementConf,2),coarse_frame_count:frames.length,
    precise:null
  }
}

async function analyzeVideo(file){
  const pl=await initCoarse();showStatus(t("analyzing"),"loading");
  const url=URL.createObjectURL(file),video=document.createElement("video");
  video.src=url;video.muted=true;video.playsInline=true;video.preload="auto";
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(lang==="th"?"โหลดข้อมูลวิดีโอช้าเกินไป":"Video metadata timed out")),15000);
    video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};video.onerror=()=>{clearTimeout(timer);reject(new Error(lang==="th"?"เปิดวิดีโอไม่ได้":"Could not open video"))}
  });
  const duration=Math.min(video.duration,30),frames=[],sampleEvery=.125;let last=-99,done=false;
  const capture=tm=>{
    if(tm-last<sampleEvery-.015)return;last=tm;
    const r=pl.detectForVideo(video,Math.round(tm*1000)),lm=r.landmarks?.[0];if(!lm)return;
    frames.push({time:tm,joints:dictFromLandmarks(lm)})
  };
  await new Promise(async(resolve,reject)=>{
    const timeout=setTimeout(()=>{if(!done){try{video.pause()}catch{}reject(new Error(lang==="th"?"การอ่านวิดีโอใช้เวลานานเกินไป":"Video analysis timed out"))}},Math.max(60000,duration*6000));
    const finish=()=>{if(done)return;done=true;clearTimeout(timeout);try{video.pause()}catch{}resolve()};
    try{
      video.currentTime=0;video.playbackRate=2;
      if("requestVideoFrameCallback" in HTMLVideoElement.prototype){
        const loop=(_,meta)=>{if(done)return;const tm=Math.min(meta.mediaTime??video.currentTime,duration);try{capture(tm)}catch(e){clearTimeout(timeout);reject(e);return}
          if(video.currentTime>=duration||video.ended){finish();return}video.requestVideoFrameCallback(loop)};
        video.requestVideoFrameCallback(loop)
      }else{
        const loop=()=>{if(done)return;try{capture(Math.min(video.currentTime,duration))}catch(e){clearTimeout(timeout);reject(e);return}
          if(video.currentTime>=duration||video.ended){finish();return}requestAnimationFrame(loop)};requestAnimationFrame(loop)
      }
      video.onended=finish;await video.play()
    }catch(e){clearTimeout(timeout);reject(e)}
  });
  URL.revokeObjectURL(url);
  const a=coarseCompute(frames);a.video_duration=video.duration;return a
}

function preciseMetrics(imageJ,worldJ,side){
  const shoulder=side+"_shoulder",elbow=side+"_elbow",wrist=side+"_wrist",hip=side+"_hip";
  const elbow2=angle2(imageJ[shoulder],imageJ[elbow],imageJ[wrist]);
  const shoulder2=angle2(imageJ[hip],imageJ[shoulder],imageJ[elbow]);
  const lk2=angle2(imageJ.left_hip,imageJ.left_knee,imageJ.left_ankle);
  const rk2=angle2(imageJ.right_hip,imageJ.right_knee,imageJ.right_ankle);

  const elbow3=angle3(worldJ[shoulder],worldJ[elbow],worldJ[wrist]);
  const shoulder3=angle3(worldJ[hip],worldJ[shoulder],worldJ[elbow]);
  const lk3=angle3(worldJ.left_hip,worldJ.left_knee,worldJ.left_ankle);
  const rk3=angle3(worldJ.right_hip,worldJ.right_knee,worldJ.right_ankle);
  const sm=mid3(worldJ.left_shoulder,worldJ.right_shoulder),hm=mid3(worldJ.left_hip,worldJ.right_hip);
  let torso3=null;
  if(sm&&hm){const v={x:sm.x-hm.x,y:sm.y-hm.y,z:sm.z-hm.z};torso3=vectorAngle3(v,{x:0,y:-1,z:0})}

  return{
    elbow_3d:{value:round(elbow3),unit:"°",confidence:round(visibility(imageJ,[shoulder,elbow,wrist]),2)},
    shoulder_3d:{value:round(shoulder3),unit:"°",confidence:round(visibility(imageJ,[hip,shoulder,elbow]),2)},
    left_knee_3d:{value:round(lk3),unit:"°",confidence:round(visibility(imageJ,["left_hip","left_knee","left_ankle"]),2)},
    right_knee_3d:{value:round(rk3),unit:"°",confidence:round(visibility(imageJ,["right_hip","right_knee","right_ankle"]),2)},
    torso_tilt_3d:{value:round(torso3),unit:"°",confidence:round(visibility(imageJ,["left_shoulder","right_shoulder","left_hip","right_hip"]),2)},
    elbow_2d:{value:round(elbow2),unit:"°",confidence:round(visibility(imageJ,[shoulder,elbow,wrist]),2)},
    shoulder_2d:{value:round(shoulder2),unit:"°",confidence:round(visibility(imageJ,[hip,shoulder,elbow]),2)},
    left_knee_2d:{value:round(lk2),unit:"°",confidence:round(visibility(imageJ,["left_hip","left_knee","left_ankle"]),2)},
    right_knee_2d:{value:round(rk2),unit:"°",confidence:round(visibility(imageJ,["right_hip","right_knee","right_ankle"]),2)}
  }
}

async function measureCurrentFrame(){
  if(!currentAnalysis||!currentFile)return;
  const v=$("#resultVideo");if(!v.videoWidth)return;
  const pl=await initPrecise();showStatus(t("measuring"),"loading");
  try{
    const r=pl.detect(v),lm=r.landmarks?.[0],wm=r.worldLandmarks?.[0];
    if(!lm||!wm)throw new Error(t("poseLow"));
    const imageJ=dictFromLandmarks(lm),worldJ=dictFromLandmarks(wm),metrics=preciseMetrics(imageJ,worldJ,currentAnalysis.hitting_side);
    const confs=Object.values(metrics).map(m=>m.confidence).filter(Number.isFinite);
    currentAnalysis.precise={
      time:round(v.currentTime,3),image_joints:imageJ,world_joints:worldJ,metrics,
      pose_confidence:round(confs.reduce((a,b)=>a+b,0)/(confs.length||1),3),
      camera_view:$("#cameraView")?.value||"unknown",model:"pose_landmarker_full"
    };
    renderPrecise();drawOverlay();await saveCurrentMeasurement();
    showStatus($("#saveProgress").checked?t("saved"):t("notSaved"),"success")
  }catch(e){console.error(e);showStatus(t("analysisFail")+": "+(e.message||e),"error")}
}

function renderResult(a){
  currentAnalysis=a;$("#analysisCard").classList.remove("hidden");
  $("#movementBadge").textContent=movementLabel(a.movement_type);$("#poseBadge").textContent=t("movementConfidence")+" "+pct(a.movement_confidence);
  let s="<p>"+t("contactAt")+" <b>"+a.contact_time+" "+t("seconds")+"</b> · "+t("hittingSide")+": <b>"+t(a.hitting_side)+"</b></p>";
  if(a.contact_candidate_count>1)s+="<div class='status loading'>"+t("multiContact")+"</div>";
  $("#summaryText").innerHTML=s;$("#measurementMode").textContent=t("modeCoarse")+" → "+t("modePrecise");
  $("#footworkText").innerHTML="<p>"+(a.movement_type==="standing"?t("standingFoot"):a.movement_type==="jump_like"?t("jumpFoot"):t("movingFoot"))+"</p>";
  $("#referenceState").innerHTML="<div class='reference-lock'><b>"+t("referencePending")+"</b><p>"+t("referenceNeed")+"</p></div>";
  $("#nextActions").innerHTML="<ol class='next-list'><li>"+t("next1")+"</li><li>"+t("next2")+"</li><li>"+t("next3")+"</li></ol>";
  $("#contactWarning").textContent=t("confirmContact");

  if(resultURL)URL.revokeObjectURL(resultURL);resultURL=URL.createObjectURL(currentFile);
  const v=$("#resultVideo");v.src=resultURL;
  v.onloadedmetadata=()=>{const onSeek=()=>{v.removeEventListener("seeked",onSeek);measureCurrentFrame()};v.addEventListener("seeked",onSeek);v.currentTime=Math.max(0,a.contact_time)};
  setTimeout(()=>$("#analysisCard").scrollIntoView({behavior:"smooth",block:"start"}),120)
}

function renderPrecise(){
  const p=currentAnalysis?.precise;if(!p){$("#angleCards").innerHTML="<p>"+t("noPrecise")+"</p>";return}
  const m=p.metrics,side=currentAnalysis.hitting_side;
  const rows=[
    [t("obsElbow"),m.elbow_3d,m.elbow_2d],
    [t("obsShoulder"),m.shoulder_3d,m.shoulder_2d],
    [t("obsLeftKnee"),m.left_knee_3d,m.left_knee_2d],
    [t("obsRightKnee"),m.right_knee_3d,m.right_knee_2d]
  ];
  $("#angleCards").innerHTML=rows.map(([label,a,b])=>{
    const diff=a.value!=null&&b.value!=null?Math.abs(a.value-b.value).toFixed(1)+"°":"—";
    return"<div class='angle-card'><b>"+label+"</b><div class='angle-main'>"+(a.value??"—")+"°</div><div class='angle-meta'><span>"+t("threeD")+"</span><span>"+t("confidence")+" "+pct(a.confidence)+"</span></div><div class='angle-compare'>"+t("twoD")+": "+(b.value??"—")+"° · "+t("difference")+": "+diff+"</div></div>"
  }).join("")+"<div class='angle-card'><b>"+t("obsTorso")+"</b><div class='angle-main'>"+(m.torso_tilt_3d.value??"—")+"°</div><div class='angle-meta'><span>"+t("threeD")+"</span><span>"+t("confidence")+" "+pct(m.torso_tilt_3d.confidence)+"</span></div></div>";
  $("#metricsGrid").innerHTML=Object.entries(m).map(([k,v])=>"<div class='metric'><small>"+t("metric_"+k)+"</small><strong>"+(v.value??"—")+" "+v.unit+"</strong><small>"+t("confidence")+" "+pct(v.confidence)+"</small></div>").join("")+"<p class='note'>"+t("cameraWarning")+"</p>";
  $("#poseBadge").textContent=t("poseConfidence")+" "+pct(p.pose_confidence)+" · Full";
}

function drawOverlay(){
  const p=currentAnalysis?.precise,v=$("#resultVideo"),c=$("#poseCanvas");if(!p||!v.videoWidth)return;
  c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);if(!overlayVisible)return;
  const j=p.image_joints,xy=q=>[q.x*c.width,q.y*c.height];
  const pairs=[["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["left_shoulder","left_hip"],["right_shoulder","right_hip"],["left_hip","right_hip"],["left_hip","left_knee"],["left_knee","left_ankle"],["right_hip","right_knee"],["right_knee","right_ankle"]];
  ctx.strokeStyle="rgba(34,197,94,.95)";ctx.fillStyle="rgba(34,197,94,.95)";ctx.lineWidth=Math.max(3,c.width/260);
  pairs.forEach(([a,b])=>{if(!visible(j[a])||!visible(j[b]))return;const A=xy(j[a]),B=xy(j[b]);ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke()});
  Object.values(j).forEach(q=>{if(!visible(q))return;const A=xy(q);ctx.beginPath();ctx.arc(A[0],A[1],Math.max(5,c.width/190),0,Math.PI*2);ctx.fill()});

  function arc(a,b,d,label){
    if(!visible(j[a])||!visible(j[b])||!visible(j[d]))return;
    const A=xy(j[a]),B=xy(j[b]),D=xy(j[d]),r=Math.max(34,c.width/15);
    let s=Math.atan2(A[1]-B[1],A[0]-B[0]),e=Math.atan2(D[1]-B[1],D[0]-B[0]),delta=e-s;
    while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
    ctx.save();ctx.strokeStyle="rgba(245,158,11,.98)";ctx.fillStyle="rgba(245,158,11,.98)";ctx.lineWidth=Math.max(4,c.width/230);
    ctx.beginPath();ctx.arc(B[0],B[1],r,s,s+delta,delta<0);ctx.stroke();
    const m=s+delta/2,tx=B[0]+Math.cos(m)*(r+24),ty=B[1]+Math.sin(m)*(r+24);
    ctx.font="bold "+Math.max(17,Math.round(c.width/40))+"px -apple-system,sans-serif";
    ctx.strokeStyle="rgba(0,0,0,.75)";ctx.lineWidth=5;ctx.strokeText(label,tx,ty);ctx.fillStyle="#fff";ctx.fillText(label,tx,ty);ctx.restore()
  }
  const side=currentAnalysis.hitting_side,m=p.metrics;
  arc(side+"_shoulder",side+"_elbow",side+"_wrist",(m.elbow_3d.value??"—")+"° 3D");
  arc(side+"_hip",side+"_shoulder",side+"_elbow",(m.shoulder_3d.value??"—")+"°");
  arc("left_hip","left_knee","left_ankle",(m.left_knee_3d.value??"—")+"°");
  arc("right_hip","right_knee","right_ankle",(m.right_knee_3d.value??"—")+"°");
}

async function stepFrame(delta){
  if(!currentAnalysis)return;const v=$("#resultVideo");v.pause();
  const target=clamp(v.currentTime+delta,0,Math.max(0,(v.duration||0)-.001));
  await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;v.removeEventListener("seeked",finish);resolve()};v.addEventListener("seeked",finish);v.currentTime=target;setTimeout(finish,700)});
  currentAnalysis.precise=null;renderPrecise();
  const c=$("#poseCanvas");if(c){const ctx=c.getContext("2d");ctx&&ctx.clearRect(0,0,c.width,c.height)}
  $("#measurementMode").textContent=t("confirmContact")+" · "+v.currentTime.toFixed(3)+"s"
}
function jumpToAIFrame(){
  if(!currentAnalysis)return;const v=$("#resultVideo");v.pause();
  const f=()=>{v.removeEventListener("seeked",f);measureCurrentFrame()};v.addEventListener("seeked",f);
  v.currentTime=currentAnalysis.contact_time
}

function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("skillcam-local",3);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("sessions"))db.createObjectStore("sessions",{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putSession(s){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("sessions","readwrite");tx.objectStore("sessions").put(s);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function saveCurrentMeasurement(){
  if(!$("#saveProgress").checked||!currentAnalysis?.precise)return;
  if(!currentSessionId)currentSessionId=crypto.randomUUID();
  await putSession({id:currentSessionId,player_name:$("#playerName").value.trim()||"Player",analysis:currentAnalysis,created_at:new Date().toISOString()})
}
async function getSessions(){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction("sessions").objectStore("sessions").getAll();r.onsuccess=()=>resolve((r.result||[]).filter(x=>x.analysis?.version==="v7"&&x.analysis?.precise).sort((a,b)=>b.created_at.localeCompare(a.created_at)));r.onerror=()=>reject(r.error)})}

async function loadProgress(){
  const all=await getSessions();if(!all.length){$("#progressSummary").innerHTML="<p>"+t("noHistory")+"</p>";$("#historyList").innerHTML="";return}
  const latest=all[0];
  const prev=all.slice(1).find(s=>s.analysis.movement_type===latest.analysis.movement_type&&s.analysis.precise?.camera_view===latest.analysis.precise?.camera_view);
  let html="<h2>"+t("compare")+"</h2>";
  const keys=["elbow_3d","shoulder_3d","left_knee_3d","right_knee_3d","torso_tilt_3d"];
  if(!prev)html+="<p class='note'>"+t("needTwo")+"</p>";
  else html+="<div class='progress-grid'>"+keys.map(k=>{const a=latest.analysis.precise.metrics[k]?.value,b=prev.analysis.precise.metrics[k]?.value,d=a!=null&&b!=null?a-b:null;return"<div class='progress-box'><small>"+t("metric_"+k)+"</small><strong>"+(d==null?"—":(d>0?"+":"")+d.toFixed(1)+"°")+"</strong><small>"+(b??"—")+" → "+(a??"—")+"</small></div>"}).join("")+"</div>";
  $("#progressSummary").innerHTML=html;
  $("#historyList").innerHTML="<h2>"+t("history")+"</h2>"+all.slice(0,10).map(s=>"<div class='history-item'><div><b>"+s.player_name+"</b><div class='note'>"+new Date(s.created_at).toLocaleString()+"</div></div><div><span class='badge'>"+movementLabel(s.analysis.movement_type)+"</span><div class='note'>"+s.analysis.precise.camera_view+" · "+s.analysis.precise.time+"s</div></div></div>").join("")
}

function renderLearn(){
  const phases=[[1,"phase1","phase1d"],[2,"phase2","phase2d"],[3,"phase3","phase3d"],[4,"phase4","phase4d"],[5,"phase5","phase5d"],[6,"phase6","phase6d"],[7,"phase7","phase7d"]];
  $("#phaseGrid").innerHTML=phases.map(p=>"<div class='phase-card'><span>"+p[0]+"</span><h3>"+t(p[1])+"</h3><p>"+t(p[2])+"</p></div>").join("")
}
function applyLanguage(){
  document.documentElement.lang=lang;$("#languageSelect").value=lang;$$("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));renderLearn();
  if(currentAnalysis){renderResultTextOnly();renderPrecise()}
}
function renderResultTextOnly(){
  const a=currentAnalysis;if(!a)return;
  $("#movementBadge").textContent=movementLabel(a.movement_type);
  let s="<p>"+t("contactAt")+" <b>"+a.contact_time+" "+t("seconds")+"</b> · "+t("hittingSide")+": <b>"+t(a.hitting_side)+"</b></p>";
  if(a.contact_candidate_count>1)s+="<div class='status loading'>"+t("multiContact")+"</div>";$("#summaryText").innerHTML=s;
  $("#footworkText").innerHTML="<p>"+(a.movement_type==="standing"?t("standingFoot"):a.movement_type==="jump_like"?t("jumpFoot"):t("movingFoot"))+"</p>";
  $("#referenceState").innerHTML="<div class='reference-lock'><b>"+t("referencePending")+"</b><p>"+t("referenceNeed")+"</p></div>";
  $("#nextActions").innerHTML="<ol class='next-list'><li>"+t("next1")+"</li><li>"+t("next2")+"</li><li>"+t("next3")+"</li></ol>";$("#contactWarning").textContent=t("confirmContact")
}

$("#languageSelect").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("skillcam-language",lang);applyLanguage()});
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#startAnalyzeBtn").addEventListener("click",()=>setView("analyze"));
$("#progressBtn").addEventListener("click",()=>setView("progress"));
$("#contactBtn").addEventListener("click",jumpToAIFrame);
$("#prevFrameBtn").addEventListener("click",()=>stepFrame(-1/30));
$("#nextFrameBtn").addEventListener("click",()=>stepFrame(1/30));
$("#measureFrameBtn").addEventListener("click",measureCurrentFrame);
$("#overlayBtn").addEventListener("click",function(){overlayVisible=!overlayVisible;this.textContent=overlayVisible?t("hideOverlay"):t("showOverlay");drawOverlay()});
$("#retryBtn").addEventListener("click",()=>{$("#videoInput").value="";currentFile=null;currentAnalysis=null;currentSessionId=null;$("#analysisCard").classList.add("hidden");$("#videoPicker").classList.remove("selected");$("#fileMeta").textContent=t("fileHint");$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");hideStatus();setView("analyze")});
$("#videoInput").addEventListener("change",e=>{
  const f=e.target.files?.[0];currentFile=f||null;currentSessionId=null;
  if(!f){$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");return}
  const mb=(f.size/1024/1024).toFixed(1);$("#videoPicker").classList.add("selected");$("#fileMeta").textContent=f.name+" · "+mb+" MB · "+t("selected");
  $("#analyzeBtn").disabled=f.size>200*1024*1024;$("#analyzeBtnText").textContent=f.size>200*1024*1024?t("tooLarge"):t("analyzeBtn");
  if(f.size>200*1024*1024)showStatus(t("tooLarge"),"error");else hideStatus()
});
$("#analyzeBtn").addEventListener("click",async()=>{
  if(!currentFile){showStatus(t("chooseFirst"),"error");return}
  if(!$("#consentAnalysis").checked){showStatus(t("needConsent"),"error");return}
  const btn=$("#analyzeBtn");btn.disabled=true;$("#analyzeBtnText").textContent=t("analyzing");
  try{const a=await analyzeVideo(currentFile);currentAnalysis=a;renderResult(a)}
  catch(e){console.error(e);showStatus(t("analysisFail")+": "+(e.message||e),"error")}
  finally{btn.disabled=false;$("#analyzeBtnText").textContent=t("analyzeBtn")}
});

applyLanguage();renderLearn();
