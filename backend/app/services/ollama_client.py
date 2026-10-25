import logging
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.REQUEST_TIMEOUT_SECONDS

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama server is reachable and fetch list of models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = []
                    for m in data.get("models", []):
                        details = m.get("details", {})
                        models.append({
                            "name": m.get("name"),
                            "size": m.get("size"),
                            "modified_at": m.get("modified_at"),
                            "family": details.get("family"),
                            "parameter_size": details.get("parameter_size"),
                            "quantization_level": details.get("quantization_level"),
                        })
                    return {
                        "connected": True,
                        "base_url": self.base_url,
                        "models_available": models,
                        "error": None,
                        "setup_instructions": None
                    }
                else:
                    return {
                        "connected": False,
                        "base_url": self.base_url,
                        "models_available": [],
                        "error": f"Ollama returned HTTP status {resp.status_code}",
                        "setup_instructions": "Make sure Ollama is running: run `ollama serve` or open the Ollama desktop app."
                    }
        except httpx.ConnectError:
            return {
                "connected": False,
                "base_url": self.base_url,
                "models_available": [],
                "error": f"Could not connect to Ollama at {self.base_url}. Service is offline or unreachable.",
                "setup_instructions": "To start Ollama, run: `ollama serve` in a terminal or launch Ollama from Windows Start menu."
            }
        except httpx.TimeoutException:
            return {
                "connected": False,
                "base_url": self.base_url,
                "models_available": [],
                "error": f"Connection to Ollama at {self.base_url} timed out.",
                "setup_instructions": "Ensure Ollama is responsive and not overloaded."
            }
        except Exception as e:
            return {
                "connected": False,
                "base_url": self.base_url,
                "models_available": [],
                "error": str(e),
                "setup_instructions": "Verify your Ollama installation: run `ollama --version`."
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        health = await self.check_health()
        return health.get("models_available", [])

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.3,
        format_type: Optional[str] = None,
    ) -> str:
        """
        Sends a generation request to Ollama's /api/generate endpoint.
        Raises RuntimeError with helpful message if service is down or model missing.
        """
        target_model = model or settings.DEFAULT_MODEL
        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }
        if system:
            payload["system"] = system
        if format_type:
            payload["format"] = format_type  # e.g. "json"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )

                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "")
                    return response_text
                elif resp.status_code == 404:
                    raise RuntimeError(
                        f"Model '{target_model}' was not found in your local Ollama installation. "
                        f"Please run `ollama pull {target_model}` in your terminal to download it."
                    )
                else:
                    raise RuntimeError(
                        f"Ollama generation failed with status {resp.status_code}: {resp.text}"
                    )
        except httpx.ConnectError:
            raise RuntimeError(
                f"Ollama is not running at {self.base_url}. Please launch Ollama by running `ollama serve` in your terminal."
            )
        except httpx.TimeoutException:
            raise RuntimeError(
                f"Ollama inference timed out after {self.timeout} seconds. Your local machine might be processing a large prompt."
            )
        except Exception as e:
            if isinstance(e, RuntimeError):
                raise
            raise RuntimeError(f"Failed to communicate with local AI service: {str(e)}")

ollama_client = OllamaClient()
