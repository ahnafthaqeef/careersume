// Jest global setup — runs after the test framework is installed
// Add custom matchers, global mocks, or env setup here

// Provide mock Supabase env vars for tests (allows admin client to initialize)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.example.com'
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key'
}

// Silence console.error in tests unless explicitly needed
// (remove this line if you want to see errors during debugging)
// jest.spyOn(console, 'error').mockImplementation(() => {})
