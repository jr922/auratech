const fs = require('fs');
const https = require('https');

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(JSON.parse(data)));
  }).on('error', reject);
});

async function main() {
  const deps = await fetchJson('https://raw.githubusercontent.com/ernestorivero/Ubigeo-Peru/master/json/ubigeo_peru_2016_departamentos.json');
  const provs = await fetchJson('https://raw.githubusercontent.com/ernestorivero/Ubigeo-Peru/master/json/ubigeo_peru_2016_provincias.json');
  const dists = await fetchJson('https://raw.githubusercontent.com/ernestorivero/Ubigeo-Peru/master/json/ubigeo_peru_2016_distritos.json');

  const ubigeo = deps.map(d => {
    return {
      department: d.name,
      provinces: provs
        .filter(p => p.department_id === d.id)
        .map(p => {
          return {
            province: p.name,
            districts: dists
              .filter(dist => dist.province_id === p.id && dist.department_id === d.id)
              .map(dist => dist.name)
          };
        })
    };
  });

  const content = `export const PERU_UBIGEO = ${JSON.stringify(ubigeo, null, 2)};\n`;
  fs.writeFileSync('lib/ubigeo.ts', content, 'utf8');
  console.log('Done!');
}
main();
