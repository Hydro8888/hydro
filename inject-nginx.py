#!/usr/bin/env python3
"""
nginx default.conf에 livenews location 블록을 삽입하는 스크립트.
bash 변수 해석 문제를 피하기 위해 별도 Python 파일로 분리.

사용법: python3 inject-nginx.py /tmp/nginx-default.conf nginx-livenews.conf
"""
import sys

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <default.conf path> <location block file>")
    sys.exit(1)

conf_path = sys.argv[1]
block_path = sys.argv[2]

# 현재 설정 읽기
with open(conf_path, 'r') as f:
    conf = f.read()

# 이미 livenews가 있으면 스킵
if 'livenews' in conf:
    print("SKIP: livenews already configured")
    sys.exit(0)

# location 블록 읽기
with open(block_path, 'r') as f:
    block = f.read()

# 마지막 } 찾기 (server 블록 닫기)
idx = conf.rfind('}')
if idx < 0:
    print("ERROR: no closing brace found in config")
    sys.exit(1)

# } 앞에 location 블록 삽입
new_conf = conf[:idx] + block + "\n" + conf[idx:]

with open(conf_path, 'w') as f:
    f.write(new_conf)

print("OK: livenews location block injected")
