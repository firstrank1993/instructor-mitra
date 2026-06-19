import sys
import json
import os

# FAR-3 is the ES report — reuses generate_far2.py logic
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_far2 import generate_subject_report

if __name__ == '__main__':
    data_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(data_file, 'r') as f:
        data = json.load(f)

    # Force subject type to ES for FAR-3
    data['subjectType'] = 'ES'

    generate_subject_report(data, output_file)
    print(f"FAR-3 ES saved: {output_file}")