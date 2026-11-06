# Renal Ward Log — خطوات التركيب

الملفات اللي في الفولدر ده هي الأبلكيشن كامل. محتاجة **كمبيوتر** و**إيميل جوجل خاص بالقسم**، وحوالي ٢٠ دقيقة. أسامي الزراير مكتوبة بالإنجليزي زي ما هتظهر لك.

## ١. اعملي مشروع Firebase (مجاني، من غير كارت)
1. ادخلي على https://console.firebase.google.com بإيميل القسم.
2. **Create a project** ← اكتبي اسم زي `renal-ward-log` ← اقفلي Google Analytics ← **Create project**.

## ٢. فعّلي تسجيل الدخول
1. من القايمة الجانبية: **Build ← Authentication ← Get started**.
2. تبويب **Sign-in method** ← **Email/Password** ← فعّلي أول اختيار ← **Save**.

## ٣. اعملي قاعدة البيانات
1. **Build ← Firestore Database ← Create database**.
2. اختاري مكان قريب (مثلاً `europe-west`) ← **Start in production mode** ← **Create**.
3. تبويب **Rules**: امسحي اللي مكتوب، والصقي محتوى ملف `firestore.rules` كله ← **Publish**.
4. تبويب **Data** ← **Start collection**:
   - Collection ID: `allowed`
   - Document ID: **إيميلك انتي بحروف صغيرة** (ده اللي هيبقى الأدمن)
   - Field: `role` — Type: `string` — Value: `admin`
   - **Save**

## ٤. خدي إعدادات الأبلكيشن
1. علامة الترس ⚙ جنب Project Overview ← **Project settings**.
2. تحت **Your apps** دوسي على أيقونة الويب `</>` ← اكتبي اسم ← **Register app** (من غير Hosting).
3. هيظهر كود فيه `firebaseConfig = { apiKey: ... }`.
4. افتحي ملف `config.js` بأي محرر نصوص، وحطي كل قيمة مكان `PASTE_HERE` المقابلة ليها، واحفظي.
   (أو ابعتي الكود لـ Claude وهو يرجّعلك config.js جاهز.)

## ٥. ارفعي الأبلكيشن على الإنترنت (Netlify — مجاني)
1. اعملي حساب مجاني على https://app.netlify.com (عشان اللينك يفضل شغال).
2. **Add new site ← Deploy manually**، واسحبي **الفولدر كله** (مش ملف ZIP) وارميه في المربع.
3. هيطلع لك لينك زي `https://something.netlify.app`. تقدري تغيّري الاسم من **Site configuration ← Change site name**.

## ٦. أول دخول
1. افتحي اللينك ← **First time? Create account** بنفس الإيميل اللي حطيتيه في `allowed`.
2. افتحي الإيميل اللي هيوصلك (بصّي في Spam) ودوسي اللينك ← ارجعي ودوسي **Continue**.
3. من الصفحة الرئيسية ← **⚙ Team access**: ضيفي إيميلات الدكاترة. وتقدري تدوسي **Load sample patients** عشان التجربة.

## ٧. النواب
- كل واحد يفتح اللينك ← **Create account** بإيميله اللي اتضاف ← يأكد الإيميل ← يدخل.
- **تثبيت على الموبايل:** أندرويد من Chrome ← "Install app" أو "Add to Home screen". آيفون من Safari ← زرار المشاركة ← "Add to Home Screen".

## التحديثات بعد كده
لما Claude يبعتلك نسخة جديدة: في Netlify افتحي الموقع ← **Deploys** ← اسحبي الفولدر الجديد. **البيانات مش بتتأثر.** (ماتنسيش تحطي `config.js` بتاعك في الفولدر الجديد.)

## ملاحظات مهمة
- **أي حد مش في قايمة Team access مايقدرش يشوف أي بيانات**، حتى لو معاه اللينك وعمل حساب.
- لو اتنين عدّلوا **نفس العيان في نفس اللحظة**، آخر واحد يحفظ هو اللي تعديله يفضل. ده نادر، بس خدوا بالكم في التجربة.
- الأبلكيشن بيشتغل لو النت فصل، والتعديلات بتتحفظ على الموبايل وتتبعت لوحدها لما النت يرجع.
- حذف ملف عيان كامل للأدمن بس، من Edit patient.
- طول فترة التجربة: أسامي وهمية، ومن غير أرقام قومية أو تليفونات.
