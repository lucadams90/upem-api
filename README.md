# UPEM API Server

Server Node.js per ricerca targhe su UPEM e integrazione con TO.RI. MOTORS GEST.

## 🚀 Deploy su Railway (GRATIS)

### 1. Crea account Railway
- Vai su https://railway.app
- Registrati con GitHub

### 2. Deploy il server
1. Click su "New Project"
2. Click su "Deploy from GitHub repo"
3. Carica questi file su un nuovo repository GitHub
4. Seleziona il repository
5. Railway farà il deploy automaticamente!

### 3. Ottieni l'URL
- Railway ti darà un URL tipo: `https://upem-api-production.up.railway.app`
- Copia questo URL!

### 4. Integra nell'app
- Nell'app TO.RI. MOTORS, sostituisci `YOUR_API_URL` con l'URL di Railway

## 🔧 Test locale

```bash
npm install
npm start
```

Testa con:
```bash
curl -X POST http://localhost:3000/api/lookup-plate \
  -H "Content-Type: application/json" \
  -d '{"plate":"FP356GG"}'
```

## 📋 Endpoint

### POST /api/lookup-plate
Cerca veicolo per targa

**Request:**
```json
{
  "plate": "FP356GG"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "brand": "FIAT",
    "model": "Fiorino 2ª serie",
    "version": "1.3 MJT 80CV Cargo",
    "plate": "FP356GG",
    "vin": "ZFA25000006100843",
    "registrationDate": "27/03/2018",
    "year": "2018"
  }
}
```

## ⚠️ Note
- Il server mantiene la sessione UPEM attiva
- Tempo di risposta: ~5-7 secondi
- Credenziali UPEM hardcoded nel server (username: elettrodiesel)
