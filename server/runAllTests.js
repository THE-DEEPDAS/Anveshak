import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Helper function to run a Node.js script and capture its output
 * @param {string} scriptPath - Path to the script to run
 * @param {string[]} args - Arguments to pass to the script
 * @returns {Promise<{exitCode: number, output: string}>}
 */
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, scriptPath);
    console.log(`Running: node ${fullPath} ${args.join(" ")}`);

    const child = spawn("node", [fullPath, ...args], {
      stdio: ["inherit", "pipe", "pipe"],
      cwd: __dirname,
    });

    let output = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code,
        output,
      });
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Run all email generation tests sequentially
 */
async function runAllTests() {
  console.log("===================================================");
  console.log("      RUNNING ALL EMAIL GENERATION TESTS           ");
  console.log("===================================================\n");
  const tests = [
    {
      name: "Test JSON Parsing Resilience",
      script: "testJsonParsing.js",
    },
    {
      name: "Test Safety Settings Fix",
      script: "testSafetySettings.js",
    },
    {
      name: "Test Prompt Generation",
      script: "testResearchEmail.js",
      args: ["prompt"],
    },
    {
      name: "Test Direct Email Generation",
      script: "testResearchEmail.js",
      args: ["email"],
    },
    { name: "Test Academic Route Flow", script: "testAcademicRouteFlow.js" },
    { name: "Test Complete Email Flow", script: "testCompleteEmailFlow.js" },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n\n===================================================`);
    console.log(`RUNNING TEST: ${test.name}`);
    console.log(`===================================================\n`);

    try {
      const result = await runScript(test.script, test.args);
      results.push({
        name: test.name,
        success: result.exitCode === 0,
        exitCode: result.exitCode,
      });
    } catch (error) {
      console.error(`Failed to run test ${test.name}:`, error);
      results.push({
        name: test.name,
        success: false,
        error: error.message,
      });
    }
  }

  // Print summary
  console.log(`\n\n===================================================`);
  console.log(`                 TEST RESULTS                      `);
  console.log(`===================================================`);

  for (const result of results) {
    console.log(
      `${result.name}: ${
        result.success
          ? "✅ PASSED"
          : "❌ FAILED (Exit code: " + result.exitCode + ")"
      }`
    );
  }

  const allPassed = results.every((r) => r.success);
  console.log(
    `\nOverall result: ${
      allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
    }`
  );

  return allPassed;
}

// Run all tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test runner failed:", error);
    process.exit(1);
  });
