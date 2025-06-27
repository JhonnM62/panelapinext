#!/usr/bin/env node

/**
 * Script para verificar dependencias de Radix UI
 */

const fs = require('fs');
const path = require('path');

const radixDeps = [
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-avatar', 
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-icons',
  '@radix-ui/react-label',
  '@radix-ui/react-popover',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast'
];

console.log('🔍 Verificando dependencias de Radix UI...\n');

const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageJsonPath = path.join(__dirname, 'package.json');

// Leer package.json
let packageJson = {};
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ No se pudo leer package.json');
  process.exit(1);
}

const dependencies = packageJson.dependencies || {};

let missingDeps = [];
let installedCount = 0;

radixDeps.forEach(dep => {
  const depPath = path.join(nodeModulesPath, dep);
  const inPackageJson = dependencies[dep] !== undefined;
  const isInstalled = fs.existsSync(depPath);
  
  if (inPackageJson && isInstalled) {
    console.log(`✅ ${dep} - OK`);
    installedCount++;
  } else if (inPackageJson && !isInstalled) {
    console.log(`⚠️  ${dep} - En package.json pero NO instalado`);
    missingDeps.push(dep);
  } else if (!inPackageJson && isInstalled) {
    console.log(`🔄 ${dep} - Instalado pero NO en package.json`);
  } else {
    console.log(`❌ ${dep} - FALTANTE`);
    missingDeps.push(dep);
  }
});

console.log(`\n📊 Resumen:`);
console.log(`✅ Instaladas correctamente: ${installedCount}/${radixDeps.length}`);
console.log(`❌ Faltantes o con problemas: ${missingDeps.length}`);

if (missingDeps.length > 0) {
  console.log(`\n🔧 Para instalar las faltantes, ejecuta:`);
  console.log(`npm install ${missingDeps.join(' ')}`);
} else {
  console.log(`\n🎉 Todas las dependencias de Radix UI están correctamente instaladas!`);
}
