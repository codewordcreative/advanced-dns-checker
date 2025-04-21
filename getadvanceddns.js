const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Default save path - subdirectory of wherever this script is loaded from
const saveDirectory = 'DNS-output';

// DNS record types
const fullRecordTypes = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR', 'SOA', 'CAA', 'AFSDB', 'APL', 'CDNSKEY', 'CDS', 'CERT', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'DNSKEY', 'DS', 'HINFO', 'HIP', 'IPSECKEY', 'IXFR', 'KEY', 'KX', 'LOC', 'NAPTR', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'OPT', 'RP', 'RRSIG', 'SIG', 'SMIMEA', 'SSHFP', 'TA', 'TKEY', 'TLSA', 'TSIG', 'URI', 'ZONEMD'
];

const overviewRecordTypes = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'DNSKEY', 'DS', 'SSHFP'
];

// CLI arguments
const args = process.argv.slice(2);
const domain = args[0];
const options = args.slice(1).map(arg => arg.toLowerCase());

const useOverview = options.includes('-o') || options.includes('--overview');
const printToConsole = options.includes('-p') || options.includes('--print');
const saveToFile = options.includes('-s') || options.includes('--save') || options.length === 0;

if (!domain) {
  console.error('❗ Usage: node clean-dns-checker.js <domain> [options]');
  console.error('Options:');
  console.error('  -o, --overview   Only fetch overview DNS records (e.g., inspecting security and sustainability)');
  console.error('  -p, --print      Print DNS results to the console');
  console.error('  -s, --save       Save results to a file (default, but can be combined with print option)');
  console.error('Example:       node getadvanceddns.js example.com -o -p -s');
  console.error('Get the overview DNS records from example.com, display these in the console and save them to a text file.');
  process.exit(1);
}

const recordTypes = useOverview ? overviewRecordTypes : fullRecordTypes;

// Extract and clean valid DNS records
function extractRecords(stdout) {
  if (!stdout || stdout.includes('not found') || stdout.includes('no records') || stdout.includes('NXDOMAIN')) {
    return null;
  }

  return stdout.split('\n').map(line => line.trim()).filter(line => line !== '').join('\n');
}

// Fetch DNS records by type
async function getDnsRecords(domain, types) {
  let output = '';
  let notFound = [];

  for (const type of types) {
    try {
      const { stdout } = await execPromise(`dig ${domain} ${type} +short`);
      const cleanData = extractRecords(stdout);
      if (cleanData) {
        output += `${type}:\n${cleanData}\n\n`;
      } else {
        notFound.push(type);
      }
    } catch (err) {
      console.error(`Error fetching ${type} record for ${domain}:`, err.message);
    }
  }

  return { output, notFound };
}

// Save and/or print results
async function getAllDnsRecords(domain, types, print, save) {
  const { output, notFound } = await getDnsRecords(domain, types);

    if (print) {
    console.log(output);
  }

  if (save) {
    const date = new Date();
    const filename = `dns-records-${domain.replace(/\W/g, '_')}_${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.txt`;
    const savePath = path.join(saveDirectory, filename);

    try {
      if (!fs.existsSync(saveDirectory)) {
        fs.mkdirSync(saveDirectory, { recursive: true });
      }

      fs.writeFileSync(savePath, output);
      console.log(`DONE: DNS records saved to: ${savePath}`);
    } catch (writeErr) {
      console.error(`ERROR: Error saving file: ${writeErr.message}`);
    }
  }

  if (notFound.length > 0) {
    console.log(`NOTE: These record types were not found: ${notFound.join(', ')}`);
  }
}

getAllDnsRecords(domain, recordTypes, printToConsole, saveToFile);
