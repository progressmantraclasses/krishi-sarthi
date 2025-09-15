const express = require('express');
const router = express.Router();
const adviceController = require('../controllers/adviceController');

router.post('/', adviceController.getAdvice);
router.post('/feedback', adviceController.feedback);

module.exports = router;
