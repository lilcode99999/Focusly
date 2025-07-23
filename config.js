// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://txairbygkxuaqwfcospq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YWlyYnlna3h1YXF3ZmNvc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDc2MDIsImV4cCI6MjA2NzY4MzYwMn0.QweMJbdb4XHum_WHCi8uvsxQel6qyQUE3eZdPvzWhbo'
};

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey: 'pk_test_51RUG5hGb2rFMogEt23NIEB1zqylQAJhgEsZAVaDtA9GlLcgN7qjXNgTATQewytzJaErdxSAtMCcoc4dQoPmCDwQc00lSFsPZX2',
  proPriceId: 'price_1RjALzGb2rFMogEtnnQrb24r',
  teamsPriceId: 'price_1RjAM0Gb2rFMogEtqGhozSCg'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, STRIPE_CONFIG };
}