import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, ShoppingBag, Printer, Sliders, Plus, Bolt, X, PieChart, Truck, Wallet, Sun, Moon, Package, Menu, DollarSign } from 'lucide-react';
import DashboardView from './components/Dashboard';
import DashboardCharts from './components/DashboardCharts';
import SalesListView from './components/SalesList';
import ProductCatalogView from './components/ProductCatalog';
import ChannelsConfigView from './components/ChannelsConfig';
import ReportsView from './components/Reports';
import SuppliersView from './components/Suppliers';
import ExpensesView from './components/Expenses';
import EstoqueView from './components/Estoque';
import PricingSimulatorView from './components/PricingSimulator';
import IntegrationsManagerView from './components/IntegrationsManager';
import LoginScreenView from './components/LoginScreen';

// --- DADOS INICIAIS DO LOCALSTORAGE (MOCK) ---
const INITIAL_CHANNELS = [
    { id: 'ml1', name: 'printoustudio3d', commission: 12.0, fixedFee: 6.0, color: '#FFE600', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
    { id: 'ml2', name: 'AlucarPrintoustudio3d', commission: 19.5, fixedFee: 6.0, color: '#FFB900', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
    { id: 'shopee', name: 'Shopee', commission: 14.0, fixedFee: 3.0, color: '#EE4D2D', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
    { id: 'site', name: 'Site Próprio', commission: 3.99, fixedFee: 0.5, color: '#0088FF', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
    { id: 'direta', name: 'Venda Direta / Pix', commission: 0.0, fixedFee: 0.0, color: '#30D158', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 }
];

const INITIAL_SUPPLIERS = [];
const INITIAL_EXPENSES = [];
const INITIAL_PRODUCTS = [];
const INITIAL_FILAMENTS = [];
const INITIAL_SALES = [];

function App() {
    // --- ESTADOS DO SISTEMA ---
    const [currentUser, setCurrentUser] = useState(() => {
        const local = localStorage.getItem('printou_user');
        return local ? JSON.parse(local) : null;
    });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('printou_theme') || 'light';
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
    const [sales, setSales] = useState(() => {
        const local = localStorage.getItem('printou_sales');
        return local ? JSON.parse(local) : INITIAL_SALES;
    });
    const [filaments, setFilaments] = useState(() => {
        const local = localStorage.getItem('printou_filaments');
        return local ? JSON.parse(local) : INITIAL_FILAMENTS;
    });
    const [expenses, setExpenses] = useState(() => {
        const local = localStorage.getItem('printou_expenses');
        return local ? JSON.parse(local) : INITIAL_EXPENSES;
    });

    const [integrationLogs, setIntegrationLogs] = useState([]);
    const [credentials, setCredentials] = useState({
        mercadolivre: { clientId: '', clientSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/mercadolivre', status: 'Sincronizado' },
        shopee: { shopId: '', apiKey: '', webhookUrl: 'http://localhost:3001/api/webhooks/shopee', status: 'Sincronizado' }
    });

    const refreshDatabaseData = async () => {
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                const data = await response.json();
                if (data.sales) setSales(data.sales);
                if (data.products) setProducts(data.products);
                if (data.channels) setChannels(data.channels);
                if (data.suppliers) setSuppliers(data.suppliers);
                if (data.expenses) setExpenses(data.expenses);
                if (data.filaments) setFilaments(data.filaments);
                if (data.integrationLogs) setIntegrationLogs(data.integrationLogs);
                if (data.credentials) setCredentials(data.credentials);
            }
        } catch (error) {
            console.warn("Servidor de banco de dados offline. Usando fallback LocalStorage:", error);
        }
    };

    // Tenta carregar dados do banco de dados local na inicialização
    useEffect(() => {
        refreshDatabaseData();
    }, []);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('printou_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('printou_user');
        }
    }, [currentUser]);

    const handleLogout = () => {
        setCurrentUser(null);
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [activeTab]);

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

    // Migração de nomes antigos do Mercado Livre salvos no LocalStorage e ajuste de taxas/fretes
    useEffect(() => {
        let updated = false;
        const newChans = channels.map(c => {
            let changed = false;
            let target = { ...c };
            if (c.id === 'ml1' && (c.name === 'Mercado Livre - Conta 1' || c.commission === 16.5)) {
                target.name = 'printoustudio3d';
                target.commission = 12.0;
                changed = true;
            }
            if (c.id === 'ml2' && (c.name === 'Mercado Livre - Conta 2' || c.commission === 12.0)) {
                target.name = 'AlucarPrintoustudio3d';
                target.commission = 19.5;
                target.color = '#FFB900';
                changed = true;
            }
            // Garantir novas propriedades de frete
            if (target.hasFreeShippingThreshold === undefined) {
                const initialRef = INITIAL_CHANNELS.find(ic => ic.id === target.id);
                if (initialRef) {
                    target.hasFreeShippingThreshold = initialRef.hasFreeShippingThreshold;
                    target.freeShippingThreshold = initialRef.freeShippingThreshold;
                    target.defaultSellerShippingCost = initialRef.defaultSellerShippingCost;
                    target.defaultBelowThresholdShippingCost = initialRef.defaultBelowThresholdShippingCost;
                    changed = true;
                }
            }
            if (changed) updated = true;
            return target;
        });
        if (updated) {
            setChannels(newChans);
        }
    }, []);

    // Lógica de cálculo de frete sugerido automático no lançamento de vendas
    useEffect(() => {
        const chan = channels.find(c => c.id === newSale.channelId);
        if (chan) {
            const gross = parseFloat(newSale.grossValue) || 0;
            let suggestedShipping = 0;
            if (chan.hasFreeShippingThreshold) {
                if (gross >= chan.freeShippingThreshold) {
                    suggestedShipping = chan.defaultSellerShippingCost;
                } else {
                    suggestedShipping = chan.defaultBelowThresholdShippingCost;
                }
            } else {
                suggestedShipping = chan.defaultSellerShippingCost || 0;
            }
            
            if (parseFloat(newSale.shipping) !== suggestedShipping && newSale.shipping !== suggestedShipping.toFixed(2)) {
                setNewSale(prev => ({ ...prev, shipping: suggestedShipping.toFixed(2) }));
            }
        }
    }, [newSale.channelId, newSale.grossValue, channels]);

    // Sincronização geral com LocalStorage e Banco de Dados Local (com debounce de 100ms)
    useEffect(() => {
        localStorage.setItem('printou_channels', JSON.stringify(channels));
        localStorage.setItem('printou_products', JSON.stringify(products));
        localStorage.setItem('printou_sales', JSON.stringify(sales));
        localStorage.setItem('printou_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('printou_expenses', JSON.stringify(expenses));
        localStorage.setItem('printou_filaments', JSON.stringify(filaments));

        const sync = async () => {
            try {
                await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sales,
                        products,
                        channels,
                        suppliers,
                        expenses,
                        filaments
                    })
                });
            } catch (err) {
                // Silencioso: continua usando LocalStorage normalmente se offline
            }
        };
        const timer = setTimeout(sync, 100);
        return () => clearTimeout(timer);
    }, [channels, products, sales, suppliers, expenses, filaments]);

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
        let totalShipping = 0;
        let activeSalesCount = 0;

        const filteredSales = sales.filter(s => s.date.startsWith(selectedMonth));

        filteredSales.forEach(sale => {
            if (sale.status !== 'Cancelado') {
                const fin = computeSaleFinancials(sale);
                totalGross += sale.grossValue;
                totalNet += fin.netProfit;
                totalFees += fin.fees;
                totalShipping += parseFloat(sale.shipping) || 0;
                activeSalesCount++;
            }
        });

        const filteredExpenses = expenses.filter(e => e.competency === selectedMonth);
        const totalAdmExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);
        const companyRealNet = totalNet - totalAdmExpenses;
        const averageMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;

        const profitRate = totalGross > 0 ? totalNet / totalGross : 0;
        const breakevenSalesValue = profitRate > 0 ? totalAdmExpenses / profitRate : 0;
        const breakevenProgress = breakevenSalesValue > 0 ? Math.min((totalGross / breakevenSalesValue) * 100, 100) : (totalGross > 0 && totalAdmExpenses === 0 ? 100 : 0);

        return {
            gross: totalGross,
            net: totalNet,
            fees: totalFees,
            shipping: totalShipping,
            count: activeSalesCount,
            margin: averageMargin,
            admExpenses: totalAdmExpenses,
            companyRealNet: companyRealNet,
            breakevenTarget: breakevenSalesValue,
            breakevenProgress: breakevenProgress
        };
    }, [sales, products, channels, expenses, selectedMonth]);

    // Helpers para estimativas do Modal
    const calculateEstimatedFees = () => {
        const chan = channels.find(c => c.id === newSale.channelId);
        const val = parseFloat(newSale.grossValue) || 0;
        if (!chan) return 0;
        return (val * (chan.commission / 100)) + chan.fixedFee;
    };

    const calculateEstimatedCost = () => {
        const prod = products.find(p => p.id === newSale.productId);
        if (!prod) return 0;
        return calculateProductCost(prod) * (parseInt(newSale.quantity) || 1);
    };

    const calculateEstimatedProfit = () => {
        const val = parseFloat(newSale.grossValue) || 0;
        const shipping = parseFloat(newSale.shipping) || 0;
        return val - calculateEstimatedFees() - calculateEstimatedCost() - shipping;
    };

    // --- AUXILIAR: REGISTRAR VENDA E DEDUZIR ESTOQUE ---
    const registerSaleAndDeductStock = (saleToAdd) => {
        setSales(prevSales => [saleToAdd, ...prevSales]);
        
        if (saleToAdd.status !== 'Cancelado') {
            const prod = products.find(p => p.id === saleToAdd.productId);
            if (prod && prod.type === '3d' && prod.filamentId) {
                setFilaments(prevFilaments => prevFilaments.map(fil => {
                    if (fil.id === prod.filamentId) {
                        return { 
                            ...fil, 
                            currentWeight: Math.max(0, parseFloat((fil.currentWeight - (prod.weight * saleToAdd.quantity)).toFixed(1)))
                        };
                    }
                    return fil;
                }));
            }
        }
    };

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

        registerSaleAndDeductStock(saleToAdd);
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
                isPendingConfig: true,
                filamentId: guessedType === '3d' ? 'fil1' : undefined
            };
            setProducts(prev => [...prev, newProd]);
        }

        // 2. Registra a venda e deduz estoque
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
        registerSaleAndDeductStock(saleToAdd);
        alert(`Venda recebida via Integração! O produto "${saleData.productName}" foi importado automaticamente com imagem e ficha técnica provisória.`);
    };

    if (!currentUser) {
        return <LoginScreenView onLoginSuccess={setCurrentUser} />;
    }

    const isAdmin = currentUser.role === 'admin';

    // Se um funcionário tentar acessar uma aba restrita, redireciona para a dashboard
    if (!isAdmin && (activeTab === 'channels' || activeTab === 'integrations' || activeTab === 'expenses')) {
        setActiveTab('dashboard');
    }

    return (
        <div className={`flex min-h-screen ${theme === 'light' ? 'bg-[#F3F4F6] text-[#1F2937]' : 'bg-brand-darkBg text-white'} overflow-x-hidden`}>
            {/* Backdrop para fechar o menu no celular */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside className={`w-64 glass-panel border-r border-brand-borderBg flex flex-col justify-between p-6 fixed lg:static inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div>
                    <div className="flex items-center justify-center mb-10">
                        <img src="assets/logo.png" alt="Printou Logo" className="w-48 h-auto object-contain" />
                    </div>

                    <nav className="space-y-2">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-semibold">Dashboard</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('sales')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'sales' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="font-semibold">Vendas</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('products')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'products' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Printer className="w-5 h-5" />
                            <span className="font-semibold">Produtos</span>
                        </button>

                        {isAdmin && (
                            <button 
                                onClick={() => setActiveTab('channels')}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'channels' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Sliders className="w-5 h-5" />
                                <span className="font-semibold">Taxas e Canais</span>
                            </button>
                        )}

                        <button 
                            onClick={() => setActiveTab('pricing')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'pricing' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <DollarSign className="w-5 h-5" />
                            <span className="font-semibold">Precificação</span>
                        </button>

                        {isAdmin && (
                            <button 
                                onClick={() => setActiveTab('integrations')}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'integrations' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Bolt className="w-5 h-5" />
                                <span className="font-semibold">Integrações</span>
                            </button>
                        )}

                        <button 
                            onClick={() => setActiveTab('reports')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'reports' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <PieChart className="w-5 h-5" />
                            <span className="font-semibold">Relatórios</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('suppliers')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'suppliers' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Truck className="w-5 h-5" />
                            <span className="font-semibold">Fornecedores</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('estoque')}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'estoque' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Package className="w-5 h-5" />
                            <span className="font-semibold">Estoque</span>
                        </button>

                        {isAdmin && (
                            <button 
                                onClick={() => setActiveTab('expenses')}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'expenses' ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Wallet className="w-5 h-5" />
                                <span className="font-semibold">Despesas Adm.</span>
                            </button>
                        )}
                    </nav>
                </div>

                <div className="pt-6 border-t border-brand-borderBg flex flex-col items-center gap-2">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500">Usuário Ativo</p>
                        <p className="text-xs font-bold text-white">{currentUser?.name}</p>
                        <p className="text-[9px] text-brand-orange uppercase font-bold tracking-wider">{currentUser?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer mt-1"
                    >
                        Sair da Conta
                    </button>
                </div>
            </aside>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
                {/* Header Superior */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Operações</span>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Controle Central de Vendas</h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

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
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <button 
                            onClick={() => setIsSaleModalOpen(true)}
                            className="btn-gradient px-6 py-3 rounded-xl font-bold text-black flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5 text-black" />
                            Lançar Venda
                        </button>
                    </div>
                </header>

                {/* Banner de aviso para itens pendentes */}
                {products.filter(p => p.isPendingConfig).length > 0 && (
                    <div className="mb-6 glass-panel border-rose-500/30 bg-rose-500/5 p-4 rounded-xl flex items-center justify-between text-rose-400 text-sm animate-pulse">
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
                    <DashboardView stats={financeStats} sales={sales} channels={channels} products={products} compute={computeSaleFinancials} filaments={filaments} />
                )}

                {activeTab === 'sales' && (
                    <SalesListView sales={sales} products={products} channels={channels} setSales={setSales} compute={computeSaleFinancials} />
                )}

                {activeTab === 'products' && (
                    <ProductCatalogView products={products} setProducts={setProducts} calculateCost={calculateProductCost} filaments={filaments} />
                )}

                {activeTab === 'channels' && (
                    <ChannelsConfigView channels={channels} setChannels={setChannels} />
                )}

                {activeTab === 'pricing' && (
                    <PricingSimulatorView 
                        channels={channels} 
                        filaments={filaments} 
                        onAddProduct={(newProd) => setProducts(prev => [...prev, newProd])} 
                        setActiveTab={setActiveTab}
                    />
                )}

                {activeTab === 'integrations' && (
                    <IntegrationsManagerView 
                        products={products}
                        channels={channels}
                        integrationLogs={integrationLogs}
                        credentials={credentials}
                        onWebhookTriggered={refreshDatabaseData}
                        onClearLogs={async () => {
                            await fetch('/api/integration/logs/clear', { method: 'POST' });
                            refreshDatabaseData();
                        }}
                    />
                )}

                {activeTab === 'reports' && (
                    <ReportsView sales={sales} products={products} channels={channels} compute={computeSaleFinancials} selectedMonth={selectedMonth} expenses={expenses} />
                )}

                {activeTab === 'suppliers' && (
                    <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} />
                )}

                {activeTab === 'estoque' && (
                    <EstoqueView filaments={filaments} setFilaments={setFilaments} suppliers={suppliers} />
                )}

                {activeTab === 'expenses' && (
                    <ExpensesView expenses={expenses} setExpenses={setExpenses} selectedMonth={selectedMonth} />
                )}
            </main>

            {/* --- MODAL FLOATING DE LANÇAMENTO DE VENDA RAPIDA --- */}
            {isSaleModalOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative border border-brand-orange/30">
                        <button 
                            onClick={() => setIsSaleModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-black mb-6 text-gradient flex items-center gap-2">
                            <Bolt className="w-6 h-6 text-brand-orange" />
                            Nova Venda Manual (10 Segundos)
                        </h3>

                        <form onSubmit={handleAddSale} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="bg-brand-orange/5 border border-brand-orange/10 p-4 rounded-xl space-y-2 text-xs">
                                <span className="font-bold tracking-widest text-brand-orange uppercase">Estimativa Financeira Provisória</span>
                                <div className="flex justify-between text-gray-300">
                                    <span>Taxas do Canal Estimadas:</span>
                                    <span>R$ {calculateEstimatedFees().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
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
                                className="w-full btn-gradient py-4 rounded-xl font-bold text-black uppercase tracking-wide transition-all"
                            >
                                Confirmar Lançamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
