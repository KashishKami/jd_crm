/* eslint-disable */
const fs = require('fs');

const filePath = 'c:\\Users\\Administrator\\Desktop\\JD CRM\\jd_crm.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const designations = data.find(item => item.type === 'table' && item.name === 'crm_designations').data;

console.log('Designations:');
designations.forEach(d => {
  console.log(`ID: ${d.designation_id} | Name: ${d.designation_name}`);
});
