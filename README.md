# Bayroumeter 📊🇫🇷

[![CI/CD - API](https://github.com/Lazy-Bogdi/bayroumeter/actions/workflows/api-deploy.yml/badge.svg)](https://github.com/Lazy-Bogdi/bayroumeter/actions/workflows/api-deploy.yml)  
[![Deploy Front (SWA)](https://github.com/Lazy-Bogdi/bayroumeter/actions/workflows/swa.yml/badge.svg)](https://github.com/Lazy-Bogdi/bayroumeter/actions/workflows/swa.yml)

> **Bayroumeter** est une application de sondage en temps réel permettant aux utilisateurs de voter **Oui / Non** et de suivre les résultats en direct.  
Déployée sur **Azure Functions** (API) et **Azure Static Web Apps** (Frontend), avec **CosmosDB** comme base de données.

---

## 🚀 Fonctionnalités

- 👤 **Gestion des utilisateurs** : inscription par email + pseudo.  
- 🗳 **Vote unique** par utilisateur (1 vote par email).  
- 📊 **Résultats en direct** (Oui / Non).  
- 🔍 **Monitoring des KPIs** via Application Insights :
  - Nombre total de votes  
  - Pourcentage de Oui / Non  
  - Nombre d’utilisateurs actifs  
  - Taux d’erreurs & latence API  

---

## 🛠️ Stack Technique

- **Backend API** : Azure Functions (Node.js, CosmosDB)  
- **Frontend** : Next.js + Tailwind CSS, déployé sur Azure Static Web Apps  
- **Database** : Azure CosmosDB  
- **CI/CD** : GitHub Actions (API + Front)  
- **Monitoring** : Application Insights + Azure Monitor  

---

## 📂 Structure du projet

```
bayroumeter/
├── api/                        # API (Azure Functions)
│   ├── user/                   # Endpoint /api/user (inscription)
│   ├── vote/                   # Endpoint /api/vote (vote unique)
│   ├── votes/                  # Endpoint /api/votes (résultats)
│   ├── telemetry.js            # Intégration Application Insights
│   └── package.json
│
├── frontend/                   # Frontend (Next.js + Tailwind)
│   └── bayroumeter-frontend/   # Code source Next.js
│
└── .github/workflows/          # Pipelines CI/CD
    ├── api-deploy.yml          # CI/CD API Functions
    └── swa.yml                 # CI/CD Frontend SWA
```

---

## ⚙️ Installation locale

### 1. Cloner le repo
```bash
git clone https://github.com/Lazy-Bogdi/bayroumeter.git
cd bayroumeter
```

### 2. API (Azure Functions)
```bash
cd api
npm install
npm start  # démarre avec Azure Functions Core Tools
```

### 3. Frontend (Next.js)
```bash
cd frontend/bayroumeter-frontend
npm install
npm run dev
```

---

## 🔑 Configuration

Créer un fichier **local.settings.json** (non versionné) dans `/api` :  

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "CosmosDB": "AccountEndpoint=...;AccountKey=...;",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=..."
  }
}
```

Pour le frontend, créer un fichier `.env.local` dans `/frontend/bayroumeter-frontend` :  

```
NEXT_PUBLIC_API_BASE=https://<ton-api>.azurewebsites.net/api
```

---

## 🔄 CI/CD

Le projet est entièrement automatisé avec **GitHub Actions** :

- **API** : testé + déployé sur Azure Functions si push sur `master` → [`api-deploy.yml`](.github/workflows/api-deploy.yml)  
- **Frontend** : build + déployé sur Azure Static Web Apps si push sur `master` → [`swa.yml`](.github/workflows/swa.yml)  

---

## 📊 Monitoring (KPIs)

Grâce à **Application Insights** :  
- Nombre total de votes : `ai.trackMetric("votes_list_count", value)`  
- Pourcentage Oui / Non : calculable dans un Workbook Azure Monitor  
- Utilisateurs actifs : suivi via `user_signup` events  
- Taux d’erreurs / latence API : auto-collectés par App Insights  

---

## 🤝 Contribution

1. Fork le repo  
2. Crée ta branche (`git checkout -b feature/ma-fonctionnalite`)  
3. Commit (`git commit -m "Ajout nouvelle fonctionnalité"`)  
4. Push (`git push origin feature/ma-fonctionnalite`)  
5. Ouvre une Pull Request  

---

## 📜 Licence

MIT © [Lazy-Bogdi](https://github.com/Lazy-Bogdi)  
