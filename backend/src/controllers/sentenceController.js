const sentenceRepository = require('../repositories/sentenceRepository');
const { BaseEntity } = require('../entities/baseEntity');
const { Sentence } = require('../entities/sentence');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 100000;
const WHOLE_NUMBER_PATTERN = /^\d+$/;

const SENTENCE_NOT_FOUND = 'This sentence could not be found. Reload your saved sentences and try again.';
const SENTENCE_NOT_SAVED = 'The sentence could not be saved. Fix the problems listed and try again.';
const SENTENCES_NOT_LOADED = 'Your saved sentences could not be loaded. Fix the problems listed and try again.';

function sendSentenceNotFound(res) {
  return res.status(404).json({ statusCode: 404, message: SENTENCE_NOT_FOUND });
}

function sendSentenceNotSaved(res, errors) {
  return res.status(400).json({ statusCode: 400, message: SENTENCE_NOT_SAVED, errors });
}

function parsePagingValue(value, defaultValue, max) {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' || !WHOLE_NUMBER_PATTERN.test(value)) {
    return null;
  }
  const number = Number(value);
  return number >= 1 && number <= max ? number : null;
}

async function getSentences(req, res) {
  const page = parsePagingValue(req.query.page, 1, MAX_PAGE);
  const pageSize = parsePagingValue(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const errors = [];
  if (page === null) {
    errors.push(`The page must be a whole number from 1 to ${MAX_PAGE}.`);
  }
  if (pageSize === null) {
    errors.push(`The page size must be a whole number from 1 to ${MAX_PAGE_SIZE}.`);
  }
  if (errors.length > 0) {
    return res.status(400).json({ statusCode: 400, message: SENTENCES_NOT_LOADED, errors });
  }

  const { items, total } = await sentenceRepository.findPage({ offset: (page - 1) * pageSize, limit: pageSize });
  res.json({ items, total, page, pageSize });
}

async function getSentenceById(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  const sentence = id === null ? null : await sentenceRepository.findById(id);
  if (sentence === null) {
    return sendSentenceNotFound(res);
  }
  res.json(sentence);
}

async function createSentence(req, res) {
  const result = Sentence.create({ wordIds: req.body?.wordIds });
  if (!result.ok) {
    return sendSentenceNotSaved(res, result.errors);
  }
  res.status(201).json(await sentenceRepository.create(result.value));
}

async function updateSentence(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  if (id === null) {
    return sendSentenceNotFound(res);
  }

  const result = Sentence.create({ id, wordIds: req.body?.wordIds });
  if (!result.ok) {
    return sendSentenceNotSaved(res, result.errors);
  }

  const sentence = await sentenceRepository.update(result.value);
  if (sentence === null) {
    return sendSentenceNotFound(res);
  }
  res.json(sentence);
}

async function deleteSentence(req, res) {
  const id = BaseEntity.parseId(req.params.id);
  const deleted = id !== null && await sentenceRepository.deleteById(id);
  if (!deleted) {
    return sendSentenceNotFound(res);
  }
  res.status(204).end();
}

module.exports = { getSentences, getSentenceById, createSentence, updateSentence, deleteSentence };
