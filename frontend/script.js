const endpoint = "https://dietanalysisfunctionapp-e4hscudnhdajd5g3.canadacentral-01.azurewebsites.net/api/DietAnalysisFunction";

const barCtx = document.getElementById('barChart').getContext('2d');
const pieCtx = document.getElementById('pieChart').getContext('2d');
const scatterCtx = document.getElementById('scatterPlot').getContext('2d');
const heatmapDiv = document.getElementById('heatmap');
const dietFilterInput = document.getElementById('dietFilter');
const dietFilterSelect = document.getElementById('dietSelect');
const refreshBtn = document.getElementById('refreshBtn');

let barChart, pieChart, scatterChart;
let allDietTypes = [];

async function fetchData() {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.message) console.log(data.message);

        if (!allDietTypes.length) {
            allDietTypes = data.bar.labels;
            populateDropdown(allDietTypes);
        }

        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

function populateDropdown(diets) {
    dietFilterSelect.innerHTML = '<option value="all">All Diet Types</option>';
    diets.forEach(d => {
        const option = document.createElement('option');
        option.value = d.toLowerCase();
        option.textContent = d;
        dietFilterSelect.appendChild(option);
    });
}

function renderBarChart(barData) {
    if (!barData) return;
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: barData.labels,
            datasets: [{
                label: 'Average Macronutrients',
                data: barData.values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        },
        options: { responsive: true }
    });
}

function renderPieChart(pieData) {
    if (!pieData) return;
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: pieData.labels,
            datasets: [{
                label: 'Recipes by Diet Type',
                data: pieData.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ]
            }]
        },
        options: { responsive: true }
    });
}

function renderScatterPlot(scatterData) {
    if (!scatterData) return;
    if (scatterChart) scatterChart.destroy();
    scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: scatterData.map(d => ({
                label: d.label,
                data: d.points,
                backgroundColor: d.color || 'rgba(255,99,132,0.6)'
            }))
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Carbs(g)' } },
                y: { title: { display: true, text: 'Protein(g)' } }
            }
        }
    });
}

function renderHeatmap(heatmapData) {
    if (!heatmapData) return;
    heatmapDiv.innerHTML = "";

    const table = document.createElement("table");
    table.classList.add("w-full", "border", "border-gray-300");

    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th"));
    heatmapData.labels.forEach(label => {
        const th = document.createElement("th");
        th.textContent = label;
        th.classList.add("border", "px-2", "py-1");
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    heatmapData.values.forEach((row, i) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = heatmapData.labels[i];
        th.classList.add("border", "px-2", "py-1");
        tr.appendChild(th);

        row.forEach(val => {
            const td = document.createElement("td");
            td.textContent = val.toFixed(2);
            td.classList.add("border", "px-2", "py-1", "text-center");
            td.style.backgroundColor = `rgba(54,162,235,${val})`;
            tr.appendChild(td);
        });

        table.appendChild(tr);
    });

    heatmapDiv.appendChild(table);
}

async function updateDashboard() {
    const data = await fetchData();
    if (!data) return;

    const inputVal = dietFilterInput.value.trim().toLowerCase();
    const selectVal = dietFilterSelect.value.toLowerCase();
    const dietType = inputVal || selectVal;

    const filteredBar = dietType !== 'all'
        ? {
            labels: data.bar.labels.filter(l => l.toLowerCase() === dietType),
            values: data.bar.values.filter((v,i) => data.bar.labels[i].toLowerCase() === dietType)
        }
        : data.bar;

    const filteredPie = dietType !== 'all'
        ? {
            labels: data.pie.labels.filter(l => l.toLowerCase() === dietType),
            values: data.pie.values.filter((v,i) => data.pie.labels[i].toLowerCase() === dietType)
        }
        : data.pie;

    renderBarChart(filteredBar);
    renderPieChart(filteredPie);
    renderScatterPlot(data.scatter);
    renderHeatmap(data.heatmap);
}

// Event listeners
refreshBtn.addEventListener("click", updateDashboard);
document.addEventListener("DOMContentLoaded", () => updateDashboard());
