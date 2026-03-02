# Payment Gateway

Full-stack payment gateway monorepo built with **NestJS** (backend) and **Vue 3** (frontend), deployed on **AWS** using a serverless architecture (API Gateway + Lambda + DynamoDB). Integrates with an external **payment provider** for credit card processing in Colombian Pesos (COP).

---

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [Backend](#backend)
- [Payment Flow (End-to-End)](#payment-flow-end-to-end)
- [Infrastructure](#infrastructure)
- [Deployment](#deployment)

---

## Monorepo Structure

```
payment-gateway/
├── apps/
│   ├── backend/                  # NestJS API (Lambda-ready)
│   │   └── src/
│   │       ├── domain/           # Business entities & rules
│   │       ├── application/      # Use cases & ports (interfaces)
│   │       ├── adapters/         # HTTP controllers, DynamoDB repos, provider client
│   │       ├── config/           # NestJS config module
│   │       ├── app.module.ts     # Root DI wiring
│   │       ├── main.ts           # Local Express server
│   │       └── lambda.ts         # AWS Lambda handler
│   └── frontend/                 # Vue 3 SPA (Vite)
│       └── src/
│           ├── views/            # Page components
│           ├── store/            # Vuex state management
│           └── api/              # HTTP service layer
├── packages/
│   └── shared/                   # (reserved for shared code)
├── template.yaml                 # AWS SAM template
├── samconfig.toml                # SAM deployment config
└── package.json                  # npm workspaces root
```

Managed with **npm workspaces** — dependencies are hoisted to the root `node_modules/`.

---

## Technologies

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Frontend     | Vue 3, Vuex 4, Axios, Vite                       |
| Backend      | NestJS 11, TypeScript, class-validator            |
| Database     | Amazon DynamoDB (on-demand billing)               |
| Payments     | External provider (card tokenization + transaction processing)|
| Runtime      | Node.js 20.x (ARM64 / Graviton)                  |
| Infra        | AWS SAM, API Gateway (HTTP API), Lambda           |
| Testing      | Jest, @vue/test-utils, NestJS testing utilities   |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 9
- AWS CLI & SAM CLI (for deployment)

### Install dependencies

```bash
npm install        # installs all workspace dependencies from root
```

### Run locally

```bash
# Terminal 1 — backend (NestJS dev server on port 3000)
npm run dev:backend

# Terminal 2 — frontend (Vite dev server with proxy to backend)
npm --workspace apps/frontend run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3000`, so both apps work together seamlessly during development.

### Root-level scripts

The root `package.json` provides shortcuts for the backend:

| Script              | Command                                       |
| ------------------- | --------------------------------------------- |
| `npm run dev:backend`  | `npm --workspace apps/backend run start:dev` |
| `npm run test:backend` | `npm --workspace apps/backend run test`      |
| `npm run lint:backend` | `npm --workspace apps/backend run lint`      |

### Backend scripts (`apps/backend/`)

| Script                   | Command                           | Description                       |
| ------------------------ | --------------------------------- | --------------------------------- |
| `npm run build`          | `nest build`                      | Compile TypeScript                |
| `npm run start`          | `nest start`                      | Start server                      |
| `npm run start:dev`      | `nest start --watch`              | Start with hot reload             |
| `npm run start:debug`    | `nest start --debug --watch`      | Start with debugger attached      |
| `npm run start:prod`     | `node dist/main`                  | Start from compiled output        |
| `npm run test`           | `jest`                            | Run unit tests                    |
| `npm run test:watch`     | `jest --watch`                    | Run tests in watch mode           |
| `npm run test:cov`       | `jest --coverage`                 | Run tests with coverage report    |
| `npm run test:debug`     | `node --inspect-brk ... jest`     | Run tests with debugger           |
| `npm run test:e2e`       | `jest --config ./test/jest-e2e.json` | Run end-to-end tests           |
| `npm run lint`           | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Lint + auto-fix     |
| `npm run format`         | `prettier --write "src/**/*.ts"`  | Format code with Prettier         |

### Frontend scripts (`apps/frontend/`)

| Script                   | Command             | Description                       |
| ------------------------ | ------------------- | --------------------------------- |
| `npm run dev`            | `vite`              | Start dev server with hot reload  |
| `npm run build`          | `vite build`        | Production build (minified)       |
| `npm run preview`        | `vite preview`      | Preview production build locally  |
| `npm run test`           | `jest`              | Run unit tests                    |
| `npm run test:cov`       | `jest --coverage`   | Run tests with coverage report    |
| `npm run test:watch`     | `jest --watch`      | Run tests in watch mode           |

> Run frontend scripts with `npm --workspace apps/frontend run <script>` from the repo root, or `cd apps/frontend && npm run <script>`.

### Test Coverage

> **Column definitions:** **Stmts** = percentage of executable statements reached | **Branch** = percentage of `if/else`, ternary, and `switch` branches taken | **Funcs** = percentage of declared functions called | **Lines** = percentage of source lines executed.

#### Backend — 7 suites, 44 tests

| Layer                          | Stmts  | Branch | Funcs | Lines |
| ------------------------------ | ------ | ------ | ----- | ----- |
| **Domain** (entities + errors) | 100%   | 100%   | 100%  | 100%  |
| **Use Cases** (application)    | 100%   | 92.85% | 100%  | 100%  |
| **Overall** (domain + app)     | 96.64% | 97.30% | 100%  | 100%  |

> Coverage scoped to **domain + application layers** — the code that holds business logic. Adapters (controllers, DynamoDB repositories, provider HTTP client) are infrastructure code and are intentionally excluded from unit test coverage, consistent with the hexagonal architecture testing strategy.

#### Frontend — 5 suites, 46 tests

| Module                  | Stmts   | Branch  | Funcs   | Lines   |
| ----------------------- | ------- | ------- | ------- | ------- |
| **API** (backend + wompi) | 83.33% | 0%     | 100%    | 83.33%  |
| **Store modules** (checkout + products) | 100% | 85.18% | 100% | 100% |
| **Store plugins** (persistCheckout) | 100% | 80% | 100% | 100% |
| **Overall**             | 98.36%  | 79.59%  | 100%    | 98.19%  |

> Frontend has **98%+ statement coverage** across the Vuex store and API layers. The only uncovered file is `http.js` (Axios instance factory), which is a thin config wrapper.

---

## Frontend

**Stack:** Vue 3 (Composition API + `<script setup>`) | Vuex 4 | Axios | Vite

### Folder Structure

```
apps/frontend/src/
├── api/
│   ├── http.js               # Axios instance (proxy in dev, env URL in prod)
│   ├── backend.js             # Backend API calls (products, transactions)
│   └── wompi.js               # Payment provider card tokenization
├── views/
│   ├── ProductPage.vue        # Product catalog grid
│   ├── CheckoutModal.vue      # Delivery + payment form (2-step)
│   ├── SummaryBackDrop.vue    # Order summary before paying
│   └── ResultPage.vue         # Payment result (success/failure)
├── store/
│   ├── index.js               # Store initialization
│   ├── modules/
│   │   ├── products.js        # Product list state & fetch action
│   │   └── checkout.js        # Checkout state machine (product → form → summary → result)
│   └── plugins/
│       └── persistCheckout.js # localStorage persistence (excludes card data)
├── App.vue                    # Root component — renders pages based on checkout step
├── main.js                    # App entry point
└── style.css                  # Global styles
```

### Navigation

No router — views switch based on the Vuex `checkout.step` state:

```
ProductPage → CheckoutModal → SummaryBackDrop → ResultPage
  (PRODUCT)      (FORM)          (SUMMARY)        (RESULT)
```

### Checkout Flow

1. User selects a product and quantity on `ProductPage`
2. `CheckoutModal` collects delivery info, then calls `POST /transactions` to create a pending transaction and retrieve fee breakdown
3. User enters card details; the form calls the provider's `/tokens/cards` endpoint to tokenize the card client-side
4. `SummaryBackDrop` shows the itemized total; on confirm, sends `POST /transactions/:id/pay` with the card token
5. `ResultPage` polls `GET /transactions/:id` every 2 seconds until the status resolves to `SUCCESS` or `FAILED`

### State Persistence

The `persistCheckout` Vuex plugin saves checkout state to `localStorage` (key: `pg_checkout_v1`). Card details are **never** persisted. If the page reloads mid-checkout, the plugin restores the session and resumes polling if a payment was in progress.

### Environment Variables

| Variable               | Description                        | Example                                          |
| ---------------------- | ---------------------------------- | ------------------------------------------------ |
| `VITE_WOMPI_URL`       | Payment provider API base URL      | `https://api-sandbox.co.uat.wompi.dev/v1`        |
| `VITE_WOMPI_PUBLIC_KEY`| Provider public key (card tokenization)| `pub_stagtest_...`                            |
| `VITE_API_BASE_URL`    | Backend URL (production only)      | `https://<api-id>.execute-api.us-east-1.amazonaws.com` |

Copy `.env.example` to `.env` and fill in the values:

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

---

## Backend

**Stack:** NestJS 11 | TypeScript | DynamoDB | Payment Provider API | Serverless Express

### Hexagonal Architecture

The backend follows **Hexagonal Architecture (Ports & Adapters)** with three layers:

```
┌──────────────────────────────────────────────────────┐
│                    ADAPTERS (infra)                   │
│  HTTP controllers, DynamoDB repos, provider HTTP client│
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │              APPLICATION (use cases)          │   │
│   │   Use cases orchestrate domain logic via      │   │
│   │   ports (interfaces)                          │   │
│   │                                               │   │
│   │   ┌───────────────────────────────────────┐   │   │
│   │   │          DOMAIN (core)                │   │   │
│   │   │   Entities, types, business rules     │   │   │
│   │   │   Zero external dependencies          │   │   │
│   │   └───────────────────────────────────────┘   │   │
│   └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- **Domain** — pure business logic: entities (`Product`, `Transaction`), value types, domain errors
- **Application** — use cases that implement business workflows; defines **ports** (interfaces) for all external dependencies
- **Adapters** — implements ports: DynamoDB repositories, payment provider HTTP gateway, UUID generator, HTTP controllers & DTOs

Dependencies always point inward. The domain has zero knowledge of DynamoDB, HTTP, or external providers.

### Folder Structure

```
apps/backend/src/
├── domain/
│   ├── product/
│   │   ├── product.entity.ts          # Product entity
│   │   └── product.types.ts           # ProductId, Name, PriceInCents, Stock...
│   ├── transaction/
│   │   ├── transaction.entity.ts      # Transaction entity (state machine)
│   │   └── transaction.types.ts       # Status enum, AmountsSnapshot, CustomerSnapshot...
│   └── errors/
│       ├── insufficient-stock.error.ts
│       └── invalid-quantity.error.ts
├── application/
│   ├── ports/
│   │   ├── product-repository.port.ts
│   │   ├── transaction-repository.port.ts
│   │   ├── settings-repository.port.ts
│   │   ├── wompi-gateway.port.ts
│   │   ├── id-generator.port.ts
│   ├── use-cases/
│   │   ├── list-products/
│   │   ├── get-product/
│   │   ├── create-transaction/
│   │   ├── pay-transaction/
│   │   └── get-transaction/
│   └── tokens.ts                      # DI injection tokens
├── adapters/
│   ├── http/
│   │   ├── controllers/               # ProductsController, TransactionsController
│   │   └── dtos/                      # Request/Response DTOs with validation
│   ├── persistence/
│   │   ├── dynamodb/                  # DynamoDB repository implementations + mappers
│   │   └── in-memory/                 # In-memory implementations (local dev/testing)
│   ├── wompi/                         # Payment provider HTTP gateway implementation
│   └── id/                            # UUID generator
├── config/
├── app.module.ts                      # Root module — all DI wiring
├── main.ts                            # Express entry point (local dev)
└── lambda.ts                          # AWS Lambda entry point
```

### Domain Entities

#### Product

| Field          | Type     | Notes                 |
| -------------- | -------- | --------------------- |
| `id`           | string   | Partition key         |
| `name`         | string   |                       |
| `description`  | string   |                       |
| `priceInCents` | number   | Price in COP cents    |
| `currency`     | `'COP'`  |                       |
| `imageUrl`     | string   |                       |
| `stock`        | number   | Mutable — decremented atomically |

Key methods: `isInStock()`, `decreaseStock(quantity)`, `canFulfillOrder(quantity)`

#### Transaction

| Field                    | Type                | Notes                            |
| ------------------------ | ------------------- | -------------------------------- |
| `transactionId`          | string              | Partition key                    |
| `productId`              | string              | FK to Product                    |
| `quantity`               | number              |                                  |
| `status`                 | enum                | `PENDING → PROCESSING → SUCCESS / FAILED` |
| `wompiTransactionId`     | string \| null      | Set after provider call          |
| `wompiTransactionStatus` | enum \| null        | `PENDING / APPROVED / DECLINED / ERROR / VOIDED` |
| `amounts`                | AmountsSnapshot     | productAmount + baseFee + deliveryFee = total |
| `customer`               | CustomerSnapshot    | email, fullName, phoneNumber     |
| `delivery`               | DeliverySnapshot    | address, city, region, country   |
| `acceptance`             | AcceptanceSnapshot  | Provider contract acceptance tokens |
| `failureReason`          | string \| null      |                                  |
| `clientIp`               | string              | Captured from request            |
| `createdAt`              | Date                |                                  |
| `updatedAt`              | Date                |                                  |

**State machine:**

```
PENDING ──pay()──► PROCESSING ──provider confirms──► SUCCESS
                        │
                        └──provider declines──► FAILED
```

#### Entity Relationship

```
Product 1 ◄──────── N Transaction
   │                      │
   │ productId             │ transactionId
   │ (PK)                  │ (PK)
   │                      │
   └── stock decremented   └── references productId
       on SUCCESS               + stores AmountsSnapshot
```

### API Endpoints

| Method | Path                       | Description              |
| ------ | -------------------------- | ------------------------ |
| GET    | `/products`                | List all products        |
| GET    | `/products/:id`            | Get product by ID        |
| POST   | `/transactions`            | Create pending transaction |
| POST   | `/transactions/:id/pay`    | Process payment          |
| GET    | `/transactions/:id`        | Get transaction status (polls provider if PROCESSING) |

### Use Cases

| Use Case               | Input                                     | Output                              | Logic                                                                     |
| ---------------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| **ListProducts**       | —                                         | `Product[]`                         | Returns all products                                                      |
| **GetProduct**         | `productId`                               | `Product`                           | Single product lookup                                                     |
| **CreateTransaction**  | product, quantity, customer, delivery, IP  | transactionId, amounts, contracts   | Validates stock, calculates fees, fetches provider contracts, saves PENDING|
| **PayTransaction**     | transactionId, cardToken, installments, IP| transactionId, status, provider info| Generates signature, calls provider, marks PROCESSING                     |
| **GetTransaction**     | transactionId                             | full transaction details            | If PROCESSING: polls provider, updates status, decrements stock on SUCCESS|

### DynamoDB Schemas

All tables use **on-demand (PAY_PER_REQUEST)** billing. No secondary indexes — simple key-value lookups.

#### ProductsTable

| Attribute      | Type   | Key |
| -------------- | ------ | --- |
| `productId`    | String | PK  |
| `name`         | String |     |
| `description`  | String |     |
| `priceInCents` | Number |     |
| `currency`     | String |     |
| `imageUrl`     | String |     |
| `stock`        | Number |     |

Stock decrement uses a **DynamoDB conditional expression** for atomicity — the operation fails if `stock < quantity`.

#### TransactionsTable

| Attribute                | Type   | Key |
| ------------------------ | ------ | --- |
| `transactionId`          | String | PK  |
| `productId`              | String |     |
| `quantity`               | Number |     |
| `status`                 | String |     |
| `wompiTransactionId`     | String |     |
| `wompiTransactionStatus` | String |     |
| `amounts`                | Map    | `{ productAmountInCents, baseFeeInCents, deliveryFeeInCents, totalInCents, currency }` |
| `customer`               | Map    | `{ email, fullName, phoneNumber }` |
| `delivery`               | Map    | `{ address, city, region, country }` |
| `acceptance`             | Map    | `{ acceptanceToken, acceptPersonalAuth, endUserPolicyUrl, personalDataAuthUrl }` |
| `failureReason`          | String |     |
| `clientIp`               | String |     |
| `createdAt`              | String | ISO 8601 |
| `updatedAt`              | String | ISO 8601 |

#### SettingsTable

| Attribute          | Type   | Key |
| ------------------ | ------ | --- |
| `settingsKey`      | String | PK (`"global"`) |
| `baseFeeInCents`   | Number | Default: 2500 (25.00 COP) |
| `deliveryFeeInCents`| Number | Default: 5000 (50.00 COP) |

### Adapter Selection

The `app.module.ts` uses the `USE_DYNAMO` environment variable to switch between adapters at startup:

- `USE_DYNAMO=true` — DynamoDB repositories (production / AWS)
- `USE_DYNAMO=false` — In-memory repositories with hardcoded seed data (local development)

### Environment Variables

| Variable                 | Description                          | Example                                   |
| ------------------------ | ------------------------------------ | ----------------------------------------- |
| `USE_DYNAMO`             | Enable DynamoDB (`true`/`false`)     | `false`                                   |
| `DYNAMO_REGION`          | AWS region for DynamoDB              | `us-east-1`                               |
| `DYNAMO_PRODUCTS_TABLE`  | Products table name                  | `Products`                                |
| `DYNAMO_TRANSACTIONS_TABLE` | Transactions table name           | `Transactions`                            |
| `DYNAMO_SETTINGS_TABLE`  | Settings table name                  | `Settings`                                |
| `DYNAMO_ENDPOINT`        | Local DynamoDB endpoint (optional)   | `http://localhost:8000`                   |
| `PROVIDER_BASE_URL`         | Payment provider API base URL        | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `PROVIDER_PUBLIC_KEY`       | Provider public key                  | `pub_stagtest_...`                        |
| `PROVIDER_PRIVATE_KEY`      | Provider private key                 | *(do not commit)*                         |
| `PROVIDER_INTEGRITY_SECRET` | Provider integrity secret for signatures| *(do not commit)*                      |

Copy `.env.example` to `.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

---

## Payment Flow (End-to-End)

The core pattern is **tokenize in client, charge in server, poll final status, persist + update stock**.

### 1. User selects a product + quantity

Frontend loads products from the backend (`GET /products`). User picks a product and quantity.

### 2. User enters delivery + customer data

Frontend collects: email, full name, phone, address, city, region, country.

Frontend calls the backend to create an internal transaction (`POST /transactions`) with status `PENDING`.

Backend calculates amounts (product price * quantity + base fee + delivery fee) and stores the transaction record in DynamoDB.

### 3. Frontend tokenizes the credit card

Frontend sends card details **directly** to the provider's token endpoint using the public key. The provider returns a card token (safe to forward to the backend). **The system never stores card number or CVC.**

### 4. Frontend requests payment

Frontend calls the backend: `POST /transactions/:id/pay` sending:
- `cardToken` (from step 3)
- `installments`

### 5. Backend creates the payment with the provider

1. Moves internal transaction to `PROCESSING`
2. Generates the integrity signature server-side: `SHA256(reference + amountInCents + currency + integritySecret)`
3. Calls the provider's "create transaction" API using the **private key**, sending:
   - Amount in cents, currency
   - Unique reference (transaction ID)
   - Customer email
   - Payment method (card token + installments)
   - Acceptance tokens (contract agreements)
   - Client IP
4. Provider responds with a provider transaction ID and an initial status (`PENDING`)

### 6. Backend updates internal transaction + stock

1. Stores the provider transaction ID and current provider status
2. Polls the provider status on subsequent `GET /transactions/:id` calls
3. When the provider reaches a final status:
   - `APPROVED` → internal status `SUCCESS`
   - `DECLINED` / `ERROR` / `VOIDED` → internal status `FAILED`
4. On `SUCCESS`: backend decrements stock **atomically** using a DynamoDB `ConditionExpression` (prevents overselling without locks)

### 7. Frontend shows result

`ResultPage` displays the final status and reloads product stock.

```
Frontend                          Backend                          Provider
   │                                 │                                │
   │──POST /transactions────────────►│                                │
   │◄──transactionId + amounts───────│                                │
   │                                 │                                │
   │──POST provider/tokens/cards─────┼───────────────────────────────►│
   │◄──cardToken─────────────────────┼────────────────────────────────│
   │                                 │                                │
   │──POST /transactions/:id/pay────►│──create payment───────────────►│
   │◄──status: PROCESSING───────────│◄──providerTxId + PENDING──────│
   │                                 │                                │
   │──GET /transactions/:id─────────►│──get status───────────────────►│
   │◄──status: PROCESSING───────────│◄──PENDING─────────────────────│
   │         ... (poll every 2s)     │                                │
   │──GET /transactions/:id─────────►│──get status───────────────────►│
   │◄──status: SUCCESS──────────────│◄──APPROVED────────────────────│
   │                                 │──decrement stock (atomic)       │
```

---

## Infrastructure

### Architecture Diagram

```
                         ┌──────────────┐
                         │   Frontend   │
                         │  (Vue 3 SPA) │
                         │   S3 / CDN   │
                         └──────┬───────┘
                                │ HTTPS
                                ▼
                      ┌─────────────────────┐
                      │  API Gateway (HTTP)  │
                      │   CORS enabled       │
                      └─────────┬───────────┘
                                │
                                ▼
                      ┌─────────────────────┐
                      │   AWS Lambda         │
                      │   NestJS + Express   │
                      │   Node.js 20 ARM64   │
                      │   512 MB / 30s       │
                      └─────────┬───────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌────────────┐ ┌────────────┐
        │ ProductsTable│ │ Transactions│ │ Settings   │
        │  (DynamoDB)  │ │  (DynamoDB) │ │ (DynamoDB) │
        └──────────────┘ └────────────┘ └────────────┘
```

### Why This Stack

**Why SAM** (instead of manual console setup)
- **Infrastructure as Code** — the entire backend (API + function + tables + IAM) lives in one `template.yaml`
- **Repeatable deployments** — same commands update the stack reliably
- **Fast MVP** — minimal moving parts and easy rollback

**Why API Gateway + Lambda**
- **Cost-effective** — pay per request/execution, ideal for an assessment or MVP
- **No servers to manage** — deploy code and it's live
- **Scales automatically** — handles bursts without provisioning
- **Clear boundary** — API Gateway is the public HTTP entry point; Lambda runs the NestJS app

**Why DynamoDB**
- **Serverless + cheap** at low traffic (on-demand billing)
- **Simple data model** suited for this project: Products (PK: `productId`), Transactions (PK: `transactionId`), Settings (PK: `settingsKey`)
- **Correct concurrency** — atomic stock decrement with `ConditionExpression` prevents overselling without complex locks

**Why this is clean-architecture friendly**
- Domain and use cases don't depend on AWS
- AWS-specific code lives exclusively in adapters (DynamoDB repositories, provider HTTP gateway)
- Switching persistence (in-memory ↔ DynamoDB) is just DI + an env flag (`USE_DYNAMO`)

### SAM Configuration

The `template.yaml` at the repo root defines all AWS resources:

- **HTTP API** — API Gateway v2 with CORS (`AllowOrigins: *`)
- **Lambda Function** — handles all routes via `@vendia/serverless-express`
- **3 DynamoDB Tables** — Products, Transactions, Settings (all PAY_PER_REQUEST)
- **IAM Policies** — Lambda gets CRUD access to all three tables

### SAM Parameters

On first `sam deploy --guided`, SAM prompts for these parameters (stored in `samconfig.toml`):

| Parameter             | Description                  |
| --------------------- | ---------------------------- |
| `WompiPublicKey`      | Provider public API key      |
| `WompiPrivateKey`     | Provider private API key     |
| `WompiIntegritySecret`| Provider integrity secret    |

These are injected as Lambda environment variables. Sensitive values are **not** stored in source control.

---

## Deployment

### Backend (SAM + AWS CLI)

#### Build + deploy

```bash
# From repo root — first time (guided prompts for stack name, region, params)
sam build --profile <YOUR_AWS_PROFILE>
sam deploy --guided --profile <YOUR_AWS_PROFILE>

# Subsequent deploys (uses saved samconfig.toml)
sam build --profile <YOUR_AWS_PROFILE>
sam deploy --profile <YOUR_AWS_PROFILE>
```

#### Inspect Lambda environment variables

```bash
aws lambda get-function-configuration \
  --function-name <FUNCTION_NAME> \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --query "Environment.Variables"
```

#### Tail Lambda logs

```bash
aws logs tail "/aws/lambda/<FUNCTION_NAME>" \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --since 10m
```

#### Get DynamoDB table physical names from the stack

```bash
aws cloudformation describe-stack-resources \
  --stack-name payment-gateway \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --query "StackResources[?LogicalResourceId=='ProductsTable' || LogicalResourceId=='SettingsTable' || LogicalResourceId=='TransactionsTable'].[LogicalResourceId,PhysicalResourceId]" \
  --output table
```

#### Seed DynamoDB (products + global settings)

```bash
# Product 1
aws dynamodb put-item \
  --table-name <PRODUCTS_TABLE_NAME> \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --item '{
    "productId": {"S":"product-1"},
    "name": {"S":"Product 1"},
    "description": {"S":"Description of Product 1"},
    "priceInCents": {"N":"200000"},
    "currency": {"S":"COP"},
    "imageUrl": {"S":"https://picsum.photos/seed/product-1/600/400"},
    "stock": {"N":"10"}
  }'

# Product 2
aws dynamodb put-item \
  --table-name <PRODUCTS_TABLE_NAME> \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --item '{
    "productId": {"S":"product-2"},
    "name": {"S":"Product 2"},
    "description": {"S":"Description of Product 2"},
    "priceInCents": {"N":"300000"},
    "currency": {"S":"COP"},
    "imageUrl": {"S":"https://picsum.photos/seed/product-2/600/400"},
    "stock": {"N":"5"}
  }'

# Global settings
aws dynamodb put-item \
  --table-name <SETTINGS_TABLE_NAME> \
  --region us-east-1 \
  --profile <YOUR_AWS_PROFILE> \
  --item '{
    "settingsKey": {"S":"global"},
    "baseFeeInCents": {"N":"2500"},
    "deliveryFeeInCents": {"N":"5000"}
  }'
```

#### Delete the entire stack

```bash
sam delete --stack-name payment-gateway --profile <YOUR_AWS_PROFILE>
```

---

### Frontend (S3 + CloudFront with OAC)

The frontend is deployed as a static SPA to a **private S3 bucket** served through **CloudFront** with an Origin Access Control (OAC).

#### Build

```bash
cd apps/frontend
npm install
npm run build
```

#### Upload to S3

```bash
BUCKET=<YOUR_BUCKET_NAME>
aws s3 sync dist "s3://$BUCKET" --delete --profile <YOUR_AWS_PROFILE>
```

#### Create Origin Access Control (OAC)

```bash
aws cloudfront create-origin-access-control \
  --profile <YOUR_AWS_PROFILE> \
  --origin-access-control-config '{
    "Name": "payment-gateway-frontend-oac",
    "Description": "OAC for private S3 frontend bucket",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }'
```

#### Create CloudFront distribution

```bash
BUCKET=<YOUR_BUCKET_NAME>
OAC_ID=<OAC_ID>

aws cloudfront create-distribution \
  --profile <YOUR_AWS_PROFILE> \
  --distribution-config '{
    "CallerReference": "'"$(date +%s)"'",
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "s3-origin",
        "DomainName": "'"$BUCKET"'.s3.us-east-1.amazonaws.com",
        "OriginAccessControlId": "'"$OAC_ID"'",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "s3-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 2,
        "Items": ["GET","HEAD"],
        "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
      },
      "Compress": true,
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": { "Forward": "none" }
      },
      "MinTTL": 0
    },
    "CustomErrorResponses": {
      "Quantity": 2,
      "Items": [
        { "ErrorCode": 403, "ResponseCode": "200", "ResponsePagePath": "/index.html" },
        { "ErrorCode": 404, "ResponseCode": "200", "ResponsePagePath": "/index.html" }
      ]
    },
    "Comment": "payment-gateway frontend (private S3 + OAC)",
    "Enabled": true,
    "DefaultRootObject": "index.html"
  }'
```

> The `CustomErrorResponses` redirect 403/404 to `/index.html` so that SPA client-side routing works correctly.

#### Attach bucket policy (allow CloudFront to read)

```bash
BUCKET=<YOUR_BUCKET_NAME>
DIST_ID=<DISTRIBUTION_ID>

DIST_ARN=$(aws cloudfront get-distribution \
  --id "$DIST_ID" \
  --profile <YOUR_AWS_PROFILE> \
  --query "Distribution.ARN" \
  --output text)

cat > /tmp/s3-oac-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET/*",
      "Condition": { "StringEquals": { "AWS:SourceArn": "$DIST_ARN" } }
    }
  ]
}
JSON

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/s3-oac-policy.json \
  --profile <YOUR_AWS_PROFILE>
```

#### Update frontend after changes

```bash
cd apps/frontend
npm run build
aws s3 sync dist "s3://<YOUR_BUCKET_NAME>" --delete --profile <YOUR_AWS_PROFILE>
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*" --profile <YOUR_AWS_PROFILE>
```

---

## License

Private — all rights reserved.
