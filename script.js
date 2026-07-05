const financeKey = 'ciceri-finance';
const residentKey = 'ciceri-residents';
const announcementKey = 'ciceri-announcements';
const activityKey = 'ciceri-activities';
const adminKey = 'ciceri-admin';
const adminCredentials = { username: 'admin', password: 'ciceri123' };
let financeData = [];
let residentData = [];
let announcementData = [];
let activityData = [];

const defaultFinance = [
  { id: 1, type: 'Pemasukan', amount: 5000000, description: 'Sumbangan warga', date: '2026-07-01' },
  { id: 2, type: 'Pengeluaran', amount: 1200000, description: 'Perbaikan jalan', date: '2026-07-02' },
  { id: 3, type: 'Pemasukan', amount: 2500000, description: 'Donasi kegiatan posyandu', date: '2026-07-03' }
];

const defaultResidents = [
  { id: 1, name: 'Bapak Somantri', note: 'Kebutuhan bantuan sembako', status: 'Prioritas' },
  { id: 2, name: 'Ibu Lina', note: 'Aktif dalam kegiatan PKK', status: 'Aktif' },
  { id: 3, name: 'Rizki', note: 'Perlu pantauan kesehatan', status: 'Perlu Pantauan' }
];

const defaultAnnouncements = [
  { id: 1, title: 'Rapat Warga', body: 'Rapat bulanan akan dilaksanakan Jumat malam pukul 20.00 di balai desa.' },
  { id: 2, title: 'Penyaluran Bantuan', body: 'Distribusi bantuan sosial diprioritaskan untuk warga yang tercatat berstatus prioritas.' },
  { id: 3, title: 'Jaga Kebersihan', body: 'Setiap RT diminta rutin membersihkan lingkungan pada hari Sabtu pagi.' }
];

const defaultActivities = [
  { id: 1, title: 'Senin', body: 'Gotong royong membersihkan saluran air.' },
  { id: 2, title: 'Rabu', body: 'Posyandu dan pemeriksaan kesehatan anak.' },
  { id: 3, title: 'Jumat', body: 'Musyawarah pembagian bantuan masyarakat.' }
];

function loadData(key, fallback) {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function renderStats(finance) {
  const totalIncome = finance.filter((item) => item.type === 'Pemasukan').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = finance.filter((item) => item.type === 'Pengeluaran').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const stats = [
    { label: 'Saldo', value: formatRupiah(balance) },
    { label: 'Pemasukan', value: formatRupiah(totalIncome) },
    { label: 'Pengeluaran', value: formatRupiah(totalExpense) },
    { label: 'Kas Bulan Ini', value: formatRupiah(balance) }
  ];

  document.getElementById('statsGrid').innerHTML = stats
    .map((item) => `<div class="stat-card"><h3>${item.label}</h3><p>${item.value}</p></div>`)
    .join('');
}

function renderTransactions(finance) {
  const list = document.getElementById('transactionList');
  const dateFilter = document.getElementById('financeFilterDate').value;
  const typeFilter = document.getElementById('financeFilterType').value;
  const filtered = finance.filter((item) => {
    const matchesDate = !dateFilter || item.date === dateFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesDate && matchesType;
  });

  if (!filtered.length) {
    list.innerHTML = '<li>Belum ada transaksi yang sesuai filter.</li>';
    return;
  }

  list.innerHTML = filtered
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((item) => `
      <li class="resident-item">
        <div>
          <strong>${item.type}</strong> · ${formatRupiah(item.amount)}<br />
          <small>${item.description} · ${item.date}</small>
        </div>
        <div class="resident-actions">
          <button class="ghost-btn small-btn" data-finance-action="edit" data-id="${item.id}">Edit</button>
          <button class="ghost-btn small-btn danger-btn" data-finance-action="delete" data-id="${item.id}">Hapus</button>
        </div>
      </li>
    `)
    .join('');
}

function getStatusClass(status) {
  if (status === 'Prioritas') return 'priority';
  if (status === 'Perlu Pantauan') return 'warning';
  return 'active';
}

function renderDashboard(finance, residents) {
  const totalIncome = finance.filter((item) => item.type === 'Pemasukan').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = finance.filter((item) => item.type === 'Pengeluaran').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;
  const priorityResidents = residents.filter((resident) => resident.status === 'Prioritas').length;
  const monitoringResidents = residents.filter((resident) => resident.status === 'Perlu Pantauan').length;

  document.getElementById('reportBalance').textContent = formatRupiah(balance);
  document.getElementById('reportIncome').textContent = formatRupiah(totalIncome);
  document.getElementById('reportExpense').textContent = formatRupiah(totalExpense);
  document.getElementById('reportPriority').textContent = `${priorityResidents} warga`;

  const stats = [
    { label: 'Saldo Kas', value: formatRupiah(balance) },
    { label: 'Warga Terdaftar', value: residents.length },
    { label: 'Prioritas', value: priorityResidents },
    { label: 'Perlu Pantauan', value: monitoringResidents }
  ];

  document.getElementById('dashboardStats').innerHTML = stats
    .map((item) => `<div class="stat-card"><h3>${item.label}</h3><p>${item.value}</p></div>`)
    .join('');
}

function renderResidents(residents, query = '', statusFilter = '') {
  const list = document.getElementById('residentList');
  const filtered = residents.filter((resident) => {
    const matchesName = resident.name.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !statusFilter || resident.status === statusFilter;
    return matchesName && matchesStatus;
  });

  if (!filtered.length) {
    list.innerHTML = '<li>Tidak ada data warga yang cocok.</li>';
    return;
  }

  list.innerHTML = filtered
    .map((resident) => `
      <li class="resident-item">
        <div>
          <strong>${resident.name}</strong><br />
          <small>${resident.note}</small><br />
          <span class="badge ${getStatusClass(resident.status)}">${resident.status}</span>
        </div>
        <div class="resident-actions">
          <button class="ghost-btn small-btn" data-action="edit" data-id="${resident.id}">Edit</button>
          <button class="ghost-btn small-btn danger-btn" data-action="delete" data-id="${resident.id}">Hapus</button>
        </div>
      </li>
    `)
    .join('');
}

function setAdminState(isLoggedIn) {
  localStorage.setItem(adminKey, isLoggedIn ? 'true' : 'false');
  document.getElementById('loginBtn').textContent = isLoggedIn ? 'Keluar Admin' : 'Login Admin';
  document.getElementById('adminNotice').classList.toggle('hidden', !isLoggedIn);
  document.querySelectorAll('.admin-only').forEach((element) => {
    element.classList.toggle('hidden', !isLoggedIn);
  });
  document.getElementById('loginModal').classList.toggle('hidden', true);
  renderAnnouncements(announcementData);
  renderActivities(activityData);
}

function renderAnnouncements(announcements) {
  const list = document.getElementById('announcementList');
  if (!announcements.length) {
    list.innerHTML = '<div class="card highlight-card"><p>Belum ada pengumuman.</p></div>';
    return;
  }

  list.innerHTML = announcements
    .map((item) => `
      <div class="card highlight-card announcement-item">
        ${localStorage.getItem(adminKey) === 'true' ? '<button class="announcement-close" data-announcement-id="' + item.id + '" aria-label="hapus">×</button>' : ''}
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </div>
    `)
    .join('');
}

function renderActivities(activities) {
  const list = document.getElementById('activityList');
  if (!activities.length) {
    list.innerHTML = '<div class="card"><p>Belum ada kegiatan.</p></div>';
    return;
  }

  list.innerHTML = activities
    .map((item) => `
      <div class="card activity-item">
        ${localStorage.getItem(adminKey) === 'true' ? '<button class="activity-close" data-activity-id="' + item.id + '" aria-label="hapus">×</button>' : ''}
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </div>
    `)
    .join('');
}

function exportToCsv(filename, headers, rows) {
  const content = [headers.join(','), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function init() {
  financeData = loadData(financeKey, defaultFinance);
  residentData = loadData(residentKey, defaultResidents);
  announcementData = loadData(announcementKey, defaultAnnouncements);
  activityData = loadData(activityKey, defaultActivities);
  const isLoggedIn = localStorage.getItem(adminKey) === 'true';

  setAdminState(isLoggedIn);

  renderDashboard(financeData, residentData);
  renderStats(financeData);
  renderTransactions(financeData);
  renderResidents(residentData);
  renderAnnouncements(announcementData);
  renderActivities(activityData);

  document.getElementById('financeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      id: Date.now(),
      type: document.getElementById('type').value,
      amount: Number(document.getElementById('amount').value),
      description: document.getElementById('description').value,
      date: document.getElementById('date').value
    };

    const editId = Number(event.target.dataset.editId || 0);
    if (editId) {
      financeData = financeData.map((item) => item.id === editId ? { ...item, ...data, id: editId } : item);
    } else {
      financeData.push(data);
    }

    saveData(financeKey, financeData);
    renderDashboard(financeData, residentData);
    renderStats(financeData);
    renderTransactions(financeData);
    event.target.reset();
    event.target.removeAttribute('data-edit-id');
    document.querySelector('#financeForm .btn').textContent = 'Simpan';
  });

  document.getElementById('residentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      id: Date.now(),
      name: document.getElementById('residentName').value,
      note: document.getElementById('residentNote').value,
      status: document.getElementById('residentStatus').value
    };

    const editId = Number(event.target.dataset.editId || 0);
    if (editId) {
      residentData = residentData.map((item) => item.id === editId ? { ...item, ...data } : item);
    } else {
      residentData.push(data);
    }

    saveData(residentKey, residentData);
    renderDashboard(financeData, residentData);
    renderResidents(residentData, document.getElementById('searchInput').value, document.getElementById('residentFilterStatus').value);
    event.target.reset();
    event.target.removeAttribute('data-edit-id');
    document.querySelector('#residentForm .btn').textContent = 'Simpan';
  });

  document.getElementById('searchInput').addEventListener('input', (event) => {
    renderResidents(residentData, event.target.value, document.getElementById('residentFilterStatus').value);
  });

  document.getElementById('residentFilterStatus').addEventListener('change', (event) => {
    renderResidents(residentData, document.getElementById('searchInput').value, event.target.value);
  });

  document.getElementById('residentList').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.getAttribute('data-id'));
    const action = button.getAttribute('data-action');
    const resident = residentData.find((item) => item.id === id);

    if (!resident) return;

    if (action === 'delete') {
      residentData = residentData.filter((item) => item.id !== id);
      saveData(residentKey, residentData);
      renderDashboard(financeData, residentData);
      renderResidents(residentData, document.getElementById('searchInput').value, document.getElementById('residentFilterStatus').value, document.getElementById('residentFilterStatus').value);
      return;
    }

    if (action === 'edit') {
      document.getElementById('residentName').value = resident.name;
      document.getElementById('residentNote').value = resident.note;
      document.getElementById('residentStatus').value = resident.status;
      document.getElementById('residentName').focus();
      document.getElementById('residentForm').dataset.editId = id;
      document.querySelector('#residentForm .btn').textContent = 'Perbarui';
    }
  });

  document.getElementById('transactionList').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-finance-action]');
    if (!button) return;

    const id = Number(button.getAttribute('data-id'));
    const action = button.getAttribute('data-finance-action');
    const transaction = financeData.find((item) => item.id === id);

    if (!transaction) return;

    if (action === 'delete') {
      financeData = financeData.filter((item) => item.id !== id);
      saveData(financeKey, financeData);
      renderDashboard(financeData, residentData);
      renderStats(financeData);
      renderTransactions(financeData);
      return;
    }

    if (action === 'edit') {
      document.getElementById('type').value = transaction.type;
      document.getElementById('amount').value = transaction.amount;
      document.getElementById('description').value = transaction.description;
      document.getElementById('date').value = transaction.date;
      document.getElementById('amount').focus();
      document.getElementById('financeForm').dataset.editId = id;
      document.querySelector('#financeForm .btn').textContent = 'Perbarui';
    }
  });

  document.getElementById('financeFilterDate').addEventListener('input', () => renderTransactions(financeData));
  document.getElementById('financeFilterType').addEventListener('change', () => renderTransactions(financeData));

  document.getElementById('exportFinanceBtn').addEventListener('click', () => {
    const rows = financeData.map((item) => [item.date, item.type, item.description, item.amount]);
    exportToCsv('keuangan-ciceri-jaya.csv', ['Tanggal', 'Jenis', 'Keterangan', 'Nominal'], rows);
  });

  document.getElementById('exportResidentBtn').addEventListener('click', () => {
    const rows = residentData.map((item) => [item.name, item.note, item.status]);
    exportToCsv('penduduk-ciceri-jaya.csv', ['Nama', 'Keterangan', 'Status'], rows);
  });

  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (!confirm('Reset semua data ke data awal?')) return;
    financeData = [...defaultFinance];
    residentData = [...defaultResidents];
    announcementData = [...defaultAnnouncements];
    activityData = [...defaultActivities];
    saveData(financeKey, financeData);
    saveData(residentKey, residentData);
    saveData(announcementKey, announcementData);
    saveData(activityKey, activityData);
    renderDashboard(financeData, residentData);
    renderStats(financeData);
    renderTransactions(financeData);
    renderResidents(residentData, document.getElementById('searchInput').value, document.getElementById('residentFilterStatus').value);
    renderAnnouncements(announcementData);
    renderActivities(activityData);
  });

  document.getElementById('announcementForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      id: Date.now(),
      title: document.getElementById('announcementTitle').value.trim(),
      body: document.getElementById('announcementBody').value.trim()
    };

    announcementData.unshift(data);
    saveData(announcementKey, announcementData);
    renderAnnouncements(announcementData);
    event.target.reset();
  });

  document.getElementById('announcementList').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-announcement-id]');
    if (!button) return;
    const id = Number(button.getAttribute('data-announcement-id'));
    announcementData = announcementData.filter((item) => item.id !== id);
    saveData(announcementKey, announcementData);
    renderAnnouncements(announcementData);
  });

  document.getElementById('activityForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      id: Date.now(),
      title: document.getElementById('activityTitle').value.trim(),
      body: document.getElementById('activityBody').value.trim()
    };

    activityData.unshift(data);
    saveData(activityKey, activityData);
    renderActivities(activityData);
    event.target.reset();
  });

  document.getElementById('activityList').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-activity-id]');
    if (!button) return;
    const id = Number(button.getAttribute('data-activity-id'));
    activityData = activityData.filter((item) => item.id !== id);
    saveData(activityKey, activityData);
    renderActivities(activityData);
  });

  document.getElementById('printReportBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('loginBtn').addEventListener('click', () => {
    const isLoggedIn = localStorage.getItem(adminKey) === 'true';
    if (isLoggedIn) {
      setAdminState(false);
      return;
    }
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginError').textContent = '';
  });

  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorText = document.getElementById('loginError');

    if (username === adminCredentials.username && password === adminCredentials.password) {
      setAdminState(true);
      event.target.reset();
      return;
    }

    errorText.textContent = 'Username atau password salah.';
  });

  document.getElementById('loginModal').addEventListener('click', (event) => {
    if (event.target.id === 'loginModal') {
      document.getElementById('loginModal').classList.add('hidden');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
