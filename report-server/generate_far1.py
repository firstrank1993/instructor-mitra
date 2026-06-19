import sys
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def medium_border():
    m = Side(style='medium')
    return Border(left=m, right=m, top=m, bottom=m)

def apply_header_style(cell, value, rotate=False):
    cell.value = value
    cell.font = Font(name='Arial', size=8, bold=True, color='FF000000')
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True,
                                text_rotation=90 if rotate else 0)
    cell.border = medium_border()

def apply_data_style(cell, value):
    cell.value = value
    cell.font = Font(name='Arial', size=10, bold=False)
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = medium_border()

def apply_lo_avg_style(cell, value, h_align='left'):
    cell.value = value
    cell.font = Font(name='Arial', size=8, bold=True, italic=False)
    cell.alignment = Alignment(horizontal=h_align, vertical='center', wrap_text=True)
    cell.fill = PatternFill(start_color='FFAFEEEE', end_color='FFAFEEEE', fill_type='solid')
    cell.border = medium_border()

CRITERIA = [
    {'name': 'Safety consciousness', 'subs': [
        {'name': 'Dress code', 'max': 2},
        {'name': 'Use PPE', 'max': 5},
        {'name': 'Apply/practice safety', 'max': 8},
    ], 'total': 15},
    {'name': 'Workplace hygiene  & Economical use of materials', 'subs': [
        {'name': 'Maintain personal & \nworkplace cleanliness', 'max': 3},
        {'name': 'Dispose scrap as per \nstandard practice', 'max': 2},
        {'name': 'Select appropriate material \n&  minimize wastage', 'max': 5},
    ], 'total': 10},
    {'name': 'Attendance/ Punctuality', 'subs': [
        {'name': 'Initiative', 'max': 3},
        {'name': 'Accountability', 'max': 3},
        {'name': 'Participative in work', 'max': 4},
    ], 'total': 10},
    {'name': 'Ability to follow Manuals/ Written instructions', 'subs': [
        {'name': 'Select right manual', 'max': 1},
        {'name': 'Search for appropriate topic', 'max': 2},
        {'name': 'Read & interpret the manual', 'max': 2},
    ], 'total': 5},
    {'name': 'Application of Knowledge', 'subs': [
        {'name': 'Plan the work', 'max': 4},
        {'name': 'Select appropriate tools\n& equipment', 'max': 3},
        {'name': 'Review the work', 'max': 3},
    ], 'total': 10},
    {'name': 'Skills to handle tools & equipment', 'subs': [
        {'name': 'Handle & use tools & \nequipment', 'max': 4},
        {'name': 'Maintain safety in handling', 'max': 3},
        {'name': 'Care & maintain', 'max': 3},
    ], 'total': 10},
    {'name': 'Speed in doing work', 'subs': [
        {'name': 'Properly sequence the work', 'max': 3},
        {'name': 'Use appropriate \ntechnique', 'max': 5},
        {'name': 'Review the work \nduring execution', 'max': 2},
    ], 'total': 10},
    {'name': 'Quality in workmanship', 'subs': [
        {'name': 'Achieve work \nwith high accuracy', 'max': 7},
        {'name': 'Conform to requirement', 'max': 3},
        {'name': 'Satisfy the purpose', 'max': 5},
    ], 'total': 15},
    {'name': 'VIVA', 'subs': [
        {'name': 'Response with clarity', 'max': 7},
        {'name': 'Technical understanding', 'max': 5},
        {'name': 'Conscious towards job role', 'max': 3},
    ], 'total': 15},
]

COL_WIDTHS = {
    'A': 0.4, 'B': 8.6, 'C': 5.0,
    'D': 3.6, 'E': 2.9, 'F': 3.1, 'G': 3.4,
    'H': 4.6, 'I': 4.7, 'J': 4.0, 'K': 3.1,
    'L': 3.4, 'M': 2.9, 'N': 3.4, 'O': 3.6,
    'P': 2.9, 'Q': 3.3, 'R': 3.1, 'S': 3.0,
    'T': 3.1, 'U': 4.3, 'V': 3.3, 'W': 3.6,
    'X': 5.1, 'Y': 3.0, 'Z': 2.9, 'AA': 3.3,
    'AB': 4.9, 'AC': 4.6, 'AD': 3.9, 'AE': 3.9,
    'AF': 4.9, 'AG': 3.1, 'AH': 3.4, 'AI': 4.4,
    'AJ': 3.0, 'AK': 4.4, 'AL': 3.1, 'AM': 3.9,
    'AN': 4.1, 'AO': 4.4, 'AP': 5.6, 'AQ': 0.1,
}

def generate_far1(data, output_path):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    trainees = data['trainees']
    distributed_marks = data['distributedMarks']
    instructor = data['instructorData']
    batch = data['batchData']
    half = data['half']
    assessment_date = data.get('assessmentDate', '')
    trade = data.get('tradeData', {}) or {}

    for trainee in trainees:
        trainee_id = trainee['id']
        trainee_marks = [m for m in distributed_marks
                          if m['traineeId'] == trainee_id and m['half'] == half]
        if not trainee_marks:
            continue

        lo_groups = {}
        for mark in trainee_marks:
            lo_id = mark['loId']
            if lo_id not in lo_groups:
                lo_groups[lo_id] = {
                    'loId': lo_id, 'loName': mark.get('loName', ''),
                    'loNumber': mark.get('loNumber', 0),
                    'loMark': mark.get('loMark', 0), 'practicals': []
                }
            lo_groups[lo_id]['practicals'].append(mark)
        sorted_los = sorted(lo_groups.values(), key=lambda x: x['loNumber'])

        sheet_name = (trainee.get('name') or f"T{trainee.get('enrollmentNumber','')}")[:28]
        sheet_name = sheet_name.replace('/', '_').replace('\\', '_').replace('*', '_').replace('?', '_').replace('[', '_').replace(']', '_').replace(':', '_')
        ws = wb.create_sheet(title=sheet_name or 'Sheet')

        ws.page_setup.orientation = 'landscape'
        ws.page_setup.paperSize = 9
        ws.page_setup.fitToPage = True
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0

        for col, w in COL_WIDTHS.items():
            ws.column_dimensions[col].width = w

        # Row 1: Title (merged B1:AP1)
        ws.row_dimensions[1].height = 18
        ws.merge_cells('B1:AP1')
        c = ws.cell(row=1, column=2, value='Internal Assessment')
        c.font = Font(name='Arial', size=10, bold=True)
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = medium_border()

        # Year of enrollment from dateOfAdmission
        doa = trainee.get('dateOfAdmission', '')
        year_of_enrollment = batch.get('yearOfAssessment', '')
        if doa:
            if '/' in doa:
                parts = doa.split('/')
                if len(parts) == 3:
                    year_of_enrollment = parts[2]
            elif '-' in doa:
                year_of_enrollment = doa.split('-')[0]

        # Row 2: Trainee info
        ws.row_dimensions[2].height = 18
        row2 = [
            (2, 5, 'Name of Trainee:'), (6, 22, trainee.get('name', '')),
            (19, 21, 'Roll NO:'), (22, 22, trainee.get('rollNumber') or trainee.get('enrollmentNumber', '')),
            (24, 31, 'Year of Enrollment:'), (32, 35, year_of_enrollment),
            (36, 39, 'Sem:'), (40, 40, half),
        ]
        for start, end, val in row2:
            c = ws.cell(row=2, column=start, value=val)
            is_label = isinstance(val, str) and val.endswith(':')
            c.font = Font(name='Arial', size=9, bold=is_label)
            c.alignment = Alignment(horizontal='left', vertical='center')
            if end > start:
                ws.merge_cells(start_row=2, start_column=start, end_row=2, end_column=end)

        # Row 3: ITI info
        ws.row_dimensions[3].height = 18
        row3 = [
            (2, 5, 'Name of ITI:'), (6, 22, instructor.get('itiName', '')),
            (24, 31, 'Date of Assessment:'), (32, 35, assessment_date),
            (36, 39, 'Batch:'), (40, 40, batch.get('batchNumber', '')),
        ]
        for start, end, val in row3:
            c = ws.cell(row=3, column=start, value=val)
            is_label = isinstance(val, str) and val.endswith(':')
            c.font = Font(name='Arial', size=9, bold=is_label)
            c.alignment = Alignment(horizontal='left', vertical='center')
            if end > start:
                ws.merge_cells(start_row=3, start_column=start, end_row=3, end_column=end)

        # Row 4: Industry
        ws.row_dimensions[4].height = 18
        row4 = [
            (2, 5, 'Name of the Industry:'), (6, 22, trade.get('name', '')),
            (24, 31, 'Assessment Location:'), (32, 39, instructor.get('address', '')),
        ]
        for start, end, val in row4:
            c = ws.cell(row=4, column=start, value=val)
            is_label = isinstance(val, str) and val.endswith(':')
            c.font = Font(name='Arial', size=9, bold=is_label)
            c.alignment = Alignment(horizontal='left', vertical='center')
            if end > start:
                ws.merge_cells(start_row=4, start_column=start, end_row=4, end_column=end)

        # Row 5: Trade info
        ws.row_dimensions[5].height = 18
        duration = trade.get('duration', 1)
        row5 = [
            (2, 5, 'Trade Name:'), (6, 22, trade.get('name', '')),
            (24, 31, 'Duration of the Trade:'), (32, 35, f"{duration} Year"),
            (36, 39, 'S.I.Name:'), (40, 42, instructor.get('displayName', '')),
        ]
        for start, end, val in row5:
            c = ws.cell(row=5, column=start, value=val)
            is_label = isinstance(val, str) and val.endswith(':')
            c.font = Font(name='Arial', size=9, bold=is_label)
            c.alignment = Alignment(horizontal='left', vertical='center')
            if end > start:
                ws.merge_cells(start_row=5, start_column=start, end_row=5, end_column=end)

        # Row 6: Criteria group headers
        ws.row_dimensions[6].height = 42.8
        col = 4  # Start at D
        for criteria in CRITERIA:
            start_col = col
            end_col = col + len(criteria['subs'])  # +1 for total
            for c_idx in range(start_col, end_col + 1):
                cell = ws.cell(row=6, column=c_idx)
                apply_header_style(cell, criteria['name'] if c_idx == start_col else '')
            ws.merge_cells(start_row=6, start_column=start_col, end_row=6, end_column=end_col)
            col = end_col + 1

        # B6, C6 empty headers
        for c_idx in [2, 3]:
            cell = ws.cell(row=6, column=c_idx)
            apply_header_style(cell, '')
        # AN6, AO6, AP6
        for c_idx in [40, 41, 42]:
            cell = ws.cell(row=6, column=c_idx)
            apply_header_style(cell, '')

        # Row 7: Sub-criteria headers (rotated 90)
        ws.row_dimensions[7].height = 126.0
        apply_header_style(ws.cell(row=7, column=2), 'Learning Outcome Number', rotate=True)
        apply_header_style(ws.cell(row=7, column=3), 'Practical / \nProfessional Skill Number', rotate=True)

        col = 4
        for criteria in CRITERIA:
            for sub in criteria['subs']:
                apply_header_style(ws.cell(row=7, column=col), sub['name'], rotate=True)
                col += 1
            apply_header_style(ws.cell(row=7, column=col), 'Total', rotate=True)
            col += 1

        apply_header_style(ws.cell(row=7, column=40), 'Grand Total', rotate=True)
        apply_header_style(ws.cell(row=7, column=41), 'Signature of Trainee', rotate=True)
        apply_header_style(ws.cell(row=7, column=42), 'Signature of SI', rotate=True)

        # Row 8: Max marks
        ws.row_dimensions[8].height = 18
        apply_header_style(ws.cell(row=8, column=2), '')
        apply_header_style(ws.cell(row=8, column=3), '')
        col = 4
        for criteria in CRITERIA:
            for sub in criteria['subs']:
                apply_header_style(ws.cell(row=8, column=col), sub['max'])
                col += 1
            apply_header_style(ws.cell(row=8, column=col), criteria['total'])
            col += 1
        apply_header_style(ws.cell(row=8, column=40), 100)
        apply_header_style(ws.cell(row=8, column=41), '')
        apply_header_style(ws.cell(row=8, column=42), '')

        # Data rows
        current_row = 9
        for lo in sorted_los:
            sorted_practicals = sorted(lo['practicals'], key=lambda x: x.get('practicalNumber', 0))

            for practical in sorted_practicals:
                ws.row_dimensions[current_row].height = 18
                apply_data_style(ws.cell(row=current_row, column=2), f"LO - {lo['loNumber']}")
                apply_data_style(ws.cell(row=current_row, column=3), practical.get('practicalNumber', ''))

                data_col = 4
                grand_total = 0
                for criteria in practical.get('criteriaMarks', []):
                    for sub_mark in criteria.get('subCriteriaMarks', []):
                        val = sub_mark.get('allocatedMark', 0)
                        apply_data_style(ws.cell(row=current_row, column=data_col), val)
                        data_col += 1
                    c_total = criteria.get('allocatedMark', 0)
                    apply_data_style(ws.cell(row=current_row, column=data_col), c_total)
                    grand_total += c_total
                    data_col += 1

                apply_data_style(ws.cell(row=current_row, column=40), grand_total)
                apply_data_style(ws.cell(row=current_row, column=41), '')
                apply_data_style(ws.cell(row=current_row, column=42), '')
                current_row += 1

            # LO average row
            ws.row_dimensions[current_row].height = 18
            lo_name_cell = ws.cell(row=current_row, column=2)
            apply_lo_avg_style(lo_name_cell, lo.get('loName', f"LO {lo['loNumber']}"), 'left')
            ws.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=32)

            for c_idx in range(3, 33):
                apply_lo_avg_style(ws.cell(row=current_row, column=c_idx), '', 'left')

            avg_label_cell = ws.cell(row=current_row, column=33)
            apply_lo_avg_style(avg_label_cell, f'Average of LO{lo["loNumber"]}', 'right')
            ws.merge_cells(start_row=current_row, start_column=33, end_row=current_row, end_column=39)
            for c_idx in range(34, 40):
                apply_lo_avg_style(ws.cell(row=current_row, column=c_idx), '', 'right')

            avg_val_cell = ws.cell(row=current_row, column=40)
            avg_val_cell.value = lo.get('loMark', 0)
            avg_val_cell.font = Font(name='Arial', size=11, bold=True)
            avg_val_cell.alignment = Alignment(horizontal='center', vertical='center')
            avg_val_cell.fill = PatternFill(start_color='FFAFEEEE', end_color='FFAFEEEE', fill_type='solid')
            avg_val_cell.border = medium_border()

            apply_lo_avg_style(ws.cell(row=current_row, column=41), '', 'center')
            apply_lo_avg_style(ws.cell(row=current_row, column=42), '', 'center')

            current_row += 1

        # Overall average
        overall_avg = round(sum(lo.get('loMark', 0) for lo in sorted_los) / len(sorted_los)) if sorted_los else 0
        ws.row_dimensions[current_row].height = 20
        overall_cell = ws.cell(row=current_row, column=2, value='Average of All LOs')
        overall_cell.font = Font(name='Arial', size=10, bold=True, color='FFFFFFFF')
        overall_cell.alignment = Alignment(horizontal='left', vertical='center')
        overall_cell.fill = PatternFill(start_color='FF70AD47', end_color='FF70AD47', fill_type='solid')
        overall_cell.border = medium_border()
        ws.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=39)
        for c_idx in range(3, 40):
            cc = ws.cell(row=current_row, column=c_idx)
            cc.fill = PatternFill(start_color='FF70AD47', end_color='FF70AD47', fill_type='solid')
            cc.border = medium_border()

        overall_val = ws.cell(row=current_row, column=40, value=overall_avg)
        overall_val.font = Font(name='Arial', size=12, bold=True, color='FFFFFFFF')
        overall_val.alignment = Alignment(horizontal='center', vertical='center')
        overall_val.fill = PatternFill(start_color='FF70AD47', end_color='FF70AD47', fill_type='solid')
        overall_val.border = medium_border()

    wb.save(output_path)
    print(f"FAR-1 saved: {output_path}")

if __name__ == '__main__':
    data_file = sys.argv[1]
    output_file = sys.argv[2]
    with open(data_file, 'r') as f:
        data = json.load(f)
    generate_far1(data, output_file)