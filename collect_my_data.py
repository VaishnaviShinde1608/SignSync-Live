"""
collect_my_data.py  –  Collect YOUR OWN hand images to fix the Domain Gap problem.
====================================================================================

WHAT IS THE DOMAIN GAP?
    Your Random Forest was trained on a dataset of OTHER people's hands,
    photographed from a fixed studio angle. Your webcam sees YOUR hands,
    from YOUR angle, in YOUR lighting. The model has never seen hands like
    yours — so even correct signs get misclassified. This is the Domain Gap.

THE FIX:
    Take 50 photos of YOUR hand for each letter (A, B, 0, 1 — or however
    many you trained). Run extract_landmarks.py on this new folder.
    The model will re-train on geometry that actually matches your webcam.

HOW TO USE THIS SCRIPT:
    1. Run it:
            python collect_my_data.py

    2. Type a letter when prompted:
            Which letter are you collecting? (e.g. A, B, 0, 1): A

    3. A webcam window opens. Position your hand and hold the sign.

    4. Press  S  to start the 50-frame capture burst.
       Press  Q  to quit early / move to the next letter.

    5. Repeat for every letter in your model.

    6. When done, run:
            python extract_landmarks.py
       (It will pick up the new my_custom_dataset folder automatically
        — just make sure DATASET_DIR in that file points to it, OR
        copy the letter folders into your existing asl_dataset folder.)

OUTPUT FOLDER STRUCTURE:
    my_custom_dataset/
        A/
            A_001.jpg
            A_002.jpg
            ...
            A_050.jpg
        B/
            B_001.jpg
            ...

REQUIREMENTS:
    pip install opencv-python
    (numpy is already included with opencv)
"""

import cv2
import os

# ── Configuration ────────────────────────────────────────────────────────────

# Root folder where all your captured images will be saved.
# This will be created automatically if it doesn't exist.
OUTPUT_ROOT = "my_custom_dataset"

# How many photos to capture per letter in one burst.
# 50 is a good starting point — enough to give the model variety
# without taking too long to photograph.
FRAMES_TO_CAPTURE = 50

# Which webcam to use.
# 0 = your built-in/default webcam. Try 1 or 2 if 0 doesn't work.
CAMERA_INDEX = 0

# ── Main script ──────────────────────────────────────────────────────────────

def main():

    # ── Step 1: Ask which letter we are collecting ───────────────────────────
    # .strip() removes any accidental spaces.
    # .upper() makes 'a' and 'A' both work the same way.
    letter = input(
        "\nWhich letter are you collecting? "
        "(Type A, B, 0, 1, etc. then press Enter): "
    ).strip().upper()

    # Basic check — don't allow an empty input.
    if not letter:
        print("ERROR: You didn't type a letter. Please re-run the script.")
        return

    print(f"\n→ Collecting data for letter: '{letter}'")

    # ── Step 2: Create the output folder for this letter ─────────────────────
    # os.path.join builds the path correctly on Windows, Mac, and Linux.
    # Example result: "my_custom_dataset/A"
    save_dir = os.path.join(OUTPUT_ROOT, letter)

    # exist_ok=True means: don't crash if the folder already exists.
    # This is useful if you are adding MORE photos to an existing collection.
    os.makedirs(save_dir, exist_ok=True)
    print(f"→ Images will be saved to: {save_dir}/")

    # ── Step 3: Open the webcam ───────────────────────────────────────────────
    cap = cv2.VideoCapture(CAMERA_INDEX)

    # Check that the camera actually opened. On some laptops the camera
    # is busy (e.g. another app is using it) and this will fail.
    if not cap.isOpened():
        print(
            f"\nERROR: Could not open webcam (index {CAMERA_INDEX}).\n"
            "Try changing CAMERA_INDEX to 1 or 2 at the top of this file."
        )
        return

    print("\n" + "="*55)
    print(f"  GET READY TO SIGN  →  '{letter}'")
    print("="*55)
    print(f"  Press  S  to start capturing {FRAMES_TO_CAPTURE} frames")
    print("  Press  Q  to quit / skip this letter")
    print("="*55 + "\n")

    # ── Step 4: Show a live preview and wait for the user to press S ─────────

    # Count how many images already exist in this folder.
    # This prevents overwriting old captures if you re-run for the same letter.
    existing = len([
        f for f in os.listdir(save_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ])
    start_index = existing + 1  # e.g. if 10 images exist, next is A_011.jpg

    capturing   = False   # True while the burst capture is running
    count       = 0       # how many frames captured so far in this burst

    while True:
        # Read one frame from the webcam.
        # ret = True if the frame was read successfully.
        ret, frame = cap.read()

        if not ret:
            # Camera disconnected or failed mid-session.
            print("ERROR: Lost webcam connection. Stopping.")
            break

        # Mirror the image left-right so it feels like a mirror.
        # This matches how the webcam appears in your browser (which also mirrors).
        frame = cv2.flip(frame, 1)

        # ── If S was pressed, we are in "capturing" mode ──────────────────
        if capturing:
            count += 1  # increment the frame counter

            # Build the filename: e.g.  A_011.jpg
            # zfill(3) pads with zeros: 1 → "001", 11 → "011", etc.
            filename = f"{letter}_{str(start_index + count - 1).zfill(3)}.jpg"
            filepath = os.path.join(save_dir, filename)

            # Save the current frame as a JPEG image.
            cv2.imwrite(filepath, frame)

            # Show a red capture indicator in the top-left corner.
            cv2.putText(
                frame,
                f"CAPTURING {count}/{FRAMES_TO_CAPTURE}",
                (10, 35),                    # position (x, y)
                cv2.FONT_HERSHEY_SIMPLEX,    # font style
                0.9,                         # font scale (size)
                (0, 0, 255),                 # color: red (BGR format)
                2                            # thickness
            )

            # Stop capturing after we have collected enough frames.
            if count >= FRAMES_TO_CAPTURE:
                capturing = False
                total_saved = start_index + count - 1
                print(
                    f"\n✓ Done! Captured {count} frames for '{letter}'.\n"
                    f"  Total images in folder: {total_saved}\n"
                    f"  Saved to: {save_dir}/\n"
                )
                print("Press Q to quit, or close the window.")

        else:
            # ── Not capturing yet — show the "ready" instructions ─────────
            # Green text overlay so user knows what to do.

            # Line 1: which letter we are collecting
            cv2.putText(
                frame,
                f"Sign: '{letter}'  |  Press S to capture",
                (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (0, 220, 0),    # green
                2
            )

            # Line 2: tip about webcam angle
            cv2.putText(
                frame,
                "Tip: Match YOUR webcam angle exactly",
                (10, 65),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (200, 200, 200),    # light grey
                1
            )

            # Line 3: show how many images already captured
            cv2.putText(
                frame,
                f"Already saved: {start_index - 1} image(s)  |  Q = quit",
                (10, 90),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (200, 200, 200),
                1
            )

        # ── Show the frame in a window ────────────────────────────────────
        window_title = f"SignSync — Collecting '{letter}'  (S=Start, Q=Quit)"
        cv2.imshow(window_title, frame)

        # ── Listen for keypresses ─────────────────────────────────────────
        # waitKey(1) waits 1 millisecond for a key. This keeps the window responsive.
        # & 0xFF masks to the lower 8 bits (required on some operating systems).
        key = cv2.waitKey(1) & 0xFF

        if key == ord('s') or key == ord('S'):
            # S key pressed — start the capture burst (only if not already capturing)
            if not capturing:
                capturing = True
                count     = 0
                print(f"  → Capturing {FRAMES_TO_CAPTURE} frames for '{letter}'…")

        elif key == ord('q') or key == ord('Q'):
            # Q key pressed — exit the loop
            print("\n→ Quit pressed. Closing webcam window.")
            break

    # ── Step 5: Clean up ─────────────────────────────────────────────────────
    # Always release the camera and close windows when done.
    # If you skip this, the camera stays locked and other apps can't use it.
    cap.release()
    cv2.destroyAllWindows()

    # ── Step 6: Remind the user what to do next ───────────────────────────────
    print("\n" + "="*55)
    print("  NEXT STEPS")
    print("="*55)
    print(f"  1. Run this script again for each remaining letter.")
    print(f"  2. Once ALL letters are collected, run:")
    print(f"       python extract_landmarks.py")
    print(f"  3. Make sure DATASET_DIR in extract_landmarks.py")
    print(f"     points to:  {os.path.abspath(OUTPUT_ROOT)}")
    print(f"  4. After extraction, re-train your model (train.py or")
    print(f"     server.py startup) and your accuracy should jump")
    print(f"     from ~50% to 90%+ because the model now knows YOUR hands.")
    print("="*55 + "\n")


# ── Entry point ───────────────────────────────────────────────────────────────
# This block only runs when you execute the file directly:
#     python collect_my_data.py
# It does NOT run if another script imports this file.
if __name__ == "__main__":
    main()
