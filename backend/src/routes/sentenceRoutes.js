const express = require('express');
const {
  getSentences,
  getSentenceById,
  createSentence,
  updateSentence,
  deleteSentence
} = require('../controllers/sentenceController');

const router = express.Router();

router.get('/', getSentences);
router.get('/:id', getSentenceById);
router.post('/', createSentence);
router.put('/:id', updateSentence);
router.delete('/:id', deleteSentence);

module.exports = router;
