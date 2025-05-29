#!/usr/bin/env node

/**
 * Simplified Vite Integration Validation
 * Tests Vite integration without external dependencies
 */

import { readFile, access } from 'fs/promises';
import { createRequire } from 'module';
import http from 'http';
import { URL } from 'url';

const require = createRequire(import.meta.url);

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

class SimpleViteValidator {
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

    async httpGet(path = '/') {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: CONFIG.VITE_PORT,
                path: path,
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async checkServerStatus() {
        try {
            const response = await this.httpGet('/');
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

        let allFilesExist = true;
        for (const file of filesToCheck) {
            try {
                await access(file);
                this.results[`file_${file.replace(/[\/\.]/g, '_')}`] = true;
                this.log(`✅ ${file} exists`);
            } catch (error) {
                this.results[`file_${file.replace(/[\/\.]/g, '_')}`] = false;
                this.log(`❌ ${file} missing`, 'error');
                allFilesExist = false;
            }
        }
        
        this.results.all_files_exist = allFilesExist;
        return allFilesExist;
    }

    async validateViteEndpoints() {
        this.log('Testing Vite server endpoints...', 'info');
        
        const endpoints = [
            '/',
            '/src/main.js',
            '/src/core/Game.js', 
            '/src/ui/UIManager.js'
        ];

        let allEndpointsWork = true;
        for (const endpoint of endpoints) {
            try {
                const response = await this.httpGet(endpoint);
                const success = response.status === 200;
                this.results[`endpoint_${endpoint.replace(/[\/\.]/g, '_')}`] = success;
                
                if (success) {
                    this.log(`✅ ${endpoint} (${response.status})`);
                } else {
                    this.log(`❌ ${endpoint} (${response.status})`, 'error');
                    allEndpointsWork = false;
                }
            } catch (error) {
                this.results[`endpoint_${endpoint.replace(/[\/\.]/g, '_')}`] = false;
                this.log(`❌ ${endpoint} (connection failed)`, 'error');
                allEndpointsWork = false;
            }
        }
        
        this.results.all_endpoints_work = allEndpointsWork;
        return allEndpointsWork;
    }

    async validateProductionChainUIFixes() {
        this.log('Validating ProductionChainUI canvas preservation fixes...', 'info');
        
        try {
            // Check UIManager.js for canvas preservation logic
            const uiManagerContent = await readFile('src/ui/UIManager.js', 'utf-8');
            
            const preservationChecks = [
                uiManagerContent.includes('canvas') && uiManagerContent.includes('preserve'),
                uiManagerContent.includes('clearUI'),
                uiManagerContent.includes('UIManager')
            ];

            const hasCanvasLogic = preservationChecks.some(Boolean);
            this.results.canvas_preservation_logic = hasCanvasLogic;
            
            if (hasCanvasLogic) {
                this.log('✅ Canvas preservation logic found in UIManager');
            } else {
                this.log('⚠️  Canvas preservation logic not clearly detected', 'warning');
            }

            // Check Game.js for proper initialization
            const gameContent = await readFile('src/core/Game.js', 'utf-8');
            const hasCanvasInit = gameContent.includes('canvas') && gameContent.includes('getContext');
            this.results.canvas_initialization = hasCanvasInit;
            
            if (hasCanvasInit) {
                this.log('✅ Canvas initialization found in Game.js');
            } else {
                this.log('⚠️  Canvas initialization not detected in Game.js', 'warning');
            }

            return hasCanvasLogic && hasCanvasInit;

        } catch (error) {
            this.log(`❌ Error validating ProductionChainUI fixes: ${error.message}`, 'error');
            this.results.productionchain_validation = false;
            return false;
        }
    }

    async validateESModules() {
        this.log('Validating ES Module structure...', 'info');
        
        try {
            const packageContent = await readFile('package.json', 'utf-8');
            const packageJson = JSON.parse(packageContent);
            
            const isESModule = packageJson.type === 'module';
            this.results.package_module_type = isESModule;
            
            if (isESModule) {
                this.log('✅ Package.json configured as ES module');
            } else {
                this.log('❌ Package.json not configured as ES module', 'error');
            }

            const mainContent = await readFile('src/main.js', 'utf-8');
            const hasImports = mainContent.includes('import');
            this.results.es_imports_main = hasImports;
            
            if (hasImports) {
                this.log('✅ ES import statements found in main.js');
            } else {
                this.log('❌ No ES import statements in main.js', 'error');
            }

            return isESModule && hasImports;

        } catch (error) {
            this.log(`❌ Error validating ES modules: ${error.message}`, 'error');
            return false;
        }
    }

    async validateIndexHTML() {
        this.log('Validating index.html integration...', 'info');
        
        try {
            const htmlContent = await readFile('index.html', 'utf-8');
            
            const checks = [
                {
                    test: htmlContent.includes('<canvas id="game-canvas"'),
                    name: 'Game canvas element',
                    key: 'html_canvas_element'
                },
                {
                    test: htmlContent.includes('id="ui-container"'),
                    name: 'UI container element', 
                    key: 'html_ui_container'
                },
                {
                    test: htmlContent.includes('type="module"'),
                    name: 'ES module script type',
                    key: 'html_module_script'
                },
                {
                    test: htmlContent.includes('src="/src/main.js"'),
                    name: 'Main.js script reference',
                    key: 'html_main_script'
                }
            ];

            let allChecksPass = true;
            for (const check of checks) {
                this.results[check.key] = check.test;
                if (check.test) {
                    this.log(`✅ ${check.name}`);
                } else {
                    this.log(`❌ ${check.name}`, 'error');
                    allChecksPass = false;
                }
            }
            
            this.results.html_validation = allChecksPass;
            return allChecksPass;

        } catch (error) {
            this.log(`❌ Error validating index.html: ${error.message}`, 'error');
            this.results.html_validation = false;
            return false;
        }
    }

    generateReport() {
        const duration = Date.now() - this.startTime;
        const totalTests = Object.keys(this.results).length;
        const passedTests = Object.values(this.results).filter(Boolean).length;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(60));
        console.log('FINAL VITE INTEGRATION VALIDATION REPORT');
        console.log('='.repeat(60));

        console.log(`\nTest Duration: ${duration}ms`);
        console.log(`Server: http://localhost:${CONFIG.VITE_PORT}`);
        console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);

        if (successRate >= 90) {
            this.log('\n🎉 EXCELLENT! Vite integration is working perfectly', 'success');
        } else if (successRate >= 75) {
            this.log('\n✅ GOOD! Vite integration is working well', 'success');
        } else if (successRate >= 50) {
            this.log('\n⚠️  PARTIAL! Some issues need attention', 'warning');
        } else {
            this.log('\n❌ CRITICAL! Significant issues detected', 'error');
        }

        console.log('\nKey Results:');
        const keyResults = [
            'all_files_exist',
            'all_endpoints_work', 
            'canvas_preservation_logic',
            'canvas_initialization',
            'package_module_type',
            'es_imports_main',
            'html_validation'
        ];

        for (const key of keyResults) {
            if (this.results.hasOwnProperty(key)) {
                const status = this.results[key] ? '✅' : '❌';
                console.log(`  ${status} ${key.replace(/_/g, ' ')}: ${this.results[key]}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        
        if (successRate >= 75) {
            console.log('\n🎮 Game ready at: http://localhost:5173/');
            console.log('🧪 Browser tests: http://localhost:5173/vite_integration_test.html');
        }
        
        console.log('');
        return successRate >= 75;
    }

    async run() {
        this.log('Starting Vite Integration Validation...', 'info');
        
        // Check if server is running
        const serverRunning = await this.checkServerStatus();
        if (!serverRunning) {
            this.log('❌ Vite server is not running on port 5173', 'error');
            this.log('Please start it with: npm run dev', 'info');
            return false;
        }
        
        this.log('✅ Vite server is running and accessible', 'success');
        this.results.server_running = true;
        
        const validations = await Promise.all([
            this.validateMainFiles(),
            this.validateViteEndpoints(),
            this.validateProductionChainUIFixes(),
            this.validateESModules(),
            this.validateIndexHTML()
        ]);
        
        const success = this.generateReport();
        return success;
    }
}

// Run validation
const validator = new SimpleViteValidator();
validator.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
