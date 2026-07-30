#!/usr/bin/python3
from pathlib import Path
import re
import json
import shutil
import os
import sys
import subprocess

SRC_DIR = Path("/home/jon/proj/aeftt")
BUILD_DIR = SRC_DIR / "build"
STAGING_BUCKET = "s3://aeftt-staging.hursts.org.uk"
PROD_BUCKET = "s3://aeftt.hursts.org.uk"

# load metadata from sw.js
sw = (SRC_DIR / "sw.js").read_text()
mo = re.match(r"const META = ({[^}]*})", sw, flags=re.MULTILINE)
if not mo:
    print("Meta section of sw.js not found", file=sts.stderr)
    sys.exit(-1)
meta = json.loads(mo.group(1))
# copy files to build directory
shutil.rmtree(BUILD_DIR, ignore_errors=True)
os.mkdir(BUILD_DIR)
os.mkdir(BUILD_DIR / "modules")
os.mkdir(BUILD_DIR / "help")
for f in meta["MANIFEST"]:
    shutil.copy(SRC_DIR / f, BUILD_DIR / f)
shutil.copy(SRC_DIR / "sw.js", BUILD_DIR)
# update index.html with version from sw.js
new = (BUILD_DIR / "aeftt.html").read_text().replace(
    '<span id="version"></span>',
    f'<span id="version">{meta["VERSION"]}</span>')
(BUILD_DIR / "aeftt.html").write_text(new)
# sync to s3
bucket = STAGING_BUCKET
if len(sys.argv) == 2 and sys.argv[1] == "--prod":
    bucket = PROD_BUCKET
else:
    print("Uploading to staging. Use --prod to upload to production")
subprocess.run([
    "aws", "s3", "sync",
    BUILD_DIR, bucket,
    "--exclude", "*.html",
    "--metadata", f"version={meta['VERSION']}",
    "--cache-control='no-cache'"])
subprocess.run([
    "aws", "s3", "sync",
    BUILD_DIR, bucket,
    "--exclude", "*", "--include", "*.html",
    "--metadata", f"version={meta['VERSION']}",
    "--cache-control='no-cache'"])
