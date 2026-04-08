SENSITIVE_FILES = [
    ('.env', 'critical', 'Exposed .env File', 'Environment variables file containing secrets, API keys, and credentials.'),
    ('.git/HEAD', 'critical', 'Exposed Git Repository', 'The .git directory is accessible, exposing the entire source code history.'),
    ('.git/config', 'critical', 'Exposed Git Config', 'Git configuration file is publicly accessible.'),
    ('config.php', 'high', 'Exposed PHP Config File', 'PHP configuration may contain database credentials.'),
    ('wp-config.php', 'critical', 'Exposed WordPress Config', 'WordPress config file with database credentials.'),
    ('web.config', 'high', 'Exposed ASP.NET Web Config', 'Web config file may contain connection strings and secrets.'),
    ('database.yml', 'critical', 'Exposed Database Config', 'Database configuration with credentials.'),
    ('backup.sql', 'critical', 'Exposed SQL Backup File', 'SQL database backup accessible publicly.'),
    ('db.sql', 'critical', 'Exposed SQL Database Dump', 'SQL database dump accessible publicly.'),
    ('.htpasswd', 'critical', 'Exposed Password File', 'HTTP authentication password file is accessible.'),
    ('.htaccess', 'medium', 'Exposed .htaccess File', 'Apache configuration file exposed publicly.'),
    ('phpinfo.php', 'high', 'PHP Info Page Exposed', 'PHP configuration details exposed — reveals server info, paths, and settings.'),
    ('server-status', 'medium', 'Apache Server Status Exposed', 'Apache server status page reveals server internals.'),
    ('robots.txt', 'low', 'robots.txt Contains Sensitive Paths', 'robots.txt may reveal hidden paths and admin areas.'),
    ('sitemap.xml', 'info', 'Sitemap Available', 'Sitemap may reveal internal URL structure.'),
    ('.DS_Store', 'medium', 'Exposed .DS_Store File', 'macOS metadata file revealing directory structure.'),
    ('crossdomain.xml', 'medium', 'Overly Permissive crossdomain.xml', 'Misconfigured Flash crossdomain policy.'),
    ('readme.txt', 'low', 'CMS Readme Exposed', 'Readme file may reveal CMS version information.'),
    ('README.md', 'low', 'README Exposed', 'Readme file may reveal technology stack details.'),
    ('.bash_history', 'critical', 'Bash History Exposed', 'Shell history file with commands including possible credentials.'),
]

def check_sensitive_files(target_url, urls, session):
    vulnerabilities = []
    from urllib.parse import urlparse, urljoin

    base = f"{urlparse(target_url).scheme}://{urlparse(target_url).netloc}"

    for filename, severity, title, description in SENSITIVE_FILES:
        test_url = urljoin(base, '/' + filename)
        try:
            resp = session.get(test_url, timeout=6, allow_redirects=True)
            if resp.status_code == 200 and len(resp.text) > 10:
                # For robots.txt check if it contains interesting paths
                evidence = f'HTTP {resp.status_code} — File accessible (size: {len(resp.text)} bytes)'
                if filename == 'robots.txt':
                    disallowed = [line for line in resp.text.split('\n') if 'disallow' in line.lower()]
                    if disallowed:
                        evidence += f' — Disallowed paths: {"; ".join(disallowed[:3])}'
                    else:
                        continue  # robots.txt exists but no interesting disallowed paths

                vulnerabilities.append({
                    'vuln_type': 'sensitive_file_exposure',
                    'severity': severity,
                    'title': title,
                    'description': description,
                    'url': test_url,
                    'evidence': evidence,
                    'recommendation': f'Remove or restrict access to "{filename}". Move sensitive config files outside the web root. Use server configuration to deny access to sensitive file types.'
                })
        except Exception:
            continue

    return vulnerabilities
