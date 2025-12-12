/* script.js - fixed version
   - Restores initialization and event bindings
   - Keeps transaction state accessible so users can add input to the table
   - Integrates with chart.js and ai-insight.js (expects updateChart/updateAIInsight to exist)
*/

const STORAGE_KEY = 'savedTransactions';
let transactions = [];
let editIndex = null;

// DOM helpers
const $ = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

// --- Initialization ---
function init() {
  bindUI();
  loadSaved();
  renderAll();
  // entrance animations can be run if GSAP is present
  if (window.gsap) {
    try {
      gsap.from('.card, .form-section, .table-section, .chart-section', { y: 8, opacity: 0, stagger: 0.04, duration: 0.35, ease: 'power2.out' });
    } catch (err) {
      console.warn('GSAP entrance animation skipped', err);
    }
  }
}

function bindUI() {
  const form = $('transactionForm');
  if (form) form.addEventListener('submit', onAddTransaction);

  const saveBtn = $('saveTableLocalStorage');
  if (saveBtn) saveBtn.addEventListener('click', saveTable);

  const exportBtn = $('saveAsExcel');
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);

  const importLSBtn = $('importFromLocalStorage');
  if (importLSBtn) importLSBtn.addEventListener('click', importTable);

  const importFileInput = $('importFromExcel');
  const importFileBtn = document.querySelector('.import-btn');
  if (importFileBtn && importFileInput) {
    importFileBtn.addEventListener('click', () => {
      importFileInput.click();
    });
    importFileInput.addEventListener('change', handleFileImport);
  }

  const shareBtn = $('shareBtn');
  if (shareBtn) shareBtn.addEventListener('click', openSharePanel);

  // Close share panel button
  const sharePanelClose = document.querySelector('#sharePanel .close');
  if (sharePanelClose) sharePanelClose.addEventListener('click', closeSharePanel);

  // Settings open/close
  const settingsBtn = $('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsPanel);
  const settingsClose = document.querySelector('#settingsPanel .close');
  if (settingsClose) settingsClose.addEventListener('click', closeSettingsPanel);

  // Save settings (currency select handled in handling.js already binds saveSettingsBtn in that file)
  const saveSettingsBtn = $('saveSettingsBtn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
    const selectedCurrency = $('currencySelect') ? $('currencySelect').value : 'USD';
    if (typeof setAppCurrency === 'function') setAppCurrency(selectedCurrency);
    closeSettingsPanel();
  });

  // Menu overlay and hamburger
  const menuToggle = $('menuToggleBtn');
  const menuOverlay = $('menuOverlay');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar && menuOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      menuOverlay.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    menuOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      menuOverlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  }

  // Share panel copy button
  const copyBtn = document.querySelector('#sharePanel button[onclick="copyTableToClipboard()"]');
  if (copyBtn) copyBtn.addEventListener('click', copyTableToClipboard);

  // Close settings on outside click (already implemented below in original repo; keep guard)
  document.addEventListener('click', (e) => {
    const panel = $('settingsPanel');
    const btn = $('settings-btn');
    if (!panel || !panel.classList.contains('open')) return;
    if (btn && (btn.contains(e.target) || panel.contains(e.target))) return;
    closeSettingsPanel();
  });

  // Reposition settings on resize (original behavior)
  window.addEventListener('resize', () => {
    const panel = $('settingsPanel');
    if (!panel || !panel.classList.contains('open')) return;
    const btn = $('settings-btn');
    if (!btn) return;
    if (window.innerWidth > 768) {
      const rect = btn.getBoundingClientRect();
      panel.style.position = 'absolute';
      panel.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      panel.style.left = (rect.left + window.scrollX) + 'px';
      panel.style.right = 'auto';
      panel.style.width = '260px';
    } else {
      panel.style.position = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.width = '';
    }
  });
}

// --- Form / Transactions ---
function onAddTransaction(e) {
  e.preventDefault();
  const desc = ($('desc') && $('desc').value.trim()) || '';
  const amountRaw = $('amount') ? $('amount').value : '';
  const amount = parseFloat(amountRaw);
  const type = $('type') ? $('type').value : 'expense';
  const category = $('category') ? $('category').value : 'General';
  const date = new Date().toLocaleDateString();

  if (!desc || isNaN(amount)) {
    alert('Please enter a valid description and amount.');
    return;
  }

  const transaction = { desc, amount, type, category, date };

  if (editIndex !== null && Number.isInteger(editIndex)) {
    transactions[editIndex] = transaction;
    editIndex = null;
    const addBtn = $('add-btn');
    if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Add';
  } else {
    transactions.push(transaction);
  }

  // Reset form
  if ($('transactionForm')) $('transactionForm').reset();

  // Update UI
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

// --- Render / Update helpers ---
function renderAll() {
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

function updateSummary() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  if ($('totalIncome')) $('totalIncome').textContent = `$${income.toFixed(2)}`;
  if ($('totalExpenses')) $('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
  if ($('balance')) $('balance').textContent = `$${(income - expenses).toFixed(2)}`;
}

function updateTable() {
  const tbody = document.querySelector('#expenseDisplay tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  transactions.forEach((t, index) => {
    const row = document.createElement('tr');

    if (index === editIndex) {
      row.innerHTML = `
        <td><input type="text" value="${escapeHtml(t.desc)}" id="edit-desc-${index}" /></td>
        <td><input type="number" value="${t.amount}" id="edit-amount-${index}" /></td>
        <td>
          <select id="edit-type-${index}">
            <option value="income" ${t.type === 'income' ? 'selected' : ''}>Income</option>
            <option value="expense" ${t.type === 'expense' ? 'selected' : ''}>Expense</option>
          </select>
        </td>
        <td>
          <select id="edit-category-${index}">
            ${['General', 'Food', 'Transport', 'Bills', 'Entertainment'].map(cat =>
              `<option value="${cat}" ${t.category === cat ? 'selected' : ''}>${cat}</option>`
            ).join('')}
          </select>
        </td>
        <td>${t.date}</td>
        <td>
          <button onclick="saveEdit(${index})">Save <i class="fa-solid fa-floppy-disk"></i></button>
          <button onclick="cancelEdit()">Cancel <i class="fa-solid fa-xmark"></i></button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td>${escapeHtml(t.desc)}</td>
        <td>$${Number(t.amount).toFixed(2)}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>
          <button onclick="editTransaction(${index})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
          <button onclick="deleteTransaction(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
          <button onclick="markDone(${index})"><i class="fa-solid fa-check"></i> Done</button>
          <button onclick="markImportant(${index})"><i class="fa-solid fa-star"></i> Important</button>
        </td>
      `;
    }

    tbody.appendChild(row);
  });

  // animate rows if gsap available
  if (window.gsap) {
    try {
      const rows = Array.from(tbody.children);
      if (rows.length) gsap.from(rows, { y: 8, opacity: 0, stagger: 0.03, duration: 0.35, ease: 'power2.out' });
    } catch (err) {
      // ignore
    }
  }
}

// --- Edit / Delete / Mark ---
function deleteTransaction(index) {
  if (!Number.isInteger(index) || index < 0 || index >= transactions.length) return;
  transactions.splice(index, 1);
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

function editTransaction(index) {
  if (!Number.isInteger(index) || index < 0 || index >= transactions.length) return;
  editIndex = index;
  const addBtn = $('add-btn');
  if (addBtn) addBtn.innerHTML = 'Save';
  updateTable();
}

function cancelEdit() {
  editIndex = null;
  const addBtn = $('add-btn');
  if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Add';
  updateTable();
}

function saveEdit(index) {
  const descEl = $(`edit-desc-${index}`);
  const amountEl = $(`edit-amount-${index}`);
  const typeEl = $(`edit-type-${index}`);
  const categoryEl = $(`edit-category-${index}`);
  if (!descEl || !amountEl || !typeEl || !categoryEl) return;

  const desc = descEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const type = typeEl.value;
  const category = categoryEl.value;
  const date = transactions[index] ? transactions[index].date : new Date().toLocaleDateString();

  if (!desc || isNaN(amount)) {
    alert('Please enter valid description and amount.');
    return;
  }

  transactions[index] = { desc, amount, type, category, date };
  editIndex = null;
  const addBtn = $('add-btn');
  if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Add';
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

function markDone(index) {
  const tbody = document.querySelector('#expenseDisplay tbody');
  const row = tbody && tbody.children[index];
  if (row) row.classList.toggle('done');
}

function markImportant(index) {
  const tbody = document.querySelector('#expenseDisplay tbody');
  const row = tbody && tbody.children[index];
  if (row) row.classList.toggle('important');
}

// --- Export / Import / Save ---
function exportPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF export requires jsPDF to be loaded.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("FinSight Budget Summary", 10, 10);
  let y = 20;
  transactions.forEach((t, i) => {
    doc.text(`${i + 1}. ${t.desc} - $${t.amount} - ${t.type} - ${t.category} - ${t.date}`, 10, y);
    y += 10;
    if (y > 270) { doc.addPage(); y = 10; }
  });
  doc.save("FinSight-Budget.pdf");
}

function saveTable() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  alert("Table saved to localStorage!");
}

function exportCSV() {
  let csv = "Description,Amount,Type,Category,Date\n";
  transactions.forEach(t => {
    csv += `"${t.desc}",${t.amount},"${t.type}","${t.category}","${t.date}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "FinSight-Export.csv";
  link.click();
}

function importTable() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!saved || !Array.isArray(saved) || saved.length === 0) return alert("No saved data found.");
  transactions = saved;
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

function handleFileImport(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target.result;
    parseCSVText(text);
  };
  reader.readAsText(file);
  // clear input
  e.target.value = '';
}

function parseCSVText(text) {
  // Very basic CSV parser for expected format
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  if (lines.length <= 1) return alert('CSV contains no data.');
  const dataLines = lines.slice(1);
  const parsed = dataLines.map(line => {
    // split on commas not inside quotes (simple)
    const parts = line.match(/(?:\"([^\"]*)\")|([^,]+)/g).map(p => p.replace(/^"|"$/g, ''));
    return {
      desc: parts[0] || '',
      amount: parseFloat(parts[1]) || 0,
      type: (parts[2] || 'expense').replace(/"/g, ''),
      category: (parts[3] || 'General').replace(/"/g, ''),
      date: parts[4] || new Date().toLocaleDateString()
    };
  });
  transactions = transactions.concat(parsed);
  updateTable();
  updateSummary();
  if (typeof updateChart === 'function') updateChart(transactions);
  if (typeof updateAIInsight === 'function') updateAIInsight(transactions);
}

// --- Share Panel ---
function openSharePanel() {
  const panel = $('sharePanel');
  if (!panel) return;
  panel.classList.add('open');
  const text = transactions.map(t =>
    `${t.desc}\t$${t.amount}\t${t.type}\t${t.category}\t${t.date}`
  ).join("\n");
  const textarea = $('tableShareText');
  if (textarea) textarea.value = text;
}

function closeSharePanel() {
  const panel = $('sharePanel');
  if (!panel) return;
  panel.classList.remove('open');
}

function copyTableToClipboard() {
  const textarea = $('tableShareText');
  if (!textarea) return;
  navigator.clipboard.writeText(textarea.value)
    .then(() => alert("Table copied to clipboard!"))
    .catch(err => console.error("Copy failed:", err));
}

// --- Settings panel (light helpers, main behavior is in handling.js) ---
function openSettingsPanel() {
  const btn = $('settings-btn');
  const panel = $('settingsPanel');
  if (!btn || !panel) return;
  const chevron = btn.querySelector('.fa-chevron-down, .fa-chevron-up');

  if (panel.classList.contains('open')) {
    closeSettingsPanel();
    return;
  }

  if (window.innerWidth > 768) {
    const rect = btn.getBoundingClientRect();
    panel.style.position = 'absolute';
    panel.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    panel.style.left = (rect.left + window.scrollX) + 'px';
    panel.style.right = 'auto';
    panel.style.width = '260px';
  } else {
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.width = '';
  }

  panel.style.display = 'block';
  panel.classList.add('open');
  if (chevron) {
    chevron.classList.remove('fa-chevron-down');
    chevron.classList.add('fa-chevron-up');
  }
}

function closeSettingsPanel() {
  const btn = $('settings-btn');
  const panel = $('settingsPanel');
  if (!panel) return;
  const chevron = btn ? btn.querySelector('.fa-chevron-down, .fa-chevron-up') : null;

  panel.classList.remove('open');
  panel.style.position = '';
  panel.style.top = '';
  panel.style.left = '';
  panel.style.right = '';
  panel.style.width = '';
  panel.style.display = 'none';

  if (chevron) {
    chevron.classList.remove('fa-chevron-up');
    chevron.classList.add('fa-chevron-down');
  }
}

// --- Persistence ---
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) transactions = saved;
  } catch (err) {
    console.warn('Failed to parse saved transactions', err);
  }
}

// --- Utilities ---
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// expose some functions globally for inline onclicks in HTML
window.exportPDF = exportPDF;
window.exportCSV = exportCSV;
window.importTable = importTable;
window.openSharePanel = openSharePanel;
window.copyTableToClipboard = copyTableToClipboard;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;
window.markDone = markDone;
window.markImportant = markImportant;
window.openSettingsPanel = openSettingsPanel;
window.closeSettingsPanel = closeSettingsPanel;

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
