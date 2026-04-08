SECURITY_HEADERS = {
    'Content-Security-Policy': {
        'severity': 'high',
        'title': 'Missing Content-Security-Policy Header',
        'description': 'The Content-Security-Policy (CSP) header is missing. CSP helps prevent XSS and data injection attacks by specifying which content sources are trusted.',
        'recommendation': 'Implement a CSP header: Content-Security-Policy: default-src \'self\'; script-src \'self\'',
        'vuln_type': 'missing_csp'
    },
    'Strict-Transport-Security': {
        'severity': 'high',
        'title': 'Missing HTTP Strict-Transport-Security (HSTS) Header',
        'description': 'HSTS is not enabled. Without HSTS, the site is vulnerable to SSL stripping and protocol downgrade attacks.',
        'recommendation': 'Add the header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        'vuln_type': 'missing_hsts'
    },
    'X-Frame-Options': {
        'severity': 'medium',
        'title': 'Missing X-Frame-Options Header',
        'description': 'The X-Frame-Options header is missing, making the site potentially vulnerable to clickjacking attacks.',
        'recommendation': 'Add: X-Frame-Options: DENY or X-Frame-Options: SAMEORIGIN',
        'vuln_type': 'missing_xfo'
    },
    'X-Content-Type-Options': {
        'severity': 'medium',
        'title': 'Missing X-Content-Type-Options Header',
        'description': 'Without this header, browsers may MIME-sniff responses, leading to security risks.',
        'recommendation': 'Add: X-Content-Type-Options: nosniff',
        'vuln_type': 'missing_xcto'
    },
    'Referrer-Policy': {
        'severity': 'low',
        'title': 'Missing Referrer-Policy Header',
        'description': 'Without a Referrer-Policy, sensitive URL parameters may be leaked in the Referer header.',
        'recommendation': 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        'vuln_type': 'missing_referrer_policy'
    },
    'Permissions-Policy': {
        'severity': 'low',
        'title': 'Missing Permissions-Policy Header',
        'description': 'The Permissions-Policy header is missing. This header controls browser features and APIs available to pages.',
        'recommendation': 'Add: Permissions-Policy: geolocation=(), microphone=(), camera=()',
        'vuln_type': 'missing_permissions_policy'
    }
}

def check_headers(target_url, urls, session):
    vulnerabilities = []
    try:
        resp = session.get(target_url, timeout=8)
        headers = {k.lower(): v for k, v in resp.headers.items()}

        for header_name, config in SECURITY_HEADERS.items():
            if header_name.lower() not in headers:
                vulnerabilities.append({
                    'vuln_type': config['vuln_type'],
                    'severity': config['severity'],
                    'title': config['title'],
                    'description': config['description'],
                    'url': target_url,
                    'evidence': f'Header "{header_name}" not present in response',
                    'recommendation': config['recommendation']
                })
    except Exception as e:
        pass

    return vulnerabilities
