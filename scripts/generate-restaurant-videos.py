"""Generate restaurant CCTV stills and 15s clips via fal.ai. Credentials stay in .env.

Usage
  python scripts/generate-restaurant-videos.py                 # v1 set, stills + videos (legacy)
  python scripts/generate-restaurant-videos.py --set v2        # v2 wide/face set, STILLS ONLY
  python scripts/generate-restaurant-videos.py --set portraits # staff enrollment portraits (stills)
  python scripts/generate-restaurant-videos.py --set v2 --videos   # Kling I2V for v2 (run only after approval)

Stills are cheap (Flux). Kling video is the expensive step and never runs unless --videos is passed
(the legacy v1 set keeps its old behaviour for compatibility).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
STILLS = Path(__file__).resolve().parent / "stills"
OUT = ROOT / "public" / "restaurant-media"
PORTRAITS_OUT = OUT / "portraits"
STATUS = Path(__file__).resolve().parent / ".video-status.json"

IMAGE_ENDPOINT = "fal-ai/flux/dev"
VIDEO_ENDPOINT = "fal-ai/kling-video/v3/standard/image-to-video"

NEGATIVE = (
    "cinematic movie, commercial, fashion shoot, staged posing, dramatic acting, "
    "trailer, promotional video, glossy advertising, slow motion, drone shot, "
    "handheld camera, zoom, tracking shot, CGI, cartoon, animation, video game, "
    "plastic skin, cloned faces, distorted face, deformed body, extra fingers, "
    "text overlay other than CCTV timestamp, subtitles, logo watermark, "
    "bright studio lighting, bokeh, shallow depth of field"
)

CCTV = (
    "Authentic fixed-camera restaurant security CCTV footage look. Completely "
    "stationary camera, high corner mount, wide lens, slight barrel distortion, "
    "mild analog noise, compression artifacts, muted colour, realistic indoor "
    "lighting, no cinematic grading. Burned-in white timestamp and camera name "
    "in the top-left corner. People move independently and naturally. Consistent "
    "faces and uniforms. No violence, no weapons, no nudity."
)

CLIPS = [
    {
        "id": "dining-floor",
        "title": "Dining Floor 01",
        "image_prompt": (
            "Still frame from a high-corner CCTV camera over a fine-dining restaurant "
            "floor at night. Dark wood tables with white cloths, warm wall sconces, "
            "a few couples and a party of four being seated by a host. Waitstaff in "
            "black waistcoats. Empty aisle down the centre. Timestamp 15-SEP-2026 "
            "19:02:11 CAM Dining Floor 01. Photorealistic surveillance still. " + CCTV
        ),
        "video_prompt": (
            "Fixed high-corner CCTV of a fine-dining restaurant floor. Guests enter "
            "from the left, a host leads a party of four to a centre table, they sit, "
            "unfold napkins, speak quietly. A waiter crosses the aisle with menus. "
            "Other tables already occupied. Camera never moves. Timestamp and CAM "
            "Dining Floor 01 remain. " + CCTV
        ),
    },
    {
        "id": "table-occupancy",
        "title": "Dining Floor 01 · T04",
        "image_prompt": (
            "Still frame from a high-corner CCTV camera looking down at a four-top "
            "restaurant table (T04) with four guests seated, plates and glassware, "
            "white tablecloth, neighbouring tables partly visible. Timestamp "
            "15-SEP-2026 19:18:44 CAM Dining Floor 01. Photorealistic surveillance still. "
            + CCTV
        ),
        "video_prompt": (
            "Fixed CCTV of four guests occupying restaurant table T04. They eat, talk, "
            "lift glasses, a diner checks a phone briefly. Background waiters pass. "
            "Nobody stands and leaves. Camera absolutely stationary. Timestamp and CAM "
            "Dining Floor 01 remain. " + CCTV
        ),
    },
    {
        "id": "waiter-visit",
        "title": "Dining Floor 01 · Service",
        "image_prompt": (
            "Still frame from high-corner restaurant CCTV: a male waiter in a black "
            "waistcoat and white shirt approaches an occupied four-top table, menus "
            "or a tray in hand. Guests seated. Timestamp 15-SEP-2026 19:08:14 CAM "
            "Dining Floor 01. Photorealistic surveillance still. " + CCTV
        ),
        "video_prompt": (
            "Fixed CCTV: a waiter walks to table T04, greets the seated guests, "
            "sets down glasses or takes an order for a few seconds, then leaves the "
            "table toward the pass. Brief, operational interaction. Camera never moves. "
            "Timestamp and CAM Dining Floor 01 remain. " + CCTV
        ),
    },
    {
        "id": "multi-table-service",
        "title": "Dining Floor 02",
        "image_prompt": (
            "Still frame from high-corner CCTV covering several restaurant tables. "
            "A waiter in black waistcoat stands between two occupied tables. Warm "
            "low lighting, white cloths. Timestamp 15-SEP-2026 19:26:05 CAM Dining "
            "Floor 02. Photorealistic surveillance still. " + CCTV
        ),
        "video_prompt": (
            "Fixed CCTV of a waiter moving between multiple occupied tables: stops at "
            "one table, brief conversation, walks to the next table, pours water, "
            "continues. Natural restaurant service path. Camera stationary. Timestamp "
            "and CAM Dining Floor 02 remain. " + CCTV
        ),
    },
    {
        "id": "kitchen-activity",
        "title": "Kitchen 01 · Plating",
        "image_prompt": (
            "Still frame from a high-corner kitchen CCTV above a plating counter. "
            "Stainless steel, ticket rail, plates being finished, one cook in a white "
            "jacket and apron working with tweezers or a spoon. Adjacent prep area "
            "visible. Timestamp 15-SEP-2026 19:42:17 CAM Kitchen 01. Photorealistic "
            "surveillance still. " + CCTV
        ),
        "video_prompt": (
            "Fixed kitchen CCTV: a cook works at the plating counter, finishing plates, "
            "wiping rims, passing a plate toward the pass. Steam, practical motion, "
            "another cook in the background at prep. Camera never moves. Timestamp and "
            "CAM Kitchen 01 remain. " + CCTV
        ),
    },
    {
        "id": "kitchen-movement",
        "title": "Kitchen 02 · Stations",
        "image_prompt": (
            "Still frame from high-corner kitchen CCTV showing multiple stations: "
            "grill, prep, plating, and pass in one wide view. A cook walks from prep "
            "toward plating. Stainless counters, heat lamps over the pass. Timestamp "
            "15-SEP-2026 19:42:03 CAM Kitchen 02. Photorealistic surveillance still. "
            + CCTV
        ),
        "video_prompt": (
            "Fixed wide kitchen CCTV: a cook exits the prep station, walks across to "
            "the plating counter, begins plating, then later moves toward the pass "
            "with a finished plate. Other staff stay at grill and cold station. Camera "
            "absolutely stationary. Timestamp and CAM Kitchen 02 remain. " + CCTV
        ),
    },
]


# ---------------------------------------------------------------------------
# v2: wide, face-readable set. Same CCTV grammar, but the camera is mounted a
# little lower and closer so guests, servers and cooks have recognisable faces.
# One consistent description per staff member so portraits and camera stills
# describe the same person.
# ---------------------------------------------------------------------------

PEOPLE = {
    "wtr-alex": "Alex Morgan, male server in his early 30s, short dark hair, light stubble, black waistcoat over white shirt, black tie",
    "wtr-sofia": "Sofia Bennett, female server in her late 20s, dark hair in a low bun, black waistcoat over white shirt, black tie",
    "wtr-ethan": "Ethan Carter, male server in his mid 20s, short light-brown hair, clean shaven, black waistcoat over white shirt",
    "wtr-danielb": "Daniel Brooks, male server around 40, close-cropped grey hair, black waistcoat over white shirt",
    "kit-daniel": "Daniel Carter, male head chef in his 40s, shaved head, trimmed beard, white chef jacket, black apron",
    "kit-maria": "Maria Thompson, female cook in her 30s, dark hair under a black skull cap, white chef jacket",
    "kit-james": "James Wilson, male grill cook in his late 20s, red-brown hair, white chef jacket, grey apron",
    "kit-olivia": "Olivia Bennett, female pastry cook in her 20s, blonde hair tied back under a white cap, white chef jacket",
}

CCTV_WIDE = (
    "Authentic fixed restaurant security camera footage look, but from a high wall "
    "mount about 3 metres up and 5 to 6 metres from the subjects, wide lens, so "
    "every face in frame is clearly visible and readable, eyes and mouth distinct. "
    "Sharp focus across the whole frame, no bokeh. Even indoor lighting, faces "
    "well lit, no harsh shadows on faces. Mild sensor noise, muted colour, slight "
    "barrel distortion. Burned-in white timestamp and camera name in the top-left "
    "corner. Natural body language, nobody looks at the camera. Consistent faces, "
    "uniforms and hairstyles. No violence, no weapons, no nudity."
)

CLIPS_V2 = [
    {
        "id": "dining-floor-wide",
        "title": "Dining Floor 01 (wide)",
        "camera": "CAM Dining Floor 01",
        "image_prompt": (
            "Wide surveillance still of a fine-dining restaurant floor at dinner. Three "
            "to four tables with white cloths, dark wood, warm sconces. Eight seated "
            "guests of mixed ages, faces turned three-quarters toward the camera and "
            "clearly readable. One server, " + PEOPLE["wtr-sofia"] + ", walking down "
            "the centre aisle carrying two plates. Timestamp 15-SEP-2026 19:02:11 "
            "CAM Dining Floor 01. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed wide CCTV of a fine-dining floor. Seated guests talk and eat. The "
            "server walks the aisle, stops at a table, sets down plates, speaks briefly, "
            "moves on. Faces stay clear and readable. Camera never moves. Timestamp "
            "and CAM Dining Floor 01 remain. " + CCTV_WIDE
        ),
    },
    {
        "id": "table-occupancy-wide",
        "title": "Dining Floor 01 · T04 (wide)",
        "camera": "CAM Dining Floor 01",
        "image_prompt": (
            "Surveillance still of one four-top restaurant table T04 with four seated "
            "guests: two women and two men in their 30s and 40s, smart casual, faces "
            "well lit and clearly readable, mid conversation, glasses and plates on a "
            "white tablecloth. Neighbouring tables partly visible. Timestamp 15-SEP-2026 "
            "19:18:44 CAM Dining Floor 01. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed CCTV of four guests at table T04. They talk, lift glasses, one "
            "laughs, another leans back. Nobody stands or leaves. Faces remain clear. "
            "Camera absolutely stationary. Timestamp and CAM Dining Floor 01 remain. "
            + CCTV_WIDE
        ),
    },
    {
        "id": "server-visit-alex",
        "title": "Dining Floor 01 · Alex visit",
        "camera": "CAM Dining Floor 01",
        "image_prompt": (
            "Surveillance still: " + PEOPLE["wtr-alex"] + " standing at an occupied "
            "two-top table taking an order on a small pad, his face clearly visible in "
            "three-quarter view. Two seated guests, a man and a woman in their 30s, "
            "faces readable, looking at menus. Warm restaurant interior. Timestamp "
            "15-SEP-2026 19:08:14 CAM Dining Floor 01. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed CCTV: the server greets the two seated guests, writes on his pad, "
            "nods, collects the menus, turns and walks out of frame toward the pass. "
            "Faces stay well lit and identifiable. Camera never moves. Timestamp and "
            "CAM Dining Floor 01 remain. " + CCTV_WIDE
        ),
    },
    {
        "id": "server-visit-sofia",
        "title": "Dining Floor 02 · Sofia visit",
        "camera": "CAM Dining Floor 02",
        "image_prompt": (
            "Surveillance still: " + PEOPLE["wtr-sofia"] + " pouring water at an "
            "occupied four-top table, her face clearly visible in three-quarter view. "
            "Four seated guests with readable faces. A second table with two guests in "
            "the background. Warm restaurant interior. Timestamp 15-SEP-2026 19:26:05 "
            "CAM Dining Floor 02. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed CCTV: the server pours water for each guest, exchanges a word, then "
            "walks to the background table and checks on them. Faces remain clear. "
            "Camera never moves. Timestamp and CAM Dining Floor 02 remain. " + CCTV_WIDE
        ),
    },
    {
        "id": "kitchen-prep-wide",
        "title": "Kitchen 01 · Food prep / cooking",
        "camera": "CAM Kitchen 01",
        "image_prompt": (
            "Wide surveillance still of a professional restaurant kitchen prep and "
            "cooking line. Stainless counters, induction range, ticket rail. Two cooks "
            "facing the camera side of the counter so their faces are clearly visible: "
            + PEOPLE["kit-maria"] + " chopping herbs, and " + PEOPLE["kit-james"] +
            " at the range with a sauté pan. Bright even kitchen lighting. Timestamp "
            "15-SEP-2026 19:31:12 CAM Kitchen 01. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed wide kitchen CCTV: one cook chops and slides ingredients into a "
            "bowl, the other tosses a pan and reaches for seasoning. They exchange a "
            "glance and a word. Faces stay clearly visible. Camera never moves. "
            "Timestamp and CAM Kitchen 01 remain. " + CCTV_WIDE
        ),
    },
    {
        "id": "kitchen-assembly-wide",
        "title": "Kitchen 02 · Final food assembly",
        "camera": "CAM Kitchen 02",
        "image_prompt": (
            "Wide surveillance still of a restaurant kitchen final assembly and pass "
            "counter under heat lamps. " + PEOPLE["kit-daniel"] + " plating with "
            "tweezers, face clearly visible, and " + PEOPLE["kit-olivia"] + " wiping "
            "a plate rim beside him, face visible. Finished plates on the pass, "
            "stainless steel, bright even lighting. Timestamp 15-SEP-2026 19:49:10 "
            "CAM Kitchen 02. Photorealistic. " + CCTV_WIDE
        ),
        "video_prompt": (
            "Fixed wide kitchen CCTV: the head chef finishes two plates, wipes rims, "
            "slides them under the heat lamps and calls service; the pastry cook adds "
            "a garnish and steps back. Faces remain clear. Camera never moves. "
            "Timestamp and CAM Kitchen 02 remain. " + CCTV_WIDE
        ),
    },
]

PORTRAIT_STYLE = (
    "Staff enrollment photo captured by the restaurant's face recognition kiosk. "
    "Head and shoulders, facing the camera directly, neutral expression, eyes open, "
    "even soft front lighting, plain light-grey wall background, sharp focus, "
    "realistic skin texture, no retouching, no filters, no text, no watermark. "
    "Photorealistic ID-style photograph."
)

PORTRAITS = [{"id": person_id, "prompt": description + ". " + PORTRAIT_STYLE} for person_id, description in PEOPLE.items()]
PORTRAITS.append({
    "id": "unresolved-1",
    "prompt": (
        "Cropped CCTV frame of an unidentified restaurant server, male, mid 20s, dark "
        "curly hair, black waistcoat over white shirt, face clearly visible in "
        "three-quarter view, mild sensor noise, muted colour, slight motion blur on "
        "the shoulders only. Head and shoulders crop. No text. Photorealistic."
    ),
})
PORTRAITS.append({
    "id": "unresolved-2",
    "prompt": (
        "Cropped CCTV frame of an unidentified restaurant kitchen worker, female, "
        "around 30, dark hair under a black cap, white chef jacket, face clearly "
        "visible, mild sensor noise, muted colour. Head and shoulders crop. No text. "
        "Photorealistic."
    ),
})


def load_env() -> None:
    if ENV_PATH.exists():
        for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    key = os.environ.get("FAL_API_KEY") or os.environ.get("FAL_KEY")
    if not key:
        raise SystemExit("FAL_API_KEY missing. Set it in .env (server-side only).")
    os.environ["FAL_KEY"] = key
    os.environ["FAL_API_KEY"] = key


def log(message: str) -> None:
    print(message, flush=True)


def write_status(data: dict) -> None:
    STATUS.write_text(json.dumps(data, indent=2), encoding="utf-8")


def generate_still(fal_client, clip: dict, out_dir: Path | None = None, image_size: str = "landscape_16_9") -> Path:
    target_dir = out_dir or STILLS
    target_dir.mkdir(parents=True, exist_ok=True)
    out = target_dir / f"{clip['id']}.png"
    if out.exists() and out.stat().st_size > 20_000:
        log(f"still {clip['id']} exists")
        return out
    log(f"still {clip['id']} generating")
    result = fal_client.subscribe(
        IMAGE_ENDPOINT,
        arguments={
            "prompt": clip.get("image_prompt") or clip["prompt"],
            "image_size": image_size,
            "num_images": 1,
            "enable_safety_checker": True,
        },
        with_logs=False,
    )
    images = (result or {}).get("images") or []
    url = images[0]["url"] if images else None
    if not url:
        raise RuntimeError(f"no image url for {clip['id']}")
    import httpx

    with httpx.Client(timeout=120.0, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        out.write_bytes(resp.content)
    log(f"still {clip['id']} saved {out.stat().st_size} bytes")
    return out


def generate_video(fal_client, clip: dict, still: Path) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{clip['id']}.mp4"
    if out.exists() and out.stat().st_size > 80_000:
        log(f"video {clip['id']} exists")
        return out
    image_url = fal_client.upload_file(str(still))
    log(f"video {clip['id']} generating")
    last_err = None
    for attempt in range(1, 4):
        try:
            result = fal_client.subscribe(
                VIDEO_ENDPOINT,
                arguments={
                    "prompt": clip["video_prompt"],
                    "start_image_url": image_url,
                    "duration": "15",
                    "generate_audio": False,
                    "negative_prompt": NEGATIVE,
                    "cfg_scale": 0.5,
                },
                with_logs=False,
            )
            video = (result or {}).get("video") or {}
            url = video.get("url")
            if not url:
                raise RuntimeError(f"no video url keys={list((result or {}).keys())}")
            import httpx

            with httpx.Client(timeout=180.0, follow_redirects=True) as client:
                resp = client.get(url)
                resp.raise_for_status()
                tmp = out.with_suffix(".part.mp4")
                tmp.write_bytes(resp.content)
                tmp.replace(out)
            log(f"video {clip['id']} saved {out.stat().st_size} bytes")
            return out
        except Exception as exc:
            last_err = exc
            log(f"video {clip['id']} attempt {attempt} failed {type(exc).__name__}")
            time.sleep(4 * attempt)
    raise last_err


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--set", choices=["v1", "v2", "portraits"], default="v1", help="which shot list to run")
    parser.add_argument("--stills-only", action="store_true", help="never call the video endpoint")
    parser.add_argument("--videos", action="store_true", help="run Kling image-to-video for the v2 set (approval gate)")
    parser.add_argument("--only", nargs="*", default=None, help="restrict to these clip ids")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env()
    try:
        import fal_client
    except ImportError:
        os.system(f"{sys.executable} -m pip install fal-client httpx")
        import fal_client

    if args.set == "portraits":
        status = {"portraits": []}
        for portrait in PORTRAITS:
            if args.only and portrait["id"] not in args.only:
                continue
            still = generate_still(fal_client, portrait, out_dir=PORTRAITS_OUT, image_size="square_hd")
            status["portraits"].append({"id": portrait["id"], "still": str(still)})
        write_status(status)
        log("portraits ready (stills only)")
        return

    if args.set == "v2":
        run_videos = args.videos and not args.stills_only
        status = {"set": "v2", "clips": []}
        for clip in CLIPS_V2:
            if args.only and clip["id"] not in args.only:
                continue
            still = generate_still(fal_client, clip, out_dir=STILLS / "v2")
            entry = {"id": clip["id"], "still": str(still)}
            if run_videos:
                video = generate_video(fal_client, clip, still)
                entry.update({"video": str(video), "bytes": video.stat().st_size})
            status["clips"].append(entry)
            write_status(status)
        log("v2 stills ready" + (" and videos rendered" if run_videos else " (stills only; pass --videos after approval)"))
        return

    status = {"set": "v1", "clips": []}
    for clip in CLIPS:
        if args.only and clip["id"] not in args.only:
            continue
        still = generate_still(fal_client, clip)
        if args.stills_only:
            status["clips"].append({"id": clip["id"], "still": str(still)})
            write_status(status)
            continue
        video = generate_video(fal_client, clip, still)
        status["clips"].append({"id": clip["id"], "still": str(still), "video": str(video), "bytes": video.stat().st_size})
        write_status(status)
    log("all restaurant clips ready")


if __name__ == "__main__":
    main()
