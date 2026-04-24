from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="Master Prompter API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class GenerateRequest(BaseModel):
    idea: str = Field(..., min_length=1, max_length=4000)
    target_ai: str
    style: str


class PromptResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    idea: str
    target_ai: str
    style: str
    prompt: str
    tips: List[str]
    variations: List[str]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FavoriteCreate(BaseModel):
    idea: str
    target_ai: str
    style: str
    prompt: str
    tips: List[str]
    variations: List[str]


# ---------- Prompt Engineering System Message ----------
SYSTEM_PROMPT = """You are a world-class AI prompt engineer working inside a luxury editorial prompting studio. Your job: take a user's rough idea, the target AI tool, and a desired style, and craft one perfectly engineered prompt, three actionable pro tips, and two distinct variations.

STRICT OUTPUT FORMAT
Return ONLY valid JSON matching this schema exactly — no prose, no markdown fences, no commentary:
{
  "prompt": "<the main engineered prompt as a single string>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "variations": ["<variation 1>", "<variation 2>"]
}

TARGET-AI GUIDELINES
- ChatGPT: conversational, role + context + task + constraints + output format.
- Midjourney: dense visual clause, subject → setting → style → mood → composition → lighting, add technical params like --ar 16:9 --v 6 --style raw where helpful.
- DALL·E 3: natural-language scene description with strong composition, lighting, camera, and stylistic references.
- Sora: cinematic shot description — subject, camera movement, lens/focal length, pacing, lighting, mood, duration hints.
- Stable Diffusion: comma-delimited tokens with weights like (keyword:1.2), include a separate negative prompt line when useful.
- Gemini: structured multi-step reasoning, clear inputs/outputs, multimodal awareness.
- Claude: XML-style tags (<task>, <context>, <constraints>, <output_format>), careful reasoning instructions.
- GitHub Copilot: code-first spec — language, signature, inputs, outputs, edge cases, tests.

STYLE GUIDELINES
- Detailed & Technical: exhaustive specifications, parameters, constraints, measurable criteria.
- Creative & Expressive: evocative sensory language, metaphor, voice, atmosphere.
- Concise & Direct: shortest possible prompt that still works — zero filler.
- Step-by-Step: numbered sequential instructions the model can follow in order.
- Storytelling: narrative framing — character, stakes, arc, resolution.

QUALITY BAR
- The main prompt must be directly pasteable into the target tool and produce strong results.
- Each of the 3 tips must be specific to THIS prompt and genuinely improve it (not generic advice).
- The 2 variations must take meaningfully different creative angles — not reworded duplicates.
- Preserve the user's intent; elevate, don't replace.

Return ONLY the JSON object."""


def _extract_json(text: str) -> dict:
    """Extract JSON object from LLM response."""
    # Try direct parse first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Strip markdown code fences
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass
    # Find first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    raise ValueError("Could not parse JSON from LLM response")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "Master Prompter", "status": "ok"}


@api_router.post("/generate", response_model=PromptResult)
async def generate_prompt(payload: GenerateRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    session_id = str(uuid.uuid4())
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-4-sonnet-20250514")

    user_text = (
        f"Target AI: {payload.target_ai}\n"
        f"Style: {payload.style}\n"
        f"Rough idea:\n{payload.idea}\n\n"
        "Craft the JSON now."
    )

    try:
        response = await chat.send_message(UserMessage(text=user_text))
    except Exception as e:
        logger.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    try:
        data = _extract_json(response)
    except Exception as e:
        logger.error(f"Failed to parse LLM response: {response[:500]}")
        raise HTTPException(status_code=502, detail=f"Invalid LLM output: {e}")

    prompt_text = str(data.get("prompt", "")).strip()
    tips = [str(t).strip() for t in (data.get("tips") or [])][:3]
    variations = [str(v).strip() for v in (data.get("variations") or [])][:2]

    if not prompt_text or len(tips) < 3 or len(variations) < 2:
        raise HTTPException(status_code=502, detail="LLM returned incomplete structure")

    result = PromptResult(
        idea=payload.idea,
        target_ai=payload.target_ai,
        style=payload.style,
        prompt=prompt_text,
        tips=tips,
        variations=variations,
    )

    # Save to history
    await db.history.insert_one(result.model_dump())
    return result


@api_router.get("/history", response_model=List[PromptResult])
async def get_history(limit: int = 50):
    items = await db.history.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    result = await db.history.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api_router.delete("/history")
async def clear_history():
    await db.history.delete_many({})
    return {"ok": True}


@api_router.get("/favorites", response_model=List[PromptResult])
async def get_favorites():
    items = await db.favorites.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.post("/favorites", response_model=PromptResult)
async def add_favorite(payload: FavoriteCreate):
    result = PromptResult(**payload.model_dump())
    await db.favorites.insert_one(result.model_dump())
    return result


@api_router.delete("/favorites/{item_id}")
async def delete_favorite(item_id: str):
    result = await db.favorites.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
