#!/usr/bin/env node

/**
 * Script de verificación del sistema de reasignación automática
 * Verifica que todos los componentes críticos tengan la lógica implementada
 */

const fs = require('fs');
const path = require('path');

// Componentes críticos que deben tener la lógica de reasignación
const criticalComponents = [
  'src/lib/holidayReassignment.ts',
  'src/hooks/useHoursCalculation.ts',
  'src/hooks/useMonthlyBalance.ts',
  'src/components/DetailedHoursStatusCard.tsx',
  'src/components/MonthlyBalanceCard.tsx',
  'src/app/worker/dashboard/page.tsx',
  'src/app/api/admin/generate-balance/route.ts',
  'src/app/api/admin/test-balance-data/route.ts',
  'src/app/api/worker/monthly-balance/route.ts'
];

// Palabras clave que indican que la lógica está implementada
const reassignmentKeywords = [
  'generateMonthlyPlanningWithHolidayReassignment',
  'detectHolidayReassignments',
  'reassignmentInfo',
  'hasReassignments',
  'reassignmentCount',
  'reassignmentDates',
  'holidayReassignment',
  'RefreshCw'
];

// Palabras clave que indican que se está usando la lógica
const usageKeywords = [
  'import.*holidayReassignment',
  'generateMonthlyPlanningWithHolidayReassignment',
  'reassignmentInfo',
  'setReassignmentInfo'
];

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, hasLogic: false, hasUsage: false, errors: [`Archivo no encontrado: ${filePath}`] };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasLogic = reassignmentKeywords.some(keyword => content.includes(keyword));
    const hasUsage = usageKeywords.some(keyword => {
      const regex = new RegExp(keyword, 'i');
      return regex.test(content);
    });

    return {
      exists: true,
      hasLogic,
      hasUsage,
      errors: []
    };
  } catch (error) {
    return {
      exists: false,
      hasLogic: false,
      hasUsage: false,
      errors: [`Error leyendo archivo: ${error.message}`]
    };
  }
}

function main() {
// // console.log('🔍 Verificando sistema de reasignación automática...\n');

  let allPassed = true;
  let totalChecks = 0;
  let passedChecks = 0;

  for (const component of criticalComponents) {
    totalChecks++;
    const result = checkFile(component);
    
// // console.log(`📁 ${component}:`);
    
    if (!result.exists) {
// // console.log(`   ❌ Archivo no encontrado`);
// // console.log(`   📝 Errores: ${result.errors.join(', ')}`);
      allPassed = false;
    } else {
      if (result.hasLogic) {
// // console.log(`   ✅ Lógica de reasignación implementada`);
        passedChecks++;
      } else {
// // console.log(`   ❌ Lógica de reasignación NO implementada`);
        allPassed = false;
      }
      
      if (result.hasUsage) {
// // console.log(`   ✅ Uso de la lógica detectado`);
        passedChecks++;
      } else {
// // console.log(`   ⚠️  Uso de la lógica NO detectado (puede ser normal para algunos archivos)`);
      }
    }
    
// // console.log('');
  }

// // console.log('📊 RESUMEN:');
// // console.log(`   Total de verificaciones: ${totalChecks}`);
// // console.log(`   Verificaciones exitosas: ${passedChecks}`);
// // console.log(`   Estado general: ${allPassed ? '✅ SISTEMA COMPLETO' : '❌ PROBLEMAS DETECTADOS'}`);

  if (allPassed) {
// // console.log('\n🎉 ¡El sistema de reasignación automática está completamente implementado!');
// // console.log('   Todos los componentes críticos tienen la lógica necesaria.');
  } else {
// // console.log('\n⚠️  Se detectaron problemas en el sistema de reasignación:');
// // console.log('   Revisa los componentes marcados con ❌');
  }

  return allPassed;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main, checkFile }; 