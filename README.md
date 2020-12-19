# voec-api
 
Enkelt Node.js API som gjør det mulig å få hente ut registrerte virksomheter fra [VOEC Registeret](https://www.toll.no/no/netthandel/1.april/voec/). Denne dataen er kun tilgjengelig som PDF, via [skatteetaten.no](https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/mva/utland/e-handel-voec/nettbutikker-og-e-markedsplasser-som-er-registrert-i-voec-registeret/). 

En gang daglig foretar serveren en automatisk nedlasting av PDF dokumentet med registrerte bedrifter, og gjør dette om til JSON som deretter kan hentes ut ved å ta i bruk de forskjellige endepunktene. 


## Endepunkter

### Spesifikt URL søk for selskap

`GET api/getCompany?url=www.amazon.co.uk`

Full URL kan også brukes, feks 

`GET api/getCompany?url=https://www.amazon.co.uk/dp/B084DWCZXZ `

```

{
  "companyName": "Amazon Digital UK Limited",
  "countryCode": "GB - UNITED KINGDOM",
  "url": "amazon.co.uk"
}


```

`200 OK` Hvis selskapet eksisterer `404 NOT FOUND` hvis ikke. 


### Alle registrerte selskaper

`GET api/allCompanies`

```

[
  {
    "companyName": "Skovgaard dev",
    "countryCode": "DK - DENMARK",
    "url": "/unik-openbuild.dk"
  },
  {
    "companyName": "Vulva Enterprise",
    "countryCode": "DK - DENMARK",
    "url": "1."
  },
  {
    "companyName": "DOETICAN LIMITED",
    "countryCode": "CY - CYPRUS",
    "url": "101reel.com"
  },
  {
    "companyName": "Tekstilgalleriet",
    "countryCode": "DK - DENMARK",
    "url": "123knit.dk"
  },
  {
    "companyName": "24meter AB",
    "countryCode": "SE - SWEDEN",
    "url": "24meter.se"
  },
  
  ...etc
  ]


```

### Dato og tid for PDF uttrekket

PDF-en inkluderer dato/tidspunkt for siste uttrekk av registrerte bedrifter.

`GET api/extractionDateTime`

````
{
  "extractionDateTime": "18.12.2020 12:26"
}
````
