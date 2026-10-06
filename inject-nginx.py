#!/usr/bin/env python3
"""
nginx.conf의 server {} 블록 안에 livenews location 블록을 삽입.

nginx.conf 구조:
  http {
      server {
          location /jobworld { ... }
          # ← 여기에 삽입
      }    ← server 블록 닫기
  }        ← http 블록 닫기

마지막 }는 http 블록이므로, 두 번째 마지막 }(server 블록)를 찾아야 함.

사용법: python3 inject-nginx.py <nginx.conf path> <location block file>
"""
import sys

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <nginx.conf> <location-block-file>")
    sys.exit(1)

conf_path = sys.argv[1]
block_path = sys.argv[2]

with open(conf_path, 'r') as f:
    conf = f.read()

if 'livenews' in conf:
    print("SKIP: livenews already configured")
    sys.exit(0)

with open(block_path, 'r') as f:
    block = f.read()

# server {} 블록의 닫는 }를 찾기
# 전략: 모든 }의 위치를 찾고, 마지막에서 두 번째 }가 server 블록 닫기
lines = conf.split('\n')
brace_positions = []  # (line_index, char_position_in_file)

pos = 0
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped == '}':
        brace_positions.append((i, pos + line.index('}')))
    pos += len(line) + 1  # +1 for newline

if len(brace_positions) < 2:
    print("ERROR: not enough closing braces found")
    sys.exit(1)

# 마지막에서 두 번째 } = server 블록 닫기
server_close_line_idx = brace_positions[-2][0]
server_close_char_pos = brace_positions[-2][1]

# 해당 위치 앞에 location 블록 삽입
new_lines = lines[:server_close_line_idx] + [block] + lines[server_close_line_idx:]
new_conf = '\n'.join(new_lines)

with open(conf_path, 'w') as f:
    f.write(new_conf)

print(f"OK: injected before line {server_close_line_idx + 1} (server block close)")
