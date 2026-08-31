-- Activate Ollama provider and update its base_url for Ollama API PRO (cloud)
UPDATE ai_providers
SET is_active = true,
    base_url = 'https://api.ollama.ai/v1',
    default_model = 'llama3.2',
    updated_at = now()
WHERE provider = 'ollama';

-- Ensure grok stays active
UPDATE ai_providers
SET is_active = true,
    updated_at = now()
WHERE provider = 'grok';
