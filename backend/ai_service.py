from openai import OpenAI
import os
import base64
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AIService:
    def __init__(self):
        # OpenAI API key is already set globally
        pass

    async def transcribe_audio(self, audio_file_path: str) -> Optional[str]:
        """Transcribe audio file using OpenAI Whisper"""
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1", file=audio_file, response_format="text"
                )
            return transcript
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

    async def generate_story(
        self,
        text_content: str = "",
        audio_transcriptions: List[str] = None,
        image_descriptions: List[str] = None,
        style: str = "story",
    ) -> Optional[str]:
        """Generate a story using GPT-4o based on user's daily content"""

        # Prepare context from user's content
        context_parts = []

        if text_content:
            context_parts.append(f"Text notes: {text_content}")

        if audio_transcriptions:
            context_parts.append(f"Voice recordings: {' '.join(audio_transcriptions)}")

        if image_descriptions:
            context_parts.append(f"Photos taken: {' '.join(image_descriptions)}")

        if not context_parts:
            context_parts.append("A quiet day with no specific content recorded.")

        context = " ".join(context_parts)

        # Style-specific prompts
        style_prompts = {
            "story": """You are a creative storyteller. Based on the following daily content, write a beautiful, engaging story that captures the essence of this person's day. Make it personal, warm, and meaningful. Write in first person as if you're narrating their life story.

Content: {context}

Write a 2-3 paragraph story that transforms this daily content into a compelling narrative.""",
            "comic": """You are a comic book writer. Based on the following daily content, write a fun, lighthearted comic-style narrative with dialogue and action. Make it entertaining and visually descriptive.

Content: {context}

Write a comic-style story with dialogue and action scenes.""",
            "poetic": """You are a poet. Based on the following daily content, write a beautiful, lyrical poem that captures the emotions and moments of this person's day. Use metaphor and imagery.

Content: {context}

Write a 3-4 stanza poem that poetically describes this day.""",
        }

        prompt = style_prompts.get(style, style_prompts["story"]).format(
            context=context
        )

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI life narrator that transforms daily experiences into beautiful stories.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1000,
                temperature=0.8,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating story: {e}")
            return None

    async def generate_illustration(
        self, story: str, style: str = "story"
    ) -> Optional[str]:
        """Generate an illustration using DALL-E based on the story"""

        # Create a visual prompt based on the story and style
        if style == "comic":
            visual_prompt = f"Comic book style illustration: {story[:200]}... Colorful, dynamic, with speech bubbles and action lines."
        elif style == "poetic":
            visual_prompt = f"Poetic, dreamy illustration: {story[:200]}... Soft colors, ethereal atmosphere, artistic style."
        else:
            visual_prompt = f"Beautiful storybook illustration: {story[:200]}... Warm, inviting, narrative style with rich colors."

        try:
            response = client.images.generate(
                model="dall-e-3",
                prompt=visual_prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )

            return response.data[0].url

        except Exception as e:
            print(f"Error generating illustration: {e}")
            return None

    async def generate_weekly_recap(
        self, weekly_entries: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Generate a weekly recap summary"""

        if not weekly_entries:
            return "A quiet week with no recorded content."

        # Prepare weekly summary
        week_summary = "Weekly summary:\n"
        for entry in weekly_entries:
            date = entry.get("date", "Unknown date")
            content = entry.get("text_content", "")
            if content:
                week_summary += f"{date}: {content[:100]}...\n"

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI life narrator creating weekly recaps.",
                    },
                    {
                        "role": "user",
                        "content": f"Create a beautiful weekly recap based on this content:\n{week_summary}",
                    },
                ],
                max_tokens=800,
                temperature=0.7,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating weekly recap: {e}")
            return None

    async def generate_monthly_recap(
        self, monthly_entries: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Generate a monthly recap summary"""

        if not monthly_entries:
            return "A quiet month with no recorded content."

        # Prepare monthly summary
        month_summary = "Monthly summary:\n"
        for entry in monthly_entries:
            date = entry.get("date", "Unknown date")
            content = entry.get("text_content", "")
            if content:
                month_summary += f"{date}: {content[:100]}...\n"

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI life narrator creating monthly recaps.",
                    },
                    {
                        "role": "user",
                        "content": f"Create a comprehensive monthly recap based on this content:\n{month_summary}",
                    },
                ],
                max_tokens=1200,
                temperature=0.7,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating monthly recap: {e}")
            return None

    async def generate_narrative(self, entries: List[Dict[str, Any]]) -> Optional[str]:
        """Generate a narrative from timeline entries"""

        if not entries:
            return "No entries found for the selected period."

        # Prepare entries summary
        entries_summary = "Timeline entries:\n"
        for entry in entries:
            date = entry.get("date", "Unknown date")
            text_content = entry.get("text_content", "")
            ai_story = entry.get("ai_generated_story", "")

            if text_content or ai_story:
                content = ai_story if ai_story else text_content
                entries_summary += f"{date}: {content[:200]}...\n"

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI life narrator creating beautiful narratives from personal timeline entries. Write in a warm, personal, and engaging style that weaves together the different moments into a cohesive story.",
                    },
                    {
                        "role": "user",
                        "content": f"Create a beautiful narrative that tells the story of this person's life during the selected period. Weave together the different entries into a cohesive, engaging story that captures the essence of their experiences:\n{entries_summary}",
                    },
                ],
                max_tokens=1500,
                temperature=0.8,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating narrative: {e}")
            return None

    async def generate_speech(self, text: str) -> Optional[bytes]:
        """Generate speech from text using OpenAI TTS"""
        try:
            # Limit text length to avoid API limits (TTS has a character limit)
            if len(text) > 4000:
                text = text[:4000] + "..."

            print(f"Calling OpenAI TTS with text length: {len(text)}")

            response = client.audio.speech.create(
                model="tts-1", voice="alloy", input=text
            )

            print(
                f"OpenAI TTS response received, content length: {len(response.content)}"
            )

            # The response.content is already bytes
            return response.content

        except Exception as e:
            print(f"Error generating speech: {e}")
            print(f"Error type: {type(e)}")
            return None

    async def generate_narrative_image(self, text: str) -> Optional[str]:
        """Generate an image from narrative text using DALL-E"""
        try:
            # Limit text length to avoid API limits
            if len(text) > 1000:
                text = text[:1000] + "..."

            print(f"Generating image for narrative text length: {len(text)}")

            # Create a visual prompt based on the narrative
            visual_prompt = f"Beautiful, artistic illustration representing this life narrative: {text[:200]}... Create a warm, personal, and engaging visual that captures the essence of this story. Use rich colors and emotional depth."

            response = client.images.generate(
                model="dall-e-3",
                prompt=visual_prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )

            print(f"Image generated successfully: {response.data[0].url}")
            return response.data[0].url

        except Exception as e:
            print(f"Error generating narrative image: {e}")
            return None

    async def generate_query_response(
        self,
        query: str,
        entries: List[Dict[str, Any]],
        start_date: str,
        end_date: str,
        username: str,
    ) -> Optional[str]:
        """Generate a response to a natural language query about user's stories"""
        try:
            # Prepare entries data for analysis
            entries_text = []
            for entry in entries:
                date = entry.get("date", "Unknown date")
                text_content = entry.get("text_content", "")
                ai_story = entry.get("ai_generated_story", "")
                
                # Use AI story if available, otherwise use text content
                content = ai_story if ai_story else text_content
                if content:
                    entries_text.append(f"[{date}]: {content}")

            if not entries_text:
                if start_date == 'all' and end_date == 'all':
                    return f"I don't see any stories or entries in your journal yet. Please create some journal entries first, and then I'll be able to answer questions about your life journey."
                else:
                    return f"I don't see any stories or entries for the period from {start_date} to {end_date}. Please make sure you have some content in your journal for this time period."

            # Detect question type for appropriate response style
            query_lower = query.lower().strip()
            is_simple_question = any(word in query_lower for word in ['when', 'what', 'why', 'how', 'where', 'who'])
            
            # Create query prompt based on question type
            time_period_text = "all your stories" if start_date == 'all' and end_date == 'all' else f"the period from {start_date} to {end_date}"
            
            if is_simple_question:
                # Simple, direct response for when/what/why/how questions
                query_prompt = f"""You are an AI assistant analyzing {username}'s personal stories and journal entries. The user has asked a specific question about their life.

User's Question: "{query}"

Time Period: {time_period_text}

Stories and Entries:
{chr(10).join(entries_text)}

Your task:
1. Analyze the provided stories and entries
2. Provide a SIMPLE, DIRECT, and ACCURATE answer to the specific question
3. Focus on facts and concrete information from their stories
4. Be concise and to the point (50-150 words)
5. If the question can't be answered from the available content, say so clearly

Guidelines for simple questions (when/what/why/how):
- Give direct, factual answers
- Use specific dates and details when available
- Avoid lengthy explanations
- Be precise and accurate
- If you don't have enough information, state that clearly
- Keep the tone helpful but straightforward

Remember: This is a specific question requiring a clear, factual response."""
            else:
                # Detailed, narrative response for other types of questions
                query_prompt = f"""You are an AI assistant analyzing {username}'s personal stories and journal entries. The user has asked a question about their life during a specific time period.

User's Question: "{query}"

Time Period: {time_period_text}

Stories and Entries:
{chr(10).join(entries_text)}

Your task:
1. Analyze the provided stories and entries
2. Answer the user's question based on the content
3. Provide insights, patterns, or observations from their stories
4. Be personal, warm, and insightful
5. If the question can't be answered from the available content, explain why
6. Keep your response focused and relevant to their question
7. Use a conversational, friendly tone

Guidelines:
- Be empathetic and understanding
- Highlight patterns or themes you notice
- Provide specific examples from their stories when relevant
- If they ask about emotions, analyze the emotional content
- If they ask about routines, identify patterns in their daily life
- If they ask about progress or growth, highlight positive developments
- Keep responses informative but not overly long (200-400 words)

Remember: This is personal content about someone's life. Be respectful, caring, and genuinely helpful."""

            print(f"Generating query response for {username}, query: {query[:50]}... (simple question: {is_simple_question})")

            # Adjust max_tokens based on question type
            max_tokens = 200 if is_simple_question else 500
            temperature = 0.3 if is_simple_question else 0.7

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a thoughtful AI assistant that analyzes personal stories and provides appropriate responses to questions about someone's life journey.",
                    },
                    {"role": "user", "content": query_prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )

            query_response = response.choices[0].message.content.strip()
            print(f"Query response generated successfully, length: {len(query_response)}")

            return query_response

        except Exception as e:
            print(f"Error generating query response: {e}")
            return f"I'm sorry, {username}. I'm having trouble analyzing your stories right now. Please try again in a moment, or feel free to ask a different question about your journal entries."

    async def generate_therapy_response(
        self,
        user_message: str,
        message_type: str,
        timeline_context: List[Dict[str, Any]],
        username: str,
    ) -> Optional[str]:
        """Generate an empathetic therapy response based on user's message and timeline context"""
        try:
            # Check if it's a simple greeting or short message
            simple_greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "what's up"]
            is_simple_message = user_message.lower().strip() in simple_greetings or len(user_message.strip()) < 20

            # Prepare timeline context summary
            timeline_summary = ""
            if timeline_context and not is_simple_message:
                recent_entries = []
                for entry in timeline_context[:5]:  # Focus on 5 most recent entries
                    date = entry.get("date", "Unknown date")
                    content = entry.get("content", "")
                    ai_story = entry.get("ai_story", "")
                    style = entry.get("style", "")

                    entry_text = content or ai_story
                    if entry_text:
                        recent_entries.append(f"[{date}] {entry_text[:200]}...")

                if recent_entries:
                    timeline_summary = (
                        f"\n\nRecent journal entries from {username}:\n"
                        + "\n".join(recent_entries)
                    )
                else:
                    timeline_summary = (
                        f"\n\nNote: {username} hasn't shared many recent entries yet."
                    )

            # Create therapy prompt based on message complexity
            if is_simple_message:
                therapy_prompt = f"""You are a warm and friendly AI companion. {username} has just said "{user_message}".

Respond in a simple, friendly, and human-like way:
- Keep it short and conversational (1-2 sentences max)
- Be warm and welcoming
- Don't be overly therapeutic or formal
- Match their energy and tone
- If it's a greeting, greet them back warmly
- If they ask how you are, respond naturally

Examples:
- "Hi there! 👋 How are you doing today?"
- "Hello! It's great to see you. How's your day going?"
- "Hey! I'm doing well, thanks for asking. How about you?"

Remember: Keep it simple, friendly, and human-like."""
            else:
                therapy_prompt = f"""You are an excellent, warm, and empathetic AI therapist specializing in human behavior and mental wellness. You are having a conversation with {username}, who has shared a message with you.

Your role:
- Provide compassionate, personalized support based on their journal history
- Offer gentle insights, encouragement, and practical suggestions
- Be warm, understanding, and motivational without being generic
- Consider their recent life experiences and emotional patterns
- Help them process feelings, find clarity, and build resilience
- Always maintain professional therapeutic boundaries while being genuinely caring

User's current message ({message_type}): "{user_message}"
{timeline_summary}

Guidelines for your response:
1. Acknowledge their feelings and validate their experience
2. Reference relevant patterns or themes from their recent entries when appropriate
3. Offer personalized insights based on their journey
4. Provide gentle, actionable suggestions if helpful
5. Be encouraging and highlight their strengths
6. Ask thoughtful follow-up questions to help them explore deeper
7. Keep responses warm but professional (150-300 words max)
8. If they're struggling, offer specific coping strategies
9. Celebrate their progress and growth when evident
10. Always end with support and openness for continued conversation

Remember: This is a real person sharing their inner world. Respond with genuine care, wisdom, and hope."""

            print(
                f"Generating therapy response for {username}, message type: {message_type}, simple: {is_simple_message}"
            )

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a highly skilled, empathetic AI therapist. Your responses should be warm, personalized, and genuinely helpful. Always consider the user's unique context and journey.",
                    },
                    {"role": "user", "content": therapy_prompt},
                ],
                max_tokens=300 if is_simple_message else 400,
                temperature=0.7,
            )

            therapy_response = response.choices[0].message.content.strip()
            print(
                f"Therapy response generated successfully, length: {len(therapy_response)}"
            )

            return therapy_response

        except Exception as e:
            print(f"Error generating therapy response: {e}")
            # Return a compassionate fallback response
            return f"I'm sorry, {username}. I'm having a moment of technical difficulty, but I want you to know that I'm here for you. Your feelings and experiences matter deeply. Please feel free to share again, and remember that seeking support is a sign of strength. You're not alone in this journey."

    async def generate_weekly_summary_with_mood(
        self, entries: List[Any], user_id: int, db: Any
    ) -> Optional[str]:
        """Generate a weekly summary that includes mood insights"""
        try:
            # Get mood data for the week
            week_ago = datetime.now() - timedelta(days=7)

            # Import here to avoid circular imports
            from database import MoodEntry

            mood_entries = (
                db.query(MoodEntry)
                .filter(MoodEntry.user_id == user_id, MoodEntry.date >= week_ago)
                .order_by(MoodEntry.date.desc())
                .all()
            )

            # Prepare context
            week_content = []
            for entry in entries:
                if entry.text_content or entry.ai_generated_story:
                    content = entry.ai_generated_story or entry.text_content
                    week_content.append(
                        f"[{entry.date.strftime('%B %d')}] {content[:150]}..."
                    )

            mood_context = []
            for mood in mood_entries:
                mood_text = f"[{mood.date.strftime('%B %d')}] Mood: {mood.mood_emoji} ({mood.mood_value}/5)"
                if mood.mood_note:
                    mood_text += f" - {mood.mood_note}"
                mood_context.append(mood_text)

            if not week_content and not mood_context:
                return "It's been a quiet week with space for new experiences and reflections."

            context = f"""Weekly Memories:
{chr(10).join(week_content) if week_content else "No major entries this week."}

Weekly Mood Patterns:
{chr(10).join(mood_context) if mood_context else "No mood entries recorded this week."}"""

            prompt = f"""You are an AI life narrator creating a beautiful, personalized weekly summary. Based on the following week's memories and mood patterns, write a warm, insightful summary that:

1. Highlights key moments and experiences
2. Acknowledges emotional patterns and growth
3. Offers gentle encouragement and perspective
4. Feels personal and celebratory
5. Mentions positive trends or resilience shown

{context}

Write a 2-3 paragraph summary that feels like a caring friend reflecting on their week with wisdom and warmth."""

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a warm, insightful AI companion who creates beautiful weekly summaries that celebrate the user's journey and emotional growth.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400,
                temperature=0.8,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating weekly summary with mood: {e}")
            return "This week has been filled with moments of growth and reflection. Every experience, big or small, contributes to your unique story."


# Global AI service instance
ai_service = AIService()
