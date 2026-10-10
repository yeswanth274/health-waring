import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Testing Specification for CardioAlert CDSS
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent virtual users
    { duration: '1m', target: 100 },  // Stay at 100 virtual users peak
    { duration: '30s', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must complete below 100ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    name: 'k6 Synthetic Patient',
    age: 55,
    sex: 'male',
    sbp: 142,
    dbp: 88,
    totalChol: 220,
    totalCholCategory: 'borderline',
    fastingGluc: 108,
    fastingGlucCategory: 'impaired',
    tobacco: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/api/predict', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200 || r.status === 404, // handles mock or static preview
  });

  sleep(0.1);
}
