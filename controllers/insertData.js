const asyncHandler = require("express-async-handler");
const data = require("../../Scraping data/cateGenres");
const comics = require("../../Scraping data/comic.json");
const chapters = require("../../Scraping data/chapter.json");
const Genre = require("../models/genre");
const Comic = require("../models/comic");
const Chapter = require("../models/chapter");

const slugify = require("slugify");
const fnGenres = async (genre) => {
  await Genre.create({ name: genre });
};
const insertGenres = asyncHandler(async (req, res) => {
  const promises = [];
  for (let genre of data) promises.push(fnGenres(genre.name));
  await Promise.all(promises);
  return res.json("Done");
});
const fnComics = async (comic) => {
  //   const genres = comic.genres.map(async (item) => {
  //     const getIdGenre = await Genre.findOne({ name: item.name });
  //     return getIdGenre._id
  //   });
  const promises = [];
  for (let genre of comic.genres) {
    promises.push(Genre.findOne({ name: genre }));
  }
  const genre = await Promise.all(promises);
  const genreID = genre.map((item) => {
    return item?._id;
  });
  const exist = await Comic.findOne({title: comic.name})
  console.log('exist');
  if(!exist) {
    await Comic.create({
      title: comic.name,
      slug: slugify(comic.name),
      description: comic.description,
      coverImage: comic.avatar,
      genre: genreID,
      viewCount: comic.view.replaceAll(",", ""),
      status: comic.status,
      follow: comic.follow.replaceAll(",", ""),
    });
  }
};

const insertComics = asyncHandler(async (req, res) => {
  const promises = [];
  for (let comic of comics) promises.push(fnComics(comic));
  await Promise.all(promises);
  return res.json("Done");
});

const fnChapters = async (chapter) => {
  //   const genres = comic.genres.map(async (item) => {
  //     const getIdGenre = await Genre.findOne({ name: item.name });
  //     return getIdGenre._id
  //   });
  const comicID = await Comic.findOne({
    $or: [{ title: chapter.nameComic }, { slug: slugify(chapter.nameComic) }],
  });
  if(comicID) {
    const exist = await Chapter.findOne({comic: comicID._id, chapNumber: chapter.chapNumber})
    if(!exist) {
      if (!Number(chapter.chapNumber)) return;
      await Chapter.create({
        comic: comicID._id,
        chapNumber: chapter.chapNumber,
        images: chapter.images,
      });
    }
  }
};

const insertChapters = asyncHandler(async (req, res) => {
  const promises = [];
  for (let chapter of chapters) promises.push(fnChapters(chapter));
  await Promise.all(promises);
  return res.json("Done");
});

const removeComics = asyncHandler(async (req, res) => {
  let comics = await Comic.find();
  let comic;
  let i = 0;
  while (i < comics.length) {
    let check;
    comic = comics[i];
    if(!comic) break;
    for(let item of comics) {
      check = await Comic.deleteMany({title: comic.title})
    }
    if(check.deletedCount === 0) i++;
  }
  return json('Done')
})
module.exports = {
  insertGenres: insertGenres,
  insertComics,
  insertChapters,
  removeComics
};
