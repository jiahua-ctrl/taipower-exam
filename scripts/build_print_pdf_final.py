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

# 紙本刷題版不顯示「難度／考點」小註記，避免它單獨被擠到下一頁。
def add_question_clean(doc, num, q):
    builder.add_para(doc, f"{num}. {q['question']}", size=16, bold=True,
                     before=8, after=3, keep=True)
    for i, letter in enumerate("ABCD"):
        builder.add_para(
            doc,
            f"(   ) {letter}. {q[f'option_{letter.lower()}']}",
            size=16,
            after=2,
            keep=(i < 3),
        )

# 答案、解析、官方依據皆以16pt呈現，方便A4列印閱讀。
def add_answer_16(doc, num, q):
    builder.add_para(doc, f"{num}. 答案：{str(q['answer']).upper()}",
                     size=16, bold=True, before=8, after=3, keep=True)
    builder.add_para(doc, f"解析：{q['explanation']}", size=16, after=3, keep=True)
    builder.add_para(doc, f"官方依據：{q['source_title']}｜{q['source_locator']}",
                     size=16, after=8)

builder.add_question = add_question_clean
builder.add_answer = add_answer_16

if __name__ == "__main__":
    builder.build()
