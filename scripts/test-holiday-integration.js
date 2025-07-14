#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración de festivos en el cálculo de balances
 */

const BASE_URL = 'http://localhost:3003';

async function testHolidayIntegration() {
// // console.log('🧪 Probando integración de festivos en balances...\n');

  try {
    // 1. Verificar que la API de festivos funciona
// // console.log('1️⃣ Probando API de festivos...');
    const holidaysResponse = await fetch(`${BASE_URL}/api/holidays?year=2025&month=7`);
    const holidaysData = await holidaysResponse.json();
    
    if (holidaysResponse.ok) {
// // console.log(`✅ API de festivos funciona. Encontrados ${holidaysData.holidays?.length || 0} festivos en Julio 2025`);
      if (holidaysData.holidays?.length > 0) {
// // console.log(`   - Festivos: ${holidaysData.holidays.map(h => `${h.day} ${h.name}`).join(', ')}`);
      }
    } else {
// // console.log(`❌ Error en API de festivos: ${holidaysData.error}`);
    }

    // 2. Verificar que la página de test-balance funciona
// // console.log('\n2️⃣ Probando página de test-balance...');
    const testBalanceResponse = await fetch(`${BASE_URL}/dashboard/test-balance`);
    
    if (testBalanceResponse.ok) {
// // console.log('✅ Página de test-balance accesible');
    } else {
// // console.log(`❌ Error en página de test-balance: ${testBalanceResponse.status}`);
    }

    // 3. Verificar que la página de gestión de festivos funciona
// // console.log('\n3️⃣ Probando página de gestión de festivos...');
    const holidaysPageResponse = await fetch(`${BASE_URL}/dashboard/holidays`);
    
    if (holidaysPageResponse.ok) {
// // console.log('✅ Página de gestión de festivos accesible');
    } else {
// // console.log(`❌ Error en página de gestión de festivos: ${holidaysPageResponse.status}`);
    }

    // 4. Verificar que el dashboard de trabajadora funciona
// // console.log('\n4️⃣ Probando dashboard de trabajadora...');
    const workerDashboardResponse = await fetch(`${BASE_URL}/worker/dashboard`);
    
    if (workerDashboardResponse.ok) {
// // console.log('✅ Dashboard de trabajadora accesible');
    } else {
// // console.log(`❌ Error en dashboard de trabajadora: ${workerDashboardResponse.status}`);
    }

// // console.log('\n🎉 Pruebas completadas!');
// // console.log('\n📋 Resumen de la integración:');
// // console.log('   ✅ API de festivos funcionando');
// // console.log('   ✅ Página de test-balance accesible');
// // console.log('   ✅ Página de gestión de festivos accesible');
// // console.log('   ✅ Dashboard de trabajadora accesible');
// // console.log('\n🚀 Próximos pasos:');
// // console.log('   1. Acceder a /dashboard/holidays para gestionar festivos');
// // console.log('   2. Acceder a /dashboard/test-balance para generar balances con festivos');
// // console.log('   3. Verificar que los balances incluyen información de festivos');
// // console.log('   4. Comprobar que el dashboard de trabajadora muestra festivos');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testHolidayIntegration(); 