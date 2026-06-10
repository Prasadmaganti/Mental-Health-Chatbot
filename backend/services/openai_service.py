import os
import json
import random

# Try to load the knowledge base for mock/fallback responses
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, "knowledge_base", "mental_health_data.json")

mental_health_data = {}
try:
    with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
        mental_health_data = json.load(f)
except Exception as e:
    print(f"Warning: Could not load knowledge base in openai_service: {e}")

def get_mock_response(message: str) -> str:
    """
    Generates a smart, empathetic response from the knowledge base when OpenAI is not available.
    """
    message_lower = message.lower()
    categories = mental_health_data.get("categories", {})
    
    # Simple keyword mapping to categories
    category_keywords = {
        "stress_and_anxiety": ["stress", "anxi", "anxious", "overwhelm", "worry", "panick", "panic"],
        "loneliness": ["lonely", "loneliness", "isolated", "no friends", "alone", "disconnect"],
        "academic_pressure": ["academic", "study", "studies", "gpa", "grade", "homework", "assignment", "pressure"],
        "exam_anxiety": ["exam", "test", "quiz", "finals", "midterm"],
        "sleep_issues": ["sleep", "insomnia", "awake", "night", "tired", "exhausted", "nightmare"],
        "low_self_esteem": ["esteem", "inadequate", "worthless", "hate myself", "ugly", "critic", "not good enough", "confidence"],
        "relationship_problems": ["relationship", "partner", "friend", "argument", "fight", "conflict", "breakup", "boyfriend", "girlfriend", "family"],
        "career_confusion": ["career", "job", "major", "stuck", "profession", "future", "work", "confusion"],
        "homesickness": ["home", "homesick", "miss", "family", "parent", "neighborhood", "leave"],
        "social_media_comparison": ["social media", "instagram", "tiktok", "facebook", "scroll", "compare", "comparing", "highlight"]
    }
    
    matched_category = None
    max_matches = 0
    
    # Remove 'family' from relationship keywords to prevent homesickness conflict
    category_keywords["relationship_problems"] = ["relationship", "partner", "friend", "argument", "fight", "conflict", "breakup", "boyfriend", "girlfriend"]

    for cat_key, keywords in category_keywords.items():
        current_matches = sum(1 for keyword in keywords if keyword in message_lower)
        if current_matches > max_matches:
            max_matches = current_matches
            matched_category = cat_key
            
    if matched_category and matched_category in categories:
        data = categories[matched_category]
        strategies = data.get("coping_strategies", [])
        strategy = random.choice(strategies) if strategies else "Take a deep breath and sit with your thoughts for a moment."
        
        # Format strategy clearly
        parts = strategy.split(':')
        strategy_title = parts[0]
        strategy_desc = parts[1].strip() if len(parts) > 1 else ""
        strategy_formatted = f"**{strategy_title}**: {strategy_desc}" if strategy_desc else f"**{strategy}**"
        
        category_suggestions = {
            "stress_and_anxiety": "Stepping away from screens for a few minutes can help reset your mind.",
            "loneliness": "Try reaching out to a friend or joining a community with shared hobbies.",
            "academic_pressure": "Try chunking your workload into smaller tasks and setting a firm daily stop time.",
            "exam_anxiety": "Skip difficult questions first to build momentum, and return to them later.",
            "sleep_issues": "Keep your phone out of reach and do a screen-free wind-down routine before bed.",
            "low_self_esteem": "Try keeping a daily wins log of 3 small things you did well today.",
            "relationship_problems": "Use 'I feel' statements to communicate your boundaries calmly without blaming.",
            "career_confusion": "Audit your transferrable skills and try small, low-risk learning experiments.",
            "homesickness": "Decorate your new room with photos of loved ones to create a sense of comfort.",
            "social_media_comparison": "Unfollow or mute accounts that make you feel inadequate or self-critical."
        }
        
        suggestion = category_suggestions.get(matched_category, "Take a deep breath and give yourself some grace.")
        
        return (
            f"I hear you, and your feelings are completely valid. 🫂💛 Here is my suggestion and a quick exercise to try:\n\n"
            f"💡 **Suggestion**: {suggestion}\n\n"
            f"💪 **Exercise**: {strategy_formatted}\n\n"
            f"Take a moment for yourself. I'm here if you want to share more. 🌸"
        )
        
    # Default general fallback
    return (
        "I'm here to support you. 💙 Tell me what's on your mind, or mention if you want help with stress, loneliness, sleep, relationships, or school."
    )

def generate_chat_response(messages: list, system_prompt: str) -> str:
    """
    Sends the messages (including system prompt) to OpenAI API or falls back to the mock service.
    Supports API key rotation and automatic failover.
    """
    keys_str = os.getenv("OPENAI_API_KEYS") or os.getenv("OPENAI_API_KEY")
    if not keys_str:
        # Get the content of the last user message to generate mock response
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        return get_mock_response(user_message)
        
    # Support comma-separated list of keys
    api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not api_keys:
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        return get_mock_response(user_message)

    last_error = None
    for key in api_keys:
        try:
            if key.startswith("AIzaSy"):
                # Call Google Gemini API via REST
                import requests
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
                
                # Format messages payload
                contents = []
                for msg in messages:
                    contents.append({
                        "role": "user" if msg.get("role") == "user" else "model",
                        "parts": [{"text": msg.get("content", "")}]
                    })
                
                payload = {
                    "contents": contents,
                    "systemInstruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 400
                    }
                }
                
                res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    raise Exception(f"Gemini API error (Status {res.status_code}): {res.text}")
            elif key.startswith("xai-"):
                # Call Grok (xAI) API via OpenAI compatible client
                import importlib
                openai_module = importlib.import_module("openai")
                OpenAI = openai_module.OpenAI
                client = OpenAI(api_key=key, base_url="https://api.x.ai/v1")
                # Construct messages payload with system prompt first
                payload = [{"role": "system", "content": system_prompt}] + messages
                
                response = client.chat.completions.create(
                    model="grok-4.3",
                    messages=payload,
                    temperature=0.7,
                    max_tokens=400
                )
                return response.choices[0].message.content
            else:
                # Call OpenAI API dynamically to avoid linter errors when not installed
                import importlib
                openai_module = importlib.import_module("openai")
                OpenAI = openai_module.OpenAI
                client = OpenAI(api_key=key)
                # Construct messages payload with system prompt first
                payload = [{"role": "system", "content": system_prompt}] + messages
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=payload,
                    temperature=0.7,
                    max_tokens=400
                )
                return response.choices[0].message.content
        except Exception as e:
            # Catch API errors, rate limit errors, quota errors
            masked_key = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "invalid_key"
            print(f"API Key failed ({masked_key}): {e}")
            last_error = e
            continue  # Fallback to the next key in the list

    # If all keys fail, fall back to the mock response
    print(f"All OpenAI API keys failed. Final error: {last_error}")
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_message = msg.get("content", "")
            break
    return get_mock_response(user_message)
