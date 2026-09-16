"""Generate restaurant CCTV stills and 15s clips via fal.ai. Credentials stay in .env."""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
STILLS = Path(__file__).resolve().parent / "stills"
OUT = ROOT / "public" / "restaurant-media"
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


def generate_still(fal_client, clip: dict) -> Path:
    STILLS.mkdir(parents=True, exist_ok=True)
    out = STILLS / f"{clip['id']}.png"
    if out.exists() and out.stat().st_size > 20_000:
        log(f"still {clip['id']} exists")
        return out
    log(f"still {clip['id']} generating")
    result = fal_client.subscribe(
        IMAGE_ENDPOINT,
        arguments={
            "prompt": clip["image_prompt"],
            "image_size": "landscape_16_9",
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


def main() -> None:
    load_env()
    try:
        import fal_client
    except ImportError:
        os.system(f"{sys.executable} -m pip install fal-client httpx")
        import fal_client

    status = {"clips": []}
    for clip in CLIPS:
        still = generate_still(fal_client, clip)
        video = generate_video(fal_client, clip, still)
        status["clips"].append({"id": clip["id"], "still": str(still), "video": str(video), "bytes": video.stat().st_size})
        write_status(status)
    log("all restaurant clips ready")


if __name__ == "__main__":
    main()
