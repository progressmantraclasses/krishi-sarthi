const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req,res) => {
  try {
    // For prototype we'll call a python stub that returns dummy detection
    // Alternatively return a dummy JSON immediately.
    const imagePath = req.file.path;
    // Option A: Return dummy immediately:
    const dummy = {
      disease: 'Aphids attack',
      confidence: 0.78,
      remedy: 'Spray neem oil, remove heavily infested leaves'
    };
    return res.json({ success: true, result: dummy });

    // Option B: If you implement python model, spawn it and read output:
    /*
    const py = spawn('python3', ['ai-models/pest_detector.py', imagePath]);
    let out = '';
    py.stdout.on('data', d => out += d.toString());
    py.on('close', () => {
      const parsed = JSON.parse(out);
      return res.json({ success: true, result: parsed });
    });
    */
  } catch(err){
    console.error(err);
    res.status(500).json({ success:false, err: err.message });
  }
});

module.exports = router;
