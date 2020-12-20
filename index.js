const express = require('express');
const pdfTableExtractor = require('@florpor/pdf-table-extractor');
const app =  express();
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');
const psl = require('psl');
const utils = require('./utils');
const cron = require('node-cron');

let registeredCompanies = require('./parsed-voec.json');
let extractionDateTime = '';




app.get('/', (req, res) => {
    res.send('VOEC API');
});

app.get('/api/allCompanies', (req, res) => {
    res.send(registeredCompanies);
})

app.get('/api/getCompany', (req, res) => {
    let hostName = psl.get(utils.extractHostName(req.query.url));
    const company = registeredCompanies.find(c => psl.get(utils.extractHostName(c.url)) === hostName);
    if(!company) res.status(404).send('Selskapet er ikke registrert');
    res.send(company);
})

app.get('/api/extractionDateTime', (req, res) => {
    let extractionDateTimeObj = {
        extractionDateTime:extractionDateTime
    }

    res.send(extractionDateTimeObj);
})

function onStart() {
    console.log('Listening on port 3000');
}


cron.schedule('0 00 10 * * 0-6', function() {
    console.log('Daily task running');
    scrape();
});


function scrape() {
    const url = 'https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/mva/utland/e-handel-voec/nettbutikker-og-e-markedsplasser-som-er-registrert-i-voec-registeret/';
    axios(url)
      .then(response => {
        let html = response.data;
        let  $ = cheerio.load(html);
        let goToLink = $('.go-to-link > a').attr('href');
        console.log(goToLink);
        documentLink = 'https://www.skatteetaten.no'+goToLink;

        const file = fs.createWriteStream("voec-downloaded.pdf");
        https.get(documentLink, function(response) {
            response.pipe(file);
            });

            file.on('finish', () => parseDocument());
      });

}


function parseDocument(){
        pdfTableExtractor('voec-downloaded.pdf').then(parsedVoecDoc => {
            let pageTables = parsedVoecDoc.pageTables;
            let allPages =[]; 
            let locationOfExtractionDate = pageTables[0].tables[0].toString();
            let extractionDate = locationOfExtractionDate.substring(locationOfExtractionDate.length -18)
            extractionDateTime = extractionDate.substring(0, extractionDate.length -2);


            for (i = 0; i< parsedVoecDoc.numPages; i++){
                pageTables[i].tables.shift();
                pageTables[i].tables.shift();
                allPages.push(pageTables[i].tables);
            }
    
            let flattenedArray = allPages.flat(1);
            flattenedArray.unshift(["companyName", "countryCode", "url"]);
            const [keys, ...values] = flattenedArray;
            let finalArray = values.map(array => array.reduce((a, v, i) => ({...a, [keys[i]]: v}), {}));

            fs.writeFile('parsed-voec.json', JSON.stringify(finalArray), (err) => {
                if (err) throw err;
                console.log('Data written to file');
                registeredCompanies = require('./parsed-voec.json');
            });
        });
}


app.listen(process.env.PORT || 3000, () => onStart());
