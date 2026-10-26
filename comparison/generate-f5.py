"""Generate the comparison line with F5-TTS, using the package's bundled
reference clip so we can hear F5's prosody/expressiveness vs flat Kokoro."""
import os
import site

from f5_tts.api import F5TTS

HERE = os.path.dirname(os.path.abspath(__file__))
GEN_TEXT = open(os.path.join(HERE, "line.txt")).read().strip()

# locate the bundled example reference shipped with f5-tts (namespace package,
# so resolve via site-packages rather than f5_tts.__file__)
ref_audio = None
for sp in site.getsitepackages() + [site.getusersitepackages()]:
    candidate = os.path.join(sp, "f5_tts", "infer", "examples", "basic", "basic_ref_en.wav")
    if os.path.exists(candidate):
        ref_audio = candidate
        break
if ref_audio is None:
    raise SystemExit("Could not find F5-TTS example reference audio")

ref_text = "Some call me nature, others call me mother nature."

print(f"Reference: {ref_audio}")
print("Loading F5-TTS model (first run downloads ~1.3GB)…")

f5 = F5TTS()
out_wav = os.path.join(HERE, "f5tts.wav")

f5.infer(
    ref_file=ref_audio,
    ref_text=ref_text,
    gen_text=GEN_TEXT,
    file_wave=out_wav,
    seed=42,
)

print(f"Wrote {out_wav}")
