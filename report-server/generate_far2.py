import sys
import json
import random
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def thin_border():
    thin = Side(style='thin')
    return Border(left=thin, right=thin, top=thin, bottom=thin)

def medium_border():
    medium = Side(style='medium')
    return Border(left=medium, right=medium, top=medium, bottom=medium)

def rand_int(min_val, max_val):
    return random.randint(min_val, max_val)

def distribute_marks(target_mark, is_out_of_30):
    """Distribute subject marks into sub-components"""
    target_out_of_60 = round(target_mark * 2) if is_out_of_30 else round(target_mark * 6)
    clamped = max(20, min(60, target_out_of_60))

    b = c = d = e = f = 0
    attempts = 0

    while attempts < 500:
        b = rand_int(2, 5)
        c = rand_int(2, 5)
        d = rand_int(3, 9)
        remaining = clamped - b - c - d

        if remaining < 16 or remaining > 40:
            attempts += 1
            continue

        e_min = max(8, remaining - 20)
        e_max = min(20, remaining - 8)

        if e_min > e_max:
            attempts += 1
            continue

        e = rand_int(e_min, e_max)
        f = remaining - e

        if f < 8 or f > 20 or e == f:
            attempts += 1
            continue
        break

    if attempts >= 500:
        b, c, d = 3, 3, 6
        rem = clamped - b - c - d
        e = min(20, max(8, rem // 2))
        f = rem - e
        if f < 8:
            e = rem - 8
            f = 8
        if f > 20:
            e = rem - 20
            f = 20

    total_60 = b + c + d + e + f
    converted = total_60 / 2 if is_out_of_30 else total_60 / 6

    return b, c, d, e, f, total_60, converted

def apply_style(cell, value='', bold=False, size=9, bg=None,
                h_align='center', v_align='center', wrap=True,
                color='000000', border=True, rotate=False):
    cell.value = value
    cell.font = Font(name='Arial Narrow', size=size, bold=bold, color=color)
    cell.alignment = Alignment(
        horizontal=h_align,
        vertical=v_align,
        wrap_text=wrap,
        text_rotation=90 if rotate else 0
    )
    if bg:
        cell.fill = PatternFill(start_color=bg, end_color=bg, fill_type='solid')
    if border:
        cell.border = thin_border()

def generate_subject_report(data, output_path):
    subject_type = data.get('subjectType', 'ES')
    trainees = data['trainees']
    subject_marks = data.get('subjectMarks', [])
    instructor = data['instructorData']
    batch = data['batchData']
    half = data['half']
    assessment_date = data.get('assessmentDate', '')
    trade = data.get('tradeData', {})
    has_5_subjects = data.get('has5Subjects', False)

    is_out_of_30 = (not has_5_subjects) and (subject_type == 'ES')

    titles = {
        'ES': ('ANNEXURE-III (FAR-2 )',
               'Internal Assessment',
               'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS'),
        'WCS': ('(FAR-2 )',
                'Internal Assessment',
                'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE'),
        'ED': ('(FAR-2 )',
               'Internal Assessment',
               'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING'),
    }

    conversion_label = (
        'Convert Total Marks in  to 30 Markes =  {(Col.G)/2}'
        if is_out_of_30
        else 'Convert Total Marks in  to 10 Markes =  {(Col.G)/6}'
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f'{subject_type}_Report'

    # Page setup A4 Portrait
    ws.page_setup.orientation = 'portrait'
    ws.page_setup.paperSize = 9
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1

    # Column widths matching actual report
    ws.column_dimensions['A'].width = 12   # Roll No
    ws.column_dimensions['B'].width = 35   # Name
    ws.column_dimensions['C'].width = 4    # blank
    ws.column_dimensions['D'].width = 12   # Attendance
    ws.column_dimensions['E'].width = 20   # Speed/Accuracy
    ws.column_dimensions['F'].width = 20   # Creative Work
    ws.column_dimensions['G'].width = 4    # blank
    ws.column_dimensions['H'].width = 12   # Quarterly 1
    ws.column_dimensions['I'].width = 12   # Quarterly 2
    ws.column_dimensions['J'].width = 10   # Total
    ws.column_dimensions['K'].width = 32   # Converted
    ws.column_dimensions['L'].width = 14   # Sign

    # Colors
    TITLE_BG = '4472C4'     # Blue for titles
    HEADER_BG = 'D9E1F2'    # Light blue for headers
    MAX_MARKS_BG = 'FFC7CE' # Pink for max marks
    COL_LETTER_BG = 'E2EFDA' # Light green for column letters
    DATA_BG = 'FFFFFF'       # White for data

    current_row = 1

    # ============================================
    # ROW 1: Report type title
    # ============================================
    ws.row_dimensions[current_row].height = 18
    cell = ws.cell(row=current_row, column=1)
    apply_style(cell, titles[subject_type][0], bold=True, size=11,
                bg=TITLE_BG, color='FFFFFF', h_align='center')
    ws.merge_cells(f'A{current_row}:L{current_row}')
    current_row += 1

    # ROW 2: Internal Assessment
    ws.row_dimensions[current_row].height = 16
    cell = ws.cell(row=current_row, column=1)
    apply_style(cell, titles[subject_type][1], bold=True, size=10,
                bg=HEADER_BG, h_align='center')
    ws.merge_cells(f'A{current_row}:L{current_row}')
    current_row += 1

    # ROW 3: Subject title
    ws.row_dimensions[current_row].height = 20
    cell = ws.cell(row=current_row, column=1)
    apply_style(cell, titles[subject_type][2], bold=True, size=9,
                bg=HEADER_BG, h_align='center')
    ws.merge_cells(f'A{current_row}:L{current_row}')
    current_row += 1

    # ============================================
    # ROWS 4-8: Header info section
    # ============================================
    header_rows = [
        [('Name & Adddress of the Assessor', True), ('', False), ('', False),
         (instructor.get('displayName', ''), False), ('', False), ('', False),
         ('Year of Enrolment', True), ('', False), ('', False), ('', False),
         (batch.get('yearOfAssessment', ''), False), ('', False)],

        [('Name & Address of ITI (Govt/Pvt)', True), ('', False), ('', False),
         (instructor.get('itiName', ''), False), ('', False), ('', False),
         ('Date of Assessment', True), ('', False), ('', False), ('', False),
         (assessment_date or '', False), ('', False)],

        [('Name & Address of the Industry', True), ('', False), ('', False),
         (instructor.get('address', ''), False), ('', False), ('', False),
         ('Assessment Location', True), ('', False), ('', False), ('', False),
         (instructor.get('itiName', ''), False), ('', False)],

        [('Trade Name', True), ('', False),
         (trade.get('name', ''), False), ('', False), ('', False), ('', False),
         ('Duration Of  Trade', True), ('', False), ('', False),
         (f"{trade.get('duration', 1)} Year", False),
         ('SEM', True), (half, False)],

        [('Learning Outcome :', True), ('', False), ('', False), ('', False), ('', False), ('', False),
         ('Batch No.:', True), ('', False), ('', False), ('', False),
         (batch.get('batchNumber', ''), False), ('', False)],
    ]

    for row_data in header_rows:
        ws.row_dimensions[current_row].height = 16
        for col_idx, (value, is_label) in enumerate(row_data, 1):
            cell = ws.cell(row=current_row, column=col_idx)
            apply_style(cell, value, bold=is_label, size=9,
                       bg='F2F2F2', h_align='left', border=False)
        current_row += 1

    # ============================================
    # ROW 9: Column Headers
    # ============================================
    ws.row_dimensions[current_row].height = 50

    col_headers = [
        ('Roll No', 1), ('Name', 2), ('', 3),
        ('Attendance', 4),
        ('Speed for WC & Sc / Accuracy of ED / Comminacation skill fro ES', 5),
        ('Creative Work (Chart , Model  ,Poster , Project work etc..)', 6),
        ('', 7),
        ('Quarterly -1', 8), ('Quarterly -2', 9),
        ('Total', 10),
        (conversion_label, 11),
        ('Sign of Trainee', 12),
    ]

    for text, col in col_headers:
        cell = ws.cell(row=current_row, column=col)
        apply_style(cell, text, bold=True, size=8, bg=HEADER_BG,
                   h_align='center', wrap=True)

    current_row += 1

    # ============================================
    # ROW 10: Maximum Marks
    # ============================================
    ws.row_dimensions[current_row].height = 14

    max_marks = [('Maximum Marks =>', 1), ('', 2), ('', 3),
                 (5, 4), (5, 5), (10, 6), ('', 7),
                 (20, 8), (20, 9), (60, 10), ('', 11), ('', 12)]

    for value, col in max_marks:
        cell = ws.cell(row=current_row, column=col)
        is_number = isinstance(value, int)
        apply_style(cell, value, bold=True, size=9, bg=MAX_MARKS_BG,
                   h_align='center' if is_number else 'left')

    current_row += 1

    # ============================================
    # ROW 11: Column Letters
    # ============================================
    ws.row_dimensions[current_row].height = 14

    col_letters = [('A', 1), ('', 2), ('', 3),
                   ('B', 4), ('C', 5), ('D', 6), ('', 7),
                   ('E', 8), ('F', 9), ('G', 10), ('H', 11), ('I', 12)]

    for value, col in col_letters:
        cell = ws.cell(row=current_row, column=col)
        apply_style(cell, value, bold=True, size=9, bg=COL_LETTER_BG, h_align='center')

    current_row += 1

    # ============================================
    # DATA ROWS: One per trainee
    # ============================================
    marks_lookup = {}
    for m in subject_marks:
        marks_lookup[m['traineeId']] = m

    for trainee in trainees:
        ws.row_dimensions[current_row].height = 18

        mark_entry = marks_lookup.get(trainee['id'], {})
        if subject_type == 'ES':
            target = mark_entry.get('totalESMarks', 15 if is_out_of_30 else 5)
        elif subject_type == 'WCS':
            target = mark_entry.get('totalWCSMarks', 5)
        else:
            target = mark_entry.get('totalEDMarks', 5)

        b, c, d, e, f, total_60, converted = distribute_marks(target, is_out_of_30)

        row_data = [
            (trainee.get('enrollmentNumber', ''), 1, False),
            (trainee.get('name', ''), 2, False),
            ('', 3, False),
            (b, 4, True),
            (c, 5, True),
            (d, 6, True),
            ('', 7, False),
            (e, 8, True),
            (f, 9, True),
            (total_60, 10, True),
            (round(converted, 4), 11, True),
            ('', 12, False),
        ]

        for value, col, is_number in row_data:
            cell = ws.cell(row=current_row, column=col)
            is_name_col = col == 2
            apply_style(
                cell, value,
                size=9,
                bg=DATA_BG,
                h_align='center' if is_number else 'left',
                wrap=is_name_col
            )

        current_row += 1

    # ============================================
    # Sign rows
    # ============================================
    current_row += 1
    ws.row_dimensions[current_row].height = 16
    sign_cell = ws.cell(row=current_row, column=2)
    apply_style(sign_cell,
               'Sign of SI :                                                            Sign of FI :',
               bold=False, size=9, border=False, h_align='left')
    ws.merge_cells(f'B{current_row}:L{current_row}')
    current_row += 1

    name_cell = ws.cell(row=current_row, column=2)
    apply_style(name_cell, instructor.get('displayName', ''),
               bold=True, size=9, border=False, h_align='left')
    current_row += 1

    iti_cell = ws.cell(row=current_row, column=2)
    apply_style(iti_cell, instructor.get('itiName', ''),
               size=9, border=False, h_align='left')
    iti_cell2 = ws.cell(row=current_row, column=8)
    apply_style(iti_cell2, instructor.get('itiName', ''),
               size=9, border=False, h_align='left')

    wb.save(output_path)
    print(f'{subject_type} report saved: {output_path}')

if __name__ == '__main__':
    data_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(data_file, 'r') as f:
        data = json.load(f)

    generate_subject_report(data, output_file)
