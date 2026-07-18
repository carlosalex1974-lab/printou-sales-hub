import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

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
    integrationLogs: [],
    credentials: {
        mercadolivre: { clientId: '', clientSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/mercadolivre', status: 'Não Sincronizado' },
        shopee: { shopId: '', apiKey: '', webhookUrl: 'http://localhost:3001/api/webhooks/shopee', status: 'Não Sincronizado' },
        site: { apiKey: '', apiSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/site', status: 'Não Sincronizado' }
    },
    users: [
        { email: 'admin@printou.com', password: 'admin123', name: 'Administrador Printou', role: 'admin' },
        { email: 'operador@printou.com', password: 'printou123', name: 'Operador Printou', role: 'employee' }
    ]
};

// Garantir que a pasta 'data' existe
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

// Inicializar banco se vazio
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 4), 'utf-8');
}

// Helper para ler DB
function readDb() {
    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileData);
    } catch (e) {
        return DEFAULT_DB;
    }
}

// Helper para salvar DB
function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), 'utf-8');
}

// Endpoint para ler dados
app.get('/api/data', (req, res) => {
    try {
        const data = readDb();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler banco de dados local:", error);
        res.status(500).json({ error: "Erro ao ler banco de dados" });
    }
});

// Endpoint para salvar dados
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        saveDb(data);
        res.json({ success: true, message: "Dados persistidos no banco de dados local com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar banco de dados local:", error);
        res.status(500).json({ error: "Erro ao salvar banco de dados" });
    }
});

// Endpoint Webhook Genérico/Simulado para Mercado Livre e Shopee
app.post('/api/webhooks/:provider', (req, res) => {
    const { provider } = req.params;
    const payload = req.body;
    
    console.log(`[WEBHOOK] Notificação recebida de ${provider}:`, payload);
    
    try {
        const db = readDb();
        
        // Formata data atual
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Mapeia dados recebidos
        const orderId = payload.order_id || payload.order_sn || `int_${Date.now().toString().slice(-4)}`;
        const channelId = payload.channelId || (provider === 'mercadolivre' ? 'ml2' : provider === 'shopee' ? 'shopee' : 'site');
        const productId = payload.productId || 'p1';
        const quantity = parseInt(payload.quantity) || 1;
        const grossValue = parseFloat(payload.grossValue) || 49.90;
        const shipping = parseFloat(payload.shipping) || 0.0;
        const buyer = payload.buyer || 'Cliente Integrado';
        
        // Adiciona log de recebimento
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString().slice(-3)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'info',
            message: `⚡ Webhook [${provider.toUpperCase()}] recebido. Pedido #${orderId} de ${buyer}.`
        };
        
        // Busca produto correspondente no estoque para baixa
        const product = db.products.find(p => p.id === productId);
        let deductionLogs = [];
        
        if (product) {
            logEntry.message += ` Processando produto: "${product.name}".`;
            
            if (product.type === '3d' && product.weight && product.filamentId) {
                const totalWeight = product.weight * quantity;
                const filament = db.filaments.find(f => f.id === product.filamentId);
                
                if (filament) {
                    filament.currentWeight = Math.max(0, filament.currentWeight - totalWeight);
                    deductionLogs.push(`📉 Baixa automática de estoque: Descontados ${totalWeight}g do filamento "${filament.name}". Restante: ${filament.currentWeight}g.`);
                    
                    // Alerta de estoque crítico
                    if (filament.currentWeight <= filament.alertThreshold) {
                        deductionLogs.push(`⚠️ ALERTA: O filamento "${filament.name}" atingiu o nível crítico (${filament.currentWeight}g)!`);
                    }
                }
            } else if (product.type === 'resale') {
                deductionLogs.push(`📦 Produto de revenda. Baixa automática realizada no sistema.`);
            }
        } else {
            // Importar provisoriamente se não existir
            const newProd = {
                id: productId,
                name: payload.productName || `Produto Simulado ${productId}`,
                type: 'resale',
                acquisitionCost: grossValue * 0.5
            };
            db.products.push(newProd);
            deductionLogs.push(`🆕 Produto desconhecido "${newProd.name}" importado automaticamente.`);
        }
        
        // Registrar a venda no caixa
        const newSale = {
            id: orderId,
            date: todayStr,
            channelId,
            productId,
            quantity,
            grossValue,
            shipping,
            status: 'Pago'
        };
        db.sales.push(newSale);
        
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
        
        saveDb(db);
        
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
        res.status(500).json({ error: "Erro ao processar requisição do webhook" });
    }
});

// Endpoint para limpar os logs de integração
app.post('/api/integration/logs/clear', (req, res) => {
    try {
        const db = readDb();
        db.integrationLogs = [];
        saveDb(db);
        res.json({ success: true, message: "Logs limpos com sucesso!" });
    } catch (e) {
        res.status(500).json({ error: "Erro ao limpar logs" });
    }
});

// Endpoint para zerar todos os dados do banco (preservando credenciais e canais)
app.post('/api/data/reset', (req, res) => {
    try {
        const db = readDb();
        db.sales = [];
        db.expenses = [];
        db.products = [];
        db.filaments = [];
        db.suppliers = [];
        db.integrationLogs = [];
        saveDb(db);
        res.json({ success: true, message: "Sistema resetado com sucesso! Pronto para uso real." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao resetar dados do sistema" });
    }
});

// Endpoint para Autenticação (Login)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const db = readDb();
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

// Rota de fallback para entregar o React App (Single Page Application)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Printou Hub - Banco de Dados Local Ativo!`);
    console.log(`   Endereço: http://localhost:${PORT}`);
    console.log(`   Webhook Mercado Livre: http://localhost:${PORT}/api/webhooks/mercadolivre`);
    console.log(`   Webhook Shopee: http://localhost:${PORT}/api/webhooks/shopee`);
    console.log(`   Dados salvos em: ${DB_FILE}`);
    console.log(`======================================================\n`);
});
