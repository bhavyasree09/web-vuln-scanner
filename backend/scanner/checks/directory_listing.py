DIRECTORY_PATHS = [
    '/admin/', '/administrator/', '/backup/', '/uploads/', '/files/',
    '/logs/', '/log/', '/tmp/', '/temp/', '/test/', '/dev/',
    '/old/', '/archive/', '/config/', '/configs/', '/db/', '/database/',
    '/images/', '/static/', '/assets/', '/includes/', '/src/',
]

LISTING_INDICATORS = [
    'index of /', 'directory listing', 'parent directory',
    '[dir]', '[to parent directory]', 'last modified',
]

def check_directory_listing(target_url, urls, session):
    vulnerabilities = []
    seen = set()

    from urllib.parse import urlparse, urljoin
    base = f"{urlparse(target_url).scheme}://{urlparse(target_url).netloc}"

    for path in DIRECTORY_PATHS:
        test_url = urljoin(base, path)
        if test_url in seen:
            continue
        seen.add(test_url)

        try:
            resp = session.get(test_url, timeout=6)
            if resp.status_code == 200:
                resp_lower = resp.text.lower()
                for indicator in LISTING_INDICATORS:
                    if indicator in resp_lower:
                        vulnerabilities.append({
                            'vuln_type': 'directory_listing',
                            'severity': 'medium',
                            'title': f'Directory Listing Enabled: {path}',
                            'description': f'The web server has directory listing enabled at "{test_url}". This exposes the file structure and potentially sensitive files to attackers.',
                            'url': test_url,
                            'evidence': f'Directory listing indicator found: "{indicator}" in response (HTTP {resp.status_code})',
                            'recommendation': 'Disable directory listing in your web server configuration (Options -Indexes in Apache, autoindex off in Nginx). Remove sensitive directories from web root.'
                        })
                        break
        except Exception:
            continue

    return vulnerabilities
