import sys
import json
import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter
from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
import random

def thin_border():
    thin = Side(style='thin')
    return Border(left=thin, right=thin, top=thin, bottom=thin)

def thick_border():
    thick = Side(style='medium')
    thin = Side(style='thin')
    return Border(left=thick, right=thick, top=thick, bottom=thick)

def apply_cell(ws, row, col, value='', bold=False, font_size=9,
               bg_color=None, align='center', border=True,
               wrap=True, font_color='000000', italic=False):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font = Font(
        name='Arial Narrow',
        size=font_size,
        bold=bold,
        color=font_color,
        italic=italic
    )
    cell.alignment = Alignment(
        horizontal=align,
        vertical='center',
        wrap_text=wrap,
        text_rotation=90 if align == 'rotate' else 0
    )
    if bg_color:
        cell.fill = PatternFill(
            start_color=bg_color,
            end_color=bg_color,
            fill_type='solid'
        )
    if border:
        cell.border = thin_border()
    return cell

def generate_far1(data, output_path):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default sheet

    trainees = data['trainees']
    distributed_marks = data['distributedMarks']
    instructor = data['instructorData']
    batch = data['batchData']
    half = data['half']
    assessment_date = data['assessmentDate']
    trade = data.get('tradeData', {})

    # Criteria structure
    criteria_groups = [
        {
            'name': 'Safety consciousness',
            'subs': [
                {'name': 'Dress code', 'max': 2},
                {'name': 'Use PPE', 'max': 5},
                {'name': 'Apply/\npractice\nsafety', 'max': 8},
            ],
            'total': 15
        },
        {
            'name': 'Workplace hygiene & Economical use of materials',
            'subs': [
                {'name': 'Maintain\npersonal &\nworkplace\ncleanliness', 'max': 3},
                {'name': 'Dispose\nscrap as\nper standard\npractice', 'max': 2},
                {'name': 'Select\nappropriate\nmaterial &\nminimize\nwastage', 'max': 5},
            ],
            'total': 10
        },
        {
            'name': 'Attendance/ Punctuality',
            'subs': [
                {'name': 'Initiative', 'max': 3},
                {'name': 'Accountability', 'max': 3},
                {'name': 'Participative\nin work', 'max': 4},
            ],
            'total': 10
        },
        {
            'name': 'Ability to follow Manuals/ Written instructions',
            'subs': [
                {'name': 'Select\nright\nmanual', 'max': 1},
                {'name': 'Search for\nappropriate\ntopic', 'max': 2},
                {'name': 'Read &\ninterpret\nthe manual', 'max': 2},
            ],
            'total': 5
        },
        {
            'name': 'Application of Knowledge',
            'subs': [
                {'name': 'Plan the\nwork', 'max': 4},
                {'name': 'Select\nappropriate\ntools &\nequipment', 'max': 3},
                {'name': 'Review\nthe work', 'max': 3},
            ],
            'total': 10
        },
        {
            'name': 'Skills to handle tools & equipment',
            'subs': [
                {'name': 'Handle &\nuse tools &\nequipment', 'max': 4},
                {'name': 'Maintain\nsafety in\nhandling', 'max': 3},
                {'name': 'Care &\nmaintain', 'max': 3},
            ],
            'total': 10
        },
        {
            'name': 'Speed in doing work',
            'subs': [
                {'name': 'Properly\nsequence\nthe work', 'max': 3},
                {'name': 'Use\nappropriate\ntechnique', 'max': 5},
                {'name': 'Review the\nwork during\nexecution', 'max': 2},
            ],
            'total': 10
        },
        {
            'name': 'Quality in workmanship',
            'subs': [
                {'name': 'Achieve\nwork with\nhigh\naccuracy', 'max': 7},
                {'name': 'Conform\nto\nrequirement', 'max': 3},
                {'name': 'Satisfy\nthe\npurpose', 'max': 5},
            ],
            'total': 15
        },
        {
            'name': 'VIVA',
            'subs': [
                {'name': 'Response\nwith\nclarity', 'max': 7},
                {'name': 'Technical\nunderstanding', 'max': 5},
                {'name': 'Conscious\ntowards\njob role', 'max': 3},
            ],
            'total': 15
        },
    ]

    # Process each trainee
    for trainee in trainees:
        trainee_id = trainee['id']

        # Get marks for this trainee
        trainee_marks = [
            m for m in distributed_marks
            if m['traineeId'] == trainee_id and m['half'] == half
        ]

        if not trainee_marks:
            continue

        # Group by LO
        lo_groups = {}
        for mark in trainee_marks:
            lo_id = mark['loId']
            if lo_id not in lo_groups:
                lo_groups[lo_id] = {
                    'loId': lo_id,
                    'loName': mark.get('loName', ''),
                    'loNumber': mark.get('loNumber', 0),
                    'loMark': mark.get('loMark', 0),
                    'practicals': []
                }
            lo_groups[lo_id]['practicals'].append(mark)

        sorted_los = sorted(lo_groups.values(), key=lambda x: x['loNumber'])

        # Create sheet for this trainee
        sheet_name = trainee.get('name', f"T{trainee.get('enrollmentNumber', '')}")[:28]
        sheet_name = sheet_name.replace('/', '_').replace('\\', '_').replace('*', '_')
        sheet_name = sheet_name.replace('?', '_').replace('[', '_').replace(']', '_')

        ws = wb.create_sheet(title=sheet_name)

        # Set page setup for A4 Landscape
        ws.page_setup.orientation = 'landscape'
        ws.page_setup.paperSize = 9  # A4
        ws.page_setup.fitToPage = True
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0

        # ============================================
        # COLUMN WIDTHS (matching actual report)
        # Col A=LO, B=Practical, then sub-criteria cols
        # ============================================
        ws.column_dimensions['A'].width = 12  # LO Number
        ws.column_dimensions['B'].width = 8   # Practical Number

        # Sub-criteria columns (C onwards)
        sub_col_widths = [
            4, 4, 5,  4,   # Safety (3 sub + total)
            5, 5, 5,  4,   # Hygiene
            4, 5, 5,  4,   # Attendance
            4, 5, 5,  4,   # Manuals
            4, 5, 4,  4,   # Knowledge
            5, 5, 4,  4,   # Tools
            5, 5, 5,  4,   # Speed
            5, 5, 5,  4,   # Quality
            5, 5, 5,  4,   # Viva
            5, 8, 8,       # Grand Total + Signs
        ]

        for i, width in enumerate(sub_col_widths):
            col_letter = get_column_letter(i + 3)
            ws.column_dimensions[col_letter].width = width

        # Colors
        HEADER_BG = 'C6EFCE'      # Light green for criteria group headers
        SUBHEADER_BG = 'FFEB9C'   # Light yellow for sub-criteria headers
        MAXMARKS_BG = 'FFC7CE'    # Light red for max marks row
        LO_AVG_BG = 'BDD7EE'      # Light blue for LO average rows
        OVERALL_AVG_BG = '70AD47' # Green for overall average
        DATA_BG = 'FFFFFF'        # White for data rows
        CRITERIA_TOTAL_BG = 'D9D9D9'  # Gray for criteria totals

        # ============================================
        # ROW 1: Title
        # ============================================
        ws.row_dimensions[1].height = 18
        title_cell = ws.cell(row=1, column=1, value='Internal Assessment')
        title_cell.font = Font(name='Arial Narrow', size=12, bold=True)
        title_cell.alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A1:AN1')

        # ============================================
        # ROW 2: Trainee Info Header
        # ============================================
        ws.row_dimensions[2].height = 15

        # Get year from dateOfAdmission
        doa = trainee.get('dateOfAdmission', '')
        year_of_enrollment = ''
        if doa:
            if '/' in doa:
                parts = doa.split('/')
                year_of_enrollment = parts[2] if len(parts) == 3 else ''
            elif '-' in doa:
                year_of_enrollment = doa.split('-')[0]

        row2_data = [
            (1, 'A', 'Name of Trainee:'),
            (5, 'E', trainee.get('name', '')),
            (19, 'S', 'Roll NO:'),
            (22, 'V', trainee.get('rollNumber') or trainee.get('enrollmentNumber', '')),
            (24, 'X', 'Year of Enrollment:'),
            (31, 'AE', year_of_enrollment or batch.get('yearOfAssessment', '')),
            (36, 'AJ', 'Sem:'),
            (40, 'AN', half),
        ]

        for col_num, col_letter, value in row2_data:
            cell = ws.cell(row=2, column=col_num, value=value)
            is_label = ':' in str(value)
            cell.font = Font(name='Arial Narrow', size=9, bold=is_label)
            cell.alignment = Alignment(horizontal='left', vertical='center')

        # ============================================
        # ROW 3: ITI Info
        # ============================================
        ws.row_dimensions[3].height = 15

        row3_data = [
            (1, 'Name of ITI:'),
            (5, instructor.get('itiName', '')),
            (19, 'Date of Assessment:'),
            (31, assessment_date or ''),
            (36, 'Batch:'),
            (40, batch.get('batchNumber', '')),
        ]

        for col_num, value in row3_data:
            cell = ws.cell(row=3, column=col_num, value=value)
            is_label = ':' in str(value)
            cell.font = Font(name='Arial Narrow', size=9, bold=is_label)
            cell.alignment = Alignment(horizontal='left', vertical='center')

        # ============================================
        # ROW 4: Industry + Assessment Location
        # ============================================
        ws.row_dimensions[4].height = 15

        row4_data = [
            (1, 'Name of the Industry:'),
            (5, trade.get('name', '')),
            (19, 'Assessment Location:'),
            (26, instructor.get('address', '')),
        ]

        for col_num, value in row4_data:
            cell = ws.cell(row=4, column=col_num, value=value)
            is_label = ':' in str(value)
            cell.font = Font(name='Arial Narrow', size=9, bold=is_label)
            cell.alignment = Alignment(horizontal='left', vertical='center')

        # ============================================
        # ROW 5: Trade + Duration + SI Name
        # ============================================
        ws.row_dimensions[5].height = 15

        duration = trade.get('duration', 1)
        row5_data = [
            (1, 'Trade Name:'),
            (5, trade.get('name', '')),
            (19, 'Duration of the Trade:'),
            (26, f"{duration} Year{'s' if duration > 1 else ''}"),
            (36, 'S.I.Name:'),
            (40, instructor.get('displayName', '')),
        ]

        for col_num, value in row5_data:
            cell = ws.cell(row=5, column=col_num, value=value)
            is_label = ':' in str(value)
            cell.font = Font(name='Arial Narrow', size=9, bold=is_label)
            cell.alignment = Alignment(horizontal='left', vertical='center')

        # ============================================
        # ROW 6: Criteria Group Headers (merged cells)
        # ============================================
        ws.row_dimensions[6].height = 30

        # Map: (start_col, end_col, group_name)
        group_spans = []
        col = 3  # Start from column C
        for group in criteria_groups:
            sub_count = len(group['subs'])
            end_col = col + sub_count  # +1 for total column
            group_spans.append((col, end_col, group['name']))
            col = end_col + 1

        for start_col, end_col, name in group_spans:
            start_letter = get_column_letter(start_col)
            end_letter = get_column_letter(end_col)
            cell = ws.cell(row=6, column=start_col, value=name)
            cell.font = Font(name='Arial Narrow', size=8, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            cell.fill = PatternFill(start_color=HEADER_BG, end_color=HEADER_BG, fill_type='solid')
            cell.border = thin_border()
            if start_col != end_col:
                ws.merge_cells(f'{start_letter}6:{end_letter}6')

        # Grand Total header
        grand_total_col = col
        cell = ws.cell(row=6, column=grand_total_col, value='Grand\nTotal')
        cell.font = Font(name='Arial Narrow', size=8, bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.fill = PatternFill(start_color=HEADER_BG, end_color=HEADER_BG, fill_type='solid')
        cell.border = thin_border()

        sign_col = grand_total_col + 1
        for offset, sign_text in [(0, 'Signature\nof Trainee'), (1, 'Signature\nof SI')]:
            cell = ws.cell(row=6, column=sign_col + offset, value=sign_text)
            cell.font = Font(name='Arial Narrow', size=8, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            cell.fill = PatternFill(start_color=HEADER_BG, end_color=HEADER_BG, fill_type='solid')
            cell.border = thin_border()

        # LO Number and Practical Number headers
        for col_num, text in [(1, 'Learning\nOutcome\nNumber'), (2, 'Practical /\nProfessional\nSkill Number')]:
            cell = ws.cell(row=6, column=col_num, value=text)
            cell.font = Font(name='Arial Narrow', size=8, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            cell.fill = PatternFill(start_color=HEADER_BG, end_color=HEADER_BG, fill_type='solid')
            cell.border = thin_border()

        # ============================================
        # ROW 7: Sub-criteria headers (rotated 90°)
        # ============================================
        ws.row_dimensions[7].height = 80  # Tall for rotated text

        # LO + Practical headers
        for col_num in [1, 2]:
            cell = ws.cell(row=7, column=col_num)
            cell.fill = PatternFill(start_color=SUBHEADER_BG, end_color=SUBHEADER_BG, fill_type='solid')
            cell.border = thin_border()

        col = 3
        for group in criteria_groups:
            for sub in group['subs']:
                cell = ws.cell(row=7, column=col, value=sub['name'])
                cell.font = Font(name='Arial Narrow', size=7)
                cell.alignment = Alignment(
                    horizontal='center', vertical='bottom',
                    wrap_text=True, text_rotation=90
                )
                cell.fill = PatternFill(start_color=SUBHEADER_BG, end_color=SUBHEADER_BG, fill_type='solid')
                cell.border = thin_border()
                col += 1

            # Total column for this group
            cell = ws.cell(row=7, column=col, value='Total')
            cell.font = Font(name='Arial Narrow', size=7, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center', text_rotation=90)
            cell.fill = PatternFill(start_color=SUBHEADER_BG, end_color=SUBHEADER_BG, fill_type='solid')
            cell.border = thin_border()
            col += 1

        # Grand total + signs
        for text in ['Grand\nTotal', 'Signature\nof Trainee', 'Signature\nof SI']:
            cell = ws.cell(row=7, column=col, value=text)
            cell.font = Font(name='Arial Narrow', size=7, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            cell.fill = PatternFill(start_color=SUBHEADER_BG, end_color=SUBHEADER_BG, fill_type='solid')
            cell.border = thin_border()
            col += 1

        # ============================================
        # ROW 8: Maximum marks
        # ============================================
        ws.row_dimensions[8].height = 15

        for col_num in [1, 2]:
            cell = ws.cell(row=8, column=col_num)
            cell.fill = PatternFill(start_color=MAXMARKS_BG, end_color=MAXMARKS_BG, fill_type='solid')
            cell.border = thin_border()

        col = 3
        for group in criteria_groups:
            for sub in group['subs']:
                cell = ws.cell(row=8, column=col, value=sub['max'])
                cell.font = Font(name='Arial Narrow', size=9, bold=True)
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.fill = PatternFill(start_color=MAXMARKS_BG, end_color=MAXMARKS_BG, fill_type='solid')
                cell.border = thin_border()
                col += 1

            # Total max
            cell = ws.cell(row=8, column=col, value=group['total'])
            cell.font = Font(name='Arial Narrow', size=9, bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.fill = PatternFill(start_color=MAXMARKS_BG, end_color=MAXMARKS_BG, fill_type='solid')
            cell.border = thin_border()
            col += 1

        # Grand total max
        cell = ws.cell(row=8, column=col, value=100)
        cell.font = Font(name='Arial Narrow', size=9, bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.fill = PatternFill(start_color=MAXMARKS_BG, end_color=MAXMARKS_BG, fill_type='solid')
        cell.border = thin_border()

        # ============================================
        # DATA ROWS: Practicals per LO
        # ============================================
        current_row = 9
        grand_total_col_index = col  # Store for later use

        for lo in sorted_los:
            sorted_practicals = sorted(
                lo['practicals'],
                key=lambda x: x.get('practicalNumber', 0)
            )

            for practical in sorted_practicals:
                ws.row_dimensions[current_row].height = 14

                # LO Number
                cell = ws.cell(row=current_row, column=1, value=f"LO - {lo['loNumber']}")
                cell.font = Font(name='Arial Narrow', size=9)
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.fill = PatternFill(start_color=DATA_BG, end_color=DATA_BG, fill_type='solid')
                cell.border = thin_border()

                # Practical Number
                cell = ws.cell(row=current_row, column=2, value=practical.get('practicalNumber', ''))
                cell.font = Font(name='Arial Narrow', size=9)
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.border = thin_border()

                # Fill criteria marks
                data_col = 3
                grand_total = 0
                criteria_marks = practical.get('criteriaMarks', [])

                for c_idx, criteria in enumerate(criteria_marks):
                    sub_marks = criteria.get('subCriteriaMarks', [])

                    for sub_mark in sub_marks:
                        val = sub_mark.get('allocatedMark', 0)
                        cell = ws.cell(row=current_row, column=data_col, value=val)
                        cell.font = Font(name='Arial Narrow', size=9)
                        cell.alignment = Alignment(horizontal='center', vertical='center')
                        cell.fill = PatternFill(start_color='E2EFDA', end_color='E2EFDA', fill_type='solid')
                        cell.border = thin_border()
                        data_col += 1

                    # Criteria total
                    criteria_total = criteria.get('allocatedMark', 0)
                    grand_total += criteria_total
                    cell = ws.cell(row=current_row, column=data_col, value=criteria_total)
                    cell.font = Font(name='Arial Narrow', size=9, bold=True)
                    cell.alignment = Alignment(horizontal='center', vertical='center')
                    cell.fill = PatternFill(start_color=CRITERIA_TOTAL_BG, end_color=CRITERIA_TOTAL_BG, fill_type='solid')
                    cell.border = thin_border()
                    data_col += 1

                # Grand total
                cell = ws.cell(row=current_row, column=data_col, value=grand_total)
                cell.font = Font(name='Arial Narrow', size=10, bold=True)
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.fill = PatternFill(start_color='FCE4D6', end_color='FCE4D6', fill_type='solid')
                cell.border = thin_border()

                current_row += 1

            # LO Average row
            ws.row_dimensions[current_row].height = 16

            lo_avg_cell = ws.cell(
                row=current_row, column=1,
                value=lo.get('loName', f"LO {lo['loNumber']}")
            )
            lo_avg_cell.font = Font(name='Arial Narrow', size=9, bold=True, italic=True)
            lo_avg_cell.alignment = Alignment(horizontal='left', vertical='center')
            lo_avg_cell.fill = PatternFill(start_color=LO_AVG_BG, end_color=LO_AVG_BG, fill_type='solid')
            lo_avg_cell.border = thin_border()

            # Merge LO name across several columns
            ws.merge_cells(f'A{current_row}:AD{current_row}')

            # Average label
            avg_label = ws.cell(
                row=current_row, column=35,
                value=f'Average of LO{lo["loNumber"]}'
            )
            avg_label.font = Font(name='Arial Narrow', size=9, bold=True)
            avg_label.alignment = Alignment(horizontal='right', vertical='center')
            avg_label.fill = PatternFill(start_color=LO_AVG_BG, end_color=LO_AVG_BG, fill_type='solid')
            avg_label.border = thin_border()
            ws.merge_cells(f'AE{current_row}:AH{current_row}')

            # Average value
            avg_val = ws.cell(row=current_row, column=38, value=lo.get('loMark', 0))
            avg_val.font = Font(name='Arial Narrow', size=11, bold=True)
            avg_val.alignment = Alignment(horizontal='center', vertical='center')
            avg_val.fill = PatternFill(start_color=LO_AVG_BG, end_color=LO_AVG_BG, fill_type='solid')
            avg_val.border = thin_border()

            current_row += 1

        # ============================================
        # Overall Average row
        # ============================================
        ws.row_dimensions[current_row].height = 18

        overall_avg = round(
            sum(lo.get('loMark', 0) for lo in sorted_los) / len(sorted_los)
        ) if sorted_los else 0

        overall_label = ws.cell(
            row=current_row, column=1,
            value='Average of All LOs'
        )
        overall_label.font = Font(name='Arial Narrow', size=10, bold=True, color='FFFFFF')
        overall_label.alignment = Alignment(horizontal='left', vertical='center')
        overall_label.fill = PatternFill(
            start_color=OVERALL_AVG_BG,
            end_color=OVERALL_AVG_BG,
            fill_type='solid'
        )
        overall_label.border = thin_border()
        ws.merge_cells(f'A{current_row}:AH{current_row}')

        overall_val = ws.cell(row=current_row, column=38, value=overall_avg)
        overall_val.font = Font(name='Arial Narrow', size=12, bold=True, color='FFFFFF')
        overall_val.alignment = Alignment(horizontal='center', vertical='center')
        overall_val.fill = PatternFill(
            start_color=OVERALL_AVG_BG,
            end_color=OVERALL_AVG_BG,
            fill_type='solid'
        )
        overall_val.border = thin_border()

    wb.save(output_path)
    print(f"FAR-1 saved: {output_path}")

if __name__ == '__main__':
    data_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(data_file, 'r') as f:
        data = json.load(f)

    generate_far1(data, output_file)