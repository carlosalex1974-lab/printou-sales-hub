import React, { useMemo } from 'react';

export default function Reports({ sales, products, channels, compute, selectedMonth, expenses }) {
    // Cálculo de produtos mais vendidos
    const topProducts = useMemo(() => {
        const map = {};
        sales.forEach(sale => {
            if (sale.status !== 'Cancelado') {
                map[sale.productId] = (map[sale.productId] || 0) + sale.quantity;
            }
        });
        return Object.entries(map).map(([id, qty]) => {
            const prod = products.find(p => p.id === id);
            return { name: prod?.name || 'Excluído', qty };
        }).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [sales, products]);

    // Cálculo de margem por produto
    const bestMargins = useMemo(() => {
        return products.map(prod => {
            const cost = prod.type === 'resale' 
                ? (prod.acquisitionCost || 0)
                : ((prod.weight * prod.filamentCost) / 1000 + (prod.printTime * prod.machineHourCost) + prod.finishingCost + prod.packagingCost);
            const defaultSaleValue = 60.0;
            const averageFee = (defaultSaleValue * 0.12) + 4.0;
            const estimatedProfit = defaultSaleValue - averageFee - cost;
            const marginPercent = defaultSaleValue > 0 ? (estimatedProfit / defaultSaleValue) * 100 : 0;
            return { name: prod.name, margin: marginPercent, profit: estimatedProfit, cost };
        }).sort((a, b) => b.margin - a.margin);
    }, [products]);

    // Divisão de Vendas por Canal
    const channelStats = useMemo(() => {
        const stats = {};
        sales.forEach(sale => {
            if (sale.status !== 'Cancelado') {
                stats[sale.channelId] = (stats[sale.channelId] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([id, count]) => {
            const chan = channels.find(c => c.id === id);
            return { name: chan?.name || 'Outro', count, color: chan?.color || '#888' };
        });
    }, [sales, channels]);

    // --- CÁLCULOS DO DRE DO MÊS SELECIONADO ---
    const dreStats = useMemo(() => {
        let totalGross = 0;
        let totalCost = 0;
        let totalFees = 0;
        let totalShipping = 0;
        let activeSalesCount = 0;

        const filteredSales = sales.filter(s => s.date.startsWith(selectedMonth));
        filteredSales.forEach(sale => {
            if (sale.status !== 'Cancelado') {
                const fin = compute(sale);
                totalGross += sale.grossValue;
                totalCost += fin.productCost;
                totalFees += fin.fees;
                totalShipping += (parseFloat(sale.shipping) || 0);
                activeSalesCount++;
            }
        });

        const filteredExpenses = expenses.filter(e => e.competency === selectedMonth);
        const totalAdmExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

        const netProfitVendas = totalGross - totalFees - totalCost - totalShipping;
        const companyRealNet = netProfitVendas - totalAdmExpenses;

        return {
            gross: totalGross,
            cost: totalCost,
            fees: totalFees,
            shipping: totalShipping,
            admExpenses: totalAdmExpenses,
            salesProfit: netProfitVendas,
            realNet: companyRealNet,
            count: activeSalesCount
        };
    }, [sales, products, channels, expenses, selectedMonth, compute]);

    const handleExportCSV = () => {
        let csv = "Data,Canal,Produto,Quantidade,Valor Bruto,Comissao,Frete,Lucro Liquido\n";
        sales.forEach(sale => {
            const prod = products.find(p => p.id === sale.productId);
            const chan = channels.find(c => c.id === sale.channelId);
            const fin = compute(sale);
            csv += `${sale.date},"${chan?.name || 'Excluido'}","${prod?.name || 'Excluido'}",${sale.quantity},${sale.grossValue},${fin.fees.toFixed(2)},${sale.shipping},${fin.netProfit}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `printou_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportConsolidatedCSV = () => {
        let csv = `DEMONSTRATIVO DE RESULTADO (DRE) - COMPETENCIA: ${selectedMonth}\n\n`;
        csv += "Indicador,Valor\n";
        csv += `(+) Receita Bruta (Faturamento),${dreStats.gross.toFixed(2)}\n`;
        csv += `(-) Taxas de Canal (Comissoes),-${dreStats.fees.toFixed(2)}\n`;
        csv += `(-) Custos de Envio (Fretes),-${dreStats.shipping.toFixed(2)}\n`;
        csv += `(-) Custos de Fabricacao / Aquisicao,-${dreStats.cost.toFixed(2)}\n`;
        csv += `(=) Margem Operacional de Vendas,${dreStats.salesProfit.toFixed(2)}\n`;
        csv += `(-) Despesas Administrativas Fixas,-${dreStats.admExpenses.toFixed(2)}\n`;
        csv += `(=) Resultado Liquido Real,${dreStats.realNet.toFixed(2)}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `printou_dre_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Inteligência</span>
                    <h3 className="font-black text-2xl text-gradient">Relatórios & Insights de Operação</h3>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="bg-[#16161A] border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                    Exportar Relatório Geral (CSV)
                </button>
            </div>

            {/* Demonstrativo de Resultado Consolidado (DRE) */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                        📊 Demonstrativo Consolidado (DRE) - {selectedMonth}
                    </h4>
                    <button 
                        onClick={handleExportConsolidatedCSV}
                        className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
                    >
                        📥 Exportar DRE (CSV)
                    </button>
                </div>

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(+) Receita Bruta (Faturamento)</span>
                        <span className="font-bold text-white">R$ {dreStats.gross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Taxas de Canal (Comissões)</span>
                        <span className="font-semibold text-rose-400">- R$ {dreStats.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Custos de Envio (Fretes Vendedor)</span>
                        <span className="font-semibold text-rose-400">- R$ {dreStats.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Custos de Fabricação / Aquisição</span>
                        <span className="font-semibold text-rose-400">- R$ {dreStats.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2 font-bold text-emerald-400">
                        <span>(=) Margem Operacional de Vendas</span>
                        <span>R$ {dreStats.salesProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-gray-300">
                        <span>(-) Despesas Administrativas Fixas</span>
                        <span className="font-semibold text-rose-400">- R$ {dreStats.admExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg font-black border-t border-brand-orange/30">
                        <span>(=) Resultado Líquido Real</span>
                        <span className={dreStats.realNet >= 0 ? "text-brand-orange" : "text-rose-500"}>
                            R$ {dreStats.realNet.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mais Vendidos */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="font-extrabold text-white text-lg mb-6 flex items-center gap-2">
                        🏆 Modelos Mais Vendidos (Qtd.)
                    </h4>
                    <div className="space-y-4">
                        {topProducts.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma venda paga registrada ainda.</p>
                        ) : topProducts.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="font-bold text-gray-300"><span className="text-brand-orange">#{idx+1}</span> {p.name}</span>
                                <span className="text-sm font-black text-white">{p.qty} unidades</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Melhores Margens */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="font-extrabold text-white text-lg mb-6 flex items-center gap-2">
                        💸 Produtos com Melhores Margens Estimadas
                    </h4>
                    <div className="space-y-4">
                        {bestMargins.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <div>
                                    <span className="font-bold text-gray-300 block">{p.name}</span>
                                    <span className="text-[10px] text-gray-500">Custo Fabricação: R$ {p.cost.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-emerald-400 block">{p.margin.toFixed(1)}%</span>
                                    <span className="text-[10px] text-gray-400">Margem Estimada</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Estatísticas de Canais */}
            <div className="glass-panel p-6 rounded-2xl">
                <h4 className="font-extrabold text-white text-lg mb-6">
                    📊 Distribuição de Vendas por Canal
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
    );
}
