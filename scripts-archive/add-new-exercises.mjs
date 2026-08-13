// سكربت إضافة تمارين جديدة (أسماء فقط) لمكتبة exerciseLibraries
// لا يعدّل أو يحذف أي تمرين موجود - إضافة فقط، مع منع التكرار
// الاستخدام: node add-new-exercises.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const newExercisesBySection = {
  "تراي": [
    "ترايسبس برليل جهاز جالس",
    "ترايسبس حبل مفرد متناوب من خلف الكتف",
    "ترايسبس حبل كروس متقاطع من الاعلى للاسفل",
    "ترايسبس مثلث بش داون الدفع للاسفل",
    "ترايسبس بش داون مثلث بكره",
    "ترايسبس حبل بكره مفرد مقلوب قبضات متناوب",
    "ترايسبس حبل بكره مفرد واقف متناوب",
    "ترايسبس مطرقه جهاز جالس",
    "ترايسبس حبل بكره خلف الرأس منحني",
    "حبل بكره خلف الرأس واقف",
    "ترايسبس بكره حديد مقلوب",
    "ترايسبس حديد بكره واقف",
    "ترايسبس حبل بكره واقف",
    "ترايسبس دمبلص كيك باك زوجي",
    "ترايسبس دمبلص كيك باك متناوب",
    "ترايسبس حديد اسفل متوسط",
    "ترايسبس z زت اسفل ضيق",
    "ترايسبس حديد جالس متكئ خلف الرأس",
    "ترايسبس z زت جالس متكئ خلف الرأس",
    "ترايسبس دمبلص جالس مفرد متناوب خلف الرأس",
    "ترايسبس دمبلص جالس خلف الرأس اليديا معا",
    "ترايسبس دبس مصطبه",
    "ترايسبس دمبلص مطرقه متناوب مستوي",
    "ترايسبس دمبلص مطرقه مستوي",
    "ترايسبس z زت بنج ضيق مستوي",
    "ترايسبس z زت اعلى خلف الرأس",
    "ترايسبس z زت مستوي خلف الرأس",
    "ترايسبس z زت مستوي",
    "تراي حديد مستوي خلف الراس",
    "ترايسبس وسط اعلى متكئ",
    "ترايسبس بنج ضيق مستوي",
    "ترايسبس حديد وسط مستوي",
  ],
  "أرجل": [
    "سكوات امامي بالبكره",
    "سكوات بار امامي",
    "سكوات دمبلص متناوب على الاستيب",
    "سومو سكوات عريض دمبلص بدون ستيب",
    "سكوات سومو دمبلص عريض على الاستيب",
    "سكوات سومو عريض بار",
    "سكوات دمبلص",
    "سكوات دمبلص مفرد متناوب على المصطبه",
    "سكوات دمبلص مفرد متناوب",
    "ديدلفت بار",
    "ديدلفت دمبلص",
    "كيل سيقان خلفي مفرد متناوب",
    "ترايسبس سيقان امامي جالس",
    "دفع ماكنه ليك بريس",
    "هاك باك ماكنه",
    "جهاز جالس للخوارج",
    "جهاز جالس للدواخل",
    "سكوات سمث",
    "جهاز لاري جالس",
  ],
  "بايسبس": [
    "بايسبس جهاز جالس متناوب",
    "بايسبس جهاز جالس اليديا معا",
    "بايسبس دمبلص مفرد اليديا معا",
    "بايسبس دمبلص جالس مطرقه همر",
    "بايسبس دمبلص جالس ملتوي",
    "بايسبس دمبلص مائل مصطبه اعلى",
    "بايسبس مفرد لاري متناوب مصطبه اعلى",
    "بايسبس دمبلص مرتكز الساق مفرد متناوب",
    "بايسبس دمبلص حالس اليديا معا",
    "بايسبس دمبلص مطرقه همر للداخل متناوب",
    "بايسبس مطرقه همر واقف",
    "بايسبس دمبلص واقف اليديا معا",
  ],
  "صدر": [
    "بنج مستوي اسلاك جالس متكئ",
    "جمع اسلاك اعلى",
    "بنج اعلى اسلاك",
    "جمع اسلاك من الاسفل للاعلى",
    "جمع اسلاك مستوي واقف",
    "جمع اسلاك من الاعلى للاسفل",
    "بنج دمبلص مستوي متقابل",
    "بنج دمبلص مستوي متناوب مع الثبات",
    "بنج دمبلص ملتوي مستوي",
    "بنج دمبلص مستوي",
    "بنج اعلى دمبلص مقلوب للداخل",
    "بنج اعلى دمبلص متناوب مع الثبات",
    "بنج اعلى دمبلص ملتوي",
    "بنج دمبلص اعلى",
    "بنج اعلى جهاز مستوي",
    "جهاز مستوي مصطبه نائم",
    "بنج بار اسفل",
    "بنج اعلى بار",
    "بنج مستوي بار",
    "جمع جهاز فراشه مستوي",
    "بنج جهاز اعلى نائم",
    "بنج مستوي جهاز جالس",
    "صدر اسفل جهاز جالس",
    "جمع اسلاك للصدر",
    "جمع صدر ماكنه",
  ],
};

function exerciseKey(name) {
  return (name || "").trim();
}

async function main() {
  const ref = db.collection("exerciseLibraries").doc(TARGET_DOC_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error(`الوثيقة الهدف غير موجودة: ${TARGET_DOC_ID}`);
  }

  const data = snap.data();
  const items = data.items || {};

  const summary = {}; // section -> { added, skipped }

  for (const [section, names] of Object.entries(newExercisesBySection)) {
    const existing = Array.isArray(items[section]) ? [...items[section]] : [];
    const existingKeys = new Set(existing.map(e => exerciseKey(e.name || e.title)));

    let added = 0;
    let skipped = 0;

    for (const rawName of names) {
      const key = exerciseKey(rawName);

      if (existingKeys.has(key)) {
        console.log(`تخطي (موجود مسبقاً) [${section}]: ${key}`);
        skipped++;
        continue;
      }

      existing.push({ name: key, videoUrl: "" });
      existingKeys.add(key);
      added++;
    }

    items[section] = existing;
    summary[section] = { added, skipped };
  }

  await ref.set(
    {
      items,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log("\n===== تقرير نهائي =====");
  let totalAdded = 0;
  let totalSkipped = 0;
  for (const [section, { added, skipped }] of Object.entries(summary)) {
    console.log(`[${section}] أُضيف: ${added} | تم تخطيه: ${skipped}`);
    totalAdded += added;
    totalSkipped += skipped;
  }
  console.log(`\nالإجمالي: أُضيف ${totalAdded} تمرين جديد | تم تخطي ${totalSkipped} تمرين موجود مسبقاً`);
}

main().catch((err) => {
  console.error("خطأ أثناء الإضافة:", err);
  process.exit(1);
});
