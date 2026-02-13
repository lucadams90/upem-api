const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

const UPEM_BASE_URL = 'https://ecom.upem.it';
const USERNAME = 'elettrodiesel';
const PASSWORD = 'u1234';

// Store session cookies
let sessionCookies = '';
let sessionExpiry = 0;

// Login to UPEM
async function login() {
    try {
        console.log('Logging in to UPEM...');
        
        // First request to get initial cookies
        const initResponse = await axios.get(UPEM_BASE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });
        
        const initCookies = initResponse.headers['set-cookie'] || [];
        const cookieHeader = initCookies.map(c => c.split(';')[0]).join('; ');
        
        // Login request
        const loginData = new URLSearchParams();
        loginData.append('username', USERNAME);
        loginData.append('password', PASSWORD);
        loginData.append('rememberMe', 'true');
        
        const loginResponse = await axios.post(
            `${UPEM_BASE_URL}/negozio?f=eice.cms.entities.events.RefreshAccountEvent&Sender=LoginServiceController&SenderId=__89a9a9&Context=`,
            loginData,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookieHeader
                },
                maxRedirects: 5,
                validateStatus: () => true
            }
        );
        
        // Store session cookies
        const cookies = loginResponse.headers['set-cookie'] || [];
        sessionCookies = cookies.map(c => c.split(';')[0]).join('; ');
        sessionExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        console.log('Login successful!');
        return true;
    } catch (error) {
        console.error('Login failed:', error.message);
        return false;
    }
}

// Check if session is valid
function isSessionValid() {
    return sessionCookies && Date.now() < sessionExpiry;
}

// Search vehicle by plate
async function searchByPlate(plate) {
    try {
        // Ensure we're logged in
        if (!isSessionValid()) {
            const loggedIn = await login();
            if (!loggedIn) {
                throw new Error('Login failed');
            }
        }
        
        console.log(`Searching for plate: ${plate}`);
        
        // Search request
        const searchResponse = await axios.get(`${UPEM_BASE_URL}/catalogo/ricerca-veicolo`, {
            params: {
                targa: plate.toUpperCase()
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Cookie': sessionCookies
            },
            maxRedirects: 5
        });
        
        // Parse HTML response
        const $ = cheerio.load(searchResponse.data);
        
        // Extract data from the results table
        const vehicleData = {
            brand: '',
            model: '',
            version: '',
            plate: plate.toUpperCase(),
            vin: '',
            registrationDate: '',
            year: ''
        };
        
        // Find the vehicle in the results table
        $('table tbody tr').first().each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 5) {
                vehicleData.brand = $(cells[0]).text().trim();
                vehicleData.model = $(cells[1]).text().trim();
                vehicleData.version = $(cells[2]).text().trim();
                vehicleData.plate = $(cells[3]).text().trim();
                vehicleData.vin = $(cells[4]).text().trim();
                
                // Extract registration date if available
                if (cells.length >= 6) {
                    const dateMatch = $(cells[5]).text().trim();
                    if (dateMatch) {
                        vehicleData.registrationDate = dateMatch;
                        // Extract year from date (format: DD/MM/YYYY)
                        const yearMatch = dateMatch.match(/\d{4}$/);
                        if (yearMatch) {
                            vehicleData.year = yearMatch[0];
                        }
                    }
                }
            }
        });
        
        if (!vehicleData.brand) {
            throw new Error('Vehicle not found');
        }
        
        console.log('Vehicle found:', vehicleData);
        return vehicleData;
        
    } catch (error) {
        console.error('Search failed:', error.message);
        throw error;
    }
}

// API endpoint
app.post('/api/lookup-plate', async (req, res) => {
    try {
        const { plate } = req.body;
        
        if (!plate) {
            return res.status(400).json({ 
                success: false,
                error: 'Plate number required' 
            });
        }
        
        const vehicleData = await searchByPlate(plate);
        
        res.json({
            success: true,
            data: vehicleData
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'UPEM API Server',
        endpoints: {
            health: '/api/health',
            lookup: 'POST /api/lookup-plate'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`UPEM API server running on port ${PORT}`);
});
