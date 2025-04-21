# Advanced DNS checker
A CLI node.JS tool for fetching and logging all DNS records for backup and inspection.
## Dependencies
Node.js: You won't get far without it.
dig: command-line utility, usually included by default on Linux/macOS. On Windows, install it via WSL or use a version of BIND that includes dig.

----

# Set up
It's a command-line interface. Just download it wherever you want to run it 

## Customise the output directory if desired
It defaults to a subdirectory called dns-output.

----

# To use
Navigate to the file, then use it like this:

node advanceddns.js example.com

In the default setup, it will gather all known DNS records and save the output to a subdirectory called dns-output in an appropriately named text file.

You can use arguments to reduce the scope, print the output just to the console, or output to both the console and the drive.

## Arguments
### -o or --overview	
This pulls a trimmed-down list of key records of interest when generally inspecting the data, e.g. for sustainability or security purposes.

### -p or --print	
Outputs the results to the console instead of just saving a file.

### -s or --save
Saves the results to a timestamped .txt file (this is default behaviour).

### A combination
node advanceddns.js example.com -o -p -s
This would fetch the overview DNS records from example.com, output them to the console, and save them to disk.

----

## The full records
'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR', 'SOA', 'CAA', 'AFSDB', 'APL', 'CDNSKEY', 'CDS', 'CERT', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'DNSKEY', 'DS', 'HINFO', 'HIP', 'IPSECKEY', 'IXFR', 'KEY', 'KX', 'LOC', 'NAPTR', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'OPT', 'RP', 'RRSIG', 'SIG', 'SMIMEA', 'SSHFP', 'TA', 'TKEY', 'TLSA', 'TSIG', 'URI', 'ZONEMD'

## The overview records
'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'DNSKEY', 'DS', 'SSHFP'

## More?
Happy to add more. Any that don't exist aren't output in the file, anyway, so it doesn't hurt a lot to add and check for them.

----

## Why I made it
I genuinely couldn't find anything that scraped every single useful or even essential DNS record in one go. Most relied only on the tools available with NSLookup, too. It feels like an essential backup, really. It's also a lot easier to copy between text records when migrating between sites. Then I noticed it was interesting to see what other websites were doing

## Ideal use case
Backups. Migrations. General peace of mind.

## Interesting use case
Nosing at the third-party usage of big companies and government organisations. Spotting sustainability and security gaps.

---

## Special licence terms
See the notes on the licence tab. Commercial use by companies to improve their own websites is fine. Reselling or redistributing without credit is not. Where there is ambiguity here, the licence notes take precedent.
