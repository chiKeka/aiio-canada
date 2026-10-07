export default function worker(value) {
  return {
    value,
    injected: process.env.AIIO_SECURITY_FIXTURE_INJECTED ?? null,
  };
}
