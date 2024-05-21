'use strict';

const uri = process.env.MONGO_CONNECTION_STRING;
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const databaseName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
const database = client.db(databaseName);
const collection = database.collection(collectionName);

async function getMovies(filter, sortFilter) {
    try {
        await client.connect();
        let result = await collection.find(filter).sort(sortFilter).toArray();
        await client.close();
        return result;
    } catch (e) {
        console.error(e);
        await client.close();
        return [];
    }
}

async function insertData(data) {
    try {
        await client.connect();
        await collection.insertOne(data);
        await client.close();
    } catch (e) {
        console.error(e);
        await client.close();
    }
}

async function updateRating(title, rating, watched) {
    try {
        await client.connect();

        // Update watched status
        if (watched === "not_watched") {
            await collection.updateOne(
                { title: title },
                { $set: { rating: 0, watched: -1, updated_on: new Date() }, $unset: { watched_on: "" } }
            );
        } else if (watched === "watching") {
            await collection.updateOne(
                { title: title },
                { $set: { rating: 0, watched: 0, updated_on: new Date() }, $unset: { watched_on: "" } }
            );
        } else if (watched === "watched") {
            await collection.updateOne(
                { title: title },
                { $set: { watched_on: new Date(), rating: rating, watched: 1, updated_on: new Date() } }
            );
        }
        await client.close();
        return {};
    } catch (e) {
        console.error(e);
        await client.close();
        return null;
    }
}

function isValidPassword(input) {
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(input);
}

function createGenreFilter(animated, documentary, movie, reality, series) {
    let genres = [];
    if (animated !== 'on' && documentary !== 'on' && movie !== 'on'
        && reality !== 'on' && series !== 'on') 
    {
        genres = ['animated', 'documentary', 'movie', 'reality', 'series'];
    } else {
        if (animated === 'on') genres.push('animated');
        if (documentary === 'on') genres.push('documentary');
        if (movie === 'on') genres.push('movie');
        if (reality === 'on') genres.push('reality');
        if (series === 'on') genres.push('series');
    }
    return genres;
}

function createWatchedFilter(not_watched, watching, watched) {
    let watchedFilter = [];
    if (not_watched !== 'on' && watching !== 'on' && watched !== 'on') 
    {
        watchedFilter = [-1, 0, 1];
    } else {
        if (not_watched === 'on') watchedFilter.push(-1);
        if (watching === 'on') watchedFilter.push(0);
        if (watched === 'on') watchedFilter.push(1);
    }
    return watchedFilter;
}

function generateMovieHtml(movies) {
    let watchedColor = {'-1': '#ff6961', '0': '#ca5cdd', '1': '#77dd77'};
    let html = "";
    movies.forEach((m, index) => {
        const color = watchedColor[m.watched];
        const submittedOn = new Date(m.submitted_on).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
        let watchedOn = new Date(m.watched_on).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
        watchedOn = watchedOn == "Invalid Date"? "TBD" : watchedOn;
        let stars = "&starf;".repeat(Math.round(m.rating));
        stars += "&star;".repeat(5 - Math.round(m.rating));
        

        html += `<form action="/rate" method="post" id="rate-${index}"> 
                    <input type="hidden" name="title" value="${m.title}">
                    <input type="hidden" name="type" value="${m.type}">
                    <input type="hidden" name="description" value="${m.description}">
                    <input type="hidden" name="rating" value="${m.name}">
                    <input type="hidden" name="rating" value="${submittedOn}">
                    <input type="hidden" name="rating" value="${m.watched}">
                    <input type="hidden" name="rating" value="${m.rating}">
                    </form>`;

        html += `<fieldset class="mukta-regular">`;
        html += `<legend><a id="a-archive" onclick="document.getElementById('rate-${index}').submit();" style="color:${color}">${m.title}</a> (${m.type})</legend>`;
        html += `${m.description}<br><hr>`;
        html += `<div class="separate"><span class="tooltip">${stars} <span class="tooltiptext">${m.rating}</span></span><br><span>${m.name}</span></div>`;
        html += `<div class="separate"><span>${watchedOn}</span><br><span>${submittedOn}</span></div>`;
        html += `</fieldset><br>`;
    });
    return html;
}

function createSortFilter(sortBy) {
    let sortFilter = {updated_on: -1};
    switch(sortBy) {
        case 'newest':
            sortFilter = {submitted_on: -1};
            break;
        case 'oldest':
            sortFilter = {submitted_on: 1};
            break;
        case 'highest_rating':
            sortFilter = {rating: -1};
            break;
        case 'lowest_rating':
            sortFilter = {rating: 1};
            break;
    }
    return sortFilter;
}

module.exports = {
    getMovies,
    insertData,
    isValidPassword,
    createGenreFilter,
    generateMovieHtml,
    createSortFilter,
    updateRating,
    createWatchedFilter
};
