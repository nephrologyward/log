
/* ---------- reference data ---------- */
const RANGES={urea:[15,45],creatinine:[0.6,1.3],na:[135,145],sodium:[135,145],k:[3.5,5],potassium:[3.5,5],ca:[8.5,10.5],phos:[2.5,4.5],
 ph:[7.35,7.45],hco3:[22,26],pco2:[35,45],hb:[13,17],plt:[150,450],platelets:[150,450],tlc:[4,11],wbc:[4,11],crp:[0,5],rbs:[70,140],lactate:[0.5,2.2],inr:[0.8,1.2]};
const DAILY_TESTS=[["Urea","mg/dL"],["Creatinine","mg/dL"],["Na","mmol/L"],["K","mmol/L"],["Ca","mg/dL"],["Phos","mg/dL"],["pH",""],["HCO3","mmol/L"],["PCO2","mmHg"],["Hb","g/dL"],["PLT","×10³/µL"],["TLC","×10³/µL"],["CRP","mg/L"],["RBS","mg/dL"]];
const VCOLS=[["BP","mmHg"],["HR","bpm"],["SpO2","%"],["Temp","°C"],["RR","/min"]];
const ECOLS=[["Chest",""],["LL",""],["Input","mL"],["Output","mL"],["Weight","kg"],["CVP","cmH₂O"],["Others",""]];
const ALLCOLS=[...VCOLS,...ECOLS];
const PLAN_PRESETS=["Echo","Pelvi-abdominal US","Doppler US","Blood culture","Urine culture","Iron studies","PTH","HbA1c","Viral markers (HBV, HCV, HIV)","Chest X-ray","AVF referral"];
const CONSULTANTS=["Dr. Hossam","Dr. Hesham","Dr. Bassem"];
const ACCESS=["AV fistula","Temporary catheter","Permcath","AV graft"];
const BASE_LOC=["Nephrology ward","ICU","ER","HD unit"];
const BASE_DEPT=["Cardiology","Internal medicine","General surgery","Neurology","Obstetrics","Orthopaedics"];
const TYPES={nephro:"Nephrology",coadmit:"Co-admission",consult:"Consultation",hd:"HD only"};
const TYPE_OPTS=[["nephro","Nephrology only"],["coadmit","Co-admission"],["consult","Consultation"],["hd","HD only"]];
const SCHED={smw:["Sat / Mon / Wed",[6,1,3]],stt:["Sun / Tue / Thu",[0,2,4]]};
const schedLabel=e=>SCHED[e.hdSched]?.[0]||e.hdSchedOther||"";
const hdToday=e=>e.type==="hd"&&e.status==="active"&&(SCHED[e.hdSched]?.[1]||[]).includes(new Date().getDay())&&!(e.hd||[]).some(h=>h.date===today());
const STATES=[["todo","Pending"],["doing","Sent / in progress"],["done","Done"]];
const OUTCOMES={discharged:"Discharged",died:"Died",offservice:"Off nephrology care",signedoff:"Signed off"};
const dueClass=d=>!d?"":d<today()?"over":d===today()?"today":"";
function dueInfo(it){if(it.state==="done")return null;
  if(it.state==="todo"&&it.due&&it.due<=today())return{kind:"Do / draw",date:it.due};
  if(it.resultDue&&it.resultDue<=today())return{kind:"Result due",date:it.resultDue};return null}
const isDue=it=>!!dueInfo(it);
const dueTag=d=>el("span",{class:"due "+dueClass(d.date)},d.kind+" · "+(d.date<today()?"overdue "+fmtDate(d.date):"today"));

const lkey=n=>String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const DAILY=new Set(DAILY_TESTS.map(t=>lkey(t[0])).concat(["sodium","potassium","platelets","wbc","lactate","inr","glucose"]));
const isOnce=l=>typeof l.once==="boolean"?l.once:!DAILY.has(lkey(l.name));
function flagOf(l){const r=RANGES[lkey(l.name)],v=parseFloat(l.value);if(!r||isNaN(v))return "";return v>r[1]?"H":v<r[0]?"L":""}
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ISO=/^\d{4}-\d\d-\d\d$/;
const fmtDate=d=>ISO.test(d||"")?d.slice(8)+" "+MON[+d.slice(5,7)-1]:(d||"—");
const today=()=>new Date().toISOString().slice(0,10);
const now=()=>new Date().toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"});
function orderDates(list){const u=[...new Set(list.map(x=>x.date||""))];return u.every(d=>ISO.test(d))?u.sort():u}
let uid=0;const uidf=p=>p+(++uid)+"_"+Date.now().toString(36);

/* ---------- state ---------- */
function makeSamples(){
/* ---------- test data (names are placeholders) ---------- */
const UNIT=Object.fromEntries(DAILY_TESTS);
function L(date,str){return str.split(";").map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(.+?)\s+([\d.,/]+.*)$/);return{date,name:m[1],value:m[2].replace(",","."),unit:UNIT[m[1]]||"",once:false}})}
const O=(date,name,value,unit="")=>({date,name,value,unit,once:true});
const T=(date,BP,HR,SpO2,Temp,extra={})=>Object.fromEntries(Object.entries({date,BP,HR,SpO2,Temp,...extra}).filter(([,v])=>v));
const D="2026-11-06";
function P(o){return{nid:"",phone:"",age:"",sex:"M",occupation:"",residence:"",marital:"",habits:"",pastMedical:[],pastSurgical:[],drugHistory:[],allergies:"",...o,id:uidf("p"),
  encounters:o.encounters.map(e=>({key:uidf("e"),type:"nephro",department:"",status:"active",complaint:"",hpi:"",diagnosis:"",vitalsLog:[],labs:[],imaging:[],plan:[],hd:[],images:[],events:[],meds:[],notes:"",...e}))}}
const M=s=>s.split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^([^\d(]+?)\s+(\d.*|\(.*)$/);return m?{name:m[1],dose:m[2],freq:""}:{name:x,dose:"",freq:""}});
return [
P({name:"خالد سمير",consultant:"Dr. Hossam",age:"39",
  pastMedical:["ESRD 2012, on dialysis until 2018","Kidney transplant 2018 — creatinine 1.8 one month ago"],drugHistory:["Cellcept","Prograf","Solupred"],
  encounters:[{location:"Private 7th",date:D,complaint:"Nausea, anorexia, ataxia, tremor, staccato speech, diarrhoea",
    hpi:"Started 7 days ago with nausea and anorexia; 3 days ago developed ataxia, tremor and staccato speech. Diarrhoea 4–5 motions/day. CT brain done, neurology consulted and cleared.",
    vitalsLog:[T(D,"","","","38",{Weight:"60"})],
    labs:[...L("ER","Urea 110;Creatinine 2.96;Na 125;K 2.6;pH 7.32;HCO3 9.3;PCO2 18"),...L(D,"Creatinine 2.3;Urea 95;Na 128;K 3;pH 7.35;HCO3 14.8;PCO2 25;Ca 8.2;Phos 2")],
    imaging:[{test:"ER pelvi-abdominal US",result:"Increased echogenicity of transplanted kidney"},{test:"CT brain",result:"Done — neurology consulted and cleared"}],
    plan:[{text:"Tacrolimus level",state:"todo",due:"2026-11-07",resultDue:""},{text:"Decide on restarting Prograf after tac level",state:"todo",due:"2026-11-07",resultDue:""}],
    events:[{when:"ER",text:"K correction and Na bicarbonate given in ER"},{when:D,text:"Dysarthria and ataxia improved, no diarrhoea. Fever 38 → Perfalgan added. Prograf still held."}],
    meds:M("Cellcept 500 mg 1×2;Prograf 1 g 1×2 — on hold, was to start Saturday;Solupred 5 mg 1×1;RL + KCl 1 amp 1×3;Ciprodiazole 500 mg 1×1;Perfalgan PRN")}]}),
P({name:"طارق حسن",consultant:"Dr. Hossam",age:"54",
  pastMedical:["Hypertension 30 y on Concor","Dilated cardiomyopathy, EF 20%","ESRD since 1 month — regular HD Sun / Tue / Thu","Not diabetic, no hepatic disease"],drugHistory:["Concor"],
  encounters:[{location:"ENT ward",date:D,complaint:"Rigors, fever and desaturation on HD — suspected infected permcath",
    hpi:"Incomplete HD today (2 h, UF 0.9 L, weight 75.3 → 74.4 kg). Mild–moderate bilateral LL pitting oedema, basal crepitations, still passing urine.",
    vitalsLog:[T(D,"140/70","100","92","38",{Weight:"74.4",Chest:"Basal crepitations",LL:"Mild–moderate bilateral pitting oedema",Others:"Still passing urine"})],
    labs:L(D,"Urea 91;Creatinine 4.28;Na 134;K 4.4;pH 7.43;HCO3 21;PCO2 33;Hb 9.8;PLT 211;TLC 10;ALT 323;AST 158"),
    hd:[{date:D,ordH:"",ordUF:"",hours:"2",uf:"0.9",access:"Permcath",pre:"",post:"",hr:"",wpre:"75.3",wpost:"74.4",volume:"Mild–moderate LL oedema, basal creps",notes:"Incomplete — rigors, fever, desaturation"}],
    plan:[{text:"Blood cultures (suspected permcath infection)",state:"todo",due:D,resultDue:""},{text:"Sepsis markers",state:"todo",due:"2026-11-07",resultDue:""},{text:"Hold HD — reassess volume status",state:"doing",due:"",resultDue:""}],
    events:[{when:D,text:"Admitted. Later today: no new complaints, no new labs; holding HD, IV antibiotics, following volume status."}],
    meds:M("Vancomycin 1 g once, then 500 mg every 48 h;Fortum 1 g 1×1;Controloc 40 mg 1×1;Perfalgan PRN;Concor 2.5 mg 1×1;Lanoxin 0.25 mg ½ tab every other day;Dapagliflozin 1×1;Examide 20 mg 1×1;Aspirin 1×1;Bone Care 0.5 1×1"),
    notes:"Also followed by Dr. Mira"}]}),
P({name:"يوسف عبد الله",consultant:"Dr. Hesham",age:"73",
  pastMedical:["DM, insulin-dependent (Lantus + Actrapid for 2 months)","Hypertension","IHD — PCI with 7 stents, last 4 in May 2026","Heart failure, EF ~35%","DKA with AKI 3 months ago (peak creatinine 4.0, baseline ~1.x)","Klebsiella UTI — stopped antibiotics early"],
  drugHistory:["Plavix 75 mg (held 2 days before admission)","Examide 10 mg","Tamsulosin","Paracetamol","Lantus + Actrapid","Stopped Aug 2026: Entresto, Cardio-Care"],
  encounters:[{type:"coadmit",department:"Urology",location:"Kidney transplant 8th",date:"before 04/11",complaint:"Fatigue, severe anorexia, oliguria, mild LL oedema",
    hpi:"Progressive oliguria for 1 month, anorexia and nausea for 2 weeks. Home IV Ringer's and ceftriaxone for 4 days. Non-compliant with cardiac medications.",
    diagnosis:"Emphysematous pyelonephritis",
    vitalsLog:[T("Adm","100/60","80","95",""),T("2026-11-04","140/70","70","96","36.4",{Chest:"Clear",LL:"Minimal oedema",Input:"720",Output:"900",Others:"RBS 180"}),T("2026-11-05","150/70","70","98","",{Chest:"Clear",LL:"Minimal bilateral pedal oedema",Output:"600/12 h"}),T(D,"120/80","88","98","",{Chest:"Clear",LL:"Mild pedal oedema",Input:"1230",Output:"1200",Others:"Sleepy; PCN 50 mL/6 h"})],
    labs:[...L("Adm","Urea 101;Creatinine 3.6;K 4.3;Na 130;Hb 10;TLC 16.7;PLT 340;pH 7.40;HCO3 24;PCO2 40;Lactate 2.2"),
      ...L("2026-11-04","Urea 102;Creatinine 3.4;Na 130;K 4.19;Ca 8.3;Albumin 2.3;pH 7.49;HCO3 24.4;PCO2 32;Lactate 0.9;Hb 9.9;PLT 353;TLC 15.01;CRP 252;INR 1.3"),
      ...L("2026-11-05","Urea 117;Creatinine 3.5;Uric acid 8;Na 129;K 4.3;Phos 3.7;pH 7.35;HCO3 22.6;PCO2 41;Hb 9.2;PLT 381;TLC 16.9;Lactate 4.7;Albumin 2.4;ALT 4.1;AST 8"),
      ...L(D,"Urea 118;Creatinine 3.5;Hb 9.8;TLC 17;PLT 338"),
      O("2026-11-05","Pigtail fluid chemistry","Glucose 79, albumin 2, LDH 1649, TP 369")],
    imaging:[{test:"Outpatient CT",result:"Bilateral nodular lung thickening, minimal pericardial and left pleural effusion; 5 mm ureteric stone with adjacent gas collection"},
      {test:"In-hospital CT",result:"Emphysematous pyelonephritis / emphysematous kidney"},
      {test:"Pelvi-abdominal US",result:"Mild hepatomegaly, GB mud, Lt emphysematous pyelitis, Lt septated cystic lesion 8.5×7.5 cm likely infected, emphysematous cystitis",date:"2026-11-04"},
      {test:"Echo",result:"EF 48%, IHD picture, impaired systolic function, mild MR and TR",date:"2026-11-05"}],
    plan:[{text:"Urine culture (PCN)",state:"doing",due:"",resultDue:""},{text:"Pigtail fluid C&S",state:"doing",due:"",resultDue:""},{text:"CRP",state:"todo",due:"2026-11-07",resultDue:""}],
    events:[{when:"2026-11-04",text:"Lt PCN and perinephric pigtail inserted — 1000 mL pus, then pigtail slipped"},{when:"2026-11-05",text:"Lt PCN only 50 mL; urinary catheter slipped; Norvasc 5 mg added; Meronem 1 g every 8 h"}],
    meds:M("Meronem 1 g every 8 h;Zofran 1×2;Norvasc 5 mg;Lantus + Actrapid")}]}),
P({name:"مصطفى رمضان",consultant:"Dr. Hesham",age:"61",
  pastMedical:["DM long-standing, on tablets","Hypertension long-standing","Proteinuria 1.5 y ago (not documented) — Tritace, then Finoxilab","PCI Sept with 3 stents — creatinine 1.8 after, 0.7 two weeks later"],
  drugHistory:["Forxiga 10 and Concor (added by cardiology)","Recently: Inhex, Asthmacast 10, Symbicort"],
  encounters:[{location:"Plastic surgery ward",date:"before 01/11",complaint:"Fatigue, frothy urine, tremors after 5 days of cough and fever",
    hpi:"Presented with puffy eyes, minimal LL oedema, hyperkalaemia and AKI. CT chest: mild right pleural effusion. K 6.8 → 5.7 after anti-hyperkalaemic measures.",
    vitalsLog:[T("2026-11-01","120/60","70","96","",{Chest:"↓ air entry bilateral basal, more on right",LL:"No oedema"}),T("2026-11-04","160/80","79","98","36.4",{Weight:"90.5",Input:"2225",Output:"1490",Chest:"Bilateral basal crepitations",LL:"Mild bilateral oedema"}),T("2026-11-05","180/100","","98","",{Chest:"Clear",LL:"No oedema",Input:"1840",Output:"1180",Others:"BP at night 130/80"}),T(D,"120/80","80","96","",{Chest:"Clear",LL:"No oedema",Input:"950",Output:"600"})],
    labs:[...L("Adm","Creatinine 10.3;Urea 166;pH 7.40;HCO3 18.5;PCO2 32;TLC 8.9;Hb 6.9;PLT 157;K 6.8"),
      ...L("2026-11-01","Urea 180;Creatinine 11;Na 134;K 7.4;TLC 5.4;Hb 7;PLT 186;INR 1;CRP 90"),
      ...L("2026-11-04","Urea 102;Creatinine 7.29;Na 135;K 4.2;Ca 9.6;Albumin 3.6;Phos 5.3;pH 7.48;PCO2 35;HCO3 26.1;Lactate 1.3;Hb 9.8;PLT 197;TLC 5.4;ALT 14;AST 35;CRP 377"),
      ...L("2026-11-05","Urea 126;Creatinine 8.5;Uric acid 5.6;Na 139;K 4.19;Ca 9;Phos 5.7;pH 7.44;HCO3 24.5;PCO2 36;Hb 9.4;PLT 197;TLC 6.3;Albumin 3.6;ALT 31;AST 14"),
      ...L(D,"Urea 146;Creatinine 9.7;Na 138;K 4;pH 7.43;PCO2 35;HCO3 23;Lactate 1.3;Hb 9.6;PLT 194;TLC 6.3"),
      O("2026-11-03","Coombs test","Negative"),O("2026-11-03","LDH","267","U/L"),O("2026-11-04","LDH","281","U/L"),O("2026-11-04","Bilirubin","0.4 / 0.2","mg/dL")],
    imaging:[{test:"CT chest",result:"Mild right pleural effusion"},{test:"Echo",result:"EF 62%, concentric LVH, mild MR/TR",date:"2026-11-01"}],
    hd:[{date:"2026-11-01",hours:"",uf:"",access:"",pre:"",post:"",notes:"1st session + 1 unit PRBCs"},{date:"2026-11-03",hours:"",uf:"",access:"",pre:"",post:"",notes:"3rd session + 1 unit PRBCs"}],
    plan:[{text:"Multiple myeloma work-up",state:"doing",due:"",resultDue:""},{text:"Serum immunofixation",state:"doing",due:"",resultDue:""},{text:"c-ANCA",state:"doing",due:"",resultDue:""},{text:"ESR",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-04",text:"Controloc 40 mg IV 1×2; added Nevilob 2.5, Atoreza 40/10, Tavanic 500 every 48 h"},{when:"2026-11-05",text:"No indication for HD today"}],
    meds:M("Plavix;Aspirin;Controloc 40 mg IV 1×2;Lasix 80;Norvasc 5;Atoreza 40/10;Nevilob 2.5 mg 1×1;Tavanic 500 mg every 48 h;Perfalgan 1×3")}]}),
P({name:"إبراهيم سالم",consultant:"Dr. Hesham",age:"71",
  pastMedical:["T2DM on Mixtard","Hypertension on Concor","IHD","Right ectopic kidney","CKD (2023) → ESRD, recently started maintenance HD"],pastSurgical:["CABG (2013)","PCI with stent (2023)"],drugHistory:["Mixtard insulin","Concor"],
  encounters:[{location:"Plastic surgery ward",date:D,complaint:"Continuation of renal replacement therapy",
    hpi:"Recently started maintenance HD (2 sessions). On 02/11 developed chest pain after HD with mildly raised troponin → ICU, improved and discharged Friday. Now for 3 more HD sessions.",
    diagnosis:"ESRD on maintenance HD; IHD",
    vitalsLog:[T(D,"130/60","85","98","",{Others:"Fully conscious, stable"})],
    labs:L(D,"Urea 201;Creatinine 5.4;Na 126;K 5.2;pH 7.22;HCO3 14;PCO2 35;Hb 9.5;PLT 147;TLC 5.5;Lactate 1.3"),
    imaging:[{test:"Echo",result:"EF ≈ 55%, poor acoustic window, aortic valve sclerosis"},{test:"Pelvi-abdominal US",result:"Grade 2 nephropathy, mild–moderate splenomegaly, enlarged prostate"}],
    plan:[{text:"HD session × 3",state:"doing",due:"",resultDue:""},{text:"AVF insertion",state:"todo",due:"",resultDue:""}],
    events:[{when:"2026-11-02",text:"Chest pain after HD, mildly elevated troponin → ICU"},{when:D,text:"Admitted for continuation of HD"}],
    meds:M("Nitromak every 12 h;Aspocid 75 mg daily;Plavix 75 mg daily;Ator 40 mg daily;Nevelop 5 mg daily;Controloc 40 mg daily")}]}),
P({name:"فتحي عبد الحميد",consultant:"Dr. Bassem",encounters:[{type:"consult",department:"ICU",location:"ICU 5th",date:D}]}),
P({name:"سعاد إبراهيم",sex:"F",consultant:"Dr. Bassem",encounters:[{type:"consult",department:"Oncology ICU",location:"Oncology ICU",date:D}]}),
P({name:"شريف نبيل",consultant:"",encounters:[{type:"hd",hdSched:"smw",department:"Kidney transplant",location:"Kidney transplant",date:D}]}),
P({name:"وليد كمال",consultant:"",encounters:[{type:"hd",hdSched:"smw",department:"Vascular surgery",location:"Vascular ward",date:D}]}),
P({name:"سامي فؤاد",consultant:"",encounters:[{type:"hd",hdSched:"stt",department:"Orthopaedics",location:"Orthopaedics ward",date:D}]}),
P({name:"هاني رشاد",consultant:"",encounters:[{type:"hd",hdSched:"stt",department:"Private 6th",location:"Private 6th",date:D}]}),
];
}
let patients=[];const lastJSON={};let buffered=null;
let openHist=false,view="home",consView=null,back="home",current=null,editing=null,mini=null,filter="all",flash=false;

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
function el(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k.startsWith("on"))e[k]=v;else if(k==="value")e.value=v;else e.setAttribute(k,v===true?"":v)}
  for(const k of kids.flat()){if(k==null||k===""||k===false)continue;e.append(k.nodeType?k:String(k))}return e}
let fid=0;const nid=()=>"f"+(++fid);
function fld(label,input,{req=false,hint=""}={}){if(!input.id)input.id=nid();return el("div",{class:"field"},el("label",{for:input.id},label,req?el("span",{class:"req"}," *"):null),input,hint?el("small",{},hint):null)}
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
function twoTap(btn,label,fn){btn.onclick=()=>{if(!btn.classList.contains("sure")){btn.classList.add("sure");btn.textContent=label;return}fn()};return btn}
function refreshLists(){
  const all=k=>patients.flatMap(p=>p.encounters.map(e=>e[k])).filter(Boolean);
  const fill=(id,vals)=>{$(id).replaceChildren(...[...new Set(vals)].map(v=>el("option",{value:v})))};
  fill("#dl-locations",[...BASE_LOC,...all("location")]);
  fill("#dl-departments",[...BASE_DEPT,...all("department")]);
  fill("#dl-consultants",[...CONSULTANTS,...patients.map(p=>p.consultant).filter(Boolean)]);
}

/* ---------- shared input blocks ---------- */
const TEXTCOLS=new Set(["BP","Chest","LL","Others"]);
const EXAM_PH={Chest:"Clear / basal creps / wheezy",LL:"No oedema / mild pitting",Others:"Conscious level, JVP, abdomen…"};
function logBlock(cols,cls){const ins={};const g=el("div",{class:cls});
  for(const[c,u]of cols){const i=inp("",{class:TEXTCOLS.has(c)?"":"mono",placeholder:EXAM_PH[c]||u,inputmode:TEXTCOLS.has(c)?"text":"decimal"});ins[c]=i;g.append(fld(c==="LL"?"Lower limbs (LL)":c,i))}
  g.read=date=>{const e={date};for(const[c]of cols)if(ins[c].value.trim())e[c]=ins[c].value.trim();return Object.keys(e).length>1?e:null};return g}
const vitalsBlock=()=>logBlock(VCOLS,"vgrid"),examBlock=()=>logBlock(ECOLS,"fgrid");
function saveLog(e,...entries){for(const v of entries){if(!v)continue;e.vitalsLog=e.vitalsLog||[];const x=e.vitalsLog.find(y=>y.date===v.date);x?Object.assign(x,v):e.vitalsLog.push(v)}}
function labsBlock(tests=DAILY_TESTS){const ins={};const g=el("div",{class:"vgrid"});
  for(const[t,u]of tests){const i=inp("",{class:"mono",placeholder:u,inputmode:"decimal"});ins[t]=i;g.append(fld(t,i))}
  g.read=date=>tests.filter(([t])=>ins[t].value.trim()).map(([t,u])=>({date,name:t,value:ins[t].value.trim(),unit:u,once:false}));return g}
function planBlock(list){ // edits list in place
  const box=el("div",{class:"sec"});const ul=el("ul",{class:"check"});const custom=inp("",{placeholder:"Add another item…"});
  const due=el("input",{type:"date",value:today(),style:"width:auto",id:nid()});const rdue=el("input",{type:"date",value:"",style:"width:auto",id:nid()});
  const draw=()=>{ul.replaceChildren(...list.map((it,i)=>el("li",{},el("span",{class:"txt"},it.text),it.due?el("span",{class:"due"},"do "+fmtDate(it.due)):null,it.resultDue?el("span",{class:"due"},"result "+fmtDate(it.resultDue)):null,el("button",{class:"link small",type:"button",onclick:()=>{list.splice(i,1);draw()}},"Remove"))));
    chips.querySelectorAll("button").forEach(b=>b.hidden=list.some(x=>x.text===b.dataset.t))};
  const chips=el("div",{class:"chips"},PLAN_PRESETS.map(t=>el("button",{class:"chip",type:"button","data-t":t,onclick:()=>{list.push({text:t,state:"todo",due:due.value,resultDue:rdue.value});draw()}},"+ "+t)));
  const add=()=>{const t=custom.value.trim();if(t){list.push({text:t,state:"todo",due:due.value,resultDue:rdue.value});custom.value="";draw()}};
  custom.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add()}};
  box.append(el("small",{class:"sub"},"Only special investigations and tasks — routine daily labs don't need adding."),
    el("div",{class:"row"},el("label",{for:due.id},"Do / draw on"),due,el("label",{for:rdue.id},"Result expected"),rdue),chips,el("div",{class:"row"},custom,el("button",{class:"small",type:"button",onclick:add},"Add")),ul);draw();return box}

/* ---------- views ---------- */
const busy=()=>!!(mini||editing||view==="new"||view==="import");
function persistDirty(){let n=0;for(const p of patients){const j=JSON.stringify(p);if(lastJSON[p.id]!==j){lastJSON[p.id]=j;Store.savePatient(JSON.parse(j));n++}}if(n)buffered=null}
function applyRemote(list){patients=list;for(const k in lastJSON)delete lastJSON[k];for(const p of list)lastJSON[p.id]=JSON.stringify(p)}
window.onRemotePatients=list=>{if(busy()){buffered=list;const n=$("#syncnote");if(n)n.textContent="New updates from colleagues will show when you close this form."}else{applyRemote(list);render()}};
function hydrateImgs(root=document){root.querySelectorAll("img[data-img]:not([src])").forEach(img=>{Store.getImage(img.dataset.img).then(s=>{if(s)img.src=s}).catch(()=>{img.alt="Image unavailable offline"})})}
function render(){persistDirty();if(buffered&&!busy()){applyRemote(buffered);buffered=null}const n=$("#syncnote");if(n&&!buffered)n.textContent="";
  refreshLists();const app=$("#app");app.replaceChildren(view==="new"?newPatientView():view==="find"?findView():view==="cons"?consultantView():view==="import"?importView():view==="admin"?adminView():view==="file"&&cur()?fileView():homeView());hydrateImgs();flash=false}

function homeView(){
  const box=el("div",{class:"wrap",style:"gap:16px"});
  box.append(el("div",{class:"choices"},
    el("button",{class:"choice primary",onclick:()=>{view="new";render();scrollTo(0,0)}},el("b",{},"+ New patient"),el("span",{},"Admission, co-admission or consultation")),
    el("button",{class:"choice",onclick:()=>{view="find";render();scrollTo(0,0);$("#q")?.focus()}},el("b",{},"Find a patient"),el("span",{},"Current or old patients — view or re-admit")),
    el("button",{class:"choice",onclick:()=>{view="import";render();scrollTo(0,0)}},el("b",{},"⇣ Import"),el("span",{},"Paste a block prepared by an AI"))));
  if(Store.isAdmin)box.append(el("div",{class:"row",style:"justify-content:flex-end"},el("button",{class:"small",onclick:()=>{view="admin";render();scrollTo(0,0)}},"⚙ Team access")));
  box.append(wardView());
  return box;
}
function findView(){
  const q=el("input",{type:"search",id:"q",placeholder:"Name, national ID, phone or ward…","aria-label":"Search patients",dir:"auto"});
  const list=el("div",{class:"plist"});
  const F=[["all","All"],["nephro","Nephrology"],["coadmit","Co-admission"],["consult","Consults"],["hd","HD only"],["out","Closed"]];
  const fb=el("div",{class:"filters"},F.map(([k,l])=>el("button",{class:"small","aria-pressed":String(filter===k),onclick:()=>{filter=k;render();$("#q").value=qv;draw()}},l)));
  let qv="";
  const draw=()=>{const s=(qv=q.value).trim().toLowerCase();
    const rows=patients.filter(p=>(filter==="all"||stateOf(p)===filter)&&(!s||[p.name,p.nid,p.phone,p.consultant,...p.encounters.flatMap(e=>[e.location,e.department,e.diagnosis])].join(" ").toLowerCase().includes(s)));
    list.replaceChildren(...(rows.length?rows.map(p=>prow(p,"find")):[el("p",{class:"empty",style:"padding:10px 0"},"No patients match.")]))};
  q.oninput=draw;draw();
  return el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Find a patient"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")),q,fb,list);
}
function openPatient(p,from){back=from||view;current=p.id;view="file";editing=null;mini=null;render();scrollTo(0,0)}
function prow(p,from){const e=latest(p);return el("button",{class:"prow",onclick:()=>openPatient(p,from)},
  el("div",{},el("div",{class:"nm",dir:"auto"},p.name),el("div",{class:"meta"},[e?.location,p.consultant,p.age&&p.age+" y"].filter(Boolean).join(" · "))),e?pill(e):null)}
const HDG="Regular HD — other departments";
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
function wardView(){
  const{act,groups}=consGroups();
  const card=([c,ps])=>el("button",{class:"ccard",onclick:()=>{consView=c;view="cons";render();scrollTo(0,0)}},
    el("div",{class:"topbar"},el("h3",{},c),el("span",{class:"sub"},String(ps.length))),
    !ps.length?el("p",{class:"empty"},"No patients in ward."):c===HDG?el("div",{class:"sec"},bySched(ps).map(([k,xs])=>el("div",{},el("span",{class:"sub",style:"font-size:.78rem;font-weight:600"},k),el("ul",{class:"names"},xs.map(p=>el("li",{dir:"auto"},p.name)))))):el("ul",{class:"names"},ps.map(p=>el("li",{dir:"auto"},p.name))),
    el("span",{class:"open"},"Open →"));
  const text=["In-ward nephrology patients — "+fmtDate(today())+" ("+act.length+")",...groups.filter(g=>g[1].length).flatMap(([c,ps])=>c===HDG?["",c+" ("+ps.length+")",...bySched(ps).flatMap(([k,xs])=>[k+":",...xs.map((p,i)=>"  "+(i+1)+". "+p.name+" — "+(latest(p).location||"location not set"))])]:["",c+" ("+ps.length+")",
    ...ps.map((p,i)=>{const e=latest(p);return (i+1)+". "+p.name+" — "+(e.location||"location not set")+(e.type==="hd"?(schedLabel(e)?" — "+schedLabel(e):""):e.type!=="nephro"?" — "+typeLabel(e):"")})])].join("\n");
  const st=el("span",{class:"sub","aria-live":"polite"});const ta=area(text,{class:"mono",readonly:true,style:"min-height:140px",dir:"auto"});ta.hidden=true;
  const copy=el("button",{class:"small",onclick:()=>{const fb=()=>{ta.hidden=false;ta.focus();ta.select();st.textContent="Text selected — press copy."};
    try{navigator.clipboard.writeText(text).then(()=>st.textContent="Copied — paste it in the group.",fb)}catch{fb()}}},"Copy list as message");
  return el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"In-ward patients ("+act.length+")"),el("div",{class:"row"},copy,st)),
    el("div",{class:"cons-grid"},groups.map(card)),ta);
}
/* ---------- import ---------- */
const AI_PROMPT="Convert the ward message below into ONE JSON block for my \"Renal Ward Log\" app.\nReply with ONLY the JSON inside one code block — no explanation.\n\nSHAPE:\n{\"patient\":{\"name\":\"\",\"nid\":\"\",\"phone\":\"\",\"age\":\"\",\"sex\":\"M|F\",\"consultant\":\"\",\n \"occupation\":\"\",\"residence\":\"\",\"marital\":\"\",\"habits\":\"\",\n \"pastMedical\":[],\"pastSurgical\":[],\"drugHistory\":[],\"allergies\":\"\"},\n \"encounter\":{\"type\":\"nephro|coadmit|consult|hd\",\"department\":\"\",\"location\":\"\",\n \"date\":\"\",\"hdSched\":\"smw|stt\",\"complaint\":\"\",\"hpi\":\"\",\"diagnosis\":\"\",\n \"vitals\":[{\"date\":\"\",\"BP\":\"\",\"HR\":\"\",\"SpO2\":\"\",\"Temp\":\"\",\"RR\":\"\",\n   \"Chest\":\"\",\"LL\":\"\",\"Input\":\"\",\"Output\":\"\",\"Weight\":\"\",\"CVP\":\"\",\"Others\":\"\"}],\n \"labs\":[{\"date\":\"\",\"name\":\"\",\"value\":\"\",\"unit\":\"\",\"once\":false}],\n \"imaging\":[{\"test\":\"\",\"result\":\"\",\"date\":\"\"}],\n \"plan\":[{\"text\":\"\",\"state\":\"todo|doing|done\",\"due\":\"\",\"resultDue\":\"\"}],\n \"hd\":[{\"date\":\"\",\"ordH\":\"\",\"ordUF\":\"\",\"hours\":\"\",\"uf\":\"\",\"access\":\"\",\n   \"pre\":\"\",\"post\":\"\",\"hr\":\"\",\"wpre\":\"\",\"wpost\":\"\",\"volume\":\"\",\"notes\":\"\"}],\n \"events\":[{\"when\":\"\",\"text\":\"\"}],\n \"meds\":[{\"name\":\"\",\"dose\":\"\",\"freq\":\"\",\"start\":\"\",\"stop\":\"\",\"note\":\"\"}],\"notes\":\"\"}}\n\nRULES:\n1. Never invent anything. Leave out fields that are not in the message.\n2. Patient name: copy it exactly as written (Arabic is fine).\n3. Consultant: one of \"Dr. Hossam\", \"Dr. Hesham\", \"Dr. Bassem\" if mentioned.\n4. type: \"nephro\" = admitted under nephrology (even if the bed is in another ward);\n   \"coadmit\" = shared with another department (مشترك) → put it in \"department\";\n   \"consult\" = consultation; \"hd\" = only dialysis while admitted elsewhere.\n   location = the ward/bed written (e.g. خاص السابع → \"Private 7th\").\n5. hdSched: \"smw\" = Sat/Mon/Wed, \"stt\" = Sun/Tue/Thu (only for type \"hd\").\n6. Dates: write as YYYY-MM-DD (current year if not written). Messages use\n   day/month. Labs or vitals from admission with no date → \"Adm\"; from ER → \"ER\".\n   Each day's labs and vitals must carry that day's date.\n7. Lab names — use exactly: Urea, Creatinine, Na, K, Ca, Phos, pH, HCO3, PCO2,\n   Hb, PLT, TLC, CRP, RBS, Lactate, Albumin, ALT, AST, INR, Uric acid.\n   (Cr/Creat → Creatinine, N → Na, P/Po4 → Phos, Co2 → PCO2, Lac → Lactate,\n   Alb → Albumin, Plt → PLT, Tlc → TLC, UA → Uric acid.) Write decimals with a dot.\n   \"once\": true only for tests not repeated daily (HbA1c, PTH, iron studies,\n   viral markers, Coombs, LDH, immunology, culture results, fluid chemistry).\n8. Vitals/exam per day: BP, HR, SpO2 (number only), Temp, RR; Chest, LL\n   (lower-limb oedema), Input, Output, Weight, CVP; anything else → Others.\n9. imaging: US, Echo, CT, X-ray etc. with their result.\n10. plan: only special investigations or tasks (Echo, US, cultures, tac level,\n   immunology, procedures). Do NOT add routine daily labs or \"full package\".\n   Requested/pending → \"doing\"; planned → \"todo\" with \"due\" if a day is given\n   (\"tomorrow\" = next day's date).\n11. events: what happened (procedures, transfusions, complications,\n   drug changes, HD done), each with its date.\n12. meds: current medications, split into name / dose / frequency, with\n   \"start\" = date started if stated. A drug the message says was stopped →\n   include it with \"stop\" = that date and \"note\" = reason. A dose change →\n   the new dose as a med with \"start\" = that date.\n\nMESSAGE:\n";
const arr=x=>Array.isArray(x)?x:[];const str=x=>x==null?"":String(x).trim();
const normName=n=>str(n).replace(/\s+/g," ").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
function parseImport(txt){const a=txt.indexOf("{"),b=txt.lastIndexOf("}");if(a<0||b<a)throw new Error("No data block found — paste the whole block from Claude.");
  const o=JSON.parse(txt.slice(a,b+1));if(!o.patient||!str(o.patient.name))throw new Error("The block has no patient name.");return o}
function findMatch(P){const nid=str(P.nid),nm=normName(P.name);return patients.find(p=>nid&&p.nid===nid)||patients.find(p=>normName(p.name)===nm)||null}
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
  for(const it of arr(E.plan)){const t=str(it.text);if(!t)continue;const ex=e.plan.find(x=>x.text===t);const v={text:t,state:["todo","doing","done"].includes(it.state)?it.state:"todo",due:ISO.test(it.due||"")?it.due:"",resultDue:ISO.test(it.resultDue||"")?it.resultDue:"",result:str(it.result)};
    ex?Object.assign(ex,v):e.plan.push(v)}
  for(const h of arr(E.hd))e.hd.push(Object.fromEntries(Object.entries(h).map(([k,v])=>[k,str(v)])));
  for(const x of arr(E.events)){const t=str(x.text);if(t&&!e.events.some(y=>y.text===t))e.events.push({when:str(x.when),text:t})}
  for(const im of arr(E.meds)){const m={name:str(im.name),dose:str(im.dose),freq:str(im.freq),start:str(im.start),stop:str(im.stop),note:str(im.note)};if(!m.name)continue;
    const act=e.meds.find(x=>!x.stop&&(lkey(x.name)===lkey(m.name)||lkey(x.name).startsWith(lkey(m.name))||lkey(m.name).startsWith(lkey(x.name))));
    if(m.stop){if(act){act.stop=m.stop;act.note=m.note||"Stopped";e.events.push({when:m.stop,text:"Stopped "+medTxt(act)})}else e.meds.push(m);continue}
    if(act&&act.dose===m.dose&&act.freq===m.freq)continue;
    const when=m.start||(merging?today():str(E.date));
    if(act){act.stop=when;act.note="Changed to "+[m.dose,m.freq].filter(Boolean).join(" ");e.events.push({when,text:m.name+": "+[act.dose,act.freq].filter(Boolean).join(" ")+" → "+[m.dose,m.freq].filter(Boolean).join(" ")})}
    else if(merging)e.events.push({when,text:"Started "+medTxt(m)});
    e.meds.push(Object.fromEntries(Object.entries({...m,start:when}).filter(([,v])=>v)))}
  if(str(E.notes))e.notes=(e.notes?e.notes+"\n":"")+str(E.notes);
  e.edited=now();return{p,merging};
}
function promptBox(){const t=area(AI_PROMPT,{class:"mono",readonly:true,style:"min-height:220px",dir:"ltr"});const st=el("span",{class:"sub","aria-live":"polite"});
  const copy=el("button",{class:"small primary",onclick:()=>{const fb=()=>{t.focus();t.select();st.textContent="Text selected — press copy."};
    try{navigator.clipboard.writeText(AI_PROMPT).then(()=>st.textContent="Prompt copied — paste it, then the message under it.",fb)}catch{fb()}}},"Copy prompt");
  return el("details",{class:"src"},el("summary",{},"Prompt for the AI (copy once, paste the message under it)"),el("div",{class:"sec",style:"margin-top:8px"},el("div",{class:"row"},copy,st),t))}
function importView(){
  const ta=area("",{class:"mono",style:"min-height:180px",placeholder:"Paste the block from Claude here…",dir:"ltr"});
  const out=el("div",{class:"sec"});let parsed=null;
  const check=()=>{out.replaceChildren();try{parsed=parseImport(ta.value)}catch(err){parsed=null;out.append(el("p",{class:"err"},err.message||"That block couldn't be read. Copy it again from Claude."));return}
    const P=parsed.patient,E=parsed.encounter||{};const m=findMatch(P);const act=m&&latest(m)?.status==="active";
    const target=sel([["match",m?(act?"Add to "+m.name+"'s current admission":"New encounter for "+m.name+" (re-admission)"):"—"],["new","Create as a new patient"]],m?"match":"new");if(!m)target.disabled=true;
    const count=(k,lab)=>arr(E[k]).length?arr(E[k]).length+" "+lab:"";
    out.append(el("div",{class:"minibox"},el("h3",{},"Check before saving"),
      el("p",{},el("b",{dir:"auto"},P.name),"  ",el("span",{class:"sub"},[str(P.age)&&P.age+" y",str(P.consultant),str(E.location),TYPES[E.type]].filter(Boolean).join(" · "))),
      el("p",{class:"sub"},m?(act?"Found this patient — currently admitted.":"Found this patient — not currently admitted."):"No matching patient — will be added as new."),
      fld("Save as",target),
      el("p",{style:"font-size:.9rem"},[count("vitals","day(s) of vitals/exam"),count("labs","lab results"),count("imaging","studies"),count("events","events"),count("meds","medications"),count("plan","checklist items"),count("hd","HD sessions")].filter(Boolean).join(" · ")||"No clinical entries in this block."),
      el("div",{class:"row"},el("button",{class:"primary",onclick:()=>{const{p}=applyImport(parsed,target.value==="match"?m:null);current=p.id;back="home";view="file";flash=true;render();scrollTo(0,0)}},"Save"),
        el("button",{onclick:()=>{view="home";render()}},"Cancel"))))};
  return el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Import from Claude"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")),
    el("p",{class:"sub"},"Send the WhatsApp message to an AI with the prompt below, copy the block it sends back, and paste it here."),promptBox(),ta,el("div",{class:"row"},el("button",{class:"primary",onclick:check},"Check")),out);
}
function consultantView(){
  const g=consGroups().groups.find(x=>x[0]===consView)||[consView,[]];const[c,ps]=g;
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},c+" — in ward ("+ps.length+")"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")));
  if(!ps.length){box.append(el("p",{class:"empty"},"No patients in ward."));return box}
  const sections=c===HDG?bySched(ps):[[null,ps]];
  for(const[k,xs]of sections){if(k)box.append(el("h3",{style:"margin-top:6px"},k));
  for(const p of xs){const e=latest(p);const due=(e.plan||[]).map(it=>({it,d:dueInfo(it)})).filter(x=>x.d);
    if(hdToday(e))due.unshift({it:{text:"HD session ("+schedLabel(e)+")"},d:{kind:"HD",date:today()}});
    box.append(el("div",{class:"pblock"},prow(p,"cons"),
      el("div",{class:"duebox"+(due.length?"":" none")},el("b",{class:"t"},due.length?"⏰ DUE TODAY":"NOTHING DUE TODAY"),
        due.length?el("ul",{},due.map(x=>el("li",{},el("button",{onclick:()=>openPatient(p,"cons")},x.it.text+" "),dueTag(x.d)))):null)))}}
  return box;
}
function newPatientView(){
  const F={name:inp("",{autocomplete:"off",dir:"auto",placeholder:"الاسم بالعربي"}),nid:inp("",{inputmode:"numeric",class:"mono"}),phone:inp("",{inputmode:"tel",class:"mono"}),
    age:inp("",{inputmode:"numeric"}),sex:sel([["","—"],["M","Male"],["F","Female"]],""),consultant:inp("",{list:"dl-consultants",placeholder:"Pick: Dr. Hossam, Dr. Hesham, Dr. Bassem"}),
    date:el("input",{type:"date",value:today()}),location:inp("",{list:"dl-locations",placeholder:"Type or pick"}),
    dept:inp("",{list:"dl-departments",placeholder:"e.g. Cardiology"}),
    occupation:inp(),residence:inp(),marital:sel(["","Single","Married","Divorced","Widowed"],""),habits:inp("",{placeholder:"Smoking, etc."}),
    complaint:inp(),hpi:area(),diagnosis:inp(),
    pastMedical:area("",{placeholder:"One per line"}),pastSurgical:area("",{placeholder:"One per line"}),drugs:area("",{placeholder:"One per line"}),allergies:inp()};
  const type=seg("ptype",TYPE_OPTS,"nephro");
  const deptWrap=fld("Department",F.dept,{req:true,hint:"The team the patient is admitted under / who asked for the consult"});deptWrap.hidden=true;
  const sched=seg("psched",[["smw","Sat / Mon / Wed"],["stt","Sun / Tue / Thu"],["other","Other"]],"smw");const schedOther=inp("",{placeholder:"e.g. twice weekly"});
  const schedWrap=el("div",{class:"sec"},el("h3",{},"HD schedule"),sched,schedOther);schedWrap.hidden=true;schedOther.hidden=true;sched.onchange=()=>schedOther.hidden=sched.get()!=="other";
  const fullOnly=[];
  type.onchange=()=>{const t=type.get();deptWrap.hidden=t==="nephro";schedWrap.hidden=t!=="hd";fullOnly.forEach(x=>x.hidden=t==="hd")};
  const vit=vitalsBlock(),exam=examBlock(),labs=labsBlock(),plan=[];
  const err=el("p",{class:"err",role:"alert"});
  const save=()=>{
    const name=F.name.value.trim();const t=type.get();
    if(!name){err.textContent="Name is required.";F.name.focus();return}
    if(t!=="nephro"&&!F.dept.value.trim()){err.textContent="Add the department for a co-admission or consult.";F.dept.focus();return}
    const d=F.date.value||today();const v=Object.assign({},vit.read(d)||{},exam.read(d)||{});
    const p={id:uidf("p"),name,nid:F.nid.value.trim(),phone:F.phone.value.trim(),consultant:F.consultant.value.trim(),age:F.age.value.trim(),sex:F.sex.value,
      occupation:F.occupation.value.trim(),residence:F.residence.value.trim(),marital:F.marital.value,habits:F.habits.value.trim(),
      pastMedical:lines(F.pastMedical.value),pastSurgical:lines(F.pastSurgical.value),drugHistory:lines(F.drugs.value),allergies:F.allergies.value.trim(),
      encounters:[{key:uidf("e"),type:t,department:t==="nephro"?"":F.dept.value.trim(),location:F.location.value.trim(),date:d,status:"active",
        complaint:F.complaint.value.trim(),hpi:F.hpi.value.trim(),diagnosis:F.diagnosis.value.trim(),
        hdSched:t==="hd"?sched.get():"",hdSchedOther:t==="hd"&&sched.get()==="other"?schedOther.value.trim():"",
        vitalsLog:t!=="hd"&&Object.keys(v).length?[{date:d,...v}]:[],labs:t!=="hd"?labs.read(d):[],imaging:[],plan:t!=="hd"?plan:[],hd:[],images:[],events:[{when:d,text:t==="consult"?"Consult received":t==="hd"?"Added to regular HD list":"Admitted"}],meds:[],notes:"",edited:now()}]};
    patients.push(p);current=p.id;back="home";view="file";flash=true;render();scrollTo(0,0);
  };
  const sec=(title,...kids)=>el("div",{class:"fsec"},el("h3",{},title),...kids);
  const full=(title,...kids)=>{const x=sec(title,...kids);fullOnly.push(x);return x};
  return el("section",{class:"panel"},
    el("div",{class:"topbar"},el("h2",{},"New patient"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Back")),
    el("div",{class:"fgrid"},fld("Name",F.name,{req:true}),fld("National ID",F.nid,{hint:"Optional"}),fld("Phone",F.phone,{hint:"Optional"}),fld("Age",F.age),fld("Sex",F.sex),fld("Consultant",F.consultant,{hint:"Type or pick"})),
    sec("Admission",el("div",{class:"fgrid"},fld("Date",F.date),fld("Location",F.location,{hint:"Type a new one or pick a saved one"})),type,deptWrap,schedWrap),
    full("Personal history",el("div",{class:"fgrid"},fld("Occupation",F.occupation),fld("Residence",F.residence),fld("Marital status",F.marital),fld("Special habits",F.habits))),
    full("Present history",el("div",{class:"fgrid"},fld("Chief complaint / reason",F.complaint),fld("Provisional diagnosis",F.diagnosis)),fld("History of present illness",F.hpi)),
    full("Past history",el("div",{class:"fgrid"},fld("Medical",F.pastMedical),fld("Surgical / procedures",F.pastSurgical),fld("Drug history",F.drugs),fld("Allergies",F.allergies))),
    full("Vitals today",vit),
    full("Examination today",exam),
    full("Labs today",labs,el("small",{class:"sub"},"Fill only what you have. One-time tests can be added from the patient file.")),
    full("Plan checklist",planBlock(plan)),
    err,el("div",{class:"row"},el("button",{class:"primary",onclick:save},"Save patient"),el("button",{onclick:()=>{view="home";render()}},"Cancel")));
}

function fileView(){
  const p=cur();const box=el("section",{class:"panel"});
  box.append(el("div",{class:"topbar"},el("button",{class:"link",onclick:()=>{view=back==="file"?"home":back;editing=null;mini=null;render()}},back==="cons"?"← "+consView:back==="find"?"← Search":"← Home"),
    p.edited?el("span",{class:"edited"},"Last edited "+p.edited):null));
  if(editing==="patient"){box.append(patientEditor(p));return box}
  const e=latest(p);
  box.append(el("div",{class:"file-head"},
    el("div",{class:"who"},el("h2",{dir:"auto"},p.name),
      el("span",{class:"sub"},[p.age&&p.age+" y",p.sex==="M"?"Male":p.sex==="F"?"Female":"",p.encounters.length+(p.encounters.length===1?" encounter":" encounters")].filter(Boolean).join(" · ")),
      (p.nid||p.phone)?el("span",{class:"ids"},[p.nid&&"ID "+p.nid,p.phone&&"☎ "+p.phone].filter(Boolean).join("   ")):null,
      el("span",{class:"consult"},"Consultant: ",p.consultant?el("b",{},p.consultant):el("span",{class:"sub"},"not set"))),
    el("div",{class:"row"},
      e?.status!=="active"?el("button",{class:"small primary",onclick:()=>{mini={kind:"readmit"};render()}},"Re-admit / new consult"):null,
      el("button",{class:"small",onclick:()=>{mini={kind:"extract"};render()}},"Extract patient data"),
      el("button",{class:"small",onclick:()=>{editing="patient";mini=null;render()}},"Edit patient"))));
  if(mini?.kind==="readmit")box.append(readmitBox(p));
  if(mini?.kind==="extract")box.append(extractBox(p));
  const kv=pairs=>{const dl=el("dl",{class:"kv"});for(const[k,v]of pairs)if(v)dl.append(el("dt",{},k),el("dd",{},v));return dl.childNodes.length?dl:el("p",{class:"empty"},"—")};
  const ul=a=>a?.length?el("ul",{style:"margin:0;padding-left:18px;font-size:.9rem"},a.map(x=>el("li",{},x))):el("p",{class:"empty"},"—");
  const histCount=[p.pastMedical,p.pastSurgical,p.drugHistory].reduce((n,a)=>n+(a?.length||0),0);
  box.append(el("details",{class:"hist",...(openHist?{open:true}:{}),ontoggle:ev=>openHist=ev.target.open},
    el("summary",{},"Personal & past history",el("span",{class:"sub",style:"font-weight:400"},"  "+histCount+" item"+(histCount===1?"":"s")+(p.allergies?" · allergy noted":""))),el("div",{class:"grid2",style:"margin-top:10px"},
    el("div",{class:"sec"},el("h3",{},"Personal history"),kv([["Occupation",p.occupation],["Residence",p.residence],["Marital",p.marital],["Habits",p.habits]])),
    el("div",{class:"sec"},el("h3",{},"Past medical"),ul(p.pastMedical)),
    el("div",{class:"sec"},el("h3",{},"Surgical / procedures"),ul(p.pastSurgical)),
    el("div",{class:"sec"},el("h3",{},"Drug history"),ul(p.drugHistory),p.allergies?el("p",{style:"font-size:.9rem"},el("b",{},"Allergies: "),p.allergies):null))));
  [...p.encounters].reverse().forEach((en,i)=>box.append(editing===en.key?encEditor(p,en):encView(p,en,flash&&i===0)));
  return box;
}

function encView(p,e,isNew){if(e.type==="hd")return hdEncView(p,e,isNew);
  const box=el("article",{class:"enc"+(isNew?" new":"")});const C=e.type==="consult";const active=e.status==="active";const isLast=e===latest(p);
  box.append(el("div",{class:"enc-head"},pill(e),el("span",{class:"date"},fmtDate(e.date)),e.location?el("span",{class:"chip"},"📍 "+e.location):null,
    el("div",{class:"tools"},
      active?el("button",{class:"small primary",onclick:()=>{mini={kind:"update",key:e.key};render()}},"+ Today's update"):null,
      active&&isLast?el("button",{class:"small",onclick:()=>{mini={kind:"close",key:e.key};render()}},"Close encounter"):null,
      el("button",{class:"small",onclick:()=>{editing=e.key;mini=null;render()}},"Edit"))));
  if(!active)box.append(el("p",{class:"sub"},OUTCOMES[outcomeOf(e)]+" "+fmtDate(e.closeDate)+(e.closeNote?" — "+e.closeNote:"")));
  if(mini?.kind==="close"&&mini.key===e.key)box.append(closeBox(e));
  if(mini?.kind==="update"&&mini.key===e.key)box.append(updateBox(e));
  const dueHere=active?(e.plan||[]).filter(isDue):[];
  if(dueHere.length)box.append(el("div",{class:"alert",role:"status"},el("h2",{},"⏰ Due today"),el("p",{style:"font-size:.9rem"},dueHere.map(x=>x.text).join(" · ")),el("small",{class:"sub"},"Record the result or postpone it in the checklist below.")));
  if(e.edited)box.append(el("span",{class:"edited"},"Last edited "+e.edited));
  // present history
  box.append(fold(e,"present",el("div",{class:"sec"},el("h3",{},"Present history"),
    e.complaint?el("p",{},el("b",{},e.complaint)):null,e.hpi?el("p",{style:"font-size:.92rem"},e.hpi):null,
    e.diagnosis?el("p",{style:"font-size:.9rem"},el("span",{class:"sub"},"Diagnosis: "),e.diagnosis):null,
    !e.complaint&&!e.hpi&&!e.diagnosis?el("p",{class:"empty"},"—"):null),e.diagnosis?"":""));
  // plan checklist
  {const pl=e.plan||[];box.append(fold(e,"plan",planView(e,active),pl.length?pl.filter(x=>x.state==="done").length+"/"+pl.length+" done":""))}
  // vitals
  const add=(kind,label)=>active?el("button",{class:"small",onclick:()=>{mini={kind,key:e.key};render()}},label):null;
  const vs=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Daily vitals & examination"),add("vitals","+ Add vitals & exam")));
  if(mini?.kind==="vitals"&&mini.key===e.key)vs.append(vitalsBox(e));
  const vl=e.vitalsLog||[];
  const logTable=(cols,title)=>{const dated=vl.filter(x=>cols.some(([c])=>x[c]));if(!dated.length)return null;const dates=orderDates(dated);const rows=cols.filter(([c])=>dated.some(x=>x[c]));
    return el("div",{class:"sec"},el("span",{class:"sub",style:"font-size:.8rem;font-weight:600"},title),dayTable(dates,rows.map(([c,u])=>({name:c,unit:u,cells:dates.map(d=>{const x=dated.find(v=>(v.date||"")===d);return x?.[c]?{v:x[c]}:null})})),cols===ECOLS?"wrap":""))};
  const t1=logTable(VCOLS,"Vitals"),t2=logTable(ECOLS,"Examination");
  if(t1||t2)vs.append(...[t1,t2].filter(Boolean));else vs.append(el("p",{class:"empty"},"No vitals or examination yet."));
  box.append(fold(e,"vit",vs,vl.length?vl.length+" day"+(vl.length>1?"s":""):""));
  // labs
  const labs=e.labs||[],daily=labs.filter(l=>!isOnce(l)),once=labs.filter(isOnce);
  const ls=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Daily labs"),add("labs","+ Add labs")));
  if(mini?.kind==="labs"&&mini.key===e.key)ls.append(labsBox(e));
  if(daily.length){const dates=orderDates(daily);const names=[];for(const l of daily)if(!names.some(n=>lkey(n)===lkey(l.name)))names.push(l.name);
    ls.append(dayTable(dates,names.map(n=>{const its=daily.filter(l=>lkey(l.name)===lkey(n));
      return{name:n,unit:its.find(l=>l.unit)?.unit||"",cells:dates.map(d=>{const l=its.filter(x=>(x.date||"")===d).pop();return l?{v:l.value,f:flagOf(l)}:null})}})))}
  else ls.append(el("p",{class:"empty"},"No daily labs yet."));
  {const n=new Set(daily.map(l=>l.date)).size;box.append(fold(e,"labs",ls,n?n+" day"+(n>1?"s":""):""))}
  const os=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"One-time tests & imaging"),el("button",{class:"small",onclick:()=>{mini={kind:"once",key:e.key};render()}},"+ Add test / image")));
  if(mini?.kind==="once"&&mini.key===e.key)os.append(onceBox(e));
  const studies=[...once.map(l=>({o:l,name:l.name,res:l.value+(l.unit?" "+l.unit:""),date:l.date,f:flagOf(l)})),...(e.imaging||[]).map(m=>({o:m,name:m.test,res:m.result,date:m.date||""}))];
  if(studies.length){const tb=el("tbody");for(const st of studies)tb.append(el("tr",{},el("td",{},st.name),el("td",{style:"white-space:normal"},el("span",{class:"cell "+(st.f||"")},st.res)),el("td",{class:"date"},fmtDate(st.date)),
      el("td",{},st.o.imageId?el("button",{class:"thumb",style:"width:52px",onclick:()=>openViewer(st.name,st.date,st.o.imageId,()=>{Store.deleteImage(st.o.imageId);delete st.o.imageId;e.edited=now()})},el("img",{"data-img":st.o.imageId,alt:st.name})):"")));
    os.append(el("div",{class:"tablebox"},el("table",{},el("thead",{},el("tr",{},el("th",{},"TEST / STUDY"),el("th",{},"RESULT"),el("th",{},"DATE"),el("th",{},"IMAGE"))),tb)))}
  if(e.images?.length)os.append(el("div",{class:"gallery"},e.images.map(im=>el("button",{class:"thumb",onclick:()=>openViewer(im.title,im.date,im.imageId,()=>{Store.deleteImage(im.imageId);e.images=e.images.filter(x=>x!==im);e.edited=now()})},el("img",{"data-img":im.imageId,alt:im.title||"Image"}),el("span",{},(im.title||"Image")+" · "+fmtDate(im.date))))));
  if(!studies.length&&!e.images?.length)os.append(el("p",{class:"empty"},"None yet — e.g. HbA1c, PTH, viral markers, cultures, echo, X-ray. You can attach a photo to each."));
  box.append(fold(e,"once",os,(studies.length+(e.images?.length||0))||""));
  // HD sessions
  box.append(fold(e,"hd",hdSection(e,active),e.hd?.length||""));
  // events + meds
  const es=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Events"),el("button",{class:"small",onclick:()=>{mini={kind:"event",key:e.key};render()}},"+ Add event")));
  if(mini?.kind==="event"&&mini.key===e.key)es.append(eventBox(e));
  es.append(e.events?.length?el("ul",{class:"timeline"},e.events.map(x=>el("li",{},el("span",{class:"when"},fmtDate(x.when)),el("span",{},x.text)))):el("p",{class:"empty"},"No events yet."));
  box.append(fold(e,"events",es,e.events?.length||""),fold(e,"meds",medsView(e,active),(e.meds||[]).filter(m=>!m.stop).length+" current"));
  if(e.notes)box.append(fold(e,"notes",el("div",{class:"sec"},el("h3",{},"Notes"),el("p",{style:"font-size:.9rem"},e.notes))));
  return box;
}

function hdEncView(p,e,isNew){
  const box=el("article",{class:"enc"+(isNew?" new":"")});const active=e.status==="active";const isLast=e===latest(p);
  box.append(el("div",{class:"enc-head"},pill(e),el("span",{class:"date"},fmtDate(e.date)),e.location?el("span",{class:"chip"},"📍 "+e.location):null,
    el("div",{class:"tools"},active&&isLast?el("button",{class:"small",onclick:()=>{mini={kind:"close",key:e.key};render()}},"Close encounter"):null,
      el("button",{class:"small",onclick:()=>{editing=e.key;mini=null;render()}},"Edit"))));
  if(!active)box.append(el("p",{class:"sub"},OUTCOMES[outcomeOf(e)]+" "+fmtDate(e.closeDate)+(e.closeNote?" — "+e.closeNote:"")));
  if(mini?.kind==="close"&&mini.key===e.key)box.append(closeBox(e));
  box.append(el("p",{},el("span",{class:"sub"},"HD schedule: "),el("b",{},schedLabel(e)||"not set")));
  if(hdToday(e))box.append(el("div",{class:"alert",role:"status"},el("h2",{},"⏰ HD session due today")));
  box.append(fold(e,"hd",hdSection(e,active),e.hd?.length||""));
  const ls=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Labs"),active?el("button",{class:"small",onclick:()=>{mini={kind:"labs",key:e.key};render()}},"+ Add labs"):null));
  if(mini?.kind==="labs"&&mini.key===e.key)ls.append(labsBox(e,HD_TESTS));
  ls.append(labsTable(e.labs||[])||el("p",{class:"empty"},"No labs yet — e.g. CBC, K."));box.append(fold(e,"labs",ls,e.labs?.length?new Set(e.labs.map(l=>l.date)).size+" day(s)":""));
  const es=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Notes & events"),el("button",{class:"small",onclick:()=>{mini={kind:"event",key:e.key};render()}},"+ Add note")));
  if(mini?.kind==="event"&&mini.key===e.key)es.append(eventBox(e));
  es.append(e.events?.length?el("ul",{class:"timeline"},e.events.map(x=>el("li",{},el("span",{class:"when"},fmtDate(x.when)),el("span",{},x.text)))):el("p",{class:"empty"},"Nothing yet."));
  if(e.notes)es.append(el("p",{style:"font-size:.9rem"},e.notes));
  box.append(fold(e,"events",es,e.events?.length||""));return box;
}
function labsTable(labs){if(!labs.length)return null;const dates=orderDates(labs);const names=[];for(const l of labs)if(!names.some(n=>lkey(n)===lkey(l.name)))names.push(l.name);
  return dayTable(dates,names.map(n=>{const its=labs.filter(l=>lkey(l.name)===lkey(n));return{name:n,unit:its.find(l=>l.unit)?.unit||"",cells:dates.map(d=>{const l=its.filter(x=>(x.date||"")===d).pop();return l?{v:l.value,f:flagOf(l)}:null})}}))}
function hdSection(e,active){
  const hs=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"HD sessions"),active?el("button",{class:"small",onclick:()=>{mini={kind:"hd",key:e.key};render()}},"+ Add session"):null));
  if(mini?.kind==="hd"&&mini.key===e.key)hs.append(hdBox(e));
  if(e.hd?.length){const tb=el("tbody");const j=(a,b,sep=" → ")=>[a,b].filter(Boolean).join(sep);
    e.hd.forEach((h,i)=>tb.append(el("tr",{},el("td",{class:"v"},String(i+1)),el("td",{class:"date"},fmtDate(h.date)),
      el("td",{class:"v"},j(h.ordH&&h.ordH+" h",h.ordUF&&h.ordUF+" L"," / ")),el("td",{class:"v"},j(h.hours&&h.hours+" h",h.uf&&h.uf+" L"," / ")),
      el("td",{},h.access||""),el("td",{class:"v"},j(h.pre,h.post)),el("td",{class:"v"},h.hr||""),el("td",{class:"v"},j(h.wpre,h.wpost)),
      el("td",{},h.volume||""),el("td",{},h.notes||""))));
    hs.append(el("div",{class:"tablebox"},el("table",{class:"daytable"},el("thead",{},el("tr",{},...["#","DATE","ORDER h / UF","DONE h / UF","ACCESS","BP PRE → POST","HR","WT PRE → POST","VOLUME","NOTES"].map(h=>el("th",{},h)))),tb)))}
  else hs.append(el("p",{class:"empty"},"No sessions recorded."));
  return hs;
}
const medTxt=m=>[m.name,m.dose,m.freq].filter(Boolean).join(" · ");
function medsView(e,active){
  const meds=e.meds||(e.meds=[]);const cur=meds.filter(m=>!m.stop),old=meds.filter(m=>m.stop);
  const s=el("div",{class:"sec"},el("div",{class:"sec-head"},el("h3",{},"Medications"),active?el("button",{class:"small",onclick:()=>{mini={kind:"medadd",key:e.key};render()}},"+ Add medication"):null));
  if(mini?.kind==="medadd"&&mini.key===e.key)s.append(medAddBox(e));
  s.append(cur.length?el("ul",{class:"medlist"},cur.map(m=>{const li=el("li",{},el("span",{},medTxt(m)),m.start?el("span",{class:"since"},"since "+fmtDate(m.start)):null,
      active?el("span",{class:"acts"},el("button",{class:"small",onclick:()=>{mini={kind:"medchg",key:e.key,m};render()}},"Change"),el("button",{class:"small",onclick:()=>{mini={kind:"medstop",key:e.key,m};render()}},"Stop")):null);
    if(mini?.m===m&&mini.kind==="medchg")li.append(medChangeBox(e,m));if(mini?.m===m&&mini.kind==="medstop")li.append(medStopBox(e,m));return li})):el("p",{class:"empty"},"No current medications."));
  if(old.length)s.append(el("details",{class:"src"},el("summary",{},"Medication history this admission ("+old.length+")"),
    el("ul",{class:"medlist old",style:"margin-top:6px"},old.map(m=>el("li",{},el("span",{style:"text-decoration:line-through"},medTxt(m)),el("span",{class:"since"},(m.start?fmtDate(m.start):"")+" → "+fmtDate(m.stop)),m.note?el("span",{},"— "+m.note):null)))));
  return s}
function medAddBox(e){const n=inp("",{placeholder:"Drug"}),d=inp("",{placeholder:"e.g. 40 mg"}),f=inp("",{placeholder:"e.g. 1×2, q12h"}),dt=dateIn();
  return el("div",{class:"minibox"},el("div",{class:"fgrid"},fld("Drug",n),fld("Dose",d),fld("Frequency",f),fld("Start",dt)),actions(()=>{if(!n.value.trim())return;
    const m={name:n.value.trim(),dose:d.value.trim(),freq:f.value.trim(),start:dt.value};e.meds.push(m);e.events.push({when:dt.value,text:"Started "+medTxt(m)});e.edited=now();mini=null;render()},"Add"))}
function medChangeBox(e,m){const d=inp(m.dose),f=inp(m.freq),dt=dateIn(),why=inp("",{placeholder:"Reason (optional)"});
  return el("div",{class:"minibox"},el("div",{class:"fgrid"},fld("New dose",d),fld("New frequency",f),fld("From",dt),fld("Reason",why)),actions(()=>{
    const nm={name:m.name,dose:d.value.trim(),freq:f.value.trim(),start:dt.value};m.stop=dt.value;m.note="Changed to "+[nm.dose,nm.freq].filter(Boolean).join(" ")+(why.value.trim()?" ("+why.value.trim()+")":"");
    e.meds.push(nm);e.events.push({when:dt.value,text:m.name+": "+[m.dose,m.freq].filter(Boolean).join(" ")+" → "+[nm.dose,nm.freq].filter(Boolean).join(" ")+(why.value.trim()?" ("+why.value.trim()+")":"")});e.edited=now();mini=null;render()},"Save change"))}
function medStopBox(e,m){const dt=dateIn(),why=inp("",{placeholder:"Reason (optional)"});
  return el("div",{class:"minibox"},el("div",{class:"fgrid"},fld("Stop date",dt),fld("Reason",why)),actions(()=>{m.stop=dt.value;m.note="Stopped"+(why.value.trim()?": "+why.value.trim():"");
    e.events.push({when:dt.value,text:"Stopped "+medTxt(m)+(why.value.trim()?" ("+why.value.trim()+")":"")});e.edited=now();mini=null;render()},"Stop drug"))}
const openSecs=new Set();
const MINI_SEC={vitals:"vit",labs:"labs",once:"once",hd:"hd",event:"events",medadd:"meds",medchg:"meds",medstop:"meds",plan:"plan",result:"plan",postpone:"plan"};
function fold(e,id,sec,count){
  const k=e.key+":"+id;const head=sec.querySelector(":scope>.sec-head");const titleEl=sec.querySelector(":scope>h3")||head?.querySelector("h3");
  const title=titleEl?.textContent||id;const tools=head?[...head.querySelectorAll(":scope>button, :scope>.row")]:[];
  if(head)head.remove();else titleEl?.remove();
  const forced=mini?.key===e.key&&MINI_SEC[mini.kind]===id;
  const d=el("details",{class:"fold",...((openSecs.has(k)||forced)?{open:true}:{}),ontoggle:ev=>{ev.target.open?openSecs.add(k):openSecs.delete(k)}},
    el("summary",{},el("span",{},title),count?el("span",{class:"cnt"},count):null));
  const body=el("div",{class:"sec fold-body"});if(tools.length)body.append(el("div",{class:"row",style:"justify-content:flex-end"},...tools));
  body.append(...sec.childNodes);d.append(body);return d}
function planView(e,active){
  const s=el("div",{class:"sec"});const list=e.plan||(e.plan=[]);const done=list.filter(x=>x.state==="done").length;
  s.append(el("div",{class:"sec-head"},el("h3",{},(e.type==="consult"?"Recommendations":"Plan")+" checklist"),
    el("div",{class:"row"},list.length?el("span",{class:"progress"},done+"/"+list.length+" done"):null,active?el("button",{class:"small",onclick:()=>{mini={kind:"plan",key:e.key};render()}},"+ Add item"):null)));
  if(mini?.kind==="plan"&&mini.key===e.key){const tmp=[];s.append(el("div",{class:"minibox"},planBlock(tmp),el("div",{class:"row"},
    el("button",{class:"primary small",onclick:()=>{list.push(...tmp);e.edited=now();mini=null;render()}},"Add to plan"),el("button",{class:"small",onclick:()=>{mini=null;render()}},"Cancel"))))}
  if(list.length){s.append(el("ul",{class:"check"},list.map((it,idx)=>{const st=STATES.find(x=>x[0]===it.state)||STATES[0];
    const li=el("li",{class:it.state},el("button",{class:"state "+st[0],title:"Tap to change status","aria-label":it.text+": "+st[1]+". Tap to change.",onclick:()=>{const i=STATES.findIndex(x=>x[0]===it.state);it.state=STATES[(i+1)%3][0];e.edited=now();render()}},st[1]),
      el("span",{class:"txt"},it.text),
      it.state!=="done"&&dueInfo(it)?dueTag(dueInfo(it)):null,
      it.state==="todo"&&it.due&&!dueInfo(it)?el("span",{class:"due"},"do "+fmtDate(it.due)):null,
      it.state!=="done"&&it.resultDue&&!(dueInfo(it)?.kind==="Result due")?el("span",{class:"due"},"result "+fmtDate(it.resultDue)):null,
      active&&it.state!=="done"?el("span",{class:"acts"},
        el("button",{class:"small",onclick:()=>{mini={kind:"result",key:e.key,idx};render()}},"Result"),
        el("button",{class:"small",onclick:()=>{mini={kind:"postpone",key:e.key,idx};render()}},"Postpone")):null,
      it.result?el("span",{class:"res"},"Result: "+it.result+(it.doneDate?" ("+fmtDate(it.doneDate)+")":"")):null,
      it.postponed?el("span",{class:"res"},"Postponed: "+it.postponed):null);
    if(mini?.key===e.key&&mini.idx===idx&&mini.kind==="result")li.append(resultBox(e,it));
    if(mini?.key===e.key&&mini.idx===idx&&mini.kind==="postpone")li.append(postponeBox(e,it));
    return li})));
    s.append(el("small",{class:"sub"},"Tap a status to move it: Pending → In progress → Done."))}
  else s.append(el("p",{class:"empty"},"Nothing planned yet."));
  return s;
}

function dayTable(dates,rows,cls=""){
  const tb=el("tbody");
  for(const r of rows)tb.append(el("tr",{},el("td",{class:"name"},r.name),...r.cells.map(c=>el("td",{class:"v"},c?el("span",{class:"cell "+(c.f||"")},c.v+(c.f==="H"?" ↑":c.f==="L"?" ↓":"")):"·")),el("td",{class:"u"},r.unit)));
  return el("div",{class:"tablebox"},el("table",{class:"daytable "+cls},el("thead",{},el("tr",{},el("th",{},""),...dates.map(d=>el("th",{class:"day"},fmtDate(d))),el("th",{},""))),tb));
}

/* ---------- mini forms ---------- */
const dateIn=()=>el("input",{type:"date",value:today(),style:"width:auto"});
const actions=(onSave,label)=>el("div",{class:"row"},el("button",{class:"primary small",onclick:onSave},label),el("button",{class:"small",onclick:()=>{mini=null;render()}},"Cancel"));
function vitalsBox(e){const d=dateIn(),g=vitalsBlock(),x=examBlock();return el("div",{class:"minibox"},fld("Date",d),el("h3",{},"Vitals"),g,el("h3",{},"Examination"),x,actions(()=>{saveLog(e,x.read(d.value));const v=g.read(d.value);
  if(v){const x=e.vitalsLog.find(y=>y.date===v.date);x?Object.assign(x,v):e.vitalsLog.push(v);e.edited=now()}mini=null;render()},"Save vitals"))}
const HD_TESTS=DAILY_TESTS.filter(([t])=>["Hb","PLT","TLC","K","Na","Urea","Creatinine","Ca","Phos"].includes(t));
function labsBox(e,tests){const d=dateIn(),g=labsBlock(tests);return el("div",{class:"minibox"},fld("Date",d),g,actions(()=>{for(const l of g.read(d.value)){
  const i=e.labs.findIndex(x=>x.date===l.date&&lkey(x.name)===lkey(l.name));i>=0?e.labs[i]=l:e.labs.push(l)}e.edited=now();mini=null;render()},"Save labs"))}
function onceBox(e){const d=dateIn(),n=inp("",{placeholder:"e.g. HbA1c, Echo, Chest X-ray, Blood culture"}),v=area("",{placeholder:"Result (can be added later)"}),u=inp("",{placeholder:"Unit (optional)"}),
  f=el("input",{type:"file",accept:"image/*"}),st=el("p",{class:"sub"});
  return el("div",{class:"minibox"},el("div",{class:"fgrid"},fld("Test / study",n),fld("Unit",u),fld("Date",d)),fld("Result",v),fld("Photo (optional)",f,{hint:"X-ray, ECG, report or result sheet"}),st,
    actions(async()=>{if(!n.value.trim()){st.textContent="Write the test or study name.";return}
      let image="";if(f.files[0]){st.textContent="Preparing image…";try{image=await shrink(f.files[0])}catch{st.textContent="That file couldn't be opened as an image.";return}}
      const rec={date:d.value,name:n.value.trim(),value:v.value.trim(),unit:u.value.trim(),once:true};if(image){st.textContent="Saving image…";try{rec.imageId=await Store.saveImage(image)}catch{st.textContent="Couldn't save the image — check the connection and try again.";return}}
      e.labs.push(rec);e.edited=now();mini=null;render()},"Save"))}
function hdBox(e){const d=dateIn(),last=(e.hd||[]).slice(-1)[0]||{};
  const f={ordH:inp(last.ordH||"",{inputmode:"decimal",placeholder:"4"}),ordUF:inp(last.ordUF||"",{inputmode:"decimal",placeholder:"2.5"}),hours:inp("",{inputmode:"decimal"}),uf:inp("",{inputmode:"decimal"}),
    access:sel(["",...ACCESS],last.access||""),pre:inp("",{placeholder:"140/80"}),post:inp("",{placeholder:"120/70"}),hr:inp("",{inputmode:"numeric"}),
    wpre:inp("",{inputmode:"decimal",placeholder:"kg"}),wpost:inp("",{inputmode:"decimal",placeholder:"kg"}),
    volume:area("",{placeholder:"Oedema, chest, JVP, O2 — e.g. mild LL oedema, basal creps"}),notes:area("",{placeholder:"Hypotension, cramps, access problem, stopped early…"})};
  return el("div",{class:"minibox"},fld("Date",d),
    el("h3",{},"Order"),el("div",{class:"fgrid"},fld("Duration (h)",f.ordH),fld("UF target (L)",f.ordUF),fld("Access",f.access)),
    el("h3",{},"Done"),el("div",{class:"fgrid"},fld("Actual duration (h)",f.hours,{hint:"Leave blank if as ordered"}),fld("Actual UF (L)",f.uf)),
    el("h3",{},"Vitals"),el("div",{class:"fgrid"},fld("BP pre",f.pre),fld("BP post",f.post),fld("HR",f.hr),fld("Weight pre",f.wpre),fld("Weight post",f.wpost)),
    fld("Volume assessment",f.volume),fld("What happened in the session",f.notes),
    actions(()=>{const h={date:d.value};for(const k in f)h[k]=f[k].value.trim();if(!h.hours)h.hours=h.ordH;if(!h.uf)h.uf=h.ordUF;
      e.hd.push(h);const it=(e.plan||[]).find(x=>/hd session/i.test(x.text)&&x.state==="todo");if(it)it.state="doing";
      if(h.notes)e.events.push({when:d.value,text:"HD: "+h.notes});e.edited=now();mini=null;render()},"Save session"))}
function eventBox(e){const d=dateIn(),t=area("",{placeholder:"What happened"});return el("div",{class:"minibox"},fld("Date",d),fld("Event",t),actions(()=>{
  if(t.value.trim()){e.events.push({when:d.value,text:t.value.trim()});e.edited=now()}mini=null;render()},"Save event"))}
function shrink(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{
  const m=1400,s=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",0.72))};img.src=r.result};r.readAsDataURL(file)})}
function openViewer(title,date,imgId,onDelete){const v=el("div",{class:"viewer",role:"dialog","aria-label":title||"Image"});const close=()=>v.remove();
  const del=twoTap(el("button",{class:"small danger"},"Delete image"),"Tap again to delete",()=>{onDelete();close();render()});
  v.append(el("img",{"data-img":imgId,alt:title||"Image"}),el("p",{},(title||"Image")+" · "+fmtDate(date)),el("div",{class:"row"},el("button",{class:"small",onclick:close},"Close"),del));
  v.onclick=ev=>{if(ev.target===v)close()};document.addEventListener("keydown",function k(ev){if(ev.key==="Escape"){close();document.removeEventListener("keydown",k)}});document.body.append(v);hydrateImgs(v)}
function closeBox(e){const C=e.type==="consult";const d=dateIn(),n=inp("",{placeholder:"Note (optional) — e.g. stable, follow up in HD unit / transferred to Cardiology"});
  const opts=C?[["signedoff","Signed off"],["died","Died"]]:[["discharged","Discharged"],["died","Died"],["offservice","No longer under nephrology"]];
  const o=seg("out"+e.key,opts,opts[0][0]);
  return el("div",{class:"minibox"},el("h3",{},"Close encounter"),o,el("div",{class:"fgrid"},fld("Date",d),fld("Note",n)),
    actions(()=>{const oc=o.get();e.status="closed";e.outcome=oc;e.closeDate=d.value;e.closeNote=n.value.trim();e.events.push({when:d.value,text:OUTCOMES[oc]+(e.closeNote?": "+e.closeNote:"")});e.edited=now();mini=null;render()},"Confirm"))}
function readmitBox(p){const d=dateIn(),loc=inp("",{list:"dl-locations",placeholder:"Type or pick"}),dept=inp("",{list:"dl-departments"}),why=inp("",{placeholder:"Reason / consult question"}),err=el("p",{class:"err"});
  const type=seg("rtype",TYPE_OPTS,"nephro");const dw=fld("Department",dept,{req:true});dw.hidden=true;type.onchange=()=>dw.hidden=type.get()==="nephro";
  return el("div",{class:"minibox"},el("h3",{},"New encounter"),type,el("small",{class:"sub"},"For HD-only, set the schedule from Edit after starting."),el("div",{class:"fgrid"},fld("Date",d),fld("Location",loc),dw),fld("Reason",why),err,
    actions(()=>{const t=type.get();if(t!=="nephro"&&!dept.value.trim()){err.textContent="Add the department.";return}
      p.encounters.push({key:uidf("e"),type:t,department:t==="nephro"?"":dept.value.trim(),location:loc.value.trim(),date:d.value,status:"active",complaint:why.value.trim(),hpi:"",diagnosis:"",
        vitalsLog:[],labs:[],imaging:[],plan:[],hd:[],images:[],events:[{when:d.value,text:(t==="consult"?"Consult received":"Re-admitted")+(why.value.trim()?": "+why.value.trim():"")}],meds:[],notes:"",edited:now()});
      mini=null;flash=true;render()},"Start"))}

function resultBox(e,it){const v=area("",{placeholder:"Result / outcome"}),d=dateIn();const b=el("div",{class:"minibox",style:"flex-basis:100%"},fld("Result",v),fld("Date",d),
  actions(()=>{it.result=v.value.trim();it.state="done";it.doneDate=d.value;if(it.result)e.events.push({when:d.value,text:it.text+": "+it.result});e.edited=now();mini=null;render()},"Save & mark done"));return b}
function postponeBox(e,it){const forResult=it.state!=="todo";const cur=forResult?it.resultDue:it.due;
  const d=el("input",{type:"date",value:cur&&cur>today()?cur:today(),style:"width:auto"}),why=inp("",{placeholder:"Reason (optional)"});
  return el("div",{class:"minibox",style:"flex-basis:100%"},el("div",{class:"fgrid"},fld(forResult?"New result date":"New date to do / draw",d),fld("Reason",why)),
    actions(()=>{if(forResult)it.resultDue=d.value;else it.due=d.value;
      const msg=(forResult?"result ":"")+(cur?fmtDate(cur)+" → ":"")+fmtDate(d.value)+(why.value.trim()?" ("+why.value.trim()+")":"");it.postponed=msg;
      e.events.push({when:today(),text:"Postponed "+it.text+": "+msg});e.edited=now();mini=null;render()},"Postpone"))}
function updateBox(e){const d=dateIn(),ev=area("",{placeholder:"What happened today (optional)"}),vg=vitalsBlock(),xg=examBlock(),lg=labsBlock();
  const due=(e.plan||[]).filter(isDue);
  return el("div",{class:"minibox"},el("h3",{},"Today's update"),fld("Date",d),
    due.length?el("p",{class:"sub"},"Due today: "+due.map(x=>x.text).join(", ")+" — record results in the checklist."):null,
    fld("Events",ev),el("h3",{},"Vitals"),vg,el("h3",{},"Examination"),xg,el("h3",{},"Labs"),lg,
    actions(()=>{const day=d.value;if(ev.value.trim())e.events.push({when:day,text:ev.value.trim()});
      saveLog(e,vg.read(day),xg.read(day));
      for(const l of lg.read(day)){const i=e.labs.findIndex(x=>x.date===l.date&&lkey(x.name)===lkey(l.name));i>=0?e.labs[i]=l:e.labs.push(l)}
      e.edited=now();mini=null;render()},"Save update"))}
function summaryText(p,e){
  const L=[];const sx=p.sex==="M"?"male":p.sex==="F"?"female":"";
  L.push([p.age&&p.age+"-year-old",sx,"patient"].filter(Boolean).join(" ")+(p.name?" — "+p.name:""));
  if(p.nid||p.phone)L.push([p.nid&&"National ID: "+p.nid,p.phone&&"Phone: "+p.phone].filter(Boolean).join(" · "));
  if(p.consultant)L.push("Consultant: "+p.consultant);
  if(e)L.push(typeLabel(e)+(e.location?" — "+e.location:"")+" — since "+fmtDate(e.date)+(e.status!=="active"?" ("+OUTCOMES[outcomeOf(e)]+" "+fmtDate(e.closeDate)+(e.closeNote?": "+e.closeNote:"")+")":""));
  const per=[p.occupation&&"Occupation: "+p.occupation,p.residence&&"Residence: "+p.residence,p.marital&&"Marital status: "+p.marital,p.habits&&"Special habits: "+p.habits].filter(Boolean);
  if(per.length)L.push("","PERSONAL HISTORY",...per);
  if(p.pastMedical.length||p.pastSurgical.length||p.drugHistory.length||p.allergies){L.push("","PAST HISTORY");
    if(p.pastMedical.length)L.push("Known case of: "+p.pastMedical.join("; "));
    if(p.pastSurgical.length)L.push("Surgical / procedures: "+p.pastSurgical.join("; "));
    if(p.drugHistory.length)L.push("Drug history: "+p.drugHistory.join("; "));
    if(p.allergies)L.push("Allergies: "+p.allergies)}
  if(!e)return L.join("\n");
  if(e.complaint||e.hpi||e.diagnosis){L.push("","PRESENT HISTORY");if(e.complaint)L.push("Reason: "+e.complaint);if(e.hpi)L.push(e.hpi);if(e.diagnosis)L.push("Diagnosis: "+e.diagnosis)}
  if(e.events?.length){L.push("","EVENTS");for(const x of e.events)L.push(fmtDate(x.when)+": "+x.text)}
  const vl=e.vitalsLog||[];if(vl.length){const v=vl.slice().sort((a,b)=>(a.date>b.date?1:-1)).pop();L.push("","LATEST VITALS & EXAM ("+fmtDate(v.date)+")");
    const vv=VCOLS.filter(([c])=>v[c]).map(([c,u])=>c+" "+v[c]+(u?" "+u:"")).join(" · ");if(vv)L.push(vv);
    const ex=ECOLS.filter(([c])=>v[c]).map(([c,u])=>c+": "+v[c]+(u?" "+u:""));if(ex.length)L.push("Examination — "+ex.join(" · "))}
  const daily=(e.labs||[]).filter(l=>!isOnce(l));if(daily.length){const dates=orderDates(daily);L.push("","LABS");
    for(const d of dates)L.push(fmtDate(d)+": "+daily.filter(l=>(l.date||"")===d).map(l=>l.name+" "+l.value+(flagOf(l)==="H"?"↑":flagOf(l)==="L"?"↓":"")).join(", "))}
  const once=(e.labs||[]).filter(isOnce),img=e.imaging||[];if(once.length||img.length){L.push("","INVESTIGATIONS");
    for(const l of once)L.push(l.name+": "+l.value+(l.unit?" "+l.unit:"")+(l.date?" ("+fmtDate(l.date)+")":""));for(const m of img)L.push(m.test+": "+m.result)}
  if(e.type==="hd")L.push("HD schedule: "+(schedLabel(e)||"not set"));
  if(e.hd?.length){L.push("","HD SESSIONS ("+e.hd.length+")");e.hd.forEach((h,i)=>L.push((i+1)+". "+fmtDate(h.date)+[h.ordH&&"order "+h.ordH+" h / UF "+(h.ordUF||"?")+" L",h.hours&&"done "+h.hours+" h",h.uf&&"UF "+h.uf+" L",h.access,(h.pre||h.post)&&"BP "+[h.pre,h.post].filter(Boolean).join("→"),h.hr&&"HR "+h.hr,(h.wpre||h.wpost)&&"Wt "+[h.wpre,h.wpost].filter(Boolean).join("→"),h.volume&&"Volume: "+h.volume,h.notes].filter(Boolean).map(x=>" · "+x).join("")))}
  const curM=(e.meds||[]).filter(m=>!m.stop),oldM=(e.meds||[]).filter(m=>m.stop);
  if(curM.length){L.push("","MEDICATIONS");for(const m of curM)L.push([m.name,m.dose,m.freq].filter(Boolean).join(" "))}
  if(oldM.length){L.push("","STOPPED / CHANGED THIS ADMISSION");for(const m of oldM)L.push([m.name,m.dose,m.freq].filter(Boolean).join(" ")+" — "+fmtDate(m.stop)+(m.note?" ("+m.note+")":""))}
  if(e.plan?.length){L.push("",e.type==="consult"?"RECOMMENDATIONS":"PLAN");for(const it of e.plan)L.push((it.state==="done"?"✔ ":it.state==="doing"?"◐ ":"☐ ")+it.text+(it.result?" — "+it.result:"")+(it.state!=="done"&&it.due?" (due "+fmtDate(it.due)+")":""))}
  if(e.notes)L.push("","NOTES",e.notes);
  return L.join("\n");
}
function extractBox(p){
  const encs=[...p.encounters].reverse();const pick=sel(encs.map((e,i)=>[String(i),typeLabel(e)+" · "+fmtDate(e.date)]),"0");
  const nameOn=el("input",{type:"checkbox",checked:true,id:nid(),style:"width:auto"});
  const ta=area("",{class:"mono",style:"min-height:260px",readonly:true});const st=el("span",{class:"sub","aria-live":"polite"});
  const fill=()=>{const q=nameOn.checked?p:{...p,name:"",nid:"",phone:""};ta.value=summaryText(q,encs[+pick.value])};pick.onchange=fill;nameOn.onchange=fill;fill();
  const copy=el("button",{class:"primary small",onclick:()=>{const done=()=>st.textContent="Copied — paste it in WhatsApp or anywhere.";
    try{navigator.clipboard.writeText(ta.value).then(done,()=>{ta.focus();ta.select();st.textContent="Text selected — press copy on your keyboard."})}catch{ta.focus();ta.select();st.textContent="Text selected — press copy on your keyboard."}}},"Copy");
  return el("div",{class:"minibox"},el("h3",{},"Patient summary"),el("div",{class:"row"},encs.length>1?fld("Encounter",pick):null,el("label",{for:nameOn.id,class:"row",style:"gap:6px"},nameOn,"Include name, ID and phone")),
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
function patientEditor(p){
  const F={name:inp(p.name,{dir:"auto"}),nid:inp(p.nid,{class:"mono"}),phone:inp(p.phone,{class:"mono"}),age:inp(p.age),sex:sel([["","—"],["M","Male"],["F","Female"]],p.sex),consultant:inp(p.consultant,{list:"dl-consultants"}),
    occupation:inp(p.occupation),residence:inp(p.residence),marital:sel(["","Single","Married","Divorced","Widowed"],p.marital||""),habits:inp(p.habits),
    pastMedical:area(toLines(p.pastMedical)),pastSurgical:area(toLines(p.pastSurgical)),drugs:area(toLines(p.drugHistory)),allergies:inp(p.allergies)};
  const err=el("p",{class:"err"});
  return editorShell("Edit patient",el("div",{class:"sec"},
    el("div",{class:"fgrid"},fld("Name",F.name,{req:true}),fld("National ID",F.nid),fld("Phone",F.phone),fld("Age",F.age),fld("Sex",F.sex),fld("Consultant",F.consultant),
      fld("Occupation",F.occupation),fld("Residence",F.residence),fld("Marital status",F.marital),fld("Special habits",F.habits)),
    el("div",{class:"fgrid"},fld("Past medical",F.pastMedical,{hint:"One per line"}),fld("Surgical / procedures",F.pastSurgical,{hint:"One per line"}),fld("Drug history",F.drugs,{hint:"One per line"}),fld("Allergies",F.allergies)),err),
  ()=>{if(!F.name.value.trim()){err.textContent="Name is required.";return}
    Object.assign(p,{name:F.name.value.trim(),nid:F.nid.value.trim(),phone:F.phone.value.trim(),age:F.age.value.trim(),sex:F.sex.value,consultant:F.consultant.value.trim(),
      occupation:F.occupation.value.trim(),residence:F.residence.value.trim(),marital:F.marital.value,habits:F.habits.value.trim(),
      pastMedical:lines(F.pastMedical.value),pastSurgical:lines(F.pastSurgical.value),drugHistory:lines(F.drugs.value),allergies:F.allergies.value.trim(),edited:now()});
    editing=null;render()},Store.isAdmin?twoTap(el("button",{class:"danger",style:"margin-left:auto"},"Delete patient"),"Sure? This removes the whole file for everyone",()=>{patients=patients.filter(x=>x!==p);delete lastJSON[p.id];Store.deletePatient(p.id);editing=null;view="home";render()}):null);
}
const MEDC=["name","dose","freq","start","stop","note"];
const HDC=["date","ordH","ordUF","hours","uf","access","pre","post","hr","wpre","wpost","volume","notes"];
function encEditor(p,e){
  const VK=ALLCOLS.map(c=>c[0]);
  const F={date:el("input",{type:"date",value:ISO.test(e.date)?e.date:""}),location:inp(e.location,{list:"dl-locations"}),dept:inp(e.department,{list:"dl-departments"}),
    complaint:inp(e.complaint),diagnosis:inp(e.diagnosis),hpi:area(e.hpi),
    plan:area(toLines(e.plan,["text","state","due","resultDue","result"]),{class:"mono"}),vitals:area(toLines(e.vitalsLog,["date",...VK]),{class:"mono"}),
    labs:area(toLines(e.labs.map(l=>({...l,once:isOnce(l)?"once":""})),["date","name","value","unit","once"]),{class:"mono"}),
    imaging:area(toLines(e.imaging,["test","result","date"]),{class:"mono"}),hd:area(toLines(e.hd,HDC),{class:"mono"}),
    events:area(toLines(e.events,["when","text"]),{class:"mono"}),meds:area(toLines(e.meds,MEDC),{class:"mono"}),notes:area(e.notes)};
  const type=seg("etype"+e.key,TYPE_OPTS,e.type);const sched=seg("esched"+e.key,[["smw","Sat / Mon / Wed"],["stt","Sun / Tue / Thu"],["other","Other"]],e.hdSched||"smw");const so=inp(e.hdSchedOther||"",{placeholder:"Other schedule"});
  const del=twoTap(el("button",{class:"danger",style:"margin-left:auto"},"Delete encounter"),"Sure? Tap again",()=>{p.encounters=p.encounters.filter(x=>x!==e);editing=null;render()});
  return editorShell("Edit encounter",el("div",{class:"sec"},type,el("div",{class:"sec"},el("h3",{},"HD schedule (HD-only patients)"),sched,so),
    el("div",{class:"fgrid"},fld("Date",F.date),fld("Location",F.location),fld("Department",F.dept,{hint:"For co-admissions and consults"}),fld("Chief complaint / reason",F.complaint),fld("Diagnosis",F.diagnosis)),
    fld("History of present illness",F.hpi),
    el("div",{class:"fgrid"},
      fld("Plan checklist",F.plan,{hint:"item | todo / doing / done | do date | result date | result (dates YYYY-MM-DD)"}),fld("Medications",F.meds,{hint:MEDC.join(" | ")+" (dates YYYY-MM-DD; a stop date moves it to history)"}),
      fld("Daily vitals",F.vitals,{hint:"date | "+ALLCOLS.map(c=>c[0]).join(" | ")}),fld("Labs",F.labs,{hint:"date | test | value | unit | once (blank = daily)"}),
      fld("Imaging & studies",F.imaging,{hint:"study | result | date"}),fld("HD sessions",F.hd,{hint:HDC.join(" | ")}),
      fld("Events",F.events,{hint:"date | what happened"}),fld("Notes",F.notes))),
  ()=>{Object.assign(e,{type:type.get(),date:F.date.value||e.date,location:F.location.value.trim(),department:type.get()==="nephro"?"":F.dept.value.trim(),
      complaint:F.complaint.value.trim(),diagnosis:F.diagnosis.value.trim(),hpi:F.hpi.value.trim(),notes:F.notes.value.trim(),
      plan:fromLines(F.plan.value,["text","state","due","resultDue","result"]).map(x=>({text:x.text,state:["todo","doing","done"].includes(x.state)?x.state:"todo",due:ISO.test(x.due)?x.due:"",resultDue:ISO.test(x.resultDue)?x.resultDue:"",result:x.result})),
      vitalsLog:fromLines(F.vitals.value,["date",...VK]).map(v=>Object.fromEntries(Object.entries(v).filter(([,x])=>x))),
      labs:fromLines(F.labs.value,["date","name","value","unit","once"]).filter(l=>l.name).map(l=>({...l,once:l.once.toLowerCase()==="once"})),
      imaging:fromLines(F.imaging.value,["test","result","date"]),hd:fromLines(F.hd.value,HDC),hdSched:type.get()==="hd"?sched.get():e.hdSched,hdSchedOther:so.value.trim(),
      events:fromLines(F.events.value,["when","text"]),meds:fromLines(F.meds.value,MEDC).map(m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v))),edited:now()});
    editing=null;render()},del);
}


/* ---------- team access (admins) ---------- */
function adminView(){
  const box=el("section",{class:"panel"},el("div",{class:"topbar"},el("h2",{},"Team access"),el("button",{class:"link",onclick:()=>{view="home";render()}},"← Home")));
  if(!Store.isAdmin){box.append(el("p",{class:"empty"},"Only admins can manage access."));return box}
  const list=el("div",{class:"plist"},el("p",{class:"sub"},"Loading…"));
  const email=inp("",{type:"email",placeholder:"doctor@gmail.com",dir:"ltr"});const role=sel([["member","Member"],["admin","Admin"]],"member");const st=el("p",{class:"sub","aria-live":"polite"});
  const load=()=>Store.listAllowed().then(rows=>{list.replaceChildren(...rows.map(x=>el("div",{class:"prow",style:"cursor:default"},el("div",{},el("div",{class:"nm",dir:"ltr"},x.email),el("div",{class:"meta"},x.role==="admin"?"Admin":"Member")),
    x.email===Store.email?el("span",{class:"sub"},"you"):twoTap(el("button",{class:"small danger"},"Remove"),"Tap again",()=>Store.removeAllowed(x.email).then(load)))))}).catch(()=>list.replaceChildren(el("p",{class:"err"},"Couldn't load the list.")));
  load();
  box.append(el("p",{class:"sub"},"Only these emails can open patient data. Each doctor signs up with the same email and confirms it from their inbox."),
    el("div",{class:"fgrid"},fld("Email",email),fld("Role",role)),
    el("div",{class:"row"},el("button",{class:"primary small",onclick:()=>{const v=email.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(v)){st.textContent="Write a valid email.";return}
      Store.setAllowed(v,role.value).then(()=>{email.value="";st.textContent="Added "+v+".";load()}).catch(()=>st.textContent="Couldn't add — check the connection.")}},"Add"),st),list,
    el("div",{class:"fsec"},el("h3",{},"Testing"),el("p",{class:"sub"},"Adds the placeholder patients so the team can try the app. Delete them later from each patient's Edit."),
      twoTap(el("button",{class:"small"},"Load sample patients"),"Tap again to add them",()=>{patients.push(...makeSamples());view="home";render()})));
  return box;
}
window.startApp=function(){render()};
