const express = require('express');
const { getWords, getWordById, createWord, updateWord, deleteWord } = require('../controllers/wordController');

const router = express.Router();

router.get('/', getWords);
router.get('/:id', getWordById);
router.post('/', createWord);
router.put('/:id', updateWord);
router.delete('/:id', deleteWord);

module.exports = router;
