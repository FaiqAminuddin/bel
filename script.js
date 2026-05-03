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
  const response = await fetch("https://raw.githubusercontent.com/FaiqAminuddin/bel/refs/heads/main/jadwal.csv.csv");
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

checkBell();
