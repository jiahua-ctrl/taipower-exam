#!/usr/bin/env python3
from collections import Counter, defaultdict
from docx.enum.text import WD_ALIGN_PARAGRAPH
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


def add_unit_header(doc, unit, subject, new_page):
    p = builder.add_para(doc, subject, size=18, bold=True,
                         align=WD_ALIGN_PARAGRAPH.CENTER, after=5)
    if new_page:
        p.paragraph_format.page_break_before = True
    builder.add_para(doc, f"第 {int(unit)} 單元｜{builder.UNIT_NAMES[unit]}",
                     size=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=16)


def build_final():
    questions = builder.validate(builder.load_questions())
    numbered = [(i + 1, q) for i, q in enumerate(questions)]
    by_unit = defaultdict(list)
    for num, q in numbered:
        by_unit[builder.unit_of(q)].append((num, q))

    doc = builder.setup_doc()
    builder.add_cover(doc)

    builder.add_para(doc, "第一部分｜題目冊", size=24, bold=True,
                     align=WD_ALIGN_PARAGRAPH.CENTER, before=40, after=18)
    builder.add_para(doc, "請先完成本部分，再翻至答案解析。", size=16,
                     align=WD_ALIGN_PARAGRAPH.CENTER, after=20)
    doc.add_page_break()

    for idx, unit in enumerate(sorted(builder.UNIT_NAMES)):
        subject = by_unit[unit][0][1].get("subject", "")
        add_unit_header(doc, unit, subject, new_page=(idx > 0))
        for num, q in by_unit[unit]:
            builder.add_question(doc, num, q)

    doc.add_page_break()
    builder.add_para(doc, "第二部分｜答案與解析", size=24, bold=True,
                     align=WD_ALIGN_PARAGRAPH.CENTER, before=40, after=18)
    builder.add_para(doc, "建議先完成題目冊後再使用本區。", size=16,
                     align=WD_ALIGN_PARAGRAPH.CENTER, after=20)
    doc.add_page_break()

    for idx, unit in enumerate(sorted(builder.UNIT_NAMES)):
        subject = by_unit[unit][0][1].get("subject", "")
        add_unit_header(doc, unit, subject, new_page=(idx > 0))
        for num, q in by_unit[unit]:
            builder.add_answer(doc, num, q)

    doc.save(builder.OUT_DOCX)
    print(f"Created: {builder.OUT_DOCX}")
    print("Unit counts:", dict(sorted(Counter(builder.unit_of(q) for q in questions).items())))
    print("Answer distribution:", dict(sorted(Counter(str(q['answer']).upper() for q in questions).items())))
    print("Level distribution:", dict(sorted(Counter(str(q.get('level','')) for q in questions).items())))


if __name__ == "__main__":
    build_final()
