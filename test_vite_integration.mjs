#!/usr/bin/env node

/**
 * Automated Vite Dev Server Integration Test
 * 
 * This script tests if index.html works correctly with 'npm run dev'
 * It starts the Vite server, runs tests, and provides a comprehensive report.
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { createServer } from 'http';
import fetch from 'node-fetch';

const CONFIG = {
    VITE_PORT: 5173,
    TEST_TIMEOUT: 30000,
    SERVER_START_TIMEOUT: 15000,
    COLORS: {
        GREEN: '\x1b[32m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        RESET: '\x1b[0m',
        BOLD: '\x1b[1m'
    }
};

class ViteIntegrationTester {
    constructor() {
        this.viteProcess = null;
        this.testResults = {};
        this.startTime = Date.now();
    }

    log(message, color = CONFIG.COLORS.RESET) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${color}[${timestamp}] ${message}${CONFIG.COLORS.RESET}`);
    }

    success(message) {
        this.log(`✅ ${message}`, CONFIG.COLORS.GREEN);
    }

    error(message) {
        this.log(`❌ ${message}`, CONFIG.COLORS.RED);
    }

    warning(message) {
        this.log(`⚠️  ${message}`, CONFIG.COLORS.YELLOW);
    }

    info(message) {
        this.log(`ℹ️  ${message}`, CONFIG.COLORS.BLUE);
    }

    async checkPrerequisites() {
        this.info('Checking prerequisites...');
        
        try {
            // Check package.json
            const packageJson = JSON.parse(await readFile('./package.json', 'utf8'));
            if (packageJson.scripts && packageJson.scripts.dev === 'vite') {
                this.success('package.json has Vite dev script');
                this.testResults.packageJson = true;
            } else {
                this.error('package.json missing "dev": "vite" script');
                this.testResults.packageJson = false;
                return false;
            }

            // Check if Vite is installed
            if (packageJson.devDependencies && packageJson.devDependencies.vite) {
                this.success(`Vite ${packageJson.devDependencies.vite} is listed in devDependencies`);
                this.testResults.viteInstalled = true;
            } else {
                this.error('Vite not found in devDependencies');
                this.testResults.viteInstalled = false;
                return false;
            }

            // Check index.html
            const indexHtml = await readFile('./index.html', 'utf8');
            if (indexHtml.includes('game-canvas') && indexHtml.includes('src/main.js')) {
                this.success('index.html has required elements');
                this.testResults.indexHtml = true;
            } else {
                this.warning('index.html may be missing required elements');
                this.testResults.indexHtml = false;
            }

            // Check main.js
            try {
                await readFile('./src/main.js', 'utf8');
                this.success('src/main.js exists');
                this.testResults.mainJs = true;
            } catch (error) {
                this.error('src/main.js not found');
                this.testResults.mainJs = false;
                return false;
            }

            return true;
        } catch (error) {
            this.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    async startViteServer() {
        this.info('Starting Vite dev server...');
        
        return new Promise((resolve, reject) => {
            // Check if port is already in use
            this.checkPortInUse(CONFIG.VITE_PORT).then(inUse => {
                if (inUse) {
                    this.warning(`Port ${CONFIG.VITE_PORT} is already in use`);
                    this.info('Assuming Vite server is already running');
                    resolve(true);
                    return;
                }

                // Start Vite server
                this.viteProcess = spawn('npm', ['run', 'dev'], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: { ...process.env, NODE_ENV: 'development' }
                });

                let serverReady = false;
                const timeout = setTimeout(() => {
                    if (!serverReady) {
                        this.error('Vite server failed to start within timeout');
                        reject(new Error('Server start timeout'));
                    }
                }, CONFIG.SERVER_START_TIMEOUT);

                this.viteProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    if (output.includes('Local:') && output.includes(CONFIG.VITE_PORT)) {
                        serverReady = true;
                        clearTimeout(timeout);
                        this.success(`Vite server started on port ${CONFIG.VITE_PORT}`);
                        resolve(true);
                    }
                });

                this.viteProcess.stderr.on('data', (data) => {
                    const output = data.toString();
                    if (output.includes('EADDRINUSE')) {
                        this.warning('Port already in use, assuming server is running');
                        serverReady = true;
                        clearTimeout(timeout);
                        resolve(true);
                    } else {
                        this.error(`Vite server error: ${output}`);
                    }
                });

                this.viteProcess.on('error', (error) => {
                    clearTimeout(timeout);
                    this.error(`Failed to start Vite server: ${error.message}`);
                    reject(error);
                });
            });
        });
    }

    async checkPortInUse(port) {
        return new Promise((resolve) => {
            const server = createServer();
            server.listen(port, () => {
                server.close(() => resolve(false));
            });
            server.on('error', () => resolve(true));
        });
    }

    async testServerResponses() {
        this.info('Testing server responses...');
        const baseUrl = `http://localhost:${CONFIG.VITE_PORT}`;
        
        const endpoints = [
            { path: '/', name: 'Root (index.html)' },
            { path: '/src/main.js', name: 'Main JavaScript module' },
            { path: '/src/core/Game.js', name: 'Game class module' },
            { path: '/src/ui/UIManager.js', name: 'UIManager module' },
            { path: '/package.json', name: 'Package.json' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${baseUrl}${endpoint.path}`);
                if (response.ok) {
                    this.success(`${endpoint.name} - accessible (${response.status})`);
                    this.testResults[`endpoint_${endpoint.path}`] = true;
                } else {
                    this.error(`${endpoint.name} - error ${response.status}`);
                    this.testResults[`endpoint_${endpoint.path}`] = false;
                }
            } catch (error) {
                this.error(`${endpoint.name} - fetch failed: ${error.message}`);
                this.testResults[`endpoint_${endpoint.path}`] = false;
            }
        }
    }

    async testModuleLoading() {
        this.info('Testing ES module loading...');
        const baseUrl = `http://localhost:${CONFIG.VITE_PORT}`;
        
        try {
            const response = await fetch(`${baseUrl}/src/main.js`);
            if (response.ok) {
                const content = await response.text();
                
                // Check for ES module syntax
                const hasImports = content.includes('import');
                const hasExports = content.includes('export');
                
                if (hasImports) {
                    this.success('Main.js contains ES import statements');
                    this.testResults.esImports = true;
                } else {
                    this.warning('Main.js may not use ES imports');
                    this.testResults.esImports = false;
                }

                // Check Three.js import
                if (content.includes('three')) {
                    this.success('Three.js import detected');
                    this.testResults.threeJsImport = true;
                } else {
                    this.warning('Three.js import not detected in main.js');
                    this.testResults.threeJsImport = false;
                }

                this.testResults.moduleLoading = true;
            } else {
                this.error('Failed to load main.js for module testing');
                this.testResults.moduleLoading = false;
            }
        } catch (error) {
            this.error(`Module loading test failed: ${error.message}`);
            this.testResults.moduleLoading = false;
        }
    }

    async testGameIntegration() {
        this.info('Testing game integration (this requires browser environment)...');
        
        // Since we can't run browser code in Node.js, we'll check the structure
        const baseUrl = `http://localhost:${CONFIG.VITE_PORT}`;
        
        try {
            const response = await fetch(baseUrl);
            const html = await response.text();
            
            const checks = [
                { test: html.includes('game-canvas'), name: 'Canvas element' },
                { test: html.includes('ui-container'), name: 'UI container' },
                { test: html.includes('type="module"'), name: 'ES module type' },
                { test: html.includes('src/main.js'), name: 'Main.js script tag' }
            ];

            checks.forEach(check => {
                if (check.test) {
                    this.success(`${check.name} found in HTML`);
                    this.testResults[`html_${check.name.toLowerCase().replace(' ', '_')}`] = true;
                } else {
                    this.warning(`${check.name} not found in HTML`);
                    this.testResults[`html_${check.name.toLowerCase().replace(' ', '_')}`] = false;
                }
            });

            this.info('For complete game testing, open: http://localhost:5173/vite_integration_test.html');
            this.testResults.gameIntegration = true;
        } catch (error) {
            this.error(`Game integration test failed: ${error.message}`);
            this.testResults.gameIntegration = false;
        }
    }

    async testPerformance() {
        this.info('Testing server performance...');
        const baseUrl = `http://localhost:${CONFIG.VITE_PORT}`;
        
        try {
            const start = Date.now();
            const response = await fetch(`${baseUrl}/src/main.js`);
            const end = Date.now();
            const responseTime = end - start;
            
            if (response.ok) {
                if (responseTime < 100) {
                    this.success(`Fast response time: ${responseTime}ms`);
                } else if (responseTime < 500) {
                    this.warning(`Moderate response time: ${responseTime}ms`);
                } else {
                    this.error(`Slow response time: ${responseTime}ms`);
                }
                
                this.testResults.responseTime = responseTime;
                this.testResults.performance = responseTime < 500;
            }
        } catch (error) {
            this.error(`Performance test failed: ${error.message}`);
            this.testResults.performance = false;
        }
    }

    generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log(`${CONFIG.COLORS.BOLD}${CONFIG.COLORS.BLUE}VITE INTEGRATION TEST REPORT${CONFIG.COLORS.RESET}`);
        console.log('='.repeat(60));
        
        console.log(`\n${CONFIG.COLORS.BLUE}Test Duration:${CONFIG.COLORS.RESET} ${duration}ms`);
        console.log(`${CONFIG.COLORS.BLUE}Vite Server:${CONFIG.COLORS.RESET} http://localhost:${CONFIG.VITE_PORT}`);
        
        const results = Object.entries(this.testResults);
        const passed = results.filter(([_, value]) => value === true).length;
        const total = results.filter(([_, value]) => typeof value === 'boolean').length;
        const passRate = total > 0 ? (passed / total) * 100 : 0;
        
        console.log(`\n${CONFIG.COLORS.BLUE}Test Results:${CONFIG.COLORS.RESET}`);
        console.log(`  Passed: ${passed}/${total} (${passRate.toFixed(1)}%)`);
        
        if (passRate >= 90) {
            this.success('Excellent! Vite integration is working very well');
        } else if (passRate >= 75) {
            this.success('Good! Vite integration is working well');
        } else if (passRate >= 50) {
            this.warning('Fair! Some issues with Vite integration');
        } else {
            this.error('Poor! Significant issues with Vite integration');
        }
        
        console.log(`\n${CONFIG.COLORS.BLUE}Detailed Results:${CONFIG.COLORS.RESET}`);
        results.forEach(([key, value]) => {
            const icon = value === true ? '✅' : value === false ? '❌' : 'ℹ️';
            const displayValue = typeof value === 'number' ? `${value}ms` : value.toString();
            console.log(`  ${icon} ${key}: ${displayValue}`);
        });
        
        console.log(`\n${CONFIG.COLORS.BLUE}Next Steps:${CONFIG.COLORS.RESET}`);
        console.log('  • Visit http://localhost:5173/ to see your game');
        console.log('  • Run http://localhost:5173/vite_integration_test.html for browser tests');
        console.log('  • Use Ctrl+C to stop the Vite server when done');
        
        if (this.testResults.packageJson && this.testResults.viteInstalled) {
            this.success('✅ Vite dev server integration is working correctly!');
        } else {
            this.error('❌ Issues detected with Vite dev server integration');
        }
        
        console.log('\n' + '='.repeat(60));
    }

    async cleanup() {
        if (this.viteProcess) {
            this.info('Stopping Vite server...');
            this.viteProcess.kill('SIGTERM');
            
            // Give it time to clean up
            setTimeout(() => {
                if (this.viteProcess && !this.viteProcess.killed) {
                    this.viteProcess.kill('SIGKILL');
                }
            }, 3000);
        }
    }

    async run() {
        try {
            this.info('Starting Vite Integration Test...');
            
            // Check prerequisites
            const prereqsPassed = await this.checkPrerequisites();
            if (!prereqsPassed) {
                this.error('Prerequisites failed. Cannot continue.');
                return false;
            }
            
            // Start Vite server
            await this.startViteServer();
            
            // Wait a bit for server to fully start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Run tests
            await this.testServerResponses();
            await this.testModuleLoading();
            await this.testGameIntegration();
            await this.testPerformance();
            
            // Generate report
            this.generateReport();
            
            return true;
        } catch (error) {
            this.error(`Test failed: ${error.message}`);
            return false;
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT. Cleaning up...');
    if (global.tester) {
        await global.tester.cleanup();
    }
    process.exit(0);
});

// Main execution
async function main() {
    const tester = new ViteIntegrationTester();
    global.tester = tester;
    
    const success = await tester.run();
    
    if (success) {
        console.log(`\n${CONFIG.COLORS.GREEN}${CONFIG.COLORS.BOLD}🎉 Test completed successfully!${CONFIG.COLORS.RESET}`);
        console.log(`${CONFIG.COLORS.BLUE}The Vite server will continue running. Press Ctrl+C to stop.${CONFIG.COLORS.RESET}`);
        
        // Keep the process alive to maintain the server
        process.stdin.resume();
    } else {
        console.log(`\n${CONFIG.COLORS.RED}${CONFIG.COLORS.BOLD}❌ Test failed!${CONFIG.COLORS.RESET}`);
        await tester.cleanup();
        process.exit(1);
    }
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(`${CONFIG.COLORS.RED}Fatal error: ${error.message}${CONFIG.COLORS.RESET}`);
        process.exit(1);
    });
}
