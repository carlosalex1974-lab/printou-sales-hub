import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardCharts({ sales, channels, compute, selectedMonth }) {
    // 1. Calcular Evolução Mensal (Últimos 6 meses)
    const monthlyHistoryData = useMemo(() => {
        const monthlyStats = {};
        
        // Inicializa os meses de interesse ordenados cronologicamente
        // Para simplificar, pegamos todos os meses únicos das vendas do sistema
        sales.forEach(sale => {
            if (sale.status !== 'Cancelado' && sale.date) {
                const month = sale.date.substring(0, 7); // 'YYYY-MM'
                if (!monthlyStats[month]) {
                    monthlyStats[month] = { gross: 0, net: 0 };
                }
                const fin = compute(sale);
                monthlyStats[month].gross += sale.grossValue;
                monthlyStats[month].net += fin.netProfit;
            }
        });

        const sortedMonths = Object.keys(monthlyStats).sort();
        const labels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${monthsNames[parseInt(month) - 1]} / ${year}`;
        });

        const grossData = sortedMonths.map(m => monthlyStats[m].gross);
        const netData = sortedMonths.map(m => monthlyStats[m].net);

        return {
            labels,
            datasets: [
                {
                    label: 'Faturamento Bruto',
                    data: grossData,
                    borderColor: '#3B82F6', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#3B82F6',
                    pointHoverRadius: 7
                },
                {
                    label: 'Lucro Líquido',
                    data: netData,
                    borderColor: '#10B981', // Emerald
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#10B981',
                    pointHoverRadius: 7
                }
            ]
        };
    }, [sales, compute]);

    // 2. Distribuição por Canal no Mês Selecionado
    const channelDistributionData = useMemo(() => {
        const counts = {};
        channels.forEach(c => { counts[c.id] = 0; });

        sales.forEach(sale => {
            if (sale.status !== 'Cancelado' && sale.date && sale.date.startsWith(selectedMonth)) {
                counts[sale.channelId] = (counts[sale.channelId] || 0) + sale.grossValue;
            }
        });

        const labels = [];
        const data = [];
        const backgroundColors = [];

        channels.forEach(c => {
            if (counts[c.id] > 0) {
                labels.push(c.name);
                data.push(parseFloat(counts[c.id].toFixed(2)));
                backgroundColors.push(c.color || '#888888');
            }
        });

        // Caso não haja vendas no mês selecionado
        if (data.length === 0) {
            return {
                labels: ['Sem Vendas'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(255, 255, 255, 0.05)'],
                    borderWidth: 0
                }]
            };
        }

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(18, 18, 21, 0.8)',
                    borderWidth: 2,
                    hoverOffset: 10
                }
            ]
        };
    }, [sales, channels, selectedMonth]);

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9CA3AF',
                    font: { weight: 'bold', family: 'Inter' }
                }
            },
            tooltip: {
                padding: 12,
                backgroundColor: '#16161A',
                titleColor: '#FFF',
                bodyColor: '#D1D5DB',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9CA3AF', font: { weight: '600' } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: {
                    color: '#9CA3AF',
                    font: { weight: '600' },
                    callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#9CA3AF',
                    padding: 15,
                    font: { weight: 'bold', family: 'Inter' }
                }
            },
            tooltip: {
                padding: 12,
                backgroundColor: '#16161A',
                titleColor: '#FFF',
                bodyColor: '#D1D5DB',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const val = context.raw;
                        return ` ${context.label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                    }
                }
            }
        },
        cutout: '70%'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Evolução (2 colunas) */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">Desempenho</span>
                    <h4 className="font-extrabold text-white text-lg mt-1">Evolução Mensal de Receitas e Margens</h4>
                </div>
                <div className="h-64 mt-6 relative">
                    <Line data={monthlyHistoryData} options={lineOptions} />
                </div>
            </div>

            {/* Gráfico de Canais (1 coluna) */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">Participação</span>
                    <h4 className="font-extrabold text-white text-lg mt-1">Distribuição por Canal</h4>
                </div>
                <div className="h-64 mt-6 relative flex items-center justify-center">
                    <Doughnut data={channelDistributionData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
