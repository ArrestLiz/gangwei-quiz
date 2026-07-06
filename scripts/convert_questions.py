"""题库 xlsx 转 JSON 脚本"""
import openpyxl
import json
import os

XLSX_PATH = os.path.join(os.path.dirname(__file__), '..', '题库.xlsx')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'questions.json')

TYPE_MAP = {
    '单选题': 'single',
    '多选题': 'multi',
    '选题': 'multi',
    '判断题': 'judge',
}

DIFFICULTY_MAP = {
    '较易': 'easy', '容易': 'easy', '简单': 'easy',
    '中等': 'medium', '中': 'medium',
    '较难': 'hard', '难': 'hard', '困难': 'hard',
}


def clean(s):
    if s is None:
        return ''
    return str(s).strip()


def convert():
    wb = openpyxl.load_workbook(XLSX_PATH)
    ws = wb['岗位练兵题']
    questions = []
    qid = 0
    for row in ws.iter_rows(min_row=3, values_only=True):
        raw_type = clean(row[0])
        if not raw_type or raw_type not in TYPE_MAP:
            continue
        stem = clean(row[3])
        if not stem:
            continue
        answer = clean(row[4])
        if not answer:
            continue
        qtype = TYPE_MAP[raw_type]
        # 单选题答案为多字母时，修正为多选题
        if qtype == 'single' and len(answer.replace(' ', '')) > 1:
            qtype = 'multi'
        difficulty = DIFFICULTY_MAP.get(clean(row[1]), 'medium')
        score = int(row[2]) if row[2] else 1
        analysis = clean(row[5])
        if qtype == 'judge':
            options = ['正确', '错误']
            # 统一答案为 对/错
            if answer in ('A', '对', '正确'):
                answer = '对'
            else:
                answer = '错'
        else:
            options = [clean(row[7]), clean(row[8]), clean(row[9]), clean(row[10])]
            # 过滤空选项
            options = [o for o in options if o]
            answer = answer.replace(' ', '').upper()
        questions.append({
            'id': qid,
            'type': qtype,
            'difficulty': difficulty,
            'score': score,
            'stem': stem,
            'options': options,
            'answer': answer,
            'analysis': analysis,
        })
        qid += 1
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False)
    print(f'转换完成: {len(questions)} 道题 → {OUTPUT_PATH}')
    # 统计
    from collections import Counter
    tc = Counter(q['type'] for q in questions)
    dc = Counter(q['difficulty'] for q in questions)
    print(f'题型: {dict(tc)}')
    print(f'难度: {dict(dc)}')


if __name__ == '__main__':
    convert()
