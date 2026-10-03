"""Find existing artwork or download a licensed, designer-created raster asset."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "public/illustrations/catalog.json"

parser = argparse.ArgumentParser(description="Reuse illustrations before downloading new assets")
commands = parser.add_subparsers(dest="command", required=True)
find = commands.add_parser("find")
find.add_argument("query", nargs="?", default="")
download = commands.add_parser("download")
for option in ["id", "url", "source-page", "license", "license-url", "creator", "tags"]:
    download.add_argument("--" + option, required=True)
args = parser.parse_args()
catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
if args.command == "find":
    terms = args.query.lower().split()
    results = [asset for asset in catalog["assets"] if not terms or all(term in json.dumps(asset, ensure_ascii=False).lower() for term in terms)]
    print(json.dumps(results, ensure_ascii=False, indent=2))
    raise SystemExit(0)

if not re.fullmatch(r"[a-zA-Z0-9_-]+", args.id):
    raise ValueError("Use letters, numbers, underscores or hyphens for the asset id")
policy = json.loads((ROOT / "content/asset-sources.json").read_text())
url = urllib.parse.urlparse(args.url)
page = urllib.parse.urlparse(args.source_page)
matching = [source for source in policy["sources"] if page.hostname in source["pageHosts"] and url.hostname in source["downloadHosts"] and args.license in source["licenses"]]
if url.scheme != "https" or page.scheme != "https" or not matching or urllib.parse.urlparse(args.license_url).scheme != "https":
    raise ValueError("Source or license not approved. Verify the original license and add it to content/asset-sources.json first.")
if any(asset["id"] == args.id for asset in catalog["assets"]):
    raise ValueError("Asset id exists. Reuse it or choose a new id; existing stock is never overwritten.")
with urllib.request.urlopen(args.url, timeout=30) as response:
    data = response.read(8 * 1024 * 1024 + 1)
if len(data) > 8 * 1024 * 1024:
    raise ValueError("Asset must be under 8 MB")
if data.startswith(b"\x89PNG\r\n\x1a\n"):
    extension = ".png"
elif data.startswith(b"RIFF") and data[8:12] == b"WEBP":
    extension = ".webp"
elif data.startswith(b"\xff\xd8\xff"):
    extension = ".jpg"
else:
    raise ValueError("Download an original PNG, WebP or JPEG. Agent-drawn SVG illustrations are prohibited.")
target = ROOT / "public/illustrations" / (args.id + extension)
target.write_bytes(data)
catalog["assets"].append({"id": args.id, "path": "./illustrations/" + target.name, "creator": args.creator, "sourcePage": args.source_page, "downloadUrl": args.url, "license": args.license, "licenseUrl": args.license_url, "tags": [tag.strip() for tag in args.tags.split(",")], "sha256": hashlib.sha256(data).hexdigest()})
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Saved {target.relative_to(ROOT)}; license recorded in catalog.json")
