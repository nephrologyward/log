// Nephrology Ward Log — app logic (generated from the design page).
/* ---------- reference data ---------- */
const RANGES={urea:[15,45],creatinine:[0.6,1.3],na:[135,145],sodium:[135,145],k:[3.5,5],potassium:[3.5,5],ca:[8.5,10.5],phos:[2.5,4.5],
 ph:[7.35,7.45],hco3:[22,26],pco2:[35,45],hb:[13,17],plt:[150,450],platelets:[150,450],tlc:[4,11],wbc:[4,11],crp:[0,5],rbs:[70,140],lactate:[0.5,2.2],inr:[0.8,1.2]};
const DAILY_TESTS=[["Urea","mg/dL"],["Creatinine","mg/dL"],["Na","mmol/L"],["K","mmol/L"],["Ca","mg/dL"],["Phos","mg/dL"],["pH",""],["HCO3","mmol/L"],["PCO2","mmHg"],["Hb","g/dL"],["PLT","×10³/µL"],["TLC","×10³/µL"],["CRP","mg/L"],["RBS","mg/dL"]];
const VCOLS=[["BP","mmHg"],["HR","bpm"],["SpO2","%"],["Temp","°C"],["RR","/min"]];
const ECOLS=[["Conscious level",""],["Chest",""],["LL",""],["Input","mL"],["Output","mL"],["Weight","kg"],["CVP","cmH₂O"],["Others",""]];
const ALLCOLS=[...VCOLS,...ECOLS];
const PLAN_PRESETS=["Echo","Pelvi-abdominal US","Doppler US","Blood culture","Urine culture","Iron studies","PTH","HbA1c","Viral markers (HBV, HCV, HIV)","Chest X-ray","AVF referral"];
const CONSULTANTS=["Dr. Hossam","Dr. Hesham","Dr. Bassem"];
const ACCESS=["AV fistula","Temporary catheter","Permcath","AV graft"];
const BASE_LOC=["قسم الكلى","الرعاية المركزة","الطوارئ","وحدة الغسيل"];
const BASE_DEPT=["القلب","الباطنة","الجراحة العامة","المخ والأعصاب","النسا والتوليد","العظام","المسالك","جراحة الأوعية"];
const TYPES={nephro:"Nephrology",coadmit:"Co-admission",consult:"Consultation",hd:"HD only"};
const TYPE_OPTS=[["nephro","Nephrology only"],["coadmit","Co-admission"],["consult","Consultation"],["hd","HD only"]];
const SCHED={smw:["Sat / Mon / Wed",[6,1,3]],stt:["Sun / Tue / Thu",[0,2,4]]};
const schedLabel=e=>SCHED[e.hdSched]?.[0]||e.hdSchedOther||"";
const hdToday=e=>e.status==="active"&&!(e.hd||[]).some(h=>h.date===today()&&h.status&&h.status!=="ordered"||h.date===today()&&!h.status)&&((e.type==="hd"&&(SCHED[e.hdSched]?.[1]||[]).includes(weekday()))||(e.hd||[]).some(h=>h.date===today()&&h.status==="ordered"));
const STATES=[["todo","Pending"],["doing","In progress"],["done","Done"]];
const OUTCOMES={discharged:"Discharged",died:"Died",offservice:"Off nephrology care",signedoff:"Signed off"};
const dueClass=d=>!d?"":d<today()?"over":d===today()?"today":"";
function dueInfo(it){if(it.state==="done"||it.state==="cancelled")return null;
  if(it.state==="todo"&&it.due&&it.due>today())return null;
  if(it.state==="todo"&&it.due&&it.due<=today())return{kind:"Scheduled",date:it.due};
  if(it.resultDue&&it.resultDue<=today())return{kind:"Result due",date:it.resultDue};return null}
const isDue=it=>!!dueInfo(it);
const isOpen=it=>it.state!=="done"&&it.state!=="cancelled"&&!it.hd&&!dueInfo(it)&&!(it.state==="todo"&&it.due>today())&&!(it.resultDue>today());
const dueTag=d=>el("span",{class:"due "+dueClass(d.date)},d.kind+" · "+(d.date<today()?"overdue "+fmtDate(d.date):"today"));

const AR_DIG=/[٠-٩۰-۹٫٬]/;
const toEn=s=>String(s).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-1632).replace(/[۰-۹]/g,c=>c.charCodeAt(0)-1776).replace(/٫/g,".").replace(/٬/g,",");
document.addEventListener("input",ev=>{const t=ev.target;if(!t||!("value" in t)||t.type==="file"||t.type==="date"||t.type==="checkbox"||t.type==="radio")return;const v=t.value;if(!AR_DIG.test(v))return;
  let a=null;try{a=t.selectionStart}catch{}t.value=toEn(v);try{if(a!=null)t.setSelectionRange(a,a)}catch{}},true);
const lkey=n=>String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const DAILY=new Set(DAILY_TESTS.map(t=>lkey(t[0])).concat(["sodium","potassium","platelets","wbc","lactate","inr","glucose"]));
const isOnce=l=>typeof l.once==="boolean"?l.once:!DAILY.has(lkey(l.name));
function flagOf(l){const r=RANGES[lkey(l.name)],v=parseFloat(l.value);if(!r||isNaN(v))return "";return v>r[1]?"H":v<r[0]?"L":""}
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ISO=/^\d{4}-\d\d-\d\d$/;
let YR="";const fmtDate=d=>ISO.test(d||"")?d.slice(8)+" "+MON[+d.slice(5,7)-1]+(d.slice(0,4)!==(YR||(YR=today().slice(0,4)))?" "+d.slice(0,4):""):(d||"—");
const TZ="Africa/Cairo";
function cairo(d=new Date()){try{const o={};for(const x of new Intl.DateTimeFormat("en-GB",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d))o[x.type]=x.value;return o}
  catch{const p=n=>String(n).padStart(2,"0");return{year:String(d.getFullYear()),month:p(d.getMonth()+1),day:p(d.getDate()),hour:p(d.getHours()),minute:p(d.getMinutes())}}}
const today=()=>{const o=cairo();return o.year+"-"+o.month+"-"+o.day};
const cairoHour=()=>+cairo().hour;
const weekday=d=>new Date((d||today())+"T12:00:00Z").getUTCDay();
const addDays=(d,n)=>{const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const now=()=>{const o=cairo();return o.day+"/"+o.month+"/"+o.year.slice(2)+", "+o.hour+":"+o.minute};
function orderDates(list){const u=[...new Set(list.map(x=>x.date||""))];return[...u.filter(d=>!ISO.test(d)),...u.filter(d=>ISO.test(d)).sort()]}
let uid=0;const uidf=p=>p+(++uid)+"_"+Date.now().toString(36);

/* ---------- state ---------- */
/* ---------- test data (names are placeholders) ---------- */
const UNIT=Object.fromEntries(DAILY_TESTS);
function L(date,str){return str.split(";").map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(.+?)\s+([\d.,/]+.*)$/);return{date,name:m[1],value:m[2].replace(",","."),unit:UNIT[m[1]]||"",once:false}})}
const O=(date,name,value,unit="")=>({date,name,value,unit,once:true});
const T=(date,BP,HR,SpO2,Temp,extra={})=>Object.fromEntries(Object.entries({date,BP,HR,SpO2,Temp,...extra}).filter(([,v])=>v));
const D="2026-11-06";
function P(o){return{nid:"",phone:"",age:"",sex:"M",occupation:"",residence:"",marital:"",habits:"",pastMedical:[],pastSurgical:[],drugHistory:[],allergies:"",...o,id:uidf("p"),
  encounters:o.encounters.map(e=>({key:uidf("e"),type:"nephro",department:"",status:"active",complaint:"",hpi:"",diagnosis:"",vitalsLog:[],labs:[],imaging:[],plan:[],hd:[],images:[],events:[],meds:[],notes:"",...e}))}}
const M=s=>s.split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^([^\d(]+?)\s+(\d.*|\(.*)$/);return m?{name:m[1],dose:m[2],freq:""}:{name:x,dose:"",freq:""}});
const isOnceMed=m=>/\b(once|stat)\b|مر[هة] واحد/i.test((m.freq||"")+" "+(m.dose||""));
const OL=(date,str)=>L(date,str).map(x=>({...x,unit:"",once:true}));
const X=(date,name,value)=>({date,name,value,unit:"",once:true});
const V=(date,o)=>({date,...o});
const MD=(name,dose,freq,start="",stop="",note="")=>Object.fromEntries(Object.entries({name,dose,freq,start,stop,note}).filter(([,v])=>v));
const CL="Conscious level";
function makeSamples(){const patients=[
/* 1 */
P({name:"رأفت منصور",consultant:"Dr. Hossam",age:"62",habits:"Smoker",
  pastMedical:["Hypertension (long-standing)","CKD","Previous analgesic abuse"],
  encounters:[{location:"نفسية وعصبية",date:"before 08/11",complaint:"Uraemic manifestations (itching, hiccup)",hpi:"Readmission. Received 1st HD session.",
    vitalsLog:[V("2026-11-08",{Chest:"Clear",LL:"Mild oedema"}),
      V("2026-11-09",{BP:"130/70",SpO2:"96",Chest:"Clear",LL:"No oedema",Input:"1700",Output:"1000",Others:"Back pain"}),
      V("2026-11-10",{BP:"120/60",HR:"69",SpO2:"98",[CL]:"Fully conscious",Chest:"Basal crepitations",LL:"No oedema",Input:"3300",Output:"1200",Others:"Tingling in both lower limbs"}),
      V("2026-11-11",{BP:"170/100",HR:"72",SpO2:"98",[CL]:"Conscious, alert",Chest:"Clear",LL:"No oedema"}),
      V("2026-11-14",{BP:"90/6?",Temp:"38.5",Others:"Fever, sweating"}),
      V("2026-11-15",{BP:"130/80",HR:"87",SpO2:"97",Temp:"39",[CL]:"Fully conscious",Chest:"Crepitations all over the chest",LL:"No oedema"}),
      V("2026-11-16",{BP:"130/90",HR:"86",SpO2:"98",RR:"20",Chest:"Bilateral basal crepitations",LL:"No oedema"}),
      V("2026-11-17",{BP:"130/90",HR:"77",SpO2:"98",Temp:"36.5",Weight:"106.8",Chest:"Clear",LL:"No oedema",Others:"Uraemic manifestations, refusing feeding, back pain"}),
      V("2026-11-18",{BP:"140/90",Temp:"38",Weight:"105",Chest:"Clear",LL:"No oedema"})],
    labs:[...L("Adm","Urea 172;Creatinine 6.4;Na 140;K 5.2;pH 7.22;HCO3 12.7;PCO2 31;Hb 11.7;PLT 215;TLC 9.6"),
      ...L("2026-11-08","Urea 150;Creatinine 5.7;Na 140;K 4.8;Ca 6.1;Albumin 4.4;Hb 10.4;PLT 172;TLC 10.8"),...OL("2026-11-08","PTH 106"),
      ...L("2026-11-09","Urea 139;Creatinine 5.5;Na 137;K 5.0;Ca 6.3;Phos 4.1;pH 7.26;HCO3 17;PCO2 40;Hb 10.9;PLT 176;TLC 9.6;Albumin 3.7"),
      X("2026-11-09","Urine analysis","Albumin ++, RBCs 2–3, pus cells 30–35"),
      ...L("2026-11-10","Urea 115;Creatinine 5.1;Na 136;K 4.9;Ca 7.2;Phos 3.8;pH 7.29;HCO3 20;PCO2 42;Hb 10;PLT 156;TLC 10"),
      X("2026-11-10","PSA","Normal"),...OL("2026-11-10","TSH 5;HbA1c 5.6"),
      ...L("2026-11-11","Urea 126;Creatinine 5.6;Uric acid 5.9;Na 138;K 5.7;Ca 7.2;Phos 3.4;Albumin 3.8;Hb 11.4;PLT 147;TLC 9.6"),...OL("2026-11-11","FT3 1.99;FT4 0.93"),
      ...L("2026-11-14","Urea 155.9;Creatinine 6.9;Na 132;K 5.8;pH 7.20;HCO3 17;PCO2 44;Hb 11.4;PLT 148;TLC 16"),
      ...L("2026-11-15","Urea 117;Creatinine 7.2;Uric acid 7.3;Na 137;K 5.2;Ca 6.2;Phos 3.3;pH 7.30;HCO3 18.2;PCO2 37;Hb 10.1;PLT 151;TLC 21.7;CRP 207.3;INR 1.2"),
      ...OL("2026-11-15","ESR 95;PTH 225"),X("2026-11-15","HCV","Positive"),X("2026-11-15","Immunology","Normal"),
      ...L("2026-11-16","Urea 200;Creatinine 7.56;Na 136;K 5.3;Ca 6.4;Phos 4;pH 7.29;HCO3 17.3;PCO2 36;Hb 9.5;PLT 149;TLC 15.3;Lactate 1.9;Albumin 3.3;RBS 151"),
      ...L("2026-11-17","Urea 217;Creatinine 7.8;Na 131;K 5.2;Ca 6.4;Hb 9.5;PLT 153;TLC 14.5;CRP 267;INR 1.2"),
      ...L("2026-11-18","Urea 177;Creatinine 6.7;Na 131;K 4.8;Ca 6.9;Phos 2.8;pH 7.46;HCO3 14.2;PCO2 20;Hb 10.2;PLT 177;TLC 19.9;Lactate 1.4")],
    imaging:[{test:"Echo",result:"EF 60%, concentric LVH, grade I diastolic dysfunction, mild MR",date:"2026-11-09"}],
    plan:[{text:"Echo",state:"done",due:"",resultDue:"",result:"EF 60%, concentric LVH, grade I DD, mild MR",doneDate:"2026-11-09"},
      {text:"Pelvi-abdominal US",state:"todo",due:"",resultDue:""},{text:"Cultures",state:"todo",due:"",resultDue:""},
      {text:"Serum protein electrophoresis",state:"doing",due:"",resultDue:""},{text:"Serum immunofixation",state:"doing",due:"",resultDue:""},
      {text:"AVF preparation",state:"todo",due:"",resultDue:""},{text:"X-ray lumbar spine",state:"todo",due:"",resultDue:""}],
    events:[{when:"Adm",text:"Readmission with uraemic manifestations. 1st HD session."},
      {when:"2026-11-08",text:"For 2nd HD session today."},
      {when:"2026-11-09",text:"SPEP and serum immunofixation requested. For 3rd HD session tonight."},
      {when:"2026-11-10",text:"Multiple myeloma work-up samples withdrawn. For AVF preparation."},
      {when:"2026-11-11",text:"HD session done. For possible discharge tomorrow."},
      {when:"2026-11-14",text:"Came for HD — oozing around the catheter (it was out), fever and sweating; session cancelled. Bicarbonate and anti-hyperkalaemic measures. Repeat gas: pH 7.49, HCO3 15, PCO2 20, K 5.5. For antibiotics after cultures."},
      {when:"2026-11-15",text:"Antibiotics upgraded from Sulperazone to Maxipime 1 g/24 h + Tavanic 500 mg/48 h."},
      {when:"2026-11-17",text:"Femoral catheter inserted for HD today. For X-ray lumbar spine."},
      {when:"2026-11-18",text:"Last HD yesterday. Maxipime and Tavanic stopped; vancomycin and Amikin added."}],
    meds:[MD("Norvasc","5 mg","1×1"),MD("Atenolol","100 mg","1×1"),
      MD("Calcium IV","2 amp","/12 h","2026-11-08","2026-11-17","Changed to 2 amp + ½ amp Mg /12 h"),MD("Calcium IV + Mg","2 amp + ½ amp Mg","/12 h","2026-11-17"),
      MD("Calcimate","","1×3","2026-11-08","2026-11-11","Changed to 2×3"),MD("Calcimate","","2×3","2026-11-11","2026-11-17","Changed to 3×3"),MD("Calcimate","","3×3","2026-11-17"),
      MD("Sulperazone","","","2026-11-14","2026-11-15","Upgraded to Maxipime + Tavanic"),
      MD("Maxipime","1 g","/24 h","2026-11-15","2026-11-18","Stopped"),MD("Tavanic","500 mg","/48 h","2026-11-15","2026-11-18","Stopped"),
      MD("Vancomycin","","","2026-11-18"),MD("Amikin","","","2026-11-18")],
    notes:"BP on 14/11 written as “90/6]” (unclear)."}]}),
/* 2 */
P({name:"سعيد حمدي",consultant:"Dr. Hesham",age:"74",
  pastMedical:["Not diabetic, not hypertensive, no renal or cardiac disease"],pastSurgical:["Femur fracture fixed by IMN"],
  encounters:[{type:"coadmit",department:"الجراحة العامة",location:"جراحة أ",date:"before 18/11",complaint:"Left lower-limb cellulitis",diagnosis:"Sepsis-induced AKI",
    vitalsLog:[V("Adm",{SpO2:"95",[CL]:"Fully conscious",Chest:"Normal breath sounds, equal both sides"}),
      V("2026-11-18",{BP:"100/60",SpO2:"98",Chest:"Clear",LL:"No oedema; left LL cellulitis",Others:"Mildly dehydrated"})],
    labs:[...L("Adm","Urea 206;Creatinine 3.8;pH 7.3;HCO3 20.2;PCO2 41;Hb 11.9;PLT 300;TLC 15.7;ALT 21;AST 51;INR 1.16"),
      ...L("2026-11-18","Urea 190;Creatinine 2.1;Na 134;K 3.2;Ca 7.9;Hb 10;PLT 322;TLC 14;Albumin 2.8;Bilirubin T/D 0.7 / 0.4")],
    imaging:[{test:"US",result:"Grade 2 nephropathy, no back pressure",date:"Adm"}],
    plan:[{text:"Urine culture",state:"todo",due:"2026-11-19",resultDue:""}],
    events:[{when:"Adm",text:"New co-admission with general surgery (Surgery A)."}],
    meds:[MD("Controloc","40 mg",""),MD("Cefazolin","1 g","/12 h"),MD("Perfalgan","",""),MD("Saline","",""),MD("Flagyl","500 mg","/8 h")]}]}),
/* 3 */
P({name:"نادية حسين",consultant:"Dr. Hossam",age:"60",sex:"F",
  pastMedical:["Hypertension on Exforge 10/160 + Nevilob 5","DM on insulin","ESRD 2009 (unknown cause) → HD via left AVF","Multiple myeloma — diagnosed 1 year ago (anaemia → BM exam); was on Velcade + Endoxan, now Velcade every 2 weeks"],
  pastSurgical:["Renal transplant from her son (2012)","Renal biopsy (2026)"],drugHistory:["Exforge 10/160","Nevilob 5","Insulin","Velcade every 2 weeks"],
  encounters:[{location:"خاص السابع",date:"2026-06-08",status:"closed",outcome:"discharged",closeDate:"",closeNote:"Discharge date not in the message",
      complaint:"Bilateral lower-limb oedema",hpi:"ACR (1/6): 5333. Admitted for renal biopsy — was on Rivarospire 10, stopped 2 days before.",
      vitalsLog:[V("2026-06-09",{BP:"110/70",HR:"86",SpO2:"96",Weight:"96.3",[CL]:"Conscious",Chest:"Decreased air entry at lung bases",LL:"Oedema"}),
        V("2026-06-10",{BP:"110/70",SpO2:"97",Temp:"37",Weight:"96.3",[CL]:"Fully conscious",Chest:"Decreased air entry",LL:"Bilateral mild oedema",Others:"Diarrhoea improved"})],
      labs:[...L("2026-06-08","Urea 105;Creatinine 2.78;Uric acid 6.1;Ca 9.6;Phos 4.8;Hb 11.9;PLT 210;TLC 7.2;Albumin 4.2;Total protein 6.2;ALT 18;AST 20"),
        ...L("2026-06-09","Urea 111;Creatinine 2.7;K 3.5;Ca 9;Phos 5;pH 7.35;HCO3 17.7;PCO2 32;Hb 12.2;PLT 192;TLC 10.7;CRP 1;INR 1"),...OL("2026-06-09","Bleeding time 1.5;Clotting time 6"),
        ...L("2026-06-10","Urea 110;Creatinine 2.5;K 2.7;pH 7.31;HCO3 19;PCO2 38;Hb 11.4;PLT 169;TLC 10.8")],
      plan:[{text:"Renal biopsy",state:"done",due:"",resultDue:"",result:"Done",doneDate:"2026-06-10"}],
      events:[{when:"2026-06-09",text:"For renal biopsy tomorrow. Tujeo 12 units at night added; Mixtard “20 10” units added (unclear)."},
        {when:"2026-06-10",text:"Renal biopsy done. K 2.7 (VBG) → 5 amp K over 500 cc saline over 5 h, once."}],
      meds:[MD("Feburic","40",""),MD("Eprex","","q48h"),MD("Torsaretic","20",""),MD("Controloc","",""),MD("Insulin","",""),MD("Exforge","",""),MD("Nevilob","5",""),MD("Folic acid","",""),
        MD("CellCept","500 mg","BID"),MD("Adport","1.5 mg","BID"),MD("Solupred","5 mg","OD"),MD("Tujeo","12 units","at night","2026-06-09")]},
    {location:"خاص السابع",date:"2026-11-18",complaint:"Dyspnoea, decreased urine output, bilateral LL oedema",
      vitalsLog:[V("2026-11-18",{BP:"185/60",HR:"72",SpO2:"94–96",Temp:"36",Weight:"99.5"})],
      labs:L("2026-11-18","Urea 122.3;Creatinine 3.2;Uric acid 5.3;Na 102;K 4.1;Ca 8.3;Phos 4.6;pH 7.29;HCO3 16.8;PCO2 35;Lactate 0.5;Hb 8.7;PLT 160;TLC 5.19;Albumin 4;ALT 12.2;AST 25.2;Bilirubin 0.38;RBS 141"),
      events:[{when:"2026-11-18",text:"Readmission. Lasix 160 mg once today."}],
      meds:[MD("Nevilob","5 mg","1×1"),MD("Calpreg","","1×1"),MD("Exforge","10/160",""),MD("Prograf","2 mg am + 1 mg pm",""),MD("CellCept","500 mg","1×2"),
        MD("Prednisolone","5 mg","1×1"),MD("Prucasoft","2 g","1×1"),MD("Forxiga","10 mg","1×1"),MD("Controloc","40 mg","1×1"),MD("Torsaretic","10 mg","1×1"),
        MD("Rivarospire","10 mg","1×1"),MD("Lasix","160 mg","once","2026-11-18","2026-11-18","Single dose")]}]}),
/* 4 */
P({name:"حسن الشاذلي",consultant:"Dr. Hesham",age:"74",
  pastMedical:["Not diabetic or hypertensive, not known cardiac or renal"],
  encounters:[{location:"العظام",date:"before 17/11",complaint:"Dyspnoea, cough, LL swelling, polyuria",
    hpi:"Persistent cough for 2 months not responding to treatment. Sought medical advice on 29/10: CT chest showed a right upper lobe calcified nodule, possibly granuloma; creatinine 2.5, urea 32, HbA1c 5.5.",
    vitalsLog:[V("Adm",{BP:"200/100",Chest:"Crackles",LL:"Bilateral oedema"}),
      V("2026-11-17",{BP:"150/70",Weight:"82.5 → 81 after Lasix",[CL]:"Fully conscious"})],
    labs:[...L("2026-10-29","Urea 32;Creatinine 2.5"),...OL("2026-10-29","HbA1c 5.5"),
      ...L("Adm","Urea 65;Creatinine 1.5;Na 138;K 5;Ca 8.8;pH 7.46;HCO3 24.2;PCO2 34;Hb 13.3;PLT 227;TLC 12.4;INR 1"),...OL("Adm","CK 36;CK-MB 18"),X("Adm","Troponin","Negative"),
      ...L("2026-11-17","Urea 74;Creatinine 1.9;Na 133;K 4.8;Ca 8.4;Phos 2.8;pH 7.4;HCO3 24;PCO2 37;Hb 13;TLC 17;CRP 106;Albumin 3.5"),
      ...OL("2026-11-17","PTH 116"),X("2026-11-17","Urine analysis","Pus 4–6, RBCs 2–3")],
    imaging:[{test:"CT chest",result:"Right upper lobe calcified nodule, possibly granuloma",date:"2026-10-29"},
      {test:"Echo",result:"EF 59%, DD grade 1, mild sclerocalcific AR, MR grade 2, trivial TR, rim of pericardial effusion over the posterior wall",date:"Adm"},
      {test:"PAUS (ER)",result:"Increased echogenicity, grade 2 nephropathy",date:"ER"},
      {test:"US neck",result:"No lymph nodes detected",date:"2026-11-17"},
      {test:"Echo",result:"Hypertensive heart disease, mild MR, mild AR, EF 62%",date:"2026-11-17"}],
    plan:[{text:"Pelvi-abdominal US",state:"todo",due:"2026-11-18",resultDue:""},{text:"Albumin/creatinine ratio",state:"doing",due:"",resultDue:""},
      {text:"Cultures",state:"todo",due:"",resultDue:""},{text:"Sepsis markers",state:"todo",due:"",resultDue:""}],
    events:[{when:"Adm",text:"New admission (orthopaedics ward). Full package requested."},
      {when:"2026-11-17",text:"Lasix modified to 40 mg 1×1 for LL oedema. Atrovent/Pulmicort nebuliser sessions. Follow up volume status and chest."}],
    meds:[MD("Lasix","80 mg am + 40 mg pm","","Adm","2026-11-17","Changed to 40 mg 1×1"),MD("Lasix","40 mg","1×1","2026-11-17"),
      MD("Controloc","40 mg","1×1"),MD("Norvasc","5 mg",""),MD("Atrovent / Pulmicort","","nebuliser","2026-11-17")],
    notes:"17/11: the same message also lists “lasix 80” under current drugs — check the Lasix dose (unclear)."}]}),
/* 5 */
P({name:"عبد الرحمن زكي",consultant:"Dr. Hossam",age:"77",
  pastMedical:["DM","Hypertension","ESRD for 4 years (diabetic nephropathy) — on regular HD","Familial hypercholesterolaemia on Ator 10","Chronic diarrhoea"],drugHistory:["Ator 10"],
  encounters:[{location:"خاص السابع",date:"before 10/11",complaint:"Diarrhoea, fatigue, decreased oral intake",
    vitalsLog:[V("Adm",{BP:"140/80",Weight:"99",[CL]:"Conscious",Chest:"Free",LL:"No oedema"}),
      V("2026-11-10",{BP:"150/100",HR:"62",SpO2:"96",[CL]:"Alert, conscious",Chest:"Clear",LL:"Mild ankle oedema",Others:"Bilateral LL weakness, fatigue; recurrent hiccup, anorexia; diarrhoea 5–6 motions"}),
      V("2026-11-11",{BP:"130/60",SpO2:"94",Temp:"36",LL:"Mild pedal oedema",Others:"AVF: ecchymosis, good thrill"}),
      V("2026-11-12",{BP:"120/70",Weight:"66",[CL]:"Conscious",Chest:"Free",LL:"No oedema",Others:"Nausea"}),
      V("2026-11-14",{BP:"140/80",HR:"60",SpO2:"93",Temp:"37",Chest:"Clear",LL:"No oedema",Others:"No diarrhoea"}),
      V("2026-11-15",{BP:"140/80",HR:"55",SpO2:"92–94 RA",Temp:"37",[CL]:"Conscious, oriented, apathetic",Chest:"Bibasal crepitations, more on the left",LL:"No oedema"}),
      V("2026-11-16",{BP:"200/80 → 140/80",HR:"55",SpO2:"95 RA",Temp:"37",[CL]:"Conscious, oriented",Chest:"Bibasal crepitations, more on the left",LL:"No oedema"}),
      V("2026-11-17",{BP:"170/80 (night 160/70)",HR:"66",SpO2:"94 RA",[CL]:"Alert, oriented — hallucinations today",Chest:"Decreased air entry",LL:"No oedema",Others:"Sacrum not examined"}),
      V("2026-11-19",{SpO2:"94 after HD",[CL]:"Fluctuating",Others:"Desaturated after HD — on nasal O2"})],
    labs:[...L("Adm","Urea 126;Creatinine 6.2;Na 130;K 5.2;Ca 9.3;Phos 4.3;CRP 13.8"),
      ...L("2026-11-11","Urea 68;Creatinine 3.4;Uric acid 2.2;Ca 9.3;Phos 3.5;Hb 9.2;PLT 253;TLC 8.2;CRP 16"),
      ...L("2026-11-12","Urea 83;Creatinine 3.3;Uric acid 9;Na 140;K 4;Ca 9.2;Phos 3.4;pH 7.33;HCO3 19.4;PCO2 32;Hb 10.9;PLT 239;CRP 64.2;Albumin 3.1"),
      ...L("2026-11-14","Urea 49;Creatinine 2.88;Uric acid 1.9;K 3.03;Phos 1.31;pH 7.41;HCO3 26.6;PCO2 42;Hb 8.2;PLT 190;TLC 6.49;Lactate 1.9;Albumin 3.5;ALT 20;AST 41"),
      ...L("2026-11-15","Urea 77;Creatinine 4.2;Uric acid 3;Na 135;K 2.8;Phos 1.4;pH 7.44;HCO3 26.5;PCO2 39;Hb 8;PLT 174;TLC 5.8;Lactate 1.5;Albumin 3.3;ALT 24;AST 29"),
      ...L("2026-11-16","Urea 52;Creatinine 3.2;Uric acid 2.3;Na 134;K 3;Phos 1.01;pH 7.46;HCO3 26.3;PCO2 37;Hb 9.2;PLT 199;TLC 6.7;Albumin 3.6;ALT 24;CRP 122"),
      ...L("2026-11-19","Urea 42;Creatinine 2.3;Ca 9.7;Phos 1.6;Hb 9.2;PLT 191;TLC 4.9;Albumin 3.6")],
    imaging:[{test:"CT brain",result:"Done (neurology)",date:"2026-11-10"},{test:"MRI brain",result:"Done — for neurology reply",date:"2026-11-11"},
      {test:"Echo",result:"Done — result not in the message",date:"2026-11-14"},{test:"CT chest",result:"New CT chest done",date:"2026-11-19"}],
    hd:[{date:"Adm",access:"AV fistula",notes:"HD on admission day"},{date:"2026-11-10",access:"AV fistula",notes:"Extra HD session"},
      {date:"2026-11-11",access:"AV fistula",notes:"Per his schedule"},
      {date:"2026-11-15",access:"AV fistula",notes:"With 1 PRBCs, 2 vials albumin; 250 ml D10 + 250 ml Kidmin post HD; 3 amp KCl post HD"},
      {date:"2026-11-16",access:"AV fistula",notes:"250 ml D10 + 250 ml Kidmin post HD; Glycophos 1 amp over 500 ml NaCl — 250 ml pre and 250 ml post HD"},
      {date:"2026-11-19",access:"AV fistula",notes:"Desaturated after the session — nasal O2, SpO2 94"}],
    plan:[{text:"Neurology reply on MRI brain",state:"doing",due:"",resultDue:""},
      {text:"CT brain, CT lumbosacral and CT left hip",state:"todo",due:"",resultDue:""},
      {text:"Follow up conscious level and volume status",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-10",text:"Extra HD session. Neurology consultation: CT brain done, MRI brain requested."},
      {when:"2026-11-11",text:"MRI done for neurology reply. Clexane 20 mg OD added. HD per schedule."},
      {when:"2026-11-14",text:"Echo done. Clexane changed to 40 mg 1×1."},
      {when:"2026-11-15",text:"Second neurology opinion: CT brain, CT lumbosacral and CT left hip requested; correct metabolic causes. B-com and L-carnitine added."},
      {when:"2026-11-17",text:"Norvasc 5 mg added; Nitroderm patch 5 mg when BP 180/100. Hallucinations today but oriented. No labs today — full labs and HD tomorrow."},
      {when:"2026-11-19",text:"HD done; desaturated, on nasal O2. New CT chest done. Follow up volume status and conscious level."}],
    meds:[MD("Ator","10 mg",""),MD("Clexane","20 mg","OD","2026-11-11","2026-11-14","Changed to 40 mg 1×1"),MD("Clexane","40 mg","1×1","2026-11-14"),
      MD("B-com","","","2026-11-15"),MD("L-carnitine","","","2026-11-15"),MD("Norvasc","5 mg","","2026-11-17"),MD("Nitroderm patch","5 mg","when BP 180/100","2026-11-17")],
    notes:"Weight on 12/11 written as 66 (was 99 on admission) — check (unclear). Temp on 11/11 written as “36%”."}]}),
/* 6 */
P({name:"منى عاطف",consultant:"Dr. Hossam",age:"27",sex:"F",
  pastMedical:["SLE for 3 years on Prednisolone 20 mg","Paraplegia secondary to transverse myelitis (3 years ago) — earlier misdiagnosed as RA","Recurrent UTI (last urine C/S: E. coli)","Multiple admissions with sepsis","Bed sores"],
  pastSurgical:["Upper endoscopy — normal (17/03/2026)"],drugHistory:["Prednisolone 20 mg"],
  encounters:[
   {location:"",date:"2026-03-04",status:"closed",outcome:"discharged",closeDate:"",closeNote:"Discharge date not in the message",diagnosis:"SLE",
    complaint:"Poor oral intake, nausea, fever, haematuria for 2 weeks",
    hpi:"Urine analysis: pus cells 30, RBCs 75, no albuminuria. CRP 100 → received cefoperazone 1 g for 10 days with no improvement, still feverish, CRP 215. CT chest: bilateral pleural effusion.",
    vitalsLog:[V("Adm",{BP:"90/50",Chest:"Basal crepitations",LL:"No oedema",Others:"Bed sore grade 2, back of right thigh"}),
      V("2026-03-04",{BP:"120/70",SpO2:"96",[CL]:"Conscious, oriented",Output:"800 / 15 h",Others:"Afebrile; UOP 350 ml / 2 h"}),
      V("2026-03-05",{BP:"100/70",SpO2:"95",Temp:"38.2",Input:"1850",Output:"1600",Others:"Pigtail 400 ml / 24 h"}),
      V("2026-03-06",{BP:"110/70",HR:"86",SpO2:"96",Temp:"37",Input:"2230",Output:"2100"}),
      V("2026-03-07",{BP:"90/60",HR:"88",SpO2:"97",Chest:"Clear",Input:"2700",Output:"4900",Others:"No fever, no sacral oedema"}),
      V("2026-03-08",{BP:"110/70",HR:"53",[CL]:"Conscious, oriented",Input:"2500",Output:"3500",Others:"No fever"}),
      V("2026-03-09",{BP:"130/80",HR:"65",SpO2:"97",[CL]:"Conscious, oriented",Input:"3000",Output:"4000",Others:"Nausea, no fever"}),
      V("2026-03-10",{BP:"130/80",HR:"80",SpO2:"99",Input:"2900",Output:"4600",Others:"Nausea, decreased oral intake"}),
      V("2026-03-11",{BP:"100/70",HR:"75",SpO2:"95",[CL]:"Alert",Chest:"Clear",LL:"No oedema",Input:"3200",Output:"4700",Others:"Anorexia, epigastric pain"}),
      V("2026-03-12",{BP:"100/60",Temp:"37.9",[CL]:"Conscious"}),
      V("2026-03-14",{SpO2:"97",[CL]:"Fully conscious",LL:"No oedema",Others:"No fever; bed sores grade 3"}),
      V("2026-03-15",{[CL]:"Fully conscious",Others:"No vomiting, no fever"}),
      V("2026-03-16",{BP:"90/60",[CL]:"Conscious",Input:"3000",Output:"1600"}),
      V("2026-03-17",{BP:"140/90",HR:"50",SpO2:"97",Temp:"36.5 → 39",[CL]:"Conscious",Chest:"Clear",LL:"No oedema",Input:"3100",Output:"2500"}),
      V("2026-03-18",{BP:"150/90",[CL]:"Alert",Chest:"Clear",LL:"No oedema",Input:"2150",Output:"3500",Others:"Not feverish; one attack of diarrhoea"}),
      V("2026-03-19",{BP:"140/90",Temp:"36.5",[CL]:"Fully conscious, alert",LL:"No oedema",Input:"1100",Output:"3300",Others:"No vomiting"})],
    labs:[...L("Adm","Urea 28.8;Creatinine 0.27;Na 137;K 4.2;pH 7.37;HCO3 28;Hb 9.3;PLT 333;TLC 7.2;CRP 215;Albumin 3.2"),
      ...L("2026-03-04","Urea 32;Creatinine 0.19;Na 132;K 3.6;Ca 9.01;Phos 3.42;pH 7.44;PCO2 35;HCO3 23.8;Hb 8.9;PLT 333;TLC 5.11;CRP 177"),...OL("2026-03-04","ESR 130"),
      ...L("2026-03-05","pH 7.40;HCO3 21.7;PCO2 35;Hb 9;PLT 318;TLC 5.1"),...OL("2026-03-05","PTH 35.5"),X("2026-03-05","Urine analysis","Albumin +, pus 40–50, RBCs 15–20"),
      ...L("2026-03-07","pH 7.43;HCO3 24.6;PCO2 37;K 4;Ca 8.6;Lactate 1"),
      ...L("2026-03-08","Urea 13;Creatinine 0.16;Ca 9.1;Phos 3.5;Hb 9.5;PLT 311;TLC 4.9;CRP 60"),
      ...L("2026-03-09","Urea 18;Creatinine 0.2;Uric acid 3.1;Na 138;K 3.4;Ca 9.5;Phos 3.9;Hb 9.1;PLT 320;TLC 6.4;CRP 39;Albumin 3.3;Total protein 7.8"),
      ...L("2026-03-10","Urea 13;Creatinine 0.16;Uric acid 2.9;Ca 8.9;Phos 3.18;pH 7.46;HCO3 22;PCO2 31;Lactate 2.3;Hb 9.3;PLT 348;TLC 7.5;CRP 31;Albumin 3.2"),
      ...L("2026-03-11","Urea 10;Creatinine 0.19;Na 137;K 3.6;Ca 8.9;Phos 3.6;Albumin 3.3;Total protein 7.4;Hb 9.5;TLC 5.7;PLT 327;CRP 50"),
      ...L("2026-03-12","Urea 10;Creatinine 0.1;Uric acid 3;Na 136;K 3.5;Ca 8.7;Phos 3.8;pH 7.44;HCO3 24.5;PCO2 36;Hb 9;PLT 310;TLC 8.8;Albumin 3;ALT 7.7;AST 12.8"),
      ...L("2026-03-14","Urea 15.9;Creatinine 0.1;Uric acid 2.5;Na 137;K 2.8;Ca 9.3;Phos 3.1;pH 7.48;HCO3 23.8;PCO2 32;Hb 9.6;PLT 373;TLC 6.4;CRP 88.6;Lactate 1.4;Albumin 3.5"),
      ...L("2026-03-15","Urea 18;Creatinine 0.13;Na 138;K 3.4;Ca 8.8;Phos 3.2;pH 7.53;HCO3 25.9;PCO2 31;Hb 9.7;PLT 403;TLC 6.3;Albumin 3.5;Lactate 1.4"),
      ...L("2026-03-16","Urea 23.7;Creatinine 0.22;Na 140;K 3.1;Ca 8.8;Phos 4;pH 7.38;HCO3 24.3;PCO2 41;Hb 9.8;PLT 363;TLC 7.8"),
      ...L("2026-03-17","Urea 7;Creatinine 0.14;Uric acid 1.4;Na 141;K 2.8;Ca 9;pH 7.48;HCO3 25;PCO2 34;Hb 9.4;PLT 329;TLC 5.3;Albumin 3.2;ALT 69.7;AST 94"),
      ...L("2026-03-18","Urea 9.6;Creatinine 0.12;Uric acid 1.5;Ca 9.08;Phos 3.2;Albumin 3.5;pH 7.52;PCO2 34;HCO3 27.8;Hb 9.7;PLT 400;TLC 7.8;CRP 119.4")],
    imaging:[{test:"CT chest",result:"Bilateral pleural effusion",date:"Adm"},{test:"Pelvi-abdominal US",result:"Not written in the message",date:"Adm"},
      {test:"Pleural fluid",result:"Chemistry and culture withdrawn",date:"2026-03-05"},
      {test:"Urine culture",result:"E. coli — sensitive to nitrofurantoin, cefoperazone/sulbactam, imipenem, colistin",date:"2026-03-07"},
      {test:"Blood & urine culture",result:"No growth",date:"2026-03-15"},{test:"Upper endoscopy",result:"Done",date:"2026-03-17"}],
    plan:[],notes:"5/3 labs also had “Cr. 28” and “Na 3.1” (unclear) — left out.",
    events:[{when:"2026-03-04",text:"Blood and urine cultures done. Right pigtail inserted for pleural effusion — 200 ml; pleural fluid for chemistry, culture and pathology. Salprazol 1.5 g /12 h added. IV fluid increased to 2 L/day."},
      {when:"2026-03-05",text:"Fever 38.2. Pigtail flushed. For new CT chest. Plastic surgery: bed sores grade 3–4 — air mattress, daily dressing. Kidmin 500/24 h, glucose 10% /24 h, Mycostatin added."},
      {when:"2026-03-06",text:"Pigtail removed."},
      {when:"2026-03-08",text:"Laxative added."},
      {when:"2026-03-09",text:"Antodine changed to Controloc. Outpatient culture: no growth."},
      {when:"2026-03-10",text:"Antodine 40 pm and Gastreg 200 1×3 added for nausea."},
      {when:"2026-03-11",text:"Mucosta 100 mg /8 h and Vonseca 20 before eating added; upper endoscopy next Saturday if not relieved."},
      {when:"2026-03-12",text:"Lasix 10 mg and Dexa 8 mg added. Solupred and Diflucan stopped. IV fluids decreased to 1.5 L/24 h, saline stopped. For neurology and physiotherapy consultation."},
      {when:"2026-03-14",text:"K 2.8 → 1 amp K + ½ amp Mg on Ringer 500 /12 h. For endoscopy Tuesday."},
      {when:"2026-03-15",text:"Preparation for upper and lower endoscopy on Tuesday. On Tazocin 4.5 g /6 h."},
      {when:"2026-03-17",text:"Upper endoscopy done. Fever 39."},
      {when:"2026-03-18",text:"Catheter removal deferred after one attack of diarrhoea."}],
    meds:[MD("Solupred","15",""),MD("Eliquis","2.5",""),MD("Gaptin","400",""),MD("Oxaleptal","",""),MD("Antodine","","","Adm","2026-03-09","Changed to Controloc"),MD("Danset","",""),MD("Saline","500","1×2","Adm","2026-03-12","Stopped"),
      MD("Salprazol","1.5 g","/12 h","2026-03-04"),MD("Mycostatin","","","2026-03-05"),MD("Controloc","40 mg","1×1","2026-03-09"),
      MD("Mucosta","100 mg","/8 h","2026-03-11"),MD("Vonseca","20 mg","before eating","2026-03-11"),MD("Lasix","10 mg","","2026-03-12"),MD("Dexamethasone","8 mg","","2026-03-12"),
      MD("Tazocin","4.5 g","/6 h","2026-03-15"),MD("Diflucan","200 mg","")]},
   {location:"خاص السابع",date:"2026-06-21",status:"closed",outcome:"discharged",closeDate:"",closeNote:"Discharge date not in the message",
    complaint:"Epigastric dull aching pain with vomiting",
    hpi:"Recurrent pain; OGD normal on 17/03/26. Preceded by fever 39 five days ago — received 2 doses of Amikacin. Recurrent UTI, last urine C/S E. coli.",
    vitalsLog:[V("2026-06-21",{BP:"110/70",HR:"112",SpO2:"97",Temp:"38",Chest:"Clear",LL:"Mild oedema",Input:"2150",Output:"3500",Others:"Tender epigastrium"}),
      V("2026-06-22",{BP:"120/80",HR:"87",SpO2:"96 RA",Temp:"38.5",Chest:"Clear",LL:"No oedema",Output:"1000 / 15 h"}),
      V("2026-06-23",{BP:"110/60",HR:"85",SpO2:"96 RA",Chest:"Clear",LL:"No oedema"}),
      V("2026-06-24",{BP:"110/70",HR:"92",SpO2:"97",Temp:"37.5",[CL]:"Conscious",Chest:"Clear",LL:"No oedema"}),
      V("2026-06-25",{BP:"110/70",[CL]:"Fully conscious",Chest:"Clear",LL:"No oedema",Input:"3250",Output:"3400"}),
      V("2026-06-27",{BP:"110/70",Temp:"37",[CL]:"Fully conscious",Input:"4340",Output:"6400"}),
      V("2026-06-28",{BP:"90/60",[CL]:"Conscious",Chest:"Clear",LL:"No oedema",Input:"3890",Output:"4300"}),
      V("2026-06-29",{BP:"100/60",Chest:"Clear",LL:"No oedema",Input:"3300",Output:"3900",Others:"No fever"}),
      V("2026-06-30",{BP:"100/60",HR:"80",SpO2:"96 RA",[CL]:"Alert, conscious",Chest:"Clear",LL:"No oedema",Others:"Average UOP"}),
      V("2026-07-01",{BP:"100/60",HR:"62",SpO2:"95",[CL]:"Conscious, alert",Chest:"Diminished air entry, right base",LL:"No oedema",Input:"4250",Output:"6200",Others:"Fever yesterday after MRI"}),
      V("2026-07-02",{BP:"100/60",HR:"90",SpO2:"98",[CL]:"Conscious",Chest:"Decreased air entry, lung bases (right)",LL:"No oedema",Input:"3500",Output:"5000",Others:"No fever"}),
      V("7/5 (?)",{BP:"100/60",HR:"60",SpO2:"96",[CL]:"Fully conscious",Chest:"Clear",LL:"No oedema"}),
      V("2026-07-06",{BP:"130/70",LL:"No oedema",Chest:"Clear"})],
    labs:[...L("2026-06-21","Urea 12;Creatinine 0.2;pH 7.39;PCO2 27;HCO3 16.3;Hb 8.1;TLC 8.2;INR 1.1"),
      ...L("2026-06-22","Urea 7.6;Creatinine 0.2;Uric acid 3.5;Ca 9.6;Phos 2.3;Hb 9.2;PLT 276;TLC 4.9;CRP 385;Albumin 3.2;ALT 13.7;AST 11.4;Bilirubin 0.48;RBS 89"),
      X("2026-06-22","Urine acetone","Negative"),
      ...L("2026-06-23","Urea 9.2;Creatinine 0.15;Ca 9.1;Phos 2.6;Hb 9.3;PLT 282;TLC 4;CRP 207;Albumin 3.2;ALT 10.5;AST 11.3;RBS 65"),
      ...L("2026-06-24","Urea 7;Creatinine 0.15;Na 158;K 2.9;Ca 9.3;Phos 3.1;pH 7.43;HCO3 26.9;PCO2 37;Hb 9.3;PLT 329;TLC 6;CRP 144;Lactate 2.3;Albumin 3.2;RBS 110"),
      ...L("2026-06-25","Urea 14;Creatinine 0.2;Ca 9.2;Phos 2.8;pH 7.4;HCO3 25;PCO2 34;Hb 9;PLT 297;TLC 4;RBS 90"),
      ...L("2026-06-27","Urea 8.2;Creatinine 0.18;K 2.1;Ca 9.3;pH 7.48;HCO3 26.8;PCO2 36;Hb 8.7;PLT 485;TLC 6.5;Albumin 3.1"),
      ...L("2026-06-28","Creatinine 0.12;K 2.8;Ca 9.2;Phos 3.8;pH 7.46;HCO3 24.9;PCO2 35;Hb 8.7;PLT 475;TLC 5.45;RBS 65"),
      ...L("2026-06-29","Urea 16;Creatinine 0.23;Uric acid 2;Na 139;K 3.1;Ca 9.33;Phos 3.13;pH 7.47;HCO3 34;PCO2 47;Hb 10.6;PLT 496;TLC 5.36;Albumin 3.4;Total protein 8;RBS 100"),
      ...L("2026-06-30","RBS 65"),
      ...L("2026-07-01","Urea 17;Creatinine 0.16;Uric acid 1.6;Na 134;K 3;Ca 9.4;Phos 2.7;pH 7.42;PCO2 41;HCO3 26.6;Hb 10.6;PLT 452;TLC 4.6;CRP 103;Albumin 3.6;ALT 9.1;AST 12.5;Bilirubin 0.3;RBS 77"),
      ...L("2026-07-02","Urea 19;Creatinine 0.18;Na 135;K 4;pH 7.44;HCO3 27;PCO2 40;RBS 72"),
      ...L("2026-07-06","RBS 90")],
    imaging:[{test:"Urine culture",result:"Sensitive to Sulperazone",date:"2026-06-24"},
      {test:"MRI right thigh",result:"Done — report pending",date:"2026-06-30"}],
    plan:[],
    events:[{when:"2026-06-21",text:"Readmission. Add-on: Losec 40 mg BID, Danset TID, Perfalgan TID, NaCl BID, RL OD. Package requested."},
      {when:"2026-06-22",text:"RBS 89 → glucose 10% at 40 ml/h. Meronam 1 g /8 h, Amikin 2 amp 500 on 200 cc NS over 1 h, Diflucan 200/24 h, Aminoleban 500/24 h added. Plastic surgery consultation for bed sore."},
      {when:"2026-06-23",text:"D10% increased to 80 ml/h."},
      {when:"2026-06-24",text:"Ringer 500 /12 h added. RBS 110 on glucose 10% at 100. General surgery consultation for the ulcer — abscess or not."},
      {when:"2026-06-25",text:"Amp K added. Surgery: MRI to exclude osteomyelitis."},
      {when:"2026-06-27",text:"For MRI report of upper thigh. For washed irradiated packed RBCs."},
      {when:"2026-06-28",text:"Amikin stopped. Daktarin gel and Mycostatin added."},
      {when:"2026-06-29",text:"MRI re-requested for the right thigh, not the pelvis."},
      {when:"2026-06-30",text:"MRI right thigh done (report pending). RBS 65 — follow up closely."},
      {when:"2026-07-02",text:"K decreased to 2 amp on Ringer. For surgical decision after MRI report."},
      {when:"7/5 (?)",text:"Pending urine culture. No labs. (Date written as 7/5 — probably 5/7, unclear.)"}],
    meds:[MD("Solupred","20 mg","OD"),MD("Osteocare","","OD"),MD("Oxaleptal","600 mg","OD"),MD("Dolixprine","60 mg","OD"),MD("Ganaton","50 mg","TID"),MD("Vonspire","20 mg",""),
      MD("Mucosta","","TID"),MD("Eliquis","2.5 mg","BID"),MD("Gast-Reg","400","TID"),
      MD("Losec","40 mg","BID","2026-06-21"),MD("Danset","","TID","2026-06-21"),MD("Perfalgan","","TID","2026-06-21"),MD("NaCl","","BID","2026-06-21"),MD("RL","","OD","2026-06-21"),
      MD("Meronam","1 g","/8 h","2026-06-22"),MD("Amikin","2 amp 500","over 1 h","2026-06-22","2026-06-28","Stopped"),MD("Diflucan","200 mg","/24 h","2026-06-22"),MD("Aminoleban","500","/24 h","2026-06-22"),
      MD("Ringer","500","/12 h","2026-06-24"),MD("Daktarin gel","","","2026-06-28"),MD("Mycostatin","","","2026-06-28")],
    notes:"28/6 labs had a line “Labs 10.6” (unclear — maybe urea). One day written as “7/5”, between 2/7 and 6/7 (unclear)."},
   {location:"",date:"2026-08-24",status:"closed",outcome:"discharged",closeDate:"",closeNote:"Discharge date not in the message",
    complaint:"Worsening bed sore — for general surgery and plastic surgery consultation",
    labs:L("2026-08-24","CRP 226"),events:[{when:"2026-08-24",text:"Readmission for worsening bed sore."}]},
   {location:"خاص السابع",date:"2026-10-05",complaint:"Readmission",events:[{when:"2026-10-05",text:"Readmission. No details in the message yet."}]}]}),
/* 7 */
P({name:"فاروق سليم",consultant:"Dr. Bassem",age:"76",
  pastMedical:["Hypertension","Coronary artery disease","Renal impairment of undetermined chronicity (AKI vs CKD)"],
  encounters:[{type:"consult",department:"القلب",location:"قسطرة الأول",date:"2026-11-18",complaint:"Impaired renal function (creatinine 2.8) after contrast",
    diagnosis:"Renal impairment — AKI vs CKD; risk of contrast-associated AKI",
    hpi:"Admitted with typical chest pain for cardiac evaluation. Non-stress assessment: good RV function. Persistent angina → coronary angiography: CAD. Referred to nephrology for creatinine 2.8 after contrast exposure.",
    vitalsLog:[V("2026-11-18",{BP:"120/80",HR:"74",[CL]:"Fully conscious, alert, oriented",Chest:"Clear",LL:"No oedema",Output:"600 / 6 h"})],
    labs:[...L("1st","Urea 89;Creatinine 2.6;Na 140;K 4.4;pH 7.36;HCO3 18.6;PCO2 33"),
      ...L("2nd","Urea 75;Creatinine 2.8;Na 140;K 5.0;pH 7.36;HCO3 17.2;PCO2 27;Hb 13.5;PLT 319?;TLC 9.3?")],
    imaging:[{test:"Coronary angiography",result:"Coronary artery disease",date:""},{test:"Echo",result:"Mild AR, moderate MR, EF 50%",date:""}],
    plan:[{text:"Pelvi-abdominal US",state:"todo",due:"",resultDue:""},{text:"PTH, Ca, Phos",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-18",text:"Consult received. IV saline 40 ml/h; strict input/output and daily fluid chart; follow up kidney function and electrolytes; watch for fluid overload."}],
    meds:[MD("Concor","2.5 mg",""),MD("Aspirin","75 mg",""),MD("Plavix","75 mg",""),MD("Heparin","5,000 IU","frequency unclear"),MD("Nevilob","",""),
      MD("Cordarone","loading then maintenance","doses unclear"),MD("Normal saline IV","40 ml/h","")],
    notes:"Lab dates not written — “1st” and “2nd” are the two readings in the message. PLT 319 and TLC 9.3 need confirmation (unclear handwriting). Heparin frequency and Cordarone doses unclear."}]}),
/* 8 */
P({name:"شوقي عبد العال",consultant:"Dr. Bassem",age:"73",
  pastMedical:["DM","Hypertension","IHD — s/p PCI and stenting","Urinary bladder carcinoma with liver and splenic metastases"],
  encounters:[{type:"consult",department:"الرعاية المركزة",location:"رعاية الخامس",date:"2026-11-18",complaint:"Disturbed conscious level, AKI, hypotension, dehydration",
    diagnosis:"Severe AKI — hypotension, dehydration, possible sepsis (renal hypoperfusion / ischaemic ATI)",
    vitalsLog:[V("Adm",{BP:"90/60",[CL]:"GCS 12/15",Others:"Clinically dehydrated; on Levophed rate 9; bed sores grade II"})],
    labs:[...L("1st","Urea 293;Na 140;K 4.0;pH 7.35;HCO3 13.2;Hb 9.4;PLT 109?;TLC 21.2;Albumin 2.1;ALT 149;AST 380"),
      ...L("2nd","Urea 296;Creatinine 5.3;Na 142;K 3.8;pH 7.25;HCO3 12.3;PCO2 28;Hb 9.2;PLT 104?"),...OL("1st","CK 712;CK-MB 73")],
    imaging:[{test:"Abdominal & renal US",result:"Bilateral renal stones; no collecting system dilatation, no back pressure or hydronephrosis",date:""}],
    plan:[{text:"Pan-cultures",state:"todo",due:"",resultDue:""},{text:"CRP",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-18",text:"Consult received. CVP monitoring; IV normal saline with close volume reassessment; continue vasopressor support; daily VBG and volume status."}],
    meds:[MD("Levophed","rate 9",""),MD("Normal saline IV","","")],
    notes:"Lab dates not written — “1st” and “2nd” are the two readings. Platelets 109 → 104 need confirmation. Levophed line in the message was cut off (“rate 9 Serum albumin…”)."}]}),
/* 9 */
P({name:"سهير منصور",consultant:"Dr. Bassem",age:"67",sex:"F",
  pastMedical:["DM since 2012 on Cidophage","Hypertension for 25 years","Not known cardiac","Left upper-limb disability",
    "Breast cancer — bilateral radical mastectomy 2011, chemotherapy and steroids not completed (hypo-osmolar coma), on hormonal therapy; metastases to liver (biopsy-proven), bone, stomach, adrenal, peritoneum",
    "Lumbosacral disc bulge (MRI) — 10 sessions in 6/2026","Difficulty swallowing","Generalised oedema 2 months ago, settled on diuretics",
    "ICU admission with tense ascites and hyponatraemia — pigtail, tapping for 3 weeks, then left against advice"],
  pastSurgical:["Bilateral radical mastectomy (2011)","Liver biopsy"],drugHistory:["Cidophage","Hormonal therapy (last dose 1/11/2026)"],
  encounters:[{type:"consult",department:"",location:"خاص الثامن",date:"before 18/11",complaint:"Ascites for tapping",
    hpi:"Hormonal therapy dose on 1/11/2026; next dose (due 2 weeks later) postponed by internal medicine. May be for targeted therapy with oncology.",
    vitalsLog:[V("Adm",{BP:"100/60",HR:"105",SpO2:"94 RA",Chest:"Fine basal crepitations, left",LL:"No oedema"}),
      V("2026-11-18",{BP:"110/70",[CL]:"Conscious",Output:"500 / 12 h",Others:"Ascitic tapping 4 L today (6 L yesterday) via pigtail"})],
    labs:[...L("2026-11-15","Creatinine 1.2"),
      ...L("2026-11-18","Urea 173;Creatinine 1.6;Na 136;K 5.2;pH 7.52;HCO3 17;PCO2 21;CRP 8;Albumin 3.3;INR 2.6"),...OL("2026-11-18","PTH 690")],
    imaging:[{test:"Sputum culture",result:"MDRO Klebsiella",date:""},{test:"Urine culture",result:"Candida",date:""},{test:"Ascitic fluid culture",result:"No growth",date:""},
      {test:"Echo",result:"Mild MR, EF 72%",date:"2026-11-18"}],
    events:[{when:"2026-11-17",text:"Ascitic tapping 6 L via pigtail."},
      {when:"2026-11-18",text:"Ascitic tapping 4 L. IV fluids stopped except saline 500 ml/24 h; encourage oral intake; follow up KFT, fluid chart and volume status."}],
    meds:[MD("Antodine","","1×1"),MD("Normal saline","","1×4","","2026-11-18","Stopped — saline 500 ml/24 h only"),MD("Ringer lactate","","1×4","","2026-11-18","Stopped"),
      MD("Saline","500 ml","/24 h","2026-11-18"),MD("Eliquis","2.5 mg","/12 h"),MD("Tavanic","750 mg","/48 h"),MD("Meronam","2 g","/8 h"),MD("Albumin","","/12 h"),
      MD("Pulmicort","",""),MD("Salbovent","",""),MD("Voriconazole","100 mg","/12 h")],
    notes:"Department not written in the message. PTH 690 (marked “!” in the message)."}]}),
/* 10 */
P({name:"محروس عبد الله",consultant:"Dr. Bassem",age:"64",
  pastMedical:["DM","Hypertension","IHD with stent — EF 37%"],
  encounters:[{type:"consult",department:"الرعاية المركزة",location:"رعاية الخامس",date:"before 18/11",complaint:"Diabetic foot and septic shock — was on Levophed, now off",
    vitalsLog:[V("Adm",{BP:"100/60",SpO2:"98 RA",CVP:"+3",Input:"3683",Output:"1600",LL:"Mild to moderate oedema"}),
      V("2026-11-18",{BP:"110/70",CVP:"5",[CL]:"Conscious",Input:"3000",Output:"1200 / 24 h"})],
    labs:[...L("11/3 (?)","Urea 113;Creatinine 1.3"),
      ...L("Adm","Urea 221;Creatinine 2.8;Na 131;K 4.5;pH 7.46;HCO3 19.9;PCO2 28;Hb 9.4;PLT 318;TLC 14.1;CRP 132;INR 1.1"),
      ...L("2026-11-18","Urea 246;Creatinine 3.7;Na 131;K 4.5;pH 7.44;HCO3 19;PCO2 28;Hb 7.9;PLT 340;TLC 11.8")],
    plan:[{text:"Possible left amputation",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-18",text:"Right amputation done; left foot shows signs of ischaemia — possible amputation. Follow up daily KFT and VBG."}],
    meds:[MD("Controloc","40",""),MD("Albumin","","/12 h"),MD("Tazocin","2.25 g","/6 h"),MD("Heparin","5,000","/6 h"),MD("Ator","40",""),MD("Ringer lactate","rate 60",""),MD("Aspocid","","")],
    notes:"“11/3 cr 1.3, urea 113” — date unclear (March, or a typo)."}]}),
/* 11 */
P({name:"عفاف رشدي",consultant:"Dr. Bassem",age:"70",sex:"F",
  pastMedical:["DM on insulin","Hypertension","Atrial fibrillation","Recurrent strokes with residual weakness","Femur fracture 2 months ago — bedridden and catheter-dependent since"],
  pastSurgical:["Internal fixation of femur fracture (2026)"],drugHistory:["Insulin"],
  encounters:[{type:"coadmit",department:"العظام",location:"رعاية الخامس",date:"before 15/11",complaint:"Poor oral intake, oliguria, dehydration, disorientation, toxic appearance",
    hpi:"New co-admission with orthopaedics (was in kidney transplant ward, moved to ICU 5th). Multiple bed sores over buttocks and back; oozing from the surgical site.",
    vitalsLog:[V("Adm",{BP:"110/60",HR:"120",SpO2:"97",Temp:"38",[CL]:"Disoriented",Chest:"Clear",LL:"Mild pedal oedema",Others:"Dehydrated, toxic; multiple oozing bed sores"}),
      V("2026-11-15",{BP:"70/40 → 110/70 on Levophed rate 3",CVP:"21",[CL]:"Disoriented to time, place, person; agitated",Output:"150 after Lasix 80",Others:"Shock — moved to ICU"}),
      V("2026-11-16",{BP:"110/70 on Levophed rate 3",HR:"120 (rapid AF)",SpO2:"89 RA → nasal O2 2 L",CVP:"35",[CL]:"Agitated",Output:"100 / h on Lasix"}),
      V("2026-11-17",{BP:"100/60 on Levophed 2",HR:"134",SpO2:"97",Temp:"37.5",CVP:"+13",LL:"Moderate right LL oedema",Input:"1032",Output:"2400"}),
      V("2026-11-18",{BP:"130/80 off Levophed",HR:"120",[CL]:"Slightly confused",Input:"980",Output:"1200"})],
    labs:[...L("Adm","Urea 130;Creatinine 2.6;Na 130;K 5.9;pH 7.40;PCO2 40;HCO3 23.2;Lactate 2.6;Hb 9.9;TLC 23;PLT 213"),
      ...L("2026-11-15","Urea 134;Creatinine 2.7;Uric acid 11.7;Na 133;K 5.4;Ca 7.79;Phos 4.6;pH 7.42;HCO3 22.1;PCO2 34;ALT 16.3;AST 59;Bilirubin T/D 1.2 / 0.96"),
      ...L("2026-11-16","Urea 148;Creatinine 2.8;Na 133;K 5;TLC 23;Hb 8.8;CRP 132;Albumin 2.3"),
      ...L("2026-11-17","Urea 152;Creatinine 3.03;Na 132;K 5.1;pH 7.35;HCO3 22.1;PCO2 40;Hb 9.1;PLT 282;TLC 20;CRP 106;Albumin 2.2;INR 1.3;RBS 200"),
      ...L("2026-11-18","Urea 165;Creatinine 3;Na 132;K 5.30;pH 7.37;HCO3 20;PCO2 35")],
    imaging:[{test:"Wound culture",result:"MRSA — sensitive to Averozolid",date:"2026-11-17"},{test:"Urine culture",result:"MDRO Klebsiella",date:"2026-11-17"}],
    plan:[{text:"Blood culture",state:"doing",due:"",resultDue:""},{text:"Orthopaedics: evacuation and vacuum",state:"todo",due:"",resultDue:""}],
    events:[{when:"Adm",text:"Plan: send cultures and adjust antibiotics, control source of sepsis, adequate hydration."},
      {when:"2026-11-15",text:"Shocked — moved to ICU, Levophed rate 3. CVP 21 → Lasix 80 mg, then UOP 150 ml. IV fluids stopped. Lasix 40 mg /8 h added. Urine, blood and wound cultures pending."},
      {when:"2026-11-16",text:"Agitated — for Quetiapine. Rapid AF (HR 120) — Cordarone, then Lanoxin. SpO2 89 → nasal O2 2 L. ABG normal."},
      {when:"2026-11-17",text:"Wound culture MRSA → Averozolid 600 mg /12 h added. Urine culture MDRO Klebsiella."},
      {when:"2026-11-18",text:"Off Levophed. Concor added for HR 120."}],
    meds:[MD("Losec","40 mg IV","×1"),MD("Perfalgan","1 g IV","q8h"),MD("Normal saline","500 ml IV","×3","Adm","2026-11-15","Stopped — CVP 21"),MD("Pulmicort + Atrovent","","nebuliser"),
      MD("Eliquis","","1×2"),MD("Tazocin","4.5 g IV","×2"),MD("Dalacin","600 mg IV","×3"),MD("Levophed","rate 3","","2026-11-15","2026-11-18","Weaned off"),
      MD("Lasix","40 mg","/8 h","2026-11-15"),MD("Quetiapine","","","2026-11-16"),MD("Cordarone","","","2026-11-16"),MD("Lanoxin","","","2026-11-16"),
      MD("Averozolid","600 mg","/12 h","2026-11-17"),MD("Concor","","","2026-11-18")]}]}),
/* 12 */
P({name:"صابر جلال",consultant:"Dr. Bassem",age:"63",
  pastMedical:["DM","Hypertension","HCV — treated","Stroke 2 years ago with right-sided weakness and dysarthria"],
  encounters:[{type:"consult",department:"المسالك",location:"رعاية الخامس",date:"before 12/11",complaint:"Urinary retention (suprapubic catheter) → AKI and disturbed conscious level",
    hpi:"New consult in urology — being moved to ICU 5th.",
    vitalsLog:[V("Adm",{BP:"150/90",Chest:"Right diminished air entry",LL:"No oedema",Others:"On IV fluids 1.5 L"}),
      V("2026-11-12",{BP:"150/80",CVP:"6",[CL]:"GCS 14/15",Chest:"Free",LL:"No oedema",Input:"220",Output:"1800",Others:"Off MV, on mask 8 L"}),
      V("2026-11-13",{BP:"150/80",SpO2:"92",CVP:"+2",Chest:"Clear",LL:"No oedema",Input:"1700",Output:"1800"}),
      V("2026-11-14",{BP:"130/80",SpO2:"96",[CL]:"GCS 14/15",LL:"No oedema",Input:"1490",Output:"2100"}),
      V("2026-11-15",{BP:"170/80",HR:"114",[CL]:"Disturbed — on MV",Output:"300 / 2 h"}),
      V("2026-11-16",{BP:"130/70",CVP:"6",[CL]:"Intubated, on MV",LL:"No oedema",Output:"100 / h",Others:"Right pigtail 1000 ml / 24 h"}),
      V("2026-11-17",{BP:"140/80",HR:"107",SpO2:"98 on MV",Temp:"37.7",CVP:"+3",LL:"No oedema",Input:"2500",Output:"2600",Others:"Pigtail 1500 ml"}),
      V("2026-11-18",{BP:"110/60",HR:"100",SpO2:"98",Input:"2600",Output:"2400 / 24 h",Others:"Off ventilator, pigtail removed"})],
    labs:[...L("Adm","Creatinine 2.6;HCO3 18;TLC 17"),
      ...L("2026-11-12","Urea 218;Creatinine 3.6;Na 140;K 3.3;pH 7.38;HCO3 18.3;PCO2 31;Hb 9.4;PLT 80;TLC 7.7;Lactate 0.8;Albumin 2.8;ALT 43;AST 52"),
      ...L("2026-11-13","Urea 222;Creatinine 3.9;Na 143;K 3.26;Hb 8.7;PLT 86;TLC 11.6;INR 1.1"),
      ...L("2026-11-14","Urea 238;Creatinine 3.5;Na 148;K 3.4;pH 7.32;PCO2 29;HCO3 14.9;Hb 9.5;PLT 151;TLC 15.8;ALT 22;AST 15;INR 1.25"),
      ...L("2026-11-15","Urea 232;Creatinine 3.38;Na 158;K 3.7;Hb 9.5;PLT 179;TLC 22.94;INR 1.1"),...OL("2026-11-15","CK 39;CK-MB 31.5"),
      ...L("2026-11-16","Urea 249;Creatinine 3.8;Na 158;K 3.4;Hb 8.6;PLT 212;TLC 20"),
      ...L("2026-11-17","Urea 255;Creatinine 4.1;Na 160;K 3.4;pH 7.28;HCO3 25.4;PCO2 54;Hb 8.2;PLT 217;TLC 21.3"),
      ...L("2026-11-18","Urea 272;Creatinine 4.7;Na 156;K 2.8;Hb 7;TLC 16.7;CRP 190")],
    imaging:[{test:"Pelvi-abdominal US",result:"Bilateral grade 1–2 nephropathy, mild left pleural effusion, colonic gaseous distension",date:"2026-11-14"},
      {test:"CT chest",result:"Bilateral pleural effusion, more on the right",date:"2026-11-15"},{test:"CT brain",result:"Done — neurology consulted",date:"2026-11-15"}],
    hd:[{date:"2026-11-18",notes:"1st HD session — planned for today"}],
    plan:[{text:"Urine culture",state:"doing",due:"",resultDue:""},{text:"Pleural fluid cytology",state:"doing",due:"",resultDue:""},{text:"Cultures",state:"doing",due:"",resultDue:""},
      {text:"Echo",state:"todo",due:"",resultDue:""},{text:"CT urinary tract report",state:"doing",due:"",resultDue:""}],
    events:[{when:"Adm",text:"Acidotic (HCO3 18) — stat correction. Lasix 20 mg /12 h (for stopping)."},
      {when:"2026-11-12",text:"Off MV, on mask 8 L. CRP ordered; urine culture pending till Saturday; new PAUS ordered."},
      {when:"2026-11-13",text:"For Ryle insertion, CT report, increased IV fluids."},
      {when:"2026-11-14",text:"No Ryle inserted."},
      {when:"2026-11-15",text:"Back on MV. Right pigtail inserted, cytology sent. CT brain done, neurology consultation done."},
      {when:"2026-11-16",text:"Tazocin added. G5% rate 40 added."},
      {when:"2026-11-17",text:"G5% increased to 100 ml/h; Ringer at 20 ml/h."},
      {when:"2026-11-18",text:"Off ventilator, pigtail removed. Hb 7. 1st HD session today."}],
    meds:[MD("IV fluids","1.5 L",""),MD("Lasix","20 mg","/12 h"),MD("Tazocin","","","2026-11-16"),MD("G5%","rate 40","","2026-11-16","2026-11-17","Increased to 100 ml/h"),
      MD("G5%","100 ml/h","","2026-11-17"),MD("Ringer","20 ml/h","","2026-11-17")],
    notes:"Input on 12/11 written as 220 (maybe 2200 — unclear)."}]}),
/* 13 */
P({name:"ممدوح فهمي",consultant:"Dr. Bassem",age:"67",
  pastMedical:["No previous medical history documented","Chronic leg ulceration"],pastSurgical:["Left TMA"],
  encounters:[{type:"consult",department:"جراحة الأوعية",location:"الأوعية",date:"2026-11-18",complaint:"Left LL ischaemia for amputation — referred for impaired kidney function, severe anaemia and metabolic acidosis",
    diagnosis:"AKI on impaired function (creatinine 2.2 → 3.3), severe anaemia, dehydration, mixed acid–base disturbance",
    vitalsLog:[V("Adm",{BP:"95/50",SpO2:"95 RA",[CL]:"GCS 15/15",Others:"Left LL ischaemia — for amputation"})],
    labs:[...L("Previous","Creatinine 2.2;Hb 7.3"),
      ...L("Adm","Urea 128;Creatinine 3.3;Hb 6.3;PLT 108;TLC 12.1;pH 7.47;HCO3 12.4;PCO2 17;Albumin 1.8;INR 1.92")],
    plan:[{text:"Pelvi-abdominal US",state:"todo",due:"",resultDue:""},{text:"CT chest",state:"todo",due:"",resultDue:""},{text:"Echo",state:"todo",due:"",resultDue:""},
      {text:"PTH, Ca, Phos, ALP",state:"todo",due:"",resultDue:""}],
    events:[{when:"Adm",text:"2 units packed RBCs, IV saline 1 L bolus, FFP, IV sodium bicarbonate once. Follow up VBG and new labs."}],
    meds:[MD("Unasyn","1.5 g","/12 h"),MD("Dalacin","600 mg","/8 h"),MD("Ringer","","/12 h"),MD("Sodium bicarbonate IV","","once"),MD("Heparin","","/6 h"),MD("Controloc","40 mg","/24 h")]}]})
];
for(const p of patients)for(const e of p.encounters){delete e.notes;for(const m of e.meds||[])if(isOnceMed(m)){m.once=true;delete m.stop;delete m.note}}
for(const p of patients)for(const e of p.encounters)if(e.status==="closed"&&!e.closeDate){
  const iso=a=>a.filter(d=>ISO.test(d||"")).sort().pop()||"";
  const ll=iso((e.labs||[]).map(l=>l.date));e.closeEst=ll?"last lab":"last record";e.closeDate=ll||iso([...(e.vitalsLog||[]).map(v=>v.date),...(e.events||[]).map(x=>x.when),...(e.imaging||[]).map(m=>m.date),...(e.hd||[]).map(h=>h.date)])||e.date;
  if(/not in the message/.test(e.closeNote||""))e.closeNote=""}
return patients}
let patients=[];
let openHist=false,view="home",consView=null,back="home",current=null,editing=null,mini=null,filter="all",flash=false;

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
function el(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k.startsWith("on"))e[k]=v;else if(k==="value")e.value=v;else e.setAttribute(k,v===true?"":v)}
  for(const k of kids.flat()){if(k==null||k===""||k===false)continue;e.append(k.nodeType?k:String(k))}return e}
let fid=0;const nid=()=>"f"+(++fid);
function fld(label,input,{req=false,hint=""}={}){const tg=input.focusTarget||input;if(!tg.id)tg.id=nid();return el("div",{class:"field"},el("label",{for:tg.id},label,req?el("span",{class:"req"}," *"):null),input,hint&&/^Recorded as/.test(hint)?el("small",{},hint):null)}
const inp=(v="",a={})=>el("input",{type:"text",value:v??"",...a});
const area=(v="",a={})=>el("textarea",a,v??"");
function sel(opts,v){const s=el("select",{});for(const o of opts){const[val,lab]=Array.isArray(o)?o:[o,o];s.append(el("option",{value:val},lab))}if(v!=null)s.value=v;return s}
function seg(name,opts,v){const box=el("div",{class:"seg",role:"radiogroup"});for(const[val,lab]of opts){const i=el("input",{type:"radio",name,value:val});if(val===v)i.checked=true;box.append(el("label",{},i,lab))}box.get=()=>box.querySelector("input:checked")?.value;return box}
const lines=t=>String(t||"").split("\n").map(s=>s.trim()).filter(Boolean);
const toLines=(arr,cols)=>(arr||[]).map(o=>typeof o==="string"?o:cols.map(c=>o[c]??"").join(" | ").replace(/( \| )+$/,"")).join("\n");
const fromLines=(t,cols)=>lines(t).map(l=>{const p=l.split("|").map(s=>s.trim());const o={};cols.forEach((c,i)=>o[c]=p[i]||"");return o});
const latest=p=>p.encounters[p.encounters.length-1];
const stateOf=p=>{const e=latest(p);return !e||e.status!=="active"?"out":e.type};
const typeLabel=e=>e.type==="nephro"?"Nephrology":TYPES[e.type]+(e.department?" · "+e.department:"");
const cur=()=>patients.find(p=>p.id===current);
const outcomeOf=e=>e.outcome||(e.type==="consult"?"signedoff":"discharged");
function pill(e){return e.status==="active"?el("span",{class:"pill "+e.type},typeLabel(e)):el("span",{class:"pill "+(outcomeOf(e)==="died"?"died":"out")},OUTCOMES[outcomeOf(e)])}
function dueList(){const out=[];for(const p of patients)for(const e of p.encounters)if(e.status==="active")(e.plan||[]).forEach(it=>{if(isDue(it))out.push({p,e,it})});return out}
function twoTap(btn,label,fn){let armed=0;btn.onclick=()=>{if(!btn.classList.contains("sure")){btn.classList.add("sure");btn.textContent=label;armed=Date.now();return}if(Date.now()-armed<1000)return;fn()};return btn}
function refreshLists(){
  const all=k=>patients.flatMap(p=>p.encounters.map(e=>e[k])).filter(Boolean);
  const fill=(id,vals)=>{$(id).replaceChildren(...[...new Set(vals)].map(v=>el("option",{value:v})))};
  fill("#dl-locations",[...BASE_LOC,...all("location")]);
  fill("#dl-departments",[...BASE_DEPT,...all("department")]);
  fill("#dl-consultants",[...CONSULTANTS,...patients.map(p=>p.consultant).filter(Boolean)]);
}

/* ---------- shared input blocks ---------- */
const TEXTCOLS=new Set(["BP","Conscious level","Chest","LL","Others"]);
const EXAM_PH={"Conscious level":"Conscious, oriented / drowsy / GCS 13",Chest:"Clear / basal creps / wheezy",LL:"No oedema / mild pitting",Others:"JVP, abdomen…"};
function bpInput(v=""){const[a,b]=String(v||"").split("/").map(x=>(x||"").trim());
  const i1=el("input",{type:"text",inputmode:"numeric",maxlength:"3",class:"mono",placeholder:"120","aria-label":"Systolic",value:a||""});
  const i2=el("input",{type:"text",inputmode:"numeric",maxlength:"3",class:"mono",placeholder:"80","aria-label":"Diastolic",value:b||""});
  i1.oninput=()=>{const raw=i1.value;i1.value=raw.replace(/\D/g,"");const v=i1.value;if(raw.includes("/")||v.length===3||(v.length===2&&!"12".includes(v[0])))i2.focus()};
  i2.oninput=()=>{i2.value=i2.value.replace(/\D/g,"")};
  i2.onkeydown=ev=>{if(ev.key==="Backspace"&&!i2.value)i1.focus()};
  const s=el("span",{class:"bp"},i1,el("span",{class:"slash"},"/"),i2);s.focusTarget=i1;
  Object.defineProperty(s,"value",{get:()=>(i1.value||i2.value)?(i1.value+"/"+i2.value):"",set:v=>{const[x,y]=String(v||"").split("/");i1.value=x||"";i2.value=y||""}});
  return s}
function autoCons(type,loc,dept){const n=String((loc||"")+" "+(dept||"")).replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").toLowerCase();
  if(type==="hd")return"";
  if(type==="consult"||/رعايه|\bicu\b|عنايه/.test(n))return"Dr. Bassem";
  if(/خاص\s*(ال)?سابع|نفسي|عصبي/.test(n))return"Dr. Hossam";
  return"Dr. Hesham"}
function autoConsWire(c,getType,getLoc,getDept,ins){if(c.value.trim())c.dataset.manual="1";
  c.addEventListener("input",()=>{c.dataset.manual=c.value.trim()?"1":""});
  const upd=()=>{if(c.dataset.manual)return;c.value=autoCons(getType(),getLoc(),getDept())};
  ins.forEach(i=>{i.addEventListener("input",upd);i.addEventListener("change",upd)});upd();return upd}
function drugsFrom(t){const m=String(t).match(/(?:^|\s)(?:on|على)\s+(.+)$/i);if(!m)return[];return m[1].split(/\s*\+\s*|\s*[,،]\s*|\s+and\s+|\s+&\s+|\s+و\s+/i).map(x=>x.trim()).filter(Boolean)}
function listEditor(items,ph,onAdd){const list=[...(items||[])];const box=el("div",{class:"sec",style:"gap:6px"});const chips=el("div",{class:"chips"});const i=inp("",{placeholder:ph||"Add an item"});
  const draw=()=>chips.replaceChildren(...list.map((x,k)=>el("span",{class:"chip edit"},x,el("button",{type:"button",class:"x","aria-label":"Remove "+x,onclick:()=>{list.splice(k,1);draw()}},"✕"))));
  const add=()=>{const v=i.value.trim();if(v){list.push(v);i.value="";draw();onAdd&&onAdd(v)}};i.onkeydown=ev=>{if(ev.key==="Enter"){ev.preventDefault();add()}};
  box.addItem=v=>{if(!list.some(x=>x.toLowerCase()===v.toLowerCase())){list.push(v);draw()}};
  box.append(chips,el("div",{class:"row"},i,el("button",{type:"button",class:"small",onclick:add},"Add")));draw();box.get=()=>{add();return list};box.focusTarget=i;return box}
function logBlock(cols,cls,pre){const ins={};const g=el("div",{class:cls});
  for(const[c,u]of cols){const i=c==="BP"?bpInput(pre?.BP):inp(pre?.[c]||"",{class:TEXTCOLS.has(c)?"":"mono",placeholder:EXAM_PH[c]||u,inputmode:TEXTCOLS.has(c)?"text":"decimal"});ins[c]=i;const f=fld(c==="LL"?"Lower limbs (LL)":c,i);(g.fields=g.fields||{})[c]=f;g.append(f)}
  g.read=date=>{const e={date};for(const[c]of cols)if(ins[c].value.trim())e[c]=ins[c].value.trim();return Object.keys(e).length>1?e:null};return g}
const vitalsBlock=pre=>logBlock(VCOLS,"vgrid",pre),examBlock=pre=>logBlock(ECOLS,"fgrid",pre);
function saveLog(e,...entries){for(const v of entries){if(!v)continue;e.vitalsLog=e.vitalsLog||[];const x=e.vitalsLog.find(y=>y.date===v.date);x?Object.assign(x,v):e.vitalsLog.push(v)}}
function labsBlock(tests=DAILY_TESTS,existing=[]){tests=[...tests];for(const l of existing)if(!tests.some(([t])=>lkey(t)===lkey(l.name)))tests.push([l.name,l.unit||""]);
  const ins={};const g=el("div",{class:"vgrid"});
  for(const[t,u]of tests){const ex=existing.find(l=>lkey(l.name)===lkey(t));const i=inp(ex?.value||"",{class:"mono",placeholder:u,inputmode:"decimal"});ins[t]=i;const f=fld(t,i);(g.fields=g.fields||{})[t]=f;g.append(f)}
  const extra=[],exBox=el("div",{class:"sec",style:"gap:6px"});
  const addRow=()=>{const r={n:inp("",{placeholder:"Test","aria-label":"Test name"}),v:inp("",{class:"mono",placeholder:"Result","aria-label":"Result"}),u:inp("",{placeholder:"Unit","aria-label":"Unit"})};extra.push(r);
    const row=el("div",{class:"orow"},r.n,r.v,r.u,el("button",{type:"button",class:"link small","aria-label":"Remove row",onclick:()=>{extra.splice(extra.indexOf(r),1);row.remove()}},"✕"));exBox.append(row);return r};
  const wrap=el("div",{class:"sec",style:"gap:8px"},g,exBox,el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>addRow().n.focus()},"+ Other test"));
  wrap.read=date=>[...tests.filter(([t])=>ins[t].value.trim()).map(([t,u])=>({date,name:t,value:ins[t].value.trim(),unit:u,once:false})),
    ...extra.filter(r=>r.n.value.trim()&&r.v.value.trim()).map(r=>({date,name:r.n.value.trim(),value:r.v.value.trim(),unit:r.u.value.trim(),once:false}))];wrap.fields=g.fields||{};return wrap}
function medRows(){const rows=[],list=el("div",{class:"sec",style:"gap:6px"});
  const add=()=>{const r={n:inp("",{placeholder:"Drug","aria-label":"Drug"}),d:inp("",{placeholder:"Dose","aria-label":"Dose"}),f:inp("",{placeholder:"Frequency","aria-label":"Frequency"})};rows.push(r);
    const row=el("div",{class:"orow"},r.n,r.d,r.f,el("button",{type:"button",class:"link small","aria-label":"Remove drug",onclick:()=>{rows.splice(rows.indexOf(r),1);row.remove()}},"✕"));list.append(row);return r};
  add();const box=el("div",{class:"sec",style:"gap:8px"},list,el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>add().n.focus()},"+ Add drug"));
  box.read=date=>rows.filter(r=>r.n.value.trim()).map(r=>({name:r.n.value.trim(),dose:r.d.value.trim(),freq:r.f.value.trim(),start:date}));return box}
function planBlock(list){ // edits list in place
  const box=el("div",{class:"sec"});const ul=el("ul",{class:"check plan2"});const custom=inp("",{placeholder:"+ Add item",class:"addin"});
  const chips=el("div",{class:"chips"},PLAN_PRESETS.map(t=>el("button",{class:"chip",type:"button","data-t":t,onclick:()=>{list.push({text:t,state:"todo",due:"",resultDue:""});draw()}},"+ "+t)));
  const draw=()=>{ul.replaceChildren(...list.map((it,i)=>el("li",{class:"pi"},el("div",{class:"pmain"},el("span",{class:"txt"},it.text)),el("button",{class:"link small",type:"button",onclick:()=>{list.splice(i,1);draw()}},"✕"))));
    chips.querySelectorAll("button").forEach(b=>b.hidden=list.some(x=>x.text===b.dataset.t))};
  const add=()=>{const t=custom.value.trim();if(t){list.push({text:t,state:"todo",due:"",resultDue:""});custom.value="";draw()}};
  custom.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add()}};
  box.append(ul,el("div",{class:"row",style:"flex-wrap:nowrap"},custom,el("button",{class:"small",type:"button",onclick:add},"Add")),chips);draw();return box}

function trendBox(e,name){const ls=(e.labs||[]).filter(l=>!isOnce(l)&&lkey(l.name)===lkey(name));const ds=orderDates(ls);
  const pts=ds.map(d=>{const l=ls.filter(x=>(x.date||"")===d).pop();return{d,v:parseFloat(String(l.value).replace(",","."))}}).filter(x=>!isNaN(x.v));
  const close=el("button",{class:"small",onclick:()=>{mini=null;render()}},"Close");
  if(pts.length<2)return el("div",{class:"minibox"},el("h3",{},name),el("p",{class:"empty"},"Not enough values for a trend yet."),close);
  const W=340,H=170,pl=40,pr=14,pt=18,pb=30;const vs=pts.map(x=>x.v);let lo=Math.min(...vs),hi=Math.max(...vs);const rg=RANGES[lkey(name)];
  if(rg){lo=Math.min(lo,rg[0]);hi=Math.max(hi,rg[1])}if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
  const X=i=>pl+i*(W-pl-pr)/(pts.length-1),Y=v=>pt+(hi-v)*(H-pt-pb)/(hi-lo);const NS="http://www.w3.org/2000/svg";
  const sv=(t,a,txt)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);if(txt!=null)n.textContent=txt;return n};
  const svg=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"trend",role:"img","aria-label":name+" trend"});
  if(rg)svg.append(sv("rect",{x:pl,y:Y(rg[1]),width:W-pl-pr,height:Math.max(1,Y(rg[0])-Y(rg[1])),class:"band"}));
  [lo+pad,hi-pad].forEach(v=>svg.append(sv("text",{x:pl-6,y:Y(v)+4,class:"ax","text-anchor":"end"},+v.toFixed(2))));
  svg.append(sv("polyline",{points:pts.map((x,i)=>X(i)+","+Y(x.v)).join(" "),class:"ln"}));
  const step=Math.ceil(pts.length/6);
  pts.forEach((x,i)=>{const f=rg?(x.v>rg[1]?"H":x.v<rg[0]?"L":""):"";svg.append(sv("circle",{cx:X(i),cy:Y(x.v),r:3.5,class:"pt "+f}));
    if(i%step===0||i===pts.length-1){svg.append(sv("text",{x:X(i),y:Y(x.v)-7,class:"vl "+f,"text-anchor":"middle"},String(x.v)));svg.append(sv("text",{x:X(i),y:H-8,class:"ax","text-anchor":"middle"},fmtDate(x.d)))}});
  return el("div",{class:"minibox trendbox"},el("div",{class:"sec-head"},el("h3",{},name+" — trend"),close),svg,rg?el("span",{class:"legend"},"Shaded band = normal range "+rg[0]+"–"+rg[1]):null)}
/* ---------- storage engine: every change is saved as its own small field ---------- */
// A patient is stored as a flat map: "f|name" → JSON, "e|<admission>|f|status" → JSON,
// "e|<admission>|labs|<id>" → JSON of one lab. Two doctors editing different things never overwrite each other.
const editLog=[],trash=[];const base={},baseObj={},legacy=new Set();let dir={};
let histQ="",adminTab="history",nextLabel=null,noTrashOnce=false,buffered=null,histCount=null;
const WHO=()=>window.Store?.email||"You";
const isAdmin=()=>!!window.Store?.isAdmin;
const stamp=()=>{const o=cairo();return fmtDate(today())+" "+o.hour+":"+o.minute};
const daysSince=d=>Math.floor((new Date(today())-new Date(d))/864e5);
const ITEMARR=["labs","vitalsLog","imaging","plan","hd","images","events","meds"];
const IDF={labs:l=>(l.date||"")+"|"+lkey(l.name),vitalsLog:v=>v.date||"",plan:i=>i.text,meds:m=>lkey(m.name)+"|"+(m.start||""),hd:h=>(h.date||"")+"|"+(h.kind||""),
  events:x=>(x.when||"")+"|"+x.text,imaging:m=>(m.test||"")+"|"+(m.date||""),images:m=>(m.title||"")+"|"+(m.date||"")};
let seq=0;const newId=()=>Date.now().toString(36)+(++seq).toString(36)+Math.random().toString(36).slice(2,5);
const clone=o=>JSON.parse(JSON.stringify(o));
const codeNum=c=>+((String(c||"").match(/^NW-(\d+)/)||[0,0])[1]);
const isActive=p=>latest(p)?.status==="active";
function ensureIds(p,bp){
  if(!p.code){p.code="TMP-"+Math.random().toString(36).slice(2,6).toUpperCase();p._tmpBy=WHO()}
  const bE=new Map((bp?.encounters||[]).map(e=>[e.key,e]));let eo=Math.max(-1,...p.encounters.map(e=>e._o??-1));
  for(const e of p.encounters){if(!e.key)e.key=uidf("e");if(e._o==null)e._o=++eo;const be=bE.get(e.key);
    for(const k of ITEMARR){const v=e[k]=Array.isArray(e[k])?e[k]:[];const used=new Set(v.map(x=>x&&x._id).filter(Boolean));const pool=new Map();const idf=IDF[k];
      for(const x of be?.[k]||[])if(x._id&&!used.has(x._id)){const f=idf(x);if(!pool.has(f))pool.set(f,x)}
      let mo=Math.max(0,...v.map(x=>x?._o||0));
      for(const x of v){if(!x||typeof x!=="object"||x._id)continue;const old=pool.get(idf(x));
        if(old){pool.delete(idf(x));x._id=old._id;x._o=old._o;if(old._by){x._by=old._by;x._at=old._at}}else{x._id=newId();x._o=++mo;x._by=WHO();x._at=stamp()}}}}}
function flat(p){const d={};
  for(const[k,v]of Object.entries(p)){if(k==="encounters"||k==="id"||k.startsWith("_stub")||v===undefined)continue;d["f|"+k]=JSON.stringify(v)}
  for(const e of p.encounters||[]){const b="e|"+e.key+"|";
    for(const[k,v]of Object.entries(e)){if(k==="key"||v===undefined)continue;if(ITEMARR.includes(k)){for(const x of v||[])d[b+k+"|"+x._id]=JSON.stringify(x)}else d[b+"f|"+k]=JSON.stringify(v)}}
  return d}
const byO=(a,b)=>(a._o||0)-(b._o||0)||String(a._id).localeCompare(String(b._id));
function unflat(id,d){const p={id,encounters:[]};const E={};
  for(const[k,v]of Object.entries(d||{})){const s=k.split("|");let val;try{val=JSON.parse(v)}catch{continue}
    if(s[0]==="f")p[s[1]]=val;else if(s[0]==="e"){const e=E[s[1]]||(E[s[1]]={key:s[1]});if(s[2]==="f")e[s[3]]=val;else(e[s[2]]=e[s[2]]||[]).push(val)}}
  for(const e of Object.values(E)){if(e.status===undefined)continue;for(const k of ITEMARR)e[k]=(e[k]||[]).sort(byO);p.encounters.push(e)}
  p.encounters.sort((a,b)=>(a._o??0)-(b._o??0));
  for(const k of["pastMedical","pastSurgical","drugHistory"])if(!Array.isArray(p[k]))p[k]=[];return p}
function diffFlat(b,d){const ch=[];for(const k in d)if(b[k]!==d[k])ch.push([k,b[k]??null,d[k]]);for(const k in b)if(!(k in d))ch.push([k,b[k],null]);return ch}
const isItemKey=k=>{const s=k.split("|");return s[0]==="e"&&s.length===4&&s[2]!=="f"};
function itemAt(p,k){const s=k.split("|");const e=p.encounters.find(x=>x.key===s[1]);return(e?.[s[2]]||[]).find(x=>x._id===s[3])}
const noStamp=j=>{try{const o=JSON.parse(j);delete o._eb;delete o._ea;return JSON.stringify(o)}catch{return j}};
const replaceIn=(p,q)=>{for(const k of Object.keys(p))delete p[k];Object.assign(p,q)};
function itemLabel(a,x){x=x||{};return a==="labs"?"Lab · "+x.name+" "+(x.value||"")+" ("+fmtDate(x.date)+")":a==="vitalsLog"?"Vitals / exam · "+fmtDate(x.date):a==="plan"?"Plan · "+x.text:
  a==="meds"?"Medication · "+medTxt(x):a==="hd"?"HD session · "+fmtDate(x.date):a==="events"?"Event · "+String(x.text||"").slice(0,60):a==="imaging"?"Test · "+(x.test||""):"Image · "+(x.title||"")}
function addTrash(t){Object.assign(t,{id:newId(),at:today(),by:WHO(),ts:Date.now()});trash.unshift(t);Store.trashAdd(t)}
function trashFromDiff(p,b,ch){if(noTrashOnce)return;const removed=ch.filter(([,f,t])=>t===null&&f!==null);
  const gone=new Set(removed.filter(([k])=>/^e\|[^|]+\|f\|status$/.test(k)).map(([k])=>k.split("|")[1]));
  for(const ek of gone){const keys={};for(const[k,v]of Object.entries(b))if(k.startsWith("e|"+ek+"|"))keys[k]=v;let dt="";try{dt=JSON.parse(b["e|"+ek+"|f|date"]||'""')}catch{}
    addTrash({kind:"adm",pid:p.id,pname:p.name,label:"Whole admission · "+fmtDate(dt),kj:JSON.stringify(keys)})}
  for(const[k,f]of removed){const s=k.split("|");if(s[0]!=="e"||gone.has(s[1])||s[2]==="f")continue;let x={};try{x=JSON.parse(f)}catch{}
    addTrash({kind:"item",pid:p.id,pname:p.name,label:itemLabel(s[2],x),kj:JSON.stringify({[k]:f})})}
  for(const[k,f,t]of ch){if(!f||!t||!isItemKey(k))continue;let a={},c={};try{a=JSON.parse(f);c=JSON.parse(t)}catch{}
    if(a.imageId&&a.imageId!==c.imageId)addTrash({kind:"img",pid:p.id,pname:p.name,label:"Image · "+(a.name||a.test||a.title||""),kj:JSON.stringify({[k]:f}),img:a.imageId,img2:a.thumbId||""})}}
function diffSummary(a,b){const out=[];const F=x=>x||"—";const cap=k=>k[0].toUpperCase()+k.slice(1);
  for(const k of["name","age","sex","consultant","nid","phone","allergies","habits","occupation","residence","marital"])if((a[k]||"")!==(b[k]||""))out.push(cap(k)+": "+F(a[k])+" → "+F(b[k]));
  for(const k of["pastMedical","pastSurgical","drugHistory"]){const A=a[k]||[],B=b[k]||[];B.filter(x=>!A.includes(x)).forEach(x=>out.push("+ "+x));A.filter(x=>!B.includes(x)).forEach(x=>out.push("− "+x))}
  const EA=new Map((a.encounters||[]).map(e=>[e.key,e]));
  for(const e of b.encounters||[]){const o=EA.get(e.key);EA.delete(e.key);if(!o){out.push("New admission "+fmtDate(e.date));continue}
    if(o.status!==e.status)out.push(e.status==="closed"?"Admission closed — "+(OUTCOMES[e.outcome]||""):"Admission reopened");
    for(const k of["location","department","complaint","diagnosis","hpi","date","type"])if((o[k]||"")!==(e[k]||""))out.push(cap(k)+": "+F(o[k])+" → "+F(e[k]));
    const lk=l=>(l.date||"")+"|"+lkey(l.name);const LA=new Map((o.labs||[]).map(l=>[lk(l),l]));const add=[];
    for(const l of e.labs||[]){const x=LA.get(lk(l));LA.delete(lk(l));if(!x)add.push(l);else if(x.value!==l.value)out.push(l.name+" "+fmtDate(l.date)+": "+x.value+" → "+l.value)}
    if(add.length){const ds=[...new Set(add.map(l=>l.date))];out.push("Labs "+ds.map(fmtDate).join(", ")+(add.length<=3?": "+add.map(l=>l.name+" "+l.value).join(", "):" ("+add.length+" values)"))}
    if(LA.size)out.push("Labs removed: "+[...LA.values()].slice(0,3).map(l=>l.name+" "+fmtDate(l.date)).join(", "));
    const VA=new Map((o.vitalsLog||[]).map(v=>[v.date,JSON.stringify(v)]));for(const v of e.vitalsLog||[]){const x=VA.get(v.date);VA.delete(v.date);if(x!==JSON.stringify(v))out.push((x?"Vitals/exam edited ":"Vitals/exam ")+fmtDate(v.date))}
    for(const d of VA.keys())out.push("Vitals/exam removed "+fmtDate(d));
    const PA=new Map((o.plan||[]).map(it=>[it.text,it]));for(const it of e.plan||[]){const x=PA.get(it.text);PA.delete(it.text);if(!x){out.push("Plan: + "+it.text);continue}
      if(x.state!==it.state)out.push("Plan: "+it.text+" → "+(it.state==="cancelled"?"Cancelled":(STATES.find(q=>q[0]===it.state)||[0,it.state])[1]));
      if((x.due||"")!==(it.due||"")||(x.resultDue||"")!==(it.resultDue||""))out.push("Plan: "+it.text+" — "+([it.due&&"scheduled "+fmtDate(it.due),it.resultDue&&"result "+fmtDate(it.resultDue)].filter(Boolean).join(", ")||"dates cleared"));
      if((x.result||"")!==(it.result||"")&&it.result)out.push("Plan: "+it.text+" = "+it.result)}
    for(const t of PA.keys())out.push("Plan: − "+t);
    const mk=m=>m.name+"|"+(m.start||"");const MA=new Map((o.meds||[]).map(m=>[mk(m),m]));
    for(const m of e.meds||[]){const x=MA.get(mk(m));MA.delete(mk(m));
      if(!x){if(!(e.meds||[]).some(y=>y!==m&&lkey(y.name)===lkey(m.name)&&y.stop&&y.stop===m.start))out.push("Started "+medTxt(m));continue}
      if(!x.stop&&m.stop)out.push(/^Changed/.test(m.note||"")?m.name+": "+[x.dose,x.freq].filter(Boolean).join(" ")+" → "+m.note.replace(/^Changed to /,""):"Stopped "+medTxt(m));
      else if(medTxt(x)!==medTxt(m))out.push("Medication: "+medTxt(x)+" → "+medTxt(m))}
    for(const m of MA.values())out.push("Medication removed: "+medTxt(m));
    const ne=(e.events||[]).length-(o.events||[]).length;if(ne>0&&!out.length)out.push("Event: "+String(e.events[e.events.length-1].text||"").slice(0,70));
    const nh=(e.hd||[]).length-(o.hd||[]).length;if(nh>0)out.push("HD session "+fmtDate(e.hd[e.hd.length-1].date));else if(JSON.stringify(o.hd||[])!==JSON.stringify(e.hd||[]))out.push("HD session edited");
    if(JSON.stringify(o.imaging||[])!==JSON.stringify(e.imaging||[])||JSON.stringify(o.images||[])!==JSON.stringify(e.images||[]))out.push("Tests / imaging edited")}
  for(const o of EA.values())out.push("Admission deleted "+fmtDate(o.date));
  return out.length?out.slice(0,6).join(" · ")+(out.length>6?" · +"+(out.length-6)+" more":""):"Edited"}
function logEdit(p,summary,ch){let cj=ch?JSON.stringify(ch):"";if(cj.length>200000)cj="";
  const h={id:newId(),pid:p.id,name:p.name,at:stamp(),by:WHO(),summary,ts:Date.now(),cj};editLog.unshift(h);Store.addHistory(h)}
function dirOf(p,d){const e=latest(p)||{};let sz=0;for(const k in d)sz+=k.length+d[k].length;let img=0,ib=0;
  for(const x of p.encounters.flatMap(e=>ITEMARR.flatMap(k=>e[k]||[])))if(x.imageId){img++;ib+=(x.imgKB||200)*1024}
  return{n:p.name||"",c:p.code||"",nid:p.nid||"",ph:p.phone||"",age:p.age||"",cons:p.consultant||"",loc:e.location||"",t:e.type||"",st:e.status==="active"?"a":"c",
    oc:e.status==="active"?"":outcomeOf(e),d:e.date||"",cd:e.closeDate||"",sz,img,ib}}
function dirSync(p,d){const x=dirOf(p,d),o=dir[p.id];
  if(o&&Object.keys(x).every(k=>k==="sz"?Math.abs((o.sz||0)-x.sz)<Math.max(2048,(o.sz||0)*0.1):o[k]===x[k]))return;dir[p.id]=x;Store.setDir(p.id,x)}
const wGuard={};const pendingCode=new Set(),codeLater=[],gotCode={};
function finalizeCodes(){for(const p of patients){if(/^TMP-/.test(p.code||"")&&gotCode[p.id]){p.code=gotCode[p.id];delete p._tmpBy;continue}if(!/^TMP-/.test(p.code||"")||(p._tmpBy&&p._tmpBy!==WHO())||pendingCode.has(p.id))continue;pendingCode.add(p.id);
  let m=0;for(const x of Object.values(dir))m=Math.max(m,codeNum(x.c));for(const x of patients)m=Math.max(m,codeNum(x.code));
  const id=p.id;Promise.resolve(Store.allocCode(m)).then(c=>{const q=patients.find(x=>x.id===id);if(c)gotCode[id]=c;if(c&&q&&/^TMP-/.test(q.code||"")){q.code=c;delete q._tmpBy;if(!busy())render();else codeLater.push(id)}}).catch(()=>{}).finally(()=>pendingCode.delete(p.id))}}
const lastJ={};
function persist(){if(!window.Store)return false;let tmp=false,wrote=false;
  for(const p of patients){if(p._stub)continue;const j0=JSON.stringify(p);if(base[p.id]&&lastJ[p.id]===j0)continue;const bo=baseObj[p.id];ensureIds(p,bo);if(/^TMP-/.test(p.code))tmp=true;
    let d=flat(p);const b=base[p.id];
    if(!b){wrote=true;Store.createPatient(p.id,d,isActive(p));base[p.id]=d;baseObj[p.id]=clone(p);lastJ[p.id]=JSON.stringify(p);if(!legacy.has(p.id))logEdit(p,nextLabel||"Patient added",null);legacy.delete(p.id);dirSync(p,d);continue}
    let ch=diffFlat(b,d);if(!ch.length){lastJ[p.id]=JSON.stringify(p);continue}let re=false;
    for(const[k,f,t]of ch)if(f&&t&&isItemKey(k)&&noStamp(f)!==noStamp(t)){const it=itemAt(p,k);if(it){it._eb=WHO();it._ea=stamp();re=true}}
    if(re){d=flat(p);ch=diffFlat(b,d)}
    {const t=Date.now();ch=ch.filter(([k])=>{const w=(wGuard[p.id+k]||[]).filter(x=>t-x<60000);w.push(t);wGuard[p.id+k]=w;if(w.length>8){syncNote("A field kept changing by itself and was paused to protect your data — reload the app.");return false}return true});if(!ch.length)continue}
    Store.updatePatient(p.id,Object.fromEntries(ch.map(([k,,t])=>[k,t])),isActive(p));wrote=true;if(navigator.onLine===false){offlineEdits++;window.setSyncState("offline")}
    trashFromDiff(p,b,ch);const real=ch.filter(([k])=>!/(^|\|)f\|edited$/.test(k));
    if(real.length)logEdit(p,nextLabel||diffSummary(bo||{},p),real);
    base[p.id]=d;baseObj[p.id]=clone(p);dirSync(p,d);lastJ[p.id]=JSON.stringify(p)}
  nextLabel=null;noTrashOnce=false;if(tmp)finalizeCodes();return wrote}
function fromDoc(x){if(x.d){base[x.id]={...x.d};const p=unflat(x.id,x.d);baseObj[x.id]=clone(p);return p}
  let p;try{p=JSON.parse(x.data)}catch{p={id:x.id,name:"?",encounters:[]}}p.id=x.id;delete base[x.id];delete baseObj[x.id];legacy.add(x.id);return p}
let activeIds=new Set();
function applyRemote(list){activeIds=new Set(list.map(x=>x.id));const got=list.map(fromDoc);const ids=new Set(got.map(p=>p.id));
  const keep=patients.filter(p=>!ids.has(p.id)&&!p._stub&&dir[p.id]);patients=[...got,...keep];finalizeCodes()}
const busy=()=>!!(mini||editing||view==="new"||view==="import"||view==="crit");
function syncNote(t){const n=$("#syncnote");if(n)n.textContent=t}
function clearColleagueNote(){const n=$("#syncnote");if(n&&/^New updates|^Opening /.test(n.textContent))n.textContent=""}
window.onRemotePatients=list=>{if(busy()){buffered=list;syncNote("New updates from colleagues — they'll show when you close this form.")}else{applyRemote(list);render()}};
window.onRemoteTrash=list=>{trash.length=0;trash.push(...list);if(!busy())render()};
window.onRemoteHistory=list=>{editLog.length=0;editLog.push(...list);if(view==="admin"&&!busy())render()};
window.onRemoteDir=m=>{dir=m||{};patients=patients.filter(p=>dir[p.id]||activeIds.has(p.id)||!base[p.id]);if(!busy())render()};
window.onRemoteSettings=s=>{critRules=Array.isArray(s?.crit)&&s.crit.length?s.crit:DEFAULT_CRIT;if(!busy())render()};
function hydrateImgs(root=document){root.querySelectorAll("img[data-img]:not([src])").forEach(img=>{Promise.resolve(Store.getImage(img.dataset.img)).then(s=>{if(s)img.src=s;else img.alt="Image deleted"}).catch(()=>{img.alt="Image unavailable offline"})})}
/* archived patients (not in the ward) live only in the directory until opened */
function stubOf(id,x){return{id,name:x.n,code:x.c,nid:x.nid||"",phone:x.ph||"",age:x.age||"",consultant:x.cons||"",_stub:true,pastMedical:[],pastSurgical:[],drugHistory:[],
  encounters:[{key:"stub",type:x.t||"nephro",status:x.st==="a"?"active":"closed",outcome:x.oc||"",location:x.loc||"",date:x.d||"",closeDate:x.cd||"",labs:[],vitalsLog:[],plan:[],hd:[],events:[],meds:[],imaging:[],images:[]}]}}
function allIndex(){const m=new Map();for(const[id,x]of Object.entries(dir))m.set(id,stubOf(id,x));for(const p of patients)m.set(p.id,p);return[...m.values()]}
async function loadPatient(id){const have=patients.find(p=>p.id===id);if(have)return have;const x=await Store.getPatient(id);if(!x)return null;const p=fromDoc(x);patients.push(p);return p}
function openStub(p,from,target){syncNote("Opening "+p.name+"…");loadPatient(p.id).then(full=>{syncNote(full?"":"Couldn't open this file — check the connection.");if(full)openPatient(full,from,target)}).catch(()=>syncNote("Couldn't open this file — check the connection."))}
let twins=new Map();
function buildTwins(){twins=new Map();for(const p of allIndex()){const k=normName(p.name);if(k)twins.set(k,(twins.get(k)||0)+1)}}
/* undo, restore, delete */
function undoChange(h){const p=patients.find(x=>x.id===h.pid);if(!p)return;
  if(h.before){try{replaceIn(p,Object.assign(JSON.parse(h.before),{id:p.id}))}catch{return}}
  else{let ch=[];try{ch=JSON.parse(h.cj||"[]")}catch{}if(!ch.length)return;const d=flat(p);for(const[k,f]of ch){if(f==null)delete d[k];else d[k]=f}replaceIn(p,unflat(p.id,d))}
  p.edited=now();nextLabel="Undid the change from "+h.at+" ("+String(h.summary||"").slice(0,80)+")";render()}
function dropTrash(t,forGood){const i=trash.indexOf(t);if(i>=0)trash.splice(i,1);Store.trashDelete(t.id);
  if(forGood){const ids=new Set([t.img,t.img2].filter(Boolean));try{JSON.stringify(JSON.parse(t.kj||"{}"),(k,v)=>{if((k==="imageId"||k==="thumbId")&&v)ids.add(v);if(typeof v==="string"&&v.includes("imageId")){try{const o=JSON.parse(v);if(o.imageId)ids.add(o.imageId);if(o.thumbId)ids.add(o.thumbId)}catch{}}return v})}catch{}
    if(t.kind==="item"||t.kind==="adm"||t.kind==="img"||t.kind==="patient")ids.forEach(id=>Store.deleteImage(id))}}
function purgeTrash(){if(!isAdmin())return;for(const t of[...trash])if(daysSince(t.at)>=30){dropTrash(t,true)}}
function deletePatient(p){if(!isAdmin())return;const i=patients.indexOf(p);if(i<0)return;patients.splice(i,1);
  const t={kind:"patient",pid:p.id,pname:p.name,label:"Whole file ("+(p.code||"")+")",kj:JSON.stringify(base[p.id]||flat(p))};Object.assign(t,{id:newId(),at:today(),by:WHO(),ts:Date.now()});trash.unshift(t);
  Store.trashPatient(p.id,t);delete base[p.id];delete baseObj[p.id];delete dir[p.id];Store.setDir(p.id,null);logEdit(p,"Moved to Recently deleted",null);
  view="home";current=null;editing=null;mini=null;render();scrollTo(0,0)}
async function restoreDeleted(t){let keys={};try{keys=JSON.parse(t.kj||"{}")}catch{}
  if(t.kind==="patient"){if(patients.some(x=>x.id===t.pid)){syncNote("This patient already exists.");return}patients.push(unflat(t.pid,keys));nextLabel="Restored from Recently deleted";dropTrash(t,false);render();return}
  let p=patients.find(x=>x.id===t.pid);if(!p)try{p=await loadPatient(t.pid)}catch{}
  if(!p){syncNote("The patient's file is gone, so this can't be put back — restore the patient first.");return}
  const d={...flat(p),...keys};replaceIn(p,unflat(p.id,d));p.edited=now();nextLabel="Restored: "+t.label;dropTrash(t,false);render()}
/* ---------- admin page ---------- */
function adminView(){purgeTrash();
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Admin"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")));
  if(!isAdmin()){box.append(el("p",{class:"empty"},"Only admins can open this page."));return box}
  const tabs=seg("admtab",[["history","Edit history"],["deleted","Recently deleted ("+trash.length+")"],["storage","Storage"],["team","Team access"]],adminTab);tabs.onchange=()=>{adminTab=tabs.get();render()};box.append(tabs);
  if(adminTab==="team"){box.append(teamPanel());return box}
  if(adminTab==="storage"){box.append(storagePanel());return box}
  if(adminTab==="history"){const q=inp(histQ,{type:"search",placeholder:"Search patient name",dir:"auto"});const list=el("div",{class:"hlist"});
    const draw=()=>{const nq=normName(histQ);const xs=editLog.filter(h=>!nq||normName(h.name).includes(nq));
      list.replaceChildren(...(xs.length?xs.slice(0,300).map(h=>{const p=patients.find(x=>x.id===h.pid);const can=p&&(h.cj||h.before);
        return el("div",{class:"hrow"},el("div",{class:"hmeta"},el("b",{dir:"auto"},h.name),el("span",{class:"hat"},h.at+" · "+h.by)),el("div",{class:"hsum",dir:"auto"},h.summary),
          (p||dir[h.pid])?el("div",{class:"row"},el("button",{class:"small",onclick:()=>p?openPatient(p,"admin"):openStub(stubOf(h.pid,dir[h.pid]),"admin")},"Open"),
            can?twoTap(el("button",{class:"small"},"Undo this change"),"Tap again to undo",()=>undoChange(h)):null):null)}):[el("p",{class:"empty"},histQ?"No edits for this name.":"No edits yet.")]))};
    q.oninput=()=>{histQ=q.value;draw()};draw();box.append(q,list)}
  else box.append(trash.length?el("div",{class:"hlist"},trash.map(t=>{const left=30-daysSince(t.at);
    return el("div",{class:"hrow"},el("div",{class:"hmeta"},el("b",{dir:"auto"},t.pname||t.p?.name||""),el("span",{class:"hat"},"Deleted "+fmtDate(t.at)+" by "+t.by+" · "+left+" day"+(left===1?"":"s")+" left")),
      el("div",{class:"hsum",dir:"auto"},t.label||"Whole file"),
      el("div",{class:"row"},el("button",{class:"small primary",onclick:()=>restoreDeleted(t)},"Restore"),
        twoTap(el("button",{class:"small danger"},"Delete now"),"Tap again — can't be undone",()=>{dropTrash(t,true);logEdit({id:t.pid,name:t.pname||""},"Deleted permanently: "+(t.label||"file"),null);render()})))})):el("p",{class:"empty"},"Nothing deleted."));
  return box}
function teamPanel(){const box=el("div",{class:"sec"});
  const list=el("div",{class:"hlist"},el("p",{class:"sub",style:"display:block"},"Loading…"));
  const email=inp("",{type:"email",placeholder:"doctor@gmail.com",dir:"ltr"});const role=sel([["member","Member"],["admin","Admin"]],"member");const st=el("p",{class:"sub","aria-live":"polite",style:"display:block"});
  const load=()=>Promise.resolve(Store.listAllowed()).then(rows=>{list.replaceChildren(...rows.map(x=>el("div",{class:"hrow"},el("div",{class:"hmeta"},el("b",{dir:"ltr"},x.email),el("span",{class:"hat"},x.role==="admin"?"Admin":"Member")),
    x.email===Store.email?el("span",{class:"hat"},"you"):el("div",{class:"row"},twoTap(el("button",{class:"small danger"},"Remove"),"Tap again",()=>Store.removeAllowed(x.email).then(load))))))}).catch(()=>list.replaceChildren(el("p",{class:"err"},"Couldn't load the list.")));
  load();
  box.append(el("p",{class:"sub",style:"display:block"},"Only these emails can open patient data. Each doctor signs up with the same email and confirms it from their inbox."),
    el("div",{class:"fgrid"},fld("Email",email),fld("Role",role)),
    el("div",{class:"row"},el("button",{class:"primary small",onclick:()=>{const v=email.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(v)){st.textContent="Write a valid email.";return}
      Promise.resolve(Store.setAllowed(v,role.value)).then(()=>{email.value="";st.textContent="Added "+v+".";load()}).catch(()=>st.textContent="Couldn't add — check the connection.")}},"Add"),st),list,
    el("div",{class:"sec"},el("h3",{},"Testing"),el("p",{class:"sub",style:"display:block"},"Adds placeholder patients so the team can try the app. Delete them later from Storage."),
      el("div",{class:"row"},twoTap(el("button",{class:"small"},"Load sample patients"),"Tap again to add them",()=>{patients.push(...makeSamples());view="home";render()}))));
  return box}
/* ---------- storage ---------- */
const GB=1024**3;let stF={died:false,since:"",sort:"size"};const stSel=new Set();
const fmtB=b=>b>=GB?(b/GB).toFixed(2)+" GB":b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
function storagePanel(){const box=el("div",{class:"sec",style:"gap:12px"});
  if(histCount==null){histCount=editLog.length;Promise.resolve(Store.historyCount&&Store.historyCount()).then(n=>{if(typeof n==="number"&&n!==histCount){histCount=n;if(view==="admin"&&adminTab==="storage"&&!busy())render()}}).catch(()=>{})}
  const D=Object.entries(dir);const pat=D.reduce((a,[,x])=>a+(x.sz||0),0),img=D.reduce((a,[,x])=>a+(x.ib||0),0);
  const avgH=editLog.length?editLog.reduce((a,h)=>a+JSON.stringify(h).length,0)/editLog.length:600;const hist=(histCount||0)*avgH*1.2;
  const tr=trash.reduce((a,t)=>a+String(t.kj||"").length,0);const total=(pat+img+hist+tr)*1.15;const pct=Math.min(100,total/GB*100);
  box.append(el("div",{class:"stor"},el("div",{class:"storhead"},el("b",{},fmtB(total)+" of 1 GB"),el("span",{class:"hat"},pct.toFixed(1)+"% used — approximate")),
    el("div",{class:"bar"+(pct>=90?" red":pct>=70?" amber":"")},el("span",{style:"width:"+Math.max(1,pct)+"%"})),
    el("div",{class:"storrows"},[["Patient files",pat],["Photos",img],["Edit history",hist],["Recently deleted",tr]].map(([k,v])=>el("div",{},el("span",{},k),el("b",{},fmtB(v))))),
    el("p",{class:"sub",style:"display:block"},"The exact figure is in Firebase console → Firestore → Usage.")));
  // filters
  const died=el("input",{type:"checkbox",id:"stdied"});died.checked=stF.died;died.onchange=()=>{stF.died=died.checked;render()};
  const since=sel([["","Any time"],["6","No admission for 6 months"],["12","No admission for 1 year"],["24","No admission for 2 years"],["36","No admission for 3 years"]],stF.since);since.onchange=()=>{stF.since=since.value;render()};
  const sort=sel([["size","Largest first"],["old","Oldest admission first"]],stF.sort);sort.onchange=()=>{stF.sort=sort.value;render()};
  const lim=stF.since?addDays(today(),-Math.round(+stF.since*30.4)):"";
  let rows=D.map(([id,x])=>({id,x,size:(x.sz||0)+(x.ib||0)})).filter(r=>(!stF.died||r.x.oc==="died")&&(!lim||(r.x.st!=="a"&&(r.x.cd||r.x.d||"")<lim)));
  rows.sort(stF.sort==="old"?(a,b)=>(a.x.cd||a.x.d||"").localeCompare(b.x.cd||b.x.d||""):(a,b)=>b.size-a.size);
  for(const id of[...stSel])if(!rows.some(r=>r.id===id))stSel.delete(id);
  const selB=rows.filter(r=>stSel.has(r.id)).reduce((a,r)=>a+r.size,0);const st=el("p",{class:"sub","aria-live":"polite",style:"display:block"});
  const all=el("input",{type:"checkbox",id:"stall"});all.checked=rows.length>0&&rows.every(r=>stSel.has(r.id));all.onchange=()=>{rows.forEach(r=>all.checked?stSel.add(r.id):stSel.delete(r.id));render()};
  const ids=()=>[...stSel];
  box.append(el("h3",{},"Find patients to archive"),el("div",{class:"row",style:"flex-wrap:wrap;gap:8px 14px"},el("label",{class:"row",style:"gap:6px",for:"stdied"},died,"Died"),since,sort),
    el("div",{class:"row stsel"},el("label",{class:"row",style:"gap:6px",for:"stall"},all,"Select all ("+rows.length+")"),el("b",{},stSel.size+" selected · "+fmtB(selB))),
    el("div",{class:"row",style:"flex-wrap:wrap"},
      el("button",{class:"small",disabled:!stSel.size,onclick:()=>backupSel(ids(),st)},"Download backup"),
      twoTap(el("button",{class:"small",disabled:!stSel.size},"Delete photos only"),"Tap again — photos are deleted for good",()=>delPhotos(ids(),st)),
      twoTap(el("button",{class:"small danger",disabled:!stSel.size},"Delete"),"Tap again — moves to Recently deleted",()=>delSel(ids(),st))),st,
    el("p",{class:"sub",style:"display:block"},"Download a backup first. Photos-only frees most space and keeps the file."),
    rows.length?el("div",{class:"hlist"},rows.slice(0,400).map(r=>{const cb=el("input",{type:"checkbox","aria-label":"Select "+r.x.n});cb.checked=stSel.has(r.id);cb.onchange=()=>{cb.checked?stSel.add(r.id):stSel.delete(r.id);render()};
      return el("div",{class:"hrow strow"},cb,el("div",{class:"hmeta",style:"flex:1;min-width:0"},el("b",{dir:"auto"},r.x.n),el("span",{class:"hat"},[r.x.c,r.x.st==="a"?"in ward":(OUTCOMES[r.x.oc]||"closed")+" "+fmtDate(r.x.cd||r.x.d),r.x.img?r.x.img+" photo"+(r.x.img>1?"s":""):""].filter(Boolean).join(" · "))),
        el("b",{class:"mono"},fmtB(r.size)),el("button",{class:"small",onclick:()=>{const p=patients.find(x=>x.id===r.id);p?openPatient(p,"admin"):openStub(stubOf(r.id,r.x),"admin")}},"Open"))})):el("p",{class:"empty"},"No patients match."));
  return box}
async function loadMany(ids,st){const out=[];for(const id of ids){st.textContent="Loading "+(out.length+1)+" / "+ids.length+"…";const p=await loadPatient(id).catch(()=>null);if(p)out.push(p)}return out}
async function backupSel(ids,st){try{const ps=await loadMany(ids,st);const imgs={};let n=0;
    for(const p of ps)for(const x of p.encounters.flatMap(e=>ITEMARR.flatMap(k=>e[k]||[])))if(x.imageId&&!imgs[x.imageId]){st.textContent="Photos "+(++n)+"…";imgs[x.imageId]=await Promise.resolve(Store.getImage(x.imageId)).catch(()=>"")}
    const blob=new Blob([JSON.stringify({app:"Nephrology Ward Log",exported:stamp(),by:WHO(),patients:ps,images:imgs})],{type:"application/json"});
    const a=el("a",{href:URL.createObjectURL(blob),download:"nephrology-backup-"+today()+".json"});document.body.append(a);a.click();a.remove();
    st.textContent="Backup of "+ps.length+" patient"+(ps.length>1?"s":"")+" downloaded — keep the file somewhere safe."}catch{st.textContent="Backup failed — check the connection."}}
async function delPhotos(ids,st){const ps=await loadMany(ids,st);let n=0;
  for(const p of ps){let k=0;for(const x of p.encounters.flatMap(e=>ITEMARR.flatMap(a=>e[a]||[])))if(x.imageId){Store.deleteImage(x.imageId);if(x.thumbId)Store.deleteImage(x.thumbId);delete x.imageId;delete x.thumbId;delete x.imgKB;k++}
    if(k){n+=k;p.edited=now();noTrashOnce=true;nextLabel="Photos deleted to free space ("+k+")";persist()}}
  st.textContent=n+" photo"+(n===1?"":"s")+" deleted.";render()}
async function delSel(ids,st){const ps=await loadMany(ids,st);for(const p of ps){const v=view;deletePatient(p);view=v}stSel.clear();view="admin";adminTab="storage";render()}
/* ---------- critical values settings ---------- */
let critDraft=null;
function critView(){const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Critical values"),el("button",{class:"link",onclick:()=>{critDraft=null;view="home";render()}},"← Home")));
  const ad=isAdmin();if(!critDraft)critDraft=clone(critRules);const err=el("p",{class:"err",role:"alert"});
  box.append(el("p",{class:"sub",style:"display:block"},"Critical = below Low, or at/above High. Only the latest result of each item is checked."+(ad?"":" These limits are set by the department.")));
  const numCols=ALLCOLS.filter(([c])=>!TEXTCOLS.has(c)||c==="BP").map(([c])=>c);
  const group=(kind,title)=>{const rows=critDraft.filter(r=>(kind==="lab")===(r.k==="lab"));
    const tb=el("div",{class:"critrows"},rows.map(r=>{const name=kind==="lab"?inp(r.n,{placeholder:"Test name",dir:"ltr"}):sel(numCols.includes(r.n)?numCols:[r.n,...numCols],r.n);
      const al=kind==="lab"?inp(r.al||"",{placeholder:"Other names, e.g. glucose, FBS (optional)",dir:"ltr",class:"al","aria-label":"Other names"}):null;
      name.setAttribute("aria-label",kind==="lab"?"Test":"Item");
      const lo=inp(r.lo??"",{inputmode:"decimal",placeholder:"—",class:"mono"}),hi=inp(r.hi??"",{inputmode:"decimal",placeholder:"—",class:"mono"});
      [name,al,lo,hi].forEach(x=>{if(!x)return;x.disabled=!ad;x.oninput=x.onchange=()=>{r.n=name.value.trim();if(al)r.al=al.value.trim();r.lo=lo.value.trim();r.hi=hi.value.trim()}});
      lo.setAttribute("aria-label","Low");hi.setAttribute("aria-label","High");
      return el("div",{class:"critrow"},name,lo,hi,ad?el("button",{type:"button",class:"x","aria-label":"Remove",onclick:()=>{critDraft.splice(critDraft.indexOf(r),1);render()}},"✕"):el("span"),al&&(r.al||(ad&&!r.n))?al:null)}));
    return el("div",{class:"sec"},el("h3",{},title),el("div",{class:"crithead"},el("span",{},kind==="lab"?"Test":"Item"),el("span",{},"Low <"),el("span",{},"High ≥"),el("span")),tb,ad?el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>{critDraft.push({n:kind==="lab"?"":numCols[0],k:kind==="lab"?"lab":"vital",lo:"",hi:""});render()}},kind==="lab"?"+ Add lab":"+ Add vital / exam item"):null)};
  box.append(group("lab","Labs"),group("vital","Vitals & examination"),err);
  if(ad)box.append(el("div",{class:"row"},el("button",{class:"primary",onclick:()=>{const rs=critDraft.map(r=>({...r,n:String(r.n||"").trim()})).filter(r=>r.n);
      if(rs.some(r=>!hasN(r.lo)&&!hasN(r.hi))){err.textContent="Each item needs a low or a high value.";return}
      rs.forEach(r=>{r.lo=hasN(r.lo)?+r.lo:"";r.hi=hasN(r.hi)?+r.hi:""});critRules=rs;Store.saveSettings({crit:rs});logEdit({id:"settings",name:"Critical values"},"Critical values changed",null);critDraft=null;view="home";render()}},"Save"),
    twoTap(el("button",{class:"small"},"Reset to defaults"),"Tap again to reset",()=>{critDraft=clone(DEFAULT_CRIT);render()})));
  return box}
/* ---------- missed HD sessions ---------- */
function missedHd(){const out=[];const t=today();
  for(const p of patients){const e=latest(p);if(!e||e.status!=="active")continue;
    for(const h of e.hd||[])if(h.status==="ordered"&&h.date&&ISO.test(h.date)&&h.date<t)out.push({p,e,h,date:h.date,why:"Ordered"+(hdOrderTxt(h)?" · "+hdOrderTxt(h):"")});
    if(e.type==="hd"){const days=SCHED[e.hdSched]?.[1]||[];for(let i=1;i<=2;i++){const d=addDays(t,-i);if(d<(e.date||""))continue;
      if(days.includes(weekday(d))&&!(e.hd||[]).some(h=>h.date===d))out.push({p,e,h:null,date:d,why:"Regular · "+schedLabel(e)})}}}
  return out.sort((a,b)=>a.date.localeCompare(b.date))}
function missedBox(m){const e=m.e;const h=m.h||{date:m.date,kind:e.type==="hd"?"Regular":"",status:"ordered"};const form=hdForm(e,h,true,"full");const why=inp("",{placeholder:"Reason (optional) — e.g. hypotension, refused, moved to tomorrow"});
  const cx=el("div",{class:"sec",style:"gap:8px"},fld("Why is it cancelled?",why),el("div",{class:"row"},el("button",{class:"small danger",onclick:()=>{const r=why.value.trim();
    if(m.h)Object.assign(m.h,{status:"cancelled",cancelReason:r});else(e.hd=e.hd||[]).push({date:m.date,kind:h.kind,status:"cancelled",cancelReason:r});
    e.events.push({when:today(),text:"HD session of "+fmtDate(m.date)+" cancelled"+(r?": "+r:"")});e.edited=now();mini=null;render()}},"Confirm cancel")));cx.hidden=true;
  return el("div",{class:"minibox"},el("h3",{},"Session of "+fmtDate(m.date)),form,
    actions(()=>{const x=form.read(m.date,true)||{date:m.date,status:"done"};x.date=x.date||m.date;if(m.h){Object.assign(m.h,x)}else pushHd(e,x);
      e.events.push({when:x.date,text:(hdKindLabel(x.kind)||"HD")+" done (recorded late)"});e.edited=now();mini=null;render()},"Save — session done",
      el("button",{class:"small",onclick:()=>{cx.hidden=!cx.hidden}},"Cancel session")),cx)}
function missedList(xs,from){return xs.map(m=>{const id="mh|"+m.p.id+"|"+m.date;const open=mini?.kind==="hdm"&&mini.id===id;
  const b=el("div",{class:"pblock hdt missed"},from==="file"?null:prow(m.p,"hdtoday"),
    el("div",{class:"hdwhy"},el("span",{},el("b",{},"Not done · "+fmtDate(m.date))," — "+m.why),
      el("button",{class:"small primary",onclick:()=>{mini=open?null:{kind:"hdm",id,focus:true};render()}},open?"Close":"Done / Cancel")));
  if(open)b.append(missedBox(m));return b})}
/* ---------- who entered it ---------- */
function whoLine(items){const xs=(items||[]).filter(x=>x&&(x._by||x._eb));if(!xs.length)return null;const seen=new Set();const parts=[];
  for(const x of xs){const a=x._by?"Added by "+x._by+" · "+x._at:"";const b=x._eb?"edited by "+x._eb+" · "+x._ea:"";const t=[a,b].filter(Boolean).join(" — ");if(!seen.has(t)){seen.add(t);parts.push(t)}}
  return el("p",{class:"who",dir:"ltr"},parts.slice(0,4).join(" | "))}
/* ---------- in-memory store for the design page ---------- */
function memStore(){const imgs={};let n=0;return{email:"You",isAdmin:true,mem:true,
  createPatient(){},updatePatient(){},async saveImage(src){const id="m"+(++n);imgs[id]=src;return id},async getImage(id){return imgs[id]||""},deleteImage(id){delete imgs[id]},
  addHistory(){},trashAdd(){},trashDelete(){},trashPatient(){},setDir(){},async getPatient(){return null},saveSettings(){},async historyCount(){return editLog.length},
  async allocCode(m){this.last=Math.max(this.last||0,m)+1;return"NW-"+String(this.last).padStart(4,"0")},async listAllowed(){return[{email:"You",role:"admin"}]},async setAllowed(){},async removeAllowed(){}}}
/* ---------- ward helpers: critical labs, updated today, HD today ---------- */
const DEFAULT_CRIT=[{n:"K",k:"lab",lo:3,hi:6},{n:"pH",k:"lab",lo:7.2},{n:"Na",k:"lab",lo:125,hi:155},{n:"Hb",k:"lab",lo:7},{n:"RBS",k:"lab",lo:70,hi:400,al:"Glucose, Blood sugar, FBS, RBG"},
  {n:"BP",k:"vital",lo:90,hi:180},{n:"SpO2",k:"vital",lo:90},{n:"HR",k:"vital",lo:50,hi:121},{n:"Temp",k:"vital",hi:38.5}];
let critRules=DEFAULT_CRIT;
const num=x=>parseFloat(toEn(String(x??"")).replace(",","."));
const hasN=x=>x!==""&&x!=null&&!isNaN(+x);
const ruleKeys=r=>[r.n,...String(r.al||"").split(",")].map(lkey).filter(Boolean);
const ruleHit=(r,v)=>{const x=num(v);return!isNaN(x)&&((hasN(r.lo)&&x<+r.lo)||(hasN(r.hi)&&x>=+r.hi))};
const labRule=n=>critRules.find(r=>r.k==="lab"&&ruleKeys(r).includes(lkey(n)));
const critLab=(n,v)=>{const r=labRule(n);return!!r&&ruleHit(r,v)};
const critVit=(c,v)=>{const r=critRules.find(r=>r.k!=="lab"&&lkey(r.n)===lkey(c));return!!r&&ruleHit(r,v)};
function critParts(e){const out={labs:[],vit:[]};if(!e||e.status!=="active")return out;
  for(const r of critRules.filter(r=>r.k==="lab")){const ks=ruleKeys(r);const ls=(e.labs||[]).filter(l=>ks.includes(lkey(l.name)));if(!ls.length)continue;const d=orderDates(ls).pop();const l=ls.filter(x=>(x.date||"")===d).pop();if(ruleHit(r,l.value))out.labs.push(l.name+" "+l.value)}
  for(const c of critRules.filter(r=>r.k!=="lab").map(r=>r.n)){const vs=(e.vitalsLog||[]).filter(v=>v[c]);if(!vs.length)continue;const d=orderDates(vs).pop();const v=vs.filter(x=>(x.date||"")===d).pop();if(critVit(c,v[c]))out.vit.push(c+" "+v[c])}
  return out}
function critOf(p){const c=critParts(latest(p));return[...c.labs,...c.vit]}
function updatedToday(p){const e=latest(p);if(!e||e.status!=="active"||e.type==="hd")return true;if(cairoHour()<10)return true;const t=today();
  return (e.vitalsLog||[]).some(v=>v.date===t)||(e.labs||[]).some(l=>l.date===t)||(e.events||[]).some(x=>x.when===t)||(e.hd||[]).some(h=>h.date===t)||e.date===t}
const nameMarks=p=>{const c=critOf(p);return[(twins.get(normName(p.name))||0)>1?el("span",{class:"twin",title:"Another patient has the same name"},"👥"):null,c.length?critIcon("Critical: "+c.join(", ")):null]};
function critIcon(t){return el("span",{class:"cicon",role:"img","aria-label":t||"Critical",title:t||"Critical"},"!")}
function freshToday(p){const e=latest(p);if(!e||e.status!=="active")return false;const t=today(),y=cairoHour()<10?addDays(t,-1):null;const ok=d=>d===t||(y&&d===y);
  return(e.vitalsLog||[]).some(v=>ok(v.date))||(e.labs||[]).some(l=>ok(l.date))||(e.events||[]).some(x=>ok(x.when))||(e.hd||[]).some(h=>ok(h.date)&&hdDone(h))||ok(e.date)}
const staleCls=p=>freshToday(p)?"upd":"idle";
function hdTodayList(){const out=[];const wd=weekday();
  for(const p of patients){const e=latest(p);if(!e||e.status!=="active")continue;const hs=(e.hd||[]).filter(h=>h.date===today());const s=hs.find(hdDone)||hs[0];
    const sched=e.type==="hd"&&(SCHED[e.hdSched]?.[1]||[]).includes(wd);const it=(e.plan||[]).find(x=>/\bhd\b|dialys|غسيل/i.test(x.text)&&dueInfo(x));
    if(!sched&&!s&&!it)continue;const last=(e.hd||[]).filter(h=>h!==s).slice(-1)[0];
    out.push({p,e,s,done:hdDone(s),order:s?hdOrderTxt(s):last?hdOrderTxt({kind:e.type==="hd"?"Regular":"",ordH:last.ordH,ordUF:last.ordUF,access:last.access}):"",why:sched?"Regular · "+schedLabel(e):it?it.text:""})}
  return out.sort((a,b)=>a.done-b.done)}
function hdTodayView(){const xs=hdTodayList();const pend=xs.filter(x=>!x.done);
  const text=["HD today — "+fmtDate(today())+" ("+pend.length+" pending / "+xs.length+")",...xs.map((x,i)=>(i+1)+". "+x.p.name+" — "+(x.e.location||"")+(x.order?" — "+x.order:"")+(x.done?" ✓ done":""))].join("\n");
  const st=el("span",{class:"sub","aria-live":"polite"});const ta=area(text,{class:"mono",readonly:true,style:"min-height:140px",dir:"auto"});ta.hidden=true;
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"HD today · "+pend.length+" pending / "+xs.length),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")),
    el("div",{class:"row"},el("button",{class:"small primary",onclick:()=>copyText(text,st,ta,"Copied — send it to the HD unit.")},"Copy list"),st),ta);
  {const ms=missedHd();if(ms.length)box.append(el("div",{class:"sec missbox"},el("h3",{class:"misshead"},"Missed sessions ("+ms.length+")"),...missedList(ms,"hdtoday")))}
  if(!xs.length){box.append(el("p",{class:"empty"},"No HD sessions due today."));return box}
  box.append(el("div",{class:"sec"},xs.map(x=>{const open=mini?.kind==="hdt"&&mini.pid===x.p.id;
    const b=el("div",{class:"pblock hdt"+(x.done?" done":"")},prow(x.p,"hdtoday"),
      el("div",{class:"hdwhy"},el("span",{},x.order||x.why||"No order yet"),x.done?el("span",{class:"pillok"},"✓ done"):null,
        el("button",{class:"small"+(x.done?"":" primary"),onclick:()=>{mini=open?null:{kind:"hdt",pid:x.p.id,focus:true};render()}},x.done?"Edit session":"+ Session")));
    if(open){const h=x.s||null;b.append(hdBox(x.e,h,h&&hdDone(h)?"full":"complete"))}return b})));
  return box}
const hdBtnLabel=()=>{const m=missedHd().length;return hdBtnLabel0()+(m?" · "+m+" missed":"")};
const hdBtnLabel0=()=>{const xs=hdTodayList(),n=xs.filter(x=>!x.done).length;return!xs.length?"HD today":n?"HD today · "+n+" pending / "+xs.length:"HD today · all done ✓"};
/* ---------- discharge summary ---------- */
function dischargeText(p,e){const L=[];const cur=(e.meds||[]).filter(m=>!m.stop&&!m.once);
  L.push("DISCHARGE SUMMARY","Name: "+p.name+" ("+p.code+")"+[p.age&&p.age+" y",p.sex==="M"?"Male":p.sex==="F"?"Female":""].filter(Boolean).map(x=>" · "+x).join(""));
  L.push("Admitted: "+fmtDate(e.date)+(e.location?" — "+e.location:"")+"   Discharged: "+(e.closeDate?fmtDate(e.closeDate):"—"));
  L.push("Under: "+typeLabel(e)+(p.consultant?" · "+p.consultant:""));
  if(p.pastMedical?.length)L.push("Background: "+p.pastMedical.join("; "));
  if(e.complaint)L.push("Presentation: "+e.complaint);if(e.diagnosis)L.push("Diagnosis: "+e.diagnosis);
  const ev=(e.events||[]).filter(x=>x.text);if(ev.length){L.push("","Course:");for(const x of ev.slice(-15))L.push("• "+(x.when?fmtDate(x.when)+": ":"")+x.text)}
  const tests=[...(e.labs||[]).filter(isOnce).map(l=>l.name+" "+l.value+(l.unit?" "+l.unit:"")),...(e.imaging||[]).map(m=>m.test+(m.result?": "+m.result:""))];if(tests.length){L.push("","Investigations:");tests.forEach(t=>L.push("• "+t))}
  const daily=(e.labs||[]).filter(l=>!isOnce(l));if(daily.length){const d=orderDates(daily).pop();L.push("","Last labs ("+fmtDate(d)+"): "+daily.filter(l=>(l.date||"")===d).map(l=>l.name+" "+l.value).join(", "))}
  L.push("","Discharge medications:");if(cur.length)cur.forEach(m=>L.push("• "+medTxt(m)));else L.push("—");
  L.push("","Follow up: ");return L.join("\n")}
function dischargeBox(p,e){const ta=area(dischargeText(p,e),{class:"mono",style:"min-height:300px",dir:"auto"});const st=el("span",{class:"sub","aria-live":"polite"});
  return el("div",{class:"minibox"},el("h3",{},"Discharge summary"),ta,el("div",{class:"row"},el("button",{class:"primary small",onclick:()=>copyText(ta.value,st,ta,"Copied.")},"Copy"),el("button",{class:"small",onclick:()=>{mini=null;render()}},"Close"),st))}
/* ---------- Arabic right-to-left, English left-to-right ---------- */
const DIR_SEL="li,td,p,dd,dt,h2,.chip,.nm,.txt,.res,.timeline span,.medlist span,input[type=text],input[type=search],input:not([type]),textarea,button.prow";
function autoDir(root){root.querySelectorAll(DIR_SEL).forEach(x=>{if(!x.hasAttribute("dir"))x.setAttribute("dir","auto")})}
/* ---------- phone back button ---------- */
const navStack=[];let lastDepth=0,ignorePop=0,restoring=false,prevSnap=null;
const depthOf=()=>(view==="home"?0:view==="file"?2:1)+(editing?1:0)+(mini?1:0);
function navTrack(){const d=depthOf();
  if(!restoring){
    if(d>lastDepth&&prevSnap){const add=sn=>{try{history.pushState({rwl:navStack.length+1},"");navStack.push(sn)}catch{}};add(prevSnap);
      if(mini&&d-1>lastDepth)add({view,consView,back,current,editing,mini:null,depth:d-1})}
    else if(d<lastDepth){let n=0;while(navStack.length&&navStack[navStack.length-1].depth>=d){navStack.pop();n++}if(n){ignorePop++;try{history.go(-n)}catch{ignorePop--}}}}
  lastDepth=d;prevSnap={view,consView,back,current,editing,mini,depth:d}}
window.addEventListener("popstate",()=>{if(ignorePop>0){ignorePop--;return}const st=navStack.pop();if(!st)return;
  ({view,consView,back,current,editing,mini}=st);restoring=true;try{render()}finally{restoring=false}scrollTo(0,0)});
/* ---------- views ---------- */
function render(){if(persist())buffered=null;if(buffered&&!busy()){applyRemote(buffered);buffered=null}if(!buffered)clearColleagueNote();YR="";buildTwins();setupMenu();refreshLists();const app=$("#app");app.replaceChildren(view==="new"?newPatientView():view==="find"?findView():view==="cons"?consultantView():view==="import"?importView():view==="admin"?adminView():view==="hdtoday"?hdTodayView():view==="crit"?critView():view==="help"?helpView():view==="file"&&cur()?fileView():homeView());flash=false;autoDir(app);hydrateImgs(app);navTrack();
  if(mini&&mini.focus){mini.focus=false;const t=document.querySelector(".minibox");if(t&&t.scrollIntoView)requestAnimationFrame(()=>t.scrollIntoView({block:"center",behavior:"smooth"}))}}

function copyText(text,st,fallbackEl,okMsg){const fb=()=>{if(fallbackEl){fallbackEl.hidden=false;fallbackEl.focus();fallbackEl.select()}st.textContent="Text selected — press copy."};
  try{navigator.clipboard.writeText(text).then(()=>st.textContent=okMsg,fb)}catch{fb()}}
function homeView(){
  const box=el("div",{class:"wrap",style:"gap:14px"});
  const st=el("span",{class:"st","aria-live":"polite"});const pt=area(AI_PROMPT,{class:"mono",readonly:true,style:"min-height:160px",dir:"ltr"});pt.hidden=true;
  box.append(el("div",{class:"actbar"},
    el("button",{class:"primary np",onclick:()=>{view="new";render();scrollTo(0,0)}},"+ New patient"),
    el("button",{class:"np",onclick:()=>{view="find";render();scrollTo(0,0);$("#q")?.focus()}},"Find"),
    el("button",{class:"imp",onclick:()=>{view="import";render();scrollTo(0,0)}},"⇣ Import"),
    st,pt));
  box.append(wardView());
  return box;
}
function findView(){
  const q=el("input",{type:"search",id:"q",placeholder:"Name, code, national ID, phone or ward…","aria-label":"Search patients",dir:"auto"});
  const list=el("div",{class:"plist"});
  const F=[["all","All"],["nephro","Nephrology"],["coadmit","Co-admission"],["consult","Consults"],["hd","HD only"],["out","Closed"]];
  const fb=el("div",{class:"filters"},F.map(([k,l])=>el("button",{class:"small","aria-pressed":String(filter===k),onclick:()=>{filter=k;render();$("#q").value=qv;draw()}},l)));
  let qv="";
  const draw=()=>{const s=(qv=q.value).trim().toLowerCase();
    const rows=allIndex().filter(p=>(filter==="all"||stateOf(p)===filter)&&(!s||[p.name,p.code,p.nid,p.phone,p.consultant,...p.encounters.flatMap(e=>[e.location,e.department,e.diagnosis])].join(" ").toLowerCase().includes(s)));
    list.replaceChildren(...(rows.length?rows.map(p=>prow(p,"find")):[el("p",{class:"empty",style:"padding:10px 0"},"No patients match.")]))};
  q.oninput=draw;draw();
  return el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Find a patient"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")),q,fb,list);
}
function openPatient(p,from,target){if(p&&p._stub){openStub(p,from,target);return}back=from||view;current=p.id;view="file";editing=null;mini=target||null;scrollTo(0,0);render()}
function dueTarget(p,e,it){return it.hd?{kind:"hd",key:e.key,h:(e.hd||[]).find(h=>h.date===today()&&h.status==="ordered"),mode:"complete",focus:true}:{kind:"result",key:e.key,idx:e.plan.indexOf(it),focus:true}}
function prow(p,from){const e=latest(p);return el("button",{class:"prow",dir:/[\u0600-\u06FF]/.test(p.name||"")?"rtl":"ltr",onclick:()=>openPatient(p,from)},
  el("div",{},el("div",{class:"nm "+staleCls(p),dir:"auto"},...nameMarks(p),p.name),critOf(p).length?el("div",{class:"critt",dir:"ltr"},critIcon(),critOf(p).join(" · ")):null,el("div",{class:"meta"},[p.code,e?.location,p.consultant,p.age&&p.age+" y"].filter(Boolean).map(x=>"\u2068"+x+"\u2069").join(" · "))),e?pill(e):null)}
const HDG="Regular HD — other departments";
const NOLOC="Location not set";
function byLoc(ps){const g=new Map();for(const p of ps){const k=latest(p)?.location||NOLOC;if(!g.has(k))g.set(k,[]);g.get(k).push(p)}
  return [...g.entries()].sort((a,b)=>a[0]===NOLOC?1:b[0]===NOLOC?-1:a[0].localeCompare(b[0],"ar"))}
function bySched(ps){const g={};for(const p of ps){const k=schedLabel(latest(p))||"Schedule not set";(g[k]=g[k]||[]).push(p)}
  const order=[SCHED.smw[0],SCHED.stt[0]];return Object.entries(g).sort((a,b)=>(order.indexOf(a[0])+99)%99-(order.indexOf(b[0])+99)%99)}
function consGroups(){
  const act=patients.filter(p=>latest(p)?.status==="active");const hdp=act.filter(p=>latest(p).type==="hd"),rest=act.filter(p=>latest(p).type!=="hd");
  const names=[...CONSULTANTS,...new Set(rest.map(p=>p.consultant).filter(c=>c&&!CONSULTANTS.includes(c)))];
  const groups=names.map(c=>[c,rest.filter(p=>p.consultant===c)]);
  const un=rest.filter(p=>!names.includes(p.consultant));if(un.length)groups.push(["Consultant not set",un]);
  groups.push([HDG,hdp]);
  return{act,groups};
}
let wardCopy=null;
function wardView(){
  const{act,groups}=consGroups();
  const card=([c,ps])=>{const H=c===HDG;let body;
    if(!ps.length)body=el("p",{class:"empty"},"No patients in ward.");
    else if(H){const g=bySched(ps);const names=Object.fromEntries(g);const cols=[SCHED.smw[0],SCHED.stt[0],...g.map(x=>x[0]).filter(k=>k!==SCHED.smw[0]&&k!==SCHED.stt[0])];
      body=el("div",{class:"hdcols",style:"--n:"+cols.length},cols.map(k=>el("div",{},el("span",{class:"day"},k),(names[k]||[]).length?el("ul",{class:"names"},names[k].map(p=>el("li",{dir:"auto",class:staleCls(p)},el("button",{type:"button",onclick:()=>openPatient(p,"home")},...nameMarks(p),p.name)))):el("span",{class:"empty"},"—"))))}
    else body=el("ul",{class:"names"},byLoc(ps).flatMap(x=>x[1]).map(p=>el("li",{dir:"auto",class:staleCls(p)},el("button",{type:"button",onclick:()=>openPatient(p,"home")},...nameMarks(p),p.name))));
    return el("div",{class:"ccard"+(H?" wide":"")},
    el("button",{type:"button",class:"chead","aria-label":"Open "+(H?"Regular HD":c)+" — "+ps.length+" patients",onclick:()=>{consView=c;view="cons";render();scrollTo(0,0)}},el("span",{class:"cname"},H?"Regular HD — other departments":c),el("span",{class:"ccount"},String(ps.length))),el("div",{class:"cbody"},body))};
  wardCopy=()=>copyOrShow(text,"Copied — paste it in the group.");
  const text=["In-ward nephrology patients — "+fmtDate(today())+" ("+act.length+")",...groups.filter(g=>g[1].length).flatMap(([c,ps])=>c===HDG?["",c+" ("+ps.length+")",...bySched(ps).flatMap(([k,xs])=>["▪ "+k,...xs.map(p=>"   - "+p.name+" — "+(latest(p).location||"location not set"))])]:["",c+" ("+ps.length+")",
    ...byLoc(ps).flatMap(([k,xs])=>["▪ "+k,...xs.map(p=>{const e=latest(p);return "   - "+p.name+(e.type!=="nephro"&&e.type!=="hd"?" — "+typeLabel(e):"")})])])].join("\n");
  const st=el("span",{class:"sub","aria-live":"polite"});const ta=area(text,{class:"mono",readonly:true,style:"min-height:140px",dir:"auto"});ta.hidden=true;
  const copy=el("button",{class:"small",onclick:()=>copyText(text,st,ta,"Copied — paste it in the group.")},"Copy list");
  return el("section",{class:"plain"},el("div",{class:"topbar listhead"},el("h2",{},"In-ward patients ("+act.length+")"),el("div",{class:"row",style:"flex-wrap:wrap;justify-content:flex-end"},el("button",{class:"small",onclick:()=>{view="hdtoday";render();scrollTo(0,0)}},hdBtnLabel()))),st,
    el("div",{class:"cons-grid"},groups.map(card)),ta);
}
/* ---------- import ---------- */
const AI_PROMPT="You are my converter for my \"Nephrology Ward Log\" app. In this chat, EVERY message I send\n(a ward WhatsApp message or a photo of a handwritten ward sheet) must be converted into\nONE JSON block. Reply with ONLY the JSON inside one code block — no explanation, no questions.\n\nSHAPE:\n{\"patient\":{\"name\":\"\",\"nid\":\"\",\"phone\":\"\",\"age\":\"\",\"sex\":\"M|F\",\"consultant\":\"\",\n \"occupation\":\"\",\"residence\":\"\",\"marital\":\"\",\"habits\":\"\",\n \"pastMedical\":[],\"pastSurgical\":[],\"drugHistory\":[],\"allergies\":\"\"},\n \"encounter\":{\"type\":\"nephro|coadmit|consult|hd\",\"department\":\"\",\"location\":\"\",\n \"date\":\"\",\"hdSched\":\"smw|stt\",\"complaint\":\"\",\"hpi\":\"\",\"diagnosis\":\"\",\n \"vitals\":[{\"date\":\"\",\"BP\":\"\",\"HR\":\"\",\"SpO2\":\"\",\"Temp\":\"\",\"RR\":\"\",\n   \"Conscious level\":\"\",\"Chest\":\"\",\"LL\":\"\",\"Input\":\"\",\"Output\":\"\",\"Weight\":\"\",\"CVP\":\"\",\"Others\":\"\"}],\n \"labs\":[{\"date\":\"\",\"name\":\"\",\"value\":\"\",\"unit\":\"\",\"once\":false}],\n \"imaging\":[{\"test\":\"\",\"result\":\"\",\"date\":\"\"}],\n \"hd\":[{\"date\":\"\",\"ordH\":\"\",\"ordUF\":\"\",\"hours\":\"\",\"uf\":\"\",\"access\":\"\",\n   \"pre\":\"\",\"post\":\"\",\"hr\":\"\",\"wpre\":\"\",\"wpost\":\"\",\"volume\":\"\",\"notes\":\"\"}],\n \"events\":[{\"when\":\"\",\"text\":\"\"}],\n \"meds\":[{\"name\":\"\",\"dose\":\"\",\"freq\":\"\",\"start\":\"\",\"stop\":\"\",\"note\":\"\"}],\"notes\":\"\"},\n \"unclear\":[{\"where\":\"\",\"item\":\"\",\"date\":\"\",\"read\":\"\",\"note\":\"\"}]}\n\nRULES:\n1. Never invent anything. Leave out fields that are not in the message.\n2. Patient name: copy it exactly as written (Arabic is fine).\n3. Consultant: one of \"Dr. Hossam\", \"Dr. Hesham\", \"Dr. Bassem\" if mentioned.\n4. type: \"nephro\" = admitted under nephrology (even if the bed is in another ward);\n   \"coadmit\" = shared with another department (مشترك) → put it in \"department\";\n   \"consult\" = consultation; \"hd\" = only dialysis while admitted elsewhere.\n   location = the ward/bed exactly as written, in Arabic — do NOT translate\n   (e.g. \"خاص السابع\"). department: also in Arabic as written (e.g. \"المسالك\").\n5. hdSched: \"smw\" = Sat/Mon/Wed, \"stt\" = Sun/Tue/Thu (only for type \"hd\").\n6. Dates: write as YYYY-MM-DD (current year if not written). Messages use\n   day/month. Labs or vitals from admission with no date → \"Adm\"; from ER → \"ER\".\n   Each day's labs and vitals must carry that day's date.\n7. Lab names — use exactly: Urea, Creatinine, Na, K, Ca, Phos, pH, HCO3, PCO2,\n   Hb, PLT, TLC, CRP, RBS, Lactate, Albumin, ALT, AST, INR, Uric acid.\n   (Cr/Creat → Creatinine, N → Na, P/Po4 → Phos, Co2 → PCO2, Lac → Lactate,\n   Alb → Albumin, Plt → PLT, Tlc → TLC, UA → Uric acid.) Write decimals with a dot.\n   \"once\": true only for tests not repeated daily (HbA1c, PTH, iron studies,\n   viral markers, Coombs, LDH, immunology, culture results, fluid chemistry).\n8. Vitals/exam per day: BP, HR, SpO2 (number only), Temp, RR; Conscious level, Chest, LL\n   (lower-limb oedema), Input, Output, Weight, CVP; anything else → Others.\n9. imaging: US, Echo, CT, X-ray etc. with their result.\n10. Do NOT write a plan or checklist and do not guess what is planned — the team adds those by hand.\n11. events: what happened (procedures, transfusions, complications,\n   drug changes, HD done), each with its date.\n12. meds: current medications, split into name / dose / frequency, with\n   \"start\" = date started if stated. A drug the message says was stopped →\n   include it with \"stop\" = that date and \"note\" = reason. A dose change →\n   the new dose as a med with \"start\" = that date.\n13. The input may be a photo of a handwritten sheet. If a number, drug or word is unclear,\n   do NOT guess. Write in its field only what you can read, with ? for each part you can't\n   read (e.g. \"4.?\"), and add ONE entry to \"unclear\" for it:\n   where = \"patient.<field>\", \"encounter.<field>\", \"vitals\", \"labs\", \"imaging\", \"hd\",\n           \"events\" or \"meds\";\n   item  = the lab name, vitals/exam column (e.g. \"BP\", \"LL\") or drug name;\n   date  = that row's date; read = what you read; note = what is unclear.\n   Anything you could not read at all and cannot place → \"notes\".\n\nKeep following these rules for every message in this chat.\nFor THIS message only, reply with one word: Ready\n";
const arr=x=>Array.isArray(x)?x:[];const str=x=>x==null?"":String(x).trim();
const normName=n=>str(n).replace(/\s+/g," ").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
function parseImport(txt){const a=txt.indexOf("{"),b=txt.lastIndexOf("}");if(a<0||b<a)throw new Error("No data block found — paste the whole block from the AI.");
  let raw=txt.slice(a,b+1),o;try{o=JSON.parse(raw)}catch(err){raw=raw.replace(/[“”„]/g,'"').replace(/[‘’]/g,"'").replace(/\/\/[^\n"]*$/gm,"").replace(/,\s*([}\]])/g,"$1");o=JSON.parse(raw)}if(!o.patient||!str(o.patient.name))throw new Error("The block has no patient name.");return o}
function findMatch(P){const nid=str(P.nid),nm=normName(P.name),cd=str(P.code).toUpperCase();const A=allIndex();return A.find(p=>cd&&p.code===cd)||A.find(p=>nid&&p.nid===nid)||A.find(p=>normName(p.name)===nm)||null}
function applyImport(o,target){
  const P=o.patient,E=o.encounter||{};let p=target;
  if(!p){p={id:uidf("p"),name:str(P.name),nid:"",phone:"",consultant:"",age:"",sex:"",occupation:"",residence:"",marital:"",habits:"",pastMedical:[],pastSurgical:[],drugHistory:[],allergies:"",encounters:[]};patients.push(p)}
  for(const k of["nid","phone","age","sex","occupation","residence","marital","habits","allergies"])if(str(P[k])&&!p[k])p[k]=str(P[k]);
  if(str(P.consultant))p.consultant=str(P.consultant);
  for(const k of["pastMedical","pastSurgical","drugHistory"])for(const x of arr(P[k]).map(str).filter(Boolean))if(!p[k].includes(x))p[k].push(x);
  let e=latest(p);const merging=e&&e.status==="active";
  if(!merging){e={key:uidf("e"),type:"nephro",department:"",location:"",date:str(E.date)||today(),status:"active",complaint:"",hpi:"",diagnosis:"",vitalsLog:[],labs:[],imaging:[],plan:[],hd:[],images:[],events:[],meds:[],notes:""};p.encounters.push(e)}
  if(TYPES[E.type]&&(!merging||E.type!==e.type&&str(E.type)))e.type=E.type;
  for(const k of["department","location","complaint","hpi","diagnosis","hdSched"])if(str(E[k]))e[k]=str(E[k]);
  saveLog(e,...arr(E.vitals).map(v=>{const x={date:str(v.date)||today()};for(const[c]of ALLCOLS)if(str(v[c]))x[c]=str(v[c]);return Object.keys(x).length>1?x:null}));
  for(const l of arr(E.labs)){if(!str(l.name))continue;const rec={date:str(l.date)||today(),name:str(l.name),value:str(l.value),unit:str(l.unit),once:!!l.once};
    const i=e.labs.findIndex(x=>x.date===rec.date&&lkey(x.name)===lkey(rec.name));i>=0?e.labs[i]=rec:e.labs.push(rec)}
  for(const m of arr(E.imaging))if(str(m.test))e.imaging.push({test:str(m.test),result:str(m.result),date:str(m.date)});
  for(const h of arr(E.hd))e.hd.push(Object.fromEntries(Object.entries(h).map(([k,v])=>[k,str(v)])));
  for(const x of arr(E.events)){const t=str(x.text);if(t&&!e.events.some(y=>y.text===t))e.events.push({when:str(x.when),text:t})}
  for(const im of arr(E.meds)){const m={name:str(im.name),dose:str(im.dose),freq:str(im.freq),start:str(im.start),stop:str(im.stop),note:str(im.note)};if(!m.name)continue;
    const act=e.meds.find(x=>!x.stop&&(lkey(x.name)===lkey(m.name)||lkey(x.name).startsWith(lkey(m.name))||lkey(m.name).startsWith(lkey(x.name))));
    if(m.stop){if(act){act.stop=m.stop;act.note=m.note||"Stopped";e.events.push({when:m.stop,text:"Stopped "+medTxt(act)})}else e.meds.push(m);continue}
    if(act&&act.dose===m.dose&&act.freq===m.freq)continue;
    const when=m.start||(merging?today():str(E.date));
    if(act){act.stop=when;act.note="Changed to "+[m.dose,m.freq].filter(Boolean).join(" ");e.events.push({when,text:m.name+": "+[act.dose,act.freq].filter(Boolean).join(" ")+" → "+[m.dose,m.freq].filter(Boolean).join(" ")})}
    else if(merging)e.events.push({when,text:"Started "+medTxt(m)});
    {const nm=Object.fromEntries(Object.entries({...m,start:when}).filter(([,v])=>v));if(isOnceMed(nm))nm.once=true;e.meds.push(nm)}}
  if(str(E.notes))e.notes=(e.notes?e.notes+"\n":"")+str(E.notes);
  e.edited=now();return{p,merging};
}
let impText="",impParsed=null;
const dayIn=v=>!v||ISO.test(v)?el("input",{type:"date",value:v||"",style:"width:auto"}):inp(v,{placeholder:"YYYY-MM-DD"});
function markUnc(f,ms){f.classList.add("unc");const head=f.querySelector(":scope>label")||f.querySelector(":scope>.rhead");
  const note=el("div",{class:"uncnote",dir:"auto"},...ms.map(u=>el("span",{},(u.read?"Read: “"+u.read+"”":"")+(u.read&&u.note?" — ":"")+(u.note||(u.read?"":"Not clear")))));note.hidden=true;
  const b=el("button",{type:"button",class:"uncbtn","aria-label":"What the AI wasn't sure about",title:"AI note",onclick:ev=>{ev.preventDefault();note.hidden=!note.hidden}},"⚠");
  const ok=()=>{f.classList.remove("unc");f.dispatchEvent(new Event("uncfix",{bubbles:true}))};
  note.append(el("button",{type:"button",class:"small okbtn",onclick:ev=>{ev.preventDefault();ok();note.hidden=true}},"✓ Correct"));
  head.append(b);head.after(note);f.addEventListener("input",ok);f.addEventListener("change",ok)}
function recList(defs,items,where,itemKey,addLabel,flag,title){const box=el("div",{class:"sec",style:"gap:8px"}),list=el("div",{class:"sec",style:"gap:8px"});const rows=[];
  const add=(rec={},isNew)=>{const ins={};const g=el("div",{class:"vgrid"});let n=rows.length+1;
    for(const[k,lab,kind]of defs){const i=kind==="date"?dayIn(str(rec[k])):kind==="area"?area(str(rec[k]),{dir:"auto",style:"min-height:60px"}):inp(str(rec[k]),{dir:"auto"});ins[k]=i;const f=fld(lab,i);if(kind==="area"||kind==="wide")f.classList.add("wide");g.append(f)}
    const R={ins};rows.push(R);
    const card=el("div",{class:"rcard"},el("div",{class:"rhead"},el("span",{},title+" "+n),el("button",{type:"button",class:"link small","aria-label":"Remove",onclick:()=>{rows.splice(rows.indexOf(R),1);card.remove()}},"✕ Remove")),g);
    if(!isNew)flag(card,where,itemKey?str(rec[itemKey]):null,str(rec.date||rec.when||rec.start));list.append(card);return R};
  for(const x of items)add(x);
  box.append(list,el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>{const R=add({},true);Object.values(R.ins)[0].focus()}},addLabel));
  box.read=()=>rows.map(R=>Object.fromEntries(Object.entries(R.ins).map(([k,i])=>[k,String(i.value||"").trim()]))).filter(x=>Object.values(x).some(Boolean));return box}
function reviewForm(o){
  const P=o.patient||{},E=o.encounter||{};
  const U=arr(o.unclear).map(u=>({where:str(u.where||u.field).toLowerCase(),item:str(u.item),date:str(u.date),read:str(u.read),note:str(u.note),used:false}));
  const flag=(f,where,item,date)=>{const ms=U.filter(u=>!u.used&&u.where===where.toLowerCase()&&(!u.item||!item||lkey(u.item)===lkey(item))&&(!u.date||!date||u.date===date));if(!f||!ms.length)return;ms.forEach(u=>u.used=true);markUnc(f,ms)};
  const m=findMatch(P);const act=m&&latest(m)?.status==="active";
  const target=sel([["match",m?(act?"Add to "+m.name+"'s current admission":"New admission for "+m.name+" (re-admission)"):"—"],["new","Create as a new patient"]],m?"match":"new");if(!m)target.disabled=true;
  const F={name:inp(str(P.name),{dir:"auto"}),nid:inp(str(P.nid),{class:"mono"}),phone:inp(str(P.phone),{class:"mono"}),age:inp(str(P.age)),sex:sel([["","—"],["M","Male"],["F","Female"]],str(P.sex)),
    consultant:inp(str(P.consultant),{list:"dl-consultants"}),occupation:inp(str(P.occupation),{dir:"auto"}),residence:inp(str(P.residence),{dir:"auto"}),marital:inp(str(P.marital)),habits:inp(str(P.habits),{dir:"auto"}),
    allergies:inp(str(P.allergies),{dir:"auto"}),
    pastMedical:listEditor(arr(P.pastMedical).map(str).filter(Boolean),"e.g. Hypertension on Concor 5",v=>drugsFrom(v).forEach(d=>F.drugs.addItem(d))),
    pastSurgical:listEditor(arr(P.pastSurgical).map(str).filter(Boolean),"e.g. CABG (2013)"),drugs:listEditor(arr(P.drugHistory).map(str).filter(Boolean),"e.g. Concor 5 mg"),
    date:dayIn(str(E.date)||today()),location:inp(str(E.location),{list:"dl-locations",dir:"auto"}),dept:inp(str(E.department),{list:"dl-departments",dir:"auto"}),
    complaint:inp(str(E.complaint),{dir:"auto"}),diagnosis:inp(str(E.diagnosis),{dir:"auto"}),hpi:area(str(E.hpi),{dir:"auto"}),
    };
  for(const x of arr(P.pastMedical))drugsFrom(str(x)).forEach(d=>F.drugs.addItem(d));
  const type=seg("itype",TYPE_OPTS,TYPES[E.type]?E.type:"nephro");const sched=seg("isched",[["smw","Sat / Mon / Wed"],["stt","Sun / Tue / Thu"]],E.hdSched==="stt"?"stt":"smw");
  const deptWrap=fld("Department",F.dept,{req:true});const schedWrap=el("div",{class:"sec"},el("h3",{},"HD schedule"),sched);
  const syncType=()=>{const t=type.get();deptWrap.hidden=t==="nephro";schedWrap.hidden=t!=="hd"};type.onchange=syncType;syncType();
  autoConsWire(F.consultant,()=>type.get(),()=>F.location.value,()=>F.dept.value,[F.location,F.dept,type]);
  const fl=(label,input,where,opts)=>{const f=fld(label,input,opts);flag(f,where);return f};
  // vitals / exam days
  const vdays=[],vlist=el("div",{class:"sec",style:"gap:8px"});
  const addV=(v={},isNew)=>{const d=dayIn(str(v.date)),vb=vitalsBlock(v),xb=examBlock(v);const R={d,vb,xb};vdays.push(R);
    const card=el("div",{class:"rcard"},el("div",{class:"rhead"},el("span",{},"Day"),el("button",{type:"button",class:"link small",onclick:()=>{vdays.splice(vdays.indexOf(R),1);card.remove()}},"✕ Remove")),fld("Date",d),el("h3",{},"Vitals"),vb,el("h3",{},"Examination"),xb);
    if(!isNew)for(const[c]of ALLCOLS)flag((vb.fields||{})[c]||(xb.fields||{})[c],"vitals",c,str(v.date));vlist.append(card);return R};
  for(const v of arr(E.vitals))addV(v);
  // daily labs by day
  const labsAll=arr(E.labs).filter(l=>str(l.name));const daily=labsAll.filter(l=>!l.once),once=labsAll.filter(l=>l.once);
  const ldays=[],llist=el("div",{class:"sec",style:"gap:8px"});
  const addL=(date,items,isNew)=>{const d=dayIn(date),lb=labsBlock(DAILY_TESTS,items.map(l=>({name:str(l.name),value:str(l.value),unit:str(l.unit)})));const R={d,lb};ldays.push(R);
    const card=el("div",{class:"rcard"},el("div",{class:"rhead"},el("span",{},"Labs"),el("button",{type:"button",class:"link small",onclick:()=>{ldays.splice(ldays.indexOf(R),1);card.remove()}},"✕ Remove")),fld("Date",d),lb);
    if(!isNew)for(const l of items){const t=Object.keys(lb.fields).find(k=>lkey(k)===lkey(l.name));flag(lb.fields[t],"labs",str(l.name),date)}
    llist.append(card);return R};
  const byDate=new Map();for(const l of daily){const k=str(l.date);if(!byDate.has(k))byDate.set(k,[]);byDate.get(k).push(l)}
  for(const k of orderDates([...byDate.keys()].map(date=>({date}))))addL(k,byDate.get(k)||[]);
  const onceL=recList([["name","Test"],["value","Result","wide"],["unit","Unit"],["date","Date","date"]],once,"labs","name","+ Add test",flag,"Test");
  const imgL=recList([["test","Study"],["result","Result","area"],["date","Date","date"]],arr(E.imaging),"imaging","test","+ Add study",flag,"Study");
  const hdL=recList([["date","Date","date"],["ordH","Ordered h"],["ordUF","Ordered UF (L)"],["hours","Actual h"],["uf","Actual UF (L)"],["access","Access"],["pre","BP pre"],["post","BP post"],["hr","HR"],["wpre","Wt pre"],["wpost","Wt post"],["volume","Volume","area"],["notes","Notes","area"]],arr(E.hd),"hd",null,"+ Add session",flag,"Session");
  const evL=recList([["when","Date","date"],["text","What happened","area"]],arr(E.events),"events",null,"+ Add event",flag,"Event");
  const medL=recList([["name","Drug"],["dose","Dose"],["freq","Frequency"],["start","Start","date"],["stop","Stopped","date"],["note","Note"]],arr(E.meds),"meds","name","+ Add drug",flag,"Drug");
  const err=el("p",{class:"err",role:"alert"});
  const sec=(t,...k)=>el("div",{class:"fsec"},el("h3",{},t),...k);
  const form=el("div",{class:"sec",style:"gap:16px"},
    el("div",{class:"fgrid"},fl("Name",F.name,"patient.name",{req:true}),fl("National ID",F.nid,"patient.nid"),fl("Phone",F.phone,"patient.phone"),fl("Age",F.age,"patient.age"),fl("Sex",F.sex,"patient.sex"),fl("Consultant",F.consultant,"patient.consultant")),
    fld("Save as",target),
    sec("Admission",el("div",{class:"fgrid"},fl("Date",F.date,"encounter.date"),fl("Location",F.location,"encounter.location")),type,deptWrap,schedWrap),
    sec("Personal history",el("div",{class:"fgrid"},fl("Occupation",F.occupation,"patient.occupation"),fl("Residence",F.residence,"patient.residence"),fl("Marital status",F.marital,"patient.marital"),fl("Special habits",F.habits,"patient.habits"))),
    sec("Present history",el("div",{class:"fgrid"},fl("Chief complaint / reason",F.complaint,"encounter.complaint"),fl("Provisional diagnosis",F.diagnosis,"encounter.diagnosis")),fl("History of present illness",F.hpi,"encounter.hpi")),
    sec("Past history",el("div",{class:"grid2"},fl("Medical — chronic conditions",F.pastMedical,"patient.pastMedical",{hint:"Write “on …” and the drug goes to Drug history."}),fl("Surgical / procedures",F.pastSurgical,"patient.pastSurgical")),
      el("div",{class:"grid2"},fl("Drug history — before admission",F.drugs,"patient.drugHistory"),fl("Allergies",F.allergies,"patient.allergies"))),
    sec("Vitals & examination",vlist,el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>addV({},true)},"+ Add day")),
    sec("Daily labs",llist,el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>addL(today(),[],true)},"+ Add day")),
    sec("One-time tests",onceL),sec("Imaging & studies",imgL),sec("HD sessions",hdL),sec("Events",evL),sec("Medications",medL),
    err);
  const left=U.filter(u=>!u.used).map(u=>[u.where,u.item,u.date&&fmtDate(u.date)].filter(Boolean).join(" · ")+": "+[u.read&&"“"+u.read+"”",u.note].filter(Boolean).join(" — "));
  for(const t of [str(E.notes),str(P.notes)].filter(Boolean))left.push(...t.split(/\n|;\s*(?=\S)/).map(x=>x.trim()).filter(Boolean));const nUnc=U.length+left.length-U.filter(u=>!u.used).length;
  const items=left.map(t=>{const b=el("button",{type:"button",class:"small okbtn"},"✓");const row=el("div",{class:"lrow"},el("span",{dir:"auto"},"• "+t),b);b.onclick=()=>{row.classList.toggle("done");b.textContent=row.classList.contains("done")?"✓ Done":"✓";upd()};return row});
  const top=nUnc?el("div",{class:"warnbox",role:"alert"},el("b",{},"⚠ "+nUnc+" thing"+(nUnc>1?"s":"")+" the AI wasn't sure about"),...items):null;
  const pending=()=>form.querySelectorAll(".unc").length+items.filter(x=>!x.classList.contains("done")).length;
  const saveBtn=el("button",{class:"primary",onclick:()=>save()},"Save");const saveSt=el("span",{class:"err"});
  const upd=()=>{const n=pending();saveBtn.disabled=n>0;saveSt.textContent=n?"Fix "+n+" item"+(n>1?"s":"")+" first":""};
  form.addEventListener("input",upd);form.addEventListener("change",upd);form.addEventListener("uncfix",upd);setTimeout(upd,0);
  const save=()=>{if(pending()){upd();return}const name=F.name.value.trim();if(!name){err.textContent="Name is required.";F.name.focus();return}
    const t=type.get();if(t!=="nephro"&&!F.dept.value.trim()){err.textContent="Add the department for a co-admission, consult or HD-only patient.";F.dept.focus();return}
    const vit=vdays.map(R=>{const day=R.d.value.trim()||today();return Object.assign({date:day},R.vb.read(day)||{},R.xb.read(day)||{})}).filter(x=>Object.keys(x).length>1);
    const labs=[...ldays.flatMap(R=>R.lb.read(R.d.value.trim()||today())),...onceL.read().filter(x=>x.name).map(x=>({...x,once:true}))];
    const o2={patient:{name,nid:F.nid.value.trim(),phone:F.phone.value.trim(),age:F.age.value.trim(),sex:F.sex.value,consultant:F.consultant.value.trim(),occupation:F.occupation.value.trim(),
        residence:F.residence.value.trim(),marital:F.marital.value.trim(),habits:F.habits.value.trim(),allergies:F.allergies.value.trim(),pastMedical:F.pastMedical.get(),pastSurgical:F.pastSurgical.get(),drugHistory:F.drugs.get()},
      encounter:{type:t,department:t==="nephro"?"":F.dept.value.trim(),location:F.location.value.trim(),date:F.date.value.trim()||today(),hdSched:t==="hd"?sched.get():"",
        complaint:F.complaint.value.trim(),hpi:F.hpi.value.trim(),diagnosis:F.diagnosis.value.trim(),vitals:vit,labs,imaging:imgL.read().filter(x=>x.test),hd:hdL.read(),
        events:evL.read().filter(x=>x.text),meds:medL.read().filter(x=>x.name)}};
    const{p}=applyImport(o2,target.value==="match"?m:null);impText="";impParsed=null;current=p.id;back="home";view="file";flash=true;render();scrollTo(0,0)};
  return el("div",{class:"sec",style:"gap:14px"},
    el("p",{class:"sub"},m?(act?"Found this patient — currently admitted. New entries will be added to the current admission.":"Found this patient — not currently admitted. A new admission will be added."):"No matching patient — will be added as new."),
    top,form,el("div",{class:"row"},saveBtn,saveSt,el("button",{onclick:()=>{impParsed=null;render();scrollTo(0,0)}},"Back to the block")));
}
function importView(){
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},impParsed?"Check & edit before saving":"Import"),el("button",{class:"link",onclick:()=>{impText="";impParsed=null;view="home";render()}},"← Home")));
  if(impParsed){box.append(reviewForm(impParsed));return box}
  const ta=area(impText,{class:"mono",style:"min-height:180px",placeholder:"Paste the block from the AI here…",dir:"ltr"});ta.oninput=()=>impText=ta.value;
  const out=el("div",{class:"sec"});
  const check=()=>{try{impParsed=parseImport(toEn(ta.value))}catch(err){impParsed=null;out.replaceChildren(el("p",{class:"err"},err.message||"That block couldn't be read. Copy it again from the AI."));return}
    const m=findMatch(impParsed.patient);if(m&&m._stub){out.replaceChildren(el("p",{class:"sub"},"Opening the existing file…"));loadPatient(m.id).catch(()=>null).then(()=>{render();scrollTo(0,0)});return}render();scrollTo(0,0)};
  box.append(ta,el("div",{class:"row"},el("button",{class:"primary",onclick:check},"Check")),out);
  return box;
}
function consultantView(){
  const g=consGroups().groups.find(x=>x[0]===consView)||[consView,[]];const[c,ps]=g;
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},c+" — in ward ("+ps.length+")"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")));
  if(!ps.length){box.append(el("p",{class:"empty"},"No patients in ward."));return box}
  const sections=c===HDG?bySched(ps):byLoc(ps);
  for(const[k,xs]of sections){if(k)box.append(el("h3",{class:"lochead",dir:"auto"},k));
  for(const p of xs){const e=latest(p);const due=(e.plan||[]).map(it=>({it,d:dueInfo(it)})).filter(x=>x.d);const open=(e.plan||[]).filter(isOpen);
    if(hdToday(e))due.unshift({it:{text:"HD session"+(e.type==="hd"?" ("+schedLabel(e)+")":""),hd:true},d:{kind:"HD",date:today()}});
    box.append(el("div",{class:"pblock"},prow(p,"cons"),
      el("div",{class:"duebox"+(due.length?"":" none")},el("b",{class:"t"},due.length?"⏰ DUE TODAY":"NOTHING DUE TODAY"),
        due.length?el("ul",{},due.map(x=>el("li",{class:"red"},el("button",{onclick:()=>openPatient(p,"cons",dueTarget(p,e,x.it))},x.it.text+" "),dueTag(x.d)))):null,
        open.length?el("span",{class:"gt"},"NO DATE YET"):null,
        open.length?el("ul",{class:"grey"},open.map(it=>el("li",{},el("button",{onclick:()=>openPatient(p,"cons",{kind:"undated",key:e.key,idx:e.plan.indexOf(it),focus:true})},"◦ "+it.text)))):null)))}}
  return box;
}
function newPatientView(){
  const F={name:inp("",{autocomplete:"off",dir:"auto",placeholder:"الاسم بالعربي"}),nid:inp("",{inputmode:"numeric",class:"mono"}),phone:inp("",{inputmode:"tel",class:"mono"}),
    age:inp("",{inputmode:"numeric"}),sex:sel([["","—"],["M","Male"],["F","Female"]],""),consultant:inp("",{list:"dl-consultants",placeholder:"Pick: Dr. Hossam, Dr. Hesham, Dr. Bassem"}),
    date:el("input",{type:"date",value:today()}),location:inp("",{list:"dl-locations",placeholder:"Type or pick"}),
    dept:inp("",{list:"dl-departments",placeholder:"مثلًا: القلب",dir:"auto"}),
    occupation:inp(),residence:inp(),marital:sel(["","Single","Married","Divorced","Widowed"],""),habits:inp("",{placeholder:"Smoking, etc."}),
    complaint:inp(),hpi:area(),diagnosis:inp(),
    pastMedical:listEditor([],"e.g. Hypertension on Concor 5",v=>drugsFrom(v).forEach(d=>F.drugs.addItem(d))),pastSurgical:listEditor([],"e.g. CABG (2013)"),drugs:listEditor([],"e.g. Concor 5 mg"),allergies:inp()};
  const dupBox=el("div",{});F.name.addEventListener("input",()=>{const n=normName(F.name.value);const w=n.split(" ").filter(Boolean);
    const hits=n.length<3?[]:allIndex().filter(p=>{const m=normName(p.name);return m===n||(w.length>=2&&m.startsWith(w.slice(0,2).join(" ")))}).slice(0,3);
    dupBox.replaceChildren(...(hits.length?[el("div",{class:"warnbox"},el("b",{},"Already in the system?"),...hits.map(p=>{const e=latest(p);const act=e?.status==="active";
      return el("div",{class:"lrow"},el("span",{dir:"auto"},p.name+(e?" — "+[e.location,act?"admitted now":OUTCOMES[outcomeOf(e)]].filter(Boolean).join(" · "):"")),
        el("div",{class:"row"},el("button",{type:"button",class:"small",onclick:()=>openPatient(p,"home")},"Open file"),!act?el("button",{type:"button",class:"small primary",onclick:()=>openPatient(p,"home",{kind:"readmit",focus:true})},"Re-admit"):null))}))]:[]))});
  const type=seg("ptype",TYPE_OPTS,"nephro");
  const deptWrap=fld("Department",F.dept,{req:true,hint:"The team the patient is admitted under / who asked for the consult"});deptWrap.hidden=true;
  const sched=seg("psched",[["smw","Sat / Mon / Wed"],["stt","Sun / Tue / Thu"],["other","Other"]],"smw");const schedOther=inp("",{placeholder:"e.g. twice weekly"});
  const schedWrap=el("div",{class:"sec"},el("h3",{},"HD schedule"),sched,schedOther);schedWrap.hidden=true;schedOther.hidden=true;sched.onchange=()=>schedOther.hidden=sched.get()!=="other";
  const fullOnly=[];
  type.onchange=()=>{const t=type.get();deptWrap.hidden=t==="nephro";schedWrap.hidden=t!=="hd";fullOnly.forEach(x=>x.hidden=t==="hd")};
  autoConsWire(F.consultant,()=>type.get(),()=>F.location.value,()=>F.dept.value,[F.location,F.dept,type]);
  const vit=vitalsBlock(),exam=examBlock(),labs=labsBlock(),admMeds=medRows(),hdo=hdOptional(null),plan=[];
  const err=el("p",{class:"err",role:"alert"});
  const save=()=>{
    const name=F.name.value.trim();const t=type.get();
    if(!name){err.textContent="Name is required.";F.name.focus();return}
    if(t!=="nephro"&&!F.dept.value.trim()){err.textContent="Add the department for a co-admission or consult.";F.dept.focus();return}
    const d=F.date.value||today();const v=Object.assign({},vit.read(d)||{},exam.read(d)||{});
    const p={id:uidf("p"),name,nid:F.nid.value.trim(),phone:F.phone.value.trim(),consultant:F.consultant.value.trim(),age:F.age.value.trim(),sex:F.sex.value,
      occupation:F.occupation.value.trim(),residence:F.residence.value.trim(),marital:F.marital.value,habits:F.habits.value.trim(),
      pastMedical:F.pastMedical.get(),pastSurgical:F.pastSurgical.get(),drugHistory:F.drugs.get(),allergies:F.allergies.value.trim(),
      encounters:[{key:uidf("e"),type:t,department:t==="nephro"?"":F.dept.value.trim(),location:F.location.value.trim(),date:d,status:"active",
        complaint:F.complaint.value.trim(),hpi:F.hpi.value.trim(),diagnosis:F.diagnosis.value.trim(),
        hdSched:t==="hd"?sched.get():"",hdSchedOther:t==="hd"&&sched.get()==="other"?schedOther.value.trim():"",
        vitalsLog:t!=="hd"&&Object.keys(v).length?[{date:d,...v}]:[],labs:t!=="hd"?labs.read(d):[],imaging:[],plan:t!=="hd"?plan:[],hd:[],images:[],events:[{when:d,text:t==="consult"?"Consult received":t==="hd"?"Added to regular HD list":"Admitted"}],meds:t!=="hd"?admMeds.read(d):[],notes:"",edited:now()}]};
    {const hx=hdo.read(d);if(hx){const en=p.encounters[0];pushHd(en,hx)}}
    patients.push(p);current=p.id;back="home";view="file";flash=true;render();scrollTo(0,0);
  };
  const sec=(title,...kids)=>el("div",{class:"fsec"},el("h3",{},title),...kids);
  const full=(title,...kids)=>{const x=sec(title,...kids);fullOnly.push(x);return x};
  return el("section",{class:"panel"},
    el("div",{class:"topbar"},el("h2",{},"New patient"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Back")),
    el("div",{class:"fgrid"},fld("Name",F.name,{req:true}),fld("National ID",F.nid,{hint:"Optional"}),fld("Phone",F.phone,{hint:"Optional"}),fld("Age",F.age),fld("Sex",F.sex),fld("Consultant",F.consultant,{hint:"Filled from the location — change it if needed"})),dupBox,
    sec("Admission",el("div",{class:"fgrid"},fld("Date",F.date),fld("Location",F.location,{hint:"Type a new one or pick a saved one"})),type,deptWrap,schedWrap),
    full("Personal history",el("div",{class:"fgrid"},fld("Occupation",F.occupation),fld("Residence",F.residence),fld("Marital status",F.marital),fld("Special habits",F.habits))),
    full("Present history",el("div",{class:"fgrid"},fld("Chief complaint / reason",F.complaint),fld("Provisional diagnosis",F.diagnosis)),fld("History of present illness",F.hpi)),
    full("Past history",el("div",{class:"grid2"},fld("Medical — chronic conditions",F.pastMedical,{hint:"Type one, press Add. Write “on …” and the drug goes to Drug history."}),fld("Surgical / procedures",F.pastSurgical,{hint:"Year in brackets, e.g. CABG (2013)"})),el("div",{class:"grid2"},fld("Drug history — before admission",F.drugs),fld("Allergies",F.allergies))),
    full("Vitals today",vit),
    full("Examination today",exam),
    full("Labs today",labs,el("small",{class:"sub"},"Fill only what you have. One-time tests can be added from the patient file.")),
    sec("Haemodialysis",hdo,el("small",{class:"sub"},"Only if the patient is on HD or had a session — 1st, 2nd, 3rd, on demand or regular.")),
    full("Medications on admission",admMeds,el("small",{class:"sub"},"What the patient will take in hospital. Change dose or stop later from the file — the history is kept.")),
    full("Plan checklist",planBlock(plan)),
    err,el("div",{class:"row"},el("button",{class:"primary",onclick:save},"Save patient"),el("button",{onclick:()=>{view="home";render()}},"Cancel")));
}

function fileView(){
  const p=cur();const box=el("section",{class:"panel"});
  box.append(el("div",{class:"topbar"},el("button",{class:"link",onclick:()=>{view=back==="file"?"home":back;editing=null;mini=null;render()}},back==="cons"?"← "+consView:back==="find"?"← Search":back==="admin"?"← Admin":back==="hdtoday"?"← HD today":"← Home"),
    editing?null:navPN(p),p.edited&&!navSeq().includes(p)?el("span",{class:"edited"},"Last edited "+p.edited):null));
  if(editing==="patient"){box.append(patientEditor(p));return box}
  const e=latest(p);const active=e?.status==="active";
  box.append(el("div",{class:"fhead"},
    el("div",{class:"fwho"},el("h2",{dir:"auto"},p.name),e?.location?el("span",{class:"floc",dir:"auto"},e.location):null,
      el("span",{class:"ids"},[p.code,p.nid&&"ID "+p.nid,p.phone&&"☎ "+p.phone].filter(Boolean).join("   "))),
    e?el("div",{class:"ftype"},pill(e),el("span",{class:"fdate"},"Admitted "+fmtDate(e.date)),!active?el("span",{class:"sub"},OUTCOMES[outcomeOf(e)]+(e.closeDate?" "+closeTxt(e):"")):null):null));
  {const c=critParts(e);const all=[...c.labs,...c.vit];if(all.length)box.append(el("div",{class:"critbar",role:"alert"},critIcon(),el("b",{class:"cbl"},"Critical"),...all.map((x,i)=>el("span",{dir:"ltr"},(i?" · ":"")+x))))}
  {const ms=missedHd().filter(m=>m.p===p);if(ms.length)box.append(el("div",{class:"sec missbox"},el("h3",{class:"misshead"},"Missed HD session"+(ms.length>1?"s":"")),...missedList(ms,"file")))}
  if(p.unclear?.length)box.append(uncBox(p));
  box.append(briefHistory(p,e),historySection(p,e));
  box.append(el("div",{class:"cline"},el("span",{class:"sub"},"Consultant"),p.consultant?el("b",{},p.consultant):el("span",{class:"sub"},"not set")));
  if(e)box.append(editing===e.key?encEditor(p,e):encView(p,e,flash,true));
  box.append(el("div",{class:"fbottom"},
    mini?.kind==="extract"?extractBox(p):null,
    mini?.kind==="dsum"&&e?.key===mini.key?dischargeBox(p,e):null,
    active?el("button",{class:"closebar",onclick:()=>{mini={kind:"close",key:e.key,focus:true};render()}},"Close admission"):
      el("button",{class:"closebar primary",onclick:()=>{mini={kind:"readmit",focus:true};render()}},"Re-admit / new consult"),
    active&&mini?.kind==="close"&&mini.key===e.key?closeBox(e):null,
    mini?.kind==="readmit"?readmitBox(p):null));
  return box;
}
function briefHistory(p,e){
  const bits=[p.age&&p.age+" y",p.sex==="M"?"Male":p.sex==="F"?"Female":"",p.habits].filter(Boolean).join(" · ");
  return el("div",{class:"brief"},el("h3",{},"Brief history"),
    bits?el("p",{class:"sub"},bits):null,
    p.pastMedical?.length?el("div",{class:"chips"},p.pastMedical.map(x=>el("span",{class:"chip"},x))):null,
    e?.complaint?el("p",{},el("span",{class:"sub"},"Complaint: "),el("b",{},e.complaint)):null,
    e?.diagnosis?el("p",{},el("span",{class:"sub"},"Diagnosis: "),e.diagnosis):null,
    !bits&&!p.pastMedical?.length&&!e?.complaint&&!e?.diagnosis?el("p",{class:"empty"},"Nothing recorded yet."):null)}
function historySection(p,e){
  const kv=pairs=>{const dl=el("dl",{class:"kv"});for(const[k,v]of pairs)if(v)dl.append(el("dt",{},k),el("dd",{},v));return dl.childNodes.length?dl:el("p",{class:"empty"},"—")};
  const chips=a=>a?.length?el("div",{class:"chips"},a.map(x=>el("span",{class:"chip"},x))):el("p",{class:"empty"},"—");
  const yearOf=x=>{const m=String(x).match(/\((\d{4})\)|\b(19|20)\d{2}\b/);return m?(m[1]||m[0]):""};
  const tl=a=>a?.length?el("ul",{class:"timeline"},a.map(x=>{const y=yearOf(x);return el("li",{},el("span",{class:"when"},y||"—"),el("span",{},y?String(x).replace("("+y+")","").trim():x))})):el("p",{class:"empty"},"—");
  const n=[p.pastMedical,p.pastSurgical,p.drugHistory].reduce((k,a)=>k+(a?.length||0),0);
  const pres=e&&e.type!=="hd"?el("div",{class:"sec"},el("h3",{},"Present history"),
    e.complaint?el("p",{},el("b",{},e.complaint)):null,e.hpi?el("p",{style:"font-size:.92rem"},e.hpi):null,
    e.diagnosis?el("p",{style:"font-size:.9rem"},el("span",{class:"sub"},"Diagnosis: "),e.diagnosis):null,
    !e.complaint&&!e.hpi&&!e.diagnosis?el("p",{class:"empty"},"—"):null):null;
  const prev=p.encounters.filter(x=>x!==e).reverse();const prevOpen=prev.some(x=>editing===x.key||mini?.key===x.key);
  const prevSec=prev.length?el("div",{class:"sec"},el("h3",{},"Previous admissions ("+prev.length+")"),
    ...prev.map(x=>el("details",{class:"prevadm",...((editing===x.key||mini?.key===x.key||openPrev.has(x.key))?{open:true}:{}),ontoggle:ev=>{ev.target.open?openPrev.add(x.key):openPrev.delete(x.key)}},
      el("summary",{},el("b",{},fmtDate(x.date)),el("span",{}," · "+[x.location,typeLabel(x),OUTCOMES[outcomeOf(x)]+(x.closeDate?" "+closeTxt(x):"")].filter(Boolean).join(" · ")),
        x.complaint?el("span",{class:"sub",dir:"auto"}," — "+x.complaint):null),
      editing===x.key?encEditor(p,x):encView(p,x,false,false)))):null;
  return el("details",{class:"hist",...((openHist||prevOpen)?{open:true}:{}),ontoggle:ev=>openHist=ev.target.open},
    el("summary",{},"Full history",el("span",{class:"sub",style:"font-weight:400"},"  "+[n+" past item"+(n===1?"":"s"),p.allergies&&"allergy noted",prev.length&&prev.length+" previous admission"+(prev.length>1?"s":"")].filter(Boolean).join(" · "))),
    el("div",{class:"histsec"},
      el("div",{class:"sec"},el("h3",{},"Personal history"),kv([["Age",p.age&&p.age+" y"],["Sex",p.sex==="M"?"Male":p.sex==="F"?"Female":""],["Occupation",p.occupation],["Residence",p.residence],["Marital",p.marital],["Habits",p.habits]])),
      pres,
      el("div",{class:"grid2"},
        el("div",{class:"sec"},el("h3",{},"Past medical — chronic conditions"),chips(p.pastMedical)),
        el("div",{class:"sec"},el("h3",{},"Past surgical / procedures"),tl(p.pastSurgical))),
      el("div",{class:"grid2"},
        el("div",{class:"sec"},el("h3",{},"Drug history"),chips(p.drugHistory)),
        el("div",{class:"sec"},el("h3",{},"Allergies"),p.allergies?el("p",{style:"font-size:.9rem"},p.allergies):el("p",{class:"empty"},"None recorded"))),
      prevSec,
      el("small",{class:"sub"},"Edit from “Edit patient” and the admission’s “Edit”.")));
}
const openPrev=new Set();
function encView(p,e,isNew,main){if(e.type==="hd")return hdEncView(p,e,isNew,main);
  const box=el("article",{class:"enc"+(isNew?" new":"")+(main?" main":" prev")});const C=e.type==="consult";const active=e.status==="active";const isLast=main;
  box.append(main?el("div",{class:"enc-head"},el("div",{class:"tools"},
      active?el("button",{class:"small primary",onclick:()=>{mini={kind:"update",key:e.key};render()}},"+ Today's update"):null,
      el("button",{class:"small",onclick:()=>{editing=e.key;mini=null;render()}},"Edit admission"))):
    el("div",{class:"enc-head"},el("div",{class:"tools"},el("button",{class:"small",onclick:()=>{editing=e.key;mini=null;render()}},"Edit"))));
  if(!active&&e.closeNote)box.append(el("p",{class:"sub"},OUTCOMES[outcomeOf(e)]+" "+closeTxt(e)+" — "+e.closeNote));
  if(mini?.kind==="update"&&mini.key===e.key)box.append(updateBox(e));
  const dueHere=active?(e.plan||[]).filter(isDue):[],openHere=active?(e.plan||[]).filter(isOpen):[];
  if(dueHere.length||openHere.length)box.append(el("div",{class:"alert",role:"status"},
    dueHere.length?el("h2",{},"⏰ Due today"):null,
    dueHere.length?el("ul",{class:"dl red"},dueHere.map(it=>el("li",{},el("button",{onclick:()=>{mini=dueTarget(p,e,it);render()}},it.text+" ",dueTag(dueInfo(it)))))):null,
    openHere.length?el("h3",{class:"openh"},"No date yet ("+openHere.length+")"):null,
    openHere.length?el("ul",{class:"dl grey"},openHere.map(it=>{const idx=e.plan.indexOf(it);const li=el("li",{},el("button",{onclick:()=>{mini={kind:"undated",key:e.key,idx,focus:true};render()}},it.text,it.state==="doing"?el("span",{class:"due"}," in progress"):null));
      if(mini?.kind==="undated"&&mini.key===e.key&&mini.idx===idx)li.append(undatedBox(e,it));return li})):null,
    dueHere.length?el("small",{class:"sub"},"Tap a red item to record the result or postpone it."):null));
  if(e.edited)box.append(el("span",{class:"edited"},"Last edited "+e.edited));
  // present history (main admission shows it in Brief history)
  if(!main)box.append(admOn(e));
  // plan checklist
  {const pl=e.plan||[];box.append(fold(e,"plan",planView(e,active),pl.length?pl.filter(x=>x.state==="done").length+"/"+pl.length+" done":""))}
  // vitals
  const add=(kind,label)=>active?el("button",{class:"small",onclick:()=>{mini={kind,key:e.key};render()}},label):null;
  const vs=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Daily vitals & examination"),add("vitals","+ Add vitals & exam")));
  if(mini?.kind==="vitals"&&mini.key===e.key)vs.append(vitalsBox(e,mini.date));
  const vl=e.vitalsLog||[];
  const logTable=(cols,title)=>{const dated=vl.filter(x=>cols.some(([c])=>x[c]));if(!dated.length)return null;const dates=orderDates(dated);const rows=cols.filter(([c])=>dated.some(x=>x[c]));
    return el("div",{class:"sec"},el("span",{class:"sub",style:"font-size:.8rem;font-weight:600"},title),dayTable(dates,rows.map(([c,u])=>({name:c,unit:u,cells:dates.map(d=>{const x=dated.find(v=>(v.date||"")===d);return x?.[c]?{v:x[c],crit:critVit(c,x[c])}:null})})),cols===ECOLS?"wraptxt grid":"grid",d=>{mini={kind:"vitals",key:e.key,date:d};render()}))};
  const t1=logTable(VCOLS,"Vitals"),t2=logTable(ECOLS,"Examination");
  if(t1||t2)vs.append(...[t1,t2].filter(Boolean),el("span",{class:"tapnote"},"Tap a date to edit or delete that day."));else vs.append(el("p",{class:"empty"},"No vitals or examination yet."));
  box.append(fold(e,"vit",vs,vl.length?vl.length+" day"+(vl.length>1?"s":""):""));
  // labs
  const labs=e.labs||[],daily=labs.filter(l=>!isOnce(l)),once=labs.filter(isOnce);
  const ls=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Daily labs"),add("labs","+ Add labs")));
  if(mini?.kind==="labs"&&mini.key===e.key)ls.append(labsBox(e,DAILY_TESTS,mini.date));
  if(daily.length){const dates=orderDates(daily);const names=[];for(const l of daily)if(!names.some(n=>lkey(n)===lkey(l.name)))names.push(l.name);
    ls.append(dayTable(dates,names.map(n=>{const its=daily.filter(l=>lkey(l.name)===lkey(n));
      return{name:n,unit:its.find(l=>l.unit)?.unit||"",cells:dates.map(d=>{const ls=its.filter(x=>(x.date||"")===d),l=ls[ls.length-1];return l?{v:ls.map(x=>x.value).join(" → "),f:flagOf(l),crit:critLab(n,l.value)}:null})}}),"grid",d=>{mini={kind:"labs",key:e.key,date:d};render()},n=>{mini={kind:"trend",key:e.key,name:n,focus:true};render()}),
      mini?.kind==="trend"&&mini.key===e.key?trendBox(e,mini.name):null,
      el("span",{class:"tapnote"},"Tap a date to edit or delete that day's labs."))}
  else ls.append(el("p",{class:"empty"},"No daily labs yet."));
  {const n=new Set(daily.map(l=>l.date)).size;box.append(fold(e,"labs",ls,n?n+" day"+(n>1?"s":""):""))}
  const os=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"One-time tests & imaging"),el("button",{class:"small",onclick:()=>{mini={kind:"once",key:e.key};render()}},"+ Add test / image")));
  if(mini?.kind==="once"&&mini.key===e.key)os.append(onceBox(e,mini.o));
  const studies=[...once.map(l=>({o:l,name:l.name,res:l.value+(l.unit?" "+l.unit:""),date:l.date,f:flagOf(l)})),...(e.imaging||[]).map(m=>({o:m,name:m.test,res:m.result,date:m.date||""}))];
  if(studies.length){const tb=el("tbody");for(const st of studies)tb.append(el("tr",{class:"tap",title:"Tap to edit",onclick:ev=>{if(ev.target.closest(".thumb"))return;mini={kind:"once",key:e.key,o:st.o};render()}},el("td",{},st.name),el("td",{style:"white-space:normal"},el("span",{class:"cell "+(st.f||"")},st.res)),el("td",{class:"date"},fmtDate(st.date)),
      el("td",{},(st.o.image||st.o.imageId)?el("button",{class:"thumb",style:"width:52px",onclick:()=>openViewer(st.name,st.date,st.o.image||"",()=>{delete st.o.image;delete st.o.imageId;delete st.o.thumbId;delete st.o.imgKB;e.edited=now()},st.o.imageId)},imgOf(st.o,st.name)):"")));
    os.append(el("div",{class:"tablebox"},el("table",{},el("thead",{},el("tr",{},el("th",{},"TEST / STUDY"),el("th",{},"RESULT"),el("th",{},"DATE"),el("th",{},"IMAGE"))),tb)),el("span",{class:"tapnote"},"Tap a row to edit, add a photo or delete."))}
  if(e.images?.length)os.append(el("div",{class:"gallery"},e.images.map(im=>el("button",{class:"thumb",onclick:()=>openViewer(im.title,im.date,im.src,()=>{e.images=e.images.filter(x=>x!==im);e.edited=now()})},el("img",{src:im.src,alt:im.title||"Image"}),el("span",{},(im.title||"Image")+" · "+fmtDate(im.date))))));
  if(!studies.length&&!e.images?.length)os.append(el("p",{class:"empty"},"None yet — e.g. HbA1c, PTH, viral markers, cultures, echo, X-ray. You can attach a photo to each."));
  box.append(fold(e,"once",os,(studies.length+(e.images?.length||0))||""));
  // HD sessions
  box.append(fold(e,"hd",hdSection(e,active),e.hd?.length||""));
  // events + meds
  const es=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Events"),el("button",{class:"small",onclick:()=>{mini={kind:"event",key:e.key};render()}},"+ Add event")));
  if(mini?.kind==="event"&&mini.key===e.key)es.append(eventBox(e,mini.x));
  es.append(eventsList(e,"No events yet."));
  box.append(fold(e,"events",es,e.events?.length||""),fold(e,"meds",medsView(e,active),(e.meds||[]).filter(m=>!m.stop&&!m.once).length+" current"));

  return main?box:prevFinish(e,box);
}
const closeTxt=e=>fmtDate(e.closeDate)+(e.closeEst?" ("+e.closeEst+")":"");
const canEditOld=()=>isAdmin();
function admOn(e){const row=(k,v)=>v?el("p",{},el("span",{class:"sub"},k+": "),el("span",{dir:"auto"},v)):null;
  return el("div",{class:"admon"},row("Admission on",fmtDate(e.date)),row("Location",e.location),row("Type",typeLabel(e)),row("Reason for admission",e.complaint),
    row("Diagnosis",e.diagnosis),e.hpi?el("p",{dir:"auto",style:"font-size:.9rem"},e.hpi):null,row("Outcome",OUTCOMES[outcomeOf(e)]+(e.closeDate?" "+closeTxt(e):"")+(e.closeNote?" — "+e.closeNote:"")))}
function prevFinish(e,box){
  const once=(e.labs||[]).filter(isOnce),daily=(e.labs||[]).filter(l=>!isOnce(l));
  const has={plan:(e.plan||[]).length,vit:(e.vitalsLog||[]).length,labs:e.type==="hd"?(e.labs||[]).length:daily.length,once:once.length+(e.imaging||[]).length+(e.images||[]).length,
    hd:(e.hd||[]).length,events:(e.events||[]).length,meds:(e.meds||[]).length,notes:!!e.notes};
  box.querySelectorAll(":scope>details.fold").forEach(d=>{const k=d.dataset.f;if(k in has&&!has[k])d.remove()});
  box.querySelectorAll(":scope>p.sub").forEach(x=>x.remove());
  if(!canEditOld()){box.classList.add("ro");box.querySelector(":scope>.enc-head")?.remove();
    box.addEventListener("click",ev=>{if(ev.target.closest("summary"))return;if(ev.target.closest("button,tr.tap,li.tap")){ev.stopPropagation();ev.preventDefault()}},true)}
  return box}

function hdEncView(p,e,isNew,main){
  const box=el("article",{class:"enc"+(isNew?" new":"")+(main?" main":" prev")});const active=e.status==="active";
  box.append(el("div",{class:"enc-head"},el("div",{class:"tools"},el("button",{class:"small",onclick:()=>{editing=e.key;mini=null;render()}},main?"Edit admission":"Edit"))));
  if(!active&&e.closeNote)box.append(el("p",{class:"sub"},OUTCOMES[outcomeOf(e)]+" "+closeTxt(e)+" — "+e.closeNote));
  box.append(el("p",{},el("span",{class:"sub"},"HD schedule: "),el("b",{},schedLabel(e)||"not set")));
  if(hdToday(e))box.append(el("div",{class:"alert",role:"status"},el("h2",{},"⏰ HD session due today"),el("ul",{class:"dl"},el("li",{},el("button",{onclick:()=>{mini={kind:"hd",key:e.key,h:(e.hd||[]).find(h=>h.date===today()&&h.status==="ordered"),mode:"complete",focus:true};render()}},"Record today's session")))));
  box.append(fold(e,"hd",hdSection(e,active),e.hd?.length||""));
  const ls=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Labs"),active?el("button",{class:"small",onclick:()=>{mini={kind:"labs",key:e.key};render()}},"+ Add labs"):null));
  if(mini?.kind==="labs"&&mini.key===e.key)ls.append(labsBox(e,HD_TESTS,mini.date));
  ls.append(labsTable(e.labs||[],d=>{mini={kind:"labs",key:e.key,date:d};render()})||el("p",{class:"empty"},"No labs yet — e.g. CBC, K."));box.append(fold(e,"labs",ls,e.labs?.length?new Set(e.labs.map(l=>l.date)).size+" day(s)":""));
  const es=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Notes & events"),el("button",{class:"small",onclick:()=>{mini={kind:"event",key:e.key};render()}},"+ Add note")));
  if(mini?.kind==="event"&&mini.key===e.key)es.append(eventBox(e,mini.x));
  es.append(eventsList(e,"Nothing yet."));
  if(e.notes)es.append(el("p",{style:"font-size:.9rem"},e.notes));
  box.append(fold(e,"events",es,e.events?.length||""));if(!main)box.insertBefore(admOn(e),box.children[1]||null);return main?box:prevFinish(e,box);
}
function eventsList(e,empty){return e.events?.length?el("div",{class:"sec",style:"gap:4px"},el("ul",{class:"timeline"},e.events.map(x=>el("li",{class:"tap",title:"Tap to edit",onclick:()=>{mini={kind:"event",key:e.key,x};render()}},el("span",{class:"when"},fmtDate(x.when)),el("span",{},x.text)))),el("span",{class:"tapnote"},"Tap an event to edit or delete it.")):el("p",{class:"empty"},empty)}
function labsTable(labs,onDate){if(!labs.length)return null;const dates=orderDates(labs);const names=[];for(const l of labs)if(!names.some(n=>lkey(n)===lkey(l.name)))names.push(l.name);
  return dayTable(dates,names.map(n=>{const its=labs.filter(l=>lkey(l.name)===lkey(n));return{name:n,unit:its.find(l=>l.unit)?.unit||"",cells:dates.map(d=>{const ls=its.filter(x=>(x.date||"")===d),l=ls[ls.length-1];return l?{v:ls.map(x=>x.value).join(" → "),f:flagOf(l)}:null})}}),"",onDate)}
function hdSection(e,active){
  const hs=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"HD sessions"),active?el("button",{class:"small",onclick:()=>{mini={kind:"hd",key:e.key,mode:"order"};render()}},"+ Order HD session"):null));
  if(mini?.kind==="hd"&&mini.key===e.key)hs.append(hdBox(e,mini.h,mini.mode));
  if(e.hd?.length){const showK=e.hd.some(h=>hdKindLabel(h.kind));const tb=el("tbody");const j=(a,b,sep=" → ")=>[a,b].filter(Boolean).join(sep);
    e.hd.forEach((h,i)=>tb.append(el("tr",{class:"tap",title:"Tap to edit",onclick:()=>{mini={kind:"hd",key:e.key,h};render()}},el("td",{class:"v"},String(i+1)),el("td",{class:"date"},fmtDate(h.date),hdCancelled(h)?el("span",{class:"ordtag cx"},"Cancelled"):!hdDone(h)?el("span",{class:"ordtag"},"Ordered"):null),showK?el("td",{},hdKindLabel(h.kind)):null,
      el("td",{class:"v"},j(h.ordH&&h.ordH+" h",h.ordUF&&h.ordUF+" L"," / ")),el("td",{class:"v"},j(h.hours&&h.hours+" h",h.uf&&h.uf+" L"," / ")),
      el("td",{},h.access||""),el("td",{class:"v"},j(h.pre,h.post)),el("td",{class:"v"},h.hr||""),el("td",{class:"v"},j(h.wpre,h.wpost),h.dry?el("span",{class:"dw"}," DW "+h.dry):null),
      el("td",{class:"wide"},h.volume||""),el("td",{class:"wide"},[h.notes,hdCancelled(h)&&h.cancelReason?"Cancelled: "+h.cancelReason:""].filter(Boolean).join(" — ")))));
    hs.append(el("div",{class:"tablebox"},el("table",{class:"daytable hdtable"},el("thead",{},el("tr",{},...["#","DATE",showK?"TYPE":null,"ORDER h / UF","DONE h / UF","ACCESS","BP PRE → POST","HR","WT PRE → POST","VOLUME","NOTES"].filter(Boolean).map(h=>el("th",{},h)))),tb)),el("span",{class:"tapnote"},"Tap a session to edit or delete it."))}
  else hs.append(el("p",{class:"empty"},"No sessions recorded."));
  return hs;
}
const medTxt=m=>[m.name,m.dose,m.freq].filter(Boolean).join(" · ");
function medsView(e,active){
  const meds=e.meds||(e.meds=[]);const cur=meds.filter(m=>!m.stop&&!m.once),old=meds.filter(m=>m.stop&&!m.once),once=meds.filter(m=>m.once);
  const s=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Medications"),active?el("button",{class:"small",onclick:()=>{mini={kind:"medadd",key:e.key};render()}},"+ Add medication"):null));
  if(mini?.kind==="medadd"&&mini.key===e.key)s.append(medAddBox(e));
  const row=(m,stopped)=>{const li=el("li",{class:"mrow"},el("button",{type:"button",class:"mname",onclick:()=>{mini=mini?.m===m&&mini.kind==="medEdit"?null:{kind:"medEdit",key:e.key,m};render()}},
      el("b",{},m.name),el("span",{},[m.dose,m.freq].filter(Boolean).join(" · "))),
    el("span",{class:"since"},stopped?(m.start?fmtDate(m.start):"")+" → "+fmtDate(m.stop):m.start?"since "+fmtDate(m.start):""),
    !stopped&&active?el("button",{class:"small",onclick:()=>{mini={kind:"medstop",key:e.key,m};render()}},"Stop"):null,
    stopped&&active&&!/^Changed/.test(m.note||"")?el("button",{class:"small",onclick:()=>{delete m.stop;delete m.note;e.events.push({when:today(),text:"Resumed "+medTxt(m)});e.edited=now();mini=null;render()}},"Resume"):null);
    if(mini?.m===m&&mini.kind==="medstop")li.append(medStopBox(e,m));if(mini?.m===m&&mini.kind==="medEdit")li.append(medEditBox(e,m));return li};
  s.append(cur.length?el("ul",{class:"medlist"},cur.map(m=>row(m,false))):el("p",{class:"empty"},"No current medications."));
  if(once.length){s.append(el("h3",{class:"subh2"},"Given once"),el("ul",{class:"medlist once"},once.sort((a,b)=>String(b.start||"").localeCompare(String(a.start||""))).map(m=>{
    const li=el("li",{class:"mrow"},el("button",{type:"button",class:"mname",onclick:()=>{mini=mini?.m===m&&mini.kind==="medEdit"?null:{kind:"medEdit",key:e.key,m};render()}},el("b",{},m.name),el("span",{},m.dose||"")),
      el("span",{class:"since"},m.start?fmtDate(m.start):""));if(mini?.m===m&&mini.kind==="medEdit")li.append(medEditBox(e,m));return li})))}
  if(old.length)s.append(el("details",{class:"src",...(old.includes(mini?.m)?{open:true}:{})},el("summary",{},"Stopped / changed ("+old.length+")"),
    el("ul",{class:"medlist old",style:"margin-top:6px"},old.map(m=>row(m,true)))));
  return s}
function medHistory(e,m){const k=lkey(m.name);const xs=(e.meds||[]).filter(x=>lkey(x.name)===k).sort((a,b)=>String(a.start||"").localeCompare(String(b.start||"")));
  return el("ul",{class:"mhist"},xs.map(x=>el("li",{class:x===m?"cur":""},el("span",{},[x.dose,x.freq].filter(Boolean).join(" · ")||"—"),
    el("span",{class:"since"},(x.start?fmtDate(x.start):"?")+" → "+(x.stop?fmtDate(x.stop):"now")),x.note?el("span",{class:"sub"},x.note):null)))}
function medEditBox(e,m){const n=inp(m.name),d=inp(m.dose),f=inp(m.freq),from=dateIn(),st=dateIn(m.start||""),sp=m.stop?dateIn(m.stop):null;
  const kind=seg("mk"+nid(),[["reg","Regular"],["once","Given once"]],m.once?"once":"reg");
  const chg=()=>!m.once&&kind.get()==="reg"&&!m.stop&&(d.value.trim()!==(m.dose||"")||f.value.trim()!==(m.freq||""));
  const fromF=fld("Change from",from);fromF.hidden=true;[d,f].forEach(i=>i.addEventListener("input",()=>fromF.hidden=!chg()));
  return el("div",{class:"minibox"},m.once?null:el("h3",{},"History"),m.once?null:medHistory(e,m),el("h3",{},"Edit"),kind,
    el("div",{class:"fgrid"},fld("Drug",n),fld("Dose",d),fld("Frequency",f),fromF,fld(m.once?"Given on":"Started",st),sp?fld("Stopped",sp):null),
    actions(()=>{if(!n.value.trim())return;const nm=n.value.trim();const toOnce=kind.get()==="once";
      if(toOnce!==!!m.once){if(toOnce){m.once=true;delete m.stop;delete m.note}else delete m.once}
      if(chg()){const when=from.value||today();const nd={name:nm,dose:d.value.trim(),freq:f.value.trim(),start:when};
        m.name=nm;m.stop=when;m.note="Changed to "+[nd.dose,nd.freq].filter(Boolean).join(" ");e.meds.push(nd);
        e.events.push({when,text:nm+": "+[m.dose,m.freq].filter(Boolean).join(" ")+" → "+[nd.dose,nd.freq].filter(Boolean).join(" ")})}
      else{m.name=nm;m.start=st.value||m.start||"";if(sp)m.stop=sp.value||m.stop}
      e.edited=now();mini=null;render()},"Save",
      delBtn(e,"Delete drug",()=>{e.meds=e.meds.filter(x=>x!==m)})))}
function medAddBox(e){const n=inp("",{placeholder:"Drug"}),d=inp("",{placeholder:"e.g. 40 mg"}),f=inp("",{placeholder:"e.g. 1×2, q12h"}),dt=dateIn();
  const kind=seg("madd"+e.key,[["reg","Regular"],["once","Given once"]],"reg");const ff=fld("Frequency",f);const dl=el("label",{},"Start");const df=el("div",{class:"field"},dl,dt);
  kind.onchange=()=>{ff.hidden=kind.get()==="once";dl.textContent=kind.get()==="once"?"Given on":"Start"};
  return el("div",{class:"minibox"},kind,el("div",{class:"fgrid"},fld("Drug",n),fld("Dose",d),ff,df),actions(()=>{if(!n.value.trim())return;const o=kind.get()==="once";
    const m={name:n.value.trim(),dose:d.value.trim(),freq:o?"":f.value.trim(),start:dt.value};if(o)m.once=true;e.meds.push(m);e.events.push({when:dt.value,text:(o?"Given ":"Started ")+medTxt(m)});e.edited=now();mini=null;render()},"Add"))}
function medStopBox(e,m){const dt=dateIn(),why=inp("",{placeholder:"Reason (optional)"});
  return el("div",{class:"minibox"},el("div",{class:"fgrid"},fld("Stop date",dt),fld("Reason",why)),actions(()=>{m.stop=dt.value;m.note="Stopped"+(why.value.trim()?": "+why.value.trim():"");
    e.events.push({when:dt.value,text:"Stopped "+medTxt(m)+(why.value.trim()?" ("+why.value.trim()+")":"")});e.edited=now();mini=null;render()},"Stop drug"))}
const openSecs=new Set();
const MINI_SEC={medEdit:"meds",trend:"labs",vitals:"vit",labs:"labs",once:"once",hd:"hd",event:"events",medadd:"meds",medchg:"meds",medstop:"meds",medEdit:"meds",plan:"plan",result:"plan",postpone:"plan",planEdit:"plan"};
function fold(e,id,sec,count){
  const k=e.key+":"+id;const head=sec.querySelector(":scope>.sec-head");const titleEl=sec.querySelector(":scope>h3")||head?.querySelector("h3");
  const title=titleEl?.textContent||id;const tools=head?[...head.querySelectorAll(":scope>button, :scope>.row")]:[];
  if(head)head.remove();else titleEl?.remove();
  const forced=mini?.key===e.key&&MINI_SEC[mini.kind]===id;
  const d=el("details",{class:"fold","data-f":id,...((openSecs.has(k)||forced)?{open:true}:{}),ontoggle:ev=>{ev.target.open?openSecs.add(k):openSecs.delete(k)}},
    el("summary",{},el("span",{},title),count?el("span",{class:"cnt"},count):null,(()=>{const c=critParts(e);return(id==="labs"&&c.labs.length)||(id==="vit"&&c.vit.length)?el("span",{class:"critf"},critIcon()):null})()));
  const body=el("div",{class:"sec fold-body"});if(tools.length)body.append(el("div",{class:"row",style:"justify-content:flex-end"},...tools));
  body.append(...sec.childNodes);d.append(body);return d}
function planOrder(list){const g=it=>it.state==="cancelled"?9:it.state==="done"?4:dueInfo(it)?0:(it.state==="todo"&&it.due>today())||it.resultDue>today()?1:2;
  const dk=it=>(it.state==="todo"&&it.due)||it.resultDue||"9999";return list.filter(it=>it.state!=="cancelled").sort((a,b)=>g(a)-g(b)||(g(a)===1?dk(a).localeCompare(dk(b)):0))}
function planAddRow(e,list){const t=inp("",{placeholder:"+ Add item",class:"addin"});
  const chips=el("div",{class:"chips"},PLAN_PRESETS.filter(x=>!list.some(y=>y.text===x&&y.state!=="cancelled")).map(x=>el("button",{class:"chip",type:"button",onmousedown:ev=>ev.preventDefault(),onclick:()=>{list.push({text:x,state:"todo",due:"",resultDue:""});e.edited=now();render()}},"+ "+x)));chips.hidden=true;
  const add=()=>{const v=t.value.trim();if(!v)return;list.push({text:v,state:"todo",due:"",resultDue:""});e.edited=now();render()};
  t.onfocus=()=>chips.hidden=false;t.onblur=()=>setTimeout(()=>{if(!t.value)chips.hidden=true},150);t.onkeydown=ev=>{if(ev.key==="Enter"){ev.preventDefault();add()}};
  return el("li",{class:"addrow"},el("div",{class:"row",style:"flex-wrap:nowrap;width:100%"},t,el("button",{class:"small",type:"button",onclick:add},"Add")),chips)}
function planView(e,active){
  const s=el("div",{class:"sec"});const list=e.plan||(e.plan=[]);const live=list.filter(x=>x.state!=="cancelled");const done=live.filter(x=>x.state==="done").length;const canc=list.filter(x=>x.state==="cancelled");
  s.append(el("div",{class:"sec-head"},el("h3",{},(e.type==="consult"?"Recommendations":"Plan")+" checklist"),live.length?el("span",{class:"progress"},done+"/"+live.length+" done"):null));
  const ul=el("ul",{class:"check plan2"});
  for(const it of planOrder(list)){const idx=list.indexOf(it);const st=STATES.find(x=>x[0]===it.state)||STATES[0];const di=dueInfo(it);
    const sub=[it.state==="todo"&&it.due&&!di?"scheduled "+fmtDate(it.due):"",it.state!=="done"&&it.resultDue&&!(di?.kind==="Result due")?"result "+fmtDate(it.resultDue):"",
      it.state==="done"&&it.result?"= "+it.result+(it.doneDate?" ("+fmtDate(it.doneDate)+")":""):""].filter(Boolean).join(" · ");
    const li=el("li",{class:"pi "+it.state+(di?" due":"")},
      el("div",{class:"pmain"},el("button",{type:"button",class:"pname",onclick:()=>{mini={kind:"planEdit",key:e.key,idx};render()}},it.text),
        (di||sub)?el("div",{class:"psub"},di?dueTag(di):null,sub?el("span",{},sub):null):null),
      active&&it.state!=="done"?el("button",{class:"small pdate",onclick:()=>{mini={kind:"postpone",key:e.key,idx};render()}},"Set date"):null,
      el("button",{class:"state "+st[0],"aria-label":it.text+": "+st[1],onclick:()=>{if(it.state==="doing"||(it.state==="todo"&&false)){mini={kind:"result",key:e.key,idx,focus:true};render();return}
        if(it.state==="done"){it.state="todo";it.result=it.result||"";e.edited=now();render();return}it.state="doing";e.edited=now();render()}},st[1]));
    if(mini?.key===e.key&&mini.idx===idx&&mini.kind==="result")li.append(resultBox(e,it));
    if(mini?.key===e.key&&mini.idx===idx&&mini.kind==="postpone")li.append(postponeBox(e,it));
    if(mini?.key===e.key&&mini.idx===idx&&mini.kind==="planEdit")li.append(planEditBox(e,it));
    ul.append(li)}
  if(active)ul.append(planAddRow(e,list));
  if(live.length||active)s.append(ul);else s.append(el("p",{class:"empty"},"Nothing planned."));
  if(canc.length)s.append(el("details",{class:"src"},el("summary",{},"Cancelled ("+canc.length+")"),el("ul",{class:"check"},canc.map(it=>el("li",{class:"cancelled"},el("span",{class:"txt"},it.text),
    active?el("button",{class:"small link",onclick:()=>{it.state="todo";e.events.push({when:today(),text:"Plan item restored: "+it.text});e.edited=now();render()}},"Restore"):null)))));
  return s;
}
const tblAll=new Set();const TBL_DAYS=14;
function dayTable(dates,rows,cls="",onDate,onName){
  const tk=(current||"")+"|"+cls+"|"+(rows[0]?.name||"");let more=null;
  if(dates.length>TBL_DAYS){const all=tblAll.has(tk),n=dates.length;
    more=el("button",{type:"button",class:"link small tblmore",onclick:()=>{all?tblAll.delete(tk):tblAll.add(tk);render()}},all?"Show last "+TBL_DAYS+" days":"Show all "+n+" days");
    if(!all){dates=dates.slice(-TBL_DAYS);rows=rows.map(r=>({...r,cells:r.cells.slice(-TBL_DAYS)}))}}
  const tb=el("tbody");
  for(const r of rows)tb.append(el("tr",{},el("td",{class:"name"},onName?el("button",{type:"button",class:"tname",onclick:()=>onName(r.name)},r.name):r.name),...r.cells.map(c=>el("td",{class:"v"+(c?.crit?" critc":"")},c?el("span",{class:"cell "+(c.f||"")},c.v+(c.f==="H"?" ↑":c.f==="L"?" ↓":"")):"·")),el("td",{class:"u"},r.unit)));
  const tbx=el("div",{class:"tablebox"},el("table",{class:"daytable "+cls},el("thead",{},el("tr",{},el("th",{class:"name"},""),...dates.map(d=>el("th",{class:"day"},onDate?el("button",{type:"button",title:"Edit this day",onclick:()=>onDate(d)},fmtDate(d)):fmtDate(d))),el("th",{},""))),tb));
  return more?el("div",{class:"tblwrap"},tbx,more):tbx;
}

/* ---------- mini forms ---------- */
const dateIn=(v)=>el("input",{type:"date",value:v===undefined?today():(ISO.test(v||"")?v:""),style:"width:auto"});
const actions=(onSave,label,extra)=>el("div",{class:"row"},el("button",{class:"primary small",onclick:onSave},label),el("button",{class:"small",onclick:()=>{mini=null;render()}},"Cancel"),extra||null);
function delBtn(e,label,fn){return twoTap(el("button",{class:"small danger",style:"margin-left:auto"},label),"Tap again to delete",()=>{fn();e.edited=now();mini=null;render()})}
function vitalsBox(e,date){const ex=date!=null?(e.vitalsLog||[]).find(v=>(v.date||"")===date):null;
  const d=dateIn(ex?ex.date:undefined),g=vitalsBlock(ex),x=examBlock(ex);
  return el("div",{class:"minibox"},fld("Date",d,{hint:ex&&!ISO.test(ex.date||"")?"Recorded as “"+ex.date+"”":""}),whoLine(ex?[ex]:[]),el("h3",{},"Vitals"),g,el("h3",{},"Examination"),x,
    actions(()=>{const day=d.value||(ex?ex.date:today());const v={date:day,...(g.read(day)||{}),...(x.read(day)||{})};
      e.vitalsLog=e.vitalsLog||[];if(ex)e.vitalsLog=e.vitalsLog.filter(y=>y!==ex);
      if(Object.keys(v).length>1){const y=e.vitalsLog.find(z=>z.date===day);y?Object.assign(y,v):e.vitalsLog.push(v)}e.edited=now();mini=null;render()},ex?"Save changes":"Save",
      ex?delBtn(e,"Delete this day",()=>{e.vitalsLog=e.vitalsLog.filter(y=>y!==ex)}):null))}
const HD_TESTS=DAILY_TESTS.filter(([t])=>["Hb","PLT","TLC","K","Na","Urea","Creatinine","Ca","Phos"].includes(t));
function labsBox(e,tests,date){const isDaily=l=>e.type==="hd"||!isOnce(l);const ex=date!=null?(e.labs||[]).filter(l=>(l.date||"")===date&&isDaily(l)):[];
  const exLast=ex.filter((l,i)=>!ex.slice(i+1).some(y=>lkey(y.name)===lkey(l.name)));
  const d=dateIn(date!=null?date:undefined),g=labsBlock(tests||DAILY_TESTS,exLast);
  return el("div",{class:"minibox"},fld("Date",d,{hint:date!=null&&!ISO.test(date)?"Recorded as “"+date+"”":""}),g,whoLine(ex),el("small",{class:"sub"},date!=null?"Clear a box to remove that result.":"Fill only what you have."),
    actions(()=>{const day=d.value||(date!=null?date:today());const got=g.read(day);
      if(date!=null){for(const l of exLast){const n=got.find(x=>lkey(x.name)===lkey(l.name));if(!n)e.labs=e.labs.filter(x=>x!==l);else{l.value=n.value;l.unit=n.unit||l.unit;l.date=day}}
        for(const n of got)if(!exLast.some(l=>lkey(l.name)===lkey(n.name)))e.labs.push(n)}
      else for(const l of got){const same=e.labs.filter(x=>x.date===l.date&&lkey(x.name)===lkey(l.name));if(!same.length||same[same.length-1].value!==l.value)e.labs.push(l)}
      e.edited=now();mini=null;render()},date!=null?"Save changes":"Save labs",
      date!=null&&ex.length?delBtn(e,"Delete this day",()=>{e.labs=e.labs.filter(l=>!ex.includes(l))}):null))}
function onceBox(e,o){const isImg=!!o&&("test" in o)&&!("name" in o);
  const n=inp(o?(isImg?o.test:o.name):"",{placeholder:"e.g. HbA1c, Echo, Chest X-ray, Blood culture"}),v=area(o?(isImg?o.result:o.value):"",{placeholder:"Result (can be added later)"}),u=inp(o&&!isImg?o.unit:"",{placeholder:"Unit (optional)"}),
    d=dateIn(o?(o.date||""):undefined),f=el("input",{type:"file",accept:"image/*"}),st=el("p",{class:"sub"});
  return el("div",{class:"minibox"},whoLine(o?[o]:[]),el("div",{class:"fgrid"},fld("Test / study",n),isImg?null:fld("Unit",u),fld("Date",d)),fld("Result",v),fld(o?.image||o?.imageId?"Replace photo":"Photo (optional)",f,{hint:"X-ray, ECG, report or result sheet"}),st,
    actions(async()=>{if(!n.value.trim()){st.textContent="Write the test or study name.";return}
      let image="",kb=0,th="";if(f.files[0]){st.textContent="Preparing image…";let small="";try{image=await shrink(f.files[0]);small=await shrinkTo(f.files[0],320,0.6)}catch{st.textContent="That file couldn't be opened as an image.";return}
        kb=Math.round((image.length+small.length)/1024);st.textContent="Saving image…";try{image=await Store.saveImage(image);th=await Store.saveImage(small)}catch{st.textContent="Couldn't save the image — check the connection.";return}}
      if(o){if(isImg)Object.assign(o,{test:n.value.trim(),result:v.value.trim(),date:d.value||o.date||""});else Object.assign(o,{name:n.value.trim(),value:v.value.trim(),unit:u.value.trim(),date:d.value||o.date||""});if(image){delete o.image;o.imageId=image;o.thumbId=th;o.imgKB=kb}}
      else{const rec={date:d.value,name:n.value.trim(),value:v.value.trim(),unit:u.value.trim(),once:true};if(image){rec.imageId=image;rec.thumbId=th;rec.imgKB=kb}e.labs.push(rec)}
      e.edited=now();mini=null;render()},o?"Save changes":"Save",
      o?delBtn(e,"Delete",()=>{if(isImg)e.imaging=e.imaging.filter(x=>x!==o);else e.labs=e.labs.filter(x=>x!==o)}):null))}
const hdKindLabel=k=>!k||k==="Regular"?"":/^\d/.test(k)?k+" HD session":k==="On demand"?"On demand HD":k;
const HD_KINDS=[["1st","1st"],["2nd","2nd"],["3rd","3rd"],["On demand","On demand"],["Regular","Regular"]];
const hdDone=h=>!!h&&h.status!=="ordered"&&h.status!=="cancelled";
const hdCancelled=h=>!!h&&h.status==="cancelled";
const hdOrderTxt=h=>[hdKindLabel(h.kind)||(h.kind==="Regular"?"Regular":""),h.ordH&&h.ordH+" h",h.ordUF&&"UF "+h.ordUF+" L",h.access].filter(Boolean).join(" · ");
function hdForm(e,h,withDate=true,mode="full"){const last=(e?.hd||[]).slice(-1)[0]||{};const src=h||{ordH:last.ordH,ordUF:last.ordUF,access:last.access};const d=dateIn(h?(h.date||""):undefined);
  const kind=seg("hk"+nid(),HD_KINDS,h?.kind||(e?.type==="hd"?"Regular":""));
  const f={ordH:inp(src.ordH||"",{inputmode:"decimal",placeholder:"4"}),ordUF:inp(src.ordUF||"",{inputmode:"decimal",placeholder:"2.5"}),hours:inp(h?.hours||"",{inputmode:"decimal"}),uf:inp(h?.uf||"",{inputmode:"decimal"}),
    access:sel(["",...ACCESS],src.access||""),pre:bpInput(h?.pre),post:bpInput(h?.post),hr:inp(h?.hr||"",{inputmode:"numeric"}),
    wpre:inp(h?.wpre||"",{inputmode:"decimal",placeholder:"kg"}),wpost:inp(h?.wpost||"",{inputmode:"decimal",placeholder:"kg"}),dry:inp(h?.dry||last.dry||"",{inputmode:"decimal",placeholder:"kg"}),
    volume:area(h?.volume||"",{placeholder:"Oedema, chest, JVP, O2 — e.g. mild LL oedema, basal creps"}),notes:area(h?.notes||"",{placeholder:"Hypotension, cramps, access problem, stopped early…"})};
  const done=el("div",{class:"sec",style:"gap:10px"},el("h3",{},"Done"),el("div",{class:"fgrid"},fld("Actual duration (h)",f.hours),fld("Actual UF (L)",f.uf)),
    el("h3",{},"Vitals"),el("div",{class:"fgrid"},fld("BP pre",f.pre),fld("BP post",f.post),fld("HR",f.hr),fld("Weight pre",f.wpre),fld("Weight post",f.wpost),fld("Dry weight",f.dry)),
    fld("Volume assessment",f.volume),fld("What happened in the session",f.notes));
  let more=null;if(mode==="order"){done.hidden=true;more=el("button",{type:"button",class:"link small",style:"align-self:flex-start",onclick:()=>{done.hidden=false;more.hidden=true}},"+ More details")}
  const box=el("div",{class:"sec",style:"gap:10px"},withDate?fld("Date",d):null,el("div",{class:"field"},el("label",{},"Session"),kind),
    el("h3",{},"Order"),el("div",{class:"fgrid"},fld("Duration (h)",f.ordH),fld("UF target (L)",f.ordUF),fld("Access",f.access)),more,done);
  box.read=(day,complete)=>{const x={date:day||d.value||(h?h.date:today())};for(const k in f)x[k]=String(f[k].value||"").trim();x.kind=kind.get()||"";
    const actual=["hours","uf","pre","post","hr","wpre","wpost","volume","notes"].some(k=>x[k]);
    x.status=complete||actual?"done":"ordered";if(x.status==="done"){if(!x.hours)x.hours=x.ordH;if(!x.uf)x.uf=x.ordUF}
    const any=x.kind||Object.entries(x).some(([k,v])=>!["date","kind","status"].includes(k)&&v);return any?x:null};
  return box}
function pushHd(e,x){e.hd=e.hd||[];e.hd.push(x);const it=(e.plan||[]).find(y=>/hd session/i.test(y.text)&&y.state==="todo");if(it)it.state="doing";
  e.events.push({when:x.date,text:x.status==="ordered"?"HD ordered: "+(hdOrderTxt(x)||"session"):(hdKindLabel(x.kind)||"HD")+(x.notes?": "+x.notes:" done")})}
function hdOptional(e){const wrap=el("div",{class:"sec",style:"gap:8px"});let form=null;
  const btn=el("button",{type:"button",class:"small",style:"align-self:flex-start",onclick:()=>{form=hdForm(e,null,false,"order");btn.hidden=true;
    wrap.append(el("div",{class:"hdopt"},el("div",{class:"rhead"},el("span",{},"Haemodialysis"),el("button",{type:"button",class:"link small",onclick:ev=>{form=null;ev.target.closest(".hdopt").remove();btn.hidden=false}},"✕ Remove")),form))}},"+ Add haemodialysis");
  wrap.append(btn);wrap.read=day=>form?form.read(day):null;return wrap}
function hdBox(e,h,mode){mode=mode||(h&&!hdDone(h)?"complete":h?"full":"order");const form=hdForm(e,h,true,mode==="order"?"order":"full");
  return el("div",{class:"minibox"},mode==="complete"?el("h3",{},"Complete the session"):mode==="order"?el("h3",{},"Order HD session"):null,whoLine(h?[h]:[]),form,
    actions(()=>{const x=form.read(undefined,mode==="complete")||{date:today(),status:"ordered"};
      if(h){const was=hdDone(h);Object.assign(h,x);if(!was&&hdDone(h))e.events.push({when:h.date,text:(hdKindLabel(h.kind)||"HD")+(h.notes?": "+h.notes:" done")})}else pushHd(e,x);
      e.edited=now();mini=null;render()},mode==="complete"?"Save — session done":h?"Save changes":"Save",h?delBtn(e,"Delete session",()=>{e.hd=e.hd.filter(y=>y!==h)}):null))}
function eventBox(e,x){const d=dateIn(x?(x.when||""):undefined),t=area(x?x.text:"",{placeholder:"What happened"});
  return el("div",{class:"minibox"},fld("Date",d,{hint:x&&x.when&&!ISO.test(x.when)?"Recorded as “"+x.when+"”":""}),whoLine(x?[x]:[]),fld("Event",t),actions(()=>{const v=t.value.trim();if(!v)return;
    if(x)Object.assign(x,{text:v,when:d.value||x.when});else e.events.push({when:d.value,text:v});e.edited=now();mini=null;render()},x?"Save changes":"Save event",
    x?delBtn(e,"Delete event",()=>{e.events=e.events.filter(y=>y!==x)}):null))}
function shrinkTo(file,m,q){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{
  const s=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q))};img.src=r.result};r.readAsDataURL(file)})}
function shrink(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{
  const m=1400,s=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",0.72))};img.src=r.result};r.readAsDataURL(file)})}
const imgOf=(o,alt)=>o.image?el("img",{src:o.image,alt}):el("img",{"data-img":o.thumbId||o.imageId,alt,loading:"lazy"});
function openViewer(title,date,src,onDelete,imgId){const v=el("div",{class:"viewer",role:"dialog","aria-label":title||"Image"});const close=()=>v.remove();
  const del=twoTap(el("button",{class:"small danger"},"Delete image"),"Tap again to delete",()=>{onDelete();close();render()});
  v.append(src?el("img",{src,alt:title||"Image"}):el("img",{"data-img":imgId,alt:title||"Image"}),el("p",{},(title||"Image")+" · "+fmtDate(date)),el("div",{class:"row"},el("button",{class:"small",onclick:close},"Close"),del));
  v.onclick=ev=>{if(ev.target===v)close()};document.addEventListener("keydown",function k(ev){if(ev.key==="Escape"){close();document.removeEventListener("keydown",k)}});document.body.append(v);hydrateImgs(v)}
function closeBox(e){const C=e.type==="consult";const d=dateIn(),n=inp("",{placeholder:"Note (optional) — e.g. stable, follow up in HD unit / transferred to Cardiology"});
  const opts=C?[["signedoff","Signed off"],["died","Died"]]:[["discharged","Discharged"],["died","Died"],["offservice","No longer under nephrology"]];
  const o=seg("out"+e.key,opts,opts[0][0]);
  return el("div",{class:"minibox"},el("h3",{},"Close admission"),o,el("div",{class:"fgrid"},fld("Date",d),fld("Note",n)),
    actions(()=>{const oc=o.get();e.status="closed";e.outcome=oc;e.closeDate=d.value;e.closeNote=n.value.trim();e.events.push({when:d.value,text:OUTCOMES[oc]+(e.closeNote?": "+e.closeNote:"")});e.edited=now();mini=oc==="discharged"?{kind:"dsum",key:e.key,focus:true}:null;render()},"Confirm"))}
function navSeq(){if(back==="cons"){const g=consGroups().groups.find(x=>x[0]===consView);return g?(g[0]===HDG?bySched(g[1]):byLoc(g[1])).flatMap(x=>x[1]):[]}
  if(back==="hdtoday")return hdTodayList().map(x=>x.p);
  if(back==="home")return consGroups().groups.flatMap(([c,ps])=>(c===HDG?bySched(ps):byLoc(ps)).flatMap(x=>x[1]));return[]}
function navPN(p){const s=navSeq();const i=s.indexOf(p);if(i<0||s.length<2)return null;const go=q=>{current=q.id;mini=null;editing=null;render();scrollTo(0,0)};
  return el("div",{class:"navpn"},el("button",{class:"small",disabled:i===0,"aria-label":"Previous patient",onclick:()=>go(s[i-1])},"‹ Prev"),el("span",{class:"hat"},(i+1)+"/"+s.length),
    el("button",{class:"small",disabled:i===s.length-1,"aria-label":"Next patient",onclick:()=>go(s[i+1])},"Next ›"))}
function uncBox(p){return el("div",{class:"warnbox"},el("b",{},"⚠ Not confirmed from the old records ("+p.unclear.length+")"),
  ...p.unclear.map((u,i)=>el("div",{class:"lrow"},el("span",{dir:"auto"},[u.where,u.item,u.date&&fmtDate(u.date)].filter(Boolean).join(" · ")+(u.read?" — read as “"+u.read+"”":"")+(u.note?" — "+u.note:"")),
    el("button",{type:"button",class:"small",onclick:()=>{p.unclear.splice(i,1);p.edited=now();render()}},"✓ Correct"))),
  el("small",{class:"sub",style:"display:block"},"Fix it from Edit patient or the admission, then tap ✓ Correct."))}
function readmitBox(p){const d=dateIn(),loc=inp("",{list:"dl-locations",placeholder:"Type or pick"}),dept=inp("",{list:"dl-departments"}),why=inp("",{placeholder:"Reason / consult question"}),err=el("p",{class:"err"});
  const type=seg("rtype",TYPE_OPTS,"nephro");const dw=fld("Department",dept,{req:true});dw.hidden=true;type.onchange=()=>dw.hidden=type.get()==="nephro";
  return el("div",{class:"minibox"},el("h3",{},"New admission"),p.unclear?.length?uncBox(p):null,type,el("small",{class:"sub"},"For HD-only, set the schedule from Edit after starting."),el("div",{class:"fgrid"},fld("Date",d),fld("Location",loc),dw),fld("Reason",why),err,
    actions(()=>{const t=type.get();if(t!=="nephro"&&!dept.value.trim()){err.textContent="Add the department.";return}
      const ac=autoCons(t,loc.value,dept.value);if(ac)p.consultant=ac;
      p.encounters.push({key:uidf("e"),type:t,department:t==="nephro"?"":dept.value.trim(),location:loc.value.trim(),date:d.value,status:"active",complaint:why.value.trim(),hpi:"",diagnosis:"",
        vitalsLog:[],labs:[],imaging:[],plan:[],hd:[],images:[],events:[{when:d.value,text:(t==="consult"?"Consult received":"Re-admitted")+(why.value.trim()?": "+why.value.trim():"")}],meds:[],notes:"",edited:now()});
      mini=null;flash=true;render()},"Start"))}

function undatedBox(e,it){const du=dateIn(it.due||""),rd=dateIn(it.resultDue||""),res=area("",{placeholder:"Result"}),rdt=dateIn();
  return el("div",{class:"minibox",style:"flex-basis:100%"},el("h3",{},it.text),
    el("b",{class:"subh"},"Set a date"),el("div",{class:"fgrid"},it.state==="todo"?fld("Scheduled on",du):null,fld("Result expected",rd)),
    el("div",{class:"row"},el("button",{class:"small primary",onclick:()=>{if(it.state==="todo")it.due=du.value;it.resultDue=rd.value;if(it.state==="todo"&&it.due&&it.resultDue&&it.resultDue<it.due)it.resultDue="";e.edited=now();mini=null;render()}},"Save date")),
    el("b",{class:"subh"},"Result is out"),el("div",{class:"fgrid"},fld("Result",res),fld("Date",rdt)),
    el("div",{class:"row"},el("button",{class:"small primary",onclick:()=>{if(!res.value.trim()){res.focus();return}it.result=res.value.trim();it.state="done";it.doneDate=rdt.value;e.events.push({when:rdt.value,text:it.text+": "+it.result});e.edited=now();mini=null;render()}},"Save result & mark done"),
      el("button",{class:"small",onclick:()=>{mini=null;render()}},"Cancel")),
    it.state==="todo"?el("button",{class:"link small",style:"align-self:flex-start",onclick:()=>{it.state="doing";e.edited=now();mini=null;render()}},"Mark as in progress"):null)}
function resultBox(e,it){const v=area(it.result||"",{placeholder:"Result / outcome"}),d=dateIn(),err=el("p",{class:"err",role:"alert"});
  const q=t=>el("button",{type:"button",class:"chip",onclick:()=>{v.value=t;err.textContent=""}},t);
  return el("div",{class:"minibox",style:"flex-basis:100%"},el("h3",{},it.text),whoLine([it]),fld("Result",v),el("div",{class:"chips"},q("Result in file"),q("Not needed")),fld("Date",d),err,
    actions(()=>{if(!v.value.trim()){err.textContent="Write the result, or choose “Result in file” or “Not needed”.";v.focus();return}it.result=v.value.trim();it.state="done";it.doneDate=d.value;if(it.result)e.events.push({when:d.value,text:it.text+": "+it.result});e.edited=now();mini=null;render()},"Save & mark done"))}
function planEditBox(e,it){const t=inp(it.text),stt=sel(STATES,it.state);
  return el("div",{class:"minibox",style:"flex-basis:100%"},whoLine([it]),el("div",{class:"fgrid"},fld("Item",t),fld("Status",stt)),
    actions(()=>{if(!t.value.trim())return;it.text=t.value.trim();if(stt.value==="done"&&it.state!=="done"&&!it.result){e.edited=now();mini={kind:"result",key:e.key,idx:e.plan.indexOf(it),focus:true};render();return}
      if(stt.value!==it.state){it.state=stt.value;if(it.state!=="done"){it.doneDate=""}}e.edited=now();mini=null;render()},"Save",
      el("button",{class:"small danger",onclick:()=>{it.state="cancelled";e.events.push({when:today(),text:"Plan item cancelled: "+it.text});e.edited=now();mini=null;render()}},"Cancel item")))}
function postponeBox(e,it){const du=dateIn(it.due||""),rd=dateIn(it.resultDue||"");
  const clr=i=>el("button",{type:"button",class:"link small",onclick:()=>{i.value=""}},"✕ Clear");const wrapD=(lab,i)=>el("div",{class:"field"},el("label",{},lab),el("div",{class:"row",style:"flex-wrap:nowrap"},i,clr(i)));const old=[it.due,it.resultDue].join("|");
  return el("div",{class:"minibox",style:"flex-basis:100%"},el("h3",{},it.text),el("div",{class:"fgrid"},it.state==="todo"?wrapD("Scheduled on",du):null,wrapD("Result expected",rd)),
    actions(()=>{if(it.state==="todo")it.due=du.value;it.resultDue=rd.value;if(it.state==="todo"&&it.due&&it.resultDue&&it.resultDue<it.due)it.resultDue="";
      if(old!==[it.due,it.resultDue].join("|"))e.events.push({when:today(),text:it.text+": "+[it.state==="todo"&&it.due?"scheduled "+fmtDate(it.due):"",it.resultDue?"result "+fmtDate(it.resultDue):""].filter(Boolean).join(", ")||it.text+": dates cleared"});
      e.edited=now();mini=null;render()},"Save date"))}
function updateBox(e){const d=dateIn(),ev=area("",{placeholder:"What happened today (optional)"}),vg=vitalsBlock(),xg=examBlock(),lg=labsBlock(),hdo=hdOptional(e);
  const due=(e.plan||[]).filter(isDue);
  return el("div",{class:"minibox"},el("h3",{},"Today's update"),fld("Date",d),
    due.length?el("p",{class:"sub"},"Due today: "+due.map(x=>x.text).join(", ")+" — record results in the checklist."):null,
    fld("Events",ev),el("h3",{},"Vitals"),vg,el("h3",{},"Examination"),xg,el("h3",{},"Labs"),lg,hdo,
    actions(()=>{const day=d.value;if(ev.value.trim())e.events.push({when:day,text:ev.value.trim()});const hx=hdo.read(day);if(hx)pushHd(e,hx);
      saveLog(e,vg.read(day),xg.read(day));
      for(const l of lg.read(day)){const i=e.labs.findIndex(x=>x.date===l.date&&lkey(x.name)===lkey(l.name));i>=0?e.labs[i]=l:e.labs.push(l)}
      e.edited=now();mini=null;render()},"Save update"))}
const fl=l=>{const f=flagOf(l);return f==="H"?" ↑":f==="L"?" ↓":""};
function dayKeys(e){const ks=[];const add=k=>{k=k||"";if(!ks.includes(k))ks.push(k)};
  for(const v of e.vitalsLog||[])add(v.date);for(const l of e.labs||[])add(l.date);for(const m of e.imaging||[])if(m.date)add(m.date);
  for(const h of e.hd||[])add(h.date);for(const x of e.events||[])add(x.when);
  const iso=ks.filter(k=>ISO.test(k)).sort(),other=ks.filter(k=>!ISO.test(k));return[...other,...iso]}
function dayBlock(e,k,undated){const L=[];const v=(e.vitalsLog||[]).find(x=>(x.date||"")===k);
  if(v){const vv=VCOLS.filter(([c])=>v[c]).map(([c,u])=>c+" "+v[c]+(u?" "+u:""));if(vv.length)L.push("Vitals: "+vv.join(" · "));
    const ex=ECOLS.filter(([c])=>v[c]);if(ex.length){L.push("Examination:");for(const[c,u]of ex)L.push("• "+c+": "+v[c]+(u?" "+u:""))}}
  const labs=(e.labs||[]).filter(l=>(l.date||"")===k);const daily=labs.filter(l=>e.type==="hd"||!isOnce(l)),once=labs.filter(l=>e.type!=="hd"&&isOnce(l));
  if(daily.length){L.push("Labs:");for(const l of daily)L.push("• "+l.name+": "+l.value+fl(l))}
  const img=(e.imaging||[]).filter(m=>undated?!m.date||m.date===k:m.date===k);
  if(once.length||img.length){L.push("Investigations:");for(const l of once)L.push("• "+l.name+": "+(l.value||"pending")+(l.unit?" "+l.unit:"")+fl(l));for(const m of img)L.push("• "+m.test+": "+m.result)}
  for(const h of (e.hd||[]).filter(h=>(h.date||"")===k))L.push((hdKindLabel(h.kind)||"HD session")+":",...[h.ordH&&"• Order: "+h.ordH+" h, UF "+(h.ordUF||"?")+" L",(h.hours||h.uf)&&"• Done: "+[h.hours&&h.hours+" h",h.uf&&"UF "+h.uf+" L"].filter(Boolean).join(", "),h.access&&"• Access: "+h.access,
    (h.pre||h.post)&&"• BP: "+[h.pre,h.post].filter(Boolean).join(" → "),h.hr&&"• HR: "+h.hr,(h.wpre||h.wpost)&&"• Weight: "+[h.wpre,h.wpost].filter(Boolean).join(" → ")+" kg",h.volume&&"• Volume: "+h.volume,h.notes&&"• Notes: "+h.notes].filter(Boolean));
  const ev=(e.events||[]).filter(x=>(x.when||"")===k);if(ev.length){L.push("Events:");for(const x of ev)L.push("• "+x.text)}
  return L}
function headerLines(p,e){const L=[];const sx=p.sex==="M"?"male":p.sex==="F"?"female":"";
  L.push([p.name,[p.age&&p.age+" y",sx].filter(Boolean).join(" ")].filter(Boolean).join(" — "));
  L.push(["Code: "+p.code,p.nid&&"National ID: "+p.nid,p.phone&&"Phone: "+p.phone].filter(Boolean).join(" · "));
  if(p.consultant)L.push("Consultant: "+p.consultant);
  if(e){L.push(typeLabel(e)+(e.location?" — "+e.location:"")+" — since "+fmtDate(e.date)+(e.status!=="active"?" ("+OUTCOMES[outcomeOf(e)]+" "+closeTxt(e)+(e.closeNote?": "+e.closeNote:"")+")":""));
    if(e.type==="hd")L.push("HD schedule: "+(schedLabel(e)||"not set"));if(e.diagnosis)L.push("Diagnosis: "+e.diagnosis)}
  return L}
function summaryText(p,e,mode="full"){
  const L=headerLines(p,e);
  if(mode==="today"){const k=today();L.push("","━━ TODAY — "+fmtDate(k)+" ━━");const b=e?dayBlock(e,k,false):[];
    const done=(e?.plan||[]).filter(it=>it.state==="done"&&it.doneDate===k);
    if(done.length){b.push("Done today:");for(const it of done)b.push("• "+it.text+(it.result?": "+it.result:""))}
    const pend=(e?.plan||[]).filter(isDue);if(pend.length){b.push("Still due:");for(const it of pend)b.push("• "+it.text)}
    L.push(...(b.length?b:["Nothing recorded today yet."]));return L.join("\n")}
  const per=[p.occupation&&"Occupation: "+p.occupation,p.residence&&"Residence: "+p.residence,p.marital&&"Marital status: "+p.marital,p.habits&&"Special habits: "+p.habits].filter(Boolean);
  L.push("","━━ HISTORY ━━");
  if(per.length)L.push("Personal:",...per.map(x=>"• "+x));
  if(e&&(e.complaint||e.hpi)){L.push("Present:");if(e.complaint)L.push("• Complaint: "+e.complaint);if(e.hpi)L.push("• "+e.hpi)}
  if(p.pastMedical.length){L.push("Past medical:");for(const x of p.pastMedical)L.push("• "+x)}
  if(p.pastSurgical.length){L.push("Past surgical / procedures:");for(const x of p.pastSurgical)L.push("• "+x)}
  if(p.drugHistory.length){L.push("Drug history:");for(const x of p.drugHistory)L.push("• "+x)}
  if(p.allergies)L.push("Allergies: "+p.allergies);
  if(!e)return L.join("\n");
  const keys=dayKeys(e);let first=true;
  for(const k of keys){const b=dayBlock(e,k,first);first=false;if(!b.length)continue;L.push("","━━ "+(ISO.test(k)?fmtDate(k):(k||"Undated"))+" ━━",...b)}
  const undatedImg=(e.imaging||[]).filter(m=>!m.date);if(!keys.length&&undatedImg.length){L.push("","Investigations:");for(const m of undatedImg)L.push("• "+m.test+": "+m.result)}
  const curM=(e.meds||[]).filter(m=>!m.stop&&!m.once),oldM=(e.meds||[]).filter(m=>m.stop&&!m.once),onceM=(e.meds||[]).filter(m=>m.once);
  if(curM.length){L.push("","━━ CURRENT MEDICATIONS ━━");for(const m of curM)L.push("• "+[m.name,m.dose,m.freq].filter(Boolean).join(" "))}
  if(onceM.length){L.push("","━━ GIVEN ONCE ━━");for(const m of onceM)L.push("• "+[m.name,m.dose].filter(Boolean).join(" ")+(m.start?" ("+fmtDate(m.start)+")":""))}
  if(oldM.length){L.push("","Stopped / changed this admission:");for(const m of oldM)L.push("• "+[m.name,m.dose,m.freq].filter(Boolean).join(" ")+" — "+fmtDate(m.stop)+(m.note?" ("+m.note+")":""))}
  if(e.plan?.length){L.push("","━━ "+(e.type==="consult"?"RECOMMENDATIONS":"PLAN")+" ━━");for(const it of e.plan.filter(x=>x.state!=="cancelled"))L.push((it.state==="done"?"✔ ":it.state==="doing"?"◐ ":"☐ ")+it.text+(it.result?" — "+it.result:"")+(it.state!=="done"&&it.due?" (due "+fmtDate(it.due)+")":""))}
  if(e.notes){}
  return L.join("\n");
}
function extractBox(p){
  const encs=[...p.encounters].reverse();const pick=sel(encs.map((e,i)=>[String(i),typeLabel(e)+" · "+fmtDate(e.date)]),"0");
  const mode=seg("xmode"+p.id,[["today","Today only"],["full","Full — day by day"],["dsum","Discharge summary"]],"today");
  const nameOn=el("input",{type:"checkbox",checked:true,id:nid(),style:"width:auto"});
  const ta=area("",{class:"mono",style:"min-height:300px",readonly:true,dir:"auto"});const st=el("span",{class:"sub","aria-live":"polite"});
  const fill=()=>{const q=nameOn.checked?p:{...p,name:p.code||"Patient",nid:"",phone:""};ta.value=mode.get()==="dsum"?dischargeText(q,encs[+pick.value]):summaryText(q,encs[+pick.value],mode.get())};pick.onchange=fill;nameOn.onchange=fill;mode.onchange=fill;fill();
  const copy=el("button",{class:"primary small",onclick:()=>{const done=()=>st.textContent="Copied — paste it in WhatsApp or anywhere.";
    try{navigator.clipboard.writeText(ta.value).then(done,()=>{ta.focus();ta.select();st.textContent="Text selected — press copy on your keyboard."})}catch{ta.focus();ta.select();st.textContent="Text selected — press copy on your keyboard."}}},"Copy");
  return el("div",{class:"minibox"},el("h3",{},"Extract patient data"),mode,el("div",{class:"row"},encs.length>1?fld("Admission",pick):null,el("label",{for:nameOn.id,class:"row",style:"gap:6px"},nameOn,"Include name, ID and phone")),
    ta,el("div",{class:"row"},copy,el("button",{class:"small",onclick:()=>{mini=null;render()}},"Close"),st));
}
function censusBox(){
  const act=patients.map(p=>({p,e:latest(p)})).filter(x=>x.e?.status==="active");
  const where=x=>x.e.location||"Location not set";
  const groups={};for(const x of act)(groups[where(x)]=groups[where(x)]||[]).push(x);
  const keys=Object.keys(groups).sort();
  const text=["Current nephrology patients — "+fmtDate(today())+" ("+act.length+")",
    ...keys.flatMap(k=>["",k.toUpperCase(),...groups[k].map((x,i)=>(i+1)+". "+x.p.name+" — "+typeLabel(x.e)+" — Consultant: "+(x.p.consultant||"not set"))])].join("\n");
  const tb=el("tbody");for(const k of keys)for(const x of groups[k])tb.append(el("tr",{},
    el("td",{},el("button",{class:"link",onclick:()=>{current=x.p.id;view="file";census=false;render();scrollTo(0,0)}},x.p.name)),el("td",{},k),el("td",{},pill(x.e)),el("td",{},x.p.consultant||"—")));
  const st=el("span",{class:"sub","aria-live":"polite"});const ta=area(text,{class:"mono",readonly:true,style:"min-height:140px"});ta.hidden=true;
  const copy=el("button",{class:"primary small",onclick:()=>{const fb=()=>{ta.hidden=false;ta.focus();ta.select();st.textContent="Text selected — press copy."};
    try{navigator.clipboard.writeText(text).then(()=>st.textContent="Copied — paste it in the group.",fb)}catch{fb()}}},"Copy as message");
  return el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Current patients ("+act.length+")"),el("span",{class:"sub"},fmtDate(today()))),
    act.length?el("div",{class:"tablebox"},el("table",{},el("thead",{},el("tr",{},...["PATIENT","LOCATION","UNDER","CONSULTANT"].map(h=>el("th",{},h)))),tb)):el("p",{class:"empty"},"No patients currently admitted."),
    el("div",{class:"row"},copy,st),ta);
}
/* ---------- full editors ---------- */
function editorShell(title,body,onSave,extra){return el("div",{class:"minibox",style:"gap:14px"},el("h2",{},title),body,
  el("div",{class:"row"},el("button",{class:"primary",onclick:onSave},"Save changes"),el("button",{onclick:()=>{editing=null;render()}},"Cancel"),extra||null))}
function delPatientBlock(p){const w=el("div",{class:"sec delzone"});
  const b=el("button",{type:"button",class:"danger",onclick:()=>{w.replaceChildren(el("div",{class:"confirmbox",role:"alertdialog"},el("b",{dir:"auto"},"Delete "+p.name+"?"),
    el("span",{},"All admissions, labs and notes go with it. It moves to Recently deleted and is removed for good after 30 days."),
    el("div",{class:"row"},el("button",{type:"button",class:"danger",onclick:()=>deletePatient(p)},"Yes, delete"),el("button",{type:"button",class:"small",onclick:()=>w.replaceChildren(b)},"Cancel"))))}},"Delete patient");
  w.append(b);return w}
function patientEditor(p){
  const F={name:inp(p.name,{dir:"auto"}),nid:inp(p.nid,{class:"mono"}),phone:inp(p.phone,{class:"mono"}),age:inp(p.age),sex:sel([["","—"],["M","Male"],["F","Female"]],p.sex),consultant:inp(p.consultant,{list:"dl-consultants"}),
    occupation:inp(p.occupation),residence:inp(p.residence),marital:sel(["","Single","Married","Divorced","Widowed"],p.marital||""),habits:inp(p.habits),
    pastMedical:listEditor(p.pastMedical,"e.g. Hypertension on Concor 5",v=>drugsFrom(v).forEach(d=>F.drugs.addItem(d))),pastSurgical:listEditor(p.pastSurgical,"e.g. CABG (2013)"),drugs:listEditor(p.drugHistory,"e.g. Concor 5 mg"),allergies:inp(p.allergies)};
  const err=el("p",{class:"err"});
  return editorShell("Edit patient",el("div",{class:"sec"},
    el("div",{class:"fgrid"},fld("Name",F.name,{req:true}),fld("National ID",F.nid),fld("Phone",F.phone),fld("Age",F.age),fld("Sex",F.sex),fld("Consultant",F.consultant),
      fld("Occupation",F.occupation),fld("Residence",F.residence),fld("Marital status",F.marital),fld("Special habits",F.habits)),
    el("div",{class:"grid2"},fld("Past medical — chronic conditions",F.pastMedical,{hint:"Type one, press Add. Write “on …” and the drug goes to Drug history."}),fld("Surgical / procedures",F.pastSurgical,{hint:"Put the year in brackets, e.g. CABG (2013)"})),
    el("div",{class:"grid2"},fld("Drug history — before admission",F.drugs),fld("Allergies",F.allergies)),err,isAdmin()?delPatientBlock(p):null),
  ()=>{if(!F.name.value.trim()){err.textContent="Name is required.";return}
    Object.assign(p,{name:F.name.value.trim(),nid:F.nid.value.trim(),phone:F.phone.value.trim(),age:F.age.value.trim(),sex:F.sex.value,consultant:F.consultant.value.trim(),
      occupation:F.occupation.value.trim(),residence:F.residence.value.trim(),marital:F.marital.value,habits:F.habits.value.trim(),
      pastMedical:F.pastMedical.get(),pastSurgical:F.pastSurgical.get(),drugHistory:F.drugs.get(),allergies:F.allergies.value.trim(),edited:now()});
    editing=null;render()});
}
const MEDC=["name","dose","freq","start","stop","note"];
const HDC=["date","ordH","ordUF","hours","uf","access","pre","post","hr","wpre","wpost","volume","notes"];
function encEditor(p,e){
  const F={date:dateIn(e.date||""),location:inp(e.location,{list:"dl-locations"}),dept:inp(e.department,{list:"dl-departments"}),
    complaint:inp(e.complaint),diagnosis:inp(e.diagnosis),hpi:area(e.hpi),notes:area(e.notes)};
  const type=seg("etype"+e.key,TYPE_OPTS,e.type);const sched=seg("esched"+e.key,[["smw","Sat / Mon / Wed"],["stt","Sun / Tue / Thu"],["other","Other"]],e.hdSched||"smw");const so=inp(e.hdSchedOther||"",{placeholder:"Other schedule"});
  const schedWrap=el("div",{class:"sec"},el("h3",{},"HD schedule"),sched,so);const deptWrap=fld("Department",F.dept,{hint:"For co-admissions, consults and HD-only"});
  const sync=()=>{const t=type.get();schedWrap.hidden=t!=="hd";deptWrap.hidden=t==="nephro";so.hidden=sched.get()!=="other"};type.onchange=sync;sched.onchange=sync;sync();
  const del=isAdmin()?twoTap(el("button",{class:"danger",style:"margin-left:auto"},"Delete admission"),"Sure? Tap again",()=>{p.encounters=p.encounters.filter(x=>x!==e);editing=null;render()}):null;
  return editorShell("Edit admission details",el("div",{class:"sec"},type,schedWrap,
    el("div",{class:"fgrid"},fld("Admission date",F.date,{hint:e.date&&!ISO.test(e.date)?"Recorded as “"+e.date+"”":""}),fld("Location",F.location),deptWrap),
    el("div",{class:"fgrid"},fld("Chief complaint / reason",F.complaint),fld("Diagnosis",F.diagnosis)),
    fld("History of present illness",F.hpi),
    el("small",{class:"sub"},"Vitals, labs, tests, HD sessions, events, medications and plan items are edited where they appear — tap the date, the row or “Edit”.")),
  ()=>{const t=type.get();Object.assign(e,{type:t,date:F.date.value||e.date,location:F.location.value.trim(),department:t==="nephro"?"":F.dept.value.trim(),
      complaint:F.complaint.value.trim(),diagnosis:F.diagnosis.value.trim(),hpi:F.hpi.value.trim(),
      hdSched:t==="hd"?sched.get():e.hdSched,hdSchedOther:so.value.trim(),edited:now()});
    editing=null;render()},del);
}

const APP_VERSION="v36";
function copyOrShow(text,okMsg){const show=()=>{const ta=area(text,{class:"mono",readonly:true,style:"min-height:50vh;width:100%",dir:"auto"});
    const v=el("div",{class:"viewer",role:"dialog","aria-label":"Copy text"},el("p",{},"Select all and copy:"),ta,el("div",{class:"row"},el("button",{class:"small",onclick:()=>v.remove()},"Close")));
    document.body.append(v);ta.focus();ta.select()};
  try{navigator.clipboard.writeText(text).then(()=>toast(okMsg),show)}catch{show()}}
function toast(m){document.querySelectorAll(".toast").forEach(x=>x.remove());const t=el("div",{class:"toast",role:"status"},m);document.body.append(t);setTimeout(()=>t.remove(),3200)}
/* theme: Light / Dark / Auto, remembered on this phone */
function getTheme(){try{return localStorage.getItem("nwl-theme")||"auto"}catch{return"auto"}}
function applyTheme(t){const r=document.documentElement;if(t==="light"||t==="dark")r.setAttribute("data-theme",t);else r.removeAttribute("data-theme")}
function setTheme(t){try{localStorage.setItem("nwl-theme",t)}catch{}applyTheme(t)}
applyTheme(getTheme());
/* saved / saving / offline */
let syncState="saved",lastSaved=null,offlineEdits=0;
window.setSyncState=st=>{syncState=st;if(st==="saved"){lastSaved=cairo();offlineEdits=0}drawSync()};
function drawSync(){const b=$("#syncpill");if(!b)return;const off=syncState==="offline";
  b.className="syncpill "+syncState;b.querySelector(".slab").textContent=syncState==="saved"?"✓ Saved":syncState==="saving"?"Saving…":"Offline"+(offlineEdits?" · "+offlineEdits:"");
  b.title=syncState==="saved"?"Everything is saved":syncState==="saving"?"Saving your changes…":"No internet — changes are kept on this phone and sent when it's back"}
/* install */
let installEvt=null;window.addEventListener("beforeinstallprompt",ev=>{ev.preventDefault();installEvt=ev});
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function menuItems(close){const go=f=>()=>{close();f()};const B=(label,f,cls)=>el("button",{type:"button",class:cls||null,onclick:go(f)},label);
  const ctx=[];const p=view==="file"?cur():null;
  if(p){const e=latest(p);ctx.push(el("div",{class:"mhead",dir:"auto"},p.name),
      B("Extract patient data",()=>{editing=null;mini={kind:"extract",focus:true};render()}),
      e&&e.status==="closed"&&e.outcome==="discharged"?B("Discharge summary",()=>{editing=null;mini={kind:"dsum",key:e.key,focus:true};render()}):null,
      B("Edit patient",()=>{editing="patient";mini=null;render();scrollTo(0,0)}),
      isAdmin()?B("Edit history",()=>{histQ=p.name;adminTab="history";view="admin";render();scrollTo(0,0)}):null)}
  else if(view==="home")ctx.push(B("Copy in-ward list",()=>{if(wardCopy)wardCopy()}));
  const th=getTheme();const tb=(v,l)=>el("button",{type:"button","aria-pressed":String(th===v),onclick:ev=>{ev.stopPropagation();setTheme(v);$("#menu-app").replaceChildren(...menuItems(close).app)}},l);
  const app=[el("div",{class:"theme"},el("span",{},"Dark mode"),el("div",{class:"tbtns"},tb("light","Light"),tb("dark","Dark"),tb("auto","Auto"))),
    B("Copy AI prompt",()=>copyOrShow(AI_PROMPT,"Prompt copied — paste it once in a new AI chat.")),
    B("How to use",()=>{view="help";mini=null;editing=null;render();scrollTo(0,0)}),
    isAdmin()?B("Admin",()=>{view="admin";mini=null;editing=null;render();scrollTo(0,0)}):null,
    B("Critical values",()=>{critDraft=null;view="crit";mini=null;editing=null;render();scrollTo(0,0)}),
    el("button",{type:"button",onclick:go(checkUpdate)},"Check for update",el("span",{class:"ver"},APP_VERSION)),
    (installEvt||(isIOS()&&!standalone()))&&!standalone()&&window.PWA?B("Install app",installApp):null].filter(Boolean);
  return{ctx:ctx.filter(Boolean),app}}
function checkUpdate(){toast("Checking for a new version…");const done=()=>location.reload();
  try{navigator.serviceWorker?.getRegistration().then(r=>r?r.update():null).catch(()=>{}).finally(()=>setTimeout(done,600))}catch{done()}if(!navigator.serviceWorker)setTimeout(done,600)}
function installApp(){if(installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null})}
  else toast("On iPhone: tap the Share button in Safari, then “Add to Home Screen”.")}
function setupMenu(){const b=$("#menubtn"),m=$("#menu");drawSync();if(!b||!m||b.dataset.ok)return;b.dataset.ok="1";
  const close=()=>{m.hidden=true;b.setAttribute("aria-expanded","false")};
  b.onclick=ev=>{ev.stopPropagation();if(m.hidden){const it=menuItems(close);$("#menu-ctx").replaceChildren(...it.ctx);$("#menu-app").replaceChildren(...it.app)}m.hidden=!m.hidden;b.setAttribute("aria-expanded",String(!m.hidden))};
  document.addEventListener("click",ev=>{if(!m.hidden&&!m.contains(ev.target))close()});
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!m.hidden)close()});
  const sp=$("#syncpill");if(sp)sp.onclick=()=>toast(syncState==="saved"?"All saved"+(lastSaved?" · last at "+lastSaved.hour+":"+lastSaved.minute:""):syncState==="saving"?"Saving your changes…":"Offline — "+(offlineEdits?offlineEdits+" change"+(offlineEdits>1?"s":"")+" waiting":"changes")+" will be sent when the internet is back");
  const sn=$("#syncnote");if(sn)sn.onclick=()=>{sn.textContent=""}}
function helpView(){const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"How to use"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")));
  const I=(k,v)=>el("div",{class:"hi"},el("div",{class:"hk"},k),el("div",{},v));
  box.append(el("div",{class:"helplist"},
    I(el("span",{},critIcon()," Name"),"Critical result — the latest value is outside the critical limits (see Critical values in the menu)."),
    I(el("span",{class:"upd"},"Green name"),"Something was recorded today. It turns grey again at 10 am the next morning."),
    I(el("span",{class:"idle"},"Grey name"),"Nothing recorded yet today."),
    I("👥","Another patient has the same name — open the file to check you have the right one."),
    I(el("span",{class:"due over"},"Red item"),"A plan item or result due today or overdue."),
    I("Grey list","Plan items with no date yet — to remember."),
    I("Missed sessions","HD sessions that were ordered (or regular) and not done. Mark Done or Cancel."),
    I(el("span",{class:"syncpill saved",style:"display:inline-flex"},el("span",{class:"sdot"}),"✓ Saved"),"Everything is saved."),
    I(el("span",{class:"syncpill saving",style:"display:inline-flex"},el("span",{class:"sdot"}),"Saving…"),"Your change is being sent."),
    I(el("span",{class:"syncpill offline",style:"display:inline-flex"},el("span",{class:"sdot"}),"Offline"),"No internet — keep working; changes are sent when it's back."),
    I("Tap a name","On the home screen opens that patient. Tap the consultant's title for all their patients."),
    I("‹ Prev / Next ›","Inside a file, moves through the ward list without going back."),
    I("Who entered it","Open any lab day, vitals day, plan item or HD session — the line at the top shows who added or edited it and when.")));
  box.append(el("h3",{style:"margin-top:8px"},"Videos"),el("div",{class:"vlist"},VIDEOS.map(([f,t,m])=>{const v=el("div",{class:"vplay"});
    const b=el("button",{type:"button",class:"small",onclick:()=>{if(v.firstChild){v.replaceChildren();b.textContent="▶ Watch";return}
      v.replaceChildren(el("video",{src:"videos/"+f,controls:true,playsinline:true,preload:"metadata"}));b.textContent="Close"}},"▶ Watch");
    return el("div",{class:"vrow"},el("div",{class:"vt"},el("b",{},t),el("span",{class:"hat"},m)),b,v)})));
  return box}
const VIDEOS=[["1-getting-started.mp4","1 · Getting started and the home screen","≈2.5 min"],["2-adding-patients.mp4","2 · Adding patients — import and new patient","≈3 min"],
  ["3-patient-file.mp4","3 · The patient file and the plan","≈2 min"],["4-daily-follow-up-hd.mp4","4 · Daily follow-up and dialysis","≈2 min"],
  ["5-medications-discharge.mp4","5 · Medications and discharge","≈1.5 min"],["6-editing-menu.mp4","6 · Editing, the menu and saving","≈2 min"],["7-what-it-saves-you.mp4","What it saves you","1 min"]];
window.startApp=function(){render()};
window.appConvert=p=>{ensureIds(p,null);const d=flat(p);return{d,active:isActive(p),entry:dirOf(p,d)}};window.appUnflat=unflat;
window.addEventListener("online",()=>finalizeCodes());
if(!window.PWA){window.Store=memStore();patients=makeSamples();patients.forEach((p,i)=>{p.code="NW-"+String(i+1).padStart(4,"0")});
  for(const p of patients){ensureIds(p,null);const d=flat(p);base[p.id]=d;baseObj[p.id]=clone(p);dir[p.id]=dirOf(p,d)}
  const w=$("#whoami");if(w)w.textContent="Design preview — nothing is saved";window.setSyncState("saved");render()}
