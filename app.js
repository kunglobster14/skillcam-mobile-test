import { FilesetResolver, PoseLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let poseLandmarker = null;
let currentSessionId = null;

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
  video.src=url; video.muted=true; video.playsInline=true;
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error("เปิดวิดีโอไม่ได้"));});
  const duration=Math.min(video.duration,8);
  const frames=[];
  const fps=10;
  for (let t=0;t<=duration;t+=1/fps) {
    const target=Math.min(t, Math.max(0, duration-0.001));
    if (Math.abs(video.currentTime-target)>0.002) {
      video.currentTime=target;
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error("อ่านเฟรมวิดีโอช้าเกินไป")),5000);
        video.onseeked=()=>{clearTimeout(timer);resolve();};
      });
    }
    const result=pl.detectForVideo(video, Math.round(target*1000));
    const lm=result.landmarks?.[0];
    if (!lm) continue;
    const joints={};
    for (const [name,idx] of Object.entries(IDX)) {
      const p=lm[idx];
      if (p) joints[name]={x:p.x,y:p.y,visibility:p.visibility??0};
    }
    frames.push({time:t,joints});
  }
  URL.revokeObjectURL(url);
  return compute(frames);
}

function renderAnalysis(a) {
  $("#analysisCard").classList.remove("hidden");
  $("#analysisStatus").innerHTML =
    `<p><span class="pill ${a.status==="needs_rerecord"?"bad":"ok"}">${human(a.status)}</span>
    &nbsp; Confidence ${pct(a.overall_confidence)}</p>
    <p class="small">Hitting side: ${a.hitting_side} · inferred contact: ${a.contact_time}s</p>`;
  $("#metricsGrid").innerHTML=Object.entries(a.metrics).map(([k,m]) =>
    `<div class="metric"><div class="small">${human(k)}</div>
    <strong>${m.value==null?"Unavailable":m.value+" "+m.unit}</strong>
    <div class="small">Confidence ${pct(m.confidence)} · ${m.note}</div></div>`
  ).join("");
}

function renderCoachStatus(s) {
  $("#coachStatusCard").classList.remove("hidden");
  let html=`<p><span class="pill ${s.coach_status==="validated"?"ok":"warn"}">${human(s.coach_status)}</span></p>`;
  if (!s.coach_review) html += '<p class="small">รอโค้ชทำ Blind Review บน iPhone เครื่องนี้</p>';
  if (s.coach_review) {
    html += `<p><b>Coach issue:</b> ${human(s.coach_review.primary_issue)} · ${human(s.coach_review.severity)}</p>`;
    if (s.coach_review.notes) html += `<p>${s.coach_review.notes}</p>`;
  }
  if (s.comparison) {
    html += `<p><b>Coach vs System:</b> ${human(s.comparison.agreement)} · ${human(s.comparison.metric_accuracy)}</p>`;
  }
  $("#coachStatus").innerHTML=html;
}

$("#analyzeBtn").addEventListener("click", async () => {
  const file=$("#videoInput").files[0];
  if (!file) return showMessage($("#playerMessage"),"กรุณาเลือกคลิปก่อน","error");
  if (!$("#consentAnalysis").checked) return showMessage($("#playerMessage"),"ต้องยินยอมให้วิเคราะห์คลิปก่อน","error");
  if (file.size > 200*1024*1024) return showMessage($("#playerMessage"),"คลิปใหญ่เกิน 200 MB กรุณาตัดคลิปให้สั้นลงสำหรับการทดสอบบน Safari","error");

  const btn=$("#analyzeBtn"); btn.disabled=true;
  showMessage($("#playerMessage"),"กำลังโหลด Pose model และวิเคราะห์บน iPhone...");
  try {
    const analysis=await analyzeVideo(file);
    renderAnalysis(analysis);
    if (analysis.status==="needs_rerecord") {
      showMessage($("#playerMessage"),"Pose confidence ต่ำ กรุณาถ่ายใหม่ให้เห็นเต็มตัวและกล้องนิ่ง","error");
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
    showMessage($("#playerMessage"),`บันทึกใน iPhone แล้ว · Session ${id.slice(0,8)}`,"success");
  } catch (e) {
    showMessage($("#playerMessage"),`วิเคราะห์ไม่สำเร็จ: ${e.message || e}`,"error");
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
  $("#coachQueue").innerHTML = `<h2>Review Queue</h2>` +
    (sessions.length ? sessions.map(s =>
      `<div class="session"><b>${s.player_name}</b><br>
      <span class="small">${s.id.slice(0,8)} · ${human(s.coach_status)}</span>
      <button class="btn secondary" data-review="${s.id}">${s.coach_status==="pending"?"Blind Review":"Open"}</button></div>`
    ).join("") : '<p class="small">ยังไม่มี session</p>');
  $$("[data-review]").forEach(b=>b.addEventListener("click",()=>openReview(b.dataset.review)));
}

async function openReview(id) {
  const s=await getSession(id);
  if (!s) return;
  const panel=$("#coachPanel");
  const videoURL=URL.createObjectURL(s.video_blob);

  if (!s.coach_review) {
    panel.innerHTML=`<div class="card"><h2>Blind Review · ${id.slice(0,8)}</h2>
      <p><span class="pill warn">ผลระบบถูกซ่อน</span></p>
      <video controls src="${videoURL}"></video>
      <label>ชื่อโค้ช</label><input id="reviewer" placeholder="Coach">
      <label>ภาพรวม</label><select id="overall"><option>good</option><option>acceptable</option><option>needs_work</option></select>
      <label>ปัญหาหลัก</label><select id="primary">
        <option value="none">ไม่พบปัญหาหลัก</option><option value="late_contact">Contact ช้า</option>
        <option value="low_contact">Contact ต่ำ</option><option value="limited_rotation">หมุนลำตัว/ไหล่น้อย</option>
        <option value="elbow_position">ตำแหน่งศอก</option><option value="landing_balance">การลงพื้น/สมดุล</option>
        <option value="slow_recovery">Recovery ช้า</option><option value="other">อื่น ๆ</option>
      </select>
      <label>ปัญหารอง</label><input id="secondary">
      <label>ความรุนแรง</label><select id="severity"><option>low</option><option>medium</option><option>high</option></select>
      <label>หมายเหตุ</label><textarea id="notes" rows="4"></textarea>
      <button id="blindSubmit" class="btn">ล็อกคำตอบ แล้วเปิดผลระบบ</button></div>`;

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

  panel.innerHTML=`<div class="card"><h2>Compare Coach vs System</h2>
    <div class="grid">
      <div class="metric"><h3>Coach (locked first)</h3><p><b>${human(s.coach_review.primary_issue)}</b></p>
      <p>${human(s.coach_review.overall)} · ${human(s.coach_review.severity)}</p><p>${s.coach_review.notes || ""}</p></div>
      <div class="metric"><h3>System</h3><p><b>${human(s.analysis.primary_issue)}</b> · ${pct(s.analysis.overall_confidence)}</p></div>
    </div>
    <div class="grid" style="margin-top:10px">${metrics}</div>
    ${s.comparison ? `<div class="message success">Validated: ${human(s.comparison.agreement)} · ${human(s.comparison.metric_accuracy)}</div>` :
    `<label>ความเห็นตรงกัน</label><select id="agree"><option value="agree">Agree</option><option value="partial">Partially agree</option><option value="disagree">Disagree</option><option value="cannot_judge">Cannot judge</option></select>
    <label>ความแม่นของค่าตัวเลข</label><select id="metricAcc"><option value="acceptable">Acceptable</option><option value="some_off">Some values off</option><option value="unreliable">Unreliable</option><option value="not_checked">Not checked</option></select>
    <label>หมายเหตุ</label><textarea id="compareNotes" rows="3"></textarea>
    <button id="compareSubmit" class="btn">บันทึก Validation</button>`}</div>`;

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
    <div class="stat"><div class="small">Total clips</div><b>${sessions.length}</b></div>
    <div class="stat"><div class="small">Validated</div><b>${validated.length}</b></div>
    <div class="stat"><div class="small">Strict agreement</div><b>${validated.length?Math.round(agree/validated.length*100)+"%":"—"}</b></div>
    <div class="stat"><div class="small">Agree or partial</div><b>${validated.length?Math.round((agree+partial)/validated.length*100)+"%":"—"}</b></div>
  </div>
  <h2 style="margin-top:18px">Issue breakdown</h2>
  ${Object.keys(counts).length ? Object.entries(counts).map(([k,v])=>`<p>${human(k)}: <b>${v}</b></p>`).join("") : '<p class="small">ยังไม่มีข้อมูล validation</p>'}`;
}
