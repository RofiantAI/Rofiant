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


class ProviderConnectionStatus(BaseModel):
    anthropic_oauth: bool
    openai_api_key: bool
    gemini_api_key: bool
