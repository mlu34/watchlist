/* Setting up */
'use strict';
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
require("dotenv").config({ path: ".env" });
const password = process.env.PASSWORD;

const {
    getMovies,
    insertData,
    isValidPassword,
    createGenreFilter,
    generateMovieHtml,
    createSortFilter,
    updateRating,
    createWatchedFilter
} = require('./utils');

/* Webpage */
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'style')));
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    setTimeout(() => {
        response.render("index");
    }, 1000);
});

app.post("/", (request, response) => {
    let input = request.body.password;
    if (isValidPassword(input) && input === password) {
        response.render("home");
    } else {
        setTimeout(() => {
            response.render("index");
        }, 1000);
    }
});

app.post("/home", async (request, response) => {
    let {title, type, description, name} = request.body;
    let date = new Date();
    if (title != null) {
        let result = {title: title, type: type, description: description, name: name, submitted_on: date, watched: -1, rating: 0, updated_on: new Date()};
        await insertData(result);
    }
    response.render("home");
});

app.post("/archive", async (request, response) => {
    let {search, sort, animated, documentary, movie, reality, series, not_watched, watching, watched} = request.body;
    let genres = createGenreFilter(animated, documentary, movie, reality, series);
    let watchedFilter = createWatchedFilter(not_watched, watching, watched);
    let sortFilter = createSortFilter(sort);
    let filter = {};

    // Generate search and genres filter
    if (search) {
        filter.title = { $regex: search, $options: 'i'};
    }
    filter.type = {$in: genres};
    filter.watched = {$in: watchedFilter};
    
    // Generate HTML code for each movie
    let movies = await getMovies(filter, sortFilter);
    let html = generateMovieHtml(movies);

    response.render("archive", {html: html});
});

app.post("/archive/rated", async (request, response) => {
    let {title, rating, watched} = request.body;
    await updateRating(title, rating, watched);

    let movies = await getMovies({}, {updated_on: -1});
    let html = generateMovieHtml(movies);

    response.render("archive", {html: html});
});

app.post("/rate", async (request, response) => {
    let {title, type, description, name, submittedOn, watched, rating} = request.body;
    response.render("rate", {title: title});
});


/* Starting the application: type 'node watch.js' into the console to start*/
process.stdin.setEncoding("utf8");
const port = process.env.PORT || 5000;
const webServer = http.createServer(app);
webServer.listen(port);
console.log(`Web server started and running at http://localhost:${port}`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    const input = process.stdin.read();
    if (input !== null) {
        const command = input.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write(`Invalid command: ${input}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});
