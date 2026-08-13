// سكربت دمج مكتبات التمارين في Firestore (مشروع truck-f4c15)
// الاستخدام: node merge-exercise-libraries.mjs
//
// يدمج items من الوثيقة المصدر (eQpPtTto5IXmooFieqx97qkGFqg2)
// داخل الوثيقة الهدف (v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2) دون حذف أو تكرار.

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const SOURCE_DOC_ID = "eQpPtTto5IXmooFieqx97qkGFqg2";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";
const COLLECTION = "exerciseLibraries";

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// مفتاح فريد لكل تمرين لمنع التكرار (الاسم كافٍ هنا، عدّله لو عندك id مميز)
function exerciseKey(exercise) {
  return (exercise?.name || exercise?.title || JSON.stringify(exercise)).trim();
}

function mergeItems(targetItems, sourceItems) {
  // items هنا افترضتها هيكل: { [قسم]: [تمارين...] }
  const merged = { ...targetItems };

  for (const [section, sourceExercises] of Object.entries(sourceItems || {})) {
    if (!Array.isArray(sourceExercises)) continue;

    const existing = Array.isArray(merged[section]) ? [...merged[section]] : [];
    const existingKeys = new Set(existing.map(exerciseKey));

    for (const exercise of sourceExercises) {
      const key = exerciseKey(exercise);
      if (!existingKeys.has(key)) {
        existing.push(exercise);
        existingKeys.add(key);
      }
    }

    merged[section] = existing;
  }

  return merged;
}

async function main() {
  const sourceRef = db.collection(COLLECTION).doc(SOURCE_DOC_ID);
  const targetRef = db.collection(COLLECTION).doc(TARGET_DOC_ID);

  const [sourceSnap, targetSnap] = await Promise.all([
    sourceRef.get(),
    targetRef.get(),
  ]);

  if (!sourceSnap.exists) throw new Error(`الوثيقة المصدر غير موجودة: ${SOURCE_DOC_ID}`);
  if (!targetSnap.exists) throw new Error(`الوثيقة الهدف غير موجودة: ${TARGET_DOC_ID}`);

  const sourceData = sourceSnap.data();
  const targetData = targetSnap.data();

  const mergedItems = mergeItems(targetData.items, sourceData.items);

  console.log("أقسام قبل الدمج:", Object.keys(targetData.items || {}));
  console.log("أقسام بعد الدمج:", Object.keys(mergedItems));

  await targetRef.set(
    {
      items: mergedItems,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log(`تم تحديث الوثيقة ${TARGET_DOC_ID} بنجاح. لم يتم حذف أي وثيقة أخرى.`);
}

main().catch((err) => {
  console.error("خطأ أثناء الدمج:", err);
  process.exit(1);
});
