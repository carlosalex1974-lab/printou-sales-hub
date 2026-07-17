import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Suppliers({ suppliers, setSuppliers }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        material: '',
        pricePerKg: '',
        leadTime: '',
        rating: '5.0'
    });

    const handleSaveSupplier = (e) => {
        e.preventDefault();
        const sup = {
            id: 'sup' + (suppliers.length + 1) + Date.now().toString().slice(-2),
            name: newSupplier.name,
            material: newSupplier.material,
            pricePerKg: parseFloat(newSupplier.pricePerKg),
            leadTime: newSupplier.leadTime,
            rating: newSupplier.rating
        };
        setSuppliers([...suppliers, sup]);
        setIsAdding(false);
        setNewSupplier({ name: '', material: '', pricePerKg: '', leadTime: '', rating: '5.0' });
    };

    const handleDelete = (id) => {
        if (confirm("Deseja realmente remover este fornecedor?")) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Suprimentos</span>
                    <h3 className="font-black text-2xl text-gradient">Parceiros & Fornecedores de Insumos</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-white/5 border border-brand-orange/30 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-orange/10 transition-all"
                >
                    {isAdding ? "Cancelar" : "Novo Fornecedor"}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSaveSupplier} className="glass-panel border border-brand-orange/20 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Empresa</label>
                        <input 
                            type="text" required placeholder="Ex: 3D Fila"
                            value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Material / Produto</label>
                        <input 
                            type="text" required placeholder="Ex: Filamento PLA/ABS"
                            value={newSupplier.material} onChange={e => setNewSupplier({...newSupplier, material: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço por Kg/Unid. (R$)</label>
                        <input 
                            type="number" step="0.01" required placeholder="Ex: 95.00"
                            value={newSupplier.pricePerKg} onChange={e => setNewSupplier({...newSupplier, pricePerKg: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Prazo de Entrega</label>
                        <input 
                            type="text" required placeholder="Ex: 3 a 5 dias"
                            value={newSupplier.leadTime} onChange={e => setNewSupplier({...newSupplier, leadTime: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <button type="submit" className="md:col-span-4 btn-gradient py-3 rounded-xl text-black font-bold uppercase tracking-wider">
                        Cadastrar Fornecedor
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suppliers.map(sup => (
                    <div key={sup.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-extrabold text-white text-lg">{sup.name}</h4>
                                <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">{sup.material}</span>
                            </div>
                            <button 
                                onClick={() => handleDelete(sup.id)}
                                className="text-gray-500 hover:text-rose-400 p-1 rounded-lg"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </button>
                        </div>
                        <div className="bg-[#121215] p-3 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-center text-xs mb-4">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Preço Estimado</p>
                                <p className="font-semibold text-white">R$ {sup.pricePerKg.toFixed(2)}/kg</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Prazo Médio</p>
                                <p className="font-semibold text-white">{sup.leadTime}</p>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Avaliação do Suporte:</span>
                            <span className="text-brand-yellow font-bold">★ {sup.rating}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
