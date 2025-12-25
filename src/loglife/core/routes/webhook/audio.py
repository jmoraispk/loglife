"""Audio track for generating robotic 'Hello' sound in WebRTC calls."""

import fractions
import math
import struct
import time

try:
    from aiortc import MediaStreamTrack
    from av import AudioFrame

    AIORTC_AVAILABLE = True
except ImportError:
    AIORTC_AVAILABLE = False

    class MediaStreamTrack:  # type: ignore[no-redef]
        """Placeholder MediaStreamTrack when aiortc is not available."""


class RoboticHelloTrack(MediaStreamTrack):
    """A MediaStreamTrack that synthesizes a robotic 'Hello' using simple formants."""

    kind = "audio"

    # Time constants for formant transitions
    HE_START = 0.0
    HE_END = 0.3
    LLO_START = 0.3
    LLO_END = 0.6

    def __init__(self) -> None:
        """Initialize the robotic hello track."""
        super().__init__()
        self.sample_rate = 48000
        self._timestamp = 0
        self._start_time = time.time()
        self.muted = False

    async def recv(self) -> "AudioFrame":
        """Receive the next audio frame.

        Returns:
            AudioFrame containing synthesized audio data

        Raises:
            ImportError: If aiortc is not installed
        """
        if not AIORTC_AVAILABLE:
            error_msg = "aiortc is not installed"
            raise ImportError(error_msg)

        # 20ms frame size
        pts = self._timestamp
        samples = 960  # 48000 * 0.02
        self._timestamp += samples

        # Create frame
        frame = AudioFrame(format="s16", layout="mono", samples=samples)
        frame.pts = pts
        frame.sample_rate = self.sample_rate
        frame.time_base = fractions.Fraction(1, self.sample_rate)

        data = bytearray(samples * 2)  # 2 bytes per sample (s16)

        if not self.muted:
            # Time in seconds relative to track start
            # We want to loop "Hello" every 2 seconds
            # 0.0 - 0.3: "He" (Formants ~500Hz, ~1800Hz)
            # 0.3 - 0.6: "llo" (Formants ~400Hz, ~800Hz)
            # 0.6 - 2.0: Silence

            # Calculate current time in the loop
            current_t = (pts / self.sample_rate) % 2.0

            f1 = 0.0
            f2 = 0.0
            amp = 0.0

            if self.HE_START <= current_t < self.HE_END:
                # "He"
                f1 = 530.0
                f2 = 1840.0
                amp = 0.5
            elif self.LLO_START <= current_t < self.LLO_END:
                # "llo"
                f1 = 500.0
                f2 = 1000.0
                amp = 0.5

            if amp > 0:
                inv_sr = 1.0 / self.sample_rate

                # We simply sum two sine waves to approximate the vowel formants
                # This sounds like a simple DTMF or robotic tone
                for i in range(samples):
                    t = (pts + i) * inv_sr

                    # Simple fade in/out for the pulse to avoid clicks
                    # This is per-chunk, which is imperfect but okay for testing

                    val = math.sin(2 * math.pi * f1 * t) + 0.5 * math.sin(2 * math.pi * f2 * t)

                    # Normalize and scale
                    sample = int(val * 10000 * amp)

                    # Clamp
                    sample = max(-32768, min(32767, sample))

                    struct.pack_into("<h", data, i * 2, sample)

        frame.planes[0].update(data)
        return frame
