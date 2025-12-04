//updating current ai system insight based on transaction data 
function updateAIInsight(data) {
  if (!data || data.length === 0) {
    document.getElementById("ai-insight").textContent = "Add data to generate insights.";
    return;
  }

  const expenses = data.filter(t => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  const categories = {};

  expenses.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  const highest = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const percent = ((highest[1] / total) * 100).toFixed(1);

  document.getElementById("ai-insight").textContent =
    `Your highest spending is in "${highest[0]}" at ${percent}% of total expenses. Consider reviewing this category.`;
}
//integrate openAI for more advanced insights in future updates (beta phase)
//function fetchAIInsight(data) {
//  // Placeholder for OpenAI API integration
//} 
//  const prompt = `Analyze the following expense data and provide insights:\n${JSON.stringify(data)}`;
//  // Call OpenAI API with the prompt and handle the response
//} 



