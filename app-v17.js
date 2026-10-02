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
let currentActionIndex=0;
let trackedPlayerCenter=null;
let playerSeed=null;
let selectorBaseCanvas=null;
let selectorVideoURL=null;
let actionSnapshots=new Map();
let courtCalPoints=[];
let courtHomography=null;
let courtInverseHomography=null;
let courtCalActive=false;
let courtPointerHandled=false;
let analysisFrames=[];
let selectedFrameIndex=0;
let segmentLoop=true;
let segmentStart=0;
let segmentEnd=0;
let replayFrames=[];
let replayIndex=0;
let replayTimer=null;
let replayPlaying=false;
let replaySpeed=.35;

const IDX={
  nose:0,left_shoulder:11,right_shoulder:12,left_elbow:13,right_elbow:14,left_wrist:15,right_wrist:16,
  left_hip:23,right_hip:24,left_knee:25,right_knee:26,left_ankle:27,right_ankle:28,
  left_heel:29,right_heel:30,left_foot:31,right_foot:32
};

const T={
th:{
brandSub:"AI Visual Coach · Dynamic Tracking",learnTab:"เรียน",analyzeTab:"วิเคราะห์",progressTab:"พัฒนาการ",
heroEyebrow:"Accuracy Mode",heroTitle:"วัดท่า Smash จากเฟรมจริง แล้วค่อยเปรียบเทียบกับท่าอ้างอิง",
heroText:"AI จะหาเฟรมที่น่าจะเป็นจังหวะตีให้ก่อน จากนั้นใช้โมเดลละเอียดวัดองศา 3D โดยประมาณบนเฟรมที่คุณยืนยัน",
how1:"เลือกคลิป",how1s:"1 Smash ต่อคลิปดีที่สุด",how2:"AI หาเฟรม",how2s:"ค้นหาช่วงตีแบบเร็ว",how3:"ยืนยันและวัด",how3s:"ขยับเฟรม + Full model",how4:"เทียบ Reference",how4s:"ให้คะแนนเมื่อมีข้อมูลโค้ช",
chooseTitle:"เลือกคลิป Smash",chooseHelp:"เพื่อความแม่น: เห็นเต็มตัว เท้าไม่ถูกบัง กล้องนิ่ง และมี 1 Smash ต่อคลิป",tester:"ชื่อ/รหัสผู้ทดสอบ",pickVideo:"แตะเพื่อเลือกวิดีโอ",fileHint:"สูงสุด 200 MB · วิเคราะห์ช่วงต้นสูงสุด 30 วินาที",
cameraView:"มุมกล้อง",cameraSide:"ด้านข้างประมาณ 90°",cameraRear:"ด้านหลัง",cameraFront:"ด้านหน้า",cameraDiag:"เฉียง/ไม่แน่ใจ",
consent:"ยินยอมให้วิเคราะห์คลิปบนอุปกรณ์นี้",saveProgress:"เก็บผลไว้ใน Safari เพื่อดูพัฒนาการ",
analyzeBtn:"เริ่มวิเคราะห์",chooseFirst:"เลือกคลิปก่อน",selected:"เลือกแล้ว",tooLarge:"คลิปเกิน 200 MB",needConsent:"กรุณายินยอมให้วิเคราะห์คลิปก่อน",
loadingFast:"กำลังโหลดโมเดลสำหรับหาเฟรมตี...",loadingPrecise:"กำลังโหลด Full pose model สำหรับวัดองศา...",analyzing:"กำลังค้นหาจังหวะตีในคลิป...",measuring:"กำลังวัดเฟรมนี้แบบละเอียด...",
analysisFail:"วิเคราะห์ไม่สำเร็จ",modelFail:"โหลด AI model ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",poseLow:"ตรวจจับร่างกายไม่ชัดพอ ควรถ่ายใหม่ให้เห็นเต็มตัวและเท้า",
resultEyebrow:"Accuracy Result",resultTitle:"AI Measurement",whatSaw:"AI หาเฟรมอะไรให้",visualTitle:"วิดีโอเต็มสำหรับดูบริบท",visualHelp:"ระหว่างเล่นจะไม่วาดกราฟิกทับ เพื่อไม่ให้เส้นลอยหรือค้าง ใช้ส่วนนี้ดูบริบทและตรวจคน ส่วนการวัดให้ดูจากฉากภาพช้าและภาพสำคัญด้านบน",
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
brandSub:"AI Visual Coach · Dynamic Tracking",learnTab:"Learn",analyzeTab:"Analyze",progressTab:"Progress",
heroEyebrow:"Accuracy Mode",heroTitle:"Measure the actual selected frame first, then compare with a validated reference",
heroText:"AI proposes a hitting frame, then a higher-detail model measures estimated 3D joint angles on the frame you confirm.",
how1:"Choose clip",how1s:"One smash per clip works best",how2:"AI finds frame",how2s:"Fast first-pass search",how3:"Confirm + measure",how3s:"Frame step + Full model",how4:"Reference compare",how4s:"Score only after coach validation",
chooseTitle:"Choose a smash clip",chooseHelp:"For accuracy: full body and feet visible, stable camera, one smash per clip",tester:"Tester name / ID",pickVideo:"Tap to choose a video",fileHint:"Up to 200 MB · first 30 seconds analyzed",
cameraView:"Camera view",cameraSide:"Side about 90°",cameraRear:"Rear",cameraFront:"Front",cameraDiag:"Diagonal / unsure",
consent:"I consent to on-device analysis",saveProgress:"Save measurements in Safari for progress",analyzeBtn:"Start analysis",chooseFirst:"Choose a clip first",selected:"Selected",tooLarge:"Clip is over 200 MB",needConsent:"Please consent to analysis first",
loadingFast:"Loading fast pose model...",loadingPrecise:"Loading Full pose model for angle measurement...",analyzing:"Searching the clip for the hitting phase...",measuring:"Measuring this frame with the Full model...",
analysisFail:"Analysis failed",modelFail:"AI model could not load. Check your internet connection and try again.",poseLow:"Pose detection is too unclear. Re-record with full body and feet visible.",
resultEyebrow:"Accuracy Result",resultTitle:"AI Measurement",whatSaw:"AI-proposed frame",visualTitle:"Full video for context",visualHelp:"No overlay is drawn while this video is playing. Use it for context and player verification; use the slow replay and key frames above for measurement.",
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
Object.assign(T.th,{
  skillMapTitle:"Skill Map ในคลิป",
  skillMapHelp:"AI ติดตามผู้เล่นหลักและแยกจังหวะตีหลายรูปแบบ แตะแต่ละจังหวะเพื่อดูภาพและวัดองศา",
  trackingPlayer:"AI กำลังวัดผู้เล่นหลัก",
  trackedPlayer:"ติดตามผู้เล่นหลักแล้ว",
  actionsFound:"พบจังหวะตี",
  actionUnit:"จังหวะ",
  overheadAction:"ตีเหนือศีรษะ",
  jumpOverheadAction:"กระโดดตีเหนือศีรษะ",
  midAction:"ตีระดับกลาง",
  underhandAction:"ตีใต้มือ",
  unknownAction:"จังหวะตี",
  actionMeasured:"วัดละเอียดแล้ว",
  actionUnmeasured:"แตะเพื่อวัด",
  skillMapCaution:"AI จำแนกจากท่วงท่าร่างกาย ยังไม่แยก Smash / Clear / Drop อย่างมั่นใจ เพราะยังไม่ได้ติดตามลูกขนไก่",
  primaryPlayerHelp:"ระบบเลือกผู้เล่นหลักจากขนาดตัวในภาพและความต่อเนื่องของตำแหน่ง เพื่อหลีกเลี่ยงการจับคนอื่นในสนาม",
  cropMeasure:"Full model วัดจากภาพ crop รอบผู้เล่นหลักเพื่อให้ข้อต่อใหญ่และชัดขึ้น",
  noAction:"ยังหาจังหวะตีที่ชัดเจนไม่ได้",
  frameMeasured:"วัดเฟรมนี้แล้ว",
  measuredAt:"วัดที่",
  bodyBox:"กรอบผู้เล่นหลัก",
  zoomTitle:"ภาพขยายผู้เล่น + มุมที่วัด",
  zoomHelp:"AI crop ผู้เล่นหลักเพื่อให้เห็นข้อต่อชัดขึ้น",
  fullFrameTitle:"วิดีโอเต็ม",
  fullFrameHelp:"ใช้ดูบริบทและตรวจว่า AI ติดตามคนถูกหรือไม่",
  reviewTitle:"สิ่งที่ควรตรวจจากเฟรมนี้",
  reviewLowConf:"ข้อต่อบางจุดยังไม่ชัดพอ ควรถ่ายใกล้ขึ้นหรือให้ผู้เล่นกินพื้นที่ในเฟรมมากขึ้น",
  reviewPerspective:"ค่า 2D กับ 3D ต่างกันมาก มุมกล้องมีผลสูง ควรใช้มุมกล้องคงที่และดู 3D estimate เป็นหลัก",
  reviewBentElbow:"เฟรมนี้แขนข้างตียังงออยู่มาก หากนี่คือ contact จริง ควรนำไปเทียบกับ reference ของโค้ชก่อนตัดสินว่าต้องแก้",
  reviewBalanced:"เฟรมนี้ระบบวัดข้อต่อหลักได้ค่อนข้างชัด เหมาะสำหรับนำไปเทียบกับ reference",
  actionExplanation:"กลุ่มท่านี้จำแนกจากตำแหน่งข้อมือ ไหล่ สะโพก และความเร็วการเคลื่อนของแขน",
  playerLockTitle:"เลือกผู้เล่นที่จะวิเคราะห์",
  playerLockHelp:"แตะที่ลำตัวของคุณในภาพหนึ่งครั้ง AI จะใช้จุดนี้เป็นตัวล็อกตลอดคลิป",
  tapPlayer:"ยังไม่ได้เลือกผู้เล่น",
  playerLocked:"ล็อกผู้เล่นแล้ว — พร้อมวิเคราะห์",
  playerLockNeeded:"กรุณาแตะเลือกผู้เล่นก่อนเริ่มวิเคราะห์",
  preparingFrame:"กำลังเตรียมภาพสำหรับเลือกผู้เล่น...",
  evaluationTitle:"Biomechanics Check",
  evaluationGood:"จังหวะนี้สอดคล้องกับหลักตรวจที่ระบบวัดได้",
  evaluationReview:"จังหวะนี้มีจุดที่ควรตรวจหรือแก้ก่อนใช้เป็นแบบฝึก",
  evaluationInsufficient:"ข้อมูลยังไม่พอสำหรับประเมินจังหวะนี้",
  checkPose:"ความชัดของข้อต่อ",
  checkContact:"ตำแหน่งมือในจังหวะเหนือศีรษะ",
  checkSequence:"ลำดับส่งแรงจากลำตัวไปปลายแขน",
  checkElbow:"ศอกที่เฟรมยืนยัน",
  checkRecovery:"การคืนตัวหลังตี",
  pass:"ผ่าน",
  review:"ควรตรวจ",
  insufficient:"วัดไม่ได้",
  posePass:"ข้อต่อหลักชัดพอสำหรับการวัด",
  poseReview:"ข้อต่อบางจุดไม่ชัด ค่ามุมอาจคลาดเคลื่อน",
  contactPass:"ข้อมือข้างตีอยู่เหนือแนวไหล่ในเฟรมที่เลือก",
  contactReview:"เฟรมที่เลือกยังไม่เห็นมืออยู่เหนือแนวไหล่ ควรตรวจว่าเลือก contact ถูกหรือไม่",
  sequencePass:"เวลาความเร็วสูงสุดเรียงจากส่วนต้นของร่างกายไปปลายแขนได้ตามลำดับโดยประมาณ",
  sequenceReview:"ลำดับ peak movement ไม่เรียงต่อเนื่อง ควรตรวจ phase หรือการถ่ายแรง",
  elbowPass:"ศอกไม่อยู่ในภาวะเหยียดล็อกเกือบสุดที่ contact",
  elbowReview:"ศอกเกือบเหยียดล็อกสุดในเฟรมนี้ งานวิจัย elite jump smash พบว่าการเหยียดน้อยกว่าที่ contact สัมพันธ์กับความเร็วลูกที่สูงกว่า",
  elbowEarly:"ศอกยังงอมาก อาจเป็นเฟรมก่อน contact หรือเป็นรูปแบบที่ต้องเทียบกับ reference",
  recoveryPass:"ระบบเห็นฐานเท้ากลับมาอยู่รอบลำตัวหลังตีภายในช่วงที่ติดตาม",
  recoveryReview:"ยังไม่เห็นฐานเท้ากลับสู่ตำแหน่งสมดุลภายในช่วงติดตาม",
  evidenceNote:"เกณฑ์นี้ใช้ตรวจโครงสร้างการเคลื่อนไหว ไม่ใช่คะแนนมาตรฐานโค้ช และไม่ใช้เลขมุมเป้าหมายที่ไม่มี reference รับรอง",
  referencePending:"ยังไม่มีช่วงองศา “ถูกต้อง” ที่โค้ชรับรองสำหรับท่านี้ จึงไม่แสดงเลขเป้าหมายปลอม",
  referenceNeed:"ขั้นต่อไปคือสร้าง Reference Library จากโค้ชจริงแยกตามชนิดท่า phase และมุมกล้อง แล้วจึงคำนวณความต่างเป็นองศา",
  lockMarker:"ผู้เล่น",
  courtCalTitle:"ปรับเทียบสนาม",
  courtCalHelp:"แนะนำ: แตะมุมสนามคู่ 4 จุดตามลำดับ ใกล้ซ้าย → ใกล้ขวา → ไกลขวา → ไกลซ้าย",
  startCourtCal:"เริ่มเลือก 4 มุมสนาม",
  resetCourtCal:"ล้างจุด",
  courtCalOptional:"ข้ามได้ แต่ Footwork จะเป็นเพียงค่าประมาณจากภาพ",
  courtCalStep:"แตะมุมสนามจุดที่",
  courtCalDone:"ปรับเทียบสนามสำเร็จ — Footwork ใช้พิกัดสนามจริงได้",
  courtCalBad:"จุดสนามไม่สมเหตุสมผล กรุณาเลือกใหม่",
  zoomWaiting:"รอเลือกจังหวะและวัดผู้เล่น",
  zoomReady:"ภาพขยายผู้เล่นจากเฟรมที่วัด",
  courtPositionTitle:"ตำแหน่งบนสนาม",
  courtX:"ระยะด้านข้าง",
  courtY:"ระยะตามความยาวสนาม",
  distanceNet:"ระยะจากแนวเน็ต",
  courtMovement:"การเคลื่อนที่บนพื้นสนาม",
  meter:"ม.",
  courtEvidence:"ค่านี้คำนวณจากเส้นสนามมาตรฐานบนระนาบพื้น จึงเหมาะกับ Footwork/ตำแหน่ง มากกว่าใช้แก้องศาข้อต่อ 3D"
});
Object.assign(T.en,{
  skillMapTitle:"Skill Map",
  skillMapHelp:"AI tracks the main player and separates multiple stroke moments. Tap any action to inspect and measure it.",
  trackingPlayer:"AI is measuring the main player",
  trackedPlayer:"Main player tracked",
  actionsFound:"Stroke moments found",
  actionUnit:"actions",
  overheadAction:"Overhead stroke",
  jumpOverheadAction:"Jump overhead",
  midAction:"Mid-height stroke",
  underhandAction:"Underhand stroke",
  unknownAction:"Stroke",
  actionMeasured:"Precisely measured",
  actionUnmeasured:"Tap to measure",
  skillMapCaution:"Classification is based on body motion. Smash / Clear / Drop are not separated confidently yet because shuttle tracking is not implemented.",
  primaryPlayerHelp:"The main player is selected using body size and position continuity to reduce tracking of other players on court.",
  cropMeasure:"The Full model measures a crop around the main player so joints are larger and clearer.",
  noAction:"No clear stroke moment found",
  frameMeasured:"Frame measured",
  measuredAt:"Measured at",
  bodyBox:"Main-player box",
  zoomTitle:"Magnified player + measured angles",
  zoomHelp:"AI crops the tracked player so joints are easier to inspect",
  fullFrameTitle:"Full video",
  fullFrameHelp:"Use context to verify that AI is tracking the intended player",
  reviewTitle:"What to inspect on this frame",
  reviewLowConf:"Some joints are still unclear. Record closer or make the player larger in frame.",
  reviewPerspective:"2D and 3D estimates differ substantially, so camera perspective is affecting the result. Keep the camera view consistent and prioritize the 3D estimate.",
  reviewBentElbow:"The hitting arm is still quite bent on this frame. If this is true contact, compare it with a coach-validated reference before deciding it needs correction.",
  reviewBalanced:"The main joints are detected clearly enough on this frame for reference comparison.",
  actionExplanation:"This motion family is classified from wrist, shoulder, hip position, and arm movement speed.",
  playerLockTitle:"Select the player to analyze",
  playerLockHelp:"Tap your torso once. AI uses this point to lock onto that player through the clip.",
  tapPlayer:"No player selected yet",
  playerLocked:"Player locked — ready to analyze",
  playerLockNeeded:"Tap the player before starting analysis",
  preparingFrame:"Preparing a frame for player selection...",
  evaluationTitle:"Biomechanics Check",
  evaluationGood:"This action is consistent with the structural checks the system can measure.",
  evaluationReview:"This action has points to review before using it as a training reference.",
  evaluationInsufficient:"There is not enough reliable data to evaluate this action.",
  checkPose:"Joint visibility",
  checkContact:"Overhead hand position",
  checkSequence:"Proximal-to-distal movement sequence",
  checkElbow:"Elbow at confirmed frame",
  checkRecovery:"Post-stroke recovery",
  pass:"Pass",
  review:"Review",
  insufficient:"Insufficient",
  posePass:"Main joints are clear enough for measurement.",
  poseReview:"Some joints are unclear, so angle estimates may be inaccurate.",
  contactPass:"The hitting wrist is above the shoulder line at the selected overhead frame.",
  contactReview:"The hitting hand is not above the shoulder line; verify that the selected contact frame is correct.",
  sequencePass:"Peak movement timing progresses approximately from proximal segments toward the distal arm.",
  sequenceReview:"Peak movement timing is not sequential; review the phase selection or force-transfer pattern.",
  elbowPass:"The elbow is not near full lock at the confirmed frame.",
  elbowReview:"The elbow is nearly fully locked. Elite jump-smash research found less elbow extension at contact associated with greater shuttle speed.",
  elbowEarly:"The elbow is still highly flexed; this may be pre-contact or needs comparison with a validated reference.",
  recoveryPass:"The foot base returns around the body after the stroke within the tracked window.",
  recoveryReview:"A centered recovery base was not detected within the tracked window.",
  evidenceNote:"These are structural biomechanics checks, not a coach-standard score, and no unvalidated target-angle numbers are invented.",
  referencePending:"No coach-validated 'correct angle' range exists in this prototype for this action, so no fake target angle is shown.",
  referenceNeed:"Next: build a coach reference library by stroke, phase, and camera view, then calculate angle deviations from those references.",
  lockMarker:"Player",
  courtCalTitle:"Court calibration",
  courtCalHelp:"Recommended: tap the four doubles-court corners in order near-left → near-right → far-right → far-left",
  startCourtCal:"Select 4 court corners",
  resetCourtCal:"Reset points",
  courtCalOptional:"Optional. Without calibration, footwork remains image-space only.",
  courtCalStep:"Tap court corner",
  courtCalDone:"Court calibration complete — footwork can use real court coordinates",
  courtCalBad:"Court points look invalid. Please select them again.",
  zoomWaiting:"Waiting for an action measurement",
  zoomReady:"Magnified player from the measured frame",
  courtPositionTitle:"Court position",
  courtX:"Lateral position",
  courtY:"Long-court position",
  distanceNet:"Distance from net line",
  courtMovement:"Ground-plane movement",
  meter:"m",
  courtEvidence:"This uses the standardized court plane, so it improves footwork/position measurements more than 3D joint-angle accuracy."
});

Object.assign(T.th,{
  brandSub:"AI Training Analysis · Quality First",
  heroEyebrow:"QUALITY-FIRST ANALYSIS",
  heroTitle:"วิเคราะห์หลายจังหวะจากคลิปจริง โดยแสดงผลเฉพาะเมื่อ AI วัดผู้เล่นได้ชัด",
  heroText:"ล็อกผู้เล่นก่อน ตรวจคุณภาพการติดตาม แยกจังหวะตี แล้ววัดข้อต่อและการเคลื่อนไหวทีละจังหวะ",
  how1:"เลือกคลิป",how1s:"รองรับหลายจังหวะตี",
  how2:"ล็อกผู้เล่น",how2s:"แตะตัวคุณหนึ่งครั้ง",
  how3:"วัดท่าจริง",how3s:"Crop + Full pose model",
  how4:"รับคำแนะนำ",how4s:"เฉพาะสิ่งที่วัดได้",
  chooseTitle:"เลือกคลิปแบดมินตัน",
  chooseHelp:"เห็นเต็มตัวและเท้าให้ชัด กล้องนิ่ง สามารถมีหลายจังหวะตีในคลิปเดียว",
  analyzeBtn:"ตรวจคุณภาพและวิเคราะห์",
  coachAdvice:"สิ่งที่ควรฝึกจากจังหวะนี้",
  referenceNote:"คำแนะนำแสดงเฉพาะสิ่งที่ระบบวัดได้ ไม่สร้างคะแนนหรือองศาเป้าหมายที่ยังไม่มี reference รองรับ",
  qualityTitle:"ตรวจคุณภาพก่อนวิเคราะห์",
  qualityTracked:"ติดตามผู้เล่นได้",
  qualityVisibility:"ความชัดของข้อต่อ",
  qualityBodySize:"ขนาดผู้เล่นในภาพ",
  qualityPass:"ผ่าน Quality Gate — พร้อมวิเคราะห์",
  qualityFail:"คลิปนี้ยังไม่ผ่าน Quality Gate จึงไม่สร้างผลวิเคราะห์ที่อาจทำให้เข้าใจผิด",
  qualityTrackFail:"AI ตามผู้เล่นได้ไม่ต่อเนื่อง ลองถ่ายให้ผู้เล่นไม่หลุดเฟรมและอย่าให้คนอื่นบัง",
  qualityVisibilityFail:"ข้อต่อสำคัญไม่ชัดพอ ลองถ่ายให้เห็นแขน ขา และเท้าครบ",
  qualitySizeFail:"ผู้เล่นเล็กเกินไปสำหรับการวัดที่น่าเชื่อถือ ลองตั้งกล้องใกล้ขึ้นหรือให้ตัวผู้เล่นใหญ่ขึ้นในเฟรม",
  qualityThreshold:"SkillCam จะแสดงผลเฉพาะเมื่อผ่านเกณฑ์คุณภาพขั้นต่ำ",
  preciseFail:"Full pose model ยังวัดเฟรมที่เลือกไม่ได้ จึงไม่แสดงผลลัพธ์ว่าง",
  noReliableAction:"ยังไม่พบจังหวะตีที่ชัดพอจากผู้เล่นที่ล็อกไว้",
  trainingTitle:"คำแนะนำที่ทำได้ทันที",
  trainFrame:"ตรวจเฟรมก่อน: ถ้ายังไม่ใช่ช่วงตีจริง ให้เลื่อนไปเฟรมข้างเคียงแล้ววัดใหม่",
  trainHighContact:"สำหรับจังหวะเหนือศีรษะ เฟรมนี้มือข้างตียังไม่อยู่เหนือแนวไหล่ ถ้าเฟรมถูกต้องให้ทดลองเตรียมจุดตีให้สูงขึ้น",
  trainSequence:"ฝึก Shadow swing ช้า ๆ ให้การเคลื่อนไหวไล่จากลำตัว/สะโพก → ไหล่ → ศอก → ข้อมือ ก่อนเพิ่มความเร็ว",
  trainElbowLock:"อย่าพยายามล็อกศอกตรงสุดเพื่อสร้างแรงอย่างเดียว ให้เน้นการหมุนไหล่และปลายแขนร่วมกับ kinetic chain",
  trainRecovery:"หลังตีให้คืนฐานเท้าและลำตัวกลับสู่ท่าพร้อมอย่างต่อเนื่องก่อนลูกถัดไป",
  trainGood:"จังหวะนี้ผ่านจุดตรวจโครงสร้างที่ระบบวัดได้ ให้เน้นทำซ้ำด้วยมุมกล้องเดิมเพื่อดูความสม่ำเสมอ",
  reliableResult:"ผลด้านล่างมาจากเฟรมที่ Full model วัดสำเร็จ",
  playerTooSmall:"เล็กเกินไป",
  playerGoodSize:"เพียงพอ"
});
Object.assign(T.en,{
  brandSub:"AI Training Analysis · Quality First",
  heroEyebrow:"QUALITY-FIRST ANALYSIS",
  heroTitle:"Analyze multiple stroke events and only show results when the player can be measured reliably",
  heroText:"Lock the player, run a quality gate, map stroke events, then measure joints and movement one event at a time.",
  how1:"Choose clip",how1s:"Multiple strokes supported",
  how2:"Lock player",how2s:"Tap yourself once",
  how3:"Measure movement",how3s:"Crop + Full pose model",
  how4:"Get guidance",how4s:"Only from measured evidence",
  chooseTitle:"Choose a badminton clip",
  chooseHelp:"Keep the full body and feet visible with a stable camera. Multiple strokes are supported.",
  analyzeBtn:"Check quality and analyze",
  coachAdvice:"What to train from this action",
  referenceNote:"Guidance only uses what the system measured; no unvalidated score or target angle is invented.",
  qualityTitle:"Clip quality gate",
  qualityTracked:"Player tracking",
  qualityVisibility:"Joint visibility",
  qualityBodySize:"Player size in frame",
  qualityPass:"Quality gate passed — ready for analysis",
  qualityFail:"This clip did not pass the quality gate, so SkillCam will not generate misleading analysis.",
  qualityTrackFail:"Player tracking is not continuous. Keep the player in frame and reduce occlusion.",
  qualityVisibilityFail:"Key joints are unclear. Keep arms, legs and feet visible.",
  qualitySizeFail:"The player is too small for reliable measurement. Move closer or frame the player larger.",
  qualityThreshold:"SkillCam only shows results after minimum quality checks pass.",
  preciseFail:"The Full pose model could not measure the selected frame, so an empty result is not shown.",
  noReliableAction:"No sufficiently clear stroke event was found for the locked player.",
  trainingTitle:"Actionable guidance",
  trainFrame:"Verify the frame first. If this is not the true hitting phase, choose a neighboring sample and measure again.",
  trainHighContact:"For an overhead event, the hitting hand is not above the shoulder line. If the frame is correct, experiment with a higher hitting position.",
  trainSequence:"Practice a slow shadow swing with movement progressing from trunk/hips → shoulder → elbow → wrist before adding speed.",
  trainElbowLock:"Do not chase a fully locked elbow as the sole source of power; coordinate shoulder and forearm rotation with the kinetic chain.",
  trainRecovery:"After the stroke, recover the foot base and torso continuously into a ready position.",
  trainGood:"This action passes the structural checks the system can measure. Repeat with the same camera view to test consistency.",
  reliableResult:"The result below comes from a frame successfully measured by the Full model.",
  playerTooSmall:"Too small",
  playerGoodSize:"Sufficient"
});

Object.assign(T.th,{
  miniClipTitle:"ฉากทักษะแบบภาพช้า",
  miniClipHelp:"เล่นจากเฟรมจริงที่ AI วิเคราะห์ไว้ จึงวาง Skeleton และองศาตรงกับภาพแต่ละเฟรม ไม่ต้องไล่ตามวิดีโอเร็วแบบ real-time",
  playSegment:"เล่นภาพช้า",pauseSegment:"หยุดภาพช้า",prevReplayFrame:"เฟรมก่อน",nextReplayFrame:"เฟรมถัดไป",replaySpeed:"ความเร็ว",
  loopOn:"เล่นวน: เปิด",
  loopOff:"เล่นวน: ปิด",
  segmentRange:"ช่วงวิเคราะห์",
  segmentDuration:"ความยาว",
  actionGood:"โครงสร้างผ่าน",
  actionReview:"ควรตรวจ",
  actionNoMeasure:"วัดไม่สำเร็จ",
  measuredActions:"วัดละเอียดสำเร็จ",
  reviewActions:"มีจุดควรตรวจ",
  analyzingActions:"กำลังวัดจังหวะสำคัญ",
  trackingBox:"ผู้เล่นที่ล็อก",liveTracking2D:"ติดตามขณะเล่น · มุม 2D",liveTrackingSkeleton:"ติดตามผู้เล่น · Skeleton",preciseFrame3D:"เฟรมยืนยัน · มุม 3D",
  keyFramesTitle:"6 ภาพสำคัญของจังหวะตี",keyFramesHelp:"ใช้ภาพจริงทีละเฟรมเป็นผลหลัก เพื่อให้เห็นชัดว่า AI วางมุมตรงข้อต่อไหน และดูต่อเนื่องกับฉากภาพช้าด้านบน",
  keyPreparation:"1. เตรียมท่า",keyLoad:"2. โหลดแรง",keySwing:"3. เร่งวงสวิง",keyContact:"4. จุดสัมผัส",keyFollowThrough:"5. Follow-through",keyRecovery:"6. คืนตัว",
  keyFrame2D:"มุม 2D ของเฟรมนี้",keyFrame3D:"Full model · 3D estimate",keyFrameTime:"เวลา",keyNoFrame:"ไม่มีเฟรมที่วัดได้",
  keyElbowRule:"ศอก = ไหล่–ศอก–ข้อมือ",keyShoulderRule:"ไหล่ = สะโพก–ไหล่–ศอก",keyKneeRule:"เข่า = สะโพก–เข่า–ข้อเท้า",
  multiActionSummary:"AI ติดตามผู้เล่นตลอดคลิปและแยกช่วงก่อนตี–จังหวะตี–หลังตีให้แต่ละเหตุการณ์",
  allActionsFailed:"พบจังหวะเคลื่อนไหว แต่ Full model วัดทุกจังหวะไม่สำเร็จ จึงไม่แสดงผลลัพธ์",
  actionReady:"วัดละเอียดแล้ว",
  actionClip:"Mini‑clip"
});
Object.assign(T.en,{
  miniClipTitle:"Slow skill replay",
  miniClipHelp:"Replay the actual frames AI analyzed, so skeletons and angles stay aligned with each frame instead of chasing fast video in real time.",
  playSegment:"Play slow motion",pauseSegment:"Pause slow motion",prevReplayFrame:"Previous frame",nextReplayFrame:"Next frame",replaySpeed:"Speed",
  loopOn:"Loop: on",
  loopOff:"Loop: off",
  segmentRange:"Analysis segment",
  segmentDuration:"Duration",
  actionGood:"Structure passed",
  actionReview:"Review",
  actionNoMeasure:"Measurement failed",
  measuredActions:"Precisely measured",
  reviewActions:"Need review",
  analyzingActions:"Measuring important actions",
  trackingBox:"Locked player",liveTracking2D:"Live tracking · 2D angles",liveTrackingSkeleton:"Player tracking · Skeleton",preciseFrame3D:"Confirmed frame · 3D angles",
  keyFramesTitle:"6 key frames of the stroke",keyFramesHelp:"Use real still frames as the primary result so each measured angle is tied to a specific pose and can be reviewed alongside the slow replay.",
  keyPreparation:"1. Preparation",keyLoad:"2. Load",keySwing:"3. Swing acceleration",keyContact:"4. Contact",keyFollowThrough:"5. Follow-through",keyRecovery:"6. Recovery",
  keyFrame2D:"2D angle on this frame",keyFrame3D:"Full model · 3D estimate",keyFrameTime:"Time",keyNoFrame:"No measurable frame",
  keyElbowRule:"Elbow = shoulder–elbow–wrist",keyShoulderRule:"Shoulder = hip–shoulder–elbow",keyKneeRule:"Knee = hip–knee–ankle",
  multiActionSummary:"AI tracks the selected player through the clip and separates lead-in, stroke, and recovery for each event.",
  allActionsFailed:"Motion events were found, but the Full model could not measure any of them, so no result is shown.",
  actionReady:"Precisely measured",
  actionClip:"Mini clip"
});

Object.assign(T.th,{
  heroEyebrow:"วิเคราะห์ทักษะจากคลิป",
  heroTitle:"ดูจังหวะสำคัญแบบภาพช้า แล้วรู้ว่าควรปรับตรงไหน",
  heroText:"SkillCam เลือกผู้เล่น แยกช่วงสำคัญ และวัดจากเฟรมที่ตรวจได้ชัด จากนั้นสรุปเป็นภาษาง่ายว่าจุดไหนผ่านและควรฝึกอะไรต่อ",
  how1:"เลือกคลิป",how1s:"เห็นเต็มตัวและเท้า",
  how2:"เลือกผู้เล่น",how2s:"แตะตัวคุณหนึ่งครั้ง",
  how3:"ดูภาพช้า",how3s:"6 ช่วงสำคัญของท่า",
  how4:"ปรับทีละจุด",how4s:"คำแนะนำจากสิ่งที่วัดได้",
  resultEyebrow:"ผลการฝึก",
  resultTitle:"สรุปการวิเคราะห์",
  whatSaw:"ข้อมูลที่ AI ตรวจพบ",
  skillMapTitle:"เลือกจังหวะที่ต้องการดู",
  skillMapHelp:"ถ้าคลิปมีหลายจังหวะ ให้แตะเลือกทีละจังหวะ ระบบจะสรุปผลและภาพช้าให้ใหม่",
  accuracyTitle:"จังหวะที่เลือกยังไม่ตรง?",
  accuracyHelp:"เลื่อนไปเฟรมก่อนหรือหลัง แล้วกดวัดอีกครั้ง เฉพาะเมื่อภาพหยุดตรงช่วงที่ต้องการตรวจ",
  keyFramesTitle:"ดูท่าแยกทีละช่วง",
  keyFramesHelp:"6 ภาพหลักเรียงจากเตรียมท่าไปจนคืนตัว แตะภาพเพื่อดูเฟรมนั้น",
  coachReportTitle:"สรุปสำหรับฝึก",
  coachReportHelp:"อ่านส่วนนี้ก่อน ส่วนตัวเลขละเอียดอยู่ด้านล่าง",
  coachHeadlineGood:"จังหวะนี้ยังไม่พบจุดเตือนจากสิ่งที่ระบบวัดได้",
  coachHeadlineReview:"จังหวะนี้มีจุดที่ควรปรับก่อนฝึกซ้ำ",
  coachHeadlineInsufficient:"ข้อมูลยังไม่พอสำหรับสรุปท่านี้",
  coachStatusGood:"ใช้ดูเป็นตัวอย่างของรอบนี้ได้",
  coachStatusReview:"ปรับจุดสำคัญก่อน แล้วลองถ่ายใหม่",
  coachStatusInsufficient:"ตรวจเฟรมหรือคุณภาพคลิปก่อน",
  coachMethodTitle:"AI สรุปอย่างไร",
  coachMethodText:"ล็อกผู้เล่น → แยกช่วงทักษะ → วัดข้อต่อในเฟรมสำคัญ → สรุปเฉพาะสิ่งที่ตรวจได้",
  selectedMoment:"จังหวะที่วิเคราะห์",
  dataClarity:"ความชัดของข้อมูล",
  passedPoints:"จุดที่ผ่าน",
  improvePoints:"จุดที่ควรปรับ",
  whatGood:"สิ่งที่ทำได้ดี",
  whatImprove:"ปรับตรงไหนก่อน",
  nextPractice:"ลองทำครั้งถัดไป",
  aiSaw:"AI เห็น",
  noPassYet:"ยังไม่มีจุดที่ระบบยืนยันว่า 'ผ่าน' ได้ชัดเจนในจังหวะนี้",
  noImprove:"ยังไม่มีจุดเตือนจากเกณฑ์ที่ระบบตรวจได้ ให้เน้นทำซ้ำด้วยมุมกล้องเดิมเพื่อดูความสม่ำเสมอ",
  remeasureFirst:"เฟรมนี้ยังไม่ได้วัดแบบละเอียด เลือกเฟรมที่ต้องการแล้วกดวัดก่อนอ่านผล",
  aiDetectedDetails:"ดูข้อมูลที่ AI ตรวจพบ",
  technicalDetails:"ดูข้อมูลวิเคราะห์เชิงเทคนิค",
  technicalHelp:"องศา 3D, Biomechanics, Footwork และวิดีโอเต็ม สำหรับผู้ที่ต้องการตรวจรายละเอียด",
  evidenceTitle:"เหตุผลที่สรุปแบบนี้",
  practicePriority:"ลำดับฝึก",
  practiceFirst:"ทำข้อนี้ก่อน",
  practiceThen:"จากนั้น",
  clipQualityIssue:"คุณภาพภาพมีผลต่อผลลัพธ์ ควรแก้การถ่ายก่อนวิเคราะห์ท่า"
});
Object.assign(T.en,{
  heroEyebrow:"Skill analysis from video",
  heroTitle:"Review key moments in slow motion and see what to improve",
  heroText:"SkillCam locks the player, separates key phases, measures clear frames, then explains in plain language what passed and what to practice next.",
  how1:"Choose clip",how1s:"Full body and feet visible",
  how2:"Select player",how2s:"Tap yourself once",
  how3:"Review slow motion",how3s:"6 key movement phases",
  how4:"Improve one thing",how4s:"Guidance from measured evidence",
  resultEyebrow:"Training result",
  resultTitle:"Analysis summary",
  whatSaw:"What AI detected",
  skillMapTitle:"Choose a stroke to review",
  skillMapHelp:"If the clip has multiple strokes, select one at a time. The summary and slow replay update for that stroke.",
  accuracyTitle:"Is the selected moment slightly off?",
  accuracyHelp:"Step to the previous or next frame, then measure again only when the image is frozen on the moment you want to inspect.",
  keyFramesTitle:"Review the stroke phase by phase",
  keyFramesHelp:"Six key images from preparation through recovery. Tap any image to inspect that frame.",
  coachReportTitle:"Training summary",
  coachReportHelp:"Read this first. Detailed numbers are available below.",
  coachHeadlineGood:"No warning was found in the checks the system could measure",
  coachHeadlineReview:"This stroke has points to adjust before repeating the drill",
  coachHeadlineInsufficient:"There is not enough reliable data to summarize this stroke",
  coachStatusGood:"Use this as a reference for this session",
  coachStatusReview:"Fix the main point, then record another attempt",
  coachStatusInsufficient:"Check the frame or clip quality first",
  coachMethodTitle:"How AI reached this result",
  coachMethodText:"Lock player → separate skill phases → measure joints on key frames → summarize only measurable evidence",
  selectedMoment:"Selected stroke",
  dataClarity:"Data clarity",
  passedPoints:"Passed checks",
  improvePoints:"Points to improve",
  whatGood:"What is working",
  whatImprove:"What to improve first",
  nextPractice:"Try this next",
  aiSaw:"AI saw",
  noPassYet:"No point is clear enough to mark as passed on this stroke yet.",
  noImprove:"No warning was found in the measurable checks. Repeat with the same camera view to assess consistency.",
  remeasureFirst:"This frame has not been precisely measured. Choose the intended frame and measure it before reading the result.",
  aiDetectedDetails:"View what AI detected",
  technicalDetails:"View technical analysis",
  technicalHelp:"3D angles, biomechanics, footwork, and full video for detailed inspection",
  evidenceTitle:"Why the system says this",
  practicePriority:"Practice order",
  practiceFirst:"Do this first",
  practiceThen:"Then",
  clipQualityIssue:"Image quality is affecting the result. Fix the recording before changing technique."
});

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

function solveLinear(A,b){
  const n=b.length,M=A.map((r,i)=>r.slice().concat([b[i]]));
  for(let i=0;i<n;i++){
    let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;
    [M[i],M[p]]=[M[p],M[i]];
    const d=M[i][i];if(Math.abs(d)<1e-10)return null;
    for(let c=i;c<=n;c++)M[i][c]/=d;
    for(let r=0;r<n;r++){if(r===i)continue;const f=M[r][i];for(let c=i;c<=n;c++)M[r][c]-=f*M[i][c]}
  }
  return M.map(r=>r[n])
}
function homographyFrom4(src,dst){
  if(src.length!==4||dst.length!==4)return null;
  const A=[],b=[];
  for(let i=0;i<4;i++){
    const x=src[i].x,y=src[i].y,X=dst[i].x,Y=dst[i].y;
    A.push([x,y,1,0,0,0,-X*x,-X*y]);b.push(X);
    A.push([0,0,0,x,y,1,-Y*x,-Y*y]);b.push(Y)
  }
  const h=solveLinear(A,b);return h?[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]:null
}
function applyH(H,p){
  if(!H||!p)return null;const d=H[6]*p.x+H[7]*p.y+H[8];if(Math.abs(d)<1e-9)return null;
  return{x:(H[0]*p.x+H[1]*p.y+H[2])/d,y:(H[3]*p.x+H[4]*p.y+H[5])/d}
}
function courtWorldPoints(){return[{x:0,y:0},{x:6.10,y:0},{x:6.10,y:13.40},{x:0,y:13.40}]}
function finalizeCourtCalibration(){
  if(courtCalPoints.length!==4)return false;
  courtHomography=homographyFrom4(courtCalPoints,courtWorldPoints());
  courtInverseHomography=homographyFrom4(courtWorldPoints(),courtCalPoints);
  if(!courtHomography||!courtInverseHomography){courtHomography=null;courtInverseHomography=null;return false}
  return true
}
function courtPointFromImage(p){return applyH(courtHomography,p)}
function imagePointFromCourt(x,y){return applyH(courtInverseHomography,{x,y})}
function drawCourtCalibration(){
  const c=$("#playerSelectCanvas");if(!selectorBaseCanvas||!c)return;
  drawPlayerSelector();
  const ctx=c.getContext("2d");
  ctx.save();ctx.lineWidth=Math.max(4,c.width/200);ctx.strokeStyle="#38bdf8";ctx.fillStyle="#38bdf8";ctx.font="900 "+Math.max(18,Math.round(c.width/38))+"px -apple-system,sans-serif";
  courtCalPoints.forEach((p,i)=>{const x=p.x*c.width,y=p.y*c.height;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.fillText(String(i+1),x+13,y-8)});
  if(courtCalPoints.length>1){ctx.beginPath();courtCalPoints.forEach((p,i)=>{const x=p.x*c.width,y=p.y*c.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
  if(courtCalPoints.length===4){ctx.closePath();ctx.stroke();
    if(courtInverseHomography){
      const lines=[[[0,6.7],[6.1,6.7]],[[0,1.98],[6.1,1.98]],[[0,11.42],[6.1,11.42]],[[3.05,0],[3.05,13.4]]];
      ctx.strokeStyle="rgba(245,158,11,.95)";ctx.lineWidth=Math.max(3,c.width/260);
      for(const L of lines){const a=imagePointFromCourt(L[0][0],L[0][1]),b=imagePointFromCourt(L[1][0],L[1][1]);if(a&&b){ctx.beginPath();ctx.moveTo(a.x*c.width,a.y*c.height);ctx.lineTo(b.x*c.width,b.y*c.height);ctx.stroke()}}
    }
  }
  ctx.restore()
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
      runningMode:"VIDEO",numPoses:4,minPoseDetectionConfidence:.45,minPosePresenceConfidence:.45,minTrackingConfidence:.45
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

function poseBox(j){
  const pts=Object.values(j).filter(visible);
  if(pts.length<6)return null;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const x0=Math.max(0,Math.min(...xs)),x1=Math.min(1,Math.max(...xs));
  const y0=Math.max(0,Math.min(...ys)),y1=Math.min(1,Math.max(...ys));
  return{x:x0,y:y0,w:Math.max(.01,x1-x0),h:Math.max(.01,y1-y0),area:Math.max(.0001,(x1-x0)*(y1-y0)),cx:(x0+x1)/2,cy:(y0+y1)/2}
}
function selectTrackedPose(poses,prev){
  const candidates=poses.map(j=>({j,b:poseBox(j)})).filter(x=>x.b);
  if(!candidates.length)return null;
  if(!prev&&playerSeed){
    return candidates.sort((a,b)=>{
      const containsA=playerSeed.x>=a.b.x&&playerSeed.x<=a.b.x+a.b.w&&playerSeed.y>=a.b.y&&playerSeed.y<=a.b.y+a.b.h;
      const containsB=playerSeed.x>=b.b.x&&playerSeed.x<=b.b.x+b.b.w&&playerSeed.y>=b.b.y&&playerSeed.y<=b.b.y+b.b.h;
      const da=Math.hypot(a.b.cx-playerSeed.x,a.b.cy-playerSeed.y),db=Math.hypot(b.b.cx-playerSeed.x,b.b.cy-playerSeed.y);
      const sa=(containsA?4:0)+a.b.area*1.5-da*4;
      const sb=(containsB?4:0)+b.b.area*1.5-db*4;
      return sb-sa
    })[0]
  }
  if(!prev)return candidates.sort((a,b)=>b.b.area-a.b.area)[0];
  return candidates.sort((a,b)=>{
    const da=Math.hypot(a.b.cx-prev.x,a.b.cy-prev.y),db=Math.hypot(b.b.cx-prev.x,b.b.cy-prev.y);
    const sa=a.b.area*1.2-da*4.2,sb=b.b.area*1.2-db*4.2;return sb-sa
  })[0]
}
function classifyAction(frame,side,contextRise){
  const j=frame.joints,w=j[side+"_wrist"],sh=j[side+"_shoulder"],hip=j[side+"_hip"];
  if(!w||!sh||!hip)return"unknown";
  if(w.y<sh.y-.02)return contextRise>.22?"jump_overhead":"overhead";
  if(w.y<hip.y+.03)return"mid";
  return"underhand"
}
function actionLabel(type){
  return type==="jump_overhead"?t("jumpOverheadAction"):type==="overhead"?t("overheadAction"):type==="mid"?t("midAction"):type==="underhand"?t("underhandAction"):t("unknownAction")
}
function pointFor(fr,key,side){
  if(key==="hip")return mid2(fr.joints.left_hip,fr.joints.right_hip);
  if(key==="shoulder")return mid2(fr.joints.left_shoulder,fr.joints.right_shoulder);
  return fr.joints[(side||"right")+"_"+key]||null
}
function peakMotionTime(windowFrames,key,side,scale){
  let best=null;
  for(let i=1;i<windowFrames.length;i++){
    const a=pointFor(windowFrames[i-1],key,side),b=pointFor(windowFrames[i],key,side);
    if(!a||!b)continue;
    const dt=Math.max(.025,windowFrames[i].time-windowFrames[i-1].time);
    const speed=dist2(a,b)/dt/Math.max(.035,scale);
    if(!best||speed>best.speed)best={time:windowFrames[i].time,speed}
  }
  return best
}
function movementSequence(frames,time,side,scale){
  const w=frames.filter(f=>f.time>=time-.85&&f.time<=time+.18);
  const keys=["knee","hip","shoulder","elbow","wrist"];
  const peaks={};for(const k of keys)peaks[k]=peakMotionTime(w,k,side,scale);
  const ts=keys.map(k=>peaks[k]?.time);
  const enough=ts.filter(Number.isFinite).length>=4;
  let ordered=enough;
  if(enough){
    const vals=keys.map(k=>peaks[k]?.time).filter(Number.isFinite);
    for(let i=1;i<vals.length;i++)if(vals[i]+.12<vals[i-1])ordered=false
  }
  return{ordered,enough,peaks}
}
function recoveryProxy(frames,time){
  const after=frames.filter(f=>f.time>time&&f.time<=time+2.2);
  for(const fr of after){
    const j=fr.joints,hm=mid2(j.left_hip,j.right_hip),am=mid2(j.left_ankle,j.right_ankle);
    if(!hm||!am||!j.left_shoulder||!j.right_shoulder)continue;
    const sw=Math.max(.02,dist2(j.left_shoulder,j.right_shoulder));
    if(Math.abs(hm.x-am.x)/sw<.65)return round(fr.time-time,2)
  }
  return null
}
function quantile(values,q){
  const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
  if(!a.length)return null;
  const p=(a.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);
  return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(p-lo)
}
function keyJointVisibility(j){
  const names=["left_shoulder","right_shoulder","left_elbow","right_elbow","left_wrist","right_wrist","left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle"];
  return visibility(j,names)
}
function trackingCrop(center,video){
  const aspect=(video.videoWidth||1080)/(video.videoHeight||1920);
  const h=.72,w=clamp(.52*h/Math.max(.25,aspect),.38,.72);
  const cx=center?.x??.5,cy=center?.y??.55;
  return{x:clamp(cx-w/2,0,1-w),y:clamp(cy-h/2,0,1-h),w,h}
}
function cropPoseChoice(landmarks){
  const candidates=(landmarks||[]).map(lm=>({lm,j:dictFromLandmarks(lm)})).map(x=>({...x,b:poseBox(x.j)})).filter(x=>x.b);
  if(!candidates.length)return null;
  return candidates.sort((a,b)=>{
    const da=Math.hypot(a.b.cx-.5,a.b.cy-.52),db=Math.hypot(b.b.cx-.5,b.b.cy-.52);
    const sa=a.b.area-da*1.8,sb=b.b.area-db*1.8;
    return sb-sa
  })[0]
}
function qualityReport(frames,attempted){
  const trackedRatio=attempted?frames.length/attempted:0;
  const jointVis=median(frames.map(f=>f.key_visibility))||0;
  const bodyHeight=median(frames.map(f=>f.bbox?.h).filter(Number.isFinite))||0;
  const passed=trackedRatio>=.55&&jointVis>=.56&&bodyHeight>=.10;
  return{passed,tracked_ratio:round(trackedRatio,3),joint_visibility:round(jointVis,3),body_height:round(bodyHeight,3),
    checks:{tracking:trackedRatio>=.55,visibility:jointVis>=.56,size:bodyHeight>=.10}}
}
function renderQuality(q){
  const card=$("#qualityCard");if(!q){card.classList.add("hidden");return}
  card.classList.remove("hidden");
  const item=(label,value,ok)=>"<div class='quality-item "+(ok?"ok":"bad")+"'><small>"+label+"</small><strong>"+value+"</strong><span>"+(ok?"✓":"!")+"</span></div>";
  $("#qualityMetrics").innerHTML=
    item(t("qualityTracked"),pct(q.tracked_ratio),q.checks.tracking)+
    item(t("qualityVisibility"),pct(q.joint_visibility),q.checks.visibility)+
    item(t("qualityBodySize"),Math.round(q.body_height*100)+"% "+(q.checks.size?t("playerGoodSize"):t("playerTooSmall")),q.checks.size);
  const notes=[];if(!q.checks.tracking)notes.push(t("qualityTrackFail"));if(!q.checks.visibility)notes.push(t("qualityVisibilityFail"));if(!q.checks.size)notes.push(t("qualitySizeFail"));
  $("#qualityAdvice").innerHTML="<div class='quality-summary "+(q.passed?"ok":"bad")+"'><b>"+(q.passed?t("qualityPass"):t("qualityFail"))+"</b><p>"+(notes.length?notes.join("<br>"):t("qualityThreshold"))+"</p></div>"
}
function coarseCompute(frames,quality){
  if(frames.length<5)throw new Error(t("poseLow"));
  const scales=frames.map(f=>{const sh=mid2(f.joints.left_shoulder,f.joints.right_shoulder),hp=mid2(f.joints.left_hip,f.joints.right_hip);return sh&&hp?dist2(sh,hp):null});
  const bodyScale=Math.max(median(scales)||.1,.035);
  const hipY=frames.map(f=>mid2(f.joints.left_hip,f.joints.right_hip)?.y).filter(Number.isFinite),medianHip=median(hipY)??.5;
  const raw=[];
  for(let i=1;i<frames.length;i++){
    const f=frames[i],p=frames[i-1];let best=null;
    for(const side of["left","right"]){
      const w=f.joints[side+"_wrist"],pw=p.joints[side+"_wrist"],sh=f.joints[side+"_shoulder"],el=f.joints[side+"_elbow"];
      if(!visible(w)||!visible(pw)||!visible(sh)||!visible(el))continue;
      const dt=Math.max(.05,f.time-p.time),speed=dist2(w,pw)/dt/bodyScale,ext=(angle2(sh,el,w)??90)/180;
      const overhead=clamp((sh.y-w.y)/bodyScale,0,1.5),reach=clamp(dist2(w,sh)/bodyScale,0,2);
      const score=speed*.58+ext*.16+overhead*.18+reach*.08,vis=visibility(f.joints,[side+"_shoulder",side+"_elbow",side+"_wrist"]);
      if(!best||score>best.score)best={i,time:f.time,side,score,vis}
    }
    if(best)raw.push(best)
  }
  if(raw.length<3)throw new Error(t("noReliableAction"));
  const smoothed=raw.map((r,i)=>{const win=raw.slice(Math.max(0,i-1),Math.min(raw.length,i+2));return{...r,smooth:win.reduce((a,b)=>a+b.score,0)/win.length}});
  const scores=smoothed.map(x=>x.smooth),med=median(scores)||0,mad=median(scores.map(x=>Math.abs(x-med)))||0,q75=quantile(scores,.75)||0,threshold=Math.max(.9,med+2*mad,q75*1.18);
  const peaks=[];
  for(let i=1;i<smoothed.length-1;i++){const c=smoothed[i];if(c.time<.4||c.vis<.48||c.smooth<threshold)continue;if(c.smooth>=smoothed[i-1].smooth&&c.smooth>=smoothed[i+1].smooth)peaks.push(c)}
  peaks.sort((a,b)=>b.smooth-a.smooth);
  const spaced=[];for(const p of peaks){if(spaced.every(x=>Math.abs(x.time-p.time)>=.75))spaced.push(p);if(spaced.length>=8)break}
  if(!spaced.length){const best=[...smoothed].filter(x=>x.time>=.4&&x.vis>=.5).sort((a,b)=>b.smooth-a.smooth)[0];if(!best||best.smooth<.8)throw new Error(t("noReliableAction"));spaced.push(best)}
  spaced.sort((a,b)=>a.time-b.time);
  const actions=spaced.map((p,idx)=>{
    const window=frames.map((f,i)=>({f,i})).filter(x=>Math.abs(x.f.time-p.time)<=.32);
    let chosen={f:frames[p.i],i:p.i},found=false,bestScore=Infinity;
    for(const x of window){
      const j=x.f.joints,w=j[p.side+"_wrist"],sh=j[p.side+"_shoulder"],el=j[p.side+"_elbow"];if(!visible(w)||!visible(sh)||!visible(el))continue;
      const e=angle2(sh,el,w)??90;if(w.y<sh.y){found=true;const sc=(w.y-sh.y)-.1*(e/180);if(sc<bestScore){bestScore=sc;chosen=x}}
    }
    if(!found)chosen=window.sort((a,b)=>Math.abs(a.f.time-p.time)-Math.abs(b.f.time-p.time))[0]||chosen;
    const ff=chosen.f,hm=mid2(ff.joints.left_hip,ff.joints.right_hip);
    const local=frames.filter(x=>Math.abs(x.time-ff.time)<=.35).map(x=>mid2(x.joints.left_hip,x.joints.right_hip)?.y).filter(Number.isFinite);
    const rise=local.length?(medianHip-Math.min(...local))/bodyScale:0,confidence=clamp(.56+Math.min(.24,(p.smooth-threshold)/Math.max(.5,threshold)*.18)+p.vis*.16,.56,.96);
    return{id:idx+1,time:round(ff.time,3),side:p.side,type:classifyAction(ff,p.side,rise),confidence:round(confidence,2),bbox:ff.bbox,
      center:hm?{x:hm.x,y:hm.y}:{x:ff.bbox.cx,y:ff.bbox.cy},coarse_joints:ff.joints,activity:round(p.smooth,2),jump_rise:round(rise,2),
      sequence:movementSequence(frames,ff.time,p.side,bodyScale),recovery_time:recoveryProxy(frames,ff.time),frame_index:chosen.i,
      clip_start:round(Math.max(frames[0].time,ff.time-.8),3),
      clip_end:round(Math.min(frames[frames.length-1].time,ff.time+1.0),3),
      precise:null}
  });
  const hips=frames.map(f=>mid2(f.joints.left_hip,f.joints.right_hip)).filter(Boolean);let travel=0;
  for(let a=0;a<hips.length;a++)for(let b=a+1;b<hips.length;b++)travel=Math.max(travel,dist2(hips[a],hips[b]));
  const travelBody=travel/bodyScale,maxRise=Math.max(...actions.map(a=>a.jump_rise||0),0),movement=maxRise>.22?"jump_like":travelBody>.7?"moving":"standing",first=actions[0];
  return{version:"v17",hitting_side:first.side,contact_time:first.time,contact_candidate_count:actions.length,movement_type:movement,
    movement_confidence:round(clamp(.65+Math.min(1,travelBody)*.15,.65,.9),2),coarse_frame_count:frames.length,actions,precise:null,tracked_frames:frames.length,quality}
}
async function analyzeVideo(file){
  const pl=await initCoarse();showStatus(t("analyzing"),"loading");
  const url=URL.createObjectURL(file),video=document.createElement("video");video.src=url;video.muted=true;video.playsInline=true;video.preload="auto";
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(lang==="th"?"โหลดข้อมูลวิดีโอช้าเกินไป":"Video metadata timed out")),15000);video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};video.onerror=()=>{clearTimeout(timer);reject(new Error(lang==="th"?"เปิดวิดีโอไม่ได้":"Could not open video"))}});
  const duration=Math.min(video.duration,30),frames=[],sampleEvery=.10;let last=-99,done=false,attempted=0,trackCenter=playerSeed||{x:.5,y:.55},failStreak=0;
  const cropCanvas=document.createElement("canvas"),ctx=cropCanvas.getContext("2d");
  const capture=tm=>{
    if(tm-last<sampleEvery-.012)return;last=tm;attempted++;
    let crop=trackingCrop(trackCenter,video);
    if(failStreak>=3){const cx=crop.x+crop.w/2,cy=crop.y+crop.h/2;crop={w:Math.min(.88,crop.w*1.22),h:Math.min(.88,crop.h*1.14),x:0,y:0};crop.x=clamp(cx-crop.w/2,0,1-crop.w);crop.y=clamp(cy-crop.h/2,0,1-crop.h)}
    const srcW=Math.max(2,crop.w*video.videoWidth),srcH=Math.max(2,crop.h*video.videoHeight),sourceAspect=srcW/srcH,maxH=640;
    cropCanvas.height=maxH;cropCanvas.width=Math.max(260,Math.round(maxH*sourceAspect));
    ctx.drawImage(video,crop.x*video.videoWidth,crop.y*video.videoHeight,srcW,srcH,0,0,cropCanvas.width,cropCanvas.height);
    const r=pl.detectForVideo(cropCanvas,Math.round(tm*1000)),picked=cropPoseChoice(r.landmarks);
    if(!picked){failStreak++;return}
    failStreak=0;
    const joints=remapCropLandmarks(picked.lm,crop),bbox=poseBox(joints);if(!bbox)return;
    const hp=mid2(joints.left_hip,joints.right_hip);trackCenter=hp?{x:hp.x,y:hp.y}:{x:bbox.cx,y:bbox.cy};
    let snapshot=null;try{snapshot=cropCanvas.toDataURL("image/jpeg",.82)}catch(e){}
    frames.push({time:tm,joints,bbox,crop,snapshot,key_visibility:keyJointVisibility(joints)})
  };
  await new Promise(async(resolve,reject)=>{
    const timeout=setTimeout(()=>{if(!done){try{video.pause()}catch{}reject(new Error(lang==="th"?"การอ่านวิดีโอใช้เวลานานเกินไป":"Video analysis timed out"))}},Math.max(70000,duration*7000));
    const finish=()=>{if(done)return;done=true;clearTimeout(timeout);try{video.pause()}catch{}resolve()};
    try{
      video.currentTime=0;video.playbackRate=2;
      if("requestVideoFrameCallback" in HTMLVideoElement.prototype){const loop=(_,meta)=>{if(done)return;const tm=Math.min(meta.mediaTime??video.currentTime,duration);try{capture(tm)}catch(e){clearTimeout(timeout);reject(e);return}if(video.currentTime>=duration||video.ended){finish();return}video.requestVideoFrameCallback(loop)};video.requestVideoFrameCallback(loop)}
      else{const loop=()=>{if(done)return;try{capture(Math.min(video.currentTime,duration))}catch(e){clearTimeout(timeout);reject(e);return}if(video.currentTime>=duration||video.ended){finish();return}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
      video.onended=finish;await video.play()
    }catch(e){clearTimeout(timeout);reject(e)}
  });
  URL.revokeObjectURL(url);
  const q=qualityReport(frames,attempted);renderQuality(q);
  if(!q.passed){const err=new Error(t("qualityFail"));err.quality=q;throw err}
  analysisFrames=frames;actionSnapshots.clear();
  const a=coarseCompute(frames,q);a.video_duration=video.duration;
  for(const action of a.actions){const fr=frames[action.frame_index];if(fr?.snapshot)actionSnapshots.set(action.id,fr.snapshot)}
  return a
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

function expandedPlayerCrop(box){
  if(!box)return{x:0,y:0,w:1,h:1};
  const mx=Math.max(.08,box.w*.65),my=Math.max(.08,box.h*.35);
  let x=Math.max(0,box.x-mx),y=Math.max(0,box.y-my);
  let x2=Math.min(1,box.x+box.w+mx),y2=Math.min(1,box.y+box.h+my);
  if(x2-x<.25){const c=(x+x2)/2;x=Math.max(0,c-.125);x2=Math.min(1,c+.125)}
  if(y2-y<.40){const c=(y+y2)/2;y=Math.max(0,c-.20);y2=Math.min(1,c+.20)}
  return{x,y,w:x2-x,h:y2-y}
}
function remapCropLandmarks(arr,crop){
  const d={};
  for(const [name,i] of Object.entries(IDX)){
    const p=arr?.[i];if(!p)continue;
    d[name]={x:crop.x+p.x*crop.w,y:crop.y+p.y*crop.h,z:p.z??0,visibility:p.visibility??p.presence??1}
  }
  return d
}
function loadDataImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("snapshot decode failed"));img.src=url})}
async function measureCurrentFrame(){
  if(!currentAnalysis||!currentFile)return false;
  const action=currentAnalysis.actions?.[currentActionIndex]||null,frame=analysisFrames[selectedFrameIndex]||analysisFrames[action?.frame_index];
  if(!action||!frame?.snapshot){showStatus(t("preciseFail"),"error");return false}
  const pl=await initPrecise();showStatus(t("measuring"),"loading");
  try{
    const img=await loadDataImage(frame.snapshot),r=pl.detect(img),lm=r.landmarks?.[0],wm=r.worldLandmarks?.[0];if(!lm||!wm)throw new Error(t("preciseFail"));
    const crop=frame.crop,imageJ=remapCropLandmarks(lm,crop),worldJ=dictFromLandmarks(wm),side=action.side||currentAnalysis.hitting_side,metrics=preciseMetrics(imageJ,worldJ,side);
    const confs=Object.values(metrics).map(m=>m.confidence).filter(Number.isFinite);
    const precise={time:round(frame.time,3),image_joints:imageJ,world_joints:worldJ,metrics,pose_confidence:round(confs.reduce((a,b)=>a+b,0)/(confs.length||1),3),
      camera_view:$("#cameraView")?.value||"unknown",model:"pose_landmarker_full",crop,action_type:action.type,action_id:action.id,side,source_frame_index:selectedFrameIndex};
    action.precise=precise;actionSnapshots.set(action.id,frame.snapshot);currentAnalysis.precise=precise;currentAnalysis.contact_time=precise.time;currentAnalysis.hitting_side=side;
    renderSkillMap();renderPrecise();drawZoomOverlay();renderKeyFrames();renderMeasurementReview();renderEvaluation();renderCoachReport();renderCourtPosition();await saveCurrentMeasurement();
    $("#measurementMode").textContent=t("frameMeasured")+" · "+precise.time+"s · "+t("reliableResult");$("#cropBadge").classList.remove("hidden");
    const v=$("#resultVideo");if(v?.videoWidth){try{v.currentTime=precise.time}catch(e){};setTimeout(drawOverlay,250)}
    showStatus($("#saveProgress").checked?t("saved"):t("notSaved"),"success");return true
  }catch(e){console.error(e);$("#cropBadge").classList.add("hidden");showStatus(t("preciseFail"),"error");return false}
}

function actionReviewState(action){
  const p=action?.precise;
  if(!p)return"insufficient";
  let review=p.pose_confidence<.72;
  if(action.type==="overhead"||action.type==="jump_overhead"){
    const j=p.image_joints,side=p.side||action.side,w=j?.[side+"_wrist"],sh=j?.[side+"_shoulder"];
    if(!w||!sh||w.y>=sh.y-.02)review=true;
    if(action.sequence?.enough&&!action.sequence.ordered)review=true;
    const e=p.metrics?.elbow_3d?.value;
    if(e!=null&&(e>175||e<115))review=true
  }
  if(currentAnalysis?.movement_type!=="standing"&&action.recovery_time==null)review=true;
  return review?"review":"good"
}
async function preciseForAction(action,frame,pl){
  if(!action||!frame?.snapshot)return null;
  const img=await loadDataImage(frame.snapshot);
  const r=pl.detect(img),lm=r.landmarks?.[0],wm=r.worldLandmarks?.[0];
  if(!lm||!wm)return null;
  const crop=frame.crop,imageJ=remapCropLandmarks(lm,crop),worldJ=dictFromLandmarks(wm),side=action.side||currentAnalysis?.hitting_side||"right";
  const metrics=preciseMetrics(imageJ,worldJ,side);
  const confs=Object.values(metrics).map(m=>m.confidence).filter(Number.isFinite);
  return{
    time:round(frame.time,3),image_joints:imageJ,world_joints:worldJ,metrics,
    pose_confidence:round(confs.reduce((a,b)=>a+b,0)/(confs.length||1),3),
    camera_view:$("#cameraView")?.value||"unknown",model:"pose_landmarker_full",
    crop,action_type:action.type,action_id:action.id,side,source_frame_index:action.frame_index
  }
}
async function preMeasureActions(analysis){
  const pl=await initPrecise();
  let measured=0;
  for(let i=0;i<analysis.actions.length;i++){
    const action=analysis.actions[i],frame=analysisFrames[action.frame_index];
    showStatus(t("analyzingActions")+" "+(i+1)+"/"+analysis.actions.length,"loading");
    try{
      const precise=await preciseForAction(action,frame,pl);
      if(precise){
        action.precise=precise;
        actionSnapshots.set(action.id,frame.snapshot);
        measured++
      }
    }catch(e){console.warn("precise action failed",i,e)}
  }
  analysis.measured_count=measured;
  analysis.review_count=analysis.actions.filter(a=>actionReviewState(a)==="review").length;
  if(!measured)throw new Error(t("allActionsFailed"));
  return measured
}
function renderAnalysisOverview(){
  const a=currentAnalysis;if(!a)return;
  const measured=a.actions.filter(x=>x.precise).length;
  const review=a.actions.filter(x=>actionReviewState(x)==="review").length;
  $("#analysisOverview").innerHTML=
    "<div class='overview-stat'><strong>"+a.actions.length+"</strong><span>"+t("actionsFound")+"</span></div>"+
    "<div class='overview-stat'><strong>"+measured+"</strong><span>"+t("measuredActions")+"</span></div>"+
    "<div class='overview-stat "+(review?"warn":"ok")+"'><strong>"+review+"</strong><span>"+t("reviewActions")+"</span></div>"+
    "<p class='overview-note'>"+t("multiActionSummary")+"</p>"
}

function renderSkillMap(){
  const actions=currentAnalysis?.actions||[];
  $("#playerTrackState").innerHTML="<b>"+t("trackedPlayer")+"</b> · "+t("actionsFound")+" "+actions.length+" "+t("actionUnit")+"<br><span>"+t("primaryPlayerHelp")+"</span><br><span>"+t("skillMapCaution")+"</span>";
  if(!actions.length){$("#skillTimeline").innerHTML="<p>"+t("noAction")+"</p>";return}
  $("#skillTimeline").innerHTML=actions.map((a,i)=>{
    const state=actionReviewState(a);
    const stateText=state==="good"?t("actionGood"):state==="review"?t("actionReview"):t("actionNoMeasure");
    return "<button type='button' class='skill-chip "+(i===currentActionIndex?"active ":"")+"state-"+state+"' data-action-index='"+i+"'>"+
      "<span class='skill-num'>"+(i+1)+"</span><span class='skill-copy'><b>"+actionLabel(a.type)+"</b>"+
      "<small>"+a.time+"s · "+t(a.side)+" · "+pct(a.confidence)+"</small>"+
      "<em>"+stateText+" · "+(a.clip_start??0).toFixed(1)+"–"+(a.clip_end??0).toFixed(1)+"s</em></span></button>"
  }).join("");
  $$("[data-action-index]").forEach(btn=>btn.addEventListener("click",()=>selectAction(Number(btn.dataset.actionIndex))))
}

function nearestAnalysisFrame(time){
  if(!analysisFrames.length)return null;
  let best=analysisFrames[0],d=Math.abs(best.time-time);
  for(const f of analysisFrames){const nd=Math.abs(f.time-time);if(nd<d){best=f;d=nd}}
  return best
}
function interpolatedAnalysisFrame(time){
  if(!analysisFrames.length)return null;
  const first=analysisFrames[0],last=analysisFrames[analysisFrames.length-1];
  if(time<=first.time)return first;if(time>=last.time)return last;
  let lo=0,hi=analysisFrames.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(analysisFrames[m].time<=time)lo=m;else hi=m}
  const a=analysisFrames[lo],b=analysisFrames[hi],gap=b.time-a.time;
  if(!Number.isFinite(gap)||gap<=0||gap>.30)return Math.abs(time-a.time)<=Math.abs(b.time-time)?a:b;
  const u=clamp((time-a.time)/gap,0,1),joints={};
  const names=new Set([...Object.keys(a.joints||{}),...Object.keys(b.joints||{})]);
  for(const name of names){
    const A=a.joints?.[name],B=b.joints?.[name];
    if(A&&B)joints[name]={x:A.x+(B.x-A.x)*u,y:A.y+(B.y-A.y)*u,z:(A.z??0)+((B.z??0)-(A.z??0))*u,visibility:(A.visibility??1)+((B.visibility??1)-(A.visibility??1))*u};
    else if(A||B)joints[name]=A||B
  }
  const near=u<.5?a:b;
  return{time,joints,bbox:poseBox(joints)||near.bbox,crop:near.crop}
}
function live2DMetrics(j,side){
  if(!j)return null;
  return{
    elbow:round(angle2(j[side+"_shoulder"],j[side+"_elbow"],j[side+"_wrist"])),
    shoulder:round(angle2(j[side+"_hip"],j[side+"_shoulder"],j[side+"_elbow"])),
    leftKnee:round(angle2(j.left_hip,j.left_knee,j.left_ankle)),
    rightKnee:round(angle2(j.right_hip,j.right_knee,j.right_ankle))
  }
}
function drawTrackedPose(ctx,w,h,j,side,metrics,modeLabel){
  if(!ctx||!j)return;
  const xy=q=>[q.x*w,q.y*h];
  const pairs=[["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["left_shoulder","left_hip"],["right_shoulder","right_hip"],["left_hip","right_hip"],["left_hip","left_knee"],["left_knee","left_ankle"],["right_hip","right_knee"],["right_knee","right_ankle"]];
  ctx.save();ctx.strokeStyle="rgba(34,197,94,.96)";ctx.fillStyle="rgba(34,197,94,.96)";ctx.lineWidth=Math.max(3,w/260);
  pairs.forEach(([a,b])=>{if(!visible(j[a])||!visible(j[b]))return;const A=xy(j[a]),B=xy(j[b]);ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke()});
  Object.values(j).forEach(q=>{if(!visible(q))return;const P=xy(q);ctx.beginPath();ctx.arc(P[0],P[1],Math.max(4,w/210),0,Math.PI*2);ctx.fill()});
  function arc(a,b,c,value){
    if(value==null||!visible(j[a])||!visible(j[b])||!visible(j[c]))return;
    const A=xy(j[a]),B=xy(j[b]),C=xy(j[c]),r=Math.max(28,w/17);
    let st=Math.atan2(A[1]-B[1],A[0]-B[0]),en=Math.atan2(C[1]-B[1],C[0]-B[0]),delta=en-st;
    while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
    ctx.save();ctx.strokeStyle="rgba(245,158,11,.98)";ctx.fillStyle="#fff";ctx.lineWidth=Math.max(3,w/260);
    ctx.beginPath();ctx.arc(B[0],B[1],r,st,st+delta,delta<0);ctx.stroke();
    const mid=st+delta/2,tx=B[0]+Math.cos(mid)*(r+20),ty=B[1]+Math.sin(mid)*(r+20),label=value+"°";
    ctx.font="800 "+Math.max(14,Math.round(w/48))+"px -apple-system,sans-serif";ctx.strokeStyle="rgba(0,0,0,.78)";ctx.lineWidth=5;ctx.strokeText(label,tx,ty);ctx.fillText(label,tx,ty);ctx.restore()
  }
  arc(side+"_shoulder",side+"_elbow",side+"_wrist",metrics?.elbow);
  arc(side+"_hip",side+"_shoulder",side+"_elbow",metrics?.shoulder);
  arc("left_hip","left_knee","left_ankle",metrics?.leftKnee);
  arc("right_hip","right_knee","right_ankle",metrics?.rightKnee);
  if(modeLabel){
    ctx.font="800 "+Math.max(13,Math.round(w/55))+"px -apple-system,sans-serif";
    const tw=ctx.measureText(modeLabel).width+18,x=Math.max(8,w-tw-10),y=10;
    ctx.fillStyle="rgba(15,23,42,.82)";ctx.fillRect(x,y,tw,28);ctx.fillStyle="#fff";ctx.fillText(modeLabel,x+9,y+19)
  }
  ctx.restore()
}
function replayPhase(time,contactTime){
  const d=time-contactTime;
  if(d<=-.34)return{role:"preparation",label:t("keyPreparation")};
  if(d<=-.18)return{role:"load",label:t("keyLoad")};
  if(d<=-.045)return{role:"swing",label:t("keySwing")};
  if(d<=.09)return{role:"contact",label:t("keyContact")};
  if(d<=.27)return{role:"followthrough",label:t("keyFollowThrough")};
  return{role:"recovery",label:t("keyRecovery")}
}
function replayFrameDelay(){
  if(replayIndex>=replayFrames.length-1)return 180;
  const dt=Math.max(.05,replayFrames[replayIndex+1].time-replayFrames[replayIndex].time);
  return clamp(dt/Math.max(.1,replaySpeed)*1000,120,700)
}
function updateReplayControls(){
  const play=$("#playSegmentBtn"),speed=$("#replaySpeedSelect"),meta=$("#replayFrameMeta");
  if(play)play.textContent=replayPlaying?t("pauseSegment"):t("playSegment");
  if(speed)speed.value=String(replaySpeed);
  if(meta&&replayFrames.length){
    const action=currentAnalysis?.actions?.[currentActionIndex],fr=replayFrames[replayIndex],phase=replayPhase(fr.time,action?.time??fr.time);
    meta.textContent=phase.label+" · "+t("keyFrameTime")+" "+fr.time.toFixed(2)+"s · "+(replayIndex+1)+"/"+replayFrames.length
  }
}
function nearestAnalysisFrameEntry(time){
  if(!analysisFrames.length)return null;
  let index=0,d=Math.abs(analysisFrames[0].time-time);
  for(let i=1;i<analysisFrames.length;i++){const nd=Math.abs(analysisFrames[i].time-time);if(nd<d){index=i;d=nd}}
  return{frame:analysisFrames[index],index}
}
function localizeJointsToCrop(joints,crop){
  const c=crop||{x:0,y:0,w:1,h:1},out={};
  for(const [name,q] of Object.entries(joints||{})){
    out[name]={...q,x:(q.x-c.x)/Math.max(.0001,c.w),y:(q.y-c.y)/Math.max(.0001,c.h)}
  }
  return out
}
function focusedPhaseMetrics(role,m){
  const out={elbow:null,shoulder:null,leftKnee:null,rightKnee:null};
  if(role==="preparation"||role==="swing"||role==="contact"||role==="followthrough"){out.elbow=m?.elbow??null;out.shoulder=m?.shoulder??null}
  if(role==="load"){
    out.shoulder=m?.shoulder??null;
    if((m?.leftKnee??999)<=(m?.rightKnee??999))out.leftKnee=m?.leftKnee??null;else out.rightKnee=m?.rightKnee??null
  }
  if(role==="recovery"){
    if((m?.leftKnee??999)<=(m?.rightKnee??999))out.leftKnee=m?.leftKnee??null;else out.rightKnee=m?.rightKnee??null
  }
  return out
}
function drawMiniTracker(){
  const img=$("#skillReplayImage"),c=$("#miniTrackCanvas"),phaseBadge=$("#replayPhaseBadge");
  const action=currentAnalysis?.actions?.[currentActionIndex],fr=replayFrames[replayIndex];
  if(!img||!c||!action||!fr?.snapshot)return;
  const phase=replayPhase(fr.time,action.time),side=action.side||currentAnalysis?.hitting_side||"right";
  const metrics=live2DMetrics(fr.joints,side),focus=focusedPhaseMetrics(phase.role,metrics);
  const draw=()=>{
    const w=img.naturalWidth||640,h=img.naturalHeight||480;c.width=w;c.height=h;
    const ctx=c.getContext("2d");ctx.clearRect(0,0,w,h);
    const localJ=localizeJointsToCrop(fr.joints,fr.crop);
    drawTrackedPose(ctx,w,h,localJ,side,focus,phase.label+" · 2D");
    if(phaseBadge)phaseBadge.textContent=phase.label
  };
  img.onload=draw;img.src=fr.snapshot;if(img.complete&&img.naturalWidth)draw();
  updateReplayControls()
}
function stopSkillReplay(){
  if(replayTimer){clearTimeout(replayTimer);replayTimer=null}
  replayPlaying=false;updateReplayControls()
}
function scheduleSkillReplay(){
  if(!replayPlaying)return;
  if(replayIndex>=replayFrames.length-1){
    if(segmentLoop)replayIndex=0;else{stopSkillReplay();return}
  }else replayIndex++;
  drawMiniTracker();
  replayTimer=setTimeout(scheduleSkillReplay,replayFrameDelay())
}
function setupMiniClip(action){
  stopSkillReplay();
  if(!action)return;
  segmentStart=action.clip_start??Math.max(0,action.time-.8);
  segmentEnd=action.clip_end??Math.min(currentAnalysis?.video_duration||action.time+1,action.time+1);
  replayFrames=analysisFrames.filter(f=>f.time>=segmentStart-.001&&f.time<=segmentEnd+.001&&f.snapshot);
  if(!replayFrames.length){const near=nearestAnalysisFrameEntry(action.time);replayFrames=near?.frame?[near.frame]:[]}
  let best=0,d=Infinity;replayFrames.forEach((f,i)=>{const nd=Math.abs(f.time-action.time);if(nd<d){d=nd;best=i}});
  replayIndex=best;
  $("#miniClipBadge").textContent=(currentActionIndex+1)+". "+actionLabel(action.type);
  $("#segmentMeta").textContent=t("segmentRange")+": "+segmentStart.toFixed(2)+"–"+segmentEnd.toFixed(2)+"s · "+t("segmentDuration")+": "+(segmentEnd-segmentStart).toFixed(2)+"s";
  drawMiniTracker()
}
function playCurrentSegment(){
  if(!replayFrames.length)return;
  if(replayPlaying){stopSkillReplay();return}
  if(replayIndex>=replayFrames.length-1)replayIndex=0;
  replayPlaying=true;updateReplayControls();
  replayTimer=setTimeout(scheduleSkillReplay,replayFrameDelay())
}
function stepReplay(direction){
  stopSkillReplay();
  if(!replayFrames.length)return;
  replayIndex=clamp(replayIndex+(direction<0?-1:1),0,replayFrames.length-1);
  drawMiniTracker()
}
function setReplaySpeed(value){
  const v=Number(value);if(![.25,.35,.5].includes(v))return;
  replaySpeed=v;updateReplayControls();
  if(replayPlaying){if(replayTimer)clearTimeout(replayTimer);replayTimer=setTimeout(scheduleSkillReplay,replayFrameDelay())}
}
function renderKeyFrames(){
  const grid=$("#keyFrameGrid");if(!grid)return;
  const action=currentAnalysis?.actions?.[currentActionIndex];if(!action){grid.innerHTML="<p class='note'>"+t("keyNoFrame")+"</p>";return}
  const precise=currentAnalysis?.precise;
  const contactIndex=Number.isInteger(precise?.source_frame_index)?precise.source_frame_index:(Number.isInteger(selectedFrameIndex)?selectedFrameIndex:action.frame_index);
  const contactFrame=analysisFrames[contactIndex]||analysisFrames[action.frame_index];
  const contactTime=contactFrame?.time??action.time;
  const defs=[
    {label:t("keyPreparation"),role:"preparation",offset:-.48},
    {label:t("keyLoad"),role:"load",offset:-.28},
    {label:t("keySwing"),role:"swing",offset:-.10},
    {label:t("keyContact"),role:"contact",offset:0},
    {label:t("keyFollowThrough"),role:"followthrough",offset:.16},
    {label:t("keyRecovery"),role:"recovery",offset:.42}
  ];
  const cards=defs.map((d,i)=>{
    const entry=d.role==="contact"&&contactFrame?{frame:contactFrame,index:contactIndex}:nearestAnalysisFrameEntry(contactTime+d.offset);
    const frame=entry?.frame;
    if(!frame?.snapshot)return{...d,i,empty:true};
    const isPrecise=d.role==="contact"&&precise&&entry.index===precise.source_frame_index;
    const side=(isPrecise?precise.side:null)||action.side||currentAnalysis.hitting_side||"right";
    const sourceJ=isPrecise?precise.image_joints:frame.joints;
    const baseMetrics=isPrecise?{
      elbow:precise.metrics?.elbow_3d?.value,shoulder:precise.metrics?.shoulder_3d?.value,
      leftKnee:precise.metrics?.left_knee_3d?.value,rightKnee:precise.metrics?.right_knee_3d?.value
    }:live2DMetrics(sourceJ,side);
    const focus=focusedPhaseMetrics(d.role,baseMetrics);
    return{...d,i,frame,index:entry.index,isPrecise,side,sourceJ,baseMetrics,focus}
  });
  const val=v=>v==null?"—":v.toFixed?Number(v).toFixed(1):v;
  grid.innerHTML=cards.map(c=>{
    if(c.empty)return"<article class='key-frame-card'><div class='key-frame-head'><b>"+c.label+"</b></div><p class='note'>"+t("keyNoFrame")+"</p></article>";
    const m=c.baseMetrics||{},mode=c.isPrecise?t("keyFrame3D"):t("keyFrame2D");
    return"<article class='key-frame-card' data-key-index='"+c.index+"'>"+
      "<div class='key-frame-head'><b>"+c.label+"</b><span>"+t("keyFrameTime")+" "+c.frame.time.toFixed(2)+"s</span></div>"+
      "<div class='key-frame-stage'><img id='keyFrameImg"+c.i+"' alt='"+c.label+"'><canvas id='keyFrameCanvas"+c.i+"'></canvas></div>"+
      "<div class='key-frame-mode'>"+mode+"</div>"+
      "<div class='key-frame-metrics'>"+
        "<span>"+t("obsElbow")+"<b>"+val(m.elbow)+"°</b></span>"+
        "<span>"+t("obsShoulder")+"<b>"+val(m.shoulder)+"°</b></span>"+
        "<span>"+t("obsLeftKnee")+"<b>"+val(m.leftKnee)+"°</b></span>"+
        "<span>"+t("obsRightKnee")+"<b>"+val(m.rightKnee)+"°</b></span>"+
      "</div></article>"
  }).join("");
  requestAnimationFrame(()=>cards.forEach(c=>{
    if(c.empty)return;
    const img=$("#keyFrameImg"+c.i),canvas=$("#keyFrameCanvas"+c.i);if(!img||!canvas)return;
    const draw=()=>{
      const w=img.naturalWidth||640,h=img.naturalHeight||480;canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d");ctx.clearRect(0,0,w,h);
      const localJ=localizeJointsToCrop(c.sourceJ,c.frame.crop);
      drawTrackedPose(ctx,w,h,localJ,c.side,c.focus,c.isPrecise?t("keyFrame3D"):t("keyFrame2D"))
    };
    img.addEventListener("load",draw,{once:true});img.src=c.frame.snapshot;if(img.complete&&img.naturalWidth)draw()
  }));
  $$("[data-key-index]").forEach(card=>card.addEventListener("click",()=>{
    const idx=Number(card.dataset.keyIndex);if(!Number.isInteger(idx))return;
    selectedFrameIndex=idx;
    const fr=analysisFrames[idx],v=$("#resultVideo");if(v&&fr){try{v.currentTime=fr.time}catch(e){}}
    $("#measurementMode").textContent=t("confirmContact")+" · "+(fr?.time??0).toFixed(3)+"s"
  }))
}

async function selectAction(index){
  const actions=currentAnalysis?.actions||[];if(!actions[index])return false;
  currentActionIndex=index;const a=actions[index];
  selectedFrameIndex=Number.isInteger(a.precise?.source_frame_index)?a.precise.source_frame_index:a.frame_index;
  currentAnalysis.hitting_side=a.side;currentAnalysis.contact_time=a.time;currentAnalysis.precise=a.precise||null;
  renderSkillMap();renderResultTextOnly();renderPrecise();setupMiniClip(a);renderKeyFrames();
  if(a.precise){
    drawZoomOverlay();renderMeasurementReview();renderEvaluation();renderCoachReport();renderCourtPosition();
    $("#measurementMode").textContent=t("measuredAt")+" "+a.precise.time+"s";return true
  }
  return await measureCurrentFrame()
}

async function renderResult(a){
  currentAnalysis=a;$("#analysisCard").classList.add("hidden");
  if(resultURL)URL.revokeObjectURL(resultURL);resultURL=URL.createObjectURL(currentFile);
  await preMeasureActions(a);
  const firstMeasured=Math.max(0,a.actions.findIndex(x=>x.precise));
  currentActionIndex=firstMeasured;selectedFrameIndex=a.actions[firstMeasured]?.frame_index||0;
  $("#movementBadge").textContent=movementLabel(a.movement_type);
  $("#poseBadge").textContent=t("movementConfidence")+" "+pct(a.movement_confidence);
  renderSkillMap();renderAnalysisOverview();renderResultTextOnly();
  $("#measurementMode").textContent=t("modeCoarse")+" → "+t("modePrecise")+" · "+t("cropMeasure");
  $("#referenceState").innerHTML="<div class='reference-lock'><b>"+t("referencePending")+"</b><p>"+t("referenceNeed")+"</p></div>";
  $("#nextActions").innerHTML="<ol class='next-list'><li>"+t("next1")+"</li><li>"+t("next2")+"</li><li>"+t("next3")+"</li></ol>";
  const ok=await selectAction(firstMeasured);if(!ok){$("#analysisCard").classList.add("hidden");throw new Error(t("preciseFail"))}
  const v=$("#resultVideo");v.src=resultURL;v.onloadedmetadata=()=>{try{v.currentTime=currentAnalysis.precise?.time||a.contact_time}catch(e){};setTimeout(drawOverlay,300)};
  setupMiniClip(a.actions[firstMeasured]);
  $("#analysisCard").classList.remove("hidden");
  setTimeout(()=>$("#analysisCard").scrollIntoView({behavior:"smooth",block:"start"}),120)
}

function renderPrecise(){
  const p=currentAnalysis?.precise;if(!p){$("#angleCards").innerHTML="<p>"+t("noPrecise")+"</p>";$("#metricsGrid").innerHTML="";$("#poseBadge").textContent=t("movementConfidence")+" "+pct(currentAnalysis?.movement_confidence);return}
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

function drawZoomOverlay(){
  const p=currentAnalysis?.precise,z=$("#zoomCanvas"),imgEl=$("#zoomImage"),status=$("#zoomStatus");
  if(!p||!z||!imgEl)return;
  const action=currentAnalysis.actions?.[currentActionIndex],snapshot=action?actionSnapshots.get(action.id):null;
  if(!snapshot){status.textContent=t("zoomWaiting");status.classList.remove("hidden");return}
  imgEl.onload=()=>{
    const w=imgEl.naturalWidth||640,h=imgEl.naturalHeight||480;
    z.width=w;z.height=h;z.style.width="100%";z.style.height="100%";
    status.textContent=t("zoomReady");status.classList.add("hidden");
    const ctx=z.getContext("2d");ctx.clearRect(0,0,w,h);if(!overlayVisible)return;
    const crop=p.crop||{x:0,y:0,w:1,h:1},j=p.image_joints;
    const local=q=>[(q.x-crop.x)/crop.w*w,(q.y-crop.y)/crop.h*h];
    const pairs=[["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["left_shoulder","left_hip"],["right_shoulder","right_hip"],["left_hip","right_hip"],["left_hip","left_knee"],["left_knee","left_ankle"],["right_hip","right_knee"],["right_knee","right_ankle"]];
    ctx.strokeStyle="rgba(34,197,94,.98)";ctx.fillStyle="rgba(34,197,94,.98)";ctx.lineWidth=Math.max(4,w/170);
    pairs.forEach(([a,b])=>{if(!visible(j[a])||!visible(j[b]))return;const A=local(j[a]),B=local(j[b]);ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke()});
    Object.values(j).forEach(q=>{if(!visible(q))return;const P=local(q);ctx.beginPath();ctx.arc(P[0],P[1],Math.max(6,w/140),0,Math.PI*2);ctx.fill()});
    function angleArc(a,b,c,label){
      if(!visible(j[a])||!visible(j[b])||!visible(j[c]))return;
      const A=local(j[a]),B=local(j[b]),C=local(j[c]),r=Math.max(42,w/8.5);
      let st=Math.atan2(A[1]-B[1],A[0]-B[0]),en=Math.atan2(C[1]-B[1],C[0]-B[0]),delta=en-st;
      while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
      ctx.save();ctx.strokeStyle="rgba(245,158,11,.99)";ctx.lineWidth=Math.max(5,w/150);
      ctx.beginPath();ctx.arc(B[0],B[1],r,st,st+delta,delta<0);ctx.stroke();
      const md=st+delta/2,tx=B[0]+Math.cos(md)*(r+30),ty=B[1]+Math.sin(md)*(r+30);
      ctx.font="900 "+Math.max(20,Math.round(w/26))+"px -apple-system,sans-serif";ctx.lineWidth=6;ctx.strokeStyle="rgba(0,0,0,.78)";ctx.strokeText(label,tx,ty);ctx.fillStyle="#fff";ctx.fillText(label,tx,ty);ctx.restore()
    }
    const side=p.side||currentAnalysis.hitting_side,m=p.metrics;
    angleArc(side+"_shoulder",side+"_elbow",side+"_wrist",(m.elbow_3d.value??"—")+"°");
    angleArc(side+"_hip",side+"_shoulder",side+"_elbow",(m.shoulder_3d.value??"—")+"°")
  };
  imgEl.src=snapshot
}

function renderCourtPosition(){
  const p=currentAnalysis?.precise,box=$("#courtPosition");
  if(!p||!box){return}
  if(!courtHomography){box.innerHTML="<p class='note'>"+t("courtCalOptional")+"</p>";return}
  const j=p.image_joints,foot=mid2(j.left_ankle,j.right_ankle);
  if(!foot){box.innerHTML="<p class='note'>"+t("evaluationInsufficient")+"</p>";return}
  const cp=courtPointFromImage(foot);
  if(!cp||!Number.isFinite(cp.x)||!Number.isFinite(cp.y)){box.innerHTML="<p class='note'>"+t("evaluationInsufficient")+"</p>";return}
  const dnet=Math.abs(cp.y-6.70);
  box.innerHTML="<div class='court-position-card'><b>"+t("courtPositionTitle")+"</b><div class='court-values'><span>"+t("courtX")+": <strong>"+cp.x.toFixed(2)+" "+t("meter")+"</strong></span><span>"+t("courtY")+": <strong>"+cp.y.toFixed(2)+" "+t("meter")+"</strong></span><span>"+t("distanceNet")+": <strong>"+dnet.toFixed(2)+" "+t("meter")+"</strong></span></div><p>"+t("courtEvidence")+"</p></div>"
}
function evaluateCurrentAction(){
  const action=currentAnalysis?.actions?.[currentActionIndex],p=currentAnalysis?.precise;
  if(!action||!p)return{status:"insufficient",checks:[]};
  const checks=[],add=(key,status,detail)=>checks.push({key,status,detail});
  add("checkPose",p.pose_confidence>=.75?"pass":"review",p.pose_confidence>=.75?t("posePass"):t("poseReview"));
  if(action.type==="overhead"||action.type==="jump_overhead"){
    const j=p.image_joints,side=p.side||action.side,w=j[side+"_wrist"],sh=j[side+"_shoulder"];
    const contactOK=!!(w&&sh&&w.y<sh.y-.02);
    add("checkContact",contactOK?"pass":"review",contactOK?t("contactPass"):t("contactReview"));
    if(action.sequence?.enough)add("checkSequence",action.sequence.ordered?"pass":"review",action.sequence.ordered?t("sequencePass"):t("sequenceReview"));
    else add("checkSequence","insufficient",t("evaluationInsufficient"));
    const e=p.metrics.elbow_3d?.value;
    if(e==null)add("checkElbow","insufficient",t("evaluationInsufficient"));
    else if(e>175)add("checkElbow","review",t("elbowReview"));
    else if(e<115)add("checkElbow","review",t("elbowEarly"));
    else add("checkElbow","pass",t("elbowPass"))
  }
  if(currentAnalysis.movement_type!=="standing"){
    add("checkRecovery",action.recovery_time!=null?"pass":"review",action.recovery_time!=null?t("recoveryPass"):t("recoveryReview"))
  }
  const measurable=checks.filter(c=>c.status!=="insufficient"),reviews=measurable.filter(c=>c.status==="review").length;
  return{status:!measurable.length?"insufficient":reviews?"review":"good",checks}
}
function practiceForCheck(check,p){
  if(!check)return"";
  if(check.key==="checkPose")return t("reviewLowConf");
  if(check.key==="checkContact")return t("trainHighContact");
  if(check.key==="checkSequence")return t("trainSequence");
  if(check.key==="checkElbow"){
    const e=p?.metrics?.elbow_3d?.value;
    if(e!=null&&e>175)return t("trainElbowLock");
    return t("trainFrame")
  }
  if(check.key==="checkRecovery")return t("trainRecovery");
  return check.detail||""
}
function renderCoachReport(){
  const box=$("#coachReport");if(!box)return;
  const action=currentAnalysis?.actions?.[currentActionIndex],p=currentAnalysis?.precise;
  if(!action||!p){
    box.innerHTML="<div class='coach-report-head coach-insufficient'><div><span class='coach-kicker'>"+t("coachReportTitle")+"</span><h3>"+t("coachHeadlineInsufficient")+"</h3><p>"+t("remeasureFirst")+"</p></div><span class='coach-status'>"+t("coachStatusInsufficient")+"</span></div>";
    return
  }
  const e=evaluateCurrentAction(),passes=e.checks.filter(c=>c.status==="pass"),reviews=e.checks.filter(c=>c.status==="review");
  const priority=["checkContact","checkSequence","checkElbow","checkRecovery","checkPose"];
  reviews.sort((a,b)=>priority.indexOf(a.key)-priority.indexOf(b.key));
  const headline=e.status==="good"?t("coachHeadlineGood"):e.status==="review"?t("coachHeadlineReview"):t("coachHeadlineInsufficient");
  const statusText=e.status==="good"?t("coachStatusGood"):e.status==="review"?t("coachStatusReview"):t("coachStatusInsufficient");
  const statusClass=e.status==="good"?"coach-good":e.status==="review"?"coach-review":"coach-insufficient";
  const moment=actionLabel(action.type)+" · "+p.time.toFixed(2)+"s · "+t(action.side||currentAnalysis.hitting_side);
  const goodHtml=passes.length?passes.slice(0,3).map(c=>"<div class='coach-point pass'><span>✓</span><div><b>"+t(c.key)+"</b><p>"+c.detail+"</p></div></div>").join(""):"<p class='coach-empty'>"+t("noPassYet")+"</p>";
  const improveHtml=reviews.length?reviews.slice(0,3).map((c,i)=>"<div class='coach-point improve'><span>"+(i+1)+"</span><div><b>"+t(c.key)+"</b><p>"+practiceForCheck(c,p)+"</p><small>"+t("aiSaw")+": "+c.detail+"</small></div></div>").join(""):"<p class='coach-empty'>"+t("noImprove")+"</p>";
  const practice=[...new Set(reviews.map(c=>practiceForCheck(c,p)).filter(Boolean))];
  if(!practice.length)practice.push(t("trainGood"));
  const practiceHtml=practice.slice(0,3).map((x,i)=>"<div class='practice-step'><span>"+(i+1)+"</span><p>"+x+"</p></div>").join("");
  box.innerHTML=
    "<div class='coach-report-head "+statusClass+"'><div><span class='coach-kicker'>"+t("coachReportTitle")+"</span><h3>"+headline+"</h3><p>"+t("coachReportHelp")+"</p></div><span class='coach-status'>"+statusText+"</span></div>"+
    "<div class='coach-method'><b>"+t("coachMethodTitle")+"</b><span>"+t("coachMethodText")+"</span></div>"+
    "<div class='coach-facts'>"+
      "<div><small>"+t("selectedMoment")+"</small><strong>"+moment+"</strong></div>"+
      "<div><small>"+t("dataClarity")+"</small><strong>"+pct(p.pose_confidence)+"</strong></div>"+
      "<div><small>"+t("passedPoints")+"</small><strong>"+passes.length+"</strong></div>"+
      "<div><small>"+t("improvePoints")+"</small><strong>"+reviews.length+"</strong></div>"+
    "</div>"+
    "<div class='coach-columns'>"+
      "<section class='coach-column good'><h4>"+t("whatGood")+"</h4>"+goodHtml+"</section>"+
      "<section class='coach-column improve'><h4>"+t("whatImprove")+"</h4>"+improveHtml+"</section>"+
    "</div>"+
    "<section class='practice-plan'><div class='practice-title'><span>"+t("practicePriority")+"</span><h4>"+t("nextPractice")+"</h4></div>"+practiceHtml+"</section>"
}
function renderEvaluation(){
  const e=evaluateCurrentAction();
  const title=e.status==="good"?t("evaluationGood"):e.status==="review"?t("evaluationReview"):t("evaluationInsufficient");
  const cls=e.status==="good"?"eval-good":e.status==="review"?"eval-review":"eval-neutral";
  $("#evaluationSummary").innerHTML="<div class='evaluation-head "+cls+"'><b>"+title+"</b><span>"+t("evidenceNote")+"</span></div>";
  $("#checkList").innerHTML=e.checks.map(c=>{
    const label=c.status==="pass"?t("pass"):c.status==="review"?t("review"):t("insufficient");
    return"<div class='check-row-card "+c.status+"'><div><b>"+t(c.key)+"</b><p>"+c.detail+"</p></div><span>"+label+"</span></div>"
  }).join("")
}
function renderMeasurementReview(){
  const p=currentAnalysis?.precise,action=currentAnalysis?.actions?.[currentActionIndex];
  if(!p||!action){$("#adviceList").innerHTML="";return}
  const e=evaluateCurrentAction(),notes=[];
  if(p.pose_confidence<.75)notes.push(t("reviewLowConf"));
  const contact=e.checks.find(c=>c.key==="checkContact");
  const sequence=e.checks.find(c=>c.key==="checkSequence");
  const elbow=e.checks.find(c=>c.key==="checkElbow");
  const recovery=e.checks.find(c=>c.key==="checkRecovery");
  if(contact?.status==="review")notes.push(t("trainHighContact"));
  if(sequence?.status==="review")notes.push(t("trainSequence"));
  if(elbow?.status==="review"&&p.metrics.elbow_3d?.value>175)notes.push(t("trainElbowLock"));
  if(elbow?.status==="review"&&p.metrics.elbow_3d?.value<115)notes.push(t("trainFrame"));
  if(recovery?.status==="review")notes.push(t("trainRecovery"));
  if(!notes.length)notes.push(t("trainGood"));
  $("#adviceList").innerHTML="<p class='note'><b>"+t("trainingTitle")+"</b></p>"+notes.slice(0,3).map((n,i)=>"<div class='advice'><b>"+(i+1)+".</b> "+n+"</div>").join("")
}

function drawOverlay(){
  const p=currentAnalysis?.precise,v=$("#resultVideo"),c=$("#poseCanvas");if(!v||!c||!v.videoWidth)return;
  c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
  if(!overlayVisible||!v.paused){$("#cropBadge").classList.add("hidden");return}
  const preciseNow=!!(p&&Math.abs(v.currentTime-p.time)<=.065);
  const f=preciseNow?null:interpolatedAnalysisFrame(v.currentTime);
  const j=preciseNow?p.image_joints:f?.joints;if(!j){$("#cropBadge").classList.add("hidden");return}
  const side=(preciseNow?p.side:null)||currentAnalysis?.actions?.[currentActionIndex]?.side||currentAnalysis?.hitting_side||"right";
  const metrics=preciseNow?{
    elbow:p.metrics?.elbow_3d?.value,shoulder:p.metrics?.shoulder_3d?.value,
    leftKnee:null,rightKnee:null
  }:null;
  drawTrackedPose(ctx,c.width,c.height,j,side,metrics,preciseNow?t("preciseFrame3D"):t("liveTrackingSkeleton"));
  if(courtInverseHomography){
    ctx.save();ctx.strokeStyle="rgba(56,189,248,.72)";ctx.lineWidth=Math.max(2,c.width/360);
    const lines=[[[0,0],[6.1,0]],[[6.1,0],[6.1,13.4]],[[6.1,13.4],[0,13.4]],[[0,13.4],[0,0]],[[0,6.7],[6.1,6.7]],[[0,1.98],[6.1,1.98]],[[0,11.42],[6.1,11.42]],[[3.05,0],[3.05,13.4]]];
    for(const L of lines){const a=imagePointFromCourt(L[0][0],L[0][1]),b=imagePointFromCourt(L[1][0],L[1][1]);if(a&&b){ctx.beginPath();ctx.moveTo(a.x*c.width,a.y*c.height);ctx.lineTo(b.x*c.width,b.y*c.height);ctx.stroke()}}
    ctx.restore()
  }
  const box=preciseNow?poseBox(j):f?.bbox;
  if(box){
    const padX=Math.min(.04,box.w*.18),padY=Math.min(.05,box.h*.12),x=Math.max(0,box.x-padX),y=Math.max(0,box.y-padY),x2=Math.min(1,box.x+box.w+padX),y2=Math.min(1,box.y+box.h+padY);
    ctx.save();ctx.strokeStyle="rgba(56,189,248,.95)";ctx.lineWidth=Math.max(3,c.width/260);ctx.setLineDash([14,10]);
    ctx.strokeRect(x*c.width,y*c.height,(x2-x)*c.width,(y2-y)*c.height);ctx.restore()
  }
  $("#cropBadge").textContent=preciseNow?t("preciseFrame3D"):t("liveTrackingSkeleton");$("#cropBadge").classList.remove("hidden")
}
let resultOverlayToken=0;
function startResultOverlayLoop(){
  const v=$("#resultVideo"),token=++resultOverlayToken;if(!v)return;
  const tick=()=>{if(token!==resultOverlayToken)return;drawOverlay();if(v.paused||v.ended)return;if(typeof v.requestVideoFrameCallback==="function")v.requestVideoFrameCallback(tick);else requestAnimationFrame(tick)};
  tick()
}
function stopResultOverlayLoop(){resultOverlayToken++;drawOverlay()}
async function stepFrame(direction){
  if(!currentAnalysis||!analysisFrames.length)return;
  selectedFrameIndex=clamp(selectedFrameIndex+(direction<0?-1:1),0,analysisFrames.length-1);
  const frame=analysisFrames[selectedFrameIndex],action=currentAnalysis.actions?.[currentActionIndex];
  if(action)action.precise=null;currentAnalysis.precise=null;renderPrecise();renderKeyFrames();renderCoachReport();
  const c=$("#poseCanvas");if(c){const ctx=c.getContext("2d");ctx&&ctx.clearRect(0,0,c.width,c.height)}
  $("#zoomImage").src=frame.snapshot||"";$("#zoomStatus").textContent=t("measureFrame");$("#zoomStatus").classList.toggle("hidden",!!frame.snapshot);
  renderMeasurementReview();renderEvaluation();$("#measurementMode").textContent=t("confirmContact")+" · "+frame.time.toFixed(3)+"s";
  const v=$("#resultVideo");if(v?.duration){try{v.currentTime=frame.time}catch(e){}}
}

async function jumpToAIFrame(){
  if(!currentAnalysis)return;
  const a=currentAnalysis.actions?.[currentActionIndex];if(!a)return;
  selectedFrameIndex=a.frame_index;a.precise=null;currentAnalysis.precise=null;await measureCurrentFrame()
}

function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("skillcam-local",3);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("sessions"))db.createObjectStore("sessions",{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putSession(s){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("sessions","readwrite");tx.objectStore("sessions").put(s);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function saveCurrentMeasurement(){
  if(!$("#saveProgress").checked||!currentAnalysis?.precise)return;
  if(!currentSessionId)currentSessionId=crypto.randomUUID();
  await putSession({id:currentSessionId,player_name:$("#playerName").value.trim()||"Player",analysis:currentAnalysis,created_at:new Date().toISOString()})
}
async function getSessions(){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction("sessions").objectStore("sessions").getAll();r.onsuccess=()=>resolve((r.result||[]).filter(x=>["v13","v14","v15","v16","v17"].includes(x.analysis?.version)&&x.analysis?.precise).sort((a,b)=>b.created_at.localeCompare(a.created_at)));r.onerror=()=>reject(r.error)})}

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
  if(currentAnalysis){renderSkillMap();renderAnalysisOverview();renderResultTextOnly();renderPrecise();setupMiniClip(currentAnalysis.actions?.[currentActionIndex]);renderKeyFrames();renderCoachReport();updateReplayControls()}
}
function renderResultTextOnly(){
  const a=currentAnalysis;if(!a)return;
  const action=a.actions?.[currentActionIndex]||null;
  $("#movementBadge").textContent=movementLabel(a.movement_type);
  let s="<p><b>"+(action?actionLabel(action.type):t("unknownAction"))+"</b> · "+t("contactAt")+" <b>"+(action?.time??a.contact_time)+" "+t("seconds")+"</b> · "+t("hittingSide")+": <b>"+t(action?.side||a.hitting_side)+"</b></p>";
  s+="<p class='note'>"+t("actionsFound")+" "+(a.actions?.length||0)+" "+t("actionUnit")+" · "+t("skillMapCaution")+"</p>";
  $("#summaryText").innerHTML=s;
  $("#footworkText").innerHTML="<p>"+(a.movement_type==="standing"?t("standingFoot"):a.movement_type==="jump_like"?t("jumpFoot"):t("movingFoot"))+"</p>";
  $("#referenceState").innerHTML="<div class='reference-lock'><b>"+t("referencePending")+"</b><p>"+t("referenceNeed")+"</p></div>";
  $("#nextActions").innerHTML="<ol class='next-list'><li>"+t("next1")+"</li><li>"+t("next2")+"</li><li>"+t("next3")+"</li></ol>";
  $("#contactWarning").textContent=t("confirmContact")
}

$("#languageSelect").addEventListener("change",e=>{lang=e.target.value;localStorage.setItem("skillcam-language",lang);applyLanguage()});
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#startAnalyzeBtn").addEventListener("click",()=>setView("analyze"));
$("#progressBtn").addEventListener("click",()=>setView("progress"));
$("#contactBtn").addEventListener("click",jumpToAIFrame);
$("#prevFrameBtn").addEventListener("click",()=>stepFrame(-1));
$("#nextFrameBtn").addEventListener("click",()=>stepFrame(1));
$("#measureFrameBtn").addEventListener("click",measureCurrentFrame);
$("#overlayBtn").addEventListener("click",function(){overlayVisible=!overlayVisible;this.textContent=overlayVisible?t("hideOverlay"):t("showOverlay");drawOverlay();drawZoomOverlay()});
$("#playSegmentBtn").addEventListener("click",playCurrentSegment);
$("#prevReplayFrameBtn").addEventListener("click",()=>stepReplay(-1));
$("#nextReplayFrameBtn").addEventListener("click",()=>stepReplay(1));
$("#replaySpeedSelect").addEventListener("change",e=>setReplaySpeed(e.target.value));
$("#loopSegmentBtn").addEventListener("click",function(){segmentLoop=!segmentLoop;this.textContent=segmentLoop?t("loopOn"):t("loopOff");this.classList.toggle("active-toggle",segmentLoop)});
$("#resultVideo").addEventListener("play",startResultOverlayLoop);
$("#resultVideo").addEventListener("pause",stopResultOverlayLoop);
$("#resultVideo").addEventListener("seeked",drawOverlay);
$("#resultVideo").addEventListener("timeupdate",()=>{if($("#resultVideo").paused)drawOverlay()});

$("#retryBtn").addEventListener("click",()=>{$("#videoInput").value="";currentFile=null;currentAnalysis=null;currentSessionId=null;playerSeed=null;selectorBaseCanvas=null;if(selectorVideoURL){URL.revokeObjectURL(selectorVideoURL);selectorVideoURL=null}courtCalPoints=[];courtHomography=null;courtInverseHomography=null;courtCalActive=false;actionSnapshots.clear();analysisFrames=[];segmentLoop=true;segmentStart=0;segmentEnd=0;stopSkillReplay();replayFrames=[];replayIndex=0;replaySpeed=.35;$("#qualityCard").classList.add("hidden");$("#playerLockPanel").classList.add("hidden");$("#analysisCard").classList.add("hidden");$("#videoPicker").classList.remove("selected");$("#fileMeta").textContent=t("fileHint");$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");hideStatus();setView("analyze")});
async function waitForDisplayedVideoFrame(v){
  if(v.readyState<2){
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("preview data timeout")),12000);
      const done=()=>{clearTimeout(timer);v.removeEventListener("loadeddata",done);resolve()};
      v.addEventListener("loadeddata",done,{once:true})
    })
  }
  if("requestVideoFrameCallback" in HTMLVideoElement.prototype){
    await new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;resolve()};
      v.requestVideoFrameCallback(finish);
      setTimeout(finish,1000)
    })
  }else{
    await new Promise(r=>setTimeout(r,250))
  }
}
async function preparePlayerSelector(file){
  playerSeed=null;courtCalPoints=[];courtHomography=null;courtInverseHomography=null;courtCalActive=false;
  $("#courtCalPanel").classList.add("hidden");$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("playerLockNeeded");
  $("#playerLockPanel").classList.remove("hidden");$("#playerLockState").textContent=t("preparingFrame");
  $("#selectorLoading").classList.remove("hidden");

  const v=$("#playerSelectVideo"),c=$("#playerSelectCanvas");
  if(selectorVideoURL)URL.revokeObjectURL(selectorVideoURL);
  selectorVideoURL=URL.createObjectURL(file);
  v.src=selectorVideoURL;v.muted=true;v.playsInline=true;v.preload="auto";
  try{
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("preview metadata timeout")),12000);
      const ok=()=>{clearTimeout(timer);resolve()};
      v.addEventListener("loadedmetadata",ok,{once:true});
      v.addEventListener("error",()=>reject(new Error("preview video error")),{once:true})
    });
    const target=Math.min(.25,Math.max(0,v.duration-.05));
    await new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;v.removeEventListener("seeked",finish);resolve()};
      v.addEventListener("seeked",finish);
      v.currentTime=target;
      setTimeout(finish,1200)
    });
    try{
      const p=v.play();
      if(p&&typeof p.then==="function"){
        await Promise.race([p,new Promise(r=>setTimeout(r,700))]);
        await waitForDisplayedVideoFrame(v);
        v.pause()
      }
    }catch(e){
      await waitForDisplayedVideoFrame(v)
    }
    const maxW=1000,aspect=(v.videoWidth||9)/(v.videoHeight||16);
    if(aspect>=1){c.width=maxW;c.height=Math.max(1,Math.round(maxW/aspect))}
    else{c.height=maxW;c.width=Math.max(1,Math.round(maxW*aspect))}
    selectorBaseCanvas={width:c.width,height:c.height};
    drawPlayerSelector();
    $("#playerLockState").textContent=t("tapPlayer");
  }catch(e){
    console.error(e);
    $("#playerLockState").textContent=t("analysisFail")+": "+(e.message||e)
  }finally{
    $("#selectorLoading").classList.add("hidden")
  }
}
function drawPlayerSelector(){
  const c=$("#playerSelectCanvas");if(!selectorBaseCanvas||!c)return;
  const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
  if(!playerSeed)return;
  const x=playerSeed.x*c.width,y=playerSeed.y*c.height,r=Math.max(26,c.width/24);
  ctx.save();ctx.strokeStyle="#22c55e";ctx.fillStyle="rgba(34,197,94,.18)";ctx.lineWidth=Math.max(5,c.width/180);
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*1.35,y);ctx.lineTo(x+r*1.35,y);ctx.moveTo(x,y-r*1.35);ctx.lineTo(x,y+r*1.35);ctx.stroke();
  ctx.font="900 "+Math.max(18,Math.round(c.width/35))+"px -apple-system,sans-serif";ctx.fillStyle="#fff";ctx.strokeStyle="rgba(0,0,0,.75)";ctx.lineWidth=5;ctx.strokeText(t("lockMarker"),x+r+10,y);ctx.fillText(t("lockMarker"),x+r+10,y);ctx.restore()
}
$("#playerSelectCanvas").addEventListener("pointerup",e=>{
  if(courtPointerHandled){courtPointerHandled=false;return}
  if(!selectorBaseCanvas||!currentFile||courtCalActive)return;
  const c=e.currentTarget,r=c.getBoundingClientRect();
  playerSeed={x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)};
  drawCourtCalibration();$("#playerLockState").textContent=t("playerLocked");
  $("#courtCalPanel").classList.remove("hidden");
  $("#analyzeBtn").disabled=false;$("#analyzeBtnText").textContent=t("analyzeBtn")
});

$("#startCourtCalBtn").addEventListener("click",()=>{
  if(!selectorBaseCanvas||!playerSeed)return;
  courtCalActive=true;courtCalPoints=[];courtHomography=null;courtInverseHomography=null;
  $("#courtCalState").textContent=t("courtCalStep")+" 1/4";
  drawCourtCalibration()
});
$("#resetCourtCalBtn").addEventListener("click",()=>{
  courtCalActive=false;courtCalPoints=[];courtHomography=null;courtInverseHomography=null;
  $("#courtCalState").textContent=t("courtCalOptional");drawCourtCalibration()
});
$("#playerSelectCanvas").addEventListener("pointerdown",e=>{
  if(!courtCalActive)return;
  courtPointerHandled=true;
  e.stopImmediatePropagation();e.preventDefault();
  const c=e.currentTarget,r=c.getBoundingClientRect();
  courtCalPoints.push({x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)});
  if(courtCalPoints.length<4){
    $("#courtCalState").textContent=t("courtCalStep")+" "+(courtCalPoints.length+1)+"/4";
    drawCourtCalibration();return
  }
  courtCalActive=false;
  if(finalizeCourtCalibration())$("#courtCalState").textContent=t("courtCalDone");
  else{$("#courtCalState").textContent=t("courtCalBad");courtCalPoints=[]}
  drawCourtCalibration()
},{capture:true});

$("#videoInput").addEventListener("change",async e=>{
  const f=e.target.files?.[0];currentFile=f||null;currentSessionId=null;actionSnapshots.clear();
  if(!f){$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("chooseFirst");$("#playerLockPanel").classList.add("hidden");return}
  const mb=(f.size/1024/1024).toFixed(1);$("#videoPicker").classList.add("selected");$("#fileMeta").textContent=f.name+" · "+mb+" MB · "+t("selected");
  if(f.size>200*1024*1024){$("#analyzeBtn").disabled=true;$("#analyzeBtnText").textContent=t("tooLarge");showStatus(t("tooLarge"),"error");return}
  hideStatus();await preparePlayerSelector(f)
});
$("#analyzeBtn").addEventListener("click",async()=>{
  if(!currentFile){showStatus(t("chooseFirst"),"error");return}
  if(!playerSeed){showStatus(t("playerLockNeeded"),"error");return}
  if(!$("#consentAnalysis").checked){showStatus(t("needConsent"),"error");return}
  const btn=$("#analyzeBtn");btn.disabled=true;$("#analyzeBtnText").textContent=t("analyzing");
  $("#analysisCard").classList.add("hidden");$("#qualityCard").classList.add("hidden");currentAnalysis=null;analysisFrames=[];
  try{const a=await analyzeVideo(currentFile);currentAnalysis=a;await renderResult(a)}
  catch(e){console.error(e);if(e.quality)renderQuality(e.quality);$("#analysisCard").classList.add("hidden");showStatus(e.quality?t("qualityFail"):t("analysisFail")+": "+(e.message||e),"error")}
  finally{btn.disabled=false;$("#analyzeBtnText").textContent=t("analyzeBtn")}
});

applyLanguage();renderLearn();
