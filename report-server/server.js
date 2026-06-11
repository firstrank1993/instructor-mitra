const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Generate FAR-1 report
app.post('/generate/far1', async (req, res) => {
  const dataFile = path.join(__dirname, 'temp_far1_data.json');
  const outputFile = path.join(__dirname, 'temp_far1_output.xlsx');

  try {
    fs.writeFileSync(dataFile, JSON.stringify(req.body));

    exec(`python3 generate_far1.py ${dataFile} ${outputFile}`,
      { cwd: __dirname },
      (error, stdout, stderr) => {
        if (error) {
          console.error('FAR-1 error:', stderr);
          return res.status(500).json({ error: stderr });
        }

        const fileBuffer = fs.readFileSync(outputFile);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="FAR1_Report.xlsx"');
        res.send(fileBuffer);

        // Cleanup
        fs.unlinkSync(dataFile);
        fs.unlinkSync(outputFile);
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate FAR-2/FAR-3 subject reports (ES, WCS, ED)
app.post('/generate/subject', async (req, res) => {
  const { subjectType } = req.body;
  const dataFile = path.join(__dirname, `temp_${subjectType}_data.json`);
  const outputFile = path.join(__dirname, `temp_${subjectType}_output.xlsx`);

  try {
    fs.writeFileSync(dataFile, JSON.stringify(req.body));

    exec(`python3 generate_far2.py ${dataFile} ${outputFile}`,
      { cwd: __dirname },
      (error, stdout, stderr) => {
        if (error) {
          console.error('Subject report error:', stderr);
          return res.status(500).json({ error: stderr });
        }

        const fileBuffer = fs.readFileSync(outputFile);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${subjectType}_Report.xlsx"`);
        res.send(fileBuffer);

        fs.unlinkSync(dataFile);
        fs.unlinkSync(outputFile);
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Report server running on port ${PORT}`);
});