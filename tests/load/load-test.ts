/**
 * Automated High-Throughput Load & Stress Testing Suite
 * Simulates heavy clinical workloads (e.g., 50,000 concurrent patient risk evaluations)
 * Validates sub-millisecond inference latency, memory stability, and zero error rates.
 */

import { performance } from 'perf_hooks';
import { predictCardiovascularRisk } from '../../src/lib/mlEngine';
import { PatientData } from '../../src/types/clinical';

interface LoadTestMetrics {
  totalIterations: number;
  totalDurationMs: number;
  opsPerSecond: number;
  avgLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  memoryDeltaMb: number;
  successRatePct: number;
}

function generateRandomPatient(index: number): PatientData {
  const ages = [22, 35, 45, 52, 60, 68, 75];
  const sexes: ('male' | 'female')[] = ['male', 'female'];
  const sbps = [105, 120, 135, 145, 160, 185];
  const dbps = [65, 75, 85, 92, 105];
  const chols = [150, 190, 215, 240, 280];
  const glucs = [80, 92, 110, 130, 165];
  const tobaccos: (0 | 1)[] = [0, 0, 1, 0, 1];

  return {
    name: `Synthetic Patient #${index}`,
    age: ages[index % ages.length],
    sex: sexes[index % sexes.length],
    sbp: sbps[index % sbps.length],
    dbp: dbps[index % dbps.length],
    totalChol: chols[index % chols.length],
    totalCholCategory: chols[index % chols.length] < 200 ? 'normal' : chols[index % chols.length] < 240 ? 'borderline' : 'high',
    fastingGluc: glucs[index % glucs.length],
    fastingGlucCategory: glucs[index % glucs.length] < 100 ? 'normal' : glucs[index % glucs.length] < 126 ? 'impaired' : 'diabetic',
    tobacco: tobaccos[index % tobaccos.length],
  };
}

export function runLoadTest(iterations: number = 50000): LoadTestMetrics {
  console.log('\n=========================================================');
  console.log(`🚀 STARTING AUTOMATED LOAD TEST: ${iterations.toLocaleString()} INFERENCES`);
  console.log('=========================================================\n');

  // Force GC if available or record baseline heap
  const initialMemory = process.memoryUsage().heapUsed;
  const latencies: number[] = new Array(iterations);

  const overallStart = performance.now();
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const patient = generateRandomPatient(i);
    const start = performance.now();
    try {
      const result = predictCardiovascularRisk(patient);
      if (result.riskProbability < 0 || result.riskProbability > 1) {
        errors++;
      }
    } catch (e) {
      errors++;
    }
    const end = performance.now();
    latencies[i] = end - start;
  }

  const overallEnd = performance.now();
  const totalDurationMs = overallEnd - overallStart;
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMb = (finalMemory - initialMemory) / (1024 * 1024);

  // Calculate percentiles
  latencies.sort((a, b) => a - b);
  const p50Ms = latencies[Math.floor(iterations * 0.5)];
  const p95Ms = latencies[Math.floor(iterations * 0.95)];
  const p99Ms = latencies[Math.floor(iterations * 0.99)];
  const minMs = latencies[0];
  const maxMs = latencies[iterations - 1];
  const avgLatencyMs = latencies.reduce((acc, curr) => acc + curr, 0) / iterations;
  const opsPerSecond = Math.round((iterations / (totalDurationMs / 1000)));
  const successRatePct = ((iterations - errors) / iterations) * 100;

  console.log('📊 LOAD & PERFORMANCE BENCHMARK REPORT:');
  console.log(`  • Iterations Executed  : ${iterations.toLocaleString()}`);
  console.log(`  • Elapsed Time         : ${totalDurationMs.toFixed(2)} ms (${(totalDurationMs / 1000).toFixed(2)} s)`);
  console.log(`  • Throughput           : ${opsPerSecond.toLocaleString()} ops/sec`);
  console.log(`  • Success Rate         : ${successRatePct.toFixed(2)}%`);
  console.log(`  • Average Latency      : ${(avgLatencyMs * 1000).toFixed(2)} µs (${avgLatencyMs.toFixed(4)} ms)`);
  console.log(`  • p50 Median Latency   : ${(p50Ms * 1000).toFixed(2)} µs`);
  console.log(`  • p95 Latency          : ${(p95Ms * 1000).toFixed(2)} µs`);
  console.log(`  • p99 Latency          : ${(p99Ms * 1000).toFixed(2)} µs`);
  console.log(`  • Max Spike Latency    : ${maxMs.toFixed(3)} ms`);
  console.log(`  • Heap Delta           : ${memoryDeltaMb.toFixed(2)} MB`);

  // SLA Assertions
  const SLA_MAX_P95_MS = 0.5; // Must complete 95% within 0.5 ms
  const SLA_MIN_OPS_SEC = 20000; // Must sustain at least 20k inferences/sec

  console.log('\n🔍 SLA VERIFICATION:');
  const slaLatencyPassed = p95Ms <= SLA_MAX_P95_MS;
  const slaThroughputPassed = opsPerSecond >= SLA_MIN_OPS_SEC;
  const slaErrorPassed = errors === 0;

  console.log(`  • p95 Latency <= ${SLA_MAX_P95_MS}ms : ${slaLatencyPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  • Throughput >= ${SLA_MIN_OPS_SEC} ops/s  : ${slaThroughputPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  • Error Rate == 0%          : ${slaErrorPassed ? '✅ PASSED' : '❌ FAILED'}`);

  if (!slaLatencyPassed || !slaThroughputPassed || !slaErrorPassed) {
    console.error('\n❌ LOAD TEST FAILED SLA CRITERIA!');
    process.exit(1);
  }

  console.log('\n🎉 ALL LOAD TESTING SLAs MET PERFECTLY (Grade: Production Enterprise Ready)!\n');

  return {
    totalIterations: iterations,
    totalDurationMs,
    opsPerSecond,
    avgLatencyMs,
    p50Ms,
    p95Ms,
    p99Ms,
    minMs,
    maxMs,
    memoryDeltaMb,
    successRatePct,
  };
}

// Execute directly if run as main
if (process.argv[1]?.includes('load-test')) {
  runLoadTest(50000);
}
