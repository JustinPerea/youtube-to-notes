#!/usr/bin/env node

const crypto = require('crypto');

// Your webhook secret
const webhookSecret = 'polar_whs_fhx7VoVeKLJuxNgcRrR6P8n2VWvc16REICGFl49u5gU';

// Test payload
const payload = JSON.stringify({
  "type": "order.paid",
  "data": {
    "id": "test-order",
    "customer": {
      "email": "justinmperea@gmail.com"
    },
    "product_id": "89b59bcb-00bd-4ec7-b258-105bcacae3ba",
    "subscription_id": "test-sub"
  }
});

// Generate correct signature
const signature = 'sha256=' + crypto
  .createHmac('sha256', webhookSecret)
  .update(payload, 'utf8')
  .digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);

// Test the webhook
const { exec } = require('child_process');

const curlCommand = `curl -X POST "http://localhost:3003/api/polar/webhook" \\
  -H "Content-Type: application/json" \\
  -H "polar-signature: ${signature}" \\
  -d '${payload.replace(/'/g, "'\\''")}' 2>/dev/null`;

console.log('\nTesting webhook...');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Response:', stdout);
  
  try {
    const response = JSON.parse(stdout);
    if (response.received) {
      console.log('✅ Webhook test SUCCESS!');
    } else {
      console.log('❌ Webhook test FAILED:', response);
    }
  } catch (e) {
    console.log('Response (raw):', stdout);
  }
});