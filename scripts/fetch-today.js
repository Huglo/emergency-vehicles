#!/usr/bin/env node
// Runs daily via GitHub Actions.
// Fetches 18 images (6 per vehicle type) for today's country from Serper,
// writes public/data/YYYY-MM-DD.json so the site serves them as static files.

const https = require('https');
const fs   = require('fs');
const path = require('path');

// ── Same country-selection logic as index.html ──────────────────────────────
const COUNTRIES = [
  { name: "Afghanistan",               code: "af" },
  { name: "Albania",                   code: "al" },
  { name: "Algeria",                   code: "dz" },
  { name: "Andorra",                   code: "ad" },
  { name: "Angola",                    code: "ao" },
  { name: "Antigua and Barbuda",       code: "ag" },
  { name: "Argentina",                 code: "ar" },
  { name: "Armenia",                   code: "am" },
  { name: "Australia",                 code: "au" },
  { name: "Austria",                   code: "at" },
  { name: "Azerbaijan",                code: "az" },
  { name: "Bahamas",                   code: "bs" },
  { name: "Bahrain",                   code: "bh" },
  { name: "Bangladesh",                code: "bd" },
  { name: "Barbados",                  code: "bb" },
  { name: "Belarus",                   code: "by" },
  { name: "Belgium",                   code: "be" },
  { name: "Belize",                    code: "bz" },
  { name: "Benin",                     code: "bj" },
  { name: "Bhutan",                    code: "bt" },
  { name: "Bolivia",                   code: "bo" },
  { name: "Bosnia and Herzegovina",    code: "ba" },
  { name: "Botswana",                  code: "bw" },
  { name: "Brazil",                    code: "br" },
  { name: "Brunei",                    code: "bn" },
  { name: "Bulgaria",                  code: "bg" },
  { name: "Burkina Faso",              code: "bf" },
  { name: "Burundi",                   code: "bi" },
  { name: "Cabo Verde",                code: "cv" },
  { name: "Cambodia",                  code: "kh" },
  { name: "Cameroon",                  code: "cm" },
  { name: "Canada",                    code: "ca" },
  { name: "Central African Republic",  code: "cf" },
  { name: "Chad",                      code: "td" },
  { name: "Chile",                     code: "cl" },
  { name: "China",                     code: "cn" },
  { name: "Colombia",                  code: "co" },
  { name: "Comoros",                   code: "km" },
  { name: "Congo (Brazzaville)",       code: "cg" },
  { name: "Congo (Kinshasa)",          code: "cd" },
  { name: "Costa Rica",                code: "cr" },
  { name: "Croatia",                   code: "hr" },
  { name: "Cuba",                      code: "cu" },
  { name: "Cyprus",                    code: "cy" },
  { name: "Czech Republic",            code: "cz" },
  { name: "Denmark",                   code: "dk" },
  { name: "Djibouti",                  code: "dj" },
  { name: "Dominica",                  code: "dm" },
  { name: "Dominican Republic",        code: "do" },
  { name: "Ecuador",                   code: "ec" },
  { name: "Egypt",                     code: "eg" },
  { name: "El Salvador",               code: "sv" },
  { name: "Equatorial Guinea",         code: "gq" },
  { name: "Eritrea",                   code: "er" },
  { name: "Estonia",                   code: "ee" },
  { name: "Eswatini",                  code: "sz" },
  { name: "Ethiopia",                  code: "et" },
  { name: "Fiji",                      code: "fj" },
  { name: "Finland",                   code: "fi" },
  { name: "France",                    code: "fr" },
  { name: "Gabon",                     code: "ga" },
  { name: "Gambia",                    code: "gm" },
  { name: "Georgia",                   code: "ge" },
  { name: "Germany",                   code: "de" },
  { name: "Ghana",                     code: "gh" },
  { name: "Greece",                    code: "gr" },
  { name: "Grenada",                   code: "gd" },
  { name: "Guatemala",                 code: "gt" },
  { name: "Guinea",                    code: "gn" },
  { name: "Guinea-Bissau",             code: "gw" },
  { name: "Guyana",                    code: "gy" },
  { name: "Haiti",                     code: "ht" },
  { name: "Honduras",                  code: "hn" },
  { name: "Hungary",                   code: "hu" },
  { name: "Iceland",                   code: "is" },
  { name: "India",                     code: "in" },
  { name: "Indonesia",                 code: "id" },
  { name: "Iran",                      code: "ir" },
  { name: "Iraq",                      code: "iq" },
  { name: "Ireland",                   code: "ie" },
  { name: "Israel",                    code: "il" },
  { name: "Italy",                     code: "it" },
  { name: "Ivory Coast",               code: "ci" },
  { name: "Jamaica",                   code: "jm" },
  { name: "Japan",                     code: "jp" },
  { name: "Jordan",                    code: "jo" },
  { name: "Kazakhstan",                code: "kz" },
  { name: "Kenya",                     code: "ke" },
  { name: "Kiribati",                  code: "ki" },
  { name: "Kosovo",                    code: "xk" },
  { name: "Kuwait",                    code: "kw" },
  { name: "Kyrgyzstan",                code: "kg" },
  { name: "Laos",                      code: "la" },
  { name: "Latvia",                    code: "lv" },
  { name: "Lebanon",                   code: "lb" },
  { name: "Lesotho",                   code: "ls" },
  { name: "Liberia",                   code: "lr" },
  { name: "Libya",                     code: "ly" },
  { name: "Liechtenstein",             code: "li" },
  { name: "Lithuania",                 code: "lt" },
  { name: "Luxembourg",                code: "lu" },
  { name: "Madagascar",                code: "mg" },
  { name: "Malawi",                    code: "mw" },
  { name: "Malaysia",                  code: "my" },
  { name: "Maldives",                  code: "mv" },
  { name: "Mali",                      code: "ml" },
  { name: "Malta",                     code: "mt" },
  { name: "Marshall Islands",          code: "mh" },
  { name: "Mauritania",                code: "mr" },
  { name: "Mauritius",                 code: "mu" },
  { name: "Mexico",                    code: "mx" },
  { name: "Micronesia",                code: "fm" },
  { name: "Moldova",                   code: "md" },
  { name: "Monaco",                    code: "mc" },
  { name: "Mongolia",                  code: "mn" },
  { name: "Montenegro",                code: "me" },
  { name: "Morocco",                   code: "ma" },
  { name: "Mozambique",                code: "mz" },
  { name: "Myanmar",                   code: "mm" },
  { name: "Namibia",                   code: "na" },
  { name: "Nauru",                     code: "nr" },
  { name: "Nepal",                     code: "np" },
  { name: "Netherlands",               code: "nl" },
  { name: "New Zealand",               code: "nz" },
  { name: "Nicaragua",                 code: "ni" },
  { name: "Niger",                     code: "ne" },
  { name: "Nigeria",                   code: "ng" },
  { name: "North Korea",               code: "kp" },
  { name: "North Macedonia",           code: "mk" },
  { name: "Norway",                    code: "no" },
  { name: "Oman",                      code: "om" },
  { name: "Pakistan",                  code: "pk" },
  { name: "Palau",                     code: "pw" },
  { name: "Palestine",                 code: "ps" },
  { name: "Panama",                    code: "pa" },
  { name: "Papua New Guinea",          code: "pg" },
  { name: "Paraguay",                  code: "py" },
  { name: "Peru",                      code: "pe" },
  { name: "Philippines",               code: "ph" },
  { name: "Poland",                    code: "pl" },
  { name: "Portugal",                  code: "pt" },
  { name: "Qatar",                     code: "qa" },
  { name: "Romania",                   code: "ro" },
  { name: "Russia",                    code: "ru" },
  { name: "Rwanda",                    code: "rw" },
  { name: "Saint Kitts and Nevis",     code: "kn" },
  { name: "Saint Lucia",               code: "lc" },
  { name: "Saint Vincent & Grenadines",code: "vc" },
  { name: "Samoa",                     code: "ws" },
  { name: "San Marino",                code: "sm" },
  { name: "São Tomé and Príncipe",     code: "st" },
  { name: "Saudi Arabia",              code: "sa" },
  { name: "Senegal",                   code: "sn" },
  { name: "Serbia",                    code: "rs" },
  { name: "Seychelles",                code: "sc" },
  { name: "Sierra Leone",              code: "sl" },
  { name: "Singapore",                 code: "sg" },
  { name: "Slovakia",                  code: "sk" },
  { name: "Slovenia",                  code: "si" },
  { name: "Solomon Islands",           code: "sb" },
  { name: "Somalia",                   code: "so" },
  { name: "South Africa",              code: "za" },
  { name: "South Korea",               code: "kr" },
  { name: "South Sudan",               code: "ss" },
  { name: "Spain",                     code: "es" },
  { name: "Sri Lanka",                 code: "lk" },
  { name: "Sudan",                     code: "sd" },
  { name: "Suriname",                  code: "sr" },
  { name: "Sweden",                    code: "se" },
  { name: "Switzerland",               code: "ch" },
  { name: "Syria",                     code: "sy" },
  { name: "Taiwan",                    code: "tw" },
  { name: "Tajikistan",                code: "tj" },
  { name: "Tanzania",                  code: "tz" },
  { name: "Thailand",                  code: "th" },
  { name: "Timor-Leste",               code: "tl" },
  { name: "Togo",                      code: "tg" },
  { name: "Tonga",                     code: "to" },
  { name: "Trinidad and Tobago",       code: "tt" },
  { name: "Tunisia",                   code: "tn" },
  { name: "Turkey",                    code: "tr" },
  { name: "Turkmenistan",              code: "tm" },
  { name: "Tuvalu",                    code: "tv" },
  { name: "Uganda",                    code: "ug" },
  { name: "Ukraine",                   code: "ua" },
  { name: "United Arab Emirates",      code: "ae" },
  { name: "United Kingdom",            code: "gb" },
  { name: "United States",             code: "us" },
  { name: "Uruguay",                   code: "uy" },
  { name: "Uzbekistan",                code: "uz" },
  { name: "Vanuatu",                   code: "vu" },
  { name: "Vatican City",              code: "va" },
  { name: "Venezuela",                 code: "ve" },
  { name: "Vietnam",                   code: "vn" },
  { name: "Yemen",                     code: "ye" },
  { name: "Zambia",                    code: "zm" },
  { name: "Zimbabwe",                  code: "zw" }
];

const VEHICLE_QUERIES = {
  ambulance: c => `${c} ambulance emergency vehicle`,
  fire:      c => `${c} fire engine truck brigade`,
  police:    c => `${c} police car vehicle`
};

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function countryForDate(d) {
  const EPOCH = new Date(2024, 0, 1);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000);
  const idx = days % COUNTRIES.length;
  return COUNTRIES[(idx + COUNTRIES.length) % COUNTRIES.length];
}

function serperSearch(query, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ q: query, num: 9, gl: 'us', hl: 'en' });
    const req = https.request({
      hostname: 'google.serper.dev', path: '/images', method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`Serper ${res.statusCode}: ${data}`));
        try {
          const json = JSON.parse(data);
          resolve((json.images || [])
            .map(img => {
              const thumb = img.thumbnailUrl || img.imageUrl;
              const isGoogleThumb = img.imageUrl && img.imageUrl.includes('encrypted-tbn');
              const full = isGoogleThumb ? thumb : (img.imageUrl || thumb);
              return { thumb, full };
            })
            .filter(img => img.full)
            .slice(0, 6));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const apiKey = process.env.SERPER_KEY;
  if (!apiKey) { console.error('SERPER_KEY env var not set'); process.exit(1); }

  const today = new Date();
  const dk = dateKey(today);
  const country = countryForDate(today);
  console.log(`Fetching images for ${country.name} (${dk})`);

  const result = {};
  for (const [type, queryFn] of Object.entries(VEHICLE_QUERIES)) {
    const query = queryFn(country.name);
    console.log(`  Searching: "${query}"`);
    try {
      result[`${country.code}_${type}`] = await serperSearch(query, apiKey);
      console.log(`  ✓ ${type}: ${result[`${country.code}_${type}`].length} images`);
    } catch(e) {
      console.error(`  ✗ ${type}: ${e.message}`);
      result[`${country.code}_${type}`] = [];
    }
    // Small delay between requests to be polite
    await new Promise(r => setTimeout(r, 400));
  }

  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${dk}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`Written: public/data/${dk}.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
