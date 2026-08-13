// سكربت تحديث روابط شرح التمارين (videoUrl) في exerciseLibraries - قسم "تراي" فقط
// يحدّث فقط التمارين التي لا تملك رابطاً حالياً، بناءً على قائمة ثابتة (اسم تمرين + رابط)
// مطابقة تامة بالاسم بعد trim فقط (بدون fuzzy matching)
// الاستخدام: node update-video-links-2.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";
const SECTION = "تراي";

const UPDATES = [
  { name: "ترايسبس برليل جهاز جالس", url: "https://youtube.com/shorts/PoL80priNP4?si=RJ2V32GATtsC4JKY" },
  { name: "ترايسبس حبل مفرد متناوب من خلف الكتف", url: "https://youtube.com/shorts/idPrG9Ozm2s?si=2WUHcbkVYDknc8IN" },
  { name: "ترايسبس حبل كروس متقاطع من الاعلى للاسفل", url: "https://youtube.com/shorts/MeMq61b0B2I?si=NCDaVSjaXXGMSXa_" },
  { name: "ترايسبس مثلث بش داون الدفع للاسفل", url: "https://youtube.com/shorts/iezZGA8lxtQ?si=pYsFFXuiZrY-APPr" },
  { name: "ترايسبس بش داون مثلث بكره", url: "https://youtube.com/shorts/_67YC6Gwr4g?si=upiFDCvM4lJemqL8" },
  { name: "ترايسبس حبل بكره مفرد مقلوب قبضات متناوب", url: "https://youtube.com/shorts/Fi3dYF9AgeE?si=KO0mmkHZsuhTui4Q" },
  { name: "ترايسبس حبل بكره مفرد واقف متناوب", url: "https://youtube.com/shorts/ZjtG1K8odTE?si=43B9RtLP4CklMncf" },
  { name: "ترايسبس مطرقه جهاز جالس", url: "https://youtube.com/shorts/P83GGCnsLyY?si=QAbqoBt79I8OaMa1" },
  { name: "ترايسبس حبل بكره خلف الرأس منحني", url: "https://youtube.com/shorts/FqPIBfF5TAY?si=ZdRam2k5iGbmPoz_" },
  { name: "حبل بكره خلف الرأس واقف", url: "https://youtube.com/shorts/fUOrPgy0X4w?si=pag4a6KXr-G3e6ku" },
  { name: "ترايسبس بكره حديد مقلوب", url: "https://youtube.com/shorts/RiNC263FFmM?si=6T4h8jPWmZsQpNdG" },
  { name: "ترايسبس حديد بكره واقف", url: "https://youtube.com/shorts/S0heM5nsI6I?si=7flxaetJIeReqV4U" },
  { name: "ترايسبس حبل بكره واقف", url: "https://youtube.com/shorts/c8kUbAu8Dgw?si=3jPQJTPnokchUxWE" },
  { name: "ترايسبس دمبلص كيك باك زوجي", url: "https://youtube.com/shorts/k8iVA5ph8P4?si=BOwPPyZ-gVImMwyA" },
  { name: "ترايسبس دمبلص كيك باك متناوب", url: "https://youtube.com/shorts/CmWAo4fAbyY?si=5g3Yct48XN5-rB8h" },
  { name: "ترايسبس حديد اسفل متوسط", url: "https://youtube.com/shorts/7gWHTh37J1o?si=bVtOxwq3SoCy_eZY" },
  { name: "ترايسبس z زت اسفل ضيق", url: "https://youtube.com/shorts/_-QG7mj6L0I?si=w75i45f5yXvtZkoC" },
  { name: "ترايسبس حديد جالس متكئ خلف الرأس", url: "https://youtube.com/shorts/zj37V25hWFE?si=68tE0o25c4l4COG1" },
  { name: "ترايسبس z زت جالس متكئ خلف الرأس", url: "https://youtube.com/shorts/RaCR4qfx20E?si=ToHddqoIr9YS-p_0" },
  { name: "ترايسبس دمبلص جالس مفرد متناوب خلف الرأس", url: "https://youtube.com/shorts/94nyirgIlCM?si=-3DhF70uXPeZCv8C" },
  { name: "ترايسبس دمبلص جالس خلف الرأس اليديا معا", url: "https://youtube.com/shorts/ps4_LqcnQkM?si=zIaJmKuw2VM1kwtI" },
  { name: "ترايسبس دبس مصطبه", url: "https://youtube.com/shorts/WtonjZyeAv8?si=OYOnG2luc2Iq2QCn" },
  { name: "ترايسبس دمبلص مطرقه متناوب مستوي", url: "https://youtube.com/shorts/2IPZU68SAdY?si=gkXU4V-pc7Xlbdfg" },
  { name: "ترايسبس دمبلص مطرقه مستوي", url: "https://youtube.com/shorts/CLLMTEd5DzU?si=eOV62NRi2B7wU50L" },
  { name: "ترايسبس z زت بنج ضيق مستوي", url: "https://youtube.com/shorts/SfRGCaGlXCM?si=weYrjTTEDDJcNcwz" },
  { name: "ترايسبس z زت اعلى خلف الرأس", url: "https://youtube.com/shorts/L4c-t0X1LuE?si=l8yuOVw6bflNH-Q6" },
  { name: "ترايسبس z زت مستوي خلف الرأس", url: "https://youtube.com/shorts/q9Qt5TAJkWg?si=R_P0udOXDFLBiX3I" },
  { name: "ترايسبس z زت مستوي", url: "https://youtube.com/shorts/26xZw0gSr-0?si=r7qwtIMQFLcR3jYt" },
  { name: "تراي حديد مستوي خلف الراس", url: "https://youtube.com/shorts/sItUkTDuD8w?si=KRqybtSTwqYmrpQm" },
  { name: "ترايسبس وسط اعلى متكئ", url: "https://youtube.com/shorts/OHxIA45e4t8?si=jyArINCv2ceSbJsQ" },
  { name: "ترايسبس بنج ضيق مستوي", url: "https://youtube.com/shorts/YjHLIlViS3A?si=be9MQmL1jXsJYFfE" },
  { name: "ترايسبس حديد وسط مستوي", url: "https://youtube.com/shorts/K2yzBgTLtCA?si=d1z_HHWhPCWCJAw-" },
];

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ");
}

function hasVideo(exercise) {
  return typeof exercise?.videoUrl === "string" && exercise.videoUrl.trim() !== "";
}

async function main() {
  const ref = db.collection("exerciseLibraries").doc(TARGET_DOC_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error(`الوثيقة الهدف غير موجودة: ${TARGET_DOC_ID}`);
  }

  const data = snap.data();
  const items = data.items || {};

  let updatedCount = 0;
  let skippedCount = 0;
  let unmatchedCount = 0;

  const sectionKey = normalizeName(SECTION);
  const exercises = Array.isArray(items[SECTION])
    ? items[SECTION]
    : Object.entries(items).find(([s]) => normalizeName(s) === sectionKey)?.[1];

  for (const update of UPDATES) {
    const nameKey = normalizeName(update.name);

    const exercise = Array.isArray(exercises)
      ? exercises.find((ex) => normalizeName(ex.name || ex.title || "") === nameKey)
      : undefined;

    if (!exercise) {
      console.log(`⚠ عدم تطابق: [${SECTION}] "${update.name}" - لم يُعثر على تمرين بهذا الاسم في هذا القسم`);
      unmatchedCount++;
      continue;
    }

    if (hasVideo(exercise)) {
      console.log(`⏭ تخطي: [${SECTION}] "${update.name}" - يملك رابطاً مسبقاً (${exercise.videoUrl})`);
      skippedCount++;
      continue;
    }

    exercise.videoUrl = update.url;
    console.log(`✔ تحديث: [${SECTION}] "${update.name}" -> ${update.url}`);
    updatedCount++;
  }

  await ref.set(
    {
      items,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log("\n=== التقرير النهائي ===");
  console.log(`تم تحديث: ${updatedCount}`);
  console.log(`تم تخطيه (يملك رابطاً مسبقاً): ${skippedCount}`);
  console.log(`غير متطابق: ${unmatchedCount}`);
}

main().catch((err) => {
  console.error("خطأ أثناء التحديث:", err);
  process.exit(1);
});
