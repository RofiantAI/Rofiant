from pydantic import BaseModel


class AnthropicAuthStart(BaseModel):
    authorize_url: str
    code_verifier: str


class AnthropicAuthExchange(BaseModel):
    code: str
    code_verifier: str


class OpenAIKeySave(BaseModel):
    api_key: str


class GeminiKeySave(BaseModel):
    api_key: str


class CustomProviderSave(BaseModel):
    base_url: str
    api_key: str
    model: str


class ProviderConnectionStatus(BaseModel):
    anthropic_oauth: bool
    openai_api_key: bool
    gemini_api_key: bool
    custom_provider: bool
    custom_provider_base_url: str | None = None
    custom_provider_model: str | None = None
