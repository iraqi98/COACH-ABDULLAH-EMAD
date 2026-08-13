// سكربت فحص روابط شرح التمارين (videoUrl) في Firestore (مشروع truck-f4c15)
// الاستخدام: node find-videos.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function hasVideo(exercise) {
  return typeof exercise?.videoUrl === "string" && exercise.videoUrl.trim() !== "";
}

async function scanExerciseLibraries() {
  console.log("========== exerciseLibraries ==========");
  const snap = await db.collection("exerciseLibraries").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const items = data.items || {};
    let withVideo = 0;
    let withoutVideo = 0;

    for (const [section, exercises] of Object.entries(items)) {
      if (!Array.isArray(exercises)) continue;

      for (const exercise of exercises) {
        if (hasVideo(exercise)) {
          withVideo++;
          const name = exercise.name || exercise.title || "(بدون اسم)";
          console.log(
            `[coachUid: ${doc.id}] [قسم: ${section}] [تمرين: ${name}] -> ${exercise.videoUrl}`
          );
        } else {
          withoutVideo++;
        }
      }
    }

    console.log(
      `-- ملخص الوثيقة ${doc.id}: بروابط=${withVideo} | بدون روابط=${withoutVideo}`
    );
  }
}

async function scanTrainees() {
  console.log("\n========== trainees ==========");
  const snap = await db.collection("trainees").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const days = Array.isArray(data.days) ? data.days : [];
    let withVideo = 0;
    let withoutVideo = 0;

    days.forEach((day, dayIndex) => {
      const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
      for (const exercise of exercises) {
        if (hasVideo(exercise)) {
          withVideo++;
          const name = exercise.name || exercise.title || "(بدون اسم)";
          const dayLabel = day?.name || day?.title || `يوم ${dayIndex + 1}`;
          console.log(
            `[trainee: ${doc.id}] [${dayLabel}] [تمرين: ${name}] -> ${exercise.videoUrl}`
          );
        } else {
          withoutVideo++;
        }
      }
    });

    if (withVideo > 0 || withoutVideo > 0) {
      console.log(
        `-- ملخص المتدرب ${doc.id}: بروابط=${withVideo} | بدون روابط=${withoutVideo}`
      );
    }
  }
}

async function main() {
  await scanExerciseLibraries();
  await scanTrainees();
}

main().catch((err) => {
  console.error("خطأ أثناء الفحص:", err);
  process.exit(1);
});
