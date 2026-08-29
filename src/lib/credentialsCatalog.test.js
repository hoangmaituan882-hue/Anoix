import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  uniqueFilmIds,
  buildCoverflowSlides,
} from './credentialsCatalog.js';

test('uniqueFilmIds: preserves first-seen order, skips blanks', () => {
  assert.deepEqual(
    uniqueFilmIds([
      { film_id: 'a' },
      { film_id: 'b' },
      { film_id: 'a' },
      { film_id: '' },
      { film_id: 'c' },
    ]),
    ['a', 'b', 'c'],
  );
});

test('buildCoverflowSlides: watch uses catalog film by id, not title search', () => {
  const slides = buildCoverflowSlides({
    watches: [{ id: 9, film_id: 'promare', rating: 5, film_title: 'fallback' }],
    films: [
      {
        id: 'promare',
        title: 'Promare',
        titleZh: '普罗米亚',
        landscapeImage: 'land.jpg',
        image: 'card.jpg',
        trailerUrl: 'https://example.com/p',
        director: '今石洋之',
        year: '2019',
      },
    ],
    library: [],
    lang: 'zh',
    limit: 5,
  });
  assert.equal(slides.length, 1);
  assert.equal(slides[0].filmId, 'promare');
  assert.equal(slides[0].title, '普罗米亚');
  assert.equal(slides[0].image, 'land.jpg');
  assert.equal(slides[0].videoUrl, 'https://example.com/p');
  assert.equal(slides[0].isWatched, true);
  assert.equal(slides[0].author.includes('5'), true);
});

test('buildCoverflowSlides: missing catalog row falls back to watch payload', () => {
  const slides = buildCoverflowSlides({
    watches: [{ id: 1, film_id: 'only-in-pg', rating: 4, film_title: 'PG 新片', image: 'w.jpg' }],
    films: [],
    library: [],
    lang: 'zh',
    limit: 5,
  });
  assert.equal(slides[0].title, 'PG 新片');
  assert.equal(slides[0].image, 'w.jpg');
  assert.equal(slides[0].filmId, 'only-in-pg');
});

test('buildCoverflowSlides: fills from live library, skipping already watched ids', () => {
  const slides = buildCoverflowSlides({
    watches: [{ id: 1, film_id: 'a', rating: 5, film_title: 'A' }],
    films: [{ id: 'a', title: 'A', image: 'a.jpg' }],
    library: [
      { id: 'a', title: 'A', image: 'a.jpg' },
      { id: 'b', title: 'B', titleZh: '乙', director: 'D', year: '2020', image: 'b.jpg', trailerUrl: 't' },
    ],
    lang: 'zh',
    limit: 2,
  });
  assert.equal(slides.length, 2);
  assert.equal(slides[1].filmId, 'b');
  assert.equal(slides[1].title, '乙');
  assert.equal(slides[1].isWatched, false);
  assert.equal(slides[1].videoUrl, 't');
});
