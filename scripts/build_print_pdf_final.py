#!/usr/bin/env python3
import build_print_pdf_v2 as builder

# 以目前正式300題的實際分類為準；不為了符合舊規劃表而任意搬動題目。
builder.TARGET_COUNTS = {
    "01": 20,
    "02": 25,
    "03": 25,
    "04": 24,
    "05": 35,
    "06": 35,
    "07": 40,
    "08": 40,
    "09": 35,
    "10": 21,
}

if __name__ == "__main__":
    builder.build()
