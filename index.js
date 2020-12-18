const express = require('express');
const pdfTableExtractor = require('@florpor/pdf-table-extractor');
const app =  express();
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');

const { parse } = require('path');
const { callbackify } = require('util');
let registeredCompanies = [];
const parsedVoecDoc = require('./parsed-voec.json');




app.get('/', (req, res) =>{
});


app.get('/api/allCompanies', (req, res) => {
    res.send(registeredCompanies);
})

app.get('/api/getCompany', (req, res) => {
    const company = registeredCompanies.find(c => c.url === req.query.url);
    if(!company) res.status(404).send('Selskapet er ikke registrert');
    res.send(company);
})

function onStart(){
    console.log('Listening on port 3000');
    scrape();
}

function parseDocument(){
    pdfTableExtractor('voec-downloaded.pdf').then(res => {

        try{
            fs.writeFileSync('parsed-voec.json', JSON.stringify(res));
        } catch(error){
            console.log(error);
        }
    });

    let pageTables = parsedVoecDoc.pageTables;
    let allPages =[]; 
    
    for (i = 0; i< parsedVoecDoc.numPages; i++){
        pageTables[i].tables.shift();
        pageTables[i].tables.shift();
        allPages.push(pageTables[i].tables);
    }

    let flattenedArray = allPages.flat(1);
    flattenedArray.unshift(["companyName", "countryCode", "url"]);
    const [keys, ...values] = flattenedArray;
    registeredCompanies = values.map(array => array.reduce((a, v, i) => ({...a, [keys[i]]: v}), {}));
}

function scrape(){
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
      });
    
}

app.listen(3000, () => onStart());
