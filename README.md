# Nephrology Ward Log — خطوات التركيب

الملفات اللي في الفولدر ده هي الأبلكيشن كامل. محتاجة **كمبيوتر** و**إيميل جوجل خاص بالقسم**، وحوالي ٢٠ دقيقة. أسامي الزراير مكتوبة بالإنجليزي زي ما هتظهر لك.

## ١. اعملي مشروع Firebase (مجاني، من غير كارت)
1. ادخلي على https://console.firebase.google.com بإيميل القسم.
2. **Create a project** ← اكتبي اسم زي `nephrology-ward-log` ← اقفلي Google Analytics ← **Create project**.

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

## ٥. ارفعي الأبلكيشن على الإنترنت (GitHub Pages — مجاني)
1. على https://github.com افتحي الـ repo بتاع الأبلكيشن (`nephrologyward/log`).
2. **Add file ← Upload files** ← اسحبي **كل الملفات اللي جوه الفولدر** ← **Commit changes**.
3. **Settings ← Pages**: Source = **Deploy from a branch**، Branch = `main` / `root` ← **Save**.
4. اللينك: `https://nephrologyward.github.io/log/`

## ٦. أول دخول
1. افتحي اللينك ← **First time? Create account** بنفس الإيميل اللي حطيتيه في `allowed`.
2. افتحي الإيميل اللي هيوصلك (بصّي في Spam) ودوسي اللينك ← ارجعي ودوسي **Continue**.
3. من الصفحة الرئيسية ← زرار **⋮** فوق ← **⚙ Admin ← Team access**: ضيفي إيميلات الدكاترة. وتقدري تدوسي **Load sample patients** عشان التجربة.

## ٧. النواب
- كل واحد يفتح اللينك ← **Create account** بإيميله اللي اتضاف ← يأكد الإيميل ← يدخل.
- **تثبيت على الموبايل:** أندرويد من Chrome ← "Install app" أو "Add to Home screen". آيفون من Safari ← زرار المشاركة ← "Add to Home Screen".

## التحديثات بعد كده
1. في الـ repo: **Add file ← Upload files** ← اسحبي الملفات الجديدة (نفس الأسامي هتستبدل القديمة) ← **Commit changes**.
2. لو Claude قال إن `firestore.rules` اتغيّر: Firebase ← **Firestore Database ← Rules** ← الصقي الملف الجديد كله ← **Publish**.
3. استني دقيقتين، وافتحي الأبلكيشن واقفليه وافتحيه تاني عشان النسخة الجديدة تظهر. **البيانات مش بتتأثر.**


## نسخة ٢٠ نوفمبر ٢٠٢٦ — مهم
- **قواعد Firebase اتغيرت:** الصقي `firestore.rules` الجديد في Firestore ← Rules ← Publish **قبل** ما تفتحي الأبلكيشن الجديد.
- أول مرة الأبلكيشن الجديد يفتح، بيحوّل الداتا الموجودة للشكل الجديد لوحده (مرة واحدة بس، ومحتاج نت). الأحسن الأدمن يفتحه الأول.
- كل تعديل بيتحفظ لوحده، فاتنين يقدروا يعدلوا نفس العيان من غير ما حد يمسح شغل التاني.

## ملاحظات مهمة
- **أي حد مش في قايمة Team access مايقدرش يشوف أي بيانات**، حتى لو معاه اللينك وعمل حساب.
- لو اتنين عدّلوا **نفس الخانة بالظبط** في نفس اللحظة، آخر واحد بيتحفظ، والقديمة بتفضل في Edit history.
- الأبلكيشن بيشتغل لو النت فصل، والتعديلات بتتحفظ على الموبايل وتتبعت لوحدها لما النت يرجع.
- حذف ملف عيان كامل للأدمن بس، من Edit patient. بيروح **Recently deleted** ٣٠ يوم وبعدين يتمسح، والأدمن يقدر يرجّعه.
- الأدمن يشوف كل التعديلات من **⚙ Admin ← Edit history** ويقدر يرجّع نسخة قديمة.
- طول فترة التجربة: أسامي وهمية، ومن غير أرقام قومية أو تليفونات.
