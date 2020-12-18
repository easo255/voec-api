const express = require('express');
const pdfTableExtractor = require('@florpor/pdf-table-extractor');
const app =  express();
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');
const psl = require('psl');
const utils = require('./utils');
let registeredCompanies = '';




app.get('/', (req, res) =>{
});


app.get('/api/allCompanies', (req, res) => {
    res.send(registeredCompanies);
})

app.get('/api/getCompany', (req, res) => {
    let hostName = psl.get(utils.extractHostName(req.query.url));
    const company = registeredCompanies.find(c => c.url === hostName);
    if(!company) res.status(404).send('Selskapet er ikke registrert');
    res.send(company);
})

function onStart(){
    console.log('Listening on port 3000');
    scrape();
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

            file.on('finish', () => parseDocument());
      });

}


function parseDocument(){
        pdfTableExtractor('voec-downloaded.pdf').then(parsedVoecDoc => {
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
            let finalArray = values.map(array => array.reduce((a, v, i) => ({...a, [keys[i]]: v}), {}));

            fs.writeFile('parsed-voec.json', JSON.stringify(finalArray), (err) => {
                if (err) throw err;
                console.log('Data written to file');
                registeredCompanies = require('./parsed-voec.json');
            });
        });
}


app.listen(3000, () => onStart());
