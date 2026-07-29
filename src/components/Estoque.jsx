import React, { useState } from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

export default function Estoque({ filaments, setFilaments, suppliers, products = [], setProducts, calculateCost }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newFilament, setNewFilament] = useState({
        name: '',
        supplierId: suppliers[0]?.id || '',
        initialWeight: '1000',
        currentWeight: '1000',
        alertThreshold: '200',
        colorHex: '#30D158',
        material: 'PLA'
    });

    const handleSave = (e) => {
        e.preventDefault();
        const fil = {
            id: 'fil' + (filaments.length + 1) + Date.now().toString().slice(-2),
            name: newFilament.name,
            supplierId: newFilament.supplierId,
            initialWeight: parseFloat(newFilament.initialWeight) || 1000,
            currentWeight: parseFloat(newFilament.currentWeight) || 1000,
            alertThreshold: parseFloat(newFilament.alertThreshold) || 200,
            colorHex: newFilament.colorHex,
            material: newFilament.material
        };
        setFilaments([...filaments, fil]);
        setIsAdding(false);
        setNewFilament({
            name: '',
            supplierId: suppliers[0]?.id || '',
            initialWeight: '1000',
            currentWeight: '1000',
            alertThreshold: '200',
            colorHex: '#30D158',
            material: 'PLA'
        });
    };

    const handleDelete = (id) => {
        if (confirm("Deseja realmente remover esta bobina do estoque?")) {
            setFilaments(filaments.filter(f => f.id !== id));
        }
    };

    const handleAdjustWeight = (id, newWeight) => {
        const val = parseFloat(newWeight);
        if (!isNaN(val) && val >= 0) {
            setFilaments(filaments.map(f => f.id === id ? { ...f, currentWeight: val } : f));
        }
    };

    const handleAdjustProductStock = (id, newStock) => {
        const val = parseInt(newStock);
        if (!isNaN(val) && val >= 0) {
            setProducts(products.map(p => p.id === id ? { ...p, stock: val } : p));
        }
    };

    const totalItems = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
    const totalInvested = products.reduce((acc, p) => acc + ((parseInt(p.stock) || 0) * (calculateCost ? calculateCost(p) : 0)), 0);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-brand-borderBg pb-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Logística & Materiais</span>
                    <h3 className="font-black text-2xl text-gradient font-sans">Controle de Estoque</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-brand-orange/10 border border-brand-orange/40 hover:bg-brand-orange/20 text-brand-orange px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {isAdding ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? "Fechar Painel" : "Cadastrar Bobina"}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="glass-panel border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in shadow-2xl">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição / Cor do Filamento</label>
                        <input 
                            type="text" required placeholder="Ex: PLA Vermelho Premium 1kg"
                            value={newFilament.name} onChange={e => setNewFilament({...newFilament, name: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Material</label>
                        <select 
                            value={newFilament.material} onChange={e => setNewFilament({...newFilament, material: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                            <option value="PLA">PLA</option>
                            <option value="PETG">PETG</option>
                            <option value="ABS">ABS</option>
                            <option value="Flex">Flex / TPU</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fornecedor</label>
                        <select 
                            value={newFilament.supplierId} onChange={e => setNewFilament({...newFilament, supplierId: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                            <option value="">Selecione...</option>
                            {suppliers.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Peso Inicial (g)</label>
                        <input 
                            type="number" required
                            value={newFilament.initialWeight} onChange={e => setNewFilament({...newFilament, initialWeight: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Peso Atual (g)</label>
                        <input 
                            type="number" required
                            value={newFilament.currentWeight} onChange={e => setNewFilament({...newFilament, currentWeight: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Limite Crítico de Alerta (g)</label>
                        <input 
                            type="number" required
                            value={newFilament.alertThreshold} onChange={e => setNewFilament({...newFilament, alertThreshold: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Visualização da Cor (Hex)</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={newFilament.colorHex} onChange={e => setNewFilament({...newFilament, colorHex: e.target.value})}
                                className="w-12 h-12 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input 
                                type="text" 
                                value={newFilament.colorHex} onChange={e => setNewFilament({...newFilament, colorHex: e.target.value})}
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-xs font-mono"
                            />
                        </div>
                    </div>

                    <button type="submit" className="md:col-span-4 btn-gradient py-3.5 rounded-xl text-black font-bold uppercase tracking-wider text-xs md:text-sm">
                        Confirmar Cadastro
                    </button>
                </form>
            )}

            {/* Seção 1: Estoque de Produtos Prontos */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black text-white border-l-4 border-brand-orange pl-3">Estoque de Produtos Prontos</h4>
                    <div className="flex gap-4">
                        <div className="bg-[#16161A] border border-white/5 px-4 py-2 rounded-xl text-right">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total em Estoque</span>
                            <span className="text-sm font-black text-white">{totalItems} unidades</span>
                        </div>
                        <div className="bg-brand-orange/10 border border-brand-orange/20 px-4 py-2 rounded-xl text-right">
                            <span className="block text-[10px] font-bold text-brand-orange uppercase tracking-widest">Valor Investido</span>
                            <span className="text-sm font-black text-brand-orange">R$ {totalInvested.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center py-8 glass-panel border border-white/5">
                            <p className="text-gray-400 text-sm font-semibold">Nenhum produto cadastrado no catálogo.</p>
                        </div>
                    ) : products.map(prod => {
                        const isLow = (prod.stock || 0) === 0;
                        return (
                            <div key={prod.id} className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/5">
                                <div className="flex-1">
                                    <h5 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h5>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{prod.type === 'resale' ? 'Revenda' : 'Impressão 3D'}</span>
                                    {isLow && (
                                        <div className="text-rose-400 text-[10px] font-black uppercase mt-1 animate-pulse">Esgotado</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-[#121215] p-2 rounded-lg ml-2">
                                    <input 
                                        type="number" 
                                        value={prod.stock || 0}
                                        onChange={(e) => handleAdjustProductStock(prod.id, e.target.value)}
                                        className="w-14 bg-[#16161A] border border-white/5 text-white rounded-md p-1.5 text-center text-sm font-extrabold focus:outline-none focus:border-brand-orange"
                                    />
                                    <span className="text-[10px] text-gray-400 font-bold">und</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Seção 2: Listagem das Bobinas */}
            <div>
                <h4 className="text-lg font-black text-white mb-4 border-l-4 border-brand-orange pl-3 mt-8">Estoque de Filamentos (Matéria-Prima)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filaments.length === 0 ? (
                    <div className="col-span-full text-center py-12 glass-panel">
                        <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm font-semibold">Nenhuma bobina de filamento no estoque.</p>
                    </div>
                ) : filaments.map(fil => {
                    const isLow = fil.currentWeight <= fil.alertThreshold;
                    const pct = Math.min((fil.currentWeight / fil.initialWeight) * 100, 100);
                    const supName = suppliers.find(s => s.id === fil.supplierId)?.name || 'Fornecedor Desconhecido';

                    return (
                        <div key={fil.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ backgroundColor: fil.colorHex }}></div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: fil.colorHex }} title={fil.colorHex}></span>
                                        <div>
                                            <h4 className="font-extrabold text-white text-base leading-tight">{fil.name}</h4>
                                            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">{fil.material} • {supName}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(fil.id)}
                                        className="text-gray-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-gray-300">
                                        <span>Peso Disponível:</span>
                                        <span className={isLow ? "text-rose-400 font-black animate-pulse" : "text-emerald-400"}>
                                            {fil.currentWeight}g / {fil.initialWeight}g
                                        </span>
                                    </div>

                                    {/* Barra de Progresso */}
                                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${pct}%`, backgroundColor: isLow ? undefined : fil.colorHex }}
                                        ></div>
                                    </div>

                                    {isLow && (
                                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-2 text-[10px] font-black uppercase text-center tracking-widest mt-1">
                                            ⚠️ ESTOQUE CRÍTICO
                                        </div>
                                    )}
                                </div>

                                {/* Ajuste Manual Rápido */}
                                <div className="bg-[#121215] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Ajustar Peso (g):</span>
                                    <input 
                                        type="number" 
                                        defaultValue={fil.currentWeight}
                                        onBlur={(e) => handleAdjustWeight(fil.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdjustWeight(fil.id, e.target.value)}
                                        className="w-20 bg-[#16161A] border border-white/5 text-white rounded-lg p-1.5 text-center text-xs font-extrabold focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}
