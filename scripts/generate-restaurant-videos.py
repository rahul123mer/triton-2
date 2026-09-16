"""Generate restaurant CCTV stills and 15s clips via fal.ai. Credentials stay in .env.

Usage
  python scripts/generate-restaurant-videos.py                 # v1 set, stills + videos (legacy)
  python scripts/generate-restaurant-videos.py --set v2        # v2 wide/face set, STILLS ONLY
  python scripts/generate-restaurant-videos.py --set portraits # staff enrollment portraits (stills)
  python scripts/generate-restaurant-videos.py --set v2 --videos   # Kling I2V for v2 (run only after approval)
  python scripts/generate-restaurant-videos.py --set v3        # six-camera set composed from staff portraits, STILLS ONLY
  python scripts/generate-restaurant-videos.py --set v3 --videos   # Kling I2V for v3 (run only after approval)

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
    "fd-grace": "Grace Kim, female host and front-desk receptionist in her late 20s, Korean-American, straight black shoulder-length hair, black blazer over a white blouse, small name badge",
    "kit-marcus": "Marcus Reed, male kitchen porter and dishwasher in his mid 30s, African-American, short hair, black T-shirt under a long waterproof grey apron, black nitrile gloves",
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


# ---------------------------------------------------------------------------
# v3: six fixed cameras covering one US restaurant during one dinner service.
# Stills are composed with a reference-image model (nano-banana-2/edit): staff
# portraits are passed as identity references, and the first wide dining still
# and the kitchen prep still are passed back in as environment references so
# every camera looks like the same building. Scenes are ordered so anchors are
# rendered before the scenes that depend on them.
# ---------------------------------------------------------------------------

REF_ENDPOINT = "fal-ai/nano-banana-2/edit"

VENUE = (
    "The Ember Room, an upscale-casual American restaurant in a US city: exposed "
    "brick, dark walnut tables, oxblood leather booths along the wall, brass "
    "pendant lights, a long bar with backlit shelving visible in the background, "
    "framed prints, a wooden host stand near the entrance with a tablet POS and "
    "card reader. Servers wear black waistcoats over white shirts with black "
    "ties; kitchen staff wear white chef jackets; the host wears a black blazer."
)

CCTV_V3 = (
    "Authentic footage from a permanently mounted commercial security camera: "
    "fixed high wall/ceiling mount about 3 metres up, wide-angle lens with slight "
    "barrel distortion, the whole room in sharp focus, no bokeh, no shallow depth "
    "of field, no cinematic grading, muted colour, mild sensor noise and light "
    "compression artefacts, even indoor lighting so every face is clearly lit and "
    "readable. Burned-in white monospace text in the top-left corner reading the "
    "timestamp and camera name exactly as given. Several people are mid-motion at "
    "once, all with natural posture, correct hands and proportions, nobody looks "
    "at the camera, no duplicated people. Photorealistic surveillance still, not "
    "a photograph, not a film frame."
)

CCTV_V3_VIDEO = (
    "The camera is a permanently mounted security camera and must not move at all: "
    "no pan, no tilt, no zoom, no rotation, no tracking, no reframing, no change of "
    "focal length; the first and last frame share exactly the same framing. Only "
    "the people move. Multiple people move at the same time, at natural walking "
    "and working speed, and anyone leaving the frame simply walks out of view. "
    "Faces stay consistent, hands and bodies stay anatomically correct, no one "
    "duplicates or morphs. Timestamp text stays fixed in the top-left corner. "
    "Muted colour, slight noise, even lighting, continuous CCTV recording look."
)

SCENES_V3 = [
    {
        "id": "dining-wide",
        "title": "Dining Wide",
        "camera": "CAM Dining Wide",
        "refs": ["wtr-alex", "wtr-sofia", "fd-grace"],
        "env_ref": None,
        "image_prompt": (
            "Wide-angle security camera still covering the whole main dining room of "
            + VENUE + " Eight to ten tables visible: booths along the right wall, "
            "free-standing tables in the centre, the bar in the far background and the "
            "host stand near the entrance at the far left. About twenty guests of mixed "
            "ages and ethnicities, US casual dress, seated, eating, talking, one couple "
            "being led to a table by the host (the woman from the third reference "
            "image). The two servers from the first two reference images are on the "
            "floor: the man carrying plates down the centre aisle, the woman taking an "
            "order at a booth. Use the reference images strictly for the faces and "
            "hairstyles of those three staff. Timestamp text: 15-SEP-2026 19:04:22 "
            "CAM Dining Wide. " + CCTV_V3
        ),
        "video_prompt": (
            "Fixed wide security camera over a busy American restaurant dining room at "
            "dinner. The host leads a couple to an empty table and seats them; a server "
            "carries plates along the centre aisle and sets them down; another server "
            "moves between two booths; guests eat, talk, gesture, one checks a phone; a "
            "party of two stands, puts on jackets and walks out toward the entrance. "
            + CCTV_V3_VIDEO
        ),
    },
    {
        "id": "dining-cam-1",
        "title": "Dining Area · Camera 1",
        "camera": "CAM Dining 01",
        "refs": ["wtr-alex", "wtr-ethan"],
        "env_ref": None,
        "image_prompt": (
            "Security camera still from a camera mounted high on the back wall of "
            + VENUE + " This camera is above the bar looking back toward the front "
            "entrance, the reverse of a wide overview shot: the row of oxblood leather "
            "booths runs along the LEFT side of the frame receding away from the "
            "camera, two walnut two-tops sit in the foreground right, and the glass "
            "front door and host stand are small in the far background. It covers five "
            "tables. Twelve guests: a family with a young child in the nearest booth, "
            "two women in their 20s sharing an appetizer in the next booth, an older "
            "couple reading menus in the third, a man alone with a laptop at one "
            "two-top, and a couple looking at a phone together at the other. The man "
            "from the first reference image is refilling water at the family's booth; "
            "the man from the second reference image is walking toward the camera "
            "carrying a tray of drinks. Use the reference images strictly for those two "
            "servers' faces and hair. All faces clearly visible. Timestamp text: "
            "15-SEP-2026 19:06:48 CAM Dining 01. " + CCTV_V3
        ),
        "video_prompt": (
            "Fixed security camera over five restaurant tables. Guests eat and talk; a "
            "woman laughs; a man scrolls his phone; a child fidgets in a booth. One "
            "server refills water glasses at a booth and moves to the next table; a "
            "second server walks past the camera with a tray and leaves the frame at "
            "the bottom edge. " + CCTV_V3_VIDEO
        ),
    },
    {
        "id": "dining-cam-2",
        "title": "Dining Area · Camera 2",
        "camera": "CAM Dining 02",
        "refs": ["wtr-sofia", "wtr-danielb"],
        "env_ref": None,
        "image_prompt": (
            "Security camera still from a camera mounted high on the brick side wall of "
            + VENUE + " This camera looks straight across the centre of the room at a "
            "lower, closer angle: the free-standing walnut tables fill the frame, the "
            "bar with its backlit shelving is directly behind them, and the swinging "
            "kitchen door is visible at the right edge. No booths are in this view. It "
            "covers five tables: two four-tops in front and three two-tops behind. Ten "
            "guests: a group of four friends in their 30s passing shared plates, a "
            "couple finishing dessert with coffee, a table just vacated with crumpled "
            "napkins and a bill folder, two men in business casual mid conversation, "
            "and a woman in a red sweater on her phone. The woman from the first "
            "reference image is presenting a bill folder at the dessert couple's table; "
            "the older man from the second reference image is stacking plates from the "
            "vacated table. A guest in a dark jacket walks away from the camera toward "
            "the bar. Use the reference images strictly for those two servers' faces "
            "and hair. All faces clearly visible. Timestamp text: 15-SEP-2026 19:09:15 "
            "CAM Dining 02. " + CCTV_V3
        ),
        "video_prompt": (
            "Fixed security camera over five restaurant tables. A server presents a "
            "bill folder, waits, takes a card and walks away; a second server stacks "
            "plates from an empty table and carries them off toward the kitchen; a "
            "guest in a jacket walks out of frame toward the bar; the group of four "
            "passes dishes and talks; the couple sits back and sips coffee. "
            + CCTV_V3_VIDEO
        ),
    },
    {
        "id": "kitchen-prep",
        "title": "Kitchen · Food Preparation & Takeaway",
        "camera": "CAM Kitchen 01",
        "refs": ["kit-daniel", "kit-maria", "kit-james"],
        "env_ref": None,
        "image_prompt": (
            "Security camera still of the back-of-house kitchen of an upscale-casual "
            "American restaurant: stainless steel prep counters, six-burner range with "
            "sauté pans, flat-top, ticket rail with printed tickets, heat lamps over "
            "the pass, a takeaway packing station with brown paper bags and stacked "
            "black clamshell containers, wall-mounted hand-wash sink, quarry-tile floor, "
            "fluorescent light. The man with the shaved head and beard from the first "
            "reference image is plating at the pass; the woman from the second reference "
            "image is chopping vegetables at the prep counter; the man from the third "
            "reference image is at the range shaking a pan. A fourth cook with his back "
            "to the camera packs a takeaway order into a bag. Faces of the three named "
            "cooks clearly visible. Timestamp text: 15-SEP-2026 19:11:03 CAM Kitchen 01. "
            + CCTV_V3
        ),
        "video_prompt": (
            "Fixed security camera in a restaurant kitchen during service. The head chef "
            "plates two dishes, wipes rims, slides them under the heat lamps and pulls a "
            "ticket; a cook chops vegetables and scrapes them into a pan; a line cook "
            "tosses a sauté pan and reaches for seasoning; a fourth cook seals a "
            "takeaway container, bags it, staples the receipt and sets it on the shelf; "
            "a server enters from the right, collects the plates and exits. "
            + CCTV_V3_VIDEO
        ),
    },
    {
        "id": "kitchen-wash",
        "title": "Kitchen · Washing Area",
        "camera": "CAM Kitchen 02",
        "refs": ["kit-marcus", "kit-olivia"],
        "env_ref": "kitchen-prep",
        "image_prompt": (
            "Security camera still of the dish and vegetable washing area at the back "
            "of the same restaurant kitchen shown in the last reference image (same "
            "stainless steel, quarry tile, fluorescent light). A three-compartment "
            "stainless sink with a pre-rinse sprayer, a commercial hood dishwasher, "
            "racks of clean glasses and plates, bus tubs of dirty dishes on a landing "
            "table, a colander of lettuce and a crate of tomatoes at the vegetable sink. "
            "The man from the first reference image, in the long grey apron and gloves, "
            "is spraying plates over the sink; the woman from the second reference "
            "image is rinsing herbs at the vegetable sink. A server in a black waistcoat "
            "is setting a bus tub down at the edge of frame. Faces clearly visible. "
            "Timestamp text: 15-SEP-2026 19:13:37 CAM Kitchen 02. " + CCTV_V3
        ),
        "video_prompt": (
            "Fixed security camera over a restaurant dishwashing area. The porter sprays "
            "plates, loads a rack, pushes it into the hood dishwasher and pulls the "
            "handle down; the cook rinses herbs, shakes them dry and carries the "
            "colander out of frame; a server drops a bus tub of dishes on the landing "
            "table and leaves; the porter lifts the hood, steam rises, he slides the "
            "clean rack onto the drying shelf. " + CCTV_V3_VIDEO
        ),
    },
    {
        "id": "reception",
        "title": "Reception / Front Desk",
        "camera": "CAM Reception",
        "refs": ["fd-grace", "wtr-ethan"],
        "env_ref": "dining-wide",
        "image_prompt": (
            "Security camera still of the entrance and host stand of the same restaurant "
            "shown in the last reference image (same brick, pendant lights, walnut wood; "
            "part of the dining room visible behind). A wooden host stand with a tablet "
            "POS, card reader, receipt printer, a small bowl of mints and a stack of "
            "menus; a coat rack; a bench for waiting guests; the glass front door with "
            "the street outside at night. The woman from the first reference image "
            "stands behind the host stand handing a printed receipt and card back to a "
            "man in a quarter-zip who is paying; a couple in coats waits on the bench; "
            "another guest is walking in through the door. The man from the second "
            "reference image is passing behind the stand with menus. Faces clearly "
            "visible. Timestamp text: 15-SEP-2026 19:15:51 CAM Reception. " + CCTV_V3
        ),
        "video_prompt": (
            "Fixed security camera over a restaurant host stand. The host taps the "
            "tablet, the receipt prints, she tears it off and hands it with the card to "
            "the paying guest, who signs, pockets his wallet and walks out of the door; "
            "a new guest enters, speaks to the host, she checks the tablet and picks up "
            "two menus; the waiting couple stands; a server walks behind the stand and "
            "into the dining room. " + CCTV_V3_VIDEO
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


def download(url: str, out: Path, timeout: float = 120.0) -> None:
    import httpx

    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        tmp = out.with_suffix(out.suffix + ".part")
        tmp.write_bytes(resp.content)
        tmp.replace(out)


_upload_cache: dict[Path, str] = {}


def upload_cached(fal_client, path: Path) -> str:
    """Upload a local file to fal storage once per run and reuse the URL."""
    key = path.resolve()
    if key not in _upload_cache:
        _upload_cache[key] = fal_client.upload_file(str(key))
    return _upload_cache[key]


def generate_still_with_refs(fal_client, scene: dict, out_dir: Path, force: bool = False) -> Path:
    """Compose a scene still from staff portraits (+ optional environment still)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{scene['id']}.png"
    if out.exists() and out.stat().st_size > 20_000 and not force:
        log(f"still {scene['id']} exists")
        return out

    ref_paths: list[Path] = []
    for person_id in scene.get("refs", []):
        portrait = PORTRAITS_OUT / f"{person_id}.png"
        if not portrait.exists():
            raise SystemExit(f"portrait missing for {person_id}: run --set portraits first")
        ref_paths.append(portrait)
    if scene.get("env_ref"):
        env = out_dir / f"{scene['env_ref']}.png"
        if not env.exists():
            raise SystemExit(f"environment still {scene['env_ref']} missing; render it before {scene['id']}")
        ref_paths.append(env)  # always last so prompts can say "the last reference image"

    log(f"still {scene['id']} generating with {len(ref_paths)} refs")
    result = fal_client.subscribe(
        REF_ENDPOINT,
        arguments={
            "prompt": scene["image_prompt"],
            "image_urls": [upload_cached(fal_client, p) for p in ref_paths],
            "num_images": 1,
            "aspect_ratio": "16:9",
            "resolution": "1K",
            "output_format": "png",
        },
        with_logs=False,
    )
    images = (result or {}).get("images") or []
    url = images[0]["url"] if images else None
    if not url:
        raise RuntimeError(f"no image url for {scene['id']} keys={list((result or {}).keys())}")
    download(url, out)
    log(f"still {scene['id']} saved {out.stat().st_size} bytes")
    return out


def generate_video(fal_client, clip: dict, still: Path, out_dir: Path | None = None) -> Path:
    target_dir = out_dir or OUT
    target_dir.mkdir(parents=True, exist_ok=True)
    out = target_dir / f"{clip['id']}.mp4"
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
    parser.add_argument("--set", choices=["v1", "v2", "v3", "portraits"], default="v1", help="which shot list to run")
    parser.add_argument("--stills-only", action="store_true", help="never call the video endpoint")
    parser.add_argument("--videos", action="store_true", help="run Kling image-to-video for the v2/v3 set (approval gate)")
    parser.add_argument("--only", nargs="*", default=None, help="restrict to these clip ids")
    parser.add_argument("--force", action="store_true", help="re-render stills even if a file already exists")
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

    if args.set == "v3":
        run_videos = args.videos and not args.stills_only
        stills_dir = STILLS / "v3"
        videos_dir = OUT / "v3"
        # Portraits are the identity references; make sure every one we need exists.
        needed = {pid for scene in SCENES_V3 for pid in scene.get("refs", [])}
        for portrait in PORTRAITS:
            if portrait["id"] in needed:
                generate_still(fal_client, portrait, out_dir=PORTRAITS_OUT, image_size="square_hd")
        status = {"set": "v3", "clips": []}
        for scene in SCENES_V3:
            if args.only and scene["id"] not in args.only:
                continue
            still = generate_still_with_refs(fal_client, scene, stills_dir, force=args.force)
            entry = {"id": scene["id"], "camera": scene["camera"], "still": str(still)}
            if run_videos:
                video = generate_video(fal_client, scene, still, out_dir=videos_dir)
                entry.update({"video": str(video), "bytes": video.stat().st_size})
            status["clips"].append(entry)
            write_status(status)
        log("v3 stills ready" + (" and videos rendered" if run_videos else " (stills only; pass --videos after approval)"))
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
