// ========== GLOBAL STATE ==========
let allBells = [];
let audioFiles = [];

// ========== DOM ELEMENTS ==========
const wibTimeDisplay = document.getElementById('wibTime');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const addBellForm = document.getElementById('addBellForm');
const refreshAudioBtn = document.getElementById('refreshAudio');
const audioFileSelect = document.getElementById('audioFile');
const editAudioSelect = document.getElementById('editAudioFile');
const bellsList = document.getElementById('bellsList');
const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const cancelEditModalBtn = document.getElementById('cancelEditModal');
const editBellForm = document.getElementById('editBellForm');

// ========== UTILITY FUNCTIONS ==========

/**
 * Update waktu WIB secara real-time
 */
async function updateWIBTime() {
    try {
        const response = await fetch('/api/time');
        const data = await response.json();
        wibTimeDisplay.textContent = data.hourMinute + ' WIB';
    } catch (error) {
        console.error('Error fetching time:', error);
        wibTimeDisplay.textContent = '-- WIB';
    }
}

/**
 * Load daftar file audio
 */
async function loadAudioFiles() {
    try {
        const response = await fetch('/api/audio-files');
        audioFiles = await response.json();
        updateAudioSelects();
    } catch (error) {
        console.error('Error loading audio files:', error);
        showAlert('error', 'Gagal memuat daftar file audio');
    }
}

/**
 * Update opsi audio di semua select element
 */
function updateAudioSelects() {
    const selects = [audioFileSelect, editAudioSelect];
    
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Pilih File Audio --</option>';
        
        audioFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

/**
 * Load semua bel dari server
 */
async function loadBells() {
    try {
        const response = await fetch('/api/bells');
        allBells = await response.json();
        renderBells();
    } catch (error) {
        console.error('Error loading bells:', error);
        bellsList.innerHTML = '<div class="alert error">Gagal memuat data bel</div>';
    }
}

/**
 * Render daftar bel
 */
function renderBells() {
    if (allBells.length === 0) {
        bellsList.innerHTML = '<div class="loading">Belum ada bel yang ditambahkan</div>';
        return;
    }

    bellsList.innerHTML = allBells.map(bell => `
        <div class="bell-card ${bell.active ? '' : 'inactive'}">
            <div class="bell-header">
                <div class="bell-name">🔔 ${escapeHtml(bell.name)}</div>
                <span class="bell-status ${bell.active ? 'active' : 'inactive'}">
                    ${bell.active ? '✓ Aktif' : '✗ Tidak Aktif'}
                </span>
            </div>

            <div class="bell-info">
                <div class="bell-info-row">
                    <span class="bell-info-label">⏰ Waktu:</span>
                    <span class="bell-info-value"><strong>${bell.time}</strong></span>
                </div>
                <div class="bell-info-row">
                    <span class="bell-info-label">📅 Hari:</span>
                    <span class="bell-info-value">
                        <div class="bell-days">
                            ${bell.days.map(day => `<span class="day-badge">${day}</span>`).join('')}
                        </div>
                    </span>
                </div>
                <div class="bell-info-row">
                    <span class="bell-info-label">🎵 Audio:</span>
                    <span class="bell-info-value">${escapeHtml(bell.audio)}</span>
                </div>
            </div>

            <div class="bell-actions">
                <button type="button" class="btn-icon btn-test" onclick="testBell('${bell.id}')">🔊 Test</button>
                <button type="button" class="btn-icon btn-edit" onclick="openEditModal('${bell.id}')">✏️ Edit</button>
                <button type="button" class="btn-icon btn-delete" onclick="deleteBell('${bell.id}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

/**
 * Escape HTML untuk prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.main-content');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

/**
 * Get selected days dari checkbox
 */
function getSelectedDays(container = document.body) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"][name="days"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Set selected days ke checkbox
 */
function setSelectedDays(days, container = document.body) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"][name="days"]');
    checkboxes.forEach(cb => {
        cb.checked = days.includes(cb.value);
    });
}

// ========== BELL OPERATIONS ==========

/**
 * Add bel baru
 */
async function addBell(e) {
    e.preventDefault();

    const name = document.getElementById('bellName').value.trim();
    const time = document.getElementById('bellTime').value;
    const days = getSelectedDays();
    const audio = audioFileSelect.value;
    const active = document.getElementById('bellActive').checked;

    if (!name || !time || days.length === 0 || !audio) {
        showAlert('error', 'Semua field harus diisi dan hari minimal 1 harus dipilih');
        return;
    }

    try {
        const response = await fetch('/api/bells', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, time, days, audio, active })
        });

        if (!response.ok) {
            throw new Error('Gagal menambah bel');
        }

        showAlert('success', `Bel "${name}" berhasil ditambahkan!`);
        addBellForm.reset();
        loadBells();

        // Switch ke tab daftar bel
        switchTab('list');
    } catch (error) {
        console.error('Error adding bell:', error);
        showAlert('error', 'Gagal menambah bel');
    }
}

/**
 * Test bell (play audio)
 */
async function testBell(bellId) {
    try {
        const response = await fetch(`/api/bells/${bellId}/test`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Gagal test bel');
        }

        const data = await response.json();
        const bell = allBells.find(b => b.id === bellId);
        
        // Play audio jika ada di client
        const audioPath = `/audio/${bell.audio}`;
        const audio = new Audio(audioPath);
        audio.play().catch(() => {
            showAlert('error', 'Gagal memutar audio');
        });

        showAlert('success', `Testing bel: ${data.bell}`);
    } catch (error) {
        console.error('Error testing bell:', error);
        showAlert('error', 'Gagal test bel');
    }
}

/**
 * Open edit modal
 */
function openEditModal(bellId) {
    const bell = allBells.find(b => b.id === bellId);
    if (!bell) return;

    document.getElementById('editBellId').value = bell.id;
    document.getElementById('editBellName').value = bell.name;
    document.getElementById('editBellTime').value = bell.time;
    document.getElementById('editAudioFile').value = bell.audio;
    document.getElementById('editBellActive').checked = bell.active;
    setSelectedDays(bell.days, editModal);

    editModal.classList.add('active');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.classList.remove('active');
}

/**
 * Update bel
 */
async function updateBell(e) {
    e.preventDefault();

    const bellId = document.getElementById('editBellId').value;
    const name = document.getElementById('editBellName').value.trim();
    const time = document.getElementById('editBellTime').value;
    const days = Array.from(editModal.querySelectorAll('.edit-days:checked')).map(cb => cb.value);
    const audio = editAudioSelect.value;
    const active = document.getElementById('editBellActive').checked;

    if (!name || !time || days.length === 0 || !audio) {
        showAlert('error', 'Semua field harus diisi dan hari minimal 1 harus dipilih');
        return;
    }

    try {
        const response = await fetch(`/api/bells/${bellId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, time, days, audio, active })
        });

        if (!response.ok) {
            throw new Error('Gagal update bel');
        }

        showAlert('success', `Bel "${name}" berhasil diperbarui!`);
        closeEditModal();
        loadBells();
    } catch (error) {
        console.error('Error updating bell:', error);
        showAlert('error', 'Gagal update bel');
    }
}

/**
 * Delete bel
 */
async function deleteBell(bellId) {
    const bell = allBells.find(b => b.id === bellId);
    if (!bell) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus bel "${bell.name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/bells/${bellId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Gagal hapus bel');
        }

        showAlert('success', `Bel "${bell.name}" berhasil dihapus!`);
        loadBells();
    } catch (error) {
        console.error('Error deleting bell:', error);
        showAlert('error', 'Gagal hapus bel');
    }
}

// ========== UI INTERACTIONS ==========

/**
 * Switch tab
 */
function switchTab(tabName) {
    // Hide all tabs
    tabContents.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ========== EVENT LISTENERS ==========

// Tab navigation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        switchTab(tabName);
    });
});

// Form submissions
addBellForm.addEventListener('submit', addBell);
editBellForm.addEventListener('submit', updateBell);

// Audio refresh button
refreshAudioBtn.addEventListener('click', () => {
    loadAudioFiles();
    showAlert('success', 'Daftar audio di-refresh!');
});

// Modal controls
closeEditModalBtn.addEventListener('click', closeEditModal);
cancelEditModalBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// ========== INITIALIZATION ==========

/**
 * Initialize aplikasi
 */
async function init() {
    console.log('Initializing School Bell System...');
    
    // Update waktu setiap detik
    updateWIBTime();
    setInterval(updateWIBTime, 1000);
    
    // Load data
    await loadAudioFiles();
    await loadBells();
    
    console.log('✅ School Bell System ready!');
}

// Start aplikasi ketika DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
