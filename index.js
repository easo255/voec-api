const express = require('express');
const pdfTableExtractor = require('@florpor/pdf-table-extractor');
const app =  express();



const parsedVoecDoc = require('./registeredCompanies.json');
let registeredCompanies = [];


app.get('/', (req, res) =>{
});


app.get('/api/allCompanies', (req, res) => {
    res.send(registeredCompanies);
})

app.get('/api/getCompany', (req, res) => {
    console.log(req.query.url);
    const company = registeredCompanies.find(c => c.url === req.query.url);
    if(!company) res.status(404).send('Selskapet er ikke registrert');
    res.send(company);
})

function onStart(){
    console.log('Listening on port 3000');
    parseDocument();
}

function parseDocument(){
    pdfTableExtractor('voec.pdf').then(res => {
        parsedVoecDoc = res;
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


app.listen(3000, () => onStart());
