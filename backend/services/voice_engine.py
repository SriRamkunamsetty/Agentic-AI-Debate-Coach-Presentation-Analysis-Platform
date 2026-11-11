"""Neural Voice Synthesis Engine for LOGOS.AI.

Converts AI opponent rebuttals into spoken audio (MP3) so users can experience
true bidirectional voice debate sparring. Uses edge-tts asynchronously with
graceful fallbacks.
"""

from __future__ import annotations

import io
import logging
import struct
import wave
from pathlib import Path
from typing import Optional

LOGGER = logging.getLogger(__name__)

VOICE_MAP = {
    "The Contrarian": "en-US-GuyNeural",
    "The Academic": "en-GB-RyanNeural",
    "The Strategist": "en-US-ChristopherNeural",
    "The Socratic Inquirer": "en-US-BrianNeural",
    "The Populist Orator": "en-US-EricNeural",
}


class VoiceEngine:
    async def synthesize_speech(self, text: str, persona: str = "The Contrarian", output_path: Optional[Path] = None) -> bytes:
        voice = VOICE_MAP.get(persona, "en-US-GuyNeural")
        clean_text = " ".join(text.split())[:1000]

        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, voice)
            audio_buffer = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.extend(chunk["data"])
            
            audio_bytes = bytes(audio_buffer)
            if output_path and audio_bytes:
                output_path.write_bytes(audio_bytes)
            return audio_bytes
        except Exception as exc:
            LOGGER.warning("Neural TTS failed or edge-tts not installed (%s). Generating fallback audio tone.", exc)
            return self._generate_fallback_audio(clean_text, output_path)

    def _generate_fallback_audio(self, text: str, output_path: Optional[Path] = None) -> bytes:
        """Generates a brief valid WAV tone when neural voice services are offline."""
        sample_rate = 16000
        duration_s = min(2.0, max(0.5, len(text) * 0.03))
        num_samples = int(sample_rate * duration_s)
        samples = []
        for i in range(num_samples):
            # Soft sine wave at 440 Hz (Concert A)
            val = int(8000 * 0.3 * (1.0 if (i % 36) < 18 else -1.0))
            samples.append(struct.pack("<h", val))

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(b"".join(samples))

        data = buf.getvalue()
        if output_path:
            output_path.write_bytes(data)
        return data


voice_engine_service = VoiceEngine()
