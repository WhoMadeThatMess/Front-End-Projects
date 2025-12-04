function updateChart(data) {
  const ctx = document.getElementById('spendingChart').getContext('2d');
  if (!ctx) return;

  const expenses = data.filter(t => t.type === 'expense');
  const categories = {};

  expenses.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#F77825', '#8E44AD', '#2ECC71', '#E74C3C', '#34495E'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        },
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.body).color
          }
        },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: $${context.raw.toFixed(2)}`
          }
        }
      }
    }
  });
}
