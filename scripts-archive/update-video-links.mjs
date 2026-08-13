// سكربت تحديث روابط شرح التمارين (videoUrl) في exerciseLibraries
// يحدّث فقط التمارين التي لا تملك رابطاً حالياً، بناءً على قائمة ثابتة (قسم + اسم تمرين + رابط)
// مطابقة تامة بالاسم بعد trim فقط (بدون fuzzy matching)
// الاستخدام: node update-video-links.mjs

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH = "./service-account.json";
const TARGET_DOC_ID = "v8TKT4Pmv3Sf4mMMR9aQcJEwgdA2";

const UPDATES = [
  // بايسبس
  { section: "بايسبس", name: "بايسبس جهاز لاري جالس", url: "https://youtube.com/shorts/Lw5OEzPS3cA?si=Sh3n6fue567ti8Kq" },
  { section: "بايسبس", name: "بايسبس دمبلص واقف مترادف", url: "https://youtube.com/shorts/hmSBu95cF08?si=kIKW0qyh6kAccSAf" },
  { section: "بايسبس", name: "بايسبس دمبلص جالس متناوب", url: "https://youtube.com/shorts/x9MsfYdHfkY?si=juw4bUhbS15678" },
  { section: "بايسبس", name: "بايسبس دمبلص واقف ملتوي", url: "https://youtube.com/shorts/x9PmxU1jqY0?si=H4Hbq1hKuwfSk3FD" },
  { section: "بايسبس", name: "بايسبس جهاز جالس متناوب", url: "https://youtube.com/shorts/UzfatcfhC6Y?si=zOKjEC8FVIoNZopY" },
  { section: "بايسبس", name: "بايسبس جهاز جالس اليديا معا", url: "https://youtube.com/shorts/3BLHUgU2bVs?si=Swpzc83R2Vsy65LG" },
  { section: "بايسبس", name: "بايسبس دمبلص مفرد اليديا معا", url: "https://youtube.com/shorts/Pkr4BIW-uS8?si=U69UrKVhQjI6z9ns" },
  { section: "بايسبس", name: "بايسبس دمبلص جالس مطرقه همر", url: "https://youtube.com/shorts/tyiQKBqJ8rI?si=k_mxP2b8ldrIGaM_" },
  { section: "بايسبس", name: "بايسبس دمبلص جالس ملتوي", url: "https://youtube.com/shorts/xhujVg1MV_g?si=opZCcnoPNZF0Tn7w" },
  { section: "بايسبس", name: "بايسبس دمبلص مائل مصطبه اعلى", url: "https://youtube.com/shorts/zZjN1KYBuXs?si=zqt2b9UamoUMDR3t" },
  { section: "بايسبس", name: "بايسبس مفرد لاري متناوب مصطبه اعلى", url: "https://youtube.com/shorts/f45KXg5szSE?si=yEnM0b27bWBUk_sa" },
  { section: "بايسبس", name: "بايسبس دمبلص مرتكز الساق مفرد متناوب", url: "https://youtube.com/shorts/rj_qWjJZ27Y?si=InfPMAynT7HV8N-d" },
  { section: "بايسبس", name: "بايسبس دمبلص جالس اليديا معا", url: "https://youtube.com/shorts/UjDhsx1u9WQ?si=LZAcunMf3a7FvhR4" },
  { section: "بايسبس", name: "بايسبس دمبلص مطرقه همر للداخل متناوب", url: "https://youtube.com/shorts/GvxL8sLFw30?si=romqPuiAElZVr4ao" },
  { section: "بايسبس", name: "بايسبس مطرقه همر واقف", url: "https://youtube.com/shorts/mweIWJAEjrU?si=8UFJFE_vTI5V-Zy2" },
  { section: "بايسبس", name: "بايسبس دمبلص واقف اليديا معا", url: "https://youtube.com/shorts/JRjOic8OIe0?si=ro17SLnQdahzNWP4" },

  // أرجل
  { section: "أرجل", name: "كيل سيقان خلفي نائم (Leg Curl)", url: "https://youtube.com/shorts/vHASdE-9_m4?si=u4nZKSblH8EPNaxD" },
  { section: "أرجل", name: "كولف جهاز جالس", url: "https://youtube.com/shorts/iic6yHOWv24?si=1TgCrg_ppgpNd9VA" },
  { section: "أرجل", name: "سكوات امامي بالبكره", url: "https://youtube.com/shorts/S3RdQLK62fA?si=Z_6RWcsXOUEy8RA2" },
  { section: "أرجل", name: "سكوات بار امامي", url: "https://youtube.com/shorts/O1oAbhZv93A?si=clBRYRY6SixsG5_y" },
  { section: "أرجل", name: "سكوات دمبلص متناوب على الاستيب", url: "https://youtube.com/shorts/EfKNM0bhYD4?si=h1tl-tK-6MH8th_f" },
  { section: "أرجل", name: "سومو سكوات عريض دمبلص بدون ستيب", url: "https://youtube.com/shorts/qxB3jBYTTis?si=gSSlSTdJhiIqfcvJ" },
  { section: "أرجل", name: "سكوات سومو دمبلص عريض على الاستيب", url: "https://youtube.com/shorts/9r5QQdWN5sM?si=q6BUj1jJWYShffF2" },
  { section: "أرجل", name: "سكوات سومو عريض بار", url: "https://youtube.com/shorts/yl5ZKvx8NrU?si=MMrOYLF8hfKDTn0p" },
  { section: "أرجل", name: "سكوات دمبلص", url: "https://youtube.com/shorts/E27x2Nl6QV8?si=iY0vWIwmPQoxkZR4" },
  { section: "أرجل", name: "سكوات دمبلص مفرد متناوب على المصطبه", url: "https://youtube.com/shorts/ZbtWJ2wXgW4?si=ymoKm6n6m5U_9jdi" },
  { section: "أرجل", name: "سكوات دمبلص مفرد متناوب", url: "https://youtube.com/shorts/g361ZaiJoYw?si=CgSpJpP5cnlvuTHV" },
  { section: "أرجل", name: "ديدلفت بار", url: "https://youtube.com/shorts/3ro8-5JPwvM?si=WrB2Oei89vlsoHh1" },
  { section: "أرجل", name: "ديدلفت دمبلص", url: "https://youtube.com/shorts/dk41AVWedGI?si=VQR_DxS8eHGBZYAC" },
  { section: "أرجل", name: "كيل سيقان خلفي مفرد متناوب", url: "https://youtube.com/shorts/bl9DVACTQn4?si=Ecp2Bk4Ai6OfIowd" },
  { section: "أرجل", name: "ترايسبس سيقان امامي جالس", url: "https://youtube.com/shorts/aNE82OAd06Q?si=QZ41PWClftAnxRYr" },
  { section: "أرجل", name: "دفع ماكنه ليك بريس", url: "https://youtube.com/shorts/wS2BXJktYZ0?si=D28YuPbYdc6qO0tC" },
  { section: "أرجل", name: "هاك باك ماكنه", url: "https://youtube.com/shorts/n0yRUlkwwBc?si=af3yoatRllzLW7z0" },
  { section: "أرجل", name: "جهاز جالس للخوارج", url: "https://youtube.com/shorts/1KL56uFlMU8?si=WyRp-uopuFK0EBaj" },
  { section: "أرجل", name: "جهاز جالس للدواخل", url: "https://youtube.com/shorts/Vo6nMStLZyQ?si=cuGoSWgQNQ5ubprJ" },
  { section: "أرجل", name: "سكوات سمث", url: "https://youtube.com/shorts/pDSuiLiSpKs?si=QUkQjCHndYyxU5cK" },

  // صدر
  { section: "صدر", name: "بلوفر دمبلص اعلى", url: "https://youtube.com/shorts/tv8Xt7JDrqw?si=KLROocXlUInnK3d9" },
  { section: "صدر", name: "بنج جهاز أعلى همر", url: "https://youtube.com/shorts/heYFnln9AHk?si=_xYJaVAmHxGUyLh0" },
  { section: "صدر", name: "جمع جهاز فراشة", url: "https://youtube.com/shorts/z-HaFuiurVo?si=HJt2sGs1EGccAwkx" },
  { section: "صدر", name: "بنج دمبلص مصطبه اعلى متقابل", url: "https://youtube.com/shorts/Qfy6gWH9GXg?si=_XtlvBz1sCgB5MMz" },
  { section: "صدر", name: "بنج دمبلص ملتوي مصطبة مستوي", url: "https://youtube.com/shorts/uSptjDjPJe8?si=UYotN81ICly4EBrF" },
  { section: "صدر", name: "بنج دمبلص اعلى متناوب", url: "https://youtube.com/shorts/xyJK9SrONoM?si=rUSwELEcINAMdWgk" },
  { section: "صدر", name: "بلوفر دمبلص عكس المصطبة مستوي", url: "https://youtube.com/shorts/_Sra7GV0E94?si=aCjy89tLncsn9A1p" },
  { section: "صدر", name: "جمع دمبلص مستوي", url: "https://youtube.com/shorts/DenxsoDUCKQ?si=kes8-2VodLZHkxlM" },
  { section: "صدر", name: "جمع دمبلص اعلى", url: "https://youtube.com/shorts/AWIO0M3ORcQ?si=ZidQwl5_XbSxiwa7" },
  { section: "صدر", name: "بنج مستوي اسلاك جالس متكئ", url: "https://youtube.com/shorts/c4DDRegZenI?si=Gk5lIOsJOA5-4LnY" },
  { section: "صدر", name: "جمع اسلاك اعلى", url: "https://youtube.com/shorts/l8NFIETwLuM?si=hjlPDM5c5RzPhMxK" },
  { section: "صدر", name: "بنج اعلى اسلاك", url: "https://youtube.com/shorts/CFjtLBRYpmE?si=70jN77e45o2YlYtP" },
  { section: "صدر", name: "جمع اسلاك من الاسفل للاعلى", url: "https://youtube.com/shorts/Khn-SKqYFdM?si=jJqDaPn-NQRi7o6u" },
  { section: "صدر", name: "جمع اسلاك مستوي واقف", url: "https://youtube.com/shorts/9nov7gY3mfI?si=6a2OZrzCR2EYU5fe" },
  { section: "صدر", name: "جمع اسلاك من الاعلى للاسفل", url: "https://youtube.com/shorts/ZxvmQf_QWkw?si=7t8gHZHvba-OlXBU" },
  { section: "صدر", name: "بنج دمبلص مستوي متقابل", url: "https://youtube.com/shorts/gf5lMu13AD0?si=rwIEixz-R7xbQAZk" },
  { section: "صدر", name: "بنج دمبلص مستوي متناوب مع الثبات", url: "https://youtube.com/shorts/S3sweZkub78?si=HrhWYWXFQgRndkOg" },
  { section: "صدر", name: "بنج دمبلص مستوي", url: "https://youtube.com/shorts/Z6P8PWMkDFE?si=qxe6PXy5B8ZO4MME" },
  { section: "صدر", name: "بنج اعلى دمبلص مقلوب للداخل", url: "https://youtube.com/shorts/RcUYqhZytpc?si=6Shl-z3fZYpOsKnM" },
  { section: "صدر", name: "بنج اعلى دمبلص متناوب مع الثبات", url: "https://youtube.com/shorts/rrm4SRfroKY?si=DpOIbvQIdFokL2ni" },
  { section: "صدر", name: "بنج اعلى دمبلص ملتوي", url: "https://youtube.com/shorts/qe8OYAxi1uk?si=CZDbdv_GLB6J8Z_T" },
  { section: "صدر", name: "بنج دمبلص اعلى", url: "https://youtube.com/shorts/mnlzLsjlipc?si=5YDC98BO6jxN6JPd" },
  { section: "صدر", name: "بنج اعلى جهاز مستوي", url: "https://youtube.com/shorts/uxGQ1qMBGhk?si=_jM4oqNiQ1A5p4nX" },
  { section: "صدر", name: "جهاز مستوي مصطبه نائم", url: "https://youtube.com/shorts/m3atFyRzrNw?si=Sx1lrpS8oGruoGqx" },
  { section: "صدر", name: "بنج بار اسفل", url: "https://youtube.com/shorts/wYjQCbcvVU4?si=Vv3RPVclz9-de_c7" },
  { section: "صدر", name: "بنج اعلى بار", url: "https://youtube.com/shorts/XXnauCfseJ0?si=wsTJex9gyY9KV2pA" },
  { section: "صدر", name: "بنج مستوي بار", url: "https://youtube.com/shorts/17_kiXjkl3U?si=QbrHH2f3L8l6-iwB" },
  { section: "صدر", name: "بنج مستوي جهاز جالس", url: "https://youtube.com/shorts/GYxvX8LEr2Q?si=Axuy7F9BZBYEGyml" },
  { section: "صدر", name: "صدر اسفل جهاز جالس", url: "https://youtube.com/shorts/ZP_7FTTULes?si=HpJav3vJH0aW9ieV" },
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

  for (const update of UPDATES) {
    const sectionKey = normalizeName(update.section);
    const nameKey = normalizeName(update.name);

    const exercises = Array.isArray(items[update.section])
      ? items[update.section]
      : Object.entries(items).find(([s]) => normalizeName(s) === sectionKey)?.[1];

    const exercise = Array.isArray(exercises)
      ? exercises.find((ex) => normalizeName(ex.name || ex.title || "") === nameKey)
      : undefined;

    if (!exercise) {
      console.log(`⚠ عدم تطابق: [${update.section}] "${update.name}" - لم يُعثر على تمرين بهذا الاسم في هذا القسم`);
      unmatchedCount++;
      continue;
    }

    if (hasVideo(exercise)) {
      console.log(`⏭ تخطي: [${update.section}] "${update.name}" - يملك رابطاً مسبقاً (${exercise.videoUrl})`);
      skippedCount++;
      continue;
    }

    exercise.videoUrl = update.url;
    console.log(`✔ تحديث: [${update.section}] "${update.name}" -> ${update.url}`);
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
