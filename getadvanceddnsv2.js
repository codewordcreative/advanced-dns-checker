const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Default save path - subdirectory of wherever this script is loaded from
const saveDirectory = 'DNS-output';

// DNS record types for main domain
const fullRecordTypes = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'DNSKEY', 'DS', 'CDNSKEY', 'CDS', 'CAA', 'LOC', 'NAPTR', 'SMIMEA', 'SSHFP', 'TLSA', 'SRV', 'CERT', 'NSEC', 'NSEC3PARAM', 'RRSIG', 'LOC', 'TXT'
];

// DNS record types and the subdomains to check for subdomains when probed in bulk
const recordGroups = {
  'A,AAAA,CNAME,TXT': [
    'www', 'cdn', 'static', 'assets', 'media', 'img', 'js', 'css', 'fonts', 'calendar', 'drive', 'docs',
  ],
  'A,AAAA': [
    'crm', 'erp', 'shop', 'store', 'uat', 'pages', 'ipv4', 'ipv6', 'imap', 'pop', '_sip',
  ],
  'A,CNAME,SRV': [
    'webmail', 'autodiscover',
  ],
  'A,AAAA,TXT': [
    'mail', 'smtp',
  ],
  'A,AAAA,CNAME,SRV,TXT': [
    'api', 'gateway', 'vault', 'lyncdiscover', '_enterpriseregistration',
  ],
  'TXT': [
    'google._domainkey', 'default._domainkey', '_dmarc', 'selector1_domainkey', 'selector2_domainkey', 'zohoverify', '_domainconnect', '_atproto', 'default_bimi', '_acme-challenge', 'm1._domainkey','mg','_mta-sts', '_spf',
  ],
  'CNAME': [
    'google._domainkey', '_zmverify',  '_amazonses', '_mailgun', 'fm1._domainkey', 'fm2._domainkey','fm3._domainkey', 's1._domainkey', 's2._domainkey', 'mail._domainkey', 'mailo._domainkey', 'mesmtp._domainkey', '_tiktok', 'funnels', 'enterpriseenrollment', 'enterpriseregistration',
  ],
  'SRV': [
    '_sip._tls', '_sipfederationtls._tcp', '_autodiscover._tcp', '_submission._tcp', '_submissions._tcp', '_imap._tcp', '_imaps._tcp', '_pop3._tcp', '_jmap._tcp', '_smtps._tcp', '_autodiscover._tcp', '_tls', '_cf.tls', '_carddav._tcp', '_carddavs._tcp', '_caldav._tcp', '_caldavs._tcp',
  ],
};

// CLI arguments
const args = process.argv.slice(2);
const inputDomains = [];
const customSubs = {};
const options = [];

for (const arg of args) {
  if (arg.startsWith('-')) {
    options.push(arg.toLowerCase());
  } else {
    const parts = arg.split('%'); // Use '%' as a delimiter for subdomains
    const domainPart = parts[0];
    const subdomains = parts.slice(1).join(',').split(',').map(s => s.trim()).filter(Boolean);

    inputDomains.push(domainPart);

    if (subdomains.length > 0) {
      customSubs[domainPart] = subdomains;
    }
  }
}

// Arguments and options, now defaulting to always save to file unless print argument is added (new print and save option covers combined use case)
const printToConsole = options.includes('-p') || options.includes('--print');
const saveAndPrintToConsole = options.includes('-ps') || options.includes('--printsave');
const useExtended = options.includes('-x') || options.includes('--extended');
const useOverview = options.includes('-o') || options.includes('--overview');
const useNameservers = options.includes('-ns') || options.includes('--nameserver');
const saveToFile = !printToConsole;
const recordTypes = useOverview ? ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'] : fullRecordTypes;

if (inputDomains.length === 0) {
  console.error('Usage: node getadvanceddns.js <domain[%sub1,sub2]> [domain2[%sub3]] [options]');
  process.exit(1);
}

// There are peanuts. This the setup for a wildcard check, as I am assuming everyone is too cool to have a peanutspeanutspeanuts subdomain
const peanutsARecords = {};    
const peanutsAAAARecords = {}; 

function extractRecords(stdout) {
  return stdout
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

// Option to fetch records directly from the authoritative nameserver listed in the NS records
async function getAuthoritativeNameservers(domain) {
  try {
    const { stdout } = await execPromise(`dig NS ${domain} +short`);
    const nameservers = stdout.split('\n').map(ns => ns.trim()).filter(Boolean);
    if (nameservers.length === 0) {
      console.log(`⚠️ No authoritative NS records found for ${domain}`);
    }
    return nameservers;
  } catch (err) {
    console.error(`⚠️ Error fetching authoritative NS records for ${domain}:`, err);
    return [];
  }
}

// Basic reminder that it is working - not sure it's great but hey it was requested
let spinnerInterval;
function startSpinner(message) {
  const spinnerChars = ['|', '/', '-', '\\'];
  let i = 0;
  process.stdout.write(message);
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${message} ${spinnerChars[i++ % spinnerChars.length]}`);
  }, 150);
}

function stopSpinner() {
  clearInterval(spinnerInterval);
  process.stdout.write('\r');
}

// Here are the peanuts: wildcard detection, but also notificication that we are starting...
async function detectPeanuts(domain) {
  try {
    const peanutSubdomain = `peanutspeanutspeanuts.${domain}`;
    startSpinner(`\n👀 Checking ${domain}`);
    
    const { stdout: aStdout } = await execPromise(`dig ${peanutSubdomain} A +short`);
    const aRecords = extractRecords(aStdout);
    peanutsARecords[domain] = aRecords.length > 0 ? aRecords[0] : '';

    const { stdout: aaaaStdout } = await execPromise(`dig ${peanutSubdomain} AAAA +short`);
    const aaaaRecords = extractRecords(aaaaStdout);
    peanutsAAAARecords[domain] = aaaaRecords.length > 0 ? aaaaRecords[0] : '';

    stopSpinner();
    console.log(`🥜 Peanut (wildcard) check for ${domain}: A=${peanutsARecords[domain] || 'None'}, AAAA=${peanutsAAAARecords[domain] || 'None'}`);
    
    if (peanutsARecords[domain] || peanutsAAAARecords[domain]) {
      console.log('⚠️  Wildcard A/AAAA records detected - automatic subdomain filtering applied.\n');
    }

  } catch (err) {
    stopSpinner();
    console.error(`Error checking for wildcard records on ${domain}:\n`, err);
    peanutsARecords[domain] = '';
    peanutsAAAARecords[domain] = '';
  }
}

// Processing peanuts - checks to ensure wildcard results are cleaned
function isPeanutsRecord(record, domain, subdomain = '') {
  const isRootDomain = (subdomain === '' || subdomain === '@');

  if (isRootDomain) {
    return (record.trim() === '');
  }

  const isCustomSub = customSubs[domain]?.includes(subdomain);
  if (isCustomSub) {
    return false;
  }

  return (
    record.trim() === '' ||
    record.trim() === peanutsARecords[domain].trim() ||
    record.trim() === peanutsAAAARecords[domain].trim()
  );
}

// Get DNS records
async function getDnsRecords(domain, types, nameservers) {
  let output = '';
  let notFound = [];

  for (const type of types) {
    try {
      let digCommand = useNameservers
        ? `dig @${nameservers[0]} ${domain} ${type} +short +nocomments +noquestion +nocmd`
        : `dig ${domain} ${type} +short +nocomments +noquestion +nocmd`;
      const { stdout } = await execPromise(digCommand);
      const cleanRecords = extractRecords(stdout);

      const validRecords = cleanRecords.filter(record => !isPeanutsRecord(record, domain, '@'));
      
      if (validRecords.length > 0) {
        output += `${type}:\n${validRecords.join('\n')}\n\n`;
      } else {
        notFound.push(type);
      }
    } catch (err) {
      console.error(`Error querying ${domain} for ${type}:`, err);
      notFound.push(type);
    }
  }
  return { output, notFound };
}

// Get subdomain records
async function getSubdomainRecords(domain, nameservers, subdomain, recordGroup) {
  const fqdn = subdomain === '@' ? domain : `${subdomain}.${domain}`;
  let output = '';
  const recordTypes = recordGroup.split(',');

  for (const type of recordTypes) {
    try {
      let digCommand = useNameservers
        ? `dig @${nameservers[0]} ${fqdn} ${type} +short +nocomments +noquestion +nocmd`
        : `dig ${fqdn} ${type} +short +nocomments +noquestion +nocmd`;
      const { stdout } = await execPromise(digCommand);
      const cleanRecords = extractRecords(stdout);

      const validRecords = cleanRecords.filter(record => !isPeanutsRecord(record, domain, subdomain));

      if (validRecords.length > 0) {
        output += `${fqdn} (${type}):\n${validRecords.join('\n')}\n\n`;
      }
    } catch (err) {
      console.error(`Error querying ${fqdn} for type ${type}:`, err);
    }
  }
  return output;
}

// Fetch the records
async function getAllDnsRecords(domain, types, print = false, save = false, extended = false) {
  await detectPeanuts(domain);

  const nameservers = await getAuthoritativeNameservers(domain);
  const { output: baseOutput, notFound } = await getDnsRecords(domain, types, nameservers);

  let fullOutput = baseOutput;
  const seen = new Set();

  const customSubsForDomain = customSubs[domain] || [];
  for (const sub of customSubsForDomain) {
    if (!seen.has(sub)) {
      fullOutput += await getSubdomainRecords(domain, nameservers, sub, 'A,AAAA,CNAME,TXT');
      seen.add(sub);
    }
  }

  if (extended) {
    for (const group in recordGroups) {
      const subs = recordGroups[group];
      for (const sub of subs) {
        if (!seen.has(sub)) {
          fullOutput += await getSubdomainRecords(domain, nameservers, sub, group);
          seen.add(sub);
        }
      }
    }
  }
  return fullOutput;
}

// Get, save and/or print results
async function processDomains() {
  let output = '';
  let errors = [];
  for (const domain of inputDomains) {
    try {
      const domainOutput = await getAllDnsRecords(domain, recordTypes, printToConsole, saveToFile, useExtended);
      output += domainOutput;

      if (printToConsole || saveAndPrintToConsole) {
        console.log(domainOutput);
      }

      if (saveToFile) {
        try {
          const date = new Date();
          const domainForFilename = domain || 'unknown_domain';
          const filename = `dns-records-${domainForFilename.replace(/\W/g, '_')}_${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.txt`;
          const filePath = path.join(saveDirectory, filename);

          fs.mkdirSync(saveDirectory, { recursive: true });

          await fs.promises.writeFile(filePath, domainOutput);
          console.log(`💾 DNS records for ${domain} saved as ${filePath}\n`);

        } catch (err) {
          console.error(`Error saving records for o${domain}: ${err.message}`);
        }
      }

    } catch (err) {
      console.error(`Error processing ${domain}:`, err);
      errors.push(domain);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ Failed to process the following domains:`);
    errors.forEach(domain => console.log(`  - ${domain}`));
  }
}

processDomains();
