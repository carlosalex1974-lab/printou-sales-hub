
        const { useState, useEffect, useMemo } = React;

        // --- DADOS INICIAIS DO LOCALSTORAGE (MOCK) ---
        const INITIAL_CHANNELS = [
            { id: 'ml1', name: 'printoustudio3d', commission: 12.0, fixedFee: 6.0, color: '#FFE600' },
            { id: 'ml2', name: 'AlucarPrintoustudio3d', commission: 19.5, fixedFee: 6.0, color: '#FFB900' },
            { id: 'shopee', name: 'Shopee', commission: 14.0, fixedFee: 3.0, color: '#EE4D2D' },
            { id: 'site', name: 'Site Próprio', commission: 3.99, fixedFee: 0.5, color: '#0088FF' },
            { id: 'direta', name: 'Venda Direta / Pix', commission: 0.0, fixedFee: 0.0, color: '#30D158' }
        ];

        const INITIAL_PRODUCTS = [
            { id: 'p1', name: 'Groot Porta-Plantas 15cm', type: '3d', weight: 120, printTime: 6.0, filamentCost: 90.0, machineHourCost: 2.0, finishingCost: 3.0, packagingCost: 2.5, failRate: 10 },
            { id: 'p2', name: 'Suporte de Headset Gamer', type: '3d', weight: 85, printTime: 4.5, filamentCost: 90.0, machineHourCost: 2.0, finishingCost: 1.5, packagingCost: 2.5, failRate: 8 },
            { id: 'p3', name: 'Vaso Espiral Geométrico', type: '3d', weight: 160, printTime: 8.0, filamentCost: 110.0, machineHourCost: 2.5, finishingCost: 4.0, packagingCost: 3.0, failRate: 12 },
            { id: 'p4', name: 'Organizador de Cabos Clip x5', type: '3d', weight: 18, printTime: 1.0, filamentCost: 90.0, machineHourCost: 2.0, finishingCost: 0.5, packagingCost: 1.0, failRate: 5 },
            { id: 'p5', name: 'Filamento PLA Voolt3D Preto 1kg', type: 'resale', acquisitionCost: 55.00 },
            { id: 'p6', name: 'Bico Extrusor de Latão 0.4mm V6', type: 'resale', acquisitionCost: 4.50 }
        ];

        const INITIAL_SALES = [
            { id: 's1', date: '2026-07-16', channelId: 'shopee', productId: 'p1', quantity: 1, grossValue: 49.90, shipping: 0.00, status: 'Pago' },
            { id: 's2', date: '2026-07-16', channelId: 'ml1', productId: 'p2', quantity: 2, grossValue: 79.80, shipping: 6.00, status: 'Enviado' },
            { id: 's3', date: '2026-07-15', channelId: 'direta', productId: 'p3', quantity: 1, grossValue: 65.00, shipping: 0.00, status: 'Pago' },
            { id: 's4', date: '2026-07-15', channelId: 'site', productId: 'p1', quantity: 1, grossValue: 45.00, shipping: 12.00, status: 'Pago' },
            { id: 's5', date: '2026-07-14', channelId: 'ml2', productId: 'p4', quantity: 3, grossValue: 36.00, shipping: 0.00, status: 'Pago' },
            { id: 's6', date: '2026-07-14', channelId: 'shopee', productId: 'p2', quantity: 1, grossValue: 39.90, shipping: 0.00, status: 'Cancelado' },
            { id: 's7', date: '2026-07-13', channelId: 'ml1', productId: 'p3', quantity: 1, grossValue: 69.90, shipping: 19.90, status: 'Entregue' },
            { id: 's8', date: '2026-07-13', channelId: 'ml2', productId: 'p5', quantity: 2, grossValue: 190.00, shipping: 10.00, status: 'Pago' },
            { id: 's9', date: '2026-07-12', channelId: 'direta', productId: 'p6', quantity: 5, grossValue: 60.00, shipping: 0.00, status: 'Pago' }
        ];

        const INITIAL_SUPPLIERS = [
            { id: 'sup1', name: '3D Fila', material: 'PLA Premium', pricePerKg: 95.00, leadTime: '3 dias', rating: '4.8' },
            { id: 'sup2', name: 'Voolt3D', material: 'PLA Standard', pricePerKg: 85.00, leadTime: '2 dias', rating: '4.5' },
            { id: 'sup3', name: 'Embalagens São Paulo', material: 'Caixas de Papelão', pricePerKg: 2.50, leadTime: '5 dias', rating: '4.6' }
        ];

        const INITIAL_EXPENSES = [
            { id: 'exp1', name: 'Conta de Água', category: 'Agua', value: 120.00, dueDate: '2026-07-20', status: 'Pago', competency: '2026-07' },
            { id: 'exp2', name: 'Conta de Luz', category: 'Luz', value: 350.00, dueDate: '2026-07-20', status: 'Pago', competency: '2026-07' },
            { id: 'exp3', name: 'Telefone & Internet', category: 'Telefone', value: 150.00, dueDate: '2026-07-20', status: 'Pago', competency: '2026-07' },
            { id: 'exp4', name: 'Honorários Contabilidade', category: 'Contador', value: 400.00, dueDate: '2026-07-25', status: 'Pendente', competency: '2026-07' },
            { id: 'exp5', name: 'Servidores & SaaS (Outros)', category: 'Outros', value: 99.90, dueDate: '2026-07-28', status: 'Pendente', competency: '2026-07' }
        ];

        function App() {
            // --- ESTADOS DO SISTEMA ---
            const [activeTab, setActiveTab] = useState('dashboard');
            const [theme, setTheme] = useState(() => {
                return localStorage.getItem('printou_theme') || 'dark';
            });

            useEffect(() => {
                localStorage.setItem('printou_theme', theme);
                if (theme === 'light') {
                    document.documentElement.classList.add('light');
                } else {
                    document.documentElement.classList.remove('light');
                }
            }, [theme]);

            const [channels, setChannels] = useState(() => {
                const local = localStorage.getItem('printou_channels');
                return local ? JSON.parse(local) : INITIAL_CHANNELS;
            });
            const [products, setProducts] = useState(() => {
                const local = localStorage.getItem('printou_products');
                return local ? JSON.parse(local) : INITIAL_PRODUCTS;
            });
            const [suppliers, setSuppliers] = useState(() => {
                const local = localStorage.getItem('printou_suppliers');
                return local ? JSON.parse(local) : INITIAL_SUPPLIERS;
            });
            const [expenses, setExpenses] = useState(() => {
                const local = localStorage.getItem('printou_expenses');
                return local ? JSON.parse(local) : INITIAL_EXPENSES;
            });
            const [sales, setSales] = useState(() => {
                const local = localStorage.getItem('printou_sales');
                return local ? JSON.parse(local) : INITIAL_SALES;
            });

            const [selectedMonth, setSelectedMonth] = useState('2026-07');

            const availableMonths = useMemo(() => {
                const months = new Set();
                months.add('2026-07');
                sales.forEach(s => { if (s.date) months.add(s.date.substring(0, 7)); });
                expenses.forEach(e => { if (e.competency) months.add(e.competency); });
                return Array.from(months).sort().reverse();
            }, [sales, expenses]);

            // State do Modal de Nova Venda
            const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
            const [newSale, setNewSale] = useState({
                channelId: 'direta',
                productId: 'p1',
                quantity: 1,
                grossValue: '',
                shipping: '0.00',
                status: 'Pago'
            });

            // Migração de nomes antigos do Mercado Livre salvos no LocalStorage e ajuste de taxas
            useEffect(() => {
                let updated = false;
                const newChans = channels.map(c => {
                    if (c.id === 'ml1' && (c.name === 'Mercado Livre - Conta 1' || c.commission === 16.5)) {
                        updated = true;
                        return { ...c, name: 'printoustudio3d', commission: 12.0 };
                    }
                    if (c.id === 'ml2' && (c.name === 'Mercado Livre - Conta 2' || c.commission === 12.0)) {
                        updated = true;
                        return { ...c, name: 'AlucarPrintoustudio3d', commission: 19.5, color: '#FFB900' };
                    }
                    return c;
                });
                if (updated) {
                    setChannels(newChans);
                }
            }, []);

            // Salvar no LocalStorage ao alterar dados
            useEffect(() => {
                localStorage.setItem('printou_channels', JSON.stringify(channels));
            }, [channels]);

            useEffect(() => {
                localStorage.setItem('printou_products', JSON.stringify(products));
            }, [products]);

            useEffect(() => {
                localStorage.setItem('printou_sales', JSON.stringify(sales));
            }, [sales]);

            useEffect(() => {
                localStorage.setItem('printou_suppliers', JSON.stringify(suppliers));
            }, [suppliers]);

            useEffect(() => {
                localStorage.setItem('printou_expenses', JSON.stringify(expenses));
            }, [expenses]);

            // Re-inicializar ícones Lucide
            useEffect(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }, [activeTab, isSaleModalOpen, sales, products, expenses, theme]);

            // --- CÁLCULO DE CUSTO DO PRODUTO (Com Taxa de Perda/Falha ou Custo de Revenda) ---
            const calculateProductCost = (prod) => {
                if (prod.type === 'resale') {
                    return parseFloat((prod.acquisitionCost || 0).toFixed(2));
                }
                const filCost = (prod.weight * prod.filamentCost) / 1000;
                const machCost = prod.printTime * prod.machineHourCost;
                const rateFactor = 1 + ((prod.failRate || 0) / 100);
                const rawCost = (filCost + machCost) * rateFactor;
                return parseFloat((rawCost + prod.finishingCost + prod.packagingCost).toFixed(2));
            };

            // --- LÓGICA DE CÁLCULO FINANCEIRO POR VENDA ---
            const computeSaleFinancials = (sale) => {
                const prod = products.find(p => p.id === sale.productId);
                const chan = channels.find(c => c.id === sale.channelId);
                
                const productCostTotal = prod ? calculateProductCost(prod) * sale.quantity : 0;
                
                let fee = 0;
                if (chan) {
                    fee = (sale.grossValue * (chan.commission / 100)) + chan.fixedFee;
                }
                
                const shipping = parseFloat(sale.shipping) || 0;
                const netProfit = sale.status === 'Cancelado' ? 0 : parseFloat((sale.grossValue - fee - productCostTotal - shipping).toFixed(2));
                
                return {
                    productCost: productCostTotal,
                    fees: fee,
                    netProfit: netProfit
                };
            };

            // --- METRICAS GERAIS PARA O DASHBOARD ---
            const financeStats = useMemo(() => {
                let totalGross = 0;
                let totalNet = 0;
                let totalFees = 0;
                let activeSalesCount = 0;

                sales.forEach(sale => {
                    if (sale.status !== 'Cancelado') {
                        const fin = computeSaleFinancials(sale);
                        totalGross += sale.grossValue;
                        totalNet += fin.netProfit;
                        totalFees += fin.fees;
                        activeSalesCount++;
                    }
                });

                const totalAdmExpenses = expenses.reduce((acc, curr) => acc + curr.value, 0);
                const companyRealNet = totalNet - totalAdmExpenses;
                const averageMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;

                return {
                    gross: totalGross,
                    net: totalNet,
                    fees: totalFees,
                    count: activeSalesCount,
                    margin: averageMargin,
                    admExpenses: totalAdmExpenses,
                    companyRealNet: companyRealNet
                };
            }, [sales, products, channels, expenses]);

            // --- ADICIONAR NOVA VENDA ---
            const handleAddSale = (e) => {
                e.preventDefault();
                const saleToAdd = {
                    id: 's' + (sales.length + 1) + Date.now().toString().slice(-3),
                    date: new Date().toISOString().split('T')[0],
                    channelId: newSale.channelId,
                    productId: newSale.productId,
                    quantity: parseInt(newSale.quantity),
                    grossValue: parseFloat(newSale.grossValue),
                    shipping: parseFloat(newSale.shipping) || 0,
                    status: newSale.status
                };

                setSales([saleToAdd, ...sales]);
                setIsSaleModalOpen(false);
                // Reset form
                setNewSale({
                    channelId: 'direta',
                    productId: products[0]?.id || '',
                    quantity: 1,
                    grossValue: '',
                    shipping: '0.00',
                    status: 'Pago'
                });
            };

            const handleIncomingMarketplaceSale = (saleData) => {
                // 1. Verifica se o produto existe
                const productExists = products.find(p => p.id === saleData.productId);
                if (!productExists) {
                    const guessedType = saleData.productName.toLowerCase().includes('filamento') || saleData.productName.toLowerCase().includes('bico') ? 'resale' : '3d';
                    const newProd = {
                        id: saleData.productId,
                        name: saleData.productName,
                        type: guessedType,
                        weight: guessedType === '3d' ? 100 : 0,
                        printTime: guessedType === '3d' ? 5.0 : 0,
                        filamentCost: 95.00,
                        machineHourCost: 2.00,
                        finishingCost: 2.00,
                        packagingCost: 2.50,
                        failRate: 10,
                        acquisitionCost: guessedType === 'resale' ? 55.00 : 0,
                        image: saleData.productImage,
                        isPendingConfig: true
                    };
                    setProducts(prev => [...prev, newProd]);
                }

                // 2. Registra a venda
                const saleToAdd = {
                    id: 's_auto_' + Date.now().toString().slice(-4),
                    date: new Date().toISOString().split('T')[0],
                    channelId: saleData.channelId,
                    productId: saleData.productId,
                    quantity: saleData.quantity,
                    grossValue: saleData.grossValue,
                    shipping: saleData.shipping || 0,
                    status: 'Pago'
                };
                setSales(prev => [saleToAdd, ...prev]);
                alert(`Venda recebida via Integração! O produto "${saleData.productName}" foi importado automaticamente com imagem e ficha técnica provisória.`);
            };

            return (
                <div className="flex min-h-screen bg-brand-darkBg text-white">
                    {/* --- SIDEBAR --- */}
                    <aside className="w-64 glass-panel border-r border-brand-borderBg flex flex-col justify-between p-6">
                        <div>
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange to-brand-yellow flex items-center justify-center font-bold text-black text-xl">
                                    ▲
                                </div>
                                <div>
                                    <h1 className="font-black text-lg tracking-wider text-white">PRINTOU</h1>
                                    <p className="text-xs text-brand-orange font-bold tracking-widest">SALES HUB</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                <button 
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="bar-chart-3" className="w-5 h-5"></i>
                                    <span className="font-semibold">Dashboard</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('sales')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'sales' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="shopping-bag" className="w-5 h-5"></i>
                                    <span className="font-semibold">Vendas</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('products')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'products' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="printer" className="w-5 h-5"></i>
                                    <span className="font-semibold">Produtos</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('channels')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'channels' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="sliders" className="w-5 h-5"></i>
                                    <span className="font-semibold">Taxas e Canais</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('reports')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'reports' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="pie-chart" className="w-5 h-5"></i>
                                    <span className="font-semibold">Relatórios</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('suppliers')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'suppliers' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="truck" className="w-5 h-5"></i>
                                    <span className="font-semibold">Fornecedores</span>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('expenses')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'expenses' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <i data-lucide="wallet" className="w-5 h-5"></i>
                                    <span className="font-semibold">Despesas Adm.</span>
                                </button>
                            </nav>
                        </div>

                        <div className="pt-6 border-t border-brand-borderBg text-center">
                            <p className="text-xs text-gray-500">Desenvolvido para</p>
                            <p className="text-xs font-bold text-brand-yellow">Printou Studio 3D</p>
                        </div>
                    </aside>

                    {/* --- CONTEÚDO PRINCIPAL --- */}
                    <main className="flex-1 p-8 overflow-y-auto">
                        {/* Header Superior */}
                        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                            <div>
                                <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Operações</span>
                                <h2 className="text-3xl font-extrabold text-white">Controle Central de Vendas</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button 
                                    onClick={() => handleIncomingMarketplaceSale({
                                        productId: 'p_auto_yoda',
                                        productName: 'Baby Yoda Action Figure 3D',
                                        channelId: 'ml2',
                                        quantity: 1,
                                        grossValue: 89.90,
                                        productImage: 'assets/yoda_baby_3d_print_1784236410240.png'
                                    })}
                                    className="bg-white/5 border border-brand-orange/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-orange/10 flex items-center gap-2 transition-all"
                                >
                                    ⚡ Simular Venda Yoda (ML)
                                </button>
                                <button 
                                    onClick={() => handleIncomingMarketplaceSale({
                                        productId: 'p_auto_rainbow',
                                        productName: 'Filamento Rainbow Premium PLA 1kg',
                                        channelId: 'shopee',
                                        quantity: 2,
                                        grossValue: 270.00,
                                        productImage: 'assets/rainbow_filament_spool_1784236423229.png'
                                    })}
                                    className="bg-white/5 border border-brand-orange/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-orange/10 flex items-center gap-2 transition-all"
                                >
                                    ⚡ Simular Venda Filamento (Shopee)
                                </button>

                                <select 
                                    value={selectedMonth} 
                                    onChange={e => setSelectedMonth(e.target.value)}
                                    className="bg-white/5 border border-brand-orange/30 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-orange cursor-pointer"
                                >
                                    {availableMonths.map(m => {
                                        const [y, mn] = m.split('-');
                                        const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                        return <option key={m} value={m} className="bg-brand-darkBg text-white">{names[parseInt(mn) - 1]} {y}</option>;
                                    })}
                                </select>

                                <button 
                                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                    className="bg-white/5 border border-brand-orange/30 text-white p-3 rounded-xl hover:bg-brand-orange/10 flex items-center justify-center transition-all"
                                    title="Alternar Tema Claro/Escuro"
                                >
                                    <i data-lucide={theme === 'light' ? "moon" : "sun"} className="w-5 h-5"></i>
                                </button>

                                <button 
                                    onClick={() => setIsSaleModalOpen(true)}
                                    className="btn-gradient px-6 py-3 rounded-xl font-bold text-black flex items-center gap-2"
                                >
                                    <i data-lucide="plus" className="w-5 h-5 text-black"></i>
                                    Lançar Venda
                                </button>
                            </div>
                        </header>

                        {/* Banner de aviso para itens pendentes */}
                        {products.filter(p => p.isPendingConfig).length > 0 && (
                            <div className="mb-6 glass-panel border-rose-500/30 bg-rose-500/5 p-4 rounded-xl flex items-center justify-between text-rose-400 text-sm animate-pulse-once">
                                <span className="flex items-center gap-2 font-semibold">
                                    ⚠️ Você tem {products.filter(p => p.isPendingConfig).length} produto(s) importado(s) pendente(s) de configuração de custo/ficha técnica!
                                </span>
                                <button 
                                    onClick={() => setActiveTab('products')}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                                >
                                    Configurar Fichas
                                </button>
                            </div>
                        )}

                        {/* --- CONTEÚDO DA ABA SELECIONADA --- */}
                        {activeTab === 'dashboard' && (
                            <DashboardView stats={financeStats} sales={sales} channels={channels} products={products} compute={computeSaleFinancials} />
                        )}

                        {activeTab === 'sales' && (
                            <SalesListView sales={sales} products={products} channels={channels} setSales={setSales} compute={computeSaleFinancials} />
                        )}

                        {activeTab === 'products' && (
                            <ProductCatalogView products={products} setProducts={setProducts} calculateCost={calculateProductCost} />
                        )}

                        {activeTab === 'channels' && (
                            <ChannelsConfigView channels={channels} setChannels={setChannels} />
                        )}

                        {activeTab === 'reports' && (
                            <ReportsView sales={sales} products={products} channels={channels} compute={computeSaleFinancials} selectedMonth={selectedMonth} expenses={expenses} />
                        )}

                        {activeTab === 'suppliers' && (
                            <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} />
                        )}

                        {activeTab === 'expenses' && (
                            <ExpensesView expenses={expenses} setExpenses={setExpenses} selectedMonth={selectedMonth} />
                        )}
                    </main>

                    {/* --- MODAL FLOATING DE LANÇAMENTO DE VENDA RAPIDA --- */}
                    {isSaleModalOpen && (
                        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative border border-brand-orange/30">
                                <button 
                                    onClick={() => setIsSaleModalOpen(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                >
                                    <i data-lucide="x" className="w-6 h-6"></i>
                                </button>

                                <h3 className="text-xl font-black mb-6 text-gradient flex items-center gap-2">
                                    <i data-lucide="bolt" className="w-6 h-6 text-brand-orange"></i>
                                    Nova Venda Manual (10 Segundos)
                                </h3>

                                <form onSubmit={handleAddSale} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Canal de Venda</label>
                                            <select 
                                                value={newSale.channelId} 
                                                onChange={e => setNewSale({...newSale, channelId: e.target.value})}
                                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                            >
                                                {channels.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Produto Vendido</label>
                                            <select 
                                                value={newSale.productId} 
                                                onChange={e => setNewSale({...newSale, productId: e.target.value})}
                                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                            >
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Qtd</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                required
                                                value={newSale.quantity}
                                                onChange={e => setNewSale({...newSale, quantity: e.target.value})}
                                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço Bruto (R$)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                placeholder="0.00"
                                                value={newSale.grossValue}
                                                onChange={e => setNewSale({...newSale, grossValue: e.target.value})}
                                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Frete Pago (R$)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.00"
                                                value={newSale.shipping}
                                                onChange={e => setNewSale({...newSale, shipping: e.target.value})}
                                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status da Operação</label>
                                        <div className="flex gap-4">
                                            {['Pago', 'Enviado', 'Entregue'].map(s => (
                                                <button 
                                                    type="button"
                                                    key={s}
                                                    onClick={() => setNewSale({...newSale, status: s})}
                                                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${newSale.status === s ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-transparent border-brand-borderBg text-gray-400'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-brand-orange/5 border border-brand-orange/10 p-4 rounded-xl space-y-2">
                                        <span className="text-[10px] font-bold tracking-widest text-brand-orange uppercase">Estimativa Financeira Provisória</span>
                                        <div className="flex justify-between text-sm text-gray-300">
                                            <span>Taxas do Canal Estimadas:</span>
                                            <span>R$ {calculateEstimatedFees().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-300">
                                            <span>Custo do Produto:</span>
                                            <span>R$ {calculateEstimatedCost().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-white border-t border-white/5 pt-2">
                                            <span>Lucro Líquido Real:</span>
                                            <span className={calculateEstimatedProfit() >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                R$ {calculateEstimatedProfit().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full btn-gradient py-4 rounded-xl font-bold text-black uppercase tracking-wide"
                                    >
                                        Confirmar Lançamento
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );

            // Helpers para estimativas do Modal
            function calculateEstimatedFees() {
                const chan = channels.find(c => c.id === newSale.channelId);
                const val = parseFloat(newSale.grossValue) || 0;
                if (!chan) return 0;
                return (val * (chan.commission / 100)) + chan.fixedFee;
            }

            function calculateEstimatedCost() {
                const prod = products.find(p => p.id === newSale.productId);
                if (!prod) return 0;
                return calculateProductCost(prod) * (parseInt(newSale.quantity) || 1);
            }

            function calculateEstimatedProfit() {
                const val = parseFloat(newSale.grossValue) || 0;
                const shipping = parseFloat(newSale.shipping) || 0;
                return val - calculateEstimatedFees() - calculateEstimatedCost() - shipping;
            }
        }

        // --- ABA 1: DASHBOARD VIEW ---
        function DashboardView({ stats, sales, channels, products, compute }) {
            // Calcular faturamento por canal
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
                    {/* Grid de KPIs Financeiros */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Bruto</span>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><i data-lucide="dollar-sign" className="w-4 h-4"></i></div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-black text-white">R$ {stats.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                <span className="text-[9px] text-emerald-400 font-semibold">▲ Vendas ativas: {stats.count}</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lucro Operacional</span>
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="trending-up" className="w-4 h-4"></i></div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-black text-emerald-400">R$ {stats.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                <span className="text-[9px] text-gray-400">Líquido de vendas</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Despesas Adm.</span>
                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><i data-lucide="wallet" className="w-4 h-4"></i></div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-black text-rose-400">R$ {stats.admExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                <span className="text-[9px] text-gray-400">Custos fixos do negócio</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-brand-orange/20 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-orange/5 rounded-full blur-xl"></div>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lucro Real Empresa</span>
                                <div className="p-2 bg-brand-orange/15 rounded-lg text-brand-orange"><i data-lucide="trending-up" className="w-4 h-4"></i></div>
                            </div>
                            <div className="mt-4 z-10">
                                <h3 className={`text-2xl font-black ${stats.companyRealNet >= 0 ? 'text-brand-orange' : 'text-rose-500'}`}>
                                    R$ {stats.companyRealNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h3>
                                <span className="text-[9px] text-gray-400">Sobras líquidas finais</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Margem Média</span>
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><i data-lucide="percent" className="w-4 h-4"></i></div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-black text-brand-yellow">{stats.margin.toFixed(1)}%</h3>
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

                    {/* Gráficos e Detalhes de Canais */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <i data-lucide="activity" className="text-brand-orange w-5 h-5"></i>
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
                                                <span className="text-gray-400">
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
                                <i data-lucide="clock" className="text-brand-orange w-5 h-5"></i>
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

        // --- ABA 2: LISTA DE VENDAS E CONTROLE ---
        function SalesListView({ sales, products, channels, setSales, compute }) {
            const [selectedStatusFilter, setSelectedStatusFilter] = useState('Todos');

            const filteredSales = useMemo(() => {
                if (selectedStatusFilter === 'Todos') return sales;
                return sales.filter(s => s.status === selectedStatusFilter);
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
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl text-gradient">Registro Geral de Vendas</h3>
                        
                        <div className="flex gap-2">
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
                                    <th className="pb-3">Data</th>
                                    <th className="pb-3">Canal</th>
                                    <th className="pb-3">Produto</th>
                                    <th className="pb-3 text-center">Qtd</th>
                                    <th className="pb-3 text-right">Faturado (Bruto)</th>
                                    <th className="pb-3 text-right">Taxas Canal</th>
                                    <th className="pb-3 text-right">Lucro Líquido</th>
                                    <th className="pb-3 text-center">Status</th>
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
                                            <td className="py-4 text-xs font-bold text-gray-400">{sale.date}</td>
                                            <td className="py-4 font-semibold" style={{ color: chan?.color }}>
                                                {chan?.name || 'Excluído'}
                                            </td>
                                            <td className="py-4 font-bold text-white">{prod?.name || 'Excluído'}</td>
                                            <td className="py-4 text-center font-bold">{sale.quantity}</td>
                                            <td className="py-4 text-right font-bold text-white">R$ {sale.grossValue.toFixed(2)}</td>
                                            <td className="py-4 text-right text-rose-400">R$ {fin.fees.toFixed(2)}</td>
                                            <td className={`py-4 text-right font-black ${sale.status === 'Cancelado' ? 'text-gray-500 line-through' : 'text-emerald-400'}`}>
                                                R$ {fin.netProfit.toFixed(2)}
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                                    sale.status === 'Entregue' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    sale.status === 'Enviado' ? 'bg-blue-500/10 text-blue-400' :
                                                    sale.status === 'Cancelado' ? 'bg-rose-500/10 text-rose-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => toggleCancel(sale.id)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                                    title={sale.status === 'Cancelado' ? "Reativar" : "Estornar/Cancelar"}
                                                >
                                                    <i data-lucide={sale.status === 'Cancelado' ? "rotate-ccw" : "ban"} className="w-4 h-4"></i>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400"
                                                    title="Excluir"
                                                >
                                                    <i data-lucide="trash-2" className="w-4 h-4"></i>
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

        // --- ABA 3: CATALOGO DE PRODUTOS & FICHAS TECNICAS (DESIGN CLEAN & PREMIUM) ---
        function ProductCatalogView({ products, setProducts, calculateCost }) {
            const [isAdding, setIsAdding] = useState(false);
            const [newProduct, setNewProduct] = useState({
                name: '',
                type: '3d', // '3d' ou 'resale'
                weight: '',
                printTime: '',
                filamentCost: '95.00',
                machineHourCost: '2.00',
                finishingCost: '2.00',
                packagingCost: '2.50',
                failRate: '10',
                acquisitionCost: ''
            });

            const handleSaveProduct = (e) => {
                e.preventDefault();
                const prod = {
                    id: 'p' + (products.length + 1) + Date.now().toString().slice(-2),
                    name: newProduct.name,
                    type: newProduct.type,
                    weight: newProduct.type === '3d' ? parseFloat(newProduct.weight) : 0,
                    printTime: newProduct.type === '3d' ? parseFloat(newProduct.printTime) : 0,
                    filamentCost: newProduct.type === '3d' ? parseFloat(newProduct.filamentCost) : 0,
                    machineHourCost: newProduct.type === '3d' ? parseFloat(newProduct.machineHourCost) : 0,
                    finishingCost: newProduct.type === '3d' ? parseFloat(newProduct.finishingCost) : 0,
                    packagingCost: newProduct.type === '3d' ? parseFloat(newProduct.packagingCost) : 0,
                    failRate: newProduct.type === '3d' ? parseFloat(newProduct.failRate) || 0 : 0,
                    acquisitionCost: newProduct.type === 'resale' ? parseFloat(newProduct.acquisitionCost) : 0
                };

                setProducts([...products, prod]);
                setIsAdding(false);
                setNewProduct({
                    name: '',
                    type: '3d',
                    weight: '',
                    printTime: '',
                    filamentCost: '95.00',
                    machineHourCost: '2.00',
                    finishingCost: '2.00',
                    packagingCost: '2.50',
                    failRate: '10',
                    acquisitionCost: ''
                });
            };

            const handleDeleteProduct = (id) => {
                if (confirm("Atenção: Vendas vinculadas a este produto perderão as referências. Confirmar exclusão?")) {
                    setProducts(products.filter(p => p.id !== id));
                }
            };

            return (
                <div className="space-y-8 animate-fade-in">
                    {/* Header da Aba */}
                    <div className="flex justify-between items-center border-b border-brand-borderBg pb-4">
                        <div>
                            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Engenharia de Produto</span>
                            <h3 className="font-black text-2xl text-gradient">Produtos & Custos</h3>
                        </div>
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="bg-brand-orange/10 border border-brand-orange/40 hover:bg-brand-orange/20 text-brand-orange px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                        >
                            <i data-lucide={isAdding ? "minus" : "plus"} className="w-4 h-4"></i>
                            {isAdding ? "Fechar Painel" : "Cadastrar Novo Item"}
                        </button>
                    </div>

                    {isAdding && (
                        <form onSubmit={handleSaveProduct} className="glass-panel border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in shadow-2xl">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Nome Comercial do Item</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ex: Filamento PLA Azul 1kg ou Groot 15cm"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                    className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange transition-all placeholder-gray-600"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Categoria de Custos</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setNewProduct({...newProduct, type: '3d'})}
                                        className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${newProduct.type === '3d' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-brand-darkBg/30 border-brand-borderBg text-gray-400'}`}
                                    >
                                        Peça Impressa 3D
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNewProduct({...newProduct, type: 'resale'})}
                                        className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${newProduct.type === 'resale' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-brand-darkBg/30 border-brand-borderBg text-gray-400'}`}
                                    >
                                        Revenda Direta
                                    </button>
                                </div>
                            </div>

                            {newProduct.type === '3d' ? (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Peso da Peça (g)</label>
                                        <input 
                                            type="number" required placeholder="Gramas no Fatiador"
                                            value={newProduct.weight}
                                            onChange={e => setNewProduct({...newProduct, weight: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Tempo Impressão (h)</label>
                                        <input 
                                            type="number" step="0.1" required placeholder="Horas totais"
                                            value={newProduct.printTime}
                                            onChange={e => setNewProduct({...newProduct, printTime: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Custo Filamento (R$/kg)</label>
                                        <input 
                                            type="number" value={newProduct.filamentCost}
                                            onChange={e => setNewProduct({...newProduct, filamentCost: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Custo de Hora/Máquina</label>
                                        <input 
                                            type="number" value={newProduct.machineHourCost}
                                            onChange={e => setNewProduct({...newProduct, machineHourCost: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Acabamento/Insumo</label>
                                        <input 
                                            type="number" value={newProduct.finishingCost}
                                            onChange={e => setNewProduct({...newProduct, finishingCost: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Embalagem de Envio</label>
                                        <input 
                                            type="number" value={newProduct.packagingCost}
                                            onChange={e => setNewProduct({...newProduct, packagingCost: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Taxa de Perda/Falha (%)</label>
                                        <input 
                                            type="number" value={newProduct.failRate}
                                            onChange={e => setNewProduct({...newProduct, failRate: e.target.value})}
                                            className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Preço de Compra (R$)</label>
                                    <input 
                                        type="number" step="0.01" required placeholder="0.00"
                                        value={newProduct.acquisitionCost}
                                        onChange={e => setNewProduct({...newProduct, acquisitionCost: e.target.value})}
                                        className="w-full bg-brand-darkBg/60 border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            )}

                            <button 
                                type="submit"
                                className="md:col-span-4 btn-gradient py-3.5 rounded-xl font-extrabold text-black uppercase tracking-widest text-xs md:text-sm"
                            >
                                Registrar no Catálogo
                            </button>
                        </form>
                    )}

                    {/* Catálogo Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {products.map(prod => {
                            const cost = calculateCost(prod);
                            const isResale = prod.type === 'resale';

                            // Detalhes das proporções de custo
                            const rawPlasticCost = isResale ? 0 : (prod.weight * prod.filamentCost) / 1000;
                            const rawMachineCost = isResale ? 0 : prod.printTime * prod.machineHourCost;
                            const failCostValue = isResale ? 0 : (rawPlasticCost + rawMachineCost) * ((prod.failRate || 0) / 100);
                            const extrasCost = isResale ? 0 : prod.finishingCost + prod.packagingCost;

                            const totalParts = isResale ? cost : (rawPlasticCost + rawMachineCost + failCostValue + extrasCost);
                            const plasticPct = !isResale && totalParts > 0 ? (rawPlasticCost / totalParts) * 100 : 0;
                            const machinePct = !isResale && totalParts > 0 ? (rawMachineCost / totalParts) * 100 : 0;
                            const failPct = !isResale && totalParts > 0 ? (failCostValue / totalParts) * 100 : 0;
                            const extrasPct = !isResale && totalParts > 0 ? (extrasCost / totalParts) * 100 : 0;

                            return (
                                <div key={prod.id} className="glass-panel rounded-2xl p-5 hover:border-brand-orange/45 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-5 border border-white/5 shadow-lg">
                                    {prod.isPendingConfig && (
                                        <div className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md animate-pulse z-10 uppercase tracking-widest">
                                            Ajustar Custos
                                        </div>
                                    )}

                                    {/* Lado Esquerdo: Imagem + Categorias principais */}
                                    <div className="w-full md:w-36 flex flex-col items-center justify-between gap-3 text-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-5">
                                        {prod.image ? (
                                            <img src={prod.image} className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border border-white/10 shadow" alt={prod.name} />
                                        ) : (
                                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                                Sem Foto
                                            </div>
                                        )}

                                        <div>
                                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${isResale ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-brand-orange/15 text-brand-orange border border-brand-orange/25'}`}>
                                                {isResale ? 'Revenda' : 'Impressão 3D'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Lado Direito: Informações Fatais limpas */}
                                    <div className="flex-1 flex flex-col justify-between gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-extrabold text-white text-lg tracking-tight line-clamp-1">{prod.name}</h4>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Código SKU: {prod.id}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteProduct(prod.id)}
                                                className="p-1.5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all"
                                                title="Excluir produto"
                                            >
                                                <i data-lucide="trash-2" className="w-4.5 h-4.5"></i>
                                            </button>
                                        </div>

                                        {prod.isPendingConfig ? (
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between">
                                                <span className="text-xs text-rose-400 font-medium">⚠️ Cadastro provisório pendente de ajustes</span>
                                                <button 
                                                    onClick={() => {
                                                        const newName = prompt("Confirme o nome do produto:", prod.name);
                                                        if (!newName) return;
                                                        if (prod.type === '3d') {
                                                            const weight = parseFloat(prompt("Digite o peso em gramas (g):", "100")) || 0;
                                                            const printTime = parseFloat(prompt("Digite o tempo de impressão em horas (h):", "5")) || 0;
                                                            setProducts(products.map(p => p.id === prod.id ? { ...p, name: newName, weight, printTime, isPendingConfig: false } : p));
                                                        } else {
                                                            const acq = parseFloat(prompt("Digite o custo de aquisição (R$):", "50")) || 0;
                                                            setProducts(products.map(p => p.id === prod.id ? { ...p, name: newName, acquisitionCost: acq, isPendingConfig: false } : p));
                                                        }
                                                    }}
                                                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider"
                                                >
                                                    Ajustar Ficha
                                                </button>
                                            </div>
                                        ) : (
                                            /* Métricas Gerais de Custos */
                                            <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-3">
                                                <div>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">{isResale ? "Método" : "Material"}</span>
                                                    <span className="text-sm font-bold text-white">{isResale ? "Compra Direta" : `${prod.weight}g`}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">{isResale ? "Tipo" : "Tempo"}</span>
                                                    <span className="text-sm font-bold text-white">{isResale ? "Pronto" : `${prod.printTime}h`}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-brand-orange font-bold uppercase tracking-wider block mb-0.5">Preço Custo</span>
                                                    <span className="text-sm font-extrabold text-brand-orange">R$ {cost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Barra de composição bem discreta */}
                                        {!isResale && !prod.isPendingConfig && (
                                            <div className="space-y-1">
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-blue-500" style={{ width: `${plasticPct}%` }} title={`Plástico: ${plasticPct.toFixed(0)}%`}></div>
                                                    <div className="h-full bg-purple-500" style={{ width: `${machinePct}%` }} title={`Máquina: ${machinePct.toFixed(0)}%`}></div>
                                                    <div className="h-full bg-rose-500" style={{ width: `${failPct}%` }} title={`Perda: ${failPct.toFixed(0)}%`}></div>
                                                    <div className="h-full bg-yellow-500" style={{ width: `${extrasPct}%` }} title={`Extras: ${extrasPct.toFixed(0)}%`}></div>
                                                </div>
                                                <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                                                    <span>Plástico ({plasticPct.toFixed(0)}%)</span>
                                                    <span>Máquina ({machinePct.toFixed(0)}%)</span>
                                                    <span>Falha ({prod.failRate}%)</span>
                                                    <span>Extras ({extrasPct.toFixed(0)}%)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sugestão de Preço Venda */}
                                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                                            <span className="text-gray-400 font-medium">Sugestão de Preço (Markup {isResale ? '1.8x' : '3x'}):</span>
                                            <strong className="text-emerald-400 text-sm font-black">R$ {(cost * (isResale ? 1.8 : 3)).toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // --- ABA 4: CONFIGURAÇÃO DE CANAIS ---
        function ChannelsConfigView({ channels, setChannels }) {
            const [selectedChan, setSelectedChan] = useState(channels[0]);
            const [editedCommission, setEditedCommission] = useState(channels[0]?.commission || 0);
            const [editedFixedFee, setEditedFixedFee] = useState(channels[0]?.fixedFee || 0);

            const handleUpdate = (e) => {
                e.preventDefault();
                setChannels(channels.map(c => {
                    if (c.id === selectedChan.id) {
                        return {
                            ...c,
                            commission: parseFloat(editedCommission),
                            fixedFee: parseFloat(editedFixedFee)
                        };
                    }
                    return c;
                }));
                alert("Tarifas do canal atualizadas com sucesso!");
            };

            const selectChannel = (chan) => {
                setSelectedChan(chan);
                setEditedCommission(chan.commission);
                setEditedFixedFee(chan.fixedFee);
            };

            return (
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="font-black text-xl mb-6 text-gradient">Taxas dos Canais de Vendas</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Lista de Canais */}
                        <div className="space-y-3">
                            {channels.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => selectChannel(c)}
                                    className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${selectedChan.id === c.id ? 'bg-brand-orange/10 border-brand-orange' : 'bg-[#121215] border-white/5 hover:border-brand-orange/30'}`}
                                >
                                    <span className="font-bold flex items-center gap-2" style={{ color: c.color }}>
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                                        {c.name}
                                    </span>
                                    <span className="text-xs text-gray-400">{c.commission}% + R$ {c.fixedFee}</span>
                                </button>
                            ))}
                        </div>

                        {/* Editor do Canal selecionado */}
                        <form onSubmit={handleUpdate} className="lg:col-span-2 bg-[#121215] p-6 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="font-extrabold text-white text-lg">
                                Configurações de Comissões: <span style={{ color: selectedChan.color }}>{selectedChan.name}</span>
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comissão do Canal (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={editedCommission}
                                        onChange={e => setEditedCommission(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Taxa Fixa por Venda (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={editedFixedFee}
                                        onChange={e => setEditedFixedFee(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full btn-gradient py-3.5 rounded-xl font-bold text-black uppercase tracking-wide"
                            >
                                Salvar Tarifas do Canal
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        // --- VIEW DE RELATÓRIOS & INSIGHTS ---
        function ReportsView({ sales, products, channels, compute, selectedMonth, expenses }) {
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

            // Margem por produto (ajustado para suportar revenda e 3d dinamicamente)
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
                let csv = "Data,Canal,Produto,Quantidade,Valor Bruto,Lucro Liquido\n";
                sales.forEach(sale => {
                    const prod = products.find(p => p.id === sale.productId);
                    const chan = channels.find(c => c.id === sale.channelId);
                    const fin = compute(sale);
                    csv += `${sale.date},"${chan?.name || 'Excluido'}","${prod?.name || 'Excluido'}",${sale.quantity},${sale.grossValue},${fin.netProfit}\n`;
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

            // --- VIEW DE FORNECEDORES ---
            function SuppliersView({ suppliers, setSuppliers }) {
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
                                            <i data-lucide="trash-2" className="w-4 h-4"></i>
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

            // --- ABA 8: DESPESAS ADMINISTRATIVAS ---
            function ExpensesView({ expenses, setExpenses, selectedMonth }) {
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
                                <i data-lucide={isAdding ? "minus" : "plus"} className="w-4 h-4"></i>
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
                                                            <i data-lucide="trash-2" className="w-4 h-4"></i>
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
        
        
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    