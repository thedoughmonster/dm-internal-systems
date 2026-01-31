#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple


def walk(node: Any, path: str, out: Dict[str, Dict[str, int]]):
    tname = type(node).__name__
    out[path]["__count__"] += 1
    out[path][tname] += 1

    if isinstance(node, dict):
        for k, v in node.items():
            walk(v, f"{path}.{k}", out)
    elif isinstance(node, list):
        for v in node:
            walk(v, f"{path}[]", out)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: toast_order_shape.py <order.json>", file=sys.stderr)
        return 2

    p = Path(sys.argv[1])
    obj = json.loads(p.read_text())

    out: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    walk(obj, "$", out)

    rows: List[Tuple[str, Dict[str, int]]] = sorted(out.items(), key=lambda x: x[0])

    for path, counts in rows:
        types = {k: v for k, v in counts.items() if k != "__count__"}
        type_str = ", ".join([f"{k}:{v}" for k, v in sorted(types.items())])
        print(f"{path}\t{type_str}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
