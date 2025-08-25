#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.summary = {
      typeErrors: 0,
      lintErrors: 0,
      importErrors: 0,
      circularDeps: 0,
      unusedFiles: 0
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async runCommand(command, description) {
    this.log(`\n🔍 ${description}...`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(`✅ ${description} - Sin errores`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} - Errores encontrados`, 'error');
      return { success: false, output: error.stdout || error.message };
    }
  }

  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        errors.push(line.trim());
        this.summary.typeErrors++;
      }
    }
    
    return errors;
  }

  parseESLintErrors(output) {
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('error') || line.includes('warning')) {
        errors.push(line.trim());
        if (line.includes('error')) {
          this.summary.lintErrors++;
        }
      }
    }
    
    return errors;
  }

  parseCircularDependencies(output) {
    const lines = output.split('\n');
    const circles = [];
    
    for (const line of lines) {
      if (line.includes('->') && line.includes('.ts')) {
        circles.push(line.trim());
        this.summary.circularDeps++;
      }
    }
    
    return circles;
  }

  async checkTypes() {
    const result = await this.runCommand(
      'npx tsc --noEmit --pretty false',
      'Verificando tipos de TypeScript'
    );
    
    if (!result.success) {
      const typeErrors = this.parseTypeScriptErrors(result.output);
      this.errors.push({
        category: 'TypeScript',
        errors: typeErrors
      });
    }
    
    return result.success;
  }

  async checkLinting() {
    const result = await this.runCommand(
      'npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings=0',
      'Verificando reglas de ESLint'
    );
    
    if (!result.success) {
      const lintErrors = this.parseESLintErrors(result.output);
      this.errors.push({
        category: 'ESLint',
        errors: lintErrors
      });
    }
    
    return result.success;
  }

  async checkCircularDependencies() {
    const result = await this.runCommand(
      'npx madge --ts-config tsconfig.json --extensions ts,tsx,js,jsx --circular .',
      'Verificando dependencias circulares'
    );
    
    if (!result.success) {
      const circles = this.parseCircularDependencies(result.output);
      if (circles.length > 0) {
        this.errors.push({
          category: 'Dependencias Circulares',
          errors: circles
        });
      }
    }
    
    return result.success;
  }

  async checkUnusedFiles() {
    const result = await this.runCommand(
      'npx ts-prune',
      'Verificando archivos no utilizados'
    );
    
    if (result.output && result.output.trim()) {
      const unusedFiles = result.output.split('\n').filter(line => line.trim());
      if (unusedFiles.length > 0) {
        this.summary.unusedFiles = unusedFiles.length;
        this.warnings.push({
          category: 'Archivos no utilizados',
          warnings: unusedFiles
        });
      }
    }
    
    return true;
  }

  printSummary() {
    this.log('\n📊 RESUMEN DE VERIFICACIÓN', 'info');
    this.log('=' .repeat(50), 'info');
    
    const totalErrors = this.summary.typeErrors + this.summary.lintErrors + this.summary.circularDeps;
    
    if (totalErrors === 0) {
      this.log('🎉 ¡Excelente! No se encontraron errores críticos.', 'success');
    } else {
      this.log(`❌ Total de errores encontrados: ${totalErrors}`, 'error');
      this.log(`   - Errores de TypeScript: ${this.summary.typeErrors}`, 'error');
      this.log(`   - Errores de ESLint: ${this.summary.lintErrors}`, 'error');
      this.log(`   - Dependencias circulares: ${this.summary.circularDeps}`, 'error');
    }
    
    if (this.summary.unusedFiles > 0) {
      this.log(`⚠️  Archivos no utilizados: ${this.summary.unusedFiles}`, 'warning');
    }
    
    this.log('\n📋 ERRORES DETALLADOS', 'info');
    this.log('=' .repeat(50), 'info');
    
    if (this.errors.length === 0) {
      this.log('✅ No hay errores que mostrar.', 'success');
    } else {
      this.errors.forEach((errorGroup, index) => {
        this.log(`\n${index + 1}. ${errorGroup.category}:`, 'error');
        errorGroup.errors.forEach((error, errorIndex) => {
          this.log(`   ${errorIndex + 1}. ${error}`, 'error');
        });
      });
    }
    
    if (this.warnings.length > 0) {
      this.log('\n⚠️  ADVERTENCIAS', 'warning');
      this.log('=' .repeat(50), 'warning');
      
      this.warnings.forEach((warningGroup, index) => {
        this.log(`\n${index + 1}. ${warningGroup.category}:`, 'warning');
        warningGroup.warnings.slice(0, 10).forEach((warning, warningIndex) => {
          this.log(`   ${warningIndex + 1}. ${warning}`, 'warning');
        });
        if (warningGroup.warnings.length > 10) {
          this.log(`   ... y ${warningGroup.warnings.length - 10} más`, 'warning');
        }
      });
    }
    
    return totalErrors === 0;
  }

  async run() {
    this.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DEL PROYECTO', 'info');
    this.log('=' .repeat(60), 'info');
    
    const checks = [
      () => this.checkTypes(),
      () => this.checkLinting(),
      () => this.checkCircularDependencies(),
      () => this.checkUnusedFiles()
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      const passed = await check();
      if (!passed) allPassed = false;
    }
    
    const success = this.printSummary();
    
    if (success) {
      this.log('\n🎯 ¡El proyecto está listo para el build!', 'success');
      process.exit(0);
    } else {
      this.log('\n🛑 Corrige los errores antes de hacer el build.', 'error');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const checker = new BuildChecker();
  checker.run().catch(console.error);
}

module.exports = BuildChecker;