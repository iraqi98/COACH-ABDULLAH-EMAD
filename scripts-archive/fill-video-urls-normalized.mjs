// سكربت تعبئة videoUrl بمطابقة تامة بعد تطبيع قوي للأسماء العربية
// الاستخدام: node fill-video-urls-normalized.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function hasVideo(exercise) {
  return typeof exercise?.videoUrl === "string" && exercise.videoUrl.trim() !== "";
}

// تطبيع قوي: توحيد ة/ه، توحيد الألفات، إزالة المسافات الزائدة
function normalizeStrong(name) {
  return (name || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

async function collectVideoUrlsFromTrainees() {
  const videoByName = new Map(); // normalizedKey -> { url, rawName }
  const conflicts = new Set();

  const snap = await db.collection("trainees").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const days = Array.isArray(data.days) ? data.days : [];

    for (const day of days) {
      const exercises = Array.isArray(day?.exercises) ? day.exercises : [];

      for (const exercise of exercises) {
        if (!hasVideo(exercise)) continue;

        const rawName = exercise.name || exercise.title || "";
        const key = normalizeStrong(rawName);
        if (!key) continue;

        const url = exercise.videoUrl.trim();

        if (videoByName.has(key)) {
          if (videoByName.get(key).url !== url) {
            conflicts.add(key);
          }
          continue; // خذ أول رابط فقط
        }

        videoByName.set(key, { url, rawName: rawName.trim() });
      }
    }
  }

  if (conflicts.size > 0) {
    console.log("تحذير: تمارين (بعد التطبيع) لها أكثر من رابط مختلف بين المتدربين (تم أخذ أول رابط فقط):");
    for (const key of conflicts) {
      console.log(`  - ${key}`);
    }
    console.log("");
  }

  return videoByName;
}

async function fillLibrary(videoByName) {
  const ref = db.collection("exerciseLibraries").doc(TARGET_DOC_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error(`الوثيقة الهدف غير موجودة: ${TARGET_DOC_ID}`);
  }

  const data = snap.data();
  const items = data.items || {};

  let matchedCount = 0;
  const matchedDetails = [];
  const unmatched = [];

  for (const [section, exercises] of Object.entries(items)) {
    if (!Array.isArray(exercises)) continue;

    for (const exercise of exercises) {
      if (hasVideo(exercise)) continue; // لا تلمس الموجود مسبقاً

      const rawName = exercise.name || exercise.title || "";
      const key = normalizeStrong(rawName);

      if (key && videoByName.has(key)) {
        const { url, rawName: traineeRawName } = videoByName.get(key);
        exercise.videoUrl = url;
        matchedCount++;
        matchedDetails.push(`[${section}] ${rawName} <-- ${traineeRawName} -> ${url}`);
      } else {
        unmatched.push(`[${section}] ${rawName || "(بدون اسم)"}`);
      }
    }
  }

  await ref.set(
    {
      items,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { matchedCount, matchedDetails, unmatched };
}

async function main() {
  const videoByName = await collectVideoUrlsFromTrainees();
  console.log(`تم جمع ${videoByName.size} اسم تمرين فريد (بعد التطبيع) من trainees.\n`);

  const { matchedCount, matchedDetails, unmatched } = await fillLibrary(videoByName);

  console.log(`تم ربط ${matchedCount} تمرين بنجاح بعد التطبيع القوي:\n`);
  for (const line of matchedDetails) {
    console.log(`  ${line}`);
  }

  console.log(`\nتمارين بدون تطابق حتى بعد التطبيع (${unmatched.length}) - تحتاج مراجعة يدوية فعلية (أسماء مختلفة جوهرياً):`);
  for (const name of unmatched) {
    console.log(`  - ${name}`);
  }
}

main().catch((err) => {
  console.error("خطأ أثناء التعبئة:", err);
  process.exit(1);
});
