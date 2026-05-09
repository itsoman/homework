# homework
Homework assignment
* FE Automated tests are located in tests/part1-automation/FE-Plan-a-Trip.spec.ts
* CI/CD Strategy is located in root directory named part2-ci-strategy.md

The test project has been created from the ground up and it uses .env for environment variables. There is a config.json file which stores data like URLs and various data which can be used for tests. The test suite can be run in the following manner:
**Installation:
* npm init playwright@latest
* npm install dotenv && npm install --save-dev @types/dotenv

How to run tests
* npx playwright test create-a-trip.spec.ts --headed --project=chromium
Or for headless mode:
* npx playwright test create-a-trip.spec.ts --project=chromium

To generate a report the following command can be used:
* npx playwright show-report
