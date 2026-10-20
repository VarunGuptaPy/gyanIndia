// Integration tests run against a separate database so development data is untouched.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://gyan:gyan_dev_password@localhost:5433/gyan_test";
