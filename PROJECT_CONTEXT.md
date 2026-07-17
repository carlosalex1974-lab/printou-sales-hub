# Contexto do Projeto: Printou Sales Hub

Este documento serve como referência de arquitetura, banco de dados, regras de negócio e procedimentos de implantação do **Printou Sales Hub**. Deve ser consultado e atualizado sempre que novas alterações forem planejadas ou implementadas.

---

## 📋 Visão Geral
O **Printou Sales Hub** é uma plataforma de gerenciamento financeiro, precificação de impressões 3D e integração de vendas (via Webhooks) desenvolvida para a **Printou Studio 3D**. A aplicação unifica o controle de estoque de filamentos, fluxo de caixa e automação de pedidos de marketplaces (Mercado Livre, Shopee) e loja virtual própria.

---

## 🛠️ Stack Tecnológica

1. **Front-end**:
   - **React** (Vite) + **Tailwind CSS**.
   - **Chart.js** (via `react-chartjs-2`) para relatórios financeiros.
   - **Lucide Icons** para iconografia.
2. **Back-end & Banco de Dados**:
   - **Node.js** com **Express** (arquitetura de servidor único).
   - **Banco de Dados Local**: Arquivo JSON simples (`data/db.json`) lido e gravado dinamicamente pelo Express.

---

## 📂 Arquitetura do Sistema

```
printou-sales-hub/
├── assets/                  # Logos e imagens de assets estáticos
├── data/                    # Banco de dados persistente (db.json)
├── dist/                    # Pasta de distribuição com build do React
├── src/                     # Código-fonte React
│   ├── components/          # Componentes reutilizáveis do Painel
│   │   ├── LoginScreen.jsx  # Sistema de bloqueio e autenticação
│   │   ├── PricingSimulator.jsx # Precificação 3D e markups
│   │   ├── IntegrationsManager.jsx # Terminal de logs e chaves de API
│   │   └── ... (Estoque, Vendas, Fornecedores, Relatórios)
│   ├── App.jsx              # Roteador principal e gerenciador de estado global
│   └── index.css            # Estilos gerais e suporte a temas
├── server.js                # Servidor Express, endpoints de API e Webhooks
└── package.json             # Scripts de execução e dependências
```

---

## 🔑 Segurança e Perfis de Acesso

A plataforma possui um sistema de login obrigatório com dois perfis de acesso:

| E-mail | Senha | Perfil / Cargo | Permissões |
| :--- | :--- | :--- | :--- |
| `admin@printou.com` | `admin123` | **Administrador** | Acesso total a todas as abas, taxas de canais, credenciais de APIs e relatórios de despesas. |
| `operador@printou.com` | `printou123` | **Funcionário (Operador)** | Acesso a vendas, simulação de preços e estoque. **Abas restritas ocultadas**: Taxas e Canais, Integrações e Despesas Adm. |

---

## 🔌 Integrações e Webhooks (Funcionamento Técnico)

O backend possui rotas permanentes de entrada para escutar novos pedidos:
- **Mercado Livre**: `/api/webhooks/mercadolivre`
- **Shopee**: `/api/webhooks/shopee`
- **Site Próprio**: `/api/webhooks/site`

### Lógica da Automação de Vendas:
Quando um webhook recebe uma nova venda:
1. Ele registra o faturamento bruto no caixa.
2. Identifica o produto no catálogo. Se for um produto de **Impressão 3D** (tipo `3d`), ele busca o peso do produto e a bobina de filamento associada.
3. Efetua a **baixa automática no estoque de filamentos** (descontando as gramas consumidas).
4. Se o filamento atingir o nível mínimo de alerta (`alertThreshold`), um aviso visual crítico é inserido no terminal de logs.

---

## ☁️ Instruções de Deploy (Render.com)

A plataforma está pronta para deploy contínuo em serviços de nuvem com as seguintes configurações:

* **Repositório**: GitHub ou GitLab privado conectado.
* **Ambiente (Runtime)**: `Node` (versão 18 ou superior).
* **Comando de Build**: `npm install && npm run build`
* **Comando de Inicialização (Start)**: `npm start`
* **Variável de Ambiente Exigida**: O servidor escuta automaticamente na porta fornecida pelo Render usando a variável `process.env.PORT`.

> [!IMPORTANT]
> **Persistência de Dados**: Em instâncias gratuitas do Render, o arquivo `data/db.json` será reinicializado se a máquina hibernar. Para produções comerciais, recomenda-se configurar um volume em disco persistente montado na pasta `/data` ou migrar as funções de leitura/escrita do `server.js` para um banco de dados externo (PostgreSQL).
