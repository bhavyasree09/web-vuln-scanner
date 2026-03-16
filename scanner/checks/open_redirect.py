REDIRECT_PARAMS = ['next', 'url', 'redirect', 'redirect_to', 'return', 'return_url',
                   'returnurl', 'goto', 'dest', 'destination', 'redir', 'r', 'target',
                   'link', 'forward', 'continue', 'back']

EXTERNAL_URL = 'http://evil.example.com'

def check_open_redirect(target_url, urls, session):
    vulnerabilities = []
    seen = set()

    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    base_domain = urlparse(target_url).netloc

    check_urls = [target_url] + list(urls)[:20]

    for url in check_urls:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        for param in list(params.keys()):
            if param.lower() not in REDIRECT_PARAMS:
                continue

            test_params = {k: v[0] for k, v in params.items()}
            test_params[param] = EXTERNAL_URL
            test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

            try:
                resp = session.get(test_url, timeout=8, allow_redirects=False)
                location = resp.headers.get('Location', '')
                if location and 'evil.example.com' in location:
                    key = url + param
                    if key not in seen:
                        seen.add(key)
                        vulnerabilities.append({
                            'vuln_type': 'open_redirect',
                            'severity': 'medium',
                            'title': 'Open Redirect Vulnerability',
                            'description': f'The parameter "{param}" at {url} can redirect users to arbitrary external URLs. Attackers can use this for phishing attacks.',
                            'url': test_url,
                            'evidence': f'Redirect to {location} observed when {param}={EXTERNAL_URL}',
                            'recommendation': 'Validate redirect destinations against an allowlist of trusted URLs. Never redirect to URLs supplied directly by users.'
                        })
            except Exception:
                continue

        # Also check for redirect params not in query string
        for redir_param in REDIRECT_PARAMS:
            if redir_param not in params:
                try:
                    parsed2 = urlparse(url)
                    existing = parse_qs(parsed2.query)
                    existing[redir_param] = EXTERNAL_URL
                    test_url2 = urlunparse(parsed2._replace(query=urlencode({k: v if isinstance(v, str) else v[0] for k, v in existing.items()})))
                    resp = session.get(test_url2, timeout=5, allow_redirects=False)
                    location = resp.headers.get('Location', '')
                    if 'evil.example.com' in location:
                        key = url + redir_param + 'probe'
                        if key not in seen:
                            seen.add(key)
                            vulnerabilities.append({
                                'vuln_type': 'open_redirect',
                                'severity': 'medium',
                                'title': 'Open Redirect via Injected Parameter',
                                'description': f'Injecting a "{redir_param}" parameter at {url} causes an open redirect.',
                                'url': test_url2,
                                'evidence': f'Location header: {location}',
                                'recommendation': 'Validate and whitelist all redirect targets. Do not trust user-supplied redirect URLs.'
                            })
                except Exception:
                    continue

    return vulnerabilities
