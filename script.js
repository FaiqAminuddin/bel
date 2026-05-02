function updateClock() {
  const now = new Date();
  const options = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('clock').textContent = 
    new Intl.DateTimeFormat('id-ID', options).format(now) + " WIB";
}
setInterval(updateClock, 1000);
updateClock();

async function loadSchedule() {
  const response = await fetch("https://raw.githubusercontent.com/USERNAME/REPO/main/jadwal.csv");
  const text = await response.text();
  const rows = text.trim().split("\n").slice(1); // skip header
  return rows.map(row => {
    const [jam, menit, detik, audio] = row.split(",");
    return { 
      jam: parseInt(jam), 
      menit: parseInt(menit), 
      detik: parseInt(detik), 
      audio: audio 
    };
  });
}

async function checkBell() {
  const schedule = await loadSchedule();
  setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    schedule.forEach(item => {
      if (item.jam === h && item.menit === m && item.detik === s) {
        const bell = document.getElementById("bell");
        bell.src = item.audio;
        bell.play();
      }
    });
  }, 1000);
}

checkBell();
