// -------------------- JAM WIB --------------------
function updateClock() {
  const now = new Date();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('clock').textContent =
    new Intl.DateTimeFormat('id-ID', options).format(now) + " WIB";
}
setInterval(updateClock, 1000);
updateClock();

// -------------------- LOAD JADWAL --------------------
async function loadSchedule() {
  // Ganti URL sesuai repo GitHub kamu
  const response = await fetch("https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/jadwal.csv");
  const text = await response.text();
  const rows = text.trim().split("\n").slice(1); // skip header
  return rows.map(row => {
    const [jam, menit, detik, audio, keterangan] = row.split(",");
    return {
      jam: parseInt(jam),
      menit: parseInt(menit),
      detik: parseInt(detik),
      audio: audio.trim(),
      keterangan: keterangan
    };
  }).sort((a, b) =>
    (a.jam * 3600 + a.menit * 60 + a.detik) -
    (b.jam * 3600 + b.menit * 60 + b.detik)
  );
}

// -------------------- PLAY AUDIO --------------------
function playAudio(src) {
  const bell = document.getElementById("bell");
  bell.src = src;
  bell.hidden = false;   // pastikan tidak tersembunyi
  bell.play().catch(err => {
    console.error("Gagal memutar audio:", err);
    alert("Audio tidak bisa diputar. Periksa path/URL file.");
  });
}

// -------------------- TAMPILKAN JADWAL --------------------
function renderSchedule(schedule) {
  const tbody = document.getElementById("scheduleTable");
  tbody.innerHTML = "";
  const now = new Date();
  const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  schedule.forEach((item, idx) => {
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
      <td>${String(item.jam).padStart(2, "0")}:${String(item.menit).padStart(2, "0")}:${String(item.detik).padStart(2, "0")}</td>
      <td>${item.keterangan}</td>
      <td>${status}</td>
      <td><button onclick="playAudio('${item.audio}')">Play</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// -------------------- CEK BEL OTOMATIS --------------------
async function checkBell() {
  const schedule = await loadSchedule();
  // render tabel pertama kali
  renderSchedule(schedule);

  // update tabel setiap 30 detik
  setInterval(() => renderSchedule(schedule), 30000);

  // cek bel setiap detik
  setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    schedule.forEach(item => {
      if (item.jam === h && item.menit === m && item.detik === s) {
        playAudio(item.audio);
      }
    });
  }, 1000);
}

// -------------------- Syns dan unduh auido --------------------

const AUDIO_FILES = [
  "audio/036.mp3",
  "audio/055.mp3",
  "audio/056.mp3",
  "audio/067.mp3"
];

// -------------------- SYNC AUDIO --------------------
async function syncAudio() {
  try {
    for (const file of AUDIO_FILES) {
      const url = `https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/${file}`;
      const response = await fetch(url);
      const blob = await response.blob();
      // simpan ke cache browser
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(file, reader.result); // base64
      };
      reader.readAsDataURL(blob);
    }
    alert("Audio berhasil disinkron dari GitHub.");
  } catch (err) {
    alert("Gagal sync audio: " + err);
  }
}

// -------------------- UNDUH AUDIO --------------------
function downloadAudio(file) {
  const data = localStorage.getItem(file);
  if (!data) {
    alert("Audio belum tersimpan. Lakukan Sync dulu.");
    return;
  }
  const a = document.createElement("a");
  a.href = data;
  a.download = file.split("/").pop();
  a.click();
}

function setStatus(message) {
  const now = new Date();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const waktu = new Intl.DateTimeFormat('id-ID', options).format(now) + " WIB";
  document.getElementById("status").textContent = `${message} pada ${waktu}`;
}

// -------------------- SYNC JADWAL --------------------
async function syncSchedule() {
  try {
    await fetchScheduleOnline();
    setStatus("Jadwal berhasil disinkron");
  } catch (err) {
    alert("Gagal sync jadwal: " + err);
  }
}

// -------------------- UNDUH JADWAL --------------------
function downloadSchedule() {
  const text = localStorage.getItem("jadwal.csv");
  if (!text) {
    alert("Belum ada jadwal tersimpan. Lakukan Sync dulu.");
    return;
  }
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jadwal.csv";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Jadwal berhasil diunduh");
}

// -------------------- SYNC AUDIO --------------------
async function syncAudio() {
  try {
    for (const file of AUDIO_FILES) {
      const url = `https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/${file}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(file, reader.result);
      };
      reader.readAsDataURL(blob);
    }
    setStatus("Audio berhasil disinkron");
  } catch (err) {
    alert("Gagal sync audio: " + err);
  }
}

// -------------------- UNDUH SEMUA AUDIO --------------------
async function downloadAllAudio() {
  const zip = new JSZip();
  for (const file of AUDIO_FILES) {
    const data = localStorage.getItem(file);
    if (data) {
      const base64 = data.split(",")[1];
      zip.file(file.split("/").pop(), base64, { base64: true });
    }
  }
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "audio_bel.zip");
  setStatus("Semua audio berhasil diunduh");
}



checkBell();
