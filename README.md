# Payment Gateway

Full-stack payment gateway monorepo built with **NestJS** (backend) and **Vue 3** (frontend), deployed on **AWS** using a serverless architecture (API Gateway + Lambda + DynamoDB). Integrates with an external **payment provider** for credit card processing in Colombian Pesos (COP).

---

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [Backend](#backend)
- [Infrastructure](#infrastructure)

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

### Run tests

```bash
# Backend tests
npm run test:backend

# Frontend tests
npm --workspace apps/frontend run test

# With coverage
npm --workspace apps/backend run test:cov
npm --workspace apps/frontend run test:cov
```

### Lint

```bash
npm run lint:backend
```

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
│   │   └── clock.port.ts
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
| `WOMPI_BASE_URL`         | Payment provider API base URL        | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `WOMPI_PUBLIC_KEY`       | Provider public key                  | `pub_stagtest_...`                        |
| `WOMPI_PRIVATE_KEY`      | Provider private key                 | *(do not commit)*                         |
| `WOMPI_INTEGRITY_SECRET` | Provider integrity secret for signatures| *(do not commit)*                      |

Copy `.env.example` to `.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
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

| Choice         | Rationale                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| **API Gateway**| Managed HTTPS, CORS, throttling, no servers to maintain                   |
| **Lambda**     | Pay-per-request, auto-scaling, zero idle cost, ARM64 for cost efficiency  |
| **DynamoDB**   | Serverless, on-demand pricing, single-digit ms latency, zero ops         |
| **SAM**        | Infrastructure as Code, local testing with `sam local`, one-command deploy|
| **NestJS on Lambda** | Full DI framework with clean architecture, reusable locally and in cloud |

### SAM Configuration

The `template.yaml` at the repo root defines all AWS resources:

- **HTTP API** — API Gateway v2 with CORS (`AllowOrigins: *`)
- **Lambda Function** — handles all routes via `@vendia/serverless-express`
- **3 DynamoDB Tables** — Products, Transactions, Settings (all PAY_PER_REQUEST)
- **IAM Policies** — Lambda gets CRUD access to all three tables

### AWS / SAM Commands

```bash
# Build the backend for Lambda deployment
sam build

# Test locally (simulates API Gateway + Lambda)
sam local start-api

# Deploy to AWS (guided — prompts for stack name, region, params)
sam deploy --guided

# Deploy with saved config (after first guided deploy)
sam deploy

# View deployed stack outputs (API URL, etc.)
sam list stack-outputs --stack-name payment-gateway

# View Lambda logs
sam logs -n PaymentGatewayFunction --stack-name payment-gateway --tail

# Delete the entire stack
sam delete --stack-name payment-gateway
```

### SAM Parameters

On first `sam deploy --guided`, SAM prompts for these parameters (stored in `samconfig.toml`):

| Parameter             | Description                  |
| --------------------- | ---------------------------- |
| `WompiPublicKey`      | Provider public API key      |
| `WompiPrivateKey`     | Provider private API key     |
| `WompiIntegritySecret`| Provider integrity secret    |

These are injected as Lambda environment variables. Sensitive values are **not** stored in source control.

---

## License

Private — all rights reserved.
