import React, { useState, useMemo } from 'react';
import { RotateCcw, Ban, Trash2 } from 'lucide-react';

export default function SalesListView({ sales, products, channels, setSales, compute }) {
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('Todos');

    const filteredSales = useMemo(() => {
        let result = sales;
        if (selectedStatusFilter !== 'Todos') {
            result = sales.filter(s => s.status === selectedStatusFilter);
        }
        return [...result].sort((a, b) => {
            const dateCompare = (b.date || '').localeCompare(a.date || '');
            if (dateCompare !== 0) return dateCompare;
            return (b.id || '').localeCompare(a.id || '');
        });
    }, [sales, selectedStatusFilter]);

    const handleDelete = (id) => {
        if (confirm("Deseja realmente excluir esta venda?")) {
            setSales(sales.filter(s => s.id !== id));
        }
    };

    const toggleCancel = (id) => {
        setSales(sales.map(s => {
            if (s.id === id) {
                return { ...s, status: s.status === 'Cancelado' ? 'Pago' : 'Cancelado' };
            }
            return s;
        }));
    };

    return (
        <div className="glass-panel rounded-2xl p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-black text-xl text-gradient">Registro Geral de Vendas</h3>
                
                <div className="flex flex-wrap gap-2">
                    {['Todos', 'Pago', 'Enviado', 'Entregue', 'Cancelado'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setSelectedStatusFilter(status)}
                            className={`py-1.5 px-4 rounded-xl text-xs font-bold border transition-all ${selectedStatusFilter === status ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-transparent border-brand-borderBg text-gray-400 hover:text-white'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-brand-borderBg text-xs font-bold text-gray-400 uppercase">
                            <th className="pb-3 pr-2">Data</th>
                            <th className="pb-3 pr-2">Canal</th>
                            <th className="pb-3 pr-2">Produto</th>
                            <th className="pb-3 text-center pr-2">Qtd</th>
                            <th className="pb-3 text-right pr-2">Bruto</th>
                            <th className="pb-3 text-right pr-2">Taxas</th>
                            <th className="pb-3 text-right pr-2">Lucro</th>
                            <th className="pb-3 text-center pr-2">Status</th>
                            <th className="pb-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-borderBg text-sm">
                        {filteredSales.map(sale => {
                            const prod = products.find(p => p.id === sale.productId);
                            const chan = channels.find(c => c.id === sale.channelId);
                            const fin = compute(sale);
                            return (
                                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 text-xs font-bold text-gray-400 whitespace-nowrap pr-2">{sale.date}</td>
                                    <td className="py-4 font-semibold pr-2 animate-pulse-once" style={{ color: chan?.color }}>
                                        {chan?.name || 'Excluído'}
                                    </td>
                                    <td className="py-4 font-bold text-white pr-2 truncate max-w-[120px] md:max-w-[200px]">{prod?.name || 'Excluído'}</td>
                                    <td className="py-4 text-center font-bold pr-2">{sale.quantity}</td>
                                    <td className="py-4 text-right font-bold text-white pr-2 whitespace-nowrap">R$ {sale.grossValue.toFixed(2)}</td>
                                    <td className="py-4 text-right text-rose-400 pr-2 whitespace-nowrap">R$ {fin.fees.toFixed(2)}</td>
                                    <td className={`py-4 text-right font-black pr-2 whitespace-nowrap ${sale.status === 'Cancelado' ? 'text-gray-500 line-through' : 'text-emerald-400'}`}>
                                        R$ {fin.netProfit.toFixed(2)}
                                    </td>
                                    <td className="py-4 text-center pr-2">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                            sale.status === 'Entregue' ? 'bg-emerald-500/10 text-emerald-400' :
                                            sale.status === 'Enviado' ? 'bg-blue-500/10 text-blue-400' :
                                            sale.status === 'Cancelado' ? 'bg-rose-500/10 text-rose-400' :
                                            'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right whitespace-nowrap">
                                        <button 
                                            onClick={() => toggleCancel(sale.id)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white mr-1"
                                            title={sale.status === 'Cancelado' ? "Reativar" : "Estornar/Cancelar"}
                                        >
                                            {sale.status === 'Cancelado' ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(sale.id)}
                                            className="p-1.5 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
