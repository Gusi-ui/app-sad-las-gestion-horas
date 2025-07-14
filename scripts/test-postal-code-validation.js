const { 
  validateAddress, 
  isValidPostalCodeFormat, 
  isValidSpanishPostalCode, 
  isValidPostalCodeForProvince,
  getProvinceByPostalCode,
  getPostalCodeSuggestions,
  POSTAL_CODE_RANGES 
} = require('../src/lib/utils.ts')

// Función para probar las validaciones
function testPostalCodeValidation() {
// // console.log('🧪 Probando validaciones de código postal español...\n')

  // Test 1: Formato de código postal
// // console.log('📋 Test 1: Validación de formato')
  const formatTests = [
    { code: '12345', expected: true, description: 'Código válido de 5 dígitos' },
    { code: '1234', expected: false, description: 'Código de 4 dígitos' },
    { code: '123456', expected: false, description: 'Código de 6 dígitos' },
    { code: 'abc12', expected: false, description: 'Código con letras' },
    { code: '', expected: true, description: 'Código vacío (permitido)' },
    { code: '08301', expected: true, description: 'Código de Mataró' },
    { code: '28001', expected: true, description: 'Código de Madrid' }
  ]

  formatTests.forEach(test => {
    const result = isValidPostalCodeFormat(test.code)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.code}" -> ${result}`)
  })

  // Test 2: Códigos postales españoles válidos
// // console.log('\n📋 Test 2: Códigos postales españoles válidos')
  const spanishTests = [
    { code: '08301', expected: true, description: 'Mataró (Barcelona)' },
    { code: '28001', expected: true, description: 'Madrid' },
    { code: '08001', expected: true, description: 'Barcelona' },
    { code: '46001', expected: true, description: 'Valencia' },
    { code: '41001', expected: true, description: 'Sevilla' },
    { code: '99999', expected: false, description: 'Código inexistente' },
    { code: '00000', expected: false, description: 'Código inexistente' }
  ]

  spanishTests.forEach(test => {
    const result = isValidSpanishPostalCode(test.code)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.code}" -> ${result}`)
  })

  // Test 3: Detección de provincia
// // console.log('\n📋 Test 3: Detección automática de provincia')
  const provinceTests = [
    { code: '08301', expected: 'Barcelona', description: 'Mataró' },
    { code: '28001', expected: 'Madrid', description: 'Madrid' },
    { code: '08001', expected: 'Barcelona', description: 'Barcelona' },
    { code: '46001', expected: 'Valencia', description: 'Valencia' },
    { code: '41001', expected: 'Sevilla', description: 'Sevilla' }
  ]

  provinceTests.forEach(test => {
    const result = getProvinceByPostalCode(test.code)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.code}" -> ${result}`)
  })

  // Test 4: Validación por provincia
// // console.log('\n📋 Test 4: Validación por provincia específica')
  const provinceValidationTests = [
    { code: '08301', province: 'Barcelona', expected: true, description: 'Mataró en Barcelona' },
    { code: '28001', province: 'Madrid', expected: true, description: 'Madrid en Madrid' },
    { code: '08301', province: 'Madrid', expected: false, description: 'Mataró en Madrid (incorrecto)' },
    { code: '28001', province: 'Barcelona', expected: false, description: 'Madrid en Barcelona (incorrecto)' }
  ]

  provinceValidationTests.forEach(test => {
    const result = isValidPostalCodeForProvince(test.code, test.province)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.code}" en ${test.province} -> ${result}`)
  })

  // Test 5: Sugerencias de códigos postales
// // console.log('\n📋 Test 5: Sugerencias de códigos postales')
  const suggestionTests = ['Barcelona', 'Madrid', 'Valencia']
  
  suggestionTests.forEach(province => {
    const suggestions = getPostalCodeSuggestions(province)
// // console.log(`💡 ${province}: ${suggestions.join(', ')}`)
  })

  // Test 6: Validación completa de dirección
// // console.log('\n📋 Test 6: Validación completa de dirección')
  const addressTests = [
    {
      address: {
        street_address: 'Calle Mayor 123',
        postal_code: '08301',
        city: 'Mataró',
        province: 'Barcelona'
      },
      description: 'Dirección completa y válida'
    },
    {
      address: {
        street_address: '',
        postal_code: '08301',
        city: 'Mataró',
        province: 'Barcelona'
      },
      description: 'Código postal sin dirección'
    },
    {
      address: {
        street_address: 'Calle Mayor 123',
        postal_code: '',
        city: 'Mataró',
        province: 'Barcelona'
      },
      description: 'Dirección sin código postal'
    },
    {
      address: {
        street_address: 'Calle Mayor 123',
        postal_code: '99999',
        city: 'Mataró',
        province: 'Barcelona'
      },
      description: 'Código postal inválido'
    },
    {
      address: {
        street_address: 'Calle Mayor 123',
        postal_code: '08301',
        city: 'Mataró',
        province: 'Madrid'
      },
      description: 'Código postal no corresponde a la provincia'
    }
  ]

  addressTests.forEach(test => {
    const result = validateAddress(test.address)
    const status = result.isValid ? '✅' : '❌'
// // console.log(`${status} ${test.description}:`)
    if (!result.isValid) {
      Object.entries(result.errors).forEach(([field, error]) => {
// // console.log(`   - ${field}: ${error}`)
      })
    }
  })

// // console.log('\n🎉 Pruebas completadas!')
}

// Ejecutar las pruebas
testPostalCodeValidation() 