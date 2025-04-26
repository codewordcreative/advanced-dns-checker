# Advanced DNS Checker VERSION 2
A CLI node.JS tool for fetching and logging all DNS records for backup and inspection, now with subdomain support.

## Dependencies
Same as before. Node.js: You won't get far without it. dig: command-line utility, usually included by default on Linux/macOS. On Windows, install it via WSL or use a version of BIND that includes dig.

## What's next?
### Features
Not sure. I looked at adding a config file. That's probably a nice idea. Or at least a version that's pretty much identical but allows you to set the domains, arguments, and subdomains etc. in the file, so it's a click and run to copy all your DNS data at once. That said, DNS data doesn't change often, so I'm not sure I want to encourage pointless backups. I'd like to have some people test it so I can be sure I'm catching more of the important subdomain cases. In an ideal world, I'd subset the subdomains even further to minimise unnecessary checks, though that's probably a low-return situation.

### A web UI version
I'll reconsider this option after improving general function and improving customisation options. It probably is possible to do this in a way that avoids security issues. As per the licence, anyone is welcome to use the code on their own systems for their own projects. Public webapp use is a right I reserve for me, though access would be provided free of charge. Those in the security and sustainability community can talk to me about possible exceptions.

----

# Updates in this version, and why V1 is still available
This version can now reliably pick up important subdomain-level DNS records for a wide variety of use cases. However, my own ability to simply research common services online and check against my own domains is limited. I'd very much welcome testing - please let me know if there's a record it's missing, or some sort of quirk. V1 is still available simply because I am not totally finished creating and testing V2.

## Custom subdomain support
Add subdomains to your request with the percentage sign and separate them by commas. This ensures domains that contain a hyphen are still processed correctly. These subdomains will be tested the same way as main domains, in full. This is a good way to include subdomains you know about and need to remember, and any custom subdomain.

## Multiple domains now separated by spaces
That was a logical step.

## Probe all standard subdomain records
This was a lot of work. I deliberately omitted anything that someone may not automatically choose to make public - these can be added manually as custom subdomains anyway. But I also wanted to maximise efficiency, not checking for records that were extremely unlikely to exist.

## Caveat: Wildcards
This version has a wildcard checker, at least for A and AAAA records. Where a wildcard is found and the subdomain gives the same result as the wildcard result, it will NOT be included unless specifically included at the command line. In testing, I did find a wildcard text record, but I think this is uncommon. Let me know.

----

# Set up
As before. It's a command-line interface. Just download it and save it wherever you want to run it 

## Customise the output directory if desired
It defaults to a subdirectory called dns-output.

## Change: Subdomains
See above. You can now test custom subdomains like this: node advanceddnscheckerv2.js%sub1,sub2. Or you can test just the standard subdomain records by adding the -x argument. You can do both at the same time.

----

# To use
Navigate to the file, then use it like this:

`node advanceddnsv2.js example.com`

In the default setup, it will gather all known DNS records on the main domain and save the output to a subdirectory called dns-output in an appropriately named text file.

You can use arguments to reduce the scope (overview, -o), print the output just to the console (print, -p), expand the scope to an extensive standardised list of subdomains (extended, -x), switch to using the authoritative nameservers (nameserver, -ns), or output to both the console and the drive (print and save, -ps).

## Multiple domains
`node advanceddnsv2.js example.com example.de`
CHANGED: You can include multiple domains at once. Separate them with a space.

## Custom subdomains
`node advanceddnsv2.js example.com%sub1,sub2 example.de%sub3,sub4`
CHANGED: You can include custom subdomains, which will be tested against the same records as the main domain. Add directly after the domain with a % in front, and separate them with a comma without a space. Use this for any important subdomains unlikely to show up in a general probe.

## Arguments
### -o or --overview	
This pulls a trimmed-down list of key records of interest when generally inspecting the data, e.g. for sustainability or security purposes.

### -x or --extended	
This pulls an extensive list of preset, commonly used subdomain and subdomain-like records. This is probably the exciting part.

### -ns or --nameserver
Switch to pulling the results from the authoritative nameserver defined in the NS record.

### -ps or --printandsave
Outputs the results to the console BUT ALSO saves the output to disk as usual.

### A combination
`node advanceddns.js example.com,example.de -o -p -s`
This would fetch the overview DNS records from example.com, output them to the console, and save them to disk.

----

## Full records checked on main domains and custom subdomain entries:
    'A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'DNSKEY', 'DS', 'CDNSKEY', 'CDS', 'CAA', 'LOC', 'NAPTR', 'SMIMEA', 'SSHFP', 'TLSA', 'SRV', 'CERT', 'NSEC', 'NSEC3PARAM', 'RRSIG', 'LOC', 'TXT'

## Overview records:
CHANGED, reduced to: `'A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'`

## Subdomains
These are organised in a complicated way to maximise efficiency, performance, and accuracy. Too many checks and it'd take a long time, and generate bad data. Please excuse the formatting - it's pretty much a straight copy from the arrays.
Each array is a list of records probed for, and the contents are the subdomains (or subdomain-like entries) we are looking for in the DNS. If you spot a mistake, please submit it as an issue, email me, or whatever else. I'll fix it. It's not unlikely! Equally, if it's an omission, let me know. I won't want to or be able to accommodate every use case, but there are a lot of services out there and it's hard to know what the up-to-date info is if I don't use them myself. Appreciated

  `'A,AAAA,CNAME,TXT': 'www', 'cdn', 'static', 'assets', 'media', 'img', 'js', 'css', 'fonts', 'calendar', 'drive', 'docs'
  'A,AAAA': 'crm', 'erp', 'shop', 'store', 'uat', 'pages', 'ipv4', 'ipv6', 'imap', 'pop', '_sip'
  'A,CNAME,SRV': 'webmail', 'autodiscover'
  'A,AAAA,MX,TXT,SPF,DKIM,DMARC': 'mail'
  'A,AAAA,TXT,SPF,DKIM,DMARC': 'smtp',
  'A,AAAA,CNAME,SRV,TXT': 'api', 'gateway', 'vault', '_lyncdiscover', '_enterpriseregistration'
  'TXT': '_google._domainkey', '_dmarc', 'selector1_domainkey', 'selector2_domainkey', 'zohoverify', '_domainconnect', '_atproto', 'default_bimi', '_acme-challenge', 'm1._domainkey','mg', '_mta-sts'
  'CNAME': '_google._domainkey', '_zmverify',  '_amazonses', '_mailgun', 'fm1._domainkey', 'fm2._domainkey','fm3._domainkey', 's1._domainkey', 's2._domainkey', 'mail._domainkey', 'mailo._domainkey', 'mesmtp._domainkey', '_tiktok', 'funnels', 'enterpriseenrollment', 'enterpriseregistration', 'lyncdiscover', 'autodiscover'
  'SRV': '_imaps._tcp', '_pop3s._tcp', '_sip._tls', '_sipfederationtls._tcp', '_autodiscover._tcp', '_submission._tcp', '_submissions._tcp', '_imap._tcp', '_imaps._tcp', '_pop3._tcp', '_pop3s._tcp', '_jmap._tcp', '_smtps._tcp', '_autodiscover._tcp', '_tls', '_cf.tls', '_carddav._tcp', '_carddavs._tcp', '_caldav._tcp', '_caldavs._tcp'`
  
----

## NOTE:
Version 2 with subdomain support coming soon. I'm testing it. It works. I'm just weighing up the impact of different approaches and the most efficient way to avoid wildcard results. It can be done, it's just a matter of defining the best approach. I was thinking of including a separate option to query authoritative nameservers, but since these, too, sometimes have wildcards, the benefit is not guaranteed. Therefore, I'm more likely to just update the original version and integrate the check developed for that approach into the main release. On the other hand... I'm really excited by how much people like even the first version. :) This second version delivers absolutely everything. I just need to make it work better with nameservers that use wildcards. My proposed solution is to simply include a warning if wildcard entries are detected, as it makes it impossible to detect individual A or AAAA subdomain records.

### Update on the above after adding V2
Well done, past me. It looks like I promised what I actually went on to deliver. Keeping the old instructions below for anyone wanting to stick with the old version.


# Advanced DNS checker VERSION 1
A CLI node.JS tool for fetching and logging all DNS records for backup and inspection.
## Dependencies
Node.js: You won't get far without it.
dig: command-line utility, usually included by default on Linux/macOS. On Windows, install it via WSL or use a version of BIND that includes dig.

----

# Set up
It's a command-line interface. Just download it and save it wherever you want to run it 

## Customise the output directory if desired
It defaults to a subdirectory called dns-output.

## Caveat: Subdomains
Subdomain records currently aren't covered at all. I'll soon add support for common subdomain formats, but less usual ones will take more work.

----

# To use
Navigate to the file, then use it like this:

`node advanceddns.js example.com`

In the default setup, it will gather all known DNS records and save the output to a subdirectory called dns-output in an appropriately named text file.

You can use arguments to reduce the scope, print the output just to the console, or output to both the console and the drive.

## Multiple domains
`node advanceddns.js example.com,example.de`
You can include multiple domains at once. Separate them with a comma and nothing else.

## Arguments
### -o or --overview	
This pulls a trimmed-down list of key records of interest when generally inspecting the data, e.g. for sustainability or security purposes.

### -p or --print	
Outputs the results to the console instead of just saving a file.

### -s or --save
Saves the results to a timestamped .txt file (this is default behaviour).

### A combination
`node advanceddns.js example.com,example.de -o -p -s`
This would fetch the overview DNS records from example.com, output them to the console, and save them to disk.

----

## The full records
`'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR', 'SOA', 'CAA', 'AFSDB', 'APL', 'CDNSKEY', 'CDS', 'CERT', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'DNSKEY', 'DS', 'HINFO', 'HIP', 'IPSECKEY', 'IXFR', 'KEY', 'KX', 'LOC', 'NAPTR', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'OPT', 'RP', 'RRSIG', 'SIG', 'SMIMEA', 'SSHFP', 'TA', 'TKEY', 'TLSA', 'TSIG', 'URI', 'ZONEMD'`

## The overview records
`'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'DNSKEY', 'DS', 'SSHFP'`

## More?
Happy to add more. Any that don't exist aren't output in the file, anyway, so it doesn't hurt a lot to add and check for them.

----

## Why I made it
I genuinely couldn't find anything that scraped every single useful or even essential DNS record in one go, with the option to save it to an appropriately named file for backup. Most that did exist relied only on the tools available with NSLookup, too. It feels like an essential backup, really. It's also a lot easier to copy between text files when migrating between sites. Then I noticed it was interesting to see what other websites were doing.

## Ideal use case
Backups. Migrations. General peace of mind.

## Interesting use case
Nosing at the third-party usage of big companies and government organisations. Spotting sustainability and security gaps.

---

## Special licence terms
See the notes on the licence tab. Commercial use by companies to improve their own websites is fine. Reselling or redistributing without credit is not. Where there is ambiguity here, the licence notes take precedent.
