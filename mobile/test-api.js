#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://192.168.1.64:4000/api';

console.log('🔍 Testing API connection to:', API_URL);

async function testAPI() {
  try {
    // Test health endpoint
    console.log('\n📌 Testing /health...');
    const health = await axios.get(`${API_URL.replace('/api', '/api/health')}`);
    console.log('✅ Health:', health.data.status);

    // Test players endpoint
    console.log('\n📌 Testing /players...');
    const players = await axios.get(`${API_URL}/players`);
    console.log(`✅ Players: Found ${players.data.data.length} players`);
    console.log('   First player:', players.data.data[0]?.user?.firstName, players.data.data[0]?.user?.lastName);

    // Test clubs endpoint
    console.log('\n📌 Testing /clubs...');
    const clubs = await axios.get(`${API_URL}/clubs`);
    console.log(`✅ Clubs: Found ${clubs.data.data.length} clubs`);
    console.log('   First club:', clubs.data.data[0]?.name);

    // Test events endpoint
    console.log('\n📌 Testing /events...');
    const events = await axios.get(`${API_URL}/events`);
    console.log(`✅ Events: Found ${events.data.data.length} events`);

    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('📱 The mobile app should now be able to connect and display data.');

  } catch (error) {
    console.error('\n❌ API Test Failed:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('\n💡 Make sure:');
    console.error('   1. Backend is running on port 4000');
    console.error('   2. No firewall blocking connections');
    console.error('   3. IP address 192.168.1.64 is correct');
  }
}

testAPI();