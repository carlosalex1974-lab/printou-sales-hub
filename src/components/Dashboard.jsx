import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Percent, Activity, Clock, Wallet, Truck } from 'lucide-react';
import DashboardCharts from './DashboardCharts';

export default function Dashboard({ stats, sales, channels, products, compute, filaments = [], selectedMonth }) {
    const channelSales = useMemo(() => {
        const res = {};
        channels.forEach(c => { res[c.name] = { gross: 0, net: 0, color: c.color }; });
        
        sales.forEach(sale => {
            if (sale.status !== 'Cancelado') {
                const chanName = channels.find(c => c.id === sale.channelId)?.name || 'Outro';
                const fin = compute(sale);
                if (res[chanName]) {
                    res[chanName].gross += sale.grossValue;
                    res[chanName].net += fin.netProfit;
                }
            }
        });
        return res;
    }, [sales, channels, compute]);

    return (
        <div className="space-y-8">
            {/* Grid de KPIs Financeiros (6 colunas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Bruto</span>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-black text-white">R$ {stats.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <span className="text-[9px] text-emerald-400 font-semibold">▲ Vendas: {stats.count}</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lucro Operacional</span>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-black text-emerald-400">R$ {stats.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <span className="text-[9px] text-gray-400">Líquido de vendas</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Despesas Adm.</span>
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-black text-rose-400">R$ {stats.admExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <span className="text-[9px] text-gray-400">Custos fixos totais</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Fretes (Sellers)</span>
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Truck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-black text-amber-400">R$ {(stats.shipping || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <span className="text-[9px] text-gray-400">Subsídios de frete grátis</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-brand-orange/20 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-orange/5 rounded-full blur-xl"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lucro Real Empresa</span>
                        <div className="p-2 bg-brand-orange/15 rounded-lg text-brand-orange">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <h3 className={`text-xl font-black ${stats.companyRealNet >= 0 ? 'text-brand-orange' : 'text-rose-500'}`}>
                            R$ {stats.companyRealNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-[9px] text-gray-400">Sobras líquidas finais</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Margem Média</span>
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                            <Percent className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-black text-brand-yellow">{stats.margin.toFixed(1)}%</h3>
                        <span className="text-[9px] text-gray-400">Retorno médio geral</span>
                    </div>
                </div>
            </div>

            {/* Ponto de Equilíbrio (Breakeven) Card */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-orange/5 rounded-full blur-3xl"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ponto de Equilíbrio Comercial (Breakeven)</span>
                        <h4 className="text-lg font-black text-white mt-1">
                            {stats.gross >= stats.breakevenTarget ? (
                                <span className="text-emerald-400">🎉 Superávit Atingido! Custos fixos cobertos.</span>
                            ) : (
                                <span>Equilíbrio da Operação</span>
                            )}
                        </h4>
                        <p className="text-xs text-gray-400 mt-2">
                            Para pagar as despesas administrativas de <strong className="text-white">R$ {stats.admExpenses.toFixed(2)}</strong> neste mês, o faturamento bruto necessário estimado é de <strong className="text-white">R$ {stats.breakevenTarget.toFixed(2)}</strong>.
                        </p>
                    </div>
                    <div className="text-right w-full md:w-auto">
                        <p className="text-xs text-gray-400">Faturamento Realizado</p>
                        <p className="text-2xl font-black text-white">R$ {stats.gross.toFixed(2)}</p>
                        {stats.gross < stats.breakevenTarget ? (
                            <p className="text-[10px] text-brand-orange font-bold mt-1">Faltam R$ {(stats.breakevenTarget - stats.gross).toFixed(2)}</p>
                        ) : (
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">Sobras: +R$ {(stats.gross - stats.breakevenTarget).toFixed(2)}</p>
                        )}
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mt-6 space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                        <span>Progresso até Breakeven</span>
                        <span>{stats.breakevenProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${stats.gross >= stats.breakevenTarget ? 'bg-emerald-500' : 'btn-gradient'}`}
                            style={{ width: `${stats.breakevenProgress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Alerta de Insumos Baixos */}
            {filaments.filter(f => f.currentWeight <= f.alertThreshold).length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 animate-pulse shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-white text-base">⚠️ Alerta de Insumos Críticos no Estoque!</h4>
                            <p className="text-xs text-gray-400">
                                As seguintes bobinas de filamento estão com peso abaixo do limite configurado:
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {filaments.filter(f => f.currentWeight <= f.alertThreshold).map(f => (
                            <span key={f.id} className="bg-[#121215] border border-rose-500/30 text-rose-400 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl flex items-center gap-2 uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.colorHex }}></span>
                                {f.name} ({f.currentWeight}g restantes)
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção de Gráficos Financeiros */}
            <DashboardCharts sales={sales} channels={channels} compute={compute} selectedMonth={selectedMonth} />

            {/* Gráficos e Detalhes de Canais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Activity className="text-brand-orange w-5 h-5" />
                        Faturamento Líquido vs Bruto por Canal
                    </h3>

                    <div className="space-y-6">
                        {Object.entries(channelSales).map(([name, data]) => {
                            const grossPercent = stats.gross > 0 ? (data.gross / stats.gross) * 100 : 0;
                            const profitRate = data.gross > 0 ? (data.net / data.gross) * 100 : 0;
                            return (
                                <div key={name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-white flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
                                            {name}
                                        </span>
                                        <span className="text-gray-400 text-xs md:text-sm">
                                            Bruto: <strong className="text-white">R$ {data.gross.toFixed(2)}</strong> | Lucro: <strong className="text-emerald-400">R$ {data.net.toFixed(2)} ({profitRate.toFixed(0)}%)</strong>
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                                        <div className="h-full rounded-full" style={{ width: `${grossPercent}%`, backgroundColor: data.color, opacity: 0.85 }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Fila de Recentes */}
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Clock className="text-brand-orange w-5 h-5" />
                        Últimas Transações
                    </h3>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {sales.slice(0, 5).map(sale => {
                            const prod = products.find(p => p.id === sale.productId);
                            const chan = channels.find(c => c.id === sale.channelId);
                            const fin = compute(sale);
                            return (
                                <div key={sale.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div>
                                        <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{prod?.name || 'Produto Excluído'}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-bold" style={{ color: chan?.color }}>
                                            {chan?.name.split(' ')[0]}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white">R$ {sale.grossValue.toFixed(2)}</p>
                                        <span className={`text-[10px] font-bold ${sale.status === 'Cancelado' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {sale.status === 'Cancelado' ? 'Cancelado' : `+ R$ ${fin.netProfit.toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
