import openai
import os
import base64
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")


class AIService:
    def __init__(self):
        # OpenAI API key is already set globally
        pass

    async def transcribe_audio(self, audio_file_path: str) -> Optional[str]:
        """Transcribe audio file using OpenAI Whisper"""
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = openai.Audio.transcribe(
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
            response = openai.ChatCompletion.create(
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
            response = openai.Image.create(
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
            response = openai.ChatCompletion.create(
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
            response = openai.ChatCompletion.create(
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


# Global AI service instance
ai_service = AIService()
