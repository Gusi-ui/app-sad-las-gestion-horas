const { 
  isValidDNIFormat, 
  isValidDNI, 
  calculateDNILetter, 
  getCorrectDNILetter, 
  formatDNI 
} = require('../src/lib/utils.ts')

// Función para probar las validaciones del DNI
function testDNIValidation() {
// // console.log('🧪 Probando validaciones de DNI español...\n')

  // Test 1: Formato de DNI
// // console.log('📋 Test 1: Validación de formato')
  const formatTests = [
    { dni: '12345678A', expected: true, description: 'DNI válido de 8 dígitos + letra' },
    { dni: '1234567A', expected: false, description: 'DNI de 7 dígitos + letra' },
    { dni: '123456789A', expected: false, description: 'DNI de 9 dígitos + letra' },
    { dni: '12345678', expected: false, description: 'DNI solo números' },
    { dni: 'ABCDEFGHI', expected: false, description: 'DNI solo letras' },
    { dni: '1234567a', expected: false, description: 'DNI con letra minúscula' },
    { dni: '', expected: true, description: 'DNI vacío (permitido)' },
    { dni: '12345678-', expected: false, description: 'DNI con guión' },
    { dni: '12 34 56 78A', expected: false, description: 'DNI con espacios' }
  ]

  formatTests.forEach(test => {
    const result = isValidDNIFormat(test.dni)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.dni}" -> ${result}`)
  })

  // Test 2: Cálculo de letra de control
// // console.log('\n📋 Test 2: Cálculo de letra de control')
  const letterTests = [
    { numbers: '12345678', expected: 'Z', description: 'DNI 12345678' },
    { numbers: '00000000', expected: 'T', description: 'DNI 00000000' },
    { numbers: '99999999', expected: 'E', description: 'DNI 99999999' },
    { numbers: '1234567', expected: '', description: 'Números insuficientes' },
    { numbers: '123456789', expected: '', description: 'Demasiados números' },
    { numbers: 'ABCDEFGH', expected: '', description: 'No son números' }
  ]

  letterTests.forEach(test => {
    const result = getCorrectDNILetter(test.numbers)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.numbers}" -> "${result}"`)
  })

  // Test 3: DNI completos válidos
// // console.log('\n📋 Test 3: DNI completos válidos')
  const validDNITests = [
    { dni: '12345678Z', expected: true, description: 'DNI válido 12345678Z' },
    { dni: '00000000T', expected: true, description: 'DNI válido 00000000T' },
    { dni: '99999999E', expected: true, description: 'DNI válido 99999999E' },
    { dni: '12345678A', expected: false, description: 'DNI con letra incorrecta' },
    { dni: '12345678Z', expected: true, description: 'DNI con letra correcta' },
    { dni: '12345678z', expected: true, description: 'DNI con letra minúscula (se convierte)' },
    { dni: '', expected: true, description: 'DNI vacío' }
  ]

  validDNITests.forEach(test => {
    const result = isValidDNI(test.dni)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.dni}" -> ${result}`)
  })

  // Test 4: Formateo de DNI
// // console.log('\n📋 Test 4: Formateo de DNI')
  const formatDNITests = [
    { input: '12345678', expected: '12345678-Z', description: 'Solo números' },
    { input: '12345678A', expected: '12345678-A', description: 'Números + letra' },
    { input: '12345678-A', expected: '12345678-A', description: 'Ya formateado' },
    { input: '12345678 a', expected: '12345678A', description: 'Con espacios' },
    { input: '12345678-a', expected: '12345678A', description: 'Con guión y minúscula' },
    { input: '', expected: '', description: 'Vacío' },
    { input: '1234567', expected: '1234567', description: 'Números insuficientes' }
  ]

  formatDNITests.forEach(test => {
    const result = formatDNI(test.input)
    const status = result === test.expected ? '✅' : '❌'
// // console.log(`${status} ${test.description}: "${test.input}" -> "${result}"`)
  })

  // Test 5: Ejemplos reales de DNI
// // console.log('\n📋 Test 5: Ejemplos reales de DNI')
  const realDNIs = [
    '12345678Z',
    '87654321X',
    '11111111H',
    '22222222J',
    '33333333P',
    '44444444A',
    '55555555K',
    '66666666Q',
    '77777777B',
    '88888888Y'
  ]

  realDNIs.forEach(dni => {
    const isValid = isValidDNI(dni)
    const status = isValid ? '✅' : '❌'
// // console.log(`${status} DNI: ${dni} -> ${isValid ? 'Válido' : 'Inválido'}`)
  })

// // console.log('\n🎉 Pruebas de DNI completadas!')
}

// Ejecutar las pruebas
testDNIValidation() 