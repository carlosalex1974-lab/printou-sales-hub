import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Trava em memória para evitar concorrência/duplicação de webhooks
const activeLocks = new Set();

const uri = "mongodb://carlosalex1974_db_user:kPMDLXtyBwR4NUtd@ac-nbjwzq9-shard-00-00.zn8nyjr.mongodb.net:27017,ac-nbjwzq9-shard-00-01.zn8nyjr.mongodb.net:27017,ac-nbjwzq9-shard-00-02.zn8nyjr.mongodb.net:27017/printou?ssl=true&replicaSet=atlas-ph5ht3-shard-0&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);
let sysCol;
let dbMutex = Promise.resolve(); // Global mutex for DB operations

// Wrapper seguro para ler, modificar e salvar o banco de dados atomicamente
async function withDbLock(callback) {
    const release = await new Promise(resolve => {
        const next = dbMutex.then(() => resolve);
        dbMutex = next.catch(() => resolve);
    });
    try {
        await callback();
    } finally {
        release();
    }
}

async function connectDB() {
    try {
        await client.connect();
        sysCol = client.db("printou").collection("system");
        console.log("✅ Conectado ao MongoDB Atlas!");
    } catch (e) {
        console.error("❌ Falha ao conectar ao MongoDB:", e.message);
        console.log("🔄 Tentando reconectar em 10 segundos...");
        setTimeout(connectDB, 10000);
    }
}
connectDB();


app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir arquivos estáticos do React em produção
app.use(express.static(path.join(__dirname, 'dist')));
// Servir a pasta de imagens assets diretamente
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Banco de dados Mock Padrão Inicial
const DEFAULT_DB = {
    channels: [
        { id: 'ml1', name: 'printoustudio3d (Clássico)', commission: 12.0, fixedFee: 6.0, color: '#7C3AED', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'ml2', name: 'AlucarPrintoustudio3d (Premium)', commission: 19.5, fixedFee: 6.0, color: '#14B8A6', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'shopee', name: 'Shopee', commission: 14.0, fixedFee: 3.0, color: '#EE4D2D', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'site', name: 'Site Próprio', commission: 3.99, fixedFee: 0.5, color: '#0088FF', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'direta', name: 'Venda Direta / Pix', commission: 0.0, fixedFee: 0.0, color: '#30D158', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 }
    ],
    suppliers: [],
    expenses: [],
    products: [],
    filaments: [],
    sales: [],
    monthlyClosings: [],
    integrationLogs: [],
    accounts: [
        { id: 'caixa-principal', name: 'Conta Bancária Principal', type: 'bank' },
        { id: 'mercado-pago', name: 'Mercado Pago', type: 'wallet' }
    ],
    transactions: [],
    credentials: {
        mercadolivre: { clientId: '', clientSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/mercadolivre', status: 'Não Sincronizado' },
        shopee: { shopId: '', apiKey: '', webhookUrl: 'http://localhost:3001/api/webhooks/shopee', status: 'Não Sincronizado' },
        site: { apiKey: '', apiSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/site', status: 'Não Sincronizado' },
        facebook: { accessToken: '', pageId: '1117637594770324', businessId: '1550133536629313', catalogId: '', status: 'Não Sincronizado' },
        tiny: { token: '', status: 'Não Sincronizado' }
    },
    users: [
        { email: 'admin@printou.com', password: 'admin123', name: 'Administrador Printou', role: 'admin' },
        { email: 'operador@printou.com', password: 'printou123', name: 'Operador Printou', role: 'employee' }
    ]
};



// Helper para ler DB
async function readDb() {
    let db;
    try {
        if (!sysCol) throw new Error("Conexão com MongoDB não estabelecida.");
        const doc = await sysCol.findOne({_id: 'main'});
        db = doc || JSON.parse(JSON.stringify(DEFAULT_DB));
    } catch (e) {
        console.error("Erro no MongoDB, usando arquivo local db.json como fallback:", e.message);
        try {
            if (fs.existsSync(DB_FILE)) {
                db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            } else {
                db = JSON.parse(JSON.stringify(DEFAULT_DB));
            }
        } catch(err) {
            db = JSON.parse(JSON.stringify(DEFAULT_DB));
        }
    }
    
    db.credentials = db.credentials || {};
    
    db.credentials.mercadolivre = db.credentials.mercadolivre || {};
    db.credentials.mercadolivre.clientId = process.env.ML_CLIENT_ID || db.credentials.mercadolivre.clientId || '';
    db.credentials.mercadolivre.clientSecret = process.env.ML_CLIENT_SECRET || db.credentials.mercadolivre.clientSecret || '';
    
    db.credentials.mercadolivre2 = db.credentials.mercadolivre2 || {};
    db.credentials.mercadolivre2.clientId = process.env.ML2_CLIENT_ID || db.credentials.mercadolivre2.clientId || '';
    db.credentials.mercadolivre2.clientSecret = process.env.ML2_CLIENT_SECRET || db.credentials.mercadolivre2.clientSecret || '';
    
    db.credentials.shopee = db.credentials.shopee || {};
    db.credentials.shopee.shopId = process.env.SHOPEE_SHOP_ID || db.credentials.shopee.shopId || '';
    db.credentials.shopee.apiKey = process.env.SHOPEE_API_KEY || db.credentials.shopee.apiKey || '';
    
    db.credentials.site = db.credentials.site || {};
    db.credentials.site.apiKey = process.env.SITE_API_KEY || db.credentials.site.apiKey || '';
    db.credentials.site.apiSecret = process.env.SITE_API_SECRET || db.credentials.site.apiSecret || '';

    db.credentials.facebook = db.credentials.facebook || {};
    db.credentials.facebook.accessToken = process.env.FB_ACCESS_TOKEN || db.credentials.facebook.accessToken || '';
    db.credentials.facebook.pageId = process.env.FB_PAGE_ID || db.credentials.facebook.pageId || '1117637594770324';
    db.credentials.facebook.businessId = process.env.FB_BUSINESS_ID || db.credentials.facebook.businessId || '1550133536629313';
    db.credentials.facebook.catalogId = process.env.FB_CATALOG_ID || db.credentials.facebook.catalogId || '';

    if (db.credentials.mercadolivre.clientId && db.credentials.mercadolivre.clientSecret) db.credentials.mercadolivre.status = 'Sincronizado';
    if (db.credentials.mercadolivre2.clientId && db.credentials.mercadolivre2.clientSecret) db.credentials.mercadolivre2.status = 'Sincronizado';
    if (db.credentials.shopee.shopId && db.credentials.shopee.apiKey) db.credentials.shopee.status = 'Sincronizado';
    if (db.credentials.site.apiKey && db.credentials.site.apiSecret) db.credentials.site.status = 'Sincronizado';
    if (db.credentials.facebook.accessToken) db.credentials.facebook.status = 'Sincronizado';
    else db.credentials.facebook.status = 'Nao Sincronizado';

    db.monthlyClosings = db.monthlyClosings || [];
    
    // Assegurar arrays do módulo de Caixa
    db.accounts = db.accounts || [
        { id: 'caixa-principal', name: 'Conta Bancária Principal', type: 'bank' },
        { id: 'mercado-pago', name: 'Mercado Pago', type: 'wallet' }
    ];
    db.transactions = db.transactions || [];
    
    return db;
}

// Helper para salvar DB com escrita atômica e backups automáticos rotativos
async function saveDb(updateData) {
    let savedToMongo = false;
    try {
        if (sysCol) {
            const { _id, ...dataToSave } = updateData;
            await sysCol.updateOne({_id: 'main'}, {$set: dataToSave}, {upsert: true});
            savedToMongo = true;
        } else {
            throw new Error("Conexão com MongoDB não estabelecida.");
        }
    } catch(e) {
        console.error("Erro ao salvar no MongoDB, salvando no arquivo local db.json:", e.message);
    }

    // Fallback ou backup local
    if (!savedToMongo) {
        try {
            if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
            fs.writeFileSync(DB_FILE, JSON.stringify(updateData, null, 2));
        } catch(err) {
            console.error("Erro ao escrever fallback local:", err);
        }
    }
}

// Endpoint para listar fechamentos mensais
app.get('/api/monthly-closings', async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.monthlyClosings || []);
    } catch (error) {
        console.error("Erro ao ler fechamentos mensais:", error);
        res.status(500).json({ error: "Erro ao ler fechamentos" });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { name, category, value, date, isRecurring, accountId } = req.body;
        if (!name || !category || !value || !date) {
            return res.status(400).json({ error: "Faltam campos obrigatórios." });
        }
        const db = await readDb();
        
        const newExpense = {
            id: Date.now().toString(),
            name, category, value: parseFloat(value), date,
            isRecurring: !!isRecurring,
            accountId: accountId || 'caixa-principal'
        };
        
        db.expenses.unshift(newExpense);
        
        // Registrar a transação de saída
        const newTransaction = {
            id: Date.now().toString() + '-exp',
            date: date,
            description: `Despesa: ${name} (${category})`,
            type: 'OUT',
            amount: parseFloat(value),
            accountId: newExpense.accountId,
            category: 'Despesa Administrativa'
        };
        db.transactions.unshift(newTransaction);
        
        await saveDb(db);
        res.json({ success: true, expense: newExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao adicionar despesa." });
    }
});

// Endpoint para realizar fechamento mensal
app.post('/api/monthly-closings', async (req, res) => {
    try {
        const { month, grossRevenue, netProfit, totalExpenses, realNet, salesCount, stockMovementsCount, stockSnapshot } = req.body;
        
        if (!month) {
            return res.status(400).json({ error: "Mês é obrigatório" });
        }

        const db = await readDb();
        db.monthlyClosings = db.monthlyClosings || [];

        // Evitar duplicidade de fechamento para o mesmo mês
        if (db.monthlyClosings.some(c => c.month === month)) {
            return res.status(400).json({ error: `O mês ${month} já está fechado.` });
        }

        const closing = {
            id: 'close-' + Date.now(),
            month,
            closedAt: new Date().toISOString(),
            grossRevenue: parseFloat(grossRevenue) || 0,
            netProfit: parseFloat(netProfit) || 0,
            totalExpenses: parseFloat(totalExpenses) || 0,
            realNet: parseFloat(realNet) || 0,
            salesCount: parseInt(salesCount) || 0,
            stockMovementsCount: parseInt(stockMovementsCount) || 0,
            stockSnapshot: stockSnapshot || []
        };

        db.monthlyClosings.push(closing);
        await saveDb(db);

        res.json({ success: true, closing });
    } catch (error) {
        console.error("Erro ao registrar fechamento mensal:", error);
        res.status(500).json({ error: "Erro ao registrar fechamento" });
    }
});

// Endpoint genérico e atômico para mutações do Frontend
app.post('/api/mutate', async (req, res) => {
    await withDbLock(async () => {
        try {
            const { collection, action, payload, id } = req.body;
            const db = await readDb();
            
            if (!db[collection]) {
                db[collection] = [];
            }
            
            if (action === 'add') {
                db[collection].push(payload);
                
                // Extra logic for manual sales
                if (collection === 'sales' && payload.status !== 'Cancelado') {
                    const productId = payload.productId;
                    const quantity = payload.quantity || 1;
                    
                    const product = db.products?.find(p => p.id === productId || (p.externalIds && p.externalIds.includes(productId)));
                    if (product) {
                        if (product.stock !== undefined) {
                            product.stock = Math.max(0, product.stock - quantity);
                        }
                        
                        if (product.type === '3d' && product.weight && product.filamentId) {
                            const totalWeight = product.weight * quantity;
                            const filament = db.filaments?.find(f => f.id === product.filamentId);
                            if (filament) {
                                filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - totalWeight).toFixed(1)));
                            }
                        }
                    }
                }
            } else if (action === 'update') {
                db[collection] = db[collection].map(item => item.id === id ? { ...item, ...payload } : item);
            } else if (action === 'delete') {
                db[collection] = db[collection].filter(item => item.id !== id);
            }

            // Exceção de cancelamento de venda (muda status e devolve/retira estoque)
            if (action === 'toggleCancel' && collection === 'sales') {
                db.sales = db.sales.map(s => {
                    if (s.id === id) {
                        const newStatus = s.status === 'Cancelado' ? 'Pago' : 'Cancelado';
                        const product = db.products?.find(p => p.id === s.productId || (p.externalIds && p.externalIds.includes(s.productId)));
                        
                        if (product) {
                            const qty = s.quantity || 1;
                            if (newStatus === 'Cancelado') {
                                // Devolver ao estoque
                                if (product.stock !== undefined) product.stock += qty;
                                if (product.type === '3d' && product.weight && product.filamentId) {
                                    const filament = db.filaments?.find(f => f.id === product.filamentId);
                                    if (filament) filament.currentWeight = parseFloat((filament.currentWeight + (product.weight * qty)).toFixed(1));
                                }
                            } else {
                                // Retirar do estoque novamente
                                if (product.stock !== undefined) product.stock = Math.max(0, product.stock - qty);
                                if (product.type === '3d' && product.weight && product.filamentId) {
                                    const filament = db.filaments?.find(f => f.id === product.filamentId);
                                    if (filament) filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - (product.weight * qty)).toFixed(1)));
                                }
                            }
                        }
                        return { ...s, status: newStatus };
                    }
                    return s;
                });
            }
            if (action === 'toggleStatus' && collection === 'expenses') {
                db.expenses = db.expenses.map(e => e.id === id ? { ...e, status: e.status === 'Pago' ? 'Pendente' : 'Pago' } : e);
            }

            await saveDb(db);
            res.json({ success: true });
        } catch (e) {
            console.error("Erro no /api/mutate:", e);
            res.status(500).json({ error: "Erro interno no servidor" });
        }
    });
});

// Endpoint para ler dados
app.get('/api/data', async (req, res) => {
    try {
        const data = await readDb();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler banco de dados local:", error);
        res.status(500).json({ error: "Erro ao ler banco de dados" });
    }
});


// Endpoint para salvar dados
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body;
        const currentData = await readDb();
        
        // Mesclar chaves individuais de credenciais para preservar tokens de acesso confidenciais
        const mergedCredentials = { ...currentData.credentials };
        if (newData.credentials) {
            for (const key of Object.keys(newData.credentials)) {
                const newAcc = newData.credentials[key];
                const currAcc = currentData.credentials[key] || {};
                
                mergedCredentials[key] = {
                    ...currAcc,
                    ...newAcc,
                    accessToken: newAcc.accessToken || currAcc.accessToken,
                    refreshToken: newAcc.refreshToken || currAcc.refreshToken,
                    tokenExpiresAt: newAcc.tokenExpiresAt || currAcc.tokenExpiresAt,
                    userId: newAcc.userId || currAcc.userId,
                    status: newAcc.accessToken || currAcc.accessToken || currAcc.accessToken ? 'Autorizado' : (newAcc.status || currAcc.status || 'Não Sincronizado')
                };
            }
        }

        // Mescla segura de vendas (evita apagar vendas que o Auto-Sync inseriu enquanto o usuário estava editando a tela)
        const mergedSales = [];
        const incomingSalesMap = new Map((newData.sales || []).map(s => [s.id, s]));
        
        if (currentData.sales) {
            for (const s of currentData.sales) {
                if (incomingSalesMap.has(s.id)) {
                    mergedSales.push(incomingSalesMap.get(s.id));
                    incomingSalesMap.delete(s.id);
                } else {
                    mergedSales.push(s); // Venda foi adicionada pelo servidor, manter!
                }
            }
        }
        for (const [id, s] of incomingSalesMap.entries()) {
            mergedSales.push(s); // Novas vendas manuais
        }
        mergedSales.sort((a, b) => new Date(b.date) - new Date(a.date));
        let mergedProducts = (newData.products && newData.products.length > 0) ? newData.products : currentData.products;
        
        const mergedFilaments = (newData.filaments && newData.filaments.length > 0) ? newData.filaments : currentData.filaments;
        const mergedSuppliers = (newData.suppliers && newData.suppliers.length > 0) ? newData.suppliers : currentData.suppliers;
        const mergedExpenses = (newData.expenses && newData.expenses.length > 0) ? newData.expenses : currentData.expenses;

        // Validar bloqueio de fechamento mensal
        const closedMonths = (currentData.monthlyClosings || []).map(c => c.month);
        
        if (closedMonths.length > 0) {
            // Validar vendas
            if (newData.sales) {
                // 1. Verificar se alguma venda de mês fechado foi deletada
                const currentClosedSales = currentData.sales.filter(s => closedMonths.includes(s.date.substring(0, 7)));
                for (const sale of currentClosedSales) {
                    const exists = mergedSales.find(s => s.id === sale.id);
                    if (!exists) {
                        return res.status(400).json({ error: `Operação inválida: A venda #${sale.id} pertence a um mês já fechado (${sale.date.substring(0, 7)}) e não pode ser excluída.` });
                    }
                }
                // 2. Verificar se alguma venda de mês fechado foi alterada ou criada retroativamente
                for (const sale of mergedSales) {
                    const saleMonth = sale.date.substring(0, 7);
                    if (closedMonths.includes(saleMonth)) {
                        const original = currentData.sales.find(s => s.id === sale.id);
                        if (!original) {
                            return res.status(400).json({ error: `Operação inválida: Não é permitido criar vendas retroativas para o mês fechado ${saleMonth}.` });
                        }
                        // Verificar se houve alteração nos campos críticos
                        if (original.grossValue !== sale.grossValue || 
                            original.quantity !== sale.quantity || 
                            original.productId !== sale.productId || 
                            original.shipping !== sale.shipping ||
                            original.status !== sale.status) {
                            return res.status(400).json({ error: `Operação inválida: A venda #${sale.id} pertence a um mês fechado (${saleMonth}) e não pode ser modificada.` });
                        }
                    }
                }
            }

            // Validar despesas
            if (newData.expenses) {
                // 1. Verificar se alguma despesa de mês fechado foi deletada
                const currentClosedExpenses = currentData.expenses.filter(e => closedMonths.includes(e.competency));
                for (const exp of currentClosedExpenses) {
                    const exists = mergedExpenses.find(e => e.id === exp.id);
                    if (!exists) {
                        return res.status(400).json({ error: `Operação inválida: A despesa #${exp.id} pertence a um mês já fechado (${exp.competency}) e não pode ser excluída.` });
                    }
                }
                // 2. Verificar se alguma despesa de mês fechado foi alterada ou criada retroativamente
                for (const exp of mergedExpenses) {
                    const expMonth = exp.competency;
                    if (closedMonths.includes(expMonth)) {
                        const original = currentData.expenses.find(e => e.id === exp.id);
                        if (!original) {
                            return res.status(400).json({ error: `Operação inválida: Não é permitido criar despesas retroativas para o mês fechado ${expMonth}.` });
                        }
                        // Verificar se houve alteração crítica
                        if (original.value !== exp.value || 
                            original.status !== exp.status || 
                            original.name !== exp.name) {
                            return res.status(400).json({ error: `Operação inválida: A despesa #${exp.id} pertence a um mês fechado (${expMonth}) e não pode ser modificada.` });
                        }
                    }
                }
            }
        }


        const mergedData = {
            ...currentData,
            ...newData,
            sales: mergedSales,
            products: mergedProducts,
            filaments: mergedFilaments,
            suppliers: mergedSuppliers,
            expenses: mergedExpenses,
            credentials: mergedCredentials,
            users: newData.users || currentData.users,
            integrationLogs: currentData.integrationLogs || [], // Logs são gerenciados apenas pelo servidor
            transactions: currentData.transactions || [] // Transações mantidas do servidor
        };
        
        await saveDb(mergedData);
        res.json({ success: true, message: "Dados persistidos no banco de dados local com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar banco de dados local:", error);
        res.status(500).json({ error: "Erro ao salvar banco de dados" });
    }
});

// Helper para renovar o Access Token do Mercado Livre
async function getValidAccessToken(accountKey, db) {
    const creds = db.credentials[accountKey];
    if (!creds || !creds.accessToken || !creds.refreshToken) {
        return null;
    }
    
    // Se expirar em menos de 5 minutos, atualiza
    if (creds.tokenExpiresAt && Date.now() < creds.tokenExpiresAt - 300000) {
        return creds.accessToken;
    }
    
    console.log(`[ML] Atualizando token expirado para a conta ${accountKey}...`);
    try {
        const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', creds.clientId);
        params.append('client_secret', creds.clientSecret);
        params.append('refresh_token', creds.refreshToken);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        
        if (response.ok) {
            const tokenData = await response.json();
            creds.accessToken = tokenData.access_token;
            creds.refreshToken = tokenData.refresh_token;
            creds.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
            creds.status = 'Autorizado';
            await saveDb(db);
            return creds.accessToken;
        } else {
            const errText = await response.text();
            console.error(`[ML] Erro ao atualizar token da conta ${accountKey}:`, errText);
            creds.status = 'Erro de Autenticação';
            await saveDb(db);
            return null;
        }
    } catch (error) {
        console.error(`[ML] Falha de conexão ao atualizar token da conta ${accountKey}:`, error);
        return null;
    }
}

// Endpoint Webhook Genérico/Simulado para Mercado Livre e Shopee (atualizado para dados reais do ML)
app.post('/api/webhooks/:provider', async (req, res) => {
    const { provider } = req.params;
    const payload = req.body;
    
    console.log(`[WEBHOOK] Notificação recebida de ${provider}:`, payload);
    
    // Se for notificação do Mercado Livre de outros tópicos, ignoramos (agora suporta items)
    if (provider === 'mercadolivre' && payload.topic && !['orders', 'created_orders', 'items'].includes(payload.topic)) {
        console.log(`[WEBHOOK] Ignorando notificação do tópico "${payload.topic}" do Mercado Livre (não suportado).`);
        return res.json({ success: true, message: `Tópico "${payload.topic}" ignorado.` });
    }

    // Identificação precoce do ID para a trava de concorrência
    let orderIdCandidate = null;
    if (provider === 'mercadolivre') {
        if (payload.resource && (payload.topic === 'orders' || payload.topic === 'items')) {
            orderIdCandidate = payload.resource.split('/').pop();
        } else {
            orderIdCandidate = payload.order_id || payload.order_sn || null;
        }
    } else if (provider === 'site') {
        orderIdCandidate = payload.name || (payload.id ? String(payload.id) : null);
    } else {
        orderIdCandidate = payload.order_id || payload.order_sn || null;
    }

    // Trava de Concorrência
    if (orderIdCandidate) {
        if (activeLocks.has(orderIdCandidate)) {
            console.log(`[WEBHOOK] Evitando processamento duplicado concorrente para o pedido #${orderIdCandidate}`);
            return res.json({ success: true, message: `Pedido #${orderIdCandidate} já está sendo processado.` });
        }
        activeLocks.add(orderIdCandidate);
    }

    try {
        const db = await readDb();
        const todayStr = new Date().toISOString().split('T')[0];

        // Processamento específico para atualização de Anúncios/Estoque do ML
        if (provider === 'mercadolivre' && payload.resource && payload.topic === 'items') {
            const mlbId = payload.resource.split('/').pop();
            const mlUserId = String(payload.user_id);
            
            // Identifica qual conta do ML
            let accountKey = 'mercadolivre';
            if (db.credentials.mercadolivre2 && String(db.credentials.mercadolivre2.userId) === mlUserId) {
                accountKey = 'mercadolivre2';
            }
            
            const accessToken = await getValidAccessToken(accountKey, db);
            if (!accessToken) {
                console.log(`[WEBHOOK-ITEMS] Ignorando ${mlbId}: Token inválido.`);
                return res.json({ success: true, message: 'Token de acesso inválido/não configurado.' });
            }

            // Buscar dados do item na API (Não bloqueia por PolicyAgent, pois é 1 item específico)
            const itemRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}?attributes=id,title,price,available_quantity,pictures,seller_custom_field`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!itemRes.ok) {
                console.error(`[WEBHOOK-ITEMS] Erro ao buscar item ${mlbId}:`, await itemRes.text());
                return res.status(500).json({ error: 'Falha ao consultar API do ML para este item.' });
            }

            const itemData = await itemRes.json();
            const localProductIndex = db.products.findIndex(p => p.id === mlbId || (p.externalIds && p.externalIds.includes(mlbId)));
            let logMsg = '';

            if (localProductIndex >= 0) {
                const existingProduct = db.products[localProductIndex];
                
                // Regra: Atualiza estoque via ML apenas para produtos finais (resale)
                if (existingProduct.type === 'resale') {
                    const oldStock = existingProduct.stock || 0;
                    existingProduct.stock = itemData.available_quantity;
                    existingProduct.price = itemData.price;
                    
                    if (oldStock !== itemData.available_quantity) {
                        logMsg = `[WEBHOOK] Estoque do produto final "${itemData.title}" atualizado via ML: de ${oldStock} para ${itemData.available_quantity}.`;
                    } else {
                        logMsg = `[WEBHOOK] Produto final "${itemData.title}" verificado (Sem mudança de estoque).`;
                    }
                } else {
                    logMsg = `[WEBHOOK] Ignorando atualização de estoque para o produto impresso 3D "${existingProduct.name}" (ML: ${mlbId}).`;
                }
            } else {
                // Cria novo produto final (resale)
                const sku = itemData.seller_custom_field || '';
                const imageUrl = (itemData.pictures && itemData.pictures.length > 0) ? itemData.pictures[0].secure_url : '';
                
                db.products.push({
                    id: mlbId,
                    name: itemData.title,
                    type: 'resale',
                    stock: itemData.available_quantity,
                    price: itemData.price,
                    acquisitionCost: 0,
                    imageUrl,
                    externalIds: [mlbId],
                    sku
                });
                logMsg = `[WEBHOOK] Novo anúncio detectado no ML e cadastrado automaticamente como Produto Final: "${itemData.title}" com estoque ${itemData.available_quantity}.`;
            }

            // Registra no log do sistema
            db.integrationLogs = db.integrationLogs || [];
            db.integrationLogs.push({
                id: `log_webhook_item_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                type: 'info',
                message: logMsg
            });

            await saveDb(db);
            console.log(logMsg);
            
            return res.json({ success: true, message: 'Item processado com sucesso.' });
        }
        
        let orderId;
        let channelId;
        let productId;
        let productName;
        let quantity;
        let grossValue;
        let shipping;
        let buyer;
        let isRealMLOrder = false;
        let saleDate = new Date().toISOString();

        // Trata webhook oficial do Mercado Livre
        if (provider === 'mercadolivre' && payload.resource && payload.topic === 'orders') {
            isRealMLOrder = true;
            const resourceId = payload.resource.split('/').pop();
            const mlUserId = String(payload.user_id);
            
            // Identifica qual conta do Mercado Livre disparou
            let accountKey = 'mercadolivre';
            channelId = 'ml1'; // Printou Hub Premium
            
            if (db.credentials.mercadolivre2 && String(db.credentials.mercadolivre2.userId) === mlUserId) {
                accountKey = 'mercadolivre2';
                channelId = 'ml2'; // Alucar Premium
            } else if (db.credentials.mercadolivre && String(db.credentials.mercadolivre.userId) === mlUserId) {
                accountKey = 'mercadolivre';
                channelId = 'ml1';
            }
            
            const accessToken = await getValidAccessToken(accountKey, db);
            if (!accessToken) {
                throw new Error(`Não foi possível obter Token de Acesso válido para a conta ${accountKey}.`);
            }
            
            // Busca detalhes da venda na API do Mercado Livre
            const orderRes = await fetch(`https://api.mercadolibre.com/orders/${resourceId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!orderRes.ok) {
                const errText = await orderRes.text();
                throw new Error(`Erro ao buscar pedido ${resourceId} na API do ML: ${errText}`);
            }
            
            const orderData = await orderRes.json();
            saleDate = orderData.date_closed || orderData.date_created || saleDate;
            orderId = String(orderData.id);
            buyer = `${orderData.buyer.first_name || ''} ${orderData.buyer.last_name || ''}`.trim() || orderData.buyer.nickname || 'Comprador ML';
            grossValue = orderData.total_amount;
            
            // Busca custos de frete se houver
            shipping = 0.0;
            if (orderData.shipping && orderData.shipping.id) {
                try {
                    const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${orderData.shipping.id}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (shipRes.ok) {
                        const shipData = await shipRes.json();
                        // Se o frete foi grátis para o comprador (custo 0), o custo cobrado do vendedor fica em base_cost ou cost
                        if (orderData.shipping.free_shipping || (shipData.shipping_option && shipData.shipping_option.cost === 0)) {
                            shipping = parseFloat(shipData.base_cost) || parseFloat(shipData.cost) || 0.0;
                        } else if (shipData.shipping_option && shipData.shipping_option.cost !== undefined) {
                            shipping = parseFloat(shipData.shipping_option.cost);
                        }
                    }
                } catch (shipErr) {
                    console.warn("Não foi possível buscar custos de envio detalhados:", shipErr);
                }
            }

            // Fallback para regras do canal cadastradas se o frete for importado como zero
            if (shipping === 0) {
                const chan = db.channels.find(c => c.id === channelId);
                if (chan) {
                    if (chan.hasFreeShippingThreshold) {
                        if (grossValue >= chan.freeShippingThreshold) {
                            shipping = chan.defaultSellerShippingCost || 0.0;
                        } else {
                            shipping = chan.defaultBelowThresholdShippingCost || 0.0;
                        }
                    } else {
                        shipping = chan.defaultSellerShippingCost || 0.0;
                    }
                }
            }
            
            const firstItem = orderData.order_items[0];
            if (firstItem) {
                productId = firstItem.item.id;
                productName = firstItem.item.title;
                quantity = firstItem.quantity;
            } else {
                productId = 'p1';
                productName = 'Produto Mercado Livre';
                quantity = 1;
            }
        } else if (provider === 'site') {
            // Webhook do site próprio (Shopify)
            // Se for Shopify, o ID vem em payload.name (ex: "#1001") ou payload.id
            orderId = payload.name || (payload.id ? String(payload.id) : `shop_${Date.now().toString().slice(-4)}`);
            channelId = 'site';
            
            const firstItem = payload.line_items && payload.line_items[0];
            if (firstItem) {
                productId = String(firstItem.variant_id || firstItem.product_id || 'p3');
                productName = firstItem.name || firstItem.title || 'Produto Site';
                quantity = parseInt(firstItem.quantity) || 1;
            } else {
                productId = payload.productId || 'p3';
                productName = payload.productName || 'Produto Shopify';
                quantity = parseInt(payload.quantity) || 1;
            }
            
            grossValue = parseFloat(payload.total_price) || parseFloat(payload.grossValue) || 49.90;
            shipping = payload.shipping_lines && payload.shipping_lines[0] ? parseFloat(payload.shipping_lines[0].price) : (parseFloat(payload.shipping) || 0.0);
            
            if (payload.customer) {
                buyer = `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() || 'Cliente Shopify';
            } else {
                buyer = payload.buyer || 'Cliente Shopify';
            }
            saleDate = payload.created_at || saleDate;
        } else {
            // Lógica de simulação antiga/Shopee
            orderId = payload.order_id || payload.order_sn || `int_${Date.now().toString().slice(-4)}`;
            channelId = payload.channelId || (provider === 'mercadolivre' ? 'ml2' : provider === 'shopee' ? 'shopee' : 'site');
            productId = payload.productId || 'p1';
            productName = payload.productName || `Produto Simulado ${productId}`;
            quantity = parseInt(payload.quantity) || 1;
            grossValue = parseFloat(payload.grossValue) || 49.90;
            shipping = parseFloat(payload.shipping) || 0.0;
            buyer = payload.buyer || 'Cliente Integrado';
            saleDate = payload.date || saleDate;
        }
        
        // Evita duplicar venda
        const saleExists = db.sales.find(s => s.id === orderId);
        if (saleExists) {
            // Atualiza a data com hora se a venda antiga só tinha o dia YYYY-MM-DD
            if (saleExists.date && saleExists.date.length <= 10 && saleDate && saleDate.length > 10) {
                saleExists.date = saleDate;
                await saveDb(db);
                return res.json({ success: true, message: `Pedido #${orderId} atualizado com data e hora detalhadas.` });
            }
            return res.json({ success: true, message: `Pedido #${orderId} já processado anteriormente.` });
        }

        // Adiciona log de recebimento
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString().slice(-3)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'info',
            message: `⚡ Webhook [${provider.toUpperCase()}] recebido. Pedido #${orderId} de ${buyer}.`
        };
        
        // Busca produto correspondente no estoque para baixa
        let product = db.products.find(p => p.id === productId || p.name.toLowerCase() === productName.toLowerCase());
        let deductionLogs = [];
        
        if (product) {
            logEntry.message += ` Processando produto: "${product.name}".`;
            
            // Baixa de estoque físico para todos os produtos
            if (product.stock !== undefined) {
                const oldStock = product.stock;
                product.stock = Math.max(0, product.stock - quantity);
                if (oldStock !== product.stock) {
                    deductionLogs.push(`📦 Estoque atualizado: -${quantity} un de "${product.name}" (Restam ${product.stock} un).`);
                }
            }

            if (product.type === '3d' && product.weight && product.filamentId) {
                const totalWeight = product.weight * quantity;
                const filament = db.filaments.find(f => f.id === product.filamentId);
                
                if (filament) {
                    filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - totalWeight).toFixed(1)));
                    deductionLogs.push(`📉 Baixa automática de estoque: Descontados ${totalWeight}g do filamento "${filament.name}". Restante: ${filament.currentWeight}g.`);
                    
                    // Alerta de estoque crítico
                    if (filament.currentWeight <= filament.alertThreshold) {
                        deductionLogs.push(`⚠️ ALERTA: O filamento "${filament.name}" atingiu o nível crítico (${filament.currentWeight}g)!`);
                    }
                }
            } else if (product.type === 'resale') {
                deductionLogs.push(`📦 Produto de revenda. Processamento automático de baixa de unidades realizado.`);
            }
        } else {
            // Importar provisoriamente se não existir no catálogo
            const guessedType = productName.toLowerCase().includes('filamento') || productName.toLowerCase().includes('bico') ? 'resale' : '3d';
            product = {
                id: productId,
                name: productName,
                type: guessedType,
                weight: guessedType === '3d' ? 100 : 0,
                printTime: guessedType === '3d' ? 5.0 : 0,
                filamentCost: 95.00,
                machineHourCost: 2.00,
                finishingCost: 2.00,
                packagingCost: 2.50,
                failRate: 10,
                acquisitionCost: guessedType === 'resale' ? grossValue * 0.5 : 0,
                isPendingConfig: true,
                filamentId: guessedType === '3d' ? (db.filaments[0]?.id || 'fil1') : undefined
            };
            db.products.push(product);
            deductionLogs.push(`🆕 Produto desconhecido "${product.name}" importado automaticamente.`);
        }
        
        // Registrar a venda no caixa
        const newSale = {
            id: orderId,
            date: saleDate,
            channelId,
            productId: product.id,
            quantity,
            grossValue,
            shipping,
            status: 'Pago'
        };
        db.sales.unshift(newSale); // Mais novo primeiro
        
        // Escreve os logs finais
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `${logEntry.id}_main`,
            timestamp: logEntry.timestamp,
            type: 'success',
            message: logEntry.message
        });
        
        deductionLogs.forEach(msg => {
            db.integrationLogs.push({
                id: `${logEntry.id}_deduction_${Math.random()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                type: msg.includes('⚠️') ? 'warning' : 'info',
                message: msg
            });
        });
        
        // Limita a quantidade de logs exibidos para evitar vazamento de memória
        if (db.integrationLogs.length > 50) {
            db.integrationLogs = db.integrationLogs.slice(-50);
        }
        
        await saveDb(db);
        
        res.json({
            success: true,
            message: `Pedido #${orderId} processado com sucesso!`,
            details: {
                orderId,
                saleAdded: newSale,
                logs: [logEntry.message, ...deductionLogs]
            }
        });
    } catch (e) {
        console.error("Erro ao processar webhook:", e);
        res.status(500).json({ error: `Erro ao processar webhook: ${e.message}` });
    } finally {
        if (orderIdCandidate) {
            activeLocks.delete(orderIdCandidate);
        }
    }
});

// Endpoint para limpar os logs de integração
app.post('/api/integration/logs/clear', async (req, res) => {
    try {
        const db = await readDb();
        db.integrationLogs = [];
        await saveDb(db);
        res.json({ success: true, message: "Logs limpos com sucesso!" });
    } catch (e) {
        res.status(500).json({ error: "Erro ao limpar logs" });
    }
});

// =====================================================
// ENDPOINTS DO AGENTE COMERCIAL FACEBOOK & SHOPIFY
// =====================================================

// Obter configurações do Facebook
app.get('/api/facebook/config', async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.credentials.facebook || {});
    } catch (e) {
        res.status(500).json({ error: "Erro ao ler configurações do Facebook" });
    }
});

  // Salvar credenciais do Mercado Livre antes do redirecionamento
  app.post('/api/settings/mercadolivre', async (req, res) => {
      try {
          const { accountKey, clientId, clientSecret } = req.body;
          const db = await readDb();
          if (!db.credentials) db.credentials = {};
          if (!db.credentials[accountKey]) db.credentials[accountKey] = {};
          
          db.credentials[accountKey].clientId = clientId;
          db.credentials[accountKey].clientSecret = clientSecret;
          
          await saveDb(db);
          res.json({ success: true });
      } catch (e) {
          console.error(e);
          res.status(500).json({ error: "Erro ao salvar credenciais" });
      }
  });

// Salvar configurações do Facebook
app.post('/api/facebook/config', async (req, res) => {
    try {
        const db = await readDb();
        db.credentials.facebook = {
            ...db.credentials.facebook,
            ...req.body,
            status: req.body.accessToken ? 'Sincronizado' : 'Não Sincronizado'
        };
        await saveDb(db);
        res.json({ success: true, message: "Configurações salvas com sucesso!", config: db.credentials.facebook });
    } catch (e) {
        res.status(500).json({ error: "Erro ao salvar configurações do Facebook" });
    }
});

// Listar produtos do Shopify sincronizados
app.get('/api/facebook/products', async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.shopifyProducts || []);
    } catch (e) {
        res.status(500).json({ error: "Erro ao listar produtos do Shopify" });
    }
});

// Sincronizar produtos da loja Shopify
app.post('/api/facebook/sync-shopify', async (req, res) => {
    try {
        const db = await readDb();
        const siteCreds = db.credentials.site;
        
        if (!siteCreds || !siteCreds.apiSecret) {
            return res.status(400).json({ error: "Token de acesso do Shopify (Site) não configurado nas Integrações." });
        }

        const shopifyToken = siteCreds.apiSecret;
        // Sempre usa o domínio myshopify correto
        const shopUrl = `https://printoustudio3d.myshopify.com/admin/api/2024-01/products.json?limit=50`;

        console.log(`[SHOPIFY-SYNC] Buscando produtos em printoustudio3d.myshopify.com...`);
        
        const response = await fetch(shopUrl, {
            headers: {
                'X-Shopify-Access-Token': shopifyToken,
                'User-Agent': 'PrintouSalesHub (contato@printou.com)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Erro na API do Shopify (Status ${response.status}): ${errText}`);
        }

        const data = await response.json();
        db.shopifyProducts = db.shopifyProducts || [];
        
        let newCount = 0;
        let updatedCount = 0;

        if (data.products) {
            data.products.forEach(p => {
                const price = parseFloat(p.variants?.[0]?.price) || 0.0;
                const imageUrl = p.images?.[0]?.src || '';
                const inventory = parseInt(p.variants?.[0]?.inventory_quantity) || 0;
                const externalId = `shopify_${p.id}`;

                const existingIndex = db.shopifyProducts.findIndex(sp => sp.id === externalId);
                
                if (existingIndex >= 0) {
                    // Atualiza
                    db.shopifyProducts[existingIndex] = {
                        ...db.shopifyProducts[existingIndex],
                        title: p.title,
                        description: p.body_html || '',
                        price,
                        imageUrl,
                        inventoryQuantity: inventory,
                        handle: p.handle
                    };
                    updatedCount++;
                } else {
                    // Insere novo
                    db.shopifyProducts.push({
                        id: externalId,
                        title: p.title,
                        description: p.body_html || '',
                        price,
                        imageUrl,
                        inventoryQuantity: inventory,
                        handle: p.handle,
                        facebookPublished: false,
                        facebookId: ''
                    });
                    newCount++;
                }
            });
        }

        // Registra log de integração
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `log_shopify_sync_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'success',
            message: `🛒 [SHOPIFY] Catálogo sincronizado: ${newCount} novos produtos importados, ${updatedCount} atualizados.`
        });

        await saveDb(db);
        res.json({ success: true, message: "Sincronização concluída!", imported: newCount, updated: updatedCount });
    } catch (err) {
        console.error("[SHOPIFY-SYNC] Falha ao sincronizar:", err);
        res.status(500).json({ error: `Erro na sincronização: ${err.message}` });
    }
});

// Salvar produtos sincronizados diretamente pelo navegador (Fallback Sem Chaves)
app.post('/api/facebook/save-shopify-products', async (req, res) => {
    try {
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Lista de produtos inválida." });
        }

        const db = await readDb();
        db.shopifyProducts = db.shopifyProducts || [];

        let newCount = 0;
        let updatedCount = 0;

        products.forEach(p => {
            const price = parseFloat(p.variants?.[0]?.price) || 0.0;
            const imageUrl = p.images?.[0]?.src || p.image?.src || '';
            const inventory = parseInt(p.variants?.[0]?.inventory_quantity) || 10; // Fallback se não exposto publicamente
            const externalId = `shopify_${p.id}`;

            const existingIndex = db.shopifyProducts.findIndex(sp => sp.id === externalId);

            if (existingIndex >= 0) {
                db.shopifyProducts[existingIndex] = {
                    ...db.shopifyProducts[existingIndex],
                    title: p.title,
                    description: p.body_html || '',
                    price,
                    imageUrl,
                    inventoryQuantity: inventory,
                    handle: p.handle
                };
                updatedCount++;
            } else {
                db.shopifyProducts.push({
                    id: externalId,
                    title: p.title,
                    description: p.body_html || '',
                    price,
                    imageUrl,
                    inventoryQuantity: inventory,
                    handle: p.handle,
                    facebookPublished: false,
                    facebookId: ''
                });
                newCount++;
            }
        });

        // Registrar log de integração
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `log_shopify_sync_browser_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'success',
            message: `🛒 [SHOPIFY-NAVEGADOR] Sincronização direta concluída: ${newCount} novos produtos importados, ${updatedCount} atualizados.`
        });

        await saveDb(db);
        res.json({ success: true, message: "Sincronização via navegador salva com sucesso!", imported: newCount, updated: updatedCount });
    } catch (e) {
        console.error("[FB-SYNC-BROWSER] Erro ao salvar produtos do site:", e);
        res.status(500).json({ error: `Erro ao salvar produtos do site: ${e.message}` });
    }
});

// Excluir um produto do catálogo local
app.delete('/api/facebook/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await readDb();
        const initialLength = (db.shopifyProducts || []).length;
        db.shopifyProducts = (db.shopifyProducts || []).filter(p => p.id !== id);
        
        if (db.shopifyProducts.length === initialLength) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }
        
        await saveDb(db);
        res.json({ success: true, message: "Produto removido com sucesso!" });
    } catch (e) {
        console.error("[FB-DELETE-PRODUCT] Erro ao deletar:", e);
        res.status(500).json({ error: `Erro ao deletar produto: ${e.message}` });
    }
});

// Endpoint do Feed de Catálogo do Facebook (CSV para Sincronização sem Token)
app.get('/api/facebook/catalog.csv', async (req, res) => {
    try {
        const db = await readDb();
        const products = db.shopifyProducts || [];
        
        let csv = 'id,title,description,availability,condition,price,link,image_link,brand\n';
        
        products.forEach(p => {
            const id = p.id;
            // Limpa quebras de linha e aspas no título
            const title = `"${p.title.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
            // Remove tags HTML e formata a descrição
            const cleanDesc = p.description ? p.description.replace(/<[^>]*>/g, '').replace(/\r?\n|\r/g, ' ') : 'Sem descrição';
            const description = `"${cleanDesc.replace(/"/g, '""').substring(0, 1000)}"`;
            const availability = p.inventoryQuantity > 0 ? 'in stock' : 'out of stock';
            const condition = 'new';
            const price = `${Number(p.price).toFixed(2)} BRL`;
            const link = `https://printoustudio3d.com/products/${p.handle || ''}`;
            const image_link = p.imageUrl || 'https://printoustudio3d.com/assets/no-image.png';
            const brand = 'PrintouStudio3D';
            
            csv += `${id},${title},${description},${availability},${condition},${price},${link},${image_link},${brand}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=catalog.csv');
        res.send(csv);
    } catch (e) {
        console.error("[FB-CSV-CATALOG] Erro ao gerar catalog.csv:", e);
        res.status(500).send("Erro ao gerar catálogo.");
    }
});

// Publicar produto no Facebook Marketplace/Catálogo
app.post('/api/facebook/publish', async (req, res) => {
    const { productId } = req.body;
    try {
        const db = await readDb();
        const fbCreds = db.credentials.facebook;
        const prod = (db.shopifyProducts || []).find(p => p.id === productId);

        if (!prod) {
            return res.status(404).json({ error: "Produto do Shopify não encontrado." });
        }

        db.integrationLogs = db.integrationLogs || [];

        // Lógica de Sincronização Real vs Simulação
        if (fbCreds && fbCreds.accessToken && fbCreds.catalogId) {
            // Cenário Real: Enviar para API do Meta Catalog
            console.log(`[FB-CATALOG] Publicando produto ${prod.title} no catálogo ${fbCreds.catalogId}...`);
            
            const batchUrl = `https://graph.facebook.com/v18.0/${fbCreds.catalogId}/batch`;
            const payload = {
                requests: [
                    {
                        method: 'CREATE',
                        retailer_id: prod.id,
                        data: {
                            title: prod.title,
                            description: prod.description.substring(0, 1000) || prod.title,
                            image_link: prod.imageUrl || 'https://printoustudio3d.com/assets/no-image.png',
                            link: `https://printoustudio3d.com/products/${prod.handle}`,
                            brand: 'Printou3D',
                            price: Math.round(prod.price * 100), // Em centavos na API do Facebook
                            currency: 'BRL',
                            availability: prod.inventoryQuantity > 0 ? 'in stock' : 'out of stock',
                            condition: 'new'
                        }
                    }
                ]
            };

            const response = await fetch(batchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${fbCreds.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                prod.facebookPublished = true;
                prod.facebookId = `fb_item_${Date.now()}`;
                
                db.integrationLogs.push({
                    id: `log_fb_pub_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    type: 'success',
                    message: `📢 [FACEBOOK] Anúncio publicado no Marketplace para o item "${prod.title}".`
                });
                
                await saveDb(db);
                return res.json({ success: true, message: "Produto publicado no Facebook com sucesso!", published: true });
            } else {
                const errText = await response.text();
                throw new Error(`Erro na API do Facebook: ${errText}`);
            }
        } else {
            // Cenário de Simulação (para testes rápidos enquanto aprova chaves)
            console.log(`[FB-SIMULATION] Simulando publicação do produto ${prod.title}...`);
            prod.facebookPublished = true;
            prod.facebookId = `fb_sim_${Math.random().toString(36).slice(2, 9)}`;

            db.integrationLogs.push({
                id: `log_fb_pub_sim_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                type: 'success',
                message: `📢 [FACEBOOK (SIMULADO)] Anúncio de teste publicado no Marketplace: "${prod.title}" — R$ ${prod.price.toFixed(2)}.`
            });

            // Adiciona mensagens simuladas desse produto para o chat inteligente
            db.facebookMessages = db.facebookMessages || [];
            
            const buyers = ['Gabriel Silva', 'Beatriz Costa', 'Marcos Oliveira'];
            const questions = [
                'Está disponível? Entrega em quanto tempo?',
                'Qual o preço final e tem outras cores?',
                'Aceita Pix? Consegue enviar hoje?'
            ];
            const randomIndex = Math.floor(Math.random() * buyers.length);

            db.facebookMessages.push({
                id: `msg_${Date.now()}`,
                buyerName: buyers[randomIndex],
                productTitle: prod.title,
                productUrl: `https://printoustudio3d.com/products/${prod.handle}`,
                messageText: questions[randomIndex],
                timestamp: new Date().toLocaleTimeString('pt-BR').substring(0, 5),
                replied: false,
                replyText: ''
            });

            await saveDb(db);
            return res.json({ 
                success: true, 
                message: "Produto publicado com sucesso! (Modo Simulado ativado. Nova pergunta recebida no chat!)", 
                published: true, 
                simulated: true 
            });
        }
    } catch (err) {
        console.error("[FB-PUBLISH] Erro ao publicar anúncio:", err);
        res.status(500).json({ error: `Erro ao publicar no Facebook: ${err.message}` });
    }
});

// Listar mensagens recebidas no Facebook Marketplace
app.get('/api/facebook/messages', async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.facebookMessages || []);
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar mensagens do Facebook" });
    }
});

// Responder mensagem no chat do Facebook Marketplace (Auto ou Manual)
app.post('/api/facebook/messages/reply', async (req, res) => {
    const { messageId, replyText } = req.body;
    try {
        const db = await readDb();
        db.facebookMessages = db.facebookMessages || [];
        const msg = db.facebookMessages.find(m => m.id === messageId);

        if (!msg) {
            return res.status(404).json({ error: "Mensagem não encontrada." });
        }

        msg.replied = true;
        msg.replyText = replyText;

        // Log da resposta
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `log_fb_reply_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'info',
            message: `💬 [MESSENGER] Resposta enviada para ${msg.buyerName}: "${replyText.substring(0, 40)}..."`
        });

        await saveDb(db);
        res.json({ success: true, message: "Resposta enviada com sucesso!", messageObj: msg });
    } catch (e) {
        res.status(500).json({ error: "Erro ao enviar resposta" });
    }
});

// Endpoint para zerar todos os dados do banco (preservando credenciais e canais)
app.post('/api/data/reset', async (req, res) => {
    try {
        const db = await readDb();
        db.sales = [];
        db.expenses = [];
        db.products = [];
        db.filaments = [];
        db.suppliers = [];
        db.integrationLogs = [];
        await saveDb(db);
        res.json({ success: true, message: "Sistema resetado com sucesso! Pronto para uso real." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao resetar dados do sistema" });
    }
});

// --- ROTAS DO CAIXA E BANCOS (NOVO) ---
app.post('/api/transactions', async (req, res) => {
    try {
        const { date, description, type, amount, accountId, category } = req.body;
        if (!date || !description || !type || !amount || !accountId) {
            return res.status(400).json({ error: "Faltam campos obrigatórios." });
        }
        const db = await readDb();
        
        const newTransaction = {
            id: Date.now().toString(),
            date, description, type, amount: parseFloat(amount), accountId, category: category || 'Outros'
        };
        
        db.transactions.unshift(newTransaction);
        await saveDb(db);
        res.json({ success: true, transaction: newTransaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar transação." });
    }
});

app.post('/api/transactions/transfer', async (req, res) => {
    try {
        const { date, amount, fromAccount, toAccount } = req.body;
        if (!date || !amount || !fromAccount || !toAccount) {
            return res.status(400).json({ error: "Faltam campos obrigatórios para transferência." });
        }
        const db = await readDb();
        
        const timestamp = Date.now().toString();
        
        const txOut = {
            id: timestamp + '-out',
            date,
            description: `Transferência enviada para ${db.accounts.find(a => a.id === toAccount)?.name || toAccount}`,
            type: 'OUT',
            amount: parseFloat(amount),
            accountId: fromAccount,
            category: 'Transferência'
        };
        
        const txIn = {
            id: timestamp + '-in',
            date,
            description: `Transferência recebida de ${db.accounts.find(a => a.id === fromAccount)?.name || fromAccount}`,
            type: 'IN',
            amount: parseFloat(amount),
            accountId: toAccount,
            category: 'Transferência'
        };
        
        db.transactions.unshift(txOut);
        db.transactions.unshift(txIn);
        await saveDb(db);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar transferência." });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { date, description, amount, accountId, category } = req.body;
        if (!date || !description || amount === undefined || !accountId) {
            return res.status(400).json({ error: "Faltam campos obrigatórios." });
        }
        const db = await readDb();
        const idx = db.transactions.findIndex(t => t.id === req.params.id);
        if (idx === -1) {
            return res.status(404).json({ error: "Transação não encontrada." });
        }
        db.transactions[idx] = {
            ...db.transactions[idx],
            date,
            description,
            amount: parseFloat(amount),
            accountId,
            category: category || 'Outros'
        };
        await saveDb(db);
        res.json({ success: true, transaction: db.transactions[idx] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar transação." });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const db = await readDb();
        const initialLen = db.transactions.length;
        db.transactions = db.transactions.filter(t => t.id !== req.params.id);
        if (db.transactions.length === initialLen) {
            return res.status(404).json({ error: "Transação não encontrada." });
        }
        await saveDb(db);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao excluir transação." });
    }
});

// --- FIM ROTAS ---

// Endpoint Callback para OAuth 2.0 do Mercado Livre
app.get('/api/auth/mercadolivre/callback', async (req, res) => {
    const { code, state } = req.query; // state define se é 'ml1' ou 'ml2'
    if (!code) {
        return res.status(400).send("Código de autorização não fornecido");
    }
    
    try {
        const db = await readDb();
        const accountKey = state === 'ml2' ? 'mercadolivre2' : 'mercadolivre';
        const creds = db.credentials[accountKey];
        
        if (!creds || !creds.clientId || !creds.clientSecret) {
            return res.status(400).send("Credenciais do Mercado Livre não configuradas no servidor.");
        }
        
        // Determina a URL de callback dinâmica
        const host = req.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const redirectUri = `${protocol}://${host}/api/auth/mercadolivre/callback`;
        
        const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', creds.clientId);
        params.append('client_secret', creds.clientSecret);
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error("Erro na troca de token:", errText);
            return res.status(400).send(`Erro ao obter token do Mercado Livre: ${errText}`);
        }
        
        const tokenData = await response.json();
        
        // Salva os tokens no banco
        creds.accessToken = tokenData.access_token;
        creds.refreshToken = tokenData.refresh_token;
        creds.userId = String(tokenData.user_id);
        creds.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
        creds.status = 'Autorizado';
        
        await saveDb(db);
        
        // Redireciona de volta para o painel do aplicativo
        res.send(`
            <html>
                <head>
                    <title>Conectado ao Mercado Livre</title>
                    <script>
                        alert("Conta do Mercado Livre vinculada com sucesso!");
                        window.location.href = "/";
                    </script>
                </head>
                <body style="font-family: sans-serif; background-color: #14141b; color: #fff; text-align: center; padding-top: 50px;">
                    <h2>Conexão bem sucedida! Redirecionando...</h2>
                    <script>setTimeout(function(){ window.location.href = "/"; }, 1500);</script>
                </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro interno ao processar autorização");
    }
});

// Endpoint para Autenticação (Login)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const db = await readDb();
        const usersList = db.users || DEFAULT_DB.users;
        const user = usersList.find(u => u.email === email && u.password === password);
        
        if (user) {
            const { password, ...userSession } = user;
            res.json({ success: true, user: userSession });
        } else {
            res.status(401).json({ success: false, error: "E-mail ou senha incorretos!" });
        }
    } catch (e) {
        res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
});

// Endpoint para puxar o estoque de filamentos do Mercado Livre (e imagem)
app.get('/api/sync-ml-stock', async (req, res) => {
    try {
        const db = await readDb();
        
        const accessToken = (await getValidAccessToken('mercadolivre', db)) || (await getValidAccessToken('mercadolivre2', db));
        if (!accessToken) {
            return res.status(400).json({ error: "Mercado Livre não está conectado ou a autorização expirou. Por favor, reconecte na aba Integrações." });
        }
        
        let updatedCount = 0;
        
        // Puxar estoque APENAS para produtos que sejam filamentos (evita atualizar produtos 3D sob demanda)
        const produtosParaAtualizar = (db.products || []).filter(p => {
            const hasMlb = (p.externalIds && p.externalIds.some(id => id.startsWith('MLB'))) || (p.id && p.id.startsWith('MLB'));
            const isFilament = p.name && p.name.toLowerCase().includes('filament');
            return hasMlb && isFilament;
        });
        
        const chunkSize = 20;
        for (let i = 0; i < produtosParaAtualizar.length; i += chunkSize) {
            const chunk = produtosParaAtualizar.slice(i, i + chunkSize);
            const idsStr = chunk.map(p => {
                return (p.externalIds && p.externalIds.find(id => id.startsWith("MLB"))) || p.id;
            }).filter(Boolean).join(",");
            
            if (!idsStr) continue;
            
            try {
                const response = await fetch(`https://api.mercadolibre.com/items?ids=${idsStr}&attributes=id,title,price,pictures,secure_thumbnail,thumbnail,available_quantity,variations`, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                });
                
                if (response.ok) {
                    const itemsData = await response.json();
                    
                    for (const itemRes of itemsData) {
                        if (itemRes.code !== 200 || !itemRes.body) continue;
                        const itemData = itemRes.body;
                        
                        const prod = produtosParaAtualizar.find(p => 
                            (p.externalIds && p.externalIds.includes(itemData.id)) || p.id === itemData.id
                        );
                        if (!prod) continue;
                        
                        let changed = false;
                        
                        // Busca estoque somando todas as variações se existirem, senão pega da raiz
                        let novoEstoque = 0;
                        if (itemData.variations && itemData.variations.length > 0) {
                            novoEstoque = itemData.variations.reduce((acc, v) => acc + (parseInt(v.available_quantity) || 0), 0);
                        } else {
                            novoEstoque = parseInt(itemData.available_quantity) || 0;
                        }
                        
                        if (prod.stock !== novoEstoque) {
                            prod.stock = novoEstoque;
                            changed = true;
                            console.log(`[SYNC-ML-PULL] Atualizado estoque de "${prod.name}" para ${novoEstoque} un.`);
                        }
                        
                        let novaImagem = null;
                        if (itemData.pictures && itemData.pictures.length > 0) {
                            novaImagem = itemData.pictures[0].secure_url || itemData.pictures[0].url;
                        } else if (itemData.secure_thumbnail) {
                            novaImagem = itemData.secure_thumbnail;
                        } else if (itemData.thumbnail) {
                            novaImagem = itemData.thumbnail.replace("-I.jpg", "-O.jpg");
                        }
                        
                        if (novaImagem && prod.image !== novaImagem) {
                            prod.image = novaImagem;
                            changed = true;
                            console.log(`[SYNC-ML-PULL] Atualizada imagem de "${prod.name}".`);
                        }
                        
                        if (changed) {
                            updatedCount++;
                        }
                    }
                }
            } catch (err) {
                console.error(`[SYNC-ML-PULL] Erro ao consultar ${mlbId}:`, err.message);
            }
        }
        
        // Limpa produtos antigos (PRD-) e não-filamentos importados para manter o estoque limpo
        const originalCount = db.products.length;
        db.products = db.products.filter(p => {
            const hasMlb = (p.externalIds && p.externalIds.some(id => id.startsWith('MLB'))) || (p.id && p.id.startsWith('MLB'));
            // Se NÃO tem MLB, é um produto manual ou de outra plataforma. Mantém no banco!
            if (!hasMlb) return true;
            // Se TEM MLB, mantém apenas se for filamento
            return p.name && p.name.toLowerCase().includes('filament');
        });
        
        if (updatedCount > 0 || db.products.length !== originalCount) {
            await saveDb(db);
        }
        
        res.json({ success: true, message: `Sincronização concluída! ${updatedCount} filamentos tiveram dados/imagens/estoque atualizados.` });
    } catch (e) {
        console.error("[SYNC-ML-PULL] Erro geral:", e);
        res.status(500).json({ error: "Erro ao sincronizar estoque." });
    }
});

// Endpoint para importar catálogo completo do Mercado Livre
app.get('/api/import-ml-catalog', async (req, res) => {
    try {
        const db = await readDb();
        // Pega o token válido mais provável (já com auto-refresh)
        const accessToken = (await getValidAccessToken('mercadolivre', db)) || (await getValidAccessToken('mercadolivre2', db));
        if (!accessToken) {
            return res.status(400).json({ error: "Mercado Livre não está conectado ou a autorização expirou. Por favor, reconecte na aba Integrações." });
        }
        
        // 1. Descobrir o ID do usuário
        const userRes = await fetch('https://api.mercadolibre.com/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!userRes.ok) {
            const errText = await userRes.text();
            throw new Error(`Falha API ML (users/me): Status ${userRes.status} - ${errText}`);
        }
        const userData = await userRes.json();
        const userId = userData.id;
        
        // 2. Buscar os anúncios do usuário (Apenas Ativos, pois sem isso o ML bloqueia via PolicyAgent)
        // Limite máximo sem paginação bloqueada é 100
        const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=active&limit=100`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!searchRes.ok) {
            const errText = await searchRes.text();
            throw new Error(`Falha API ML (items/search): Status ${searchRes.status} - ${errText}`);
        }
        const searchData = await searchRes.json();
        
        const totalItemsOnML = searchData.paging?.total || 0;
        const mlbIds = searchData.results || [];
        
        if (mlbIds.length === 0) {
            return res.json({ success: true, message: "Nenhum anúncio encontrado no Mercado Livre." });
        }
        
        // 3. Filtrar quais anúncios JÁ ESTÃO no nosso banco de dados
        const existingMlbs = new Set();
        (db.products || []).forEach(p => {
            if (p.externalIds) {
                p.externalIds.forEach(id => {
                    if (id.startsWith('MLB')) existingMlbs.add(id);
                });
            }
        });
        
        const newMlbIds = mlbIds.filter(id => !existingMlbs.has(id));
        if (newMlbIds.length === 0) {
            return res.json({ success: true, message: "Todos os seus anúncios já estão cadastrados na plataforma." });
        }
        
        // 4. Buscar os detalhes dos anúncios novos e cadastrá-los
        let importedCount = 0;
        // A API de /items suporta buscar até 20 IDs separados por vírgula por vez, mas faremos de 1 em 1 para simplificar e garantir imagem em alta
        for (const mlbId of newMlbIds) {
            try {
                const itemRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!itemRes.ok) continue;
                
                const itemData = await itemRes.json();
                
                // Ignora produtos que não são filamentos (evita importar produtos 3D)
                if (!itemData.title || !itemData.title.toLowerCase().includes('filament')) {
                    continue;
                }
                
                let imageUrl = '';
                if (itemData.pictures && itemData.pictures.length > 0) {
                    imageUrl = itemData.pictures[0].secure_url || itemData.pictures[0].url;
                } else if (itemData.secure_thumbnail) {
                    imageUrl = itemData.secure_thumbnail;
                } else if (itemData.thumbnail) {
                    imageUrl = itemData.thumbnail.replace('-I.jpg', '-O.jpg');
                }
                
                const newProduct = {
                    id: 'p_ml_' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4),
                    name: itemData.title,
                    sku: itemData.seller_custom_field || mlbId,
                    type: 'resale', // Padrão
                    stock: itemData.available_quantity ? parseInt(itemData.available_quantity) : 0,
                    alertThreshold: 3,
                    acquisitionCost: 0.00,
                    price: parseFloat(itemData.price) || 0.00,
                    supplierId: '',
                    image: imageUrl,
                    externalIds: [mlbId]
                };
                
                if (!db.products) db.products = [];
                db.products.push(newProduct);
                importedCount++;
            } catch (err) {
                console.error(`[IMPORT ML] Erro ao importar ${mlbId}:`, err.message);
            }
        }
        
        if (importedCount > 0) {
            await saveDb(db);
        }
        
        const warningMsg = totalItemsOnML > 100 ? ` (Nota: O Mercado Livre limitou a leitura aos primeiros 100 anúncios de um total de ${totalItemsOnML}).` : ` (De um total de ${totalItemsOnML} anúncios na conta).`;
        
        res.json({ success: true, message: `Catálogo importado! ${importedCount} novos produtos foram cadastrados no Estoque.` + warningMsg });
    } catch (e) {
        console.error("[IMPORT ML] Erro geral:", e);
        res.status(500).json({ error: e.message || "Erro ao importar catálogo do Mercado Livre." });
    }
});

app.post('/api/import-ml-catalog-from-list', async (req, res) => {
    try {
        const { mlbIds } = req.body;
        if (!mlbIds || !Array.isArray(mlbIds) || mlbIds.length === 0) {
            return res.status(400).json({ error: "Nenhum código MLB fornecido." });
        }

        const db = await readDb();
        const accessToken = (await getValidAccessToken('mercadolivre', db)) || (await getValidAccessToken('mercadolivre2', db));
        if (!accessToken) {
            return res.status(400).json({ error: "Mercado Livre não conectado." });
        }

        const existingMlbs = new Set();
        (db.products || []).forEach(p => {
            if (p.externalIds) p.externalIds.forEach(id => {
                if (id.startsWith('MLB')) existingMlbs.add(id);
            });
            if (p.id && p.id.startsWith('MLB')) {
                existingMlbs.add(p.id);
            }
        });

        // Limpa e extrai os IDs corretamente da lista (remove espaços, garante prefixo MLB)
        const cleanedMlbIds = mlbIds
            .map(id => id.trim().toUpperCase())
            .filter(id => id.startsWith('MLB'));

        const newMlbIds = [...new Set(cleanedMlbIds)].filter(id => !existingMlbs.has(id));
        
        if (newMlbIds.length === 0) {
            return res.json({ success: true, message: "Todos os códigos fornecidos já estão cadastrados na plataforma." });
        }

        let importedCount = 0;
        
        const chunkSize = 20;
        for (let i = 0; i < newMlbIds.length; i += chunkSize) {
            const chunk = newMlbIds.slice(i, i + chunkSize);
            const idsStr = chunk.join(',');

            try {
                const itemRes = await fetch(`https://api.mercadolibre.com/items?ids=${idsStr}&attributes=id,title,price,available_quantity,pictures,seller_custom_field,thumbnail,secure_thumbnail`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                if (!itemRes.ok) {
                    console.error(`[IMPORT ML LIST] Erro no lote ${idsStr}:`, await itemRes.text());
                    continue;
                }
                
                const responseData = await itemRes.json();
                
                for (const itemObj of responseData) {
                    if (itemObj.code !== 200) continue;
                    const itemData = itemObj.body;
                    const mlbId = itemData.id;
                    
                    let imageUrl = '';
                    if (itemData.pictures && itemData.pictures.length > 0) {
                        imageUrl = itemData.pictures[0].secure_url || itemData.pictures[0].url;
                    } else if (itemData.secure_thumbnail) {
                        imageUrl = itemData.secure_thumbnail;
                    } else if (itemData.thumbnail) {
                        imageUrl = itemData.thumbnail.replace('-I.jpg', '-O.jpg');
                    }
                    
                    const newProduct = {
                        id: 'p_ml_' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4),
                        name: itemData.title,
                        sku: itemData.seller_custom_field || mlbId,
                        type: 'resale',
                        stock: itemData.available_quantity ? parseInt(itemData.available_quantity) : 0,
                        alertThreshold: 3,
                        acquisitionCost: 0.00,
                        price: parseFloat(itemData.price) || 0.00,
                        supplierId: '',
                        image: imageUrl,
                        externalIds: [mlbId]
                    };
                    
                    if (!db.products) db.products = [];
                    db.products.push(newProduct);
                    importedCount++;
                }
            } catch (err) {
                console.error("[IMPORT ML LIST] Erro fatal no lote:", err.message);
            }
        }

        if (importedCount > 0) {
            await saveDb(db);
        }

        res.json({ success: true, message: `Catálogo importado com sucesso via lista manual! ${importedCount} novos produtos foram cadastrados.` });
    } catch (e) {
        console.error("[IMPORT ML LIST] Erro geral:", e);
        res.status(500).json({ error: e.message || "Erro ao processar a lista de anúncios." });
    }
});

// Rota de fallback para entregar o React App (Single Page Application)

// ==========================================
// INTEGRAÇÃO TINY ERP - EMISSÃO DE NFE
// ==========================================
app.post('/api/tiny/emitir-nfe', async (req, res) => {
    try {
        const { saleId, orderIdEcommerce } = req.body;
        if (!saleId || !orderIdEcommerce) {
            return res.status(400).json({ error: "Faltam parâmetros obrigatórios (saleId ou orderIdEcommerce)." });
        }

        const db = await readDb();
        const tinyToken = db.credentials?.tiny?.token;
        if (!tinyToken) {
            return res.status(400).json({ error: "Token do Tiny ERP não configurado. Vá em Integrações e adicione seu token." });
        }

        // 1. Pesquisar o pedido no Tiny usando o número do Ecommerce (ID do ML)
        const formPesquisa = new URLSearchParams();
        formPesquisa.append('token', tinyToken);
        formPesquisa.append('numeroEcommerce', orderIdEcommerce);
        formPesquisa.append('formato', 'JSON');

        const resPesquisa = await fetch('https://api.tiny.com.br/api2/pedidos.pesquisa.php', {
            method: 'POST',
            body: formPesquisa
        });
        
        const dataPesquisa = await resPesquisa.json();
        if (dataPesquisa.retorno.status === 'Erro') {
            return res.status(400).json({ error: `O pedido ${orderIdEcommerce} não foi encontrado no Tiny. Verifique se ele já foi importado pelo Tiny (Erro: ${dataPesquisa.retorno.erros[0].erro})` });
        }

        const pedidos = dataPesquisa.retorno.pedidos;
        if (!pedidos || pedidos.length === 0) {
            return res.status(404).json({ error: `Pedido ${orderIdEcommerce} não encontrado no Tiny. Certifique-se de que a integração do Tiny já puxou essa venda.` });
        }

        const tinyPedidoId = pedidos[0].pedido.id;

        // 2. Gerar a Nota Fiscal a partir do Pedido
        const formGerar = new URLSearchParams();
        formGerar.append('token', tinyToken);
        formGerar.append('id', tinyPedidoId);
        formGerar.append('formato', 'JSON');

        const resGerar = await fetch('https://api.tiny.com.br/api2/gerar.nota.fiscal.pedido.php', {
            method: 'POST',
            body: formGerar
        });

        const dataGerar = await resGerar.json();
        
        // Verifica se a nota já foi gerada antes e apenas pega o ID dela
        let idNotaFiscal = null;
        if (dataGerar.retorno.status === 'Erro') {
            const errorMsg = dataGerar.retorno.erros[0].erro;
            // Se o erro for que a nota já existe, precisamos pegar o id de outra forma.
            // Para simplificar, se a nota já foi faturada, o campo id_nota_fiscal vem na pesquisa do pedido.
            if (pedidos[0].pedido.id_nota_fiscal && pedidos[0].pedido.id_nota_fiscal !== "0") {
                idNotaFiscal = pedidos[0].pedido.id_nota_fiscal;
            } else {
                return res.status(400).json({ error: `Erro ao gerar Nota Fiscal no Tiny: ${errorMsg}` });
            }
        } else {
            idNotaFiscal = dataGerar.retorno.registros[0].registro.idNotaFiscal;
        }

        if (!idNotaFiscal) {
            return res.status(400).json({ error: "Falha ao obter o ID da Nota Fiscal gerada." });
        }

        // 3. Emitir a Nota Fiscal na Sefaz
        const formEmitir = new URLSearchParams();
        formEmitir.append('token', tinyToken);
        formEmitir.append('id', idNotaFiscal);
        formEmitir.append('formato', 'JSON');

        const resEmitir = await fetch('https://api.tiny.com.br/api2/nota.fiscal.emitir.php', {
            method: 'POST',
            body: formEmitir
        });

        const dataEmitir = await resEmitir.json();
        if (dataEmitir.retorno.status === 'Erro') {
            // Se o erro for "Nota Fiscal Eletrônica já está com a situação Autorizada"
            if (dataEmitir.retorno.erros[0].erro.includes('Autorizada')) {
                 // Nota já emitida, apenas vamos pegar o link a seguir.
            } else {
                return res.status(400).json({ error: `Erro ao emitir Nota na SEFAZ: ${dataEmitir.retorno.erros[0].erro}` });
            }
        }

        // 4. Se a emissão retornou o link diretamente:
        let linkDanfe = dataEmitir.retorno?.link_danfe;

        // Se a nota já estava emitida, a API nota.fiscal.emitir retorna erro (tratado acima) sem o link.
        // Precisamos obter o link com a API obter.link
        if (!linkDanfe) {
            const formLink = new URLSearchParams();
            formLink.append('token', tinyToken);
            formLink.append('id', idNotaFiscal);
            formLink.append('formato', 'JSON');
            
            const resLink = await fetch('https://api.tiny.com.br/api2/nota.fiscal.obter.link.php', {
                method: 'POST',
                body: formLink
            });
            const dataLink = await resLink.json();
            if (dataLink.retorno.status === 'OK') {
                linkDanfe = dataLink.retorno.link_danfe;
            }
        }

        if (linkDanfe) {
            res.json({ success: true, link: linkDanfe, message: "Nota Fiscal emitida com sucesso!" });
        } else {
            res.status(400).json({ error: "A nota parece ter sido emitida, mas o Tiny não retornou o link do PDF." });
        }

    } catch (err) {
        console.error("Erro interno NFe Tiny:", err);
        res.status(500).json({ error: "Erro interno ao processar a emissão com o Tiny." });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =====================================================
// AUTO-SYNC POLLER — Busca vendas novas no ML a cada 3 minutos
// Não depende de webhooks. Consulta a API do ML diretamente.
// =====================================================
const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos

async function pollMercadoLivreOrders() {
    const accountKeys = ['mercadolivre', 'mercadolivre2'];
    const channelMap = { mercadolivre: 'ml1', mercadolivre2: 'ml2' };

    for (const accountKey of accountKeys) {
        try {
            const db = await readDb();
            const creds = db.credentials[accountKey];
            if (!creds || !creds.accessToken || !creds.refreshToken || !creds.userId) {
                continue; // conta não configurada, pular
            }

            const accessToken = await getValidAccessToken(accountKey, db);
            if (!accessToken) {
                console.log(`[AUTO-SYNC] Não foi possível obter token para ${accountKey}. Pulando.`);
                continue;
            }

            // Busca pedidos das ultimas 72 horas para cobrir o fim de semana se o servidor dormir
            const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
            const url = `https://api.mercadolibre.com/orders/search?seller=${creds.userId}&order.date_created.from=${since}&sort=date_desc&limit=50`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[AUTO-SYNC] Erro ao buscar pedidos de ${accountKey}:`, errText);
                continue;
            }

            const data = await response.json();
            if (!data || !data.results) {
                console.error(`[AUTO-SYNC] Resposta inválida da API do ML para ${accountKey}:`, data);
                
                // Registra erro no log para alertar o usuário sobre o token inválido
                const freshDb = await readDb();
                freshDb.integrationLogs = freshDb.integrationLogs || [];
                freshDb.integrationLogs.push({
                    id: `log_autosync_error_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    type: 'error',
                    message: `⚠️ [AUTO-SYNC] Falha ao sincronizar vendas da conta ${accountKey}. Por favor, reconecte a conta no painel de Integrações.`
                });
                await saveDb(freshDb);
                continue;
            }
            if (data.results.length === 0) {
                continue;
            }

            // Recarrega DB fresco para cada verificação
            const freshDb = await readDb();
            const existingIds = new Set(freshDb.sales.map(s => s.id));
            let newCount = 0;

            for (const order of data.results) {
                const orderId = String(order.id);

                // Pula se já existe ou se está cancelado
                if (existingIds.has(orderId)) continue;
                if (order.status === 'cancelled') continue;

                // Pula se não está pago
                if (order.status !== 'paid') continue;

                const channelId = channelMap[accountKey];
                const buyer = `${order.buyer.first_name || ''} ${order.buyer.last_name || ''}`.trim() || order.buyer.nickname || 'Comprador ML';
                const grossValue = order.total_amount;
                const todayStr = new Date().toISOString().split('T')[0];

                // Dados do produto
                const firstItem = order.order_items && order.order_items[0];
                let productId = firstItem ? firstItem.item.id : 'unknown';
                let productName = firstItem ? firstItem.item.title : 'Produto ML';
                let quantity = firstItem ? firstItem.quantity : 1;

                // Busca frete
                let shipping = 0;
                if (order.shipping && order.shipping.id) {
                    try {
                        const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                        });
                        if (shipRes.ok) {
                            const shipData = await shipRes.json();
                            // Se o frete foi grátis para o comprador (custo 0), o custo cobrado do vendedor fica em base_cost ou cost
                            if (order.shipping.free_shipping || (shipData.shipping_option && shipData.shipping_option.cost === 0)) {
                                shipping = parseFloat(shipData.base_cost) || parseFloat(shipData.cost) || 0.0;
                            } else if (shipData.shipping_option && shipData.shipping_option.cost !== undefined) {
                                shipping = parseFloat(shipData.shipping_option.cost);
                            }
                        }
                    } catch (e) {
                        // ignora erro de frete
                    }
                }

                // Fallback para regras do canal cadastradas se o frete for importado como zero
                if (shipping === 0) {
                    const chan = freshDb.channels.find(c => c.id === channelId);
                    if (chan) {
                        if (chan.hasFreeShippingThreshold) {
                            if (grossValue >= chan.freeShippingThreshold) {
                                shipping = chan.defaultSellerShippingCost || 0.0;
                            } else {
                                shipping = chan.defaultBelowThresholdShippingCost || 0.0;
                            }
                        } else {
                            shipping = chan.defaultSellerShippingCost || 0.0;
                        }
                    }
                }

                // Verifica se o produto existe no catálogo
                let product = freshDb.products.find(p => p.id === productId || p.name.toLowerCase() === productName.toLowerCase());
                if (!product) {
                    const guessedType = productName.toLowerCase().includes('filamento') || productName.toLowerCase().includes('bico') ? 'resale' : '3d';
                    product = {
                        id: productId,
                        name: productName,
                        type: guessedType,
                        weight: guessedType === '3d' ? 100 : 0,
                        printTime: guessedType === '3d' ? 5.0 : 0,
                        filamentCost: 95.00,
                        machineHourCost: 2.00,
                        finishingCost: 2.00,
                        packagingCost: 2.50,
                        failRate: 10,
                        acquisitionCost: guessedType === 'resale' ? grossValue * 0.5 : 0,
                        isPendingConfig: true,
                        filamentId: guessedType === '3d' ? (freshDb.filaments[0]?.id || 'fil1') : undefined
                    };
                    freshDb.products.push(product);
                }

                // Baixa de estoque físico para todos os produtos
                if (product.stock !== undefined) {
                    const oldStock = product.stock;
                    product.stock = Math.max(0, product.stock - quantity);
                    if (oldStock !== product.stock) {
                        freshDb.integrationLogs = freshDb.integrationLogs || [];
                        freshDb.integrationLogs.push({
                            id: `log_autosync_stock_${Date.now()}_${Math.random().toString().slice(-3)}`,
                            timestamp: new Date().toLocaleTimeString('pt-BR'),
                            type: 'info',
                            message: `📦 Estoque atualizado: -${quantity} un de "${product.name}" (Restam ${product.stock} un).`
                        });
                    }
                }

                // Baixa de estoque para produtos 3D
                if (product.type === '3d' && product.weight && product.filamentId) {
                    const totalWeight = product.weight * quantity;
                    const filament = freshDb.filaments.find(f => f.id === product.filamentId);
                    if (filament) {
                        filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - totalWeight).toFixed(1)));
                    }
                }

                // Registra a venda
                freshDb.sales.unshift({
                    id: orderId,
                    date: order.date_closed || order.date_created || new Date().toISOString(),
                    channelId,
                    productId: product.id,
                    quantity,
                    grossValue,
                    shipping,
                    status: 'Pago'
                });

                // Log
                freshDb.integrationLogs = freshDb.integrationLogs || [];
                freshDb.integrationLogs.push({
                    id: `log_autosync_${Date.now()}_${Math.random().toString().slice(-3)}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    type: 'success',
                    message: `🔄 [AUTO-SYNC] Pedido #${orderId} de ${buyer} importado automaticamente. Produto: "${productName}" — R$ ${grossValue.toFixed(2)}`
                });

                if (product.isPendingConfig) {
                    freshDb.integrationLogs.push({
                        id: `log_autosync_prod_${Date.now()}_${Math.random().toString().slice(-3)}`,
                        timestamp: new Date().toLocaleTimeString('pt-BR'),
                        type: 'info',
                        message: `🆕 Produto "${productName}" importado automaticamente ao catálogo.`
                    });
                }

                existingIds.add(orderId);
                newCount++;
            }

            // Limita logs e salva
            if (newCount > 0) {
                if (freshDb.integrationLogs.length > 50) {
                    freshDb.integrationLogs = freshDb.integrationLogs.slice(-50);
                }
                await saveDb(freshDb);
                console.log(`[AUTO-SYNC] ✅ ${newCount} nova(s) venda(s) importada(s) da conta ${accountKey}.`);
            }
        } catch (err) {
            console.error(`[AUTO-SYNC] Erro geral ao sincronizar ${accountKey}:`, err.message);
        }
    }
}

// Atualiza status de vendas canceladas no ML
async function pollCancelledOrders() {
    try {
        const db = await readDb();
        const creds = db.credentials.mercadolivre;
        if (!creds || !creds.accessToken || !creds.userId) return;

        const accessToken = await getValidAccessToken('mercadolivre', db);
        if (!accessToken) return;

        // Busca pedidos cancelados recentes
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const url = `https://api.mercadolibre.com/orders/search?seller=${creds.userId}&order.status=cancelled&order.date_created.from=${since}&limit=50`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) return;
        const data = await response.json();
        if (!data.results) return;

        const freshDb = await readDb();
        let updated = false;

        for (const order of data.results) {
            const sale = freshDb.sales.find(s => s.id === String(order.id) && s.status !== 'Cancelado');
            if (sale) {
                sale.status = 'Cancelado';
                
                // Devolver ao estoque
                const product = freshDb.products?.find(p => p.id === sale.productId || (p.externalIds && p.externalIds.includes(sale.productId)));
                if (product) {
                    const qty = sale.quantity || 1;
                    if (product.stock !== undefined) product.stock += qty;
                    if (product.type === '3d' && product.weight && product.filamentId) {
                        const filament = freshDb.filaments?.find(f => f.id === product.filamentId);
                        if (filament) filament.currentWeight = parseFloat((filament.currentWeight + (product.weight * qty)).toFixed(1));
                    }
                }

                updated = true;
                console.log(`[AUTO-SYNC] Pedido #${order.id} marcado como cancelado e estoque devolvido.`);
            }
        }

        if (updated) await saveDb(freshDb);
    } catch (err) {
        console.error('[AUTO-SYNC] Erro ao verificar cancelamentos:', err.message);
    }
}


// ==========================================
// TIKTOK SHOP INTEGRATION
// ==========================================

// Função para buscar credenciais do TikTok Shop no banco
async function getTikTokShopCredentials() {
    try {
        const sysDoc = await sysCol.findOne({ _id: "tiktok_shop_credentials" });
        return sysDoc || null;
    } catch (e) {
        console.error("Erro ao buscar credenciais do TikTok Shop:", e);
        return null;
    }
}

// Endpoint para receber configurações e credenciais do frontend
app.post('/api/channels/tiktok/config', async (req, res) => {
    try {
        const { appKey, appSecret, accessToken, shopId } = req.body;
        
        await withDbLock(async () => {
            await sysCol.updateOne(
                { _id: "tiktok_shop_credentials" },
                { 
                    $set: { 
                        appKey,
                        appSecret,
                        accessToken,
                        shopId,
                        updatedAt: new Date().toISOString()
                    }
                },
                { upsert: true }
            );
        });

        res.json({ success: true, message: "Credenciais do TikTok Shop salvas com sucesso." });
    } catch (error) {
        console.error("Erro ao salvar config do TikTok Shop:", error);
        res.status(500).json({ success: false, error: "Erro interno ao salvar configurações." });
    }
});

// Endpoint base para listar produtos no TikTok Shop (Simulação/Preparo)
app.get('/api/channels/tiktok/products', async (req, res) => {
    try {
        const creds = await getTikTokShopCredentials();
        if (!creds || !creds.appKey) {
            return res.status(400).json({ success: false, error: "Credenciais do TikTok Shop não configuradas." });
        }
        
        // Em produção, isso faria uma chamada para a API do TikTok.
        res.json({ success: true, data: [] });
    } catch (error) {
        console.error("Erro ao buscar produtos no TikTok:", error);
        res.status(500).json({ success: false, error: "Erro ao comunicar com TikTok Shop." });
    }
});

// Endpoint para iniciar o fluxo OAuth
app.get('/api/channels/tiktok/auth', async (req, res) => {
    const appKey = req.query.appKey;
    if(!appKey) return res.status(400).send("App Key is required");
    // Redireciona para a página de autorização do TikTok
    const redirectUrl = `https://services.tiktokshop.com/open/authorize?service_id=${appKey}`;
    res.redirect(redirectUrl);
});

// Callback do OAuth do TikTok
app.get('/api/channels/tiktok/callback', async (req, res) => {
    const { code } = req.query;
    if(!code) return res.status(400).send("Authorization code missing.");

    try {
        const creds = await getTikTokShopCredentials();
        if(!creds || !creds.appKey || !creds.appSecret) {
            return res.status(400).send("App Key e App Secret não configurados no sistema. Volte e salve-os primeiro.");
        }

        const tokenUrl = `https://auth.tiktok-shops.com/api/v2/token/get?app_key=${creds.appKey}&app_secret=${creds.appSecret}&auth_code=${code}&grant_type=authorized_code`;
        const fetch = (await import('node-fetch')).default || global.fetch;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.code === 0 && tokenData.data) {
            const { access_token, refresh_token, seller_name } = tokenData.data;

            await withDbLock(async () => {
                await sysCol.updateOne(
                    { _id: "tiktok_shop_credentials" },
                    { 
                        $set: { 
                            accessToken: access_token,
                            refreshToken: refresh_token,
                            sellerName: seller_name,
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
            });

            res.send("<html><body><div style='font-family: sans-serif; text-align: center; padding: 50px;'><h2 style='color: #fe0979;'>TikTok Shop Autorizado com Sucesso!</h2><p>Você pode fechar esta aba e voltar para o Printou Sales Hub.</p></div><script>setTimeout(() => window.close(), 3000);</script></body></html>");
        } else {
            console.error("TikTok Token Error:", tokenData);
            res.status(500).send(`Erro ao obter token do TikTok: ${tokenData.message || JSON.stringify(tokenData)}`);
        }
    } catch(e) {
        console.error("Callback Error:", e);
        res.status(500).send("Erro interno ao processar callback do TikTok.");
    }
});

// Endpoint Webhook do TikTok Shop para notificações em tempo real
app.post('/api/webhooks/tiktokshop', async (req, res) => {
    console.log("=========================================");
    console.log("🔔 [TIKTOK WEBHOOK] NOTIFICAÇÃO RECEBIDA");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    
    // TikTok requer que você valide e responda 200 OK rapidamente
    res.status(200).json({ success: true });
});


app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Printou Hub - Servidor Ativo!`);
    console.log(`   Endereço: http://localhost:${PORT}`);
    console.log(`   Webhook ML: http://localhost:${PORT}/api/webhooks/mercadolivre`);
    console.log(`   Dados salvos em: ${DB_FILE}`);
    console.log(`   🔄 Auto-Sync ML: ativo (a cada ${POLL_INTERVAL_MS / 1000}s)`);
    console.log(`======================================================\n`);

    // Primeira sincronização 10 segundos após iniciar
    setTimeout(() => {
        console.log('[AUTO-SYNC] Executando primeira sincronização...');
        pollMercadoLivreOrders();
        pollCancelledOrders();
    }, 10000);

    // Poller contínuo a cada 3 minutos
    setInterval(() => {
        pollMercadoLivreOrders();
    }, POLL_INTERVAL_MS);

    // Verifica cancelamentos a cada 10 minutos
    setInterval(() => {
        pollCancelledOrders();
    }, 10 * 60 * 1000);
});



