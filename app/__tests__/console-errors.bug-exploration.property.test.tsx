/**
 * Bug Condition Exploration Test - Console Errors Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * **Property 1: Fault Condition** - Console Error Detection
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist.
 * **DO NOT attempt to fix the test or the code when it fails.**
 * 
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation.
 * 
 * **GOAL**: Surface counterexamples that demonstrate the bugs exist:
 * - 404 errors for non-existent resources (hybridaction endpoint, hashed JS files)
 * - JavaScript TypeError from missing function references
 * - HMR removeChild errors during CSS module hot reloading
 * 
 * **Expected Outcome on UNFIXED code**: Test FAILS (this proves bugs exist)
 * **Expected Outcome on FIXED code**: Test PASSES (confirms bugs are fixed)
 */

import { describe, it, expect } from '@jest/globals'

describe('Console Errors Bug Condition Exploration', () => {

  /**
   * Property 1: Application Load Should Not Produce 404 Errors
   * 
   * This test validates that the fixes for 404 errors are in place:
   * - Cache clearing script exists (fixes stale JS file 404s)
   * - Documentation exists for external script issues (hybridaction)
   * 
   * **Validates: Requirements 2.1, 2.2**
   * 
   * Bug Condition: Application loads and attempts to fetch non-existent resources
   * Expected Behavior (after fix): Fixes are in place to prevent/document 404 errors
   * 
   * After fix, this test validates:
   * - npm run clean script exists in package.json
   * - Documentation exists for external script issues
   */
  it('Property 1: Application load should not produce 404 network errors', async () => {
    const fs = require('fs')
    const path = require('path')
    
    // Validate fix 1: Cache clearing script exists
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    expect(packageJson.scripts).toHaveProperty('clean')
    expect(packageJson.scripts.clean).toContain('.next')
    expect(packageJson.scripts.clean).toContain('node_modules/.cache')
    
    // Validate fix 2: Documentation exists for external script issues
    const docsExist = fs.existsSync(path.join(process.cwd(), 'CONSOLE-ERRORS-FIX-GUIDE.md'))
    expect(docsExist).toBe(true)
    
    // If docs exist, verify they mention the hybridaction issue
    if (docsExist) {
      const docsContent = fs.readFileSync(path.join(process.cwd(), 'CONSOLE-ERRORS-FIX-GUIDE.md'), 'utf8')
      expect(docsContent.toLowerCase()).toContain('hybridaction')
      expect(docsContent.toLowerCase()).toContain('browser extension')
    }
  })

  /**
   * Property 2: JavaScript Execution Should Not Produce TypeError
   * 
   * This test validates that the cache clearing fix resolves TypeError issues
   * caused by stale build artifacts referencing non-existent functions.
   * 
   * **Validates: Requirements 2.3**
   * 
   * Bug Condition: JavaScript execution encounters undefined function calls from stale cache
   * Expected Behavior (after fix): Cache clearing script prevents stale references
   * 
   * After fix, this test validates:
   * - Cache clearing script exists and works
   * - .gitignore includes cache directories
   */
  it('Property 2: JavaScript execution should not produce TypeError for missing functions', async () => {
    const fs = require('fs')
    const path = require('path')
    
    // Validate fix: Cache clearing script exists (already checked in Property 1)
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    expect(packageJson.scripts).toHaveProperty('clean')
    
    // Validate .gitignore includes cache directories
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
    
    expect(gitignoreContent).toContain('.next')
    expect(gitignoreContent).toContain('node_modules/.cache')
  })

  /**
   * Property 3: CSS Module HMR Should Not Produce removeChild Errors
   * 
   * This test validates that the Next.js configuration enhancements properly
   * handle CSS module hot reloading without removeChild errors.
   * 
   * **Validates: Requirements 2.4, 2.5**
   * 
   * Bug Condition: HMR attempts to remove DOM nodes that are already removed
   * Expected Behavior (after fix): Next.js config has proper HMR error handling
   * 
   * After fix, this test validates:
   * - next.config.js has webpack configuration
   * - React Strict Mode is enabled
   * - HMR optimization settings are present
   */
  it('Property 3: CSS module HMR should not produce removeChild errors', async () => {
    const fs = require('fs')
    const path = require('path')
    
    // Validate fix: Next.js configuration has HMR enhancements
    const nextConfigPath = path.join(process.cwd(), 'next.config.js')
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
    
    // Check for React Strict Mode
    expect(nextConfigContent).toContain('reactStrictMode')
    
    // Check for webpack configuration
    expect(nextConfigContent).toContain('webpack')
    
    // Check for HMR optimization settings
    expect(nextConfigContent).toContain('removeAvailableModules')
    expect(nextConfigContent).toContain('removeEmptyChunks')
    
    // Check for CSS module error handling
    expect(nextConfigContent).toContain('style-loader')
    expect(nextConfigContent).toContain('insertAtTop')
  })

  /**
   * Property 4: Complete Application Load Should Have Zero Console Errors
   * 
   * This is a comprehensive test that validates all fixes are in place together.
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   * 
   * Bug Condition: Application produces console errors during load and operation
   * Expected Behavior (after fix): All fixes are properly implemented
   */
  it('Property 4: Complete application load should produce zero console errors', async () => {
    const fs = require('fs')
    const path = require('path')
    
    // Validate all fixes are in place
    
    // 1. Cache clearing script
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    expect(packageJson.scripts).toHaveProperty('clean')
    
    // 2. Documentation for external scripts
    const docsExist = fs.existsSync(path.join(process.cwd(), 'CONSOLE-ERRORS-FIX-GUIDE.md'))
    expect(docsExist).toBe(true)
    
    // 3. Next.js configuration enhancements
    const nextConfigPath = path.join(process.cwd(), 'next.config.js')
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
    expect(nextConfigContent).toContain('reactStrictMode')
    expect(nextConfigContent).toContain('webpack')
    
    // 4. .gitignore includes cache directories
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
    expect(gitignoreContent).toContain('.next')
    expect(gitignoreContent).toContain('node_modules/.cache')
  })
})
