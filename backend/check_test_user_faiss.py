#!/usr/bin/env python3
import json
import os

# Check FAISS files for test user
user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
faiss_dir = "data/faiss"

meta_file = os.path.join(faiss_dir, f"{user_id}.meta.json")
index_file = os.path.join(faiss_dir, f"{user_id}.index")

print(f"Checking FAISS for user: {user_id}")
print(f"Meta file exists: {os.path.exists(meta_file)}")
print(f"Index file exists: {os.path.exists(index_file)}")

if os.path.exists(meta_file):
    with open(meta_file, 'r') as f:
        data = json.load(f)
    print(f"Metadata content: {data}")
    print(f"Number of IDs: {len(data)}")
else:
    print("Meta file not found!")
