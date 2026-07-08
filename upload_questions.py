#!/usr/bin/env python3
"""
Learnser AI - JEE Mains PYQs database to Supabase ETL Pipeline
============================================================
This script loads the cached JEE Mains database from `jee_mains_pyqs_data_base`,
filters out any questions containing images to keep the data lightweight and pure-text/LaTeX,
and batch-inserts them into the Supabase table `jee_questions`.

Prerequisites:
    pip install supabase

Usage:
    # Using environment variables (Recommended for Service Role Key):
    $env:SUPABASE_URL="https://your-project.supabase.co"
    $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
    python upload_questions.py

    # Or running directly (will fallback to env.js anon key, which might require RLS insert policies enabled):
    python upload_questions.py
"""

import os
import re
import sys
import json
from tqdm import tqdm

# Add library path to sys.path so we can import jee_data_base
LIB_PATH = r"c:\Users\kamat\Downloads\jee_mains_pyqs_data_base-main (1)\jee_mains_pyqs_data_base-main"
if LIB_PATH not in sys.path:
    sys.path.append(LIB_PATH)

try:
    from jee_data_base import DataBase
    from jee_data_base.core.html_helper import convert_dollar_math_to_inline
except ImportError:
    print(f"Error: Could not import jee_data_base from {LIB_PATH}.")
    print("Please verify the path to the library in the script.")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: The 'supabase' library is not installed.")
    print("Please install it running: pip install supabase")
    sys.exit(1)


def make_inline(text: str) -> str:
    r"""Converts TeX math delimiters to inline browser-safe format \( ... \)."""
    if not isinstance(text, str):
        return text
    text = convert_dollar_math_to_inline(text)
    text = text.replace(r"\[", r"\(").replace(r"\]", r"\)")
    return text


def extract_correct_answer(question) -> str:
    """Extracts the correct option or numeric answer from a question object."""
    qtype_raw = getattr(question, "type", "") or ""

    # MCQ mapping
    if qtype_raw.lower() in ("mcq", "mcqm"):
        corr = getattr(question, "correct_options", None)
        if corr:
            if not isinstance(corr, (list, tuple)):
                corr = [corr]
            labels = []
            for option in corr:
                if isinstance(option, int):
                    labels.append(chr(ord("A") + option))
                elif isinstance(option, str) and option.isdigit():
                    labels.append(chr(ord("A") + int(option)))
                else:
                    labels.append(str(option))
            return ", ".join(labels)
        return ""

    # Numerical/Integer answer extraction
    ans = getattr(question, "answer", None)
    if ans is not None and str(ans).strip() != "":
        return make_inline(str(ans))

    corr = getattr(question, "correct_options", None)
    if corr:
        if not isinstance(corr, (list, tuple)):
            corr = [corr]
        return ", ".join(str(c) for c in corr)

    # Explanation parsing fallback
    explanation = getattr(question, "explanation", "") or ""
    if explanation:
        clean_expl = re.sub(r"<[^>]*>", " ", explanation)
        clean_expl = re.sub(r"\^\{[^\}]*\}", " ", clean_expl)
        clean_expl = re.sub(r"\^[a-zA-Z0-9\-]", " ", clean_expl)
        clean_expl = re.sub(r"_\{[^\}]*\}", " ", clean_expl)
        clean_expl = re.sub(r"_[a-zA-Z0-9]", " ", clean_expl)
        clean_expl = re.sub(r"\\[a-zA-Z]+", " ", clean_expl)
        numbers = re.findall(r"-?\b\d+(?:\.\d+)?\b", clean_expl)
        if numbers:
            return numbers[-1]
    return ""


def get_supabase_creds():
    """Retrieves Supabase URL and Key from env or falls back to env.js."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if url and key:
        print("Using credentials from Environment Variables.")
        return url, key

    # Fallback to env.js
    env_js = os.path.join(os.path.dirname(__file__), "env.js")
    if os.path.exists(env_js):
        with open(env_js, "r", encoding="utf-8") as f:
            content = f.read()
            url_match = re.search(r"SUPABASE_URL:\s*['\"]([^'\"]+)['\"]", content)
            key_match = re.search(r"SUPABASE_ANON_KEY:\s*['\"]([^'\"]+)['\"]", content)
            if url_match and key_match:
                print("Using credentials from env.js.")
                return url_match.group(1), key_match.group(1)
    return None, None


def main():
    print("==============================================================")
    print("        Learnser AI Supabase ETL Question Uploader            ")
    print("==============================================================")

    url, key = get_supabase_creds()
    if not url or not key:
        print("Error: Could not find Supabase URL and API Key in env or env.js.")
        sys.exit(1)

    print(f"Connecting to Supabase at: {url}")
    try:
        supabase: Client = create_client(url, key)
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        sys.exit(1)

    print("Fetching existing question IDs from Supabase to skip duplicates...")
    existing_ids = set()
    try:
        # Fetch existing IDs in batches of 1000 to avoid limits
        limit = 1000
        offset = 0
        while True:
            res = supabase.table("jee_questions").select("id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            existing_ids.update(row["id"] for row in res.data)
            offset += limit
            print(f"Loaded {len(existing_ids)} existing IDs...")
    except Exception as e:
        print(f"Could not load existing IDs (table may not exist yet, or access denied): {e}")
        print("Will attempt inserts without duplicate filtering.")

    print("\nLoading JEE Mains Question database cache...")
    try:
        db = DataBase()
    except Exception as e:
        print(f"Error loading local database: {e}")
        sys.exit(1)

    print(f"Local database contains {len(db.chapters_dict)} chapters.")

    all_questions = []
    skipped_img_count = 0
    skipped_dup_count = 0

    print("Extracting and cleaning questions...")
    for chapter_name, chapter_obj in db.chapters_dict.items():
        subject = getattr(chapter_obj, "parent_subject", "")
        chapter_title = getattr(chapter_obj, "name", "")

        for q_key, question in chapter_obj.question_dict.items():
            q_id = getattr(question, "question_id", "")
            if not q_id:
                continue

            # Check duplicate ID
            if q_id in existing_ids:
                skipped_dup_count += 1
                continue

            # Image verification
            is_img_q = bool(getattr(question, "isImgQuestion", False))
            is_img_e = bool(getattr(question, "isImgExplanation", False))
            is_img_o_attr = getattr(question, "isImgOption", False)
            is_img_o = any(is_img_o_attr) if isinstance(is_img_o_attr, list) else bool(is_img_o_attr)

            if is_img_q or is_img_o or is_img_e:
                skipped_img_count += 1
                continue

            # Structure question details
            options_mapped = []
            options_raw = getattr(question, "options", []) or []
            for opt in options_raw:
                content = opt.get("content") if isinstance(opt, dict) else str(opt)
                options_mapped.append(make_inline(content))

            q_data = {
                "id": q_id,
                "subject": subject,
                "chapter": chapter_title,
                "topic": getattr(question, "topic", ""),
                "difficulty": getattr(question, "difficulty", "Medium"),
                "year": int(getattr(question, "year", 0)),
                "question_text": make_inline(getattr(question, "question", "")),
                "options": options_mapped,
                "correct_answer": extract_correct_answer(question),
                "explanation": make_inline(getattr(question, "explanation", ""))
            }
            all_questions.append(q_data)

    total_to_insert = len(all_questions)
    print(f"\nExtraction complete:")
    print(f" - To upload: {total_to_insert}")
    print(f" - Skipped (Contains Images): {skipped_img_count}")
    print(f" - Skipped (Already in Database): {skipped_dup_count}")

    if total_to_insert == 0:
        print("No new questions to upload.")
        sys.exit(0)

    # Batch Insert (100 at a time)
    batch_size = 100
    print(f"\nUploading to Supabase in batches of {batch_size}...")
    for i in tqdm(range(0, total_to_insert, batch_size)):
        batch = all_questions[i:i + batch_size]
        try:
            supabase.table("jee_questions").insert(batch).execute()
        except Exception as e:
            print(f"\nError uploading batch {i // batch_size + 1}: {e}")
            print("Trying fallback to insert records one-by-one to isolate errors...")
            for row in batch:
                try:
                    supabase.table("jee_questions").insert(row).execute()
                except Exception as inner_e:
                    # Ignore duplicate keys if they bypassed check
                    if "duplicate key" not in str(inner_e).lower():
                        print(f"Failed to insert question ID {row['id']}: {inner_e}")

    print("\nETL Question Uploader pipeline completed successfully!")


if __name__ == "__main__":
    main()
