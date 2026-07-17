import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

export default function ExpensesView({ expenses, setExpenses, selectedMonth }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newExpense, setNewExpense] = useState({
        name: '',
        category: 'Agua', // Agua, Luz, Telefone, Contador, Outros
        value: '',
        dueDate: '',
        status: 'Pendente',
        competency: selectedMonth // Prefills with active dashboard filter month
    });

    // Whenever selectedMonth changes, update the form's default competency
    useEffect(() => {
        setNewExpense(prev => ({ ...prev, competency: selectedMonth }));
    }, [selectedMonth]);

    const handleSaveExpense = (e) => {
        e.preventDefault();
        const exp = {
            id: 'exp' + (expenses.length + 1) + Date.now().toString().slice(-2),
            name: newExpense.name,
            category: newExpense.category,
            value: parseFloat(newExpense.value),
            dueDate: newExpense.dueDate,
            status: newExpense.status,
            competency: newExpense.competency
        };
        setExpenses([...expenses, exp]);
        setIsAdding(false);
        setNewExpense({ name: '', category: 'Agua', value: '', dueDate: '', status: 'Pendente', competency: selectedMonth });
    };

    const handleDelete = (id) => {
        if (confirm("Deseja realmente remover esta despesa?")) {
            setExpenses(expenses.filter(e => e.id !== id));
        }
    };

    const toggleStatus = (id) => {
        setExpenses(expenses.map(e => e.id === id ? { ...e, status: e.status === 'Pago' ? 'Pendente' : 'Pago' } : e));
    };

    // Filtro por Competência
    const filteredExpenses = expenses.filter(e => e.competency === selectedMonth);

    // Cálculos das Despesas do Mês Filtrado
    const totalExpensesValue = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);
    const paidExpensesValue = filteredExpenses.filter(e => e.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    const pendingExpensesValue = filteredExpenses.filter(e => e.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0);

    const getCategoryEmoji = (category) => {
        switch(category) {
            case 'Agua': return '💧';
            case 'Luz': return '⚡';
            case 'Telefone': return '🌐';
            case 'Contador': return '💼';
            default: return '💸';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-brand-borderBg pb-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Gestão Financeira</span>
                    <h3 className="font-black text-2xl text-gradient">Despesas Administrativas</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-brand-orange/10 border border-brand-orange/40 hover:bg-brand-orange/20 text-brand-orange px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {isAdding ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? "Fechar Painel" : "Lançar Nova Despesa"}
                </button>
            </div>

            {/* Indicadores de Despesas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Total no Mês</span>
                    <span className="text-2xl font-black text-white mt-2">R$ {totalExpensesValue.toFixed(2)}</span>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest">Pago</span>
                    <span className="text-2xl font-black text-emerald-400 mt-2">R$ {paidExpensesValue.toFixed(2)}</span>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest">Pendente</span>
                    <span className="text-2xl font-black text-rose-400 mt-2">R$ {pendingExpensesValue.toFixed(2)}</span>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSaveExpense} className="glass-panel border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in shadow-2xl">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição da Despesa</label>
                        <input 
                            type="text" required placeholder="Ex: Conta de Luz Oficina"
                            value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria</label>
                        <select 
                            value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                            <option value="Agua">💧 Água</option>
                            <option value="Luz">⚡ Luz</option>
                            <option value="Telefone">🌐 Telefone & Internet</option>
                            <option value="Contador">💼 Contador</option>
                            <option value="Outros">💸 Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Valor da Despesa (R$)</label>
                        <input 
                            type="number" step="0.01" required placeholder="0.00"
                            value={newExpense.value} onChange={e => setNewExpense({...newExpense, value: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data de Vencimento</label>
                        <input 
                            type="date" required
                            value={newExpense.dueDate} onChange={e => setNewExpense({...newExpense, dueDate: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mês de Competência</label>
                        <input 
                            type="month" required
                            value={newExpense.competency} onChange={e => setNewExpense({...newExpense, competency: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status Inicial</label>
                        <select 
                            value={newExpense.status} onChange={e => setNewExpense({...newExpense, status: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                            <option value="Pendente">Pendente</option>
                            <option value="Pago">Pago</option>
                        </select>
                    </div>
                    <button type="submit" className="md:col-span-4 btn-gradient py-3.5 rounded-xl text-black font-bold uppercase tracking-wider text-xs md:text-sm">
                        Cadastrar Despesa
                    </button>
                </form>
            )}

            {/* Listagem de Despesas */}
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 border-b border-brand-borderBg text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="py-4 px-6">Categoria</th>
                                <th className="py-4 px-6">Despesa</th>
                                <th className="py-4 px-6">Vencimento</th>
                                <th className="py-4 px-6 text-right">Valor</th>
                                <th className="py-4 px-6 text-center">Status</th>
                                <th className="py-4 px-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500 font-medium">Nenhuma despesa para o mês selecionado.</td>
                                </tr>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-white/5 transition-all">
                                        <td className="py-4 px-6 font-bold text-white text-base">
                                            {getCategoryEmoji(exp.category)} {exp.category}
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-white">{exp.name}</td>
                                        <td className="py-4 px-6 font-medium text-gray-400">{exp.dueDate}</td>
                                        <td className="py-4 px-6 text-right font-bold text-white">R$ {exp.value.toFixed(2)}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button 
                                                onClick={() => toggleStatus(exp.id)}
                                                className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider transition-all border ${
                                                    exp.status === 'Pago' 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                                }`}
                                            >
                                                {exp.status}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <button 
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-1.5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
