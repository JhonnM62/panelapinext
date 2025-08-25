#!/usr/bin/env node

const { execSync } = require('child_process');

class QuickChecker {
  constructor() {
    this.colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
  }

  log(message, type = 'info') {
    console.log(`${this.colors[type]}${message}${this.colors.reset}`);
  }

  async checkTypes() {
    this.log('\n🔍 Verificando errores de TypeScript...', 'info');
    
    try {
      execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      this.log('✅ ¡Sin errores de TypeScript!', 'success');
      return true;
    } catch (error) {
      const output = error.stdout || error.message;
      const lines = output.split('\n');
      const errors = [];
      
      for (const line of lines) {
        if (line.includes('error TS')) {
          errors.push(line.trim());
        }
      }
      
      if (errors.length === 0) {
        this.log('✅ ¡Sin errores de TypeScript!', 'success');
        return true;
      }
      
      this.log(`❌ Encontrados ${errors.length} errores de TypeScript:`, 'error');
      this.log('=' .repeat(60), 'error');
      
      // Agrupar errores por archivo
      const errorsByFile = {};
      
      errors.forEach(error => {
        const match = error.match(/^(.+?)\(\d+,\d+\): (.+)$/);
        if (match) {
          const [, filePath, errorMsg] = match;
          if (!errorsByFile[filePath]) {
            errorsByFile[filePath] = [];
          }
          errorsByFile[filePath].push(errorMsg);
        }
      });
      
      // Mostrar errores agrupados por archivo
      Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
        this.log(`\n📁 ${file}:`, 'bold');
        fileErrors.forEach((error, index) => {
          this.log(`   ${index + 1}. ${error}`, 'error');
        });
      });
      
      this.log(`\n💡 Total: ${errors.length} errores en ${Object.keys(errorsByFile).length} archivos`, 'warning');
      
      return false;
    }
  }

  async run() {
    this.log('🚀 VERIFICACIÓN RÁPIDA DE TYPESCRIPT', 'bold');
    
    const success = await this.checkTypes();
    
    if (success) {
      this.log('\n🎉 ¡Proyecto listo para build!', 'success');
      process.exit(0);
    } else {
      this.log('\n🛠️  Corrige los errores de TypeScript antes del build.', 'warning');
      this.log('\n💡 Tip: Usa "npm run check:build" para ver todos los tipos de errores.', 'info');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const checker = new QuickChecker();
  checker.run().catch(console.error);
}

module.exports = QuickChecker;