const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

try {
    const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.log('No .env file found or error reading it');
}

async function listModels() {
    try {
        const fetch = (await import('node-fetch')).default || global.fetch;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_KEY}`;
        console.log("Fetching models from:", url.replace(process.env.GEMINI_KEY, 'HIDDEN_KEY'));

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("Error or no models:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
