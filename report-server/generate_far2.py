import sys
import json
import random
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def thin_border():
    t = Side(style='thin')
    return Border(left=t, right=t, top=t, bottom=t)

def rand_int(a, b):
    return random.randint(a, b)

def distribute_marks(target_mark, is_out_of_30):
    target_60 = round(target_mark * 2) if is_out_of_30 else round(target_mark * 6)
    clamped = max(20, min(60, target_60))

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
    return b, c, d, e, f, total_60

def apply_label_style(cell, value, bold=True):
    cell.value = value
    cell.font = Font(name='Calibri', size=11, bold=bold)
    cell.alignment = Alignment(horizontal='left', vertical='center', wrap_text=False)

def apply_header_style(cell, value):
    cell.value = value
    cell.font = Font(name='Calibri', size=10, bold=True)
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = thin_border()

def apply_data_style(cell, value, h_align='center'):
    cell.value = value
    cell.font = Font(name='Calibri', size=10, bold=False)
    cell.alignment = Alignment(horizontal=h_align, vertical='center', wrap_text=True)
    cell.border = thin_border()

def generate_subject_report(data, output_path):
    subject_type = data.get('subjectType', 'ES')
    trainees = data['trainees']
    subject_marks = data.get('subjectMarks', [])
    instructor = data['instructorData']
    batch = data['batchData']
    half = data['half']
    assessment_date = data.get('assessmentDate', '')
    trade = data.get('tradeData', {}) or {}
    has_5_subjects = data.get('has5Subjects', False)

    is_out_of_30 = (not has_5_subjects) and (subject_type == 'ES')

    title_map = {
        'ES': 'ANNEXURE-III (FAR-2 )',
        'WCS': '(FAR-2 )',
        'ED': '(FAR-2 )',
    }
    subject_title_map = {
        'ES': 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
        'WCS': 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
        'ED': 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
    }
    convert_label = (
        'Convert Total Marks in  to 30 Markes =\n{(Col.G)/2}'
        if is_out_of_30
        else 'Convert Total Marks in  to 10 Markes =\n{(Col.G)/6}'
    )
    formula_suffix = '/2' if is_out_of_30 else '/6'

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f'{subject_type}_Report'

    ws.page_setup.orientation = 'portrait'
    ws.page_setup.paperSize = 9
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1

    # Column widths (exact match)
    ws.column_dimensions['A'].width = 4.8
    ws.column_dimensions['B'].width = 20.0
    ws.column_dimensions['C'].width = 23.7
    ws.column_dimensions['D'].width = 7.8
    ws.column_dimensions['E'].width = 15.2
    ws.column_dimensions['F'].width = 7.5
    ws.column_dimensions['G'].width = 8.0
    ws.column_dimensions['H'].width = 7.3
    ws.column_dimensions['I'].width = 8.0
    ws.column_dimensions['J'].width = 8.0
    ws.column_dimensions['K'].width = 15.2
    ws.column_dimensions['L'].width = 8.2

    # Row 1: Report type (merged A1:L1)
    ws.row_dimensions[1].height = 17.9
    ws.merge_cells('A1:L1')
    apply_label_style(ws.cell(row=1, column=1, value=title_map[subject_type]), title_map[subject_type], bold=True)
    ws.cell(row=1, column=1).font = Font(name='Calibri', size=14, bold=True)
    ws.cell(row=1, column=1).alignment = Alignment(horizontal='center', vertical='center')

    # Row 2: Internal Assessment (merged A2:L2)
    ws.row_dimensions[2].height = 18
    ws.merge_cells('A2:L2')
    c = ws.cell(row=2, column=1, value='Internal Assessment')
    c.font = Font(name='Calibri', size=12, bold=True)
    c.alignment = Alignment(horizontal='center', vertical='center')

    # Row 3: Subject title (merged A3:L3)
    ws.row_dimensions[3].height = 18
    ws.merge_cells('A3:L3')
    c = ws.cell(row=3, column=1, value=subject_title_map[subject_type])
    c.font = Font(name='Calibri', size=10, bold=True)
    c.alignment = Alignment(horizontal='center', vertical='center')

    # Row 4: Assessor + Year (merged A4:C4, D4:F4, G4:J4, K4:L4)
    ws.row_dimensions[4].height = 18
    ws.merge_cells('A4:C4')
    apply_label_style(ws.cell(row=4, column=1), 'Name & Adddress of the Assessor')
    ws.merge_cells('D4:F4')
    apply_label_style(ws.cell(row=4, column=4), instructor.get('displayName', ''), bold=False)
    ws.merge_cells('G4:J4')
    apply_label_style(ws.cell(row=4, column=7), 'Year of Enrolment')
    ws.merge_cells('K4:L4')
    apply_label_style(ws.cell(row=4, column=11), batch.get('yearOfAssessment', ''), bold=False)

    # Row 5: ITI + Date (merged A5:C5, D5:F5, G5:J5, K5:L5)
    ws.row_dimensions[5].height = 18
    ws.merge_cells('A5:C5')
    apply_label_style(ws.cell(row=5, column=1), 'Name & Address of ITI (Govt/Pvt)')
    ws.merge_cells('D5:F5')
    apply_label_style(ws.cell(row=5, column=4), instructor.get('itiName', ''), bold=False)
    ws.merge_cells('G5:J5')
    apply_label_style(ws.cell(row=5, column=7), 'Date of Assessment')
    ws.merge_cells('K5:L5')
    apply_label_style(ws.cell(row=5, column=11), assessment_date, bold=False)

    # Row 6: Industry + Location (merged A6:C6, D6:F6, G6:J6, K6:L6)
    ws.row_dimensions[6].height = 18
    ws.merge_cells('A6:C6')
    apply_label_style(ws.cell(row=6, column=1), 'Name & Address of the Industry')
    ws.merge_cells('D6:F6')
    apply_label_style(ws.cell(row=6, column=4), instructor.get('address', ''), bold=False)
    ws.merge_cells('G6:J6')
    apply_label_style(ws.cell(row=6, column=7), 'Assessment Location')
    ws.merge_cells('K6:L6')
    apply_label_style(ws.cell(row=6, column=11), instructor.get('itiName', ''), bold=False)

    # Row 7: Trade + Duration + SEM (merged A7:B7, C7:F7, G7:I7, K7 single)
    ws.row_dimensions[7].height = 24
    ws.merge_cells('A7:B7')
    apply_label_style(ws.cell(row=7, column=1), 'Trade Name')
    ws.merge_cells('C7:F7')
    apply_label_style(ws.cell(row=7, column=3), trade.get('name', ''), bold=False)
    ws.merge_cells('G7:I7')
    apply_label_style(ws.cell(row=7, column=7), 'Duration Of  Trade')
    duration = trade.get('duration', 1)
    apply_label_style(ws.cell(row=7, column=10), f"{duration} Year", bold=False)
    apply_label_style(ws.cell(row=7, column=11), 'SEM')
    apply_label_style(ws.cell(row=7, column=12), half, bold=False)

    # Row 8: LO + Batch (merged A8:F8, G8:J8, K8:L8)
    ws.row_dimensions[8].height = 18
    ws.merge_cells('A8:F8')
    apply_label_style(ws.cell(row=8, column=1), 'Learning Outcome :')
    ws.merge_cells('G8:J8')
    apply_label_style(ws.cell(row=8, column=7), 'Batch NO')
    ws.merge_cells('K8:L8')
    apply_label_style(ws.cell(row=8, column=11), batch.get('batchNumber', ''), bold=False)

    # Row 9: Column headers (merged B9:C9, F9:G9)
    ws.row_dimensions[9].height = 63.6
    apply_header_style(ws.cell(row=9, column=1), 'Roll No')
    ws.merge_cells('B9:C9')
    apply_header_style(ws.cell(row=9, column=2), 'Name')
    apply_header_style(ws.cell(row=9, column=4), 'Attendance')
    apply_header_style(ws.cell(row=9, column=5), 'Speed for WC & Sc / Accuracy of ED / Comminacation skill fro ES')
    ws.merge_cells('F9:G9')
    apply_header_style(ws.cell(row=9, column=6), 'Creative Work (Chart , Model\n,Poster , Project work etc..)')
    apply_header_style(ws.cell(row=9, column=8), 'Quarterly -1')
    apply_header_style(ws.cell(row=9, column=9), 'Quarterly -2')
    apply_header_style(ws.cell(row=9, column=10), 'Total')
    apply_header_style(ws.cell(row=9, column=11), convert_label)
    apply_header_style(ws.cell(row=9, column=12), 'Sign of Trainee')

    # Row 10: Maximum marks (merged F10:G10)
    ws.row_dimensions[10].height = 18
    apply_header_style(ws.cell(row=10, column=1), 'Maximum Marks =>')
    ws.cell(row=10, column=1).alignment = Alignment(horizontal='left', vertical='center')
    apply_header_style(ws.cell(row=10, column=4), 5)
    apply_header_style(ws.cell(row=10, column=5), 5)
    ws.merge_cells('F10:G10')
    apply_header_style(ws.cell(row=10, column=6), 10)
    apply_header_style(ws.cell(row=10, column=8), 20)
    apply_header_style(ws.cell(row=10, column=9), 20)
    apply_header_style(ws.cell(row=10, column=10), 60)

    # Row 11: Column letters (merged F11:G11)
    ws.row_dimensions[11].height = 18
    apply_header_style(ws.cell(row=11, column=1), 'A')
    apply_header_style(ws.cell(row=11, column=4), 'B')
    apply_header_style(ws.cell(row=11, column=5), 'C')
    ws.merge_cells('F11:G11')
    apply_header_style(ws.cell(row=11, column=6), 'D')
    apply_header_style(ws.cell(row=11, column=8), 'E')
    apply_header_style(ws.cell(row=11, column=9), 'F')
    apply_header_style(ws.cell(row=11, column=10), 'G')
    apply_header_style(ws.cell(row=11, column=11), 'H')
    apply_header_style(ws.cell(row=11, column=12), 'I')

    # Marks lookup
    marks_lookup = {m['traineeId']: m for m in subject_marks}

    # Data rows starting row 12, merged B:C and F:G per row
    current_row = 12
    for trainee in trainees:
        ws.row_dimensions[current_row].height = 18

        mark_entry = marks_lookup.get(trainee['id'], {})
        if subject_type == 'ES':
            target = mark_entry.get('totalESMarks', 15 if is_out_of_30 else 5)
        elif subject_type == 'WCS':
            target = mark_entry.get('totalWCSMarks', 5)
        else:
            target = mark_entry.get('totalEDMarks', 5)

        b, c, d, e, f, total_60 = distribute_marks(target, is_out_of_30)

        apply_data_style(ws.cell(row=current_row, column=1), trainee.get('rollNumber') or trainee.get('enrollmentNumber', ''))

        ws.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=3)
        apply_data_style(ws.cell(row=current_row, column=2), trainee.get('name', ''), h_align='left')
        apply_data_style(ws.cell(row=current_row, column=3), '', h_align='left')

        apply_data_style(ws.cell(row=current_row, column=4), b)
        apply_data_style(ws.cell(row=current_row, column=5), c)

        ws.merge_cells(start_row=current_row, start_column=6, end_row=current_row, end_column=7)
        apply_data_style(ws.cell(row=current_row, column=6), d)
        apply_data_style(ws.cell(row=current_row, column=7), '')

        apply_data_style(ws.cell(row=current_row, column=8), e)
        apply_data_style(ws.cell(row=current_row, column=9), f)

        # Total formula =SUM(D{row}:I{row})
        total_cell = ws.cell(row=current_row, column=10)
        total_cell.value = f"=SUM(D{current_row}:I{current_row})"
        total_cell.font = Font(name='Calibri', size=10)
        total_cell.alignment = Alignment(horizontal='center', vertical='center')
        total_cell.border = thin_border()

        # Converted formula =J{row}/2 or /6
        conv_cell = ws.cell(row=current_row, column=11)
        conv_cell.value = f"=J{current_row}{formula_suffix}"
        conv_cell.font = Font(name='Calibri', size=10)
        conv_cell.alignment = Alignment(horizontal='center', vertical='center')
        conv_cell.border = thin_border()

        apply_data_style(ws.cell(row=current_row, column=12), '')

        current_row += 1

    # Blank row
    current_row += 1

    # Sign rows (merged B:K for sign of SI/FI line)
    ws.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=11)
    c = ws.cell(row=current_row, column=2,
                value='Sign of SI :                                                            Sign of FI :')
    c.font = Font(name='Calibri', size=10)
    c.alignment = Alignment(horizontal='left', vertical='center')
    current_row += 1

    c = ws.cell(row=current_row, column=2, value=instructor.get('displayName', ''))
    c.font = Font(name='Calibri', size=10, bold=True)
    current_row += 1

    c = ws.cell(row=current_row, column=2, value=instructor.get('itiName', ''))
    c.font = Font(name='Calibri', size=10)
    c2 = ws.cell(row=current_row, column=8, value=instructor.get('itiName', ''))
    c2.font = Font(name='Calibri', size=10)

    wb.save(output_path)
    print(f'{subject_type} report saved: {output_path}')

if __name__ == '__main__':
    data_file = sys.argv[1]
    output_file = sys.argv[2]
    with open(data_file, 'r') as f:
        data = json.load(f)
    generate_subject_report(data, output_file)
