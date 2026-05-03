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
    const [jam, menit, detik, audio, keterangan] = row.split(",");
    return { 
      jam: parseInt(jam), 
      menit: parseInt(menit), 
      detik: parseInt(detik), 
      audio: audio, 
      keterangan: keterangan 
    };
  }).sort((a,b) => (a.jam*3600+a.menit*60+a.detik) - (b.jam*3600+b.menit*60+b.detik));
}

function renderSchedule(schedule) {
  const tbody = document.getElementById("scheduleTable");
  tbody.innerHTML = "";
  const now = new Date();
  const currentSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();

  schedule.forEach(item => {
    const itemSec = item.jam*3600 + item.menit*60 + item.detik;
    let status;
    if (itemSec < currentSec) {
      const diff = Math.floor((currentSec - itemSec)/60);
      status = `Sudah lewat (${diff} menit lalu)`;
    } else {
      const diff = Math.floor((itemSec - currentSec)/60);
      status = `Kurang ${diff} menit lagi`;
    }
    const row = `<tr>
      <td>${String(item.jam).padStart(2,"0")}:${String(item.menit).padStart(2,"0")}:${String(item.detik).padStart(2,"0")}</td>
      <td>${item.keterangan}</td>
      <td>${status}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

async function initSchedule() {
  const schedule = await loadSchedule();
  renderSchedule(schedule);
  setInterval(() => renderSchedule(schedule), 1000*30); // update tiap 30 detik
}

initSchedule();
