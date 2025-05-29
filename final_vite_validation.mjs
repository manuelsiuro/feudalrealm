#!/usr/bin/env node

/**
 * Final Vite Integration Validation
 * 
 * This script performs comprehensive validation of the Vite integration
 * with special focus on ProductionChainUI canvas preservation fixes.
 */

import { spawn } from 'child_process';
import { readFile, access } from 'fs/promises';
import fetch from 'node-fetch';

const CONFIG = {
    VITE_PORT: 5173,
    COLORS: {
        GREEN: '\x1b[32m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        RESET: '\x1b[0m',
        BOLD: '\x1b[1m'
    }
};

class FinalViteValidator {
    constructor() {
        this.results = {};
        this.startTime = Date.now();
    }

    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = CONFIG.COLORS;
        
        const prefixes = {
            info: `${colors.BLUE}ℹ️ `,
            success: `${colors.GREEN}✅`,
            error: `${colors.RED}❌`,
            warning: `${colors.YELLOW}⚠️ `
        };
        
        console.log(`[${timestamp}] ${prefixes[level] || ''}${message}${colors.RESET}`);
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`http://localhost:${CONFIG.VITE_PORT}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async validateMainFiles() {
        this.log('Validating main application files...', 'info');
        
        const filesToCheck = [
            'index.html',
            'src/main.js', 
            'src/core/Game.js',
            'src/ui/UIManager.js',
            'package.json'
        ];

        for (const file of filesToCheck) {
            try {
                await access(file);
                this.results[`file_${file.replace(/[\/\.]/g, '_')}`] = true;
                this.log(`✅ ${file} exists`);
            } catch (error) {
                this.results[`file_${file.replace(/[\/\.]/g, '_')}`] = false;
                this.log(`❌ ${file} missing`, 'error');
            }
        }
    }

    async validateViteEndpoints() {
        this.log('Testing Vite server endpoints...', 'info');
        
        const endpoints = [
            '/',
            '/src/main.js',
            '/src/core/Game.js', 
            '/src/ui/UIManager.js',
            '/src/style.css'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://localhost:${CONFIG.VITE_PORT}${endpoint}`);
                const success = response.status === 200;
                this.results[`endpoint_${endpoint.replace(/[\/\.]/g, '_')}`] = success;
                
                if (success) {
                    this.log(`✅ ${endpoint} (${response.status})`);
                } else {
                    this.log(`❌ ${endpoint} (${response.status})`, 'error');
                }
            } catch (error) {
                this.results[`endpoint_${endpoint.replace(/[\/\.]/g, '_')}`] = false;
                this.log(`❌ ${endpoint} (connection failed)`, 'error');
            }
        }
    }

    async validateProductionChainUIFixes() {
        this.log('Validating ProductionChainUI canvas preservation fixes...', 'info');
        
        try {
            // Check UIManager.js for canvas preservation logic
            const uiManagerContent = await readFile('src/ui/UIManager.js', 'utf-8');
            
            const canvasPreservationChecks = [
                {
                    check: uiManagerContent.includes('preserveCanvasContent'),
                    name: 'Canvas content preservation method',
                    key: 'canvas_preservation_method'
                },
                {
                    check: uiManagerContent.includes('restoreCanvasContent'), 
                    name: 'Canvas content restoration method',
                    key: 'canvas_restoration_method'
                },
                {
                    check: uiManagerContent.includes('clearUI') && uiManagerContent.includes('preserveCanvasContent'),
                    name: 'Canvas preservation in clearUI',
                    key: 'canvas_preservation_in_clearui'
                }
            ];

            for (const check of canvasPreservationChecks) {
                this.results[check.key] = check.check;
                if (check.check) {
                    this.log(`✅ ${check.name} implemented`);
                } else {
                    this.log(`⚠️  ${check.name} not found`, 'warning');
                }
            }

            // Check Game.js for proper initialization
            const gameContent = await readFile('src/core/Game.js', 'utf-8');
            const gameInitChecks = [
                {
                    check: gameContent.includes('canvas') && gameContent.includes('getContext'),
                    name: 'Canvas context initialization',
                    key: 'canvas_context_init'
                },
                {
                    check: gameContent.includes('UIManager'),
                    name: 'UIManager integration',
                    key: 'uimanager_integration'
                }
            ];

            for (const check of gameInitChecks) {
                this.results[check.key] = check.check;
                if (check.check) {
                    this.log(`✅ ${check.name} found in Game.js`);
                } else {
                    this.log(`⚠️  ${check.name} not found in Game.js`, 'warning');
                }
            }

        } catch (error) {
            this.log(`❌ Error validating ProductionChainUI fixes: ${error.message}`, 'error');
            this.results.productionchain_validation = false;
        }
    }

    async validateESModules() {
        this.log('Validating ES Module structure...', 'info');
        
        try {
            const mainContent = await readFile('src/main.js', 'utf-8');
            const packageContent = await readFile('package.json', 'utf-8');
            const packageJson = JSON.parse(packageContent);

            const moduleChecks = [
                {
                    check: packageJson.type === 'module',
                    name: 'Package.json module type',
                    key: 'package_module_type'
                },
                {
                    check: mainContent.includes('import'),
                    name: 'ES import statements in main.js',
                    key: 'es_imports_main'
                },
                {
                    check: mainContent.includes('Game') && mainContent.includes('import'),
                    name: 'Game class import',
                    key: 'game_class_import'
                }
            ];

            for (const check of moduleChecks) {
                this.results[check.key] = check.check;
                if (check.check) {
                    this.log(`✅ ${check.name}`);
                } else {
                    this.log(`❌ ${check.name}`, 'error');
                }
            }

        } catch (error) {
            this.log(`❌ Error validating ES modules: ${error.message}`, 'error');
        }
    }

    async validateIndexHTML() {
        this.log('Validating index.html integration...', 'info');
        
        try {
            const htmlContent = await readFile('index.html', 'utf-8');
            
            const htmlChecks = [
                {
                    check: htmlContent.includes('<canvas id="game-canvas"'),
                    name: 'Game canvas element',
                    key: 'html_canvas_element'
                },
                {
                    check: htmlContent.includes('id="ui-container"'),
                    name: 'UI container element', 
                    key: 'html_ui_container'
                },
                {
                    check: htmlContent.includes('type="module"'),
                    name: 'ES module script type',
                    key: 'html_module_script'
                },
                {
                    check: htmlContent.includes('src="/src/main.js"'),
                    name: 'Main.js script reference',
                    key: 'html_main_script'
                },
                {
                    check: htmlContent.includes('href="/src/style.css"'),
                    name: 'CSS stylesheet reference',
                    key: 'html_css_reference'
                }
            ];

            for (const check of htmlChecks) {
                this.results[check.key] = check.check;
                if (check.check) {
                    this.log(`✅ ${check.name}`);
                } else {
                    this.log(`❌ ${check.name}`, 'error');
                }
            }

        } catch (error) {
            this.log(`❌ Error validating index.html: ${error.message}`, 'error');
        }
    }

    generateReport() {
        const duration = Date.now() - this.startTime;
        const totalTests = Object.keys(this.results).length;
        const passedTests = Object.values(this.results).filter(Boolean).length;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        console.log('\n============================================================');
        console.log('FINAL VITE INTEGRATION VALIDATION REPORT');
        console.log('============================================================\n');

        console.log(`Test Duration: ${duration}ms`);
        console.log(`Server: http://localhost:${CONFIG.VITE_PORT}`);
        console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate}%)\n`);

        if (successRate >= 90) {
            this.log('🎉 EXCELLENT! Vite integration is working perfectly', 'success');
        } else if (successRate >= 75) {
            this.log('✅ GOOD! Vite integration is working well with minor issues', 'success');
        } else if (successRate >= 50) {
            this.log('⚠️  PARTIAL! Vite integration has some issues that need attention', 'warning');
        } else {
            this.log('❌ FAILED! Vite integration has significant issues', 'error');
        }

        console.log('\nDetailed Results:');
        for (const [key, result] of Object.entries(this.results)) {
            const status = result ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${result}`);
        }

        console.log('\n============================================================');
        
        if (successRate >= 75) {
            console.log('\n🎮 Your game is ready! Visit http://localhost:5173/ to play');
            console.log('🧪 Run browser tests at http://localhost:5173/vite_integration_test.html');
        }
        
        console.log('\n');
    }

    async run() {
        this.log('Starting Final Vite Integration Validation...', 'info');
        
        // Check if server is running
        const serverRunning = await this.checkServerStatus();
        if (!serverRunning) {
            this.log('❌ Vite server is not running on port 5173', 'error');
            this.log('Please start it with: npm run dev', 'info');
            return;
        }
        
        this.log('✅ Vite server is running', 'success');
        
        await this.validateMainFiles();
        await this.validateViteEndpoints();
        await this.validateProductionChainUIFixes();
        await this.validateESModules();
        await this.validateIndexHTML();
        
        this.generateReport();
    }
}

// Run validation
const validator = new FinalViteValidator();
validator.run().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
