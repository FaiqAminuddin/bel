// -------------------- KONFIG --------------------
const JADWAL_URL = "https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/jadwal.csv";
const AUDIO_FILES = [
  "audio/036.mp3",
  "audio/055.mp3",
  "audio/056.mp3",
  "audio/067.mp3"
];

// -------------------- JAM WIB --------------------
function updateClock() {
  const now = new Date();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('clock').textContent =
    new Intl.DateTimeFormat('id-ID', options).format(now) + " WIB";
}
setInterval(updateClock, 1000);
updateClock();

// -------------------- STATUS --------------------
function setStatusPerButton(type, message, success=true) {
  const now = new Date();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' };
  const waktu = new Intl.DateTimeFormat('id-ID', options).format(now) + " WIB";

  if (type === "jadwal") {
    document.getElementById("statusJadwal").textContent = `${message} pada ${waktu}`;
    document.getElementById("btnSyncJadwal").className = success ? "btn-green" : "btn-red";
    document.getElementById("btnUnduhJadwal").className = success ? "btn-green" : "btn-red";
  } else if (type === "audio") {
    document.getElementById("statusAudio").textContent = `${message} pada ${waktu}`;
    document.getElementById("btnSyncAudio").className = success ? "btn-green" : "btn-red";
    document.getElementById("btnUnduhAudio").className = success ? "btn-green" : "btn-red";
  }
}

// -------------------- JADWAL --------------------
async function fetchScheduleOnline() {
  const response = await fetch(JADWAL_URL);
  if (!response.ok) throw new Error("Gagal mengambil jadwal dari GitHub");
  const text = await response.text();
  localStorage.setItem("jadwal.csv", text);
  return parseSchedule(text);
}

function parseSchedule(text) {
  const rows = text.trim().split("\n").slice(1);
  return rows.map(row => {
    const [jam, menit, detik, audio, keterangan] = row.split(",");
    return {
      jam: parseInt(jam),
      menit: parseInt(menit),
      detik: parseInt(detik),
      audio: audio.trim(),
      keterangan: keterangan,
      enabled: true
    };
  });
}

function loadScheduleOffline() {
  const text = localStorage.getItem("jadwal.csv");
  if (!text) {
    // fallback: coba ambil file lokal jadwal.csv
    return [];
  }
  return parseSchedule(text);
}

async function syncSchedule() {
  try {
    await fetchScheduleOnline();
    setStatusPerButton("jadwal", "Jadwal berhasil disinkron");
  } catch (err) {
    alert("Gagal sync jadwal: " + err);
    setStatusPerButton("jadwal", "Gagal sync jadwal", false);
  }
}

function downloadSchedule() {
  const text = localStorage.getItem("jadwal.csv");
  if (!text) {
    alert("Belum ada jadwal tersimpan. Lakukan Sync dulu.");
    setStatusPerButton("jadwal", "Unduh jadwal gagal", false);
    return;
  }
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jadwal.csv";
  a.click();
  URL.revokeObjectURL(url);
  setStatusPerButton("jadwal", "Jadwal berhasil diunduh");
}

// -------------------- AUDIO --------------------
async function syncAudio() {
  try {
    for (const file of AUDIO_FILES) {
      const url = `https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/${file}`;
      console.log("Mengambil:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("File tidak ditemukan: " + url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(file, reader.result);
      };
      reader.readAsDataURL(blob);
    }
    setStatusPerButton("audio", "Audio berhasil disinkron");
  } catch (err) {
    alert("Gagal sync audio: " + err);
    setStatusPerButton("audio", "Gagal sync audio", false);
  }
}

async function downloadAllAudio() {
  const zip = new JSZip();
  for (const file of AUDIO_FILES) {
    const data = localStorage.getItem(file);
    if (data) {
      const base64 = data.split(",")[1];
      zip.file(file.split("/").pop(), base64, { base64: true });
    } else {
      try {
        const url = `https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/${file}`;
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(file.split("/").pop(), blob);
      } catch (err) {
        console.error("Gagal ambil:", file, err);
      }
    }
  }
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "audio_bel.zip");
  setStatusPerButton("audio", "Semua audio berhasil diunduh");
}

// -------------------- PLAY --------------------
function playAudio(src) {
  const bell = document.getElementById("bell");
  const data = localStorage.getItem(src);
  if (data) {
    bell.src = data;
  } else {
    bell.src = src; // fallback ke file lokal relatif
  }
  bell.hidden = false;
  bell.play().catch(err => {
    console.error("Gagal memutar audio:", err);
    alert("Audio tidak bisa diputar.");
  });
}

// -------------------- TOGGLE JADWAL --------------------
function toggleSchedule(index) {
  const schedule = window.currentSchedule || [];
  if (schedule[index]) {
    schedule[index].enabled = !schedule[index].enabled;
    renderSchedule(schedule);
  }
}

// -------------------- RENDER JADWAL --------------------
function renderSchedule(schedule) {
  window.currentSchedule = schedule;
  const tbody = document.getElementById("scheduleTable");
  tbody.innerHTML = "";
  const now = new Date();
  const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  schedule.forEach((item, index) => {
    const itemSec = item.jam * 3600 + item.menit * 60 + item.detik;
    let status;
    if (itemSec < currentSec) {
      const diff = Math.floor((currentSec - itemSec) / 60);
      status = `Sudah lewat (${diff} menit lalu)`;
    } else {
      const diff = Math.floor((itemSec - currentSec) / 60);
      status = `Kurang ${diff} menit lagi`;
    }

    const row = `<tr>
      <td>${String(item.jam).padStart(2,"0")}:${String(item.menit).padStart(2,"0")}:${String(item.detik).padStart(2,"0")}</td>
      <td>${item.keterangan}</td>
      <td>${status}</td>
      <td><button onclick="playAudio('${item.audio}')">Play</button></td>
      <td><input type="checkbox" ${item.enabled ? "checked" : ""} onchange="toggleSchedule(${index})"></td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// -------------------- INIT --------------------
async function initSchedule() {
  let schedule = loadScheduleOffline();
  if (schedule.length > 0) {
    setStatusPerButton("jadwal", "Jadwal dimuat dari offline cache");
  } else {
    try {
      schedule = await fetchScheduleOnline();
      setStatusPerButton("jadwal", "Jadwal berhasil dimuat online");
    } catch {
      setStatusPerButton("jadwal", "Tidak ada jadwal offline/online", false);
    }
  }
  renderSchedule(schedule);

  setInterval(() => renderSchedule(schedule), 30000);

  setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    (window.currentSchedule || []).forEach(item => {
      if (item.enabled && item.jam === h && item.menit === m && item.detik === s) {
        playAudio(item.audio);
      }
    });
  }, 1000);
