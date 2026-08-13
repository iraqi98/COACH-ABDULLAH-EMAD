// سكربت تعبئة روابط شرح التمارين (videoUrl) في exerciseLibraries
// اعتماداً على الروابط الموجودة فعلياً داخل trainees.days[].exercises[]
// الاستخدام: node fill-video-urls.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";

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

async function collectVideoUrlsFromTrainees() {
  const videoByName = new Map(); // normalizedName -> videoUrl
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
        const key = normalizeName(rawName);
        if (!key) continue;

        const url = exercise.videoUrl.trim();

        if (videoByName.has(key)) {
          if (videoByName.get(key) !== url) {
            conflicts.add(key);
          }
          continue; // خذ أول رابط فقط
        }

        videoByName.set(key, url);
      }
    }
  }

  if (conflicts.size > 0) {
    console.log("تحذير: تمارين لها أكثر من رابط مختلف بين المتدربين (تم أخذ أول رابط فقط):");
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
  const unmatched = [];

  for (const [section, exercises] of Object.entries(items)) {
    if (!Array.isArray(exercises)) continue;

    for (const exercise of exercises) {
      const rawName = exercise.name || exercise.title || "";
      const key = normalizeName(rawName);

      if (hasVideo(exercise)) continue; // لا تلمس الموجود مسبقاً

      if (key && videoByName.has(key)) {
        exercise.videoUrl = videoByName.get(key);
        matchedCount++;
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

  return { matchedCount, unmatched };
}

async function main() {
  const videoByName = await collectVideoUrlsFromTrainees();
  console.log(`تم جمع ${videoByName.size} رابط فيديو فريد من trainees.\n`);

  const { matchedCount, unmatched } = await fillLibrary(videoByName);

  console.log(`\nتم ربط ${matchedCount} تمرين بنجاح في الوثيقة ${TARGET_DOC_ID}.`);
  console.log(`\nتمارين بدون تطابق (${unmatched.length}) - تحتاج مراجعة يدوية:`);
  for (const name of unmatched) {
    console.log(`  - ${name}`);
  }
}

main().catch((err) => {
  console.error("خطأ أثناء التعبئة:", err);
  process.exit(1);
});
