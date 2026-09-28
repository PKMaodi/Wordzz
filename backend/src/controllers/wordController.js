const wordRepository = require('../repositories/wordRepository');
const { BaseEntity } = require('../entities/baseEntity');
const { Word } = require('../entities/word');

const WORD_NOT_FOUND = 'This word could not be found. Refresh the word list and try again.';
const WORD_NOT_SAVED = 'The word could not be saved. Fix the problems listed and try again.';
const WORD_IN_USE = 'This word is used in at least one saved sentence, so it cannot be deleted. Remove it from those sentences first, then try again.';

function sendWordNotFound(res) {
  return res.status(404).json({ statusCode: 404, message: WORD_NOT_FOUND });
}

function sendWordNotSaved(res, errors) {
  return res.status(400).json({ statusCode: 400, message: WORD_NOT_SAVED, errors });
}

async function getWords(req, res) {
  res.json(await wordRepository.findAll());
}

async function getWordById(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  const word = id === null ? null : await wordRepository.findById(id);
  if (word === null) {
    return sendWordNotFound(res);
  }
  res.json(word);
}

async function createWord(req, res) {
  const result = Word.create({ text: req.body?.text, type: req.body?.type });
  if (!result.ok) {
    return sendWordNotSaved(res, result.errors);
  }
  res.status(201).json(await wordRepository.create(result.value));
}

async function updateWord(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  if (id === null) {
    return sendWordNotFound(res);
  }

  const result = Word.create({ id, text: req.body?.text, type: req.body?.type });
  if (!result.ok) {
    return sendWordNotSaved(res, result.errors);
  }

  const word = await wordRepository.update(result.value);
  if (word === null) {
    return sendWordNotFound(res);
  }
  res.json(word);
}

async function deleteWord(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  const outcome = id === null ? wordRepository.WORD_DELETE_RESULTS.NotFound : await wordRepository.deleteById(id);

  if (outcome === wordRepository.WORD_DELETE_RESULTS.InUse) {
    return res.status(409).json({ statusCode: 409, message: WORD_IN_USE });
  }
  if (outcome === wordRepository.WORD_DELETE_RESULTS.NotFound) {
    return sendWordNotFound(res);
  }
  res.status(204).end();
}

module.exports = { getWords, getWordById, createWord, updateWord, deleteWord };
