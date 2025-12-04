let transactions = [];
let chart;
let editIndex = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Form & Controls
  document.getElementById('transactionForm').addEventListener('submit', addTransaction);
  document.getElementById('toggle-dark').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
  document.getElementById('saveTableLocalStorage').addEventListener('click', saveTable);
  document.getElementById('saveAsExcel').addEventListener('click', exportCSV);
  document.getElementById('importFromLocalStorage').addEventListener('click', importTable);

  // Enter to next input field
  document.getElementById('transactionForm').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElements = Array.from(this.elements).filter(el => el.tagName === 'INPUT' || el.tagName === 'SELECT');
      const index = formElements.indexOf(e.target);
      if (index > -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  }); 

  // Settings
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const notificationsEnabled = document.getElementById('notificationsToggle').checked;
    const dataSyncEnabled = document.getElementById('dataSyncToggle').checked; 
    alert('Settings saved!');
    closeSettingsPanel();
  });
  // Currency & Language (currently informational)
  document.getElementById('currencySelect').addEventListener('change', (e) => {
    const currency = e.target.value;
    alert(`Currency changed to ${currency}. (Feature coming soon)`);
  });
  document.getElementById('languageSelect').addEventListener('change', (e) => {
    const language = e.target.value;
    alert(`Language changed to ${language}. (Feature coming soon)`);
  });

  // Sidebar animation (GSAP/Hamburger)
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.getElementById('menuToggleBtn');
  const overlay = document.getElementById('menuOverlay');
  const body = document.body;

  function openMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    body.classList.add('menu-open');
    gsap.to(sidebar, { x: 0, duration: 0.4, ease: 'power3.out' });
    gsap.to(overlay, { opacity: 1, duration: 0.3, ease: 'power1.out' });
  }

  function closeMenu() {
    gsap.to(sidebar, {
      x: '-100vw',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        body.classList.remove('menu-open');
      }
    });
    gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power1.in' });
  }

  hamburger.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeMenu();
    }
  });
});

// Transaction logic
function addTransaction(e) {
  e.preventDefault();

  const desc = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const date = new Date().toLocaleDateString();

  if (!desc || isNaN(amount)) {
    alert('Please enter valid description and amount.');
    return;
  }

  const transaction = { desc, amount, type, category, date };

  if (editIndex !== null) {
    transactions[editIndex] = transaction;
    editIndex = null;
    document.getElementById('add-btn').textContent = 'Add';
  } else {
    transactions.push(transaction);
  }

  updateTable();
  updateSummary();
  updateChart(transactions);
  updateAIInsight(transactions);

  document.getElementById('transactionForm').reset();
}

// Update Summary
function updateSummary() {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
  document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
  document.getElementById('balance').textContent = `$${(income - expenses).toFixed(2)}`;
}

// Update Table
function updateTable() {
  const tbody = document.querySelector('#expenseDisplay tbody');
  tbody.innerHTML = '';
  transactions.forEach((t, index) => {
    const row = document.createElement('tr');
    if (index === editIndex) {
      // Editable row
      row.innerHTML = `
        <td><input type="text" value="${t.desc}" id="edit-desc-${index}" /></td>
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
          <button onclick="saveEdit(${index})">Save <i class="fa-solid fa-pencil"></i></button>
          <button onclick="cancelEdit()">Cancel <i class="fa-solid fa-xmark"></i></button>
        </td>
      `;
    } else {
      // Regular row
      row.innerHTML = `
        <td>${t.desc}</td>
        <td>$${t.amount.toFixed(2)}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>
          <button onclick="editTransaction(${index})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
          <button onclick="deleteTransaction(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
    }
    tbody.appendChild(row);
  });
}

// Delete Transaction
function deleteTransaction(index) {
  transactions.splice(index, 1);
  updateTable();
  updateSummary();
  updateChart(transactions);
  updateAIInsight(transactions);
}

function editTransaction(index) {
  editIndex = index;
  updateTable();
}

function cancelEdit() {
  editIndex = null;
  updateTable();
}

function saveEdit(index) {
  const desc = document.getElementById(`edit-desc-${index}`).value.trim();
  const amount = parseFloat(document.getElementById(`edit-amount-${index}`).value);
  const type = document.getElementById(`edit-type-${index}`).value;
  const category = document.getElementById(`edit-category-${index}`).value;
  const date = transactions[index].date;

  if (!desc || isNaN(amount)) {
    alert('Please enter valid description and amount.');
    return;
  }
  transactions[index] = { desc, amount, type, category, date };
  editIndex = null;
  updateTable();
  updateSummary();
  updateChart(transactions);
  updateAIInsight(transactions);
}

// Export PDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("FinSight Budget Summary", 10, 10);
  let y = 20;
  transactions.forEach((t, i) => {
    doc.text(`${i + 1}. ${t.desc} - $${t.amount} - ${t.type} - ${t.category} - ${t.date}`, 10, y);
    y += 10;
  });
  doc.save("FinSight-Budget.pdf");
}

// Save Table to LocalStorage
function saveTable() {
  localStorage.setItem("savedTransactions", JSON.stringify(transactions));
  alert("Table saved to localStorage!");
}

// Export CSV
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

// Import Table from LocalStorage
function importTable() {
  const saved = JSON.parse(localStorage.getItem("savedTransactions"));
  if (!saved) return alert("No saved data found.");
  transactions = saved;
  updateTable();
  updateSummary();
  updateChart(transactions);
  updateAIInsight(transactions);
}

// Share Panel
function openSharePanel() {
  document.getElementById("sharePanel").classList.add("open");
  const text = transactions.map(t =>
    `${t.desc}\t$${t.amount}\t${t.type}\t${t.category}\t${t.date}`
  ).join("\n");
  document.getElementById("tableShareText").value = text;
}

function closeSharePanel() {
  document.getElementById("sharePanel").classList.remove("open");
}

function copyTableToClipboard() {
  const textarea = document.getElementById("tableShareText");
  navigator.clipboard.writeText(textarea.value)
    .then(() => alert("Table copied to clipboard!"))
    .catch(err => console.error("Copy failed:", err));
}

// Opening settings panel
function openSettingsPanel() {
  document.getElementById('settingsPanel').style.display = 'block';
}

function closeSettingsPanel() {
  document.getElementById('settingsPanel').style.display = 'none';
} 