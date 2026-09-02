import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { RotateCcw, Ban, Trash2, Edit2, X, Bolt } from 'lucide-react';
import SearchableProductSelect from './SearchableProductSelect';

export default function SalesListView({ sales, products, channels, setSales, compute }) {
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('Todos');
    const [editingSale, setEditingSale] = useState(null);

    const handleEmitirNfeTiny = async (sale) => {
        try {
            const isMl = sale.channelId.startsWith('ml');
            const orderId = isMl ? (sale.id.startsWith('MLB') ? sale.id : sale.externalId || sale.id) : sale.id;

            if (!confirm(`Deseja emitir a NF-e desta venda via Tiny ERP?\n\nO sistema irá pedir ao Tiny para gerar e emitir a nota do pedido ${orderId}.`)) return;
            
            const btn = document.getElementById('btn-nfe-'+sale.id);
            if(btn) { btn.innerHTML = '<div class="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>'; btn.disabled = true; }

            const response = await fetch('/api/tiny/emitir-nfe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId: sale.id, orderIdEcommerce: orderId })
            });
            
            const data = await response.json();
            
            if(btn) { btn.innerHTML = '🖨️'; btn.disabled = false; }

            if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
            
            if (data.link) {
                window.open(data.link, '_blank');
            } else {
                alert("Sucesso, mas o link do PDF não foi retornado.");
            }
        } catch (e) {
            const btn = document.getElementById('btn-nfe-'+sale.id);
            if(btn) { btn.innerHTML = '🖨️'; btn.disabled = false; }
            alert('Erro na emissão: ' + e.message);
        }
    };


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

    const handleSaveEdit = (e) => {
        e.preventDefault();
        const parsedShipping = parseFloat(editingSale.shipping);
        const updatedSale = {
            ...editingSale,
            grossValue: parseFloat(editingSale.grossValue) || 0,
            quantity: parseInt(editingSale.quantity) || 1,
            shipping: isNaN(parsedShipping) ? 0 : parsedShipping
        };
        setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));
        setEditingSale(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                            <th className="pb-3 pr-2">Data / Hora</th>
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
                                    <td className="py-4 text-xs font-bold text-gray-400 whitespace-nowrap pr-2">
                                        {sale.date && sale.date.includes('T') ? new Date(sale.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : (sale.date ? sale.date.split('T')[0].split('-').reverse().join('/') : '')}
                                    </td>
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
                                                                                {sale.channelId.startsWith('ml') && (
                                        <button
                                            id={`btn-nfe-${sale.id}`}
                                            onClick={() => handleEmitirNfeTiny(sale)}
                                            className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 mr-1"
                                            title="Emitir NF-e via Tiny ERP"
                                        >
                                            🖨️
                                        </button>
                                        )}
<button 
                                            onClick={() => {
                                                setEditingSale({...sale});
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="p-1.5 hover:bg-brand-orange/20 rounded-lg text-gray-400 hover:text-brand-orange mr-1"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
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

            {/* Modal de Edição de Venda (Teleportado para o body para ficar sempre no topo da tela) */}
            {editingSale && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in">
                    <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative border border-brand-orange/30 shadow-2xl shadow-brand-orange/10 my-auto">
                        <button 
                            onClick={() => setEditingSale(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-black mb-6 text-gradient flex items-center gap-2">
                            <Bolt className="w-6 h-6 text-brand-orange" />
                            Editar Venda Completa
                        </h3>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Canal de Venda</label>
                                    <select 
                                        value={editingSale.channelId} 
                                        onChange={e => setEditingSale({...editingSale, channelId: e.target.value})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    >
                                        {channels.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <SearchableProductSelect 
                                    products={products}
                                    selectedProductId={editingSale.productId}
                                    onSelect={id => setEditingSale(prev => ({ ...prev, productId: id }))}
                                    label="Produto Vendido"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Qtd</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        required
                                        value={editingSale.quantity}
                                        onChange={e => setEditingSale({...editingSale, quantity: parseInt(e.target.value) || 1})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bruto (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={editingSale.grossValue}
                                        onChange={e => setEditingSale({...editingSale, grossValue: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Frete (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editingSale.shipping}
                                        onChange={e => setEditingSale({...editingSale, shipping: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data e Hora da Venda</label>
                                    <input 
                                        type="datetime-local"
                                        required
                                        value={editingSale.date && editingSale.date.includes('T') ? editingSale.date.slice(0, 16) : (editingSale.date ? `${editingSale.date}T12:00` : '')}
                                        onChange={e => setEditingSale({...editingSale, date: e.target.value})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status</label>
                                    <select 
                                        value={editingSale.status} 
                                        onChange={e => setEditingSale({...editingSale, status: e.target.value})}
                                        className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    >
                                        <option value="Pago">Pago</option>
                                        <option value="Enviado">Enviado</option>
                                        <option value="Entregue">Entregue</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full mt-4 btn-gradient py-3 rounded-xl text-black font-bold text-lg hover:scale-[1.02] transition-transform"
                            >
                                Salvar Alterações
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
