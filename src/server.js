'use strict';
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    //const url = "https://www.instagram.com/lovethyneighborclinic/";
    //const url = "https://www.google.com/search?hl=en-US&gl=us&q=Love+Thy+Neighbor,+1945+N+Mason+Rd+suite+107-A,+Katy,+TX+77449&ludocid=7470390801136818537&lsig=AB86z5VxW5D4C50W6LJ_bFEXnXuc#lrd=0x864127ece8bd4245:0x67ac28da931b1969,1";
    //const url = "https://search.google.com/local/reviews?placeid=ChIJRUK96OwnQYYRaRkbk9oorGc";

    let googleReport = await getGoogleReport();

    await writeReportToFile(googleReport);
  })();

async function getGoogleReport(){
    const url = "https://search.google.com/local/reviews?placeid=ChIJRUK96OwnQYYRaRkbk9oorGc";

    const browser = await chromium.launch({ headless: true, args: ['--lang=en-US'] });
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector("css=span .review-snippet");

    let averageRating = await page.$eval("css=span .Aq14fc", e => e.textContent);
    let reviewsCount = (await page.$eval("css=span .z5jxId", e => e.textContent)).match(/\d+/)[0];

    let reviews = await getGoogleReviews(page);

    let report = new Report();
    report.averageRating = averageRating;
    report.reviewsCount = reviewsCount;
    report.reviews = reviews

    await browser.close();

    return report;
}

async function getGoogleReviews(page){
    let reviewTexts = await page.$$eval('css=span .review-full-text', list => list.map(n => n.innerHTML));
    let reviewNames = await page.$$eval('css=span .TSUbDb', list => list.map(n => n.textContent));
    // matches 5,0 and 5.0 rating - independent of the language of the browser
    let reviewRatings = await page.$$eval('css=span .EBe2gf', list => list.map(n => n.getAttribute("aria-label").match(/(\d+,\d+|\d+\.\d+)/)[0]));

    let reviews = [];

    for (let index = 0; index < reviewNames.length; index++) {
        let review = new Review();

        review.name = reviewNames[index];
        review.reviewText = reviewTexts[index];
        review.rating = reviewRatings[index];
        
        reviews.push(review);
    }

    return reviews;
}

async function writeReportToFile(params) {
    // convert JSON object to string
    const data = JSON.stringify(params, null, 4);

    // write JSON string to a file
    fs.writeFile('temp/report.json', data, (error) => {
        if (error) {
            throw error;
        }
        console.log("JSON data is saved.");
    });
}

class Report{
    constructor(){
        this.averageRating = 0;
        this.reviewsCount = 0;
        this.reviews = [];
    }
}

class Review{
    constructor(){
        this.name = "";
        this.rating = 0;
        this.reviewText = "";
    }
}