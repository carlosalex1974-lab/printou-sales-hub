import React, { useState, useMemo } from 'react';

export default function Reports({ sales, products, channels, compute, selectedMonth, expenses }) {
    const [periodPreset, setPeriodPreset] = useState('month'); // 'month', '7days', '30days', 'custom', 'all'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filtro inteligente de vendas por período (Data Início e Fim)
    const filteredSalesForReport = useMemo(() => {
        return sales.filter(s => {
            if (s.status === 'Cancelado') return false;
            if (!s.date) return false;
            
            const saleDateStr = s.date.substring(0, 10);
            
            if (periodPreset === 'month') {
                return s.date.startsWith(selectedMonth);
            }
            if (periodPreset === '7days') {
                const d = new Date(s.date);
                const now = new Date();
                const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }
            if (periodPreset === '30days') {
                const d = new Date(s.date);
                const now = new Date();
                const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
            }
            if (periodPreset === 'custom') {
                if (startDate && saleDateStr < startDate) return false;
                if (endDate && saleDateStr > endDate) return false;
                return true;
            }
            return true; // 'all'
        });
    }, [sales, selectedMonth, periodPreset, startDate, endDate]);

    // Estatísticas financeiras do período selecionado
    const periodStats = useMemo(() => {
        let totalGross = 0;
        let totalCost = 0;
        let totalFees = 0;
        let totalShipping = 0;
        let activeSalesCount = 0;

        filteredSalesForReport.forEach(sale => {
            const fin = compute(sale);
            totalGross += sale.grossValue;
            totalCost += fin.productCost;
            totalFees += fin.fees;
            totalShipping += (fin.shippingApplied || 0);
            activeSalesCount++;
        });

        const filteredExpenses = expenses ? expenses.filter(e => e.competency === selectedMonth) : [];
        const totalAdmExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

        const salesProfit = totalGross - totalFees - totalCost - totalShipping;
        const realNet = salesProfit - totalAdmExpenses;

        return {
            gross: totalGross,
            cost: totalCost,
            fees: totalFees,
            shipping: totalShipping,
            admExpenses: totalAdmExpenses,
            salesProfit: salesProfit,
            realNet: realNet,
            count: activeSalesCount
        };
    }, [filteredSalesForReport, expenses, selectedMonth, compute]);

    // Produtos mais vendidos no período
    const topProducts = useMemo(() => {
        const map = {};
        filteredSalesForReport.forEach(sale => {
            map[sale.productId] = (map[sale.productId] || 0) + sale.quantity;
        });
        return Object.entries(map).map(([id, qty]) => {
            const prod = products.find(p => p.id === id);
            return { name: prod?.name || 'Excluído', qty };
        }).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [filteredSalesForReport, products]);

    // Canais de vendas no período
    const channelStats = useMemo(() => {
        const stats = {};
        filteredSalesForReport.forEach(sale => {
            stats[sale.channelId] = (stats[sale.channelId] || 0) + 1;
        });
        return Object.entries(stats).map(([id, count]) => {
            const chan = channels.find(c => c.id === id);
            return { name: chan?.name || 'Outro', count, color: chan?.color || '#888' };
        });
    }, [filteredSalesForReport, channels]);

    const handleExportPeriodCSV = () => {
        let csv = "Data,Canal,Produto,Quantidade,Valor Bruto (RS),Comissao (RS),Frete (RS),Custo Prod (RS),Lucro Liquido (RS),Status\n";
        filteredSalesForReport.forEach(sale => {
            const prod = products.find(p => p.id === sale.productId);
            const chan = channels.find(c => c.id === sale.channelId);
            const fin = compute(sale);
            csv += `${sale.date},"${chan?.name || 'Excluido'}","${prod?.name || 'Excluido'}",${sale.quantity},${sale.grossValue.toFixed(2)},${fin.fees.toFixed(2)},${(fin.shippingApplied || 0).toFixed(2)},${fin.productCost.toFixed(2)},${fin.netProfit.toFixed(2)},${sale.status}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const fileName = periodPreset === 'custom' && startDate && endDate 
            ? `relatorio_vendas_${startDate}_ate_${endDate}.csv` 
            : `relatorio_vendas_${selectedMonth}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Inteligência Operacional</span>
                    <h3 className="font-black text-2xl text-gradient">Relatórios & Insights por Período</h3>
                </div>
                <button 
                    onClick={handleExportPeriodCSV}
                    className="bg-[#16161A] border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
                >
                    <i data-lucide="download" className="w-4 h-4"></i>
                    Exportar Vendas do Período (CSV)
                </button>
            </div>

            {/* SELETOR DE PERÍODO (DATA INÍCIO E FIM) */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                    <div>
                        <h4 className="font-extrabold text-white text-md flex items-center gap-2">
                            📅 Filtro de Relatório de Vendas por Período
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Selecione uma data inicial e final para filtrar os indicadores e a tabela de vendas.</p>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setPeriodPreset('month'); setStartDate(''); setEndDate(''); }}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${periodPreset === 'month' ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            Mês Atual ({selectedMonth})
                        </button>
                        <button
                            onClick={() => { setPeriodPreset('7days'); setStartDate(''); setEndDate(''); }}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${periodPreset === '7days' ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            Últimos 7 Dias
                        </button>
                        <button
                            onClick={() => { setPeriodPreset('30days'); setStartDate(''); setEndDate(''); }}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${periodPreset === '30days' ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            Últimos 30 Dias
                        </button>
                        <button
                            onClick={() => { setPeriodPreset('custom'); }}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${periodPreset === 'custom' ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            Personalizado
                        </button>
                        <button
                            onClick={() => { setPeriodPreset('all'); setStartDate(''); setEndDate(''); }}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${periodPreset === 'all' ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            Ver Tudo
                        </button>
                    </div>
                </div>

                {/* Inputs de Data Início e Fim */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data Início</label>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPeriodPreset('custom'); }}
                            className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 text-xs focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data Fim</label>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPeriodPreset('custom'); }}
                            className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 text-xs focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); setPeriodPreset('month'); }}
                                className="bg-white/5 border border-white/10 text-gray-400 hover:text-white font-bold py-3 px-4 rounded-xl text-xs uppercase transition-all w-full"
                            >
                                Limpar Datas
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* DEMONSTRATIVO DRE DO PERÍODO SELECIONADO */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                        📊 Demonstrativo Financeiro (DRE do Período)
                    </h4>
                    <span className="text-xs text-gray-400 font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        {periodStats.count} Vendas Encontradas
                    </span>
                </div>

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(+) Receita Bruta (Faturamento)</span>
                        <span className="font-bold text-white">R$ {periodStats.gross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Taxas de Canal (Comissões)</span>
                        <span className="font-semibold text-rose-400">- R$ {periodStats.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Custos de Envio (Fretes Vendedor)</span>
                        <span className="font-semibold text-rose-400">- R$ {periodStats.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Custos de Fabricação / Aquisição</span>
                        <span className="font-semibold text-rose-400">- R$ {periodStats.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2 font-bold text-emerald-400 text-base">
                        <span>(=) Lucro Operacional do Período</span>
                        <span>R$ {periodStats.salesProfit.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* TABELA DETALHADA DE VENDAS DO PERÍODO */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-extrabold text-white text-lg flex items-center gap-2 mb-4">
                    📋 Listagem Detalhada de Vendas por Período
                </h4>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                                <th className="pb-3">Data / Hora</th>
                                <th className="pb-3">Canal</th>
                                <th className="pb-3">Produto</th>
                                <th className="pb-3 text-center">Qtd</th>
                                <th className="pb-3 text-right">Bruto (RS)</th>
                                <th className="pb-3 text-right">Taxa Canal</th>
                                <th className="pb-3 text-right">Frete</th>
                                <th className="pb-3 text-right">Custo Prod.</th>
                                <th className="pb-3 text-right">Lucro Liq.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSalesForReport.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-gray-500 font-semibold">
                                        Nenhuma venda encontrada para o período selecionado.
                                    </td>
                                </tr>
                            ) : (
                                filteredSalesForReport.map(sale => {
                                    const prod = products.find(p => p.id === sale.productId);
                                    const chan = channels.find(c => c.id === sale.channelId);
                                    const fin = compute(sale);

                                    return (
                                        <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 font-bold text-gray-300">{sale.date}</td>
                                            <td className="py-3 font-semibold" style={{ color: chan?.color }}>
                                                {chan?.name || 'Excluído'}
                                            </td>
                                            <td className="py-3 font-bold text-white">{prod?.name || 'Excluído'}</td>
                                            <td className="py-3 text-center font-bold">{sale.quantity}</td>
                                            <td className="py-3 text-right font-bold text-white">R$ {sale.grossValue.toFixed(2)}</td>
                                            <td className="py-3 text-right text-rose-400">R$ {fin.fees.toFixed(2)}</td>
                                            <td className="py-3 text-right text-amber-400">R$ {(fin.shippingApplied || 0).toFixed(2)}</td>
                                            <td className="py-3 text-right text-gray-400">R$ {fin.productCost.toFixed(2)}</td>
                                            <td className={`py-3 text-right font-black ${fin.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                R$ {fin.netProfit.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mais Vendidos */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="font-extrabold text-white text-lg mb-6 flex items-center gap-2">
                        🏆 Modelos Mais Vendidos no Período (Qtd.)
                    </h4>
                    <div className="space-y-4">
                        {topProducts.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma venda encontrada no período.</p>
                        ) : topProducts.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="font-bold text-gray-300"><span className="text-brand-orange">#{idx+1}</span> {p.name}</span>
                                <span className="text-sm font-black text-white">{p.qty} unidades</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Canais */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="font-extrabold text-white text-lg mb-6">
                        📊 Vendas por Canal no Período
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        {channelStats.map((c, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-[#121215] border border-white/5 text-center">
                                <span className="w-3 h-3 rounded-full inline-block mb-2" style={{ backgroundColor: c.color }}></span>
                                <p className="text-xs text-gray-400 font-bold uppercase truncate">{c.name}</p>
                                <p className="text-xl font-black text-white mt-1">{c.count} Vendas</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
