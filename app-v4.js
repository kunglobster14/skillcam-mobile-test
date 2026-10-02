import { FilesetResolver, PoseLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let poseLandmarker = null;
let currentSessionId = null;
let lastAnalysis = null;
let currentVideoFile = null;
let resultVideoURL = null;
let currentLang = localStorage.getItem("skillcam-language") || "th";

const I18N = {
  th: {
    menu:"เมนู", playerTab:"ผู้เล่น", coachTab:"โค้ช", validationTab:"ตรวจสอบความแม่นยำ",
    heroPill:"Badminton Smash · รุ่นทดสอบ", heroTitle:"วิเคราะห์ท่า Smash จากคลิปบน iPhone",
    heroBody:"ระบบจะวัดการเคลื่อนไหวจากคลิปก่อน แล้วให้โค้ชช่วยตรวจว่าค่าที่ระบบคำนวณตรงกับสิ่งที่เห็นจริงหรือไม่",
    step1:"1. เลือกคลิป", testerName:"ชื่อ/รหัสผู้ทดสอบ", smashVideo:"วิดีโอ Smash",
    videoHint:"ระบบวิเคราะห์ช่วงต้นสูงสุด 30 วินาที ถ้ามีหลาย Smash ในคลิปอาจเลือกจังหวะตีผิด แนะนำให้เหลือ 1 Smash ต่อคลิปเมื่อจะตรวจความแม่นยำจริง",
    consentAnalyze:"ยินยอมให้วิเคราะห์คลิปนี้", consentImprove:"ยินยอมให้เก็บ session นี้ไว้ใช้ปรับปรุง SkillCam ภายหลัง",
    analyzeButton:"วิเคราะห์ Smash", resultTitle:"ผลวิเคราะห์เบื้องต้น", simpleSummaryTitle:"สรุปให้อ่านง่าย",
    checkMomentTitle:"ตรวจว่าระบบเลือกจังหวะตีถูกหรือไม่", jumpContact:"ดูช่วงจังหวะตีที่ระบบเลือก",
    checkMomentHint:"ถ้าจังหวะที่ระบบเลือกไม่ใช่ Smash ที่ต้องการ ค่าอื่น ๆ อาจไม่น่าเชื่อถือ ให้ใช้คลิปที่มีเพียง 1 Smash แล้ววิเคราะห์ใหม่",
    technicalDetails:"ดูค่ารายละเอียด", measurementDisclaimer:"ค่าชุดนี้เป็นการวัดแบบ 2D/proxy สำหรับตรวจสอบความแม่นยำ ยังไม่ใช่คำตัดสินว่าท่าถูกหรือผิด",
    nextTitle:"ต้องทำอะไรต่อ", goCoach:"ไปให้โค้ชตรวจ", coachValidationTitle:"สถานะการตรวจของโค้ช",
    refreshCoach:"รีเฟรชผลโค้ช", blindReviewPill:"ตรวจแบบไม่เห็นผลระบบก่อน", coachPortalTitle:"หน้าสำหรับโค้ช",
    coachPortalBody:"โค้ชดูคลิปและให้ความเห็นก่อน จากนั้นระบบจึงเปิดผลการคำนวณให้เปรียบเทียบ",
    validationPill:"Validation", validationTitle:"ระบบตรงกับโค้ชแค่ไหน",
    selectClip:"กรุณาเลือกคลิปก่อน", consentNeeded:"ต้องยินยอมให้วิเคราะห์คลิปก่อน",
    overSize:"คลิปใหญ่เกิน 200 MB กรุณาตัดคลิปให้สั้นลงสำหรับการทดสอบบน Safari",
    analyzing:"กำลังวิเคราะห์การเคลื่อนไหวบน iPhone...", poseLow:"ความชัดของการตรวจจับท่าต่ำ กรุณาถ่ายใหม่ให้เห็นเต็มตัวและกล้องนิ่ง",
    analysisFailed:"วิเคราะห์ไม่สำเร็จ", saved:"บันทึกใน iPhone แล้ว", systemSuccess:"ระบบวิเคราะห์คลิปสำเร็จ",
    systemRetry:"ระบบยังอ่านท่าทางได้ไม่ชัดพอ", right:"ขวา", left:"ซ้าย",
    confidenceGood:"ระบบมองเห็นร่างกายค่อนข้างชัด", confidenceMedium:"ระบบมองเห็นร่างกายได้พอใช้", confidenceLow:"ระบบมองเห็นร่างกายไม่ชัดพอ",
    inferredContact:"ระบบคาดว่าจังหวะตีอยู่ที่", seconds:"วินาที", hittingSide:"ข้างที่ใช้ตี",
    elbowObs:"แขนข้างตีเหยียดประมาณ", shoulderObs:"แนวไหล่เอียงประมาณ", kneeObs:"ช่วงงอเข่าลึกสุดประมาณ",
    torsoObs:"ลำตัวเอียงประมาณ", recoveryObs:"ระบบประมาณเวลาฟื้นกลับหลังจังหวะตี", notAvailable:"ยังวัดไม่ได้",
    stepCheck:"ตรวจในวิดีโอว่าจังหวะที่ระบบเลือกตรงกับ Smash ที่ต้องการหรือไม่",
    stepOneSmash:"ถ้าคลิปมีหลาย Smash หรือเลือกจังหวะผิด ให้ใช้คลิปที่มีเพียง 1 Smash แล้ววิเคราะห์ใหม่",
    stepCoach:"ถ้าจังหวะถูกต้อง ให้ไปหน้าโค้ชเพื่อทำ Blind Review แล้วค่อยเปรียบเทียบกับผลระบบ",
    pendingCoach:"รอโค้ชตรวจ", blindDone:"โค้ชตรวจเบื้องต้นแล้ว", validated:"ตรวจเทียบเสร็จแล้ว",
    samePhone:"รุ่นทดสอบนี้เก็บข้อมูลใน iPhone เครื่องนี้ ดังนั้นโค้ชต้องเปิดหน้า Coach บนเครื่องเดียวกัน",
    reviewQueue:"รายการรอตรวจ", noSessions:"ยังไม่มี session", blindReview:"Blind Review", open:"เปิด",
    hiddenSystem:"ผลระบบถูกซ่อนไว้", reviewer:"ชื่อโค้ช", overall:"ภาพรวม", primaryIssue:"ปัญหาหลัก",
    secondaryIssue:"ปัญหารอง", severity:"ระดับ", notes:"หมายเหตุ", lockReveal:"ล็อกคำตอบ แล้วเปิดผลระบบ",
    compareTitle:"เปรียบเทียบโค้ชกับระบบ", coachLocked:"คำตอบโค้ช (ล็อกแล้ว)", system:"ระบบ",
    agreement:"ความเห็นตรงกันแค่ไหน", metricAccuracy:"ความแม่นของค่าตัวเลข", saveValidation:"บันทึก Validation",
    totalClips:"คลิปทั้งหมด", validatedCount:"ตรวจแล้ว", strictAgreement:"ตรงกันทั้งหมด", softAgreement:"ตรงกันหรือใกล้เคียง",
    issueBreakdown:"ปัญหาที่โค้ชพบ", noValidation:"ยังไม่มีข้อมูล validation",
    metric_elbow_extension:"การเหยียดศอก", metric_shoulder_line_angle:"มุมแนวไหล่", metric_deepest_knee_angle:"มุมเข่าที่งอลึกสุด",
    metric_torso_lean:"การเอียงลำตัว", metric_recovery_time_proxy:"เวลาฟื้นกลับโดยประมาณ",
    note_elbow_extension:"ณ จังหวะตีที่ระบบคาดไว้", note_shoulder_line_angle:"ค่าประมาณแบบ 2D ขึ้นกับมุมกล้อง",
    note_deepest_knee_angle:"ช่วงเตรียม/ลงน้ำหนัก", note_torso_lean:"ค่าประมาณแบบ 2D ณ จังหวะตี",
    note_recovery_time_proxy:"ค่าประมาณจากการเคลื่อนไหวหลังตี"
  },
  en: {
    menu:"Menu", playerTab:"Player", coachTab:"Coach", validationTab:"Validation",
    heroPill:"Badminton Smash · Prototype", heroTitle:"Analyze a Smash video on iPhone",
    heroBody:"The system measures motion first, then a coach checks whether the measurements match what is actually visible.",
    step1:"1. Choose a clip", testerName:"Tester name / ID", smashVideo:"Smash video",
    videoHint:"The prototype analyzes up to the first 30 seconds. If the clip contains multiple smashes it may choose the wrong contact moment; use one smash per clip for accuracy validation.",
    consentAnalyze:"I consent to analysis of this clip", consentImprove:"I allow this session to be retained for future SkillCam improvement",
    analyzeButton:"Analyze Smash", resultTitle:"Preliminary analysis", simpleSummaryTitle:"Plain-language summary",
    checkMomentTitle:"Check whether the selected contact moment is correct", jumpContact:"View the contact moment selected by the system",
    checkMomentHint:"If the selected moment is not the smash you want, the other metrics may not be reliable. Use a clip with one smash and analyze again.",
    technicalDetails:"Show technical measurements", measurementDisclaimer:"These are 2D measurements/proxies for validation. They do not yet say whether technique is correct or incorrect.",
    nextTitle:"What to do next", goCoach:"Continue to Coach Review", coachValidationTitle:"Coach validation status",
    refreshCoach:"Refresh coach result", blindReviewPill:"Blind review before system reveal", coachPortalTitle:"Coach Portal",
    coachPortalBody:"The coach reviews the video independently first. The system result is revealed only afterward for comparison.",
    validationPill:"Validation", validationTitle:"How closely does the system match the coach?",
    selectClip:"Please choose a clip first", consentNeeded:"Analysis consent is required",
    overSize:"The clip is over 200 MB. Please shorten it for this Safari prototype.",
    analyzing:"Analyzing movement on your iPhone...", poseLow:"Pose confidence is too low. Re-record with the full body visible and a stable camera.",
    analysisFailed:"Analysis failed", saved:"Saved on this iPhone", systemSuccess:"Video analysis completed",
    systemRetry:"The system could not see the pose clearly enough", right:"right", left:"left",
    confidenceGood:"The body pose was detected fairly clearly", confidenceMedium:"The body pose was detected with moderate clarity", confidenceLow:"The body pose was not clear enough",
    inferredContact:"The system inferred contact at", seconds:"seconds", hittingSide:"Hitting side",
    elbowObs:"Hitting-arm elbow extension was about", shoulderObs:"Shoulder-line angle was about", kneeObs:"Deepest knee angle was about",
    torsoObs:"Torso lean was about", recoveryObs:"Estimated recovery time after contact was", notAvailable:"Not available",
    stepCheck:"Check the video to confirm that the selected moment is the intended smash",
    stepOneSmash:"If the clip contains several smashes or the selected moment is wrong, use a one-smash clip and analyze again",
    stepCoach:"If the selected moment is correct, continue to Coach Blind Review and then compare the coach with the system",
    pendingCoach:"Waiting for coach", blindDone:"Coach blind review completed", validated:"Comparison completed",
    samePhone:"This prototype stores data locally on this iPhone, so the coach must use the Coach tab on the same device.",
    reviewQueue:"Review Queue", noSessions:"No sessions yet", blindReview:"Blind Review", open:"Open",
    hiddenSystem:"System result is hidden", reviewer:"Coach name", overall:"Overall", primaryIssue:"Primary issue",
    secondaryIssue:"Secondary issue", severity:"Severity", notes:"Notes", lockReveal:"Lock coach answer and reveal system result",
    compareTitle:"Compare Coach vs System", coachLocked:"Coach answer (locked first)", system:"System",
    agreement:"How closely do they agree?", metricAccuracy:"Numerical metric accuracy", saveValidation:"Save validation",
    totalClips:"Total clips", validatedCount:"Validated", strictAgreement:"Strict agreement", softAgreement:"Agree or partial",
    issueBreakdown:"Coach issue breakdown", noValidation:"No validation data yet",
    metric_elbow_extension:"Elbow extension", metric_shoulder_line_angle:"Shoulder line angle", metric_deepest_knee_angle:"Deepest knee angle",
    metric_torso_lean:"Torso lean", metric_recovery_time_proxy:"Recovery time proxy",
    note_elbow_extension:"At inferred contact", note_shoulder_line_angle:"2D proxy; camera-angle dependent",
    note_deepest_knee_angle:"Load/preparation phase", note_torso_lean:"2D proxy at inferred contact",
    note_recovery_time_proxy:"Heuristic estimate from post-contact motion"
  }
};

function t(key) { return I18N[currentLang]?.[key] ?? I18N.en[key] ?? key; }
function metricLabel(key) { return t("metric_"+key); }
function metricNote(key) { return t("note_"+key); }

function applyLanguage() {
  document.documentElement.lang = currentLang;
  $("#languageSelect").value = currentLang;
  $("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  if (lastAnalysis) renderAnalysis(lastAnalysis);
  if (currentSessionId) getSession(currentSessionId).then(s => s && renderCoachStatus(s));
  if (!$("#coachView").classList.contains("hidden")) loadCoachQueue();
  if (!$("#dashboardView").classList.contains("hidden")) loadDashboard();
}

$("#languageSelect").addEventListener("change", e => {
  currentLang = e.target.value;
  localStorage.setItem("skillcam-language", currentLang);
  applyLanguage();
});

function showMessage(el, text, kind = "") {
  el.innerHTML = `<div class="message ${kind}">${text}</div>`;
}
function human(s = "") {
  return String(s).replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}
function pct(v) {
  return `${Math.round((v || 0) * 100)}%`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("skillcam-local", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveSession(session) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function getSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("sessions").objectStore("sessions").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function getAllSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("sessions").objectStore("sessions").getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a,b) => b.created_at.localeCompare(a.created_at)));
    req.onerror = () => reject(req.error);
  });
}

function setView(name) {
  ["player","coach","dashboard"].forEach(n => {
    $(`#${n}View`).classList.toggle("hidden", n !== name);
  });
  $$("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "coach") loadCoachQueue();
  if (name === "dashboard") loadDashboard();
}
$$("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
$("#menuBtn").addEventListener("click", () => $("#nav").scrollIntoView({behavior:"smooth"}));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

async function initPose() {
  if (poseLandmarker) return poseLandmarker;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.45,
    minPosePresenceConfidence: 0.45,
    minTrackingConfidence: 0.45
  });
  return poseLandmarker;
}

const IDX = {
  left_shoulder:11,right_shoulder:12,left_elbow:13,right_elbow:14,left_wrist:15,right_wrist:16,
  left_hip:23,right_hip:24,left_knee:25,right_knee:26,left_ankle:27,right_ankle:28
};
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const mid = (a,b) => ({x:(a.x+b.x)/2, y:(a.y+b.y)/2});

function angle(a,b,c) {
  const u={x:a.x-b.x,y:a.y-b.y}, v={x:c.x-b.x,y:c.y-b.y};
  const d=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);
  if (!d) return null;
  const cos=Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/d));
  return Math.acos(cos)*180/Math.PI;
}
function lineAngle(a,b) {
  return Math.abs(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI);
}
function frameConf(j,names) {
  const xs=names.map(n=>j[n]?.visibility ?? 0);
  return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
}

function compute(frames) {
  if (frames.length < 3) throw new Error("ตรวจพบ pose ไม่เพียงพอ กรุณาถ่ายใหม่");

  const side = ["left","right"].map(s => ({
    s,
    y: Math.min(...frames.map(f => f.joints[`${s}_wrist`]?.y ?? 9))
  })).sort((a,b)=>a.y-b.y)[0].s;

  const candidates = frames.map((f,i) => {
    const w=f.joints[`${side}_wrist`], sh=f.joints[`${side}_shoulder`];
    if (!w || !sh) return null;
    return {i, score:w.y - 0.25*dist(w,sh)};
  }).filter(Boolean).sort((a,b)=>a.score-b.score);
  if (!candidates.length) throw new Error("ตรวจข้อมือและไหล่ไม่ได้ กรุณาถ่ายใหม่");

  const ci=candidates[0].i, f=frames[ci], j=f.joints;
  const en=[`${side}_shoulder`,`${side}_elbow`,`${side}_wrist`];
  const econf=frameConf(j,en);
  const elbow=econf>=0.45 ? angle(j[en[0]],j[en[1]],j[en[2]]) : null;

  const shconf=frameConf(j,["left_shoulder","right_shoulder"]);
  const shoulder=shconf>=0.45 ? lineAngle(j.left_shoulder,j.right_shoulder) : null;

  let knee=null, kconf=0;
  for (const fr of frames.slice(0,ci+1)) {
    for (const s of ["left","right"]) {
      const ns=[`${s}_hip`,`${s}_knee`,`${s}_ankle`];
      const c=frameConf(fr.joints,ns);
      if (c>=0.45) {
        const v=angle(fr.joints[ns[0]],fr.joints[ns[1]],fr.joints[ns[2]]);
        if (v!=null && (knee==null || v<knee)) { knee=v; kconf=c; }
      }
    }
  }

  const tconf=frameConf(j,["left_shoulder","right_shoulder","left_hip","right_hip"]);
  let torso=null;
  if (tconf>=0.45) {
    const sm=mid(j.left_shoulder,j.right_shoulder), hm=mid(j.left_hip,j.right_hip);
    torso=Math.abs(Math.atan2(sm.x-hm.x, -(sm.y-hm.y))*180/Math.PI);
  }

  let recovery=null, rconf=0;
  for (const fr of frames.slice(ci+1)) {
    const c=frameConf(fr.joints,["left_ankle","right_ankle","left_hip","right_hip"]);
    if (c<0.5) continue;
    const hm=mid(fr.joints.left_hip,fr.joints.right_hip);
    const ld=Math.abs(fr.joints.left_ankle.x-hm.x), rd=Math.abs(fr.joints.right_ankle.x-hm.x);
    const span=Math.max(dist(fr.joints.left_hip,fr.joints.right_hip),1e-5);
    if (Math.abs(ld-rd)/span < 0.8) {
      recovery=fr.time-f.time; rconf=c; break;
    }
  }

  const metrics={
    elbow_extension:{value:elbow==null?null:+elbow.toFixed(1),unit:"deg",confidence:+econf.toFixed(2),note:"At inferred contact"},
    shoulder_line_angle:{value:shoulder==null?null:+shoulder.toFixed(1),unit:"deg",confidence:+shconf.toFixed(2),note:"2D camera-dependent proxy"},
    deepest_knee_angle:{value:knee==null?null:+knee.toFixed(1),unit:"deg",confidence:+kconf.toFixed(2),note:"Load phase"},
    torso_lean:{value:torso==null?null:+torso.toFixed(1),unit:"deg",confidence:+tconf.toFixed(2),note:"2D proxy at inferred contact"},
    recovery_time_proxy:{value:recovery==null?null:+recovery.toFixed(2),unit:"s",confidence:+rconf.toFixed(2),note:"Heuristic proxy"}
  };
  const confs=Object.values(metrics).filter(m=>m.value!=null).map(m=>m.confidence);
  const overall=confs.length ? confs.reduce((a,b)=>a+b,0)/confs.length : 0;
  const flags=[];
  if (elbow!=null && elbow<145) flags.push("limited_elbow_extension_at_contact");
  if (recovery!=null && recovery>1.5) flags.push("slow_recovery_proxy");
  if (overall<0.55) flags.push("low_landmark_confidence");

  return {
    hitting_side:side,
    contact_frame:ci,
    contact_time:+f.time.toFixed(2),
    metrics,
    overall_confidence:+overall.toFixed(3),
    primary_issue:flags[0] || "none",
    flags,
    status:overall<0.55 ? "needs_rerecord" : "prototype_result"
  };
}

async function analyzeVideo(file) {
  const pl=await initPose();
  const url=URL.createObjectURL(file);
  const video=document.createElement("video");
  video.src=url;
  video.muted=true;
  video.playsInline=true;
  video.preload="auto";

  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("โหลดข้อมูลวิดีโอช้าเกินไป")),15000);
    video.onloadedmetadata=()=>{clearTimeout(timer);resolve();};
    video.onerror=()=>{clearTimeout(timer);reject(new Error("เปิดวิดีโอไม่ได้"));};
  });

  const duration=Math.min(video.duration,30);
  const frames=[];
  const sampleEvery=0.20; // ~5 fps: stable enough for prototype and much lighter on iPhone
  let lastSample=-999;
  let finished=false;

  const captureFrame=(mediaTime)=>{
    if (mediaTime-lastSample < sampleEvery-0.02) return;
    lastSample=mediaTime;
    const result=pl.detectForVideo(video, Math.round(mediaTime*1000));
    const lm=result.landmarks?.[0];
    if (!lm) return;
    const joints={};
    for (const [name,idx] of Object.entries(IDX)) {
      const p=lm[idx];
      if (p) joints[name]={x:p.x,y:p.y,visibility:p.visibility??0};
    }
    frames.push({time:mediaTime,joints});
  };

  await new Promise(async (resolve,reject)=>{
    const timeout=setTimeout(()=>{
      if (!finished) {
        try { video.pause(); } catch {}
        reject(new Error("การอ่านวิดีโอใช้เวลานานเกินไป"));
      }
    }, Math.max(45000, duration*5000));

    const finish=()=>{
      if (finished) return;
      finished=true;
      clearTimeout(timeout);
      try { video.pause(); } catch {}
      resolve();
    };

    try {
      video.currentTime=0;
      video.playbackRate=2.0;

      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        const onFrame=(_,meta)=>{
          if (finished) return;
          const t=Math.min(meta.mediaTime ?? video.currentTime,duration);
          try { captureFrame(t); } catch (e) {
            clearTimeout(timeout);
            reject(e);
            return;
          }
          if (video.currentTime >= duration || video.ended) {
            finish();
            return;
          }
          video.requestVideoFrameCallback(onFrame);
        };
        video.requestVideoFrameCallback(onFrame);
      } else {
        const loop=()=>{
          if (finished) return;
          try { captureFrame(Math.min(video.currentTime,duration)); } catch (e) {
            clearTimeout(timeout);
            reject(e);
            return;
          }
          if (video.currentTime >= duration || video.ended) {
            finish();
            return;
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }

      video.onended=finish;
      await video.play();
    } catch (e) {
      clearTimeout(timeout);
      reject(new Error("Safari ไม่สามารถเล่นวิดีโอเพื่อวิเคราะห์ได้"));
    }
  });

  URL.revokeObjectURL(url);
  if (frames.length < 3) throw new Error(currentLang==="th" ? "ตรวจพบ pose ไม่เพียงพอ กรุณาถ่ายใหม่ให้เห็นร่างกายเต็มตัว" : "Not enough pose frames. Re-record with the full body visible.");
  const analysis=compute(frames);
  analysis.video_duration=video.duration;
  analysis.analyzed_duration=duration;
  analysis.frame_count=frames.length;
  return analysis;
}

function renderAnalysis(a) {
  lastAnalysis=a;
  $("#analysisCard").classList.remove("hidden");

  const statusText=a.status==="needs_rerecord" ? t("systemRetry") : t("systemSuccess");
  $("#analysisStatus").innerHTML =
    `<p><span class="pill ${a.status==="needs_rerecord"?"bad":"ok"}">${statusText}</span>
    &nbsp; Confidence ${pct(a.overall_confidence)}</p>`;

  const clarity=a.overall_confidence>=0.8?t("confidenceGood"):a.overall_confidence>=0.6?t("confidenceMedium"):t("confidenceLow");
  const side=t(a.hitting_side==="right"?"right":"left");
  const m=a.metrics;

  const observations=[];
  if(m.elbow_extension?.value!=null) observations.push(`${t("elbowObs")} <b>${m.elbow_extension.value}°</b>`);
  if(m.shoulder_line_angle?.value!=null) observations.push(`${t("shoulderObs")} <b>${m.shoulder_line_angle.value}°</b>`);
  if(m.deepest_knee_angle?.value!=null) observations.push(`${t("kneeObs")} <b>${m.deepest_knee_angle.value}°</b>`);
  if(m.torso_lean?.value!=null) observations.push(`${t("torsoObs")} <b>${m.torso_lean.value}°</b>`);
  if(m.recovery_time_proxy?.value!=null) observations.push(`${t("recoveryObs")} <b>${m.recovery_time_proxy.value} s</b>`);

  $("#simpleSummary").innerHTML=
    `<p><b>${clarity}</b> (${pct(a.overall_confidence)}).</p>
     <p>${t("inferredContact")} <b>${a.contact_time} ${t("seconds")}</b> · ${t("hittingSide")}: <b>${side}</b>.</p>
     <ul class="summary-list">${observations.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  $("#metricsGrid").innerHTML=Object.entries(a.metrics).map(([k,mv]) =>
    `<div class="metric"><div class="small">${metricLabel(k)}</div>
    <strong>${mv.value==null?t("notAvailable"):mv.value+" "+mv.unit}</strong>
    <div class="small">Confidence ${pct(mv.confidence)} · ${metricNote(k)}</div></div>`
  ).join("");

  $("#nextStepsList").innerHTML=
    `<li>${t("stepCheck")}</li><li>${t("stepOneSmash")}</li><li>${t("stepCoach")}</li>`;

  if (currentVideoFile) {
    $("#contactReview").classList.remove("hidden");
    if (resultVideoURL) URL.revokeObjectURL(resultVideoURL);
    resultVideoURL=URL.createObjectURL(currentVideoFile);
    $("#resultVideo").src=resultVideoURL;
    $("#jumpContactBtn").onclick=()=>{
      const v=$("#resultVideo");
      v.currentTime=Math.max(0,a.contact_time-1);
      v.play().catch(()=>{});
    };
  }
}

function renderCoachStatus(s) {
  $("#coachStatusCard").classList.remove("hidden");
  const state=s.coach_status==="validated"?t("validated"):s.coach_status==="blind_done"?t("blindDone"):t("pendingCoach");
  let html=`<p><span class="pill ${s.coach_status==="validated"?"ok":"warn"}">${state}</span></p>`;
  if (!s.coach_review) html += `<p class="small">${t("samePhone")}</p>`;
  if (s.coach_review) {
    html += `<p><b>${t("primaryIssue")}:</b> ${human(s.coach_review.primary_issue)} · ${human(s.coach_review.severity)}</p>`;
    if (s.coach_review.notes) html += `<p>${s.coach_review.notes}</p>`;
  }
  if (s.comparison) {
    html += `<p><b>Coach vs System:</b> ${human(s.comparison.agreement)} · ${human(s.comparison.metric_accuracy)}</p>`;
  }
  $("#coachStatus").innerHTML=html;
}

$("#analyzeBtn").addEventListener("click", async () => {
  const file=$("#videoInput").files[0];
  if (!file) return showMessage($("#playerMessage"),t("selectClip"),"error");
  if (!$("#consentAnalysis").checked) return showMessage($("#playerMessage"),t("consentNeeded"),"error");
  if (file.size > 200*1024*1024) return showMessage($("#playerMessage"),t("overSize"),"error");

  currentVideoFile=file;
  const btn=$("#analyzeBtn"); btn.disabled=true;
  showMessage($("#playerMessage"),t("analyzing"));
  try {
    const analysis=await analyzeVideo(file);
    renderAnalysis(analysis);
    if (analysis.status==="needs_rerecord") {
      showMessage($("#playerMessage"),t("poseLow"),"error");
      return;
    }
    const id=crypto.randomUUID();
    const session={
      id,
      player_name:$("#playerName").value.trim() || "Player",
      consent_improve:$("#consentImprove").checked,
      analysis,
      video_blob:file,
      video_type:file.type || "video/mp4",
      coach_status:"pending",
      coach_review:null,
      comparison:null,
      created_at:new Date().toISOString()
    };
    await saveSession(session);
    currentSessionId=id;
    renderCoachStatus(session);
    showMessage($("#playerMessage"),`${t("saved")} · Session ${id.slice(0,8)}`,"success");
  } catch (e) {
    showMessage($("#playerMessage"),`${t("analysisFailed")}: ${e.message || e}`,"error");
  } finally {
    btn.disabled=false;
  }
});

$("#refreshBtn").addEventListener("click", async () => {
  if (!currentSessionId) return;
  const s=await getSession(currentSessionId);
  if (s) renderCoachStatus(s);
});

async function loadCoachQueue() {
  const sessions=await getAllSessions();
  $("#coachQueue").innerHTML = `<h2>${t("reviewQueue")}</h2>` +
    (sessions.length ? sessions.map(s => {
      const state=s.coach_status==="validated"?t("validated"):s.coach_status==="blind_done"?t("blindDone"):t("pendingCoach");
      return `<div class="session"><b>${s.player_name}</b><br>
      <span class="small">${s.id.slice(0,8)} · ${state}</span>
      <button class="btn secondary" data-review="${s.id}">${s.coach_status==="pending"?t("blindReview"):t("open")}</button></div>`;
    }).join("") : `<p class="small">${t("noSessions")}</p>`);
  $$("[data-review]").forEach(b=>b.addEventListener("click",()=>openReview(b.dataset.review)));
}

async function openReview(id) {
  const s=await getSession(id);
  if (!s) return;
  const panel=$("#coachPanel");
  const videoURL=URL.createObjectURL(s.video_blob);

  if (!s.coach_review) {
    panel.innerHTML=`<div class="card"><h2>${t("blindReview")} · ${id.slice(0,8)}</h2>
      <p><span class="pill warn">${t("hiddenSystem")}</span></p>
      <video controls src="${videoURL}"></video>
      <label>${t("reviewer")}</label><input id="reviewer" placeholder="Coach">
      <label>${t("overall")}</label><select id="overall"><option>good</option><option>acceptable</option><option>needs_work</option></select>
      <label>${t("primaryIssue")}</label><select id="primary">
        <option value="none">ไม่พบปัญหาหลัก</option><option value="late_contact">Contact ช้า</option>
        <option value="low_contact">Contact ต่ำ</option><option value="limited_rotation">หมุนลำตัว/ไหล่น้อย</option>
        <option value="elbow_position">ตำแหน่งศอก</option><option value="landing_balance">การลงพื้น/สมดุล</option>
        <option value="slow_recovery">Recovery ช้า</option><option value="other">อื่น ๆ</option>
      </select>
      <label>${t("secondaryIssue")}</label><input id="secondary">
      <label>${t("severity")}</label><select id="severity"><option>low</option><option>medium</option><option>high</option></select>
      <label>${t("notes")}</label><textarea id="notes" rows="4"></textarea>
      <button id="blindSubmit" class="btn">${t("lockReveal")}</button></div>`;

    $("#blindSubmit").addEventListener("click",async()=>{
      s.coach_review={
        reviewer:$("#reviewer").value.trim() || "Coach",
        overall:$("#overall").value,
        primary_issue:$("#primary").value,
        secondary_issue:$("#secondary").value,
        severity:$("#severity").value,
        notes:$("#notes").value,
        created_at:new Date().toISOString()
      };
      s.coach_status="blind_done";
      await saveSession(s);
      URL.revokeObjectURL(videoURL);
      openReview(id);
      loadCoachQueue();
    });
    return;
  }

  const metrics=Object.entries(s.analysis.metrics).map(([k,m]) =>
    `<div class="metric"><div class="small">${human(k)}</div><strong>${m.value==null?"Unavailable":m.value+" "+m.unit}</strong>
    <div class="small">Confidence ${pct(m.confidence)}</div></div>`
  ).join("");

  panel.innerHTML=`<div class="card"><h2>${t("compareTitle")}</h2>
    <div class="grid">
      <div class="metric"><h3>${t("coachLocked")}</h3><p><b>${human(s.coach_review.primary_issue)}</b></p>
      <p>${human(s.coach_review.overall)} · ${human(s.coach_review.severity)}</p><p>${s.coach_review.notes || ""}</p></div>
      <div class="metric"><h3>${t("system")}</h3><p><b>${human(s.analysis.primary_issue)}</b> · ${pct(s.analysis.overall_confidence)}</p></div>
    </div>
    <div class="grid" style="margin-top:10px">${metrics}</div>
    ${s.comparison ? `<div class="message success">Validated: ${human(s.comparison.agreement)} · ${human(s.comparison.metric_accuracy)}</div>` :
    `<label>${t("agreement")}</label><select id="agree"><option value="agree">Agree</option><option value="partial">Partially agree</option><option value="disagree">Disagree</option><option value="cannot_judge">Cannot judge</option></select>
    <label>${t("metricAccuracy")}</label><select id="metricAcc"><option value="acceptable">Acceptable</option><option value="some_off">Some values off</option><option value="unreliable">Unreliable</option><option value="not_checked">Not checked</option></select>
    <label>${t("notes")}</label><textarea id="compareNotes" rows="3"></textarea>
    <button id="compareSubmit" class="btn">${t("saveValidation")}</button>`}</div>`;

  if (!s.comparison) {
    $("#compareSubmit").addEventListener("click",async()=>{
      s.comparison={
        agreement:$("#agree").value,
        metric_accuracy:$("#metricAcc").value,
        comments:$("#compareNotes").value,
        created_at:new Date().toISOString()
      };
      s.coach_status="validated";
      await saveSession(s);
      openReview(id);
      loadCoachQueue();
    });
  }
  URL.revokeObjectURL(videoURL);
}

async function loadDashboard() {
  const sessions=await getAllSessions();
  const validated=sessions.filter(s=>s.comparison);
  const agree=validated.filter(s=>s.comparison.agreement==="agree").length;
  const partial=validated.filter(s=>s.comparison.agreement==="partial").length;
  const counts={};
  for (const s of validated) {
    const k=s.coach_review?.primary_issue || "unknown";
    counts[k]=(counts[k]||0)+1;
  }
  $("#dashboard").innerHTML=`<div class="grid">
    <div class="stat"><div class="small">${t("totalClips")}</div><b>${sessions.length}</b></div>
    <div class="stat"><div class="small">${t("validatedCount")}</div><b>${validated.length}</b></div>
    <div class="stat"><div class="small">${t("strictAgreement")}</div><b>${validated.length?Math.round(agree/validated.length*100)+"%":"—"}</b></div>
    <div class="stat"><div class="small">${t("softAgreement")}</div><b>${validated.length?Math.round((agree+partial)/validated.length*100)+"%":"—"}</b></div>
  </div>
  <h2 style="margin-top:18px">${t("issueBreakdown")}</h2>
  ${Object.keys(counts).length ? Object.entries(counts).map(([k,v])=>`<p>${human(k)}: <b>${v}</b></p>`).join("") : `<p class="small">${t("noValidation")}</p>`}`;
}

$("#goCoachBtn").addEventListener("click",()=>setView("coach"));
applyLanguage();
