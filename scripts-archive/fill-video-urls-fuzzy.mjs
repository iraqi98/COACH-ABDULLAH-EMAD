// سكربت اقتراح تطابقات تقريبية (fuzzy) لأسماء التمارين بدون رابط فيديو
// لا يكتب أي شيء في قاعدة البيانات - تقرير للمراجعة فقط
// الاستخدام: node fill-video-urls-fuzzy.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";
const SIMILARITY_THRESHOLD = 0.7; // 70%

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

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // حذف
        curr[j - 1] + 1, // إضافة
        prev[j - 1] + cost // استبدال
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

async function collectVideoUrlsFromTrainees() {
  // key -> { url, rawName }، بدون حل تعارضات هنا (نأخذ أول رابط فقط لكل اسم فريد للاقتراح)
  const videoByName = new Map();

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

        if (!videoByName.has(key)) {
          videoByName.set(key, { url: exercise.videoUrl.trim(), rawName: key });
        }
      }
    }
  }

  return videoByName;
}

async function getUnmatchedLibraryExercises() {
  const ref = db.collection("exerciseLibraries").doc(TARGET_DOC_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error(`الوثيقة الهدف غير موجودة: ${TARGET_DOC_ID}`);
  }

  const data = snap.data();
  const items = data.items || {};
  const unmatched = [];

  for (const [section, exercises] of Object.entries(items)) {
    if (!Array.isArray(exercises)) continue;

    for (const exercise of exercises) {
      if (hasVideo(exercise)) continue;

      const rawName = exercise.name || exercise.title || "";
      const key = normalizeName(rawName);
      if (!key) continue;

      unmatched.push({ section, name: key });
    }
  }

  return unmatched;
}

function findBestMatch(libName, videoByName) {
  let best = null;

  for (const [traineeName, { url }] of videoByName.entries()) {
    const score = similarity(libName, traineeName);
    if (!best || score > best.score) {
      best = { traineeName, url, score };
    }
  }

  return best;
}

async function main() {
  const videoByName = await collectVideoUrlsFromTrainees();
  const unmatched = await getUnmatchedLibraryExercises();

  console.log(`تمارين بدون رابط: ${unmatched.length} | أسماء فريدة عند المتدربين: ${videoByName.size}\n`);

  const suggestions = [];

  for (const { section, name } of unmatched) {
    const best = findBestMatch(name, videoByName);
    if (best && best.score >= SIMILARITY_THRESHOLD) {
      suggestions.push({ section, name, ...best });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);

  console.log(`اقتراحات تطابق (نسبة تشابه >= ${SIMILARITY_THRESHOLD * 100}%): ${suggestions.length}\n`);

  for (const s of suggestions) {
    const pct = Math.round(s.score * 100);
    console.log(
      `[${s.section}] ${s.name} <-- تطابق مقترح: ${s.traineeName} (نسبة التشابه: ${pct}%) -> ${s.url}`
    );
  }

  const noSuggestion = unmatched.length - suggestions.length;
  console.log(`\nتمارين بلا أي اقتراح فوق الحد (${SIMILARITY_THRESHOLD * 100}%): ${noSuggestion}`);
}

main().catch((err) => {
  console.error("خطأ أثناء الفحص:", err);
  process.exit(1);
});
