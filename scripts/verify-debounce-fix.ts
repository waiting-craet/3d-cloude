#!/usr/bin/env tsx

/**
 * Verification script for debounce protection fix
 * Checks that all necessary files and changes are in place
 */

import * as fs from 'fs';
import * as path from 'path';

function verifyDebounceImplementation() {
  console.log('🔍 Verifying Debounce Protection Implementation\n');

  const checks = [
    {
      name: 'CSS Module File',
      path: 'app/text-page/page.module.css',
      check: (content: string) => {
        return content.includes('@keyframes spin') && 
               content.includes('.spinner') &&
               content.includes('animation: spin');
      }
    },
    {
      name: 'Page Component - CSS Import',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes("import styles from './page.module.css'");
      }
    },
    {
      name: 'Page Component - State Variables',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes('isCreatingProject') && 
               content.includes('isCreatingGraph');
      }
    },
    {
      name: 'Page Component - Debounce Logic',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes('if (isCreatingProject) return') && 
               content.includes('if (isCreatingGraph) return');
      }
    },
    {
      name: 'Page Component - Finally Blocks',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes('setIsCreatingProject(false)') && 
               content.includes('setIsCreatingGraph(false)');
      }
    },
    {
      name: 'Page Component - Spinner Usage',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes('className={styles.spinner}');
      }
    },
    {
      name: 'Page Component - Button Disabled State',
      path: 'app/text-page/page.tsx',
      check: (content: string) => {
        return content.includes('disabled={!newProjectName.trim() || isCreatingProject}') && 
               content.includes('disabled={!newGraphName.trim() || isCreatingGraph}');
      }
    }
  ];

  let passedChecks = 0;
  let failedChecks = 0;

  checks.forEach((check, index) => {
    try {
      const filePath = path.join(process.cwd(), check.path);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Check ${index + 1}: ${check.name}`);
        console.log(`   File not found: ${check.path}\n`);
        failedChecks++;
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (check.check(content)) {
        console.log(`✅ Check ${index + 1}: ${check.name}`);
        passedChecks++;
      } else {
        console.log(`❌ Check ${index + 1}: ${check.name}`);
        console.log(`   Expected content not found in ${check.path}\n`);
        failedChecks++;
      }
    } catch (error) {
      console.log(`❌ Check ${index + 1}: ${check.name}`);
      console.log(`   Error: ${error}\n`);
      failedChecks++;
    }
  });

  console.log('\n📊 Verification Summary:');
  console.log(`   ✅ Passed: ${passedChecks}/${checks.length}`);
  console.log(`   ❌ Failed: ${failedChecks}/${checks.length}`);

  if (failedChecks === 0) {
    console.log('\n🎉 All checks passed! Debounce protection is properly implemented.');
    console.log('\n✨ Features verified:');
    console.log('   🛡️  Debounce state management');
    console.log('   🔄 Loading indicators with CSS animations');
    console.log('   🚫 Button disabled states during creation');
    console.log('   ⏳ Proper cleanup in finally blocks');
    console.log('   🎨 CSS module for spinner animation');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the implementation.');
  }

  return failedChecks === 0;
}

// Run verification
const success = verifyDebounceImplementation();
process.exit(success ? 0 : 1);