from transformers import pipeline
from models import Task
import re
from typing import Tuple

# Initialize the self-hosted LLM (using a sample GPT-2 model; replace with your own model)
llm = pipeline("text-generation", model="gpt2")

def generate_story_for_task(task: Task, db) -> Tuple[str, int, int]:
    """
    Generate a mini-story using task details and previous context.
    Returns a tuple containing the generated story, XP, and Currency.
    """
    previous_context = get_previous_stories(db)
    prompt = (
        f"{previous_context}\n"
        f"Task Details: Title: {task.title}\nDescription: {task.description or 'N/A'}\n"
        "Write a mini-story that connects with previous events, and at the end, output XP and Currency values in the format: XP:<number>, Currency:<number>."
    )
    result = llm(prompt, max_length=150, num_return_sequences=1, truncation=True)
    generated_text = result[0]['generated_text']
    xp, currency = parse_xp_currency(generated_text)
    return generated_text, xp, currency

def get_previous_stories(db) -> str:
    # For simplicity, return a dummy context. Replace with a real query if desired.
    return "Previous adventures: ..."

def parse_xp_currency(text: str) -> Tuple[int, int]:
    match = re.search(r"XP:(\d+),\s*Currency:(\d+)", text)
    if match:
        xp = int(match.group(1))
        currency = int(match.group(2))
        return xp, currency
    return 10, 5
