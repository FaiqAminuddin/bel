import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/audio', express.static('audio'));

// Data file untuk menyimpan pengaturan bel
const BELLS_FILE = 'bells.json';

// Inisialisasi file jika belum ada
if (!fs.existsSync(BELLS_FILE)) {
  fs.writeFileSync(BELLS_FILE, JSON.stringify([
    {
      id: uuidv4(),
      name: 'Bel Masuk',
      time: '07:00',
      days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      audio: 'bell-01.mp3',
      active: true
    },
    {
      id: uuidv4(),
      name: 'Bel Istirahat',
      time: '09:30',
      days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      audio: 'bell-02.mp3',
      active: true
    },
    {
      id: uuidv4(),
      name: 'Bel Pulang',
      time: '14:30',
      days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      audio: 'bell-03.mp3',
      active: true
    }
  ], null, 2));
}

// Helper function untuk membaca bells
function readBells() {
  try {
    return JSON.parse(fs.readFileSync(BELLS_FILE, 'utf-8'));
  } catch (error) {
    return [];
  }
}

// Helper function untuk menulis bells
function writeBells(bells) {
  fs.writeFileSync(BELLS_FILE, JSON.stringify(bells, null, 2));
}

// Helper function untuk mendapatkan daftar file audio
function getAudioFiles() {
  const audioDir = path.join(__dirname, 'audio');
  
  // Buat folder audio jika belum ada
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  try {
    const files = fs.readdirSync(audioDir);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
    });
  } catch (error) {
    return [];
  }
}

// API Endpoints

// 1. Get waktu terkini WIB
app.get('/api/time', (req, res) => {
  const now = new Date();
  const wibTime = now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const wibHourMinute = now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  res.json({
    fullTime: wibTime,
    hourMinute: wibHourMinute,
    timestamp: now.getTime()
  });
});

// 2. Get semua bel
app.get('/api/bells', (req, res) => {
  const bells = readBells();
  res.json(bells);
});

// 3. Get daftar file audio
app.get('/api/audio-files', (req, res) => {
  const files = getAudioFiles();
  res.json(files);
});

// 4. Create bel baru
app.post('/api/bells', (req, res) => {
  const { name, time, days, audio, active } = req.body;
  
  if (!name || !time || !days || !audio) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  const bells = readBells();
  const newBell = {
    id: uuidv4(),
    name,
    time,
    days,
    audio,
    active: active !== false
  };
  
  bells.push(newBell);
  writeBells(bells);
  
  res.status(201).json(newBell);
});

// 5. Update bel
app.put('/api/bells/:id', (req, res) => {
  const { id } = req.params;
  const { name, time, days, audio, active } = req.body;
  
  const bells = readBells();
  const bellIndex = bells.findIndex(b => b.id === id);
  
  if (bellIndex === -1) {
    return res.status(404).json({ error: 'Bel tidak ditemukan' });
  }
  
  bells[bellIndex] = {
    ...bells[bellIndex],
    name: name || bells[bellIndex].name,
    time: time || bells[bellIndex].time,
    days: days || bells[bellIndex].days,
    audio: audio || bells[bellIndex].audio,
    active: active !== undefined ? active : bells[bellIndex].active
  };
  
  writeBells(bells);
  res.json(bells[bellIndex]);
});

// 6. Delete bel
app.delete('/api/bells/:id', (req, res) => {
  const { id } = req.params;
  
  let bells = readBells();
  const bellIndex = bells.findIndex(b => b.id === id);
  
  if (bellIndex === -1) {
    return res.status(404).json({ error: 'Bel tidak ditemukan' });
  }
  
  const deletedBell = bells[bellIndex];
  bells = bells.filter(b => b.id !== id);
  writeBells(bells);
  
  res.json({ message: 'Bel berhasil dihapus', bell: deletedBell });
});

// 7. Test trigger bel (untuk testing manual)
app.post('/api/bells/:id/test', (req, res) => {
  const { id } = req.params;
  const bells = readBells();
  const bell = bells.find(b => b.id === id);
  
  if (!bell) {
    return res.status(404).json({ error: 'Bel tidak ditemukan' });
  }
  
  console.log(`[TEST] Bel "${bell.name}" diputar: ${bell.audio}`);
  
  res.json({
    message: 'Bel test berhasil dipicu',
    bell: bell.name,
    audio: bell.audio
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔔 School Bell System berjalan di http://localhost:${PORT}`);
  console.log(`📁 File konfigurasi: ${BELLS_FILE}`);
  console.log(`🎵 Folder audio: ${path.join(__dirname, 'audio')}`);
});
