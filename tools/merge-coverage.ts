/* SOURCE: https://github.com/facebook/jest/issues/2418#issuecomment-478932514 */
/* tslint:disable:no-console */
/*
ts-node ./merge-coverage.ts --report ./coverage0/coverage-final.json --report ./coverage1/coverage-final.json
*/

import fs from 'fs';
import { createCoverageMap } from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

main().catch(() => {
  process.exit(1);
});

async function main() {
  const reportFiles = [
    'coverage/unit/coverage-final.json',
    'coverage/e2e/coverage-final.json',
  ];

  const map = createCoverageMap();

  reportFiles.forEach((file) => {
    const fileReport = fs.readFileSync(file, { encoding: 'utf8' });
    map.merge(JSON.parse(fileReport));
  });

  const context = libReport.createContext({
    dir: './coverage/full',
    coverageMap: map,
  });

  const jsonSummary: libReport.ReportBase = reports.create(
    'json-summary',
  ) as unknown as libReport.ReportBase;
  const lcov: libReport.ReportBase = reports.create(
    'lcov',
    {},
  ) as unknown as libReport.ReportBase;

  jsonSummary.execute(context);
  lcov.execute(context);
}
