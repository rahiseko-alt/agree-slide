"""Generate reusable narration files for an agent-authored project. No browser API keys."""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.request

VOICES = {"ja": "ja-JP-KeitaNeural", "en": "en-US-GuyNeural", "ne": "ne-NP-SagarNeural", "vi": "vi-VN-NamMinhNeural"}
ROOT = Path(__file__).resolve().parent.parent


def arguments():
    parser = argparse.ArgumentParser(description="Generate calm, professional narration from content/project.json")
    parser.add_argument("project", nargs="?", default="content/project.json")
    parser.add_argument("--languages", default="ja")
    parser.add_argument("--provider", choices=["edge", "openai"], default="edge")
    parser.add_argument("--voice", help="Override the default voice (use with one language)")
    return parser.parse_args()


async def main():
    args = arguments()
    project_file = Path(args.project)
    project = json.loads(project_file.read_text(encoding="utf-8"))
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", project["id"]):
        raise ValueError("Invalid project id")
    languages = [language.strip() for language in args.languages.split(",")]
    if args.voice and len(languages) != 1:
        raise ValueError("--voice requires one language")
    semaphore = asyncio.Semaphore(2)
    manifest_file = ROOT / "public/audio/catalog.json"
    manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else {"version": 1, "tracks": {}}

    async def generate(scene, language):
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", scene["id"]) or not re.fullmatch(r"[a-z]{2,3}(?:-[A-Za-z]{2,4})?", language):
            raise ValueError("Invalid scene id or language")
        narration = scene.get("narration")
        if not narration:
            return
        text = narration["script"].get(language)
        if not text or not text.strip():
            raise ValueError(f"Missing {language} narration for {scene['id']}. Translate it first.")
        voice = args.voice or (VOICES.get(language) if args.provider == "edge" else "onyx")
        if not voice:
            raise ValueError(f"No default voice for {language}; specify --voice.")
        relative = f"audio/{project['id']}/{language}/{scene['id']}.mp3"
        target = ROOT / "public" / relative
        fingerprint = hashlib.sha256(f"{args.provider}:{voice}:-5%:{text}".encode()).hexdigest()
        previous = manifest["tracks"].get(relative, {})
        if target.exists() and target.stat().st_size and previous.get("fingerprint") == fingerprint:
            narration.setdefault("audio", {})[language] = "./" + relative
            print(f"Reusing {relative}", flush=True)
            return
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".tmp.mp3")
        async with semaphore:
            if args.provider == "edge":
                try:
                    import edge_tts
                except ImportError as error:
                    raise RuntimeError("Install the optional voice dependency: python -m pip install -r scripts/requirements-voice.txt") from error
                proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
                await edge_tts.Communicate(text, voice, rate="-5%", pitch="-2Hz", proxy=proxy).save(str(temporary))
            else:
                key = os.environ.get("OPENAI_API_KEY")
                if not key:
                    raise RuntimeError("Set OPENAI_API_KEY in your local environment; never put it in project.json or browser code.")
                payload = {"model": "gpt-4o-mini-tts", "voice": voice, "input": text, "response_format": "mp3", "instructions": "Use a calm, clear, neutral business presentation style. No theatrical emotion or exaggerated character voice. Speak in the language of the input."}
                request = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=json.dumps(payload).encode(), headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
                def download():
                    with urllib.request.urlopen(request, timeout=90) as response:
                        temporary.write_bytes(response.read())
                await asyncio.to_thread(download)
            if not temporary.exists() or temporary.stat().st_size < 100:
                raise RuntimeError("Speech service returned no audio")
            temporary.replace(target)
            narration.setdefault("audio", {})[language] = "./" + relative
            manifest["tracks"][relative] = {"provider": args.provider, "voice": voice, "language": language, "fingerprint": fingerprint, "rate": "-5%", "style": "neutral business narration"}
            print(f"Generated {relative}", flush=True)

    tasks = [generate(scene, language) for scene in project["slides"] for language in languages]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    # Preserve successful work even if a service fails on another track.
    project_file.write_text(json.dumps(project, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest_file.parent.mkdir(parents=True, exist_ok=True)
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    errors = [result for result in results if isinstance(result, Exception)]
    if errors:
        for error in errors:
            print(f"Narration failed: {type(error).__name__}: {error}")
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
