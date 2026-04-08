XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
    "'><img src=x onerror=alert(1)>",
    '<svg onload=alert(1)>',
]

XSS_INDICATORS = [
    '<script>alert("xss")</script>',
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
    "<svg onload=alert(1)>",
]

def check_xss(target_url, urls, session):
    vulnerabilities = []
    seen = set()

    # Get forms
    try:
        from crawler import Crawler
        crawler = Crawler(target_url, max_urls=5)
        crawler.crawl()
        forms = crawler.forms
    except Exception:
        forms = []

    for form in forms[:10]:
        action = form.get('action', target_url)
        method = form.get('method', 'get')
        inputs = form.get('inputs', [])
        if not inputs:
            continue

        for payload in XSS_PAYLOADS[:3]:
            form_data = {}
            for inp in inputs:
                if inp['type'] not in ('submit', 'hidden'):
                    form_data[inp['name']] = payload
                else:
                    form_data[inp['name']] = inp.get('value', '')

            try:
                if method == 'post':
                    resp = session.post(action, data=form_data, timeout=8)
                else:
                    resp = session.get(action, params=form_data, timeout=8)

                for indicator in XSS_INDICATORS:
                    if indicator.lower() in resp.text.lower():
                        key = action + payload[:20]
                        if key not in seen:
                            seen.add(key)
                            vulnerabilities.append({
                                'vuln_type': 'xss',
                                'severity': 'high',
                                'title': 'Cross-Site Scripting (XSS) Vulnerability',
                                'description': f'A reflected XSS vulnerability was found in a form at {action}. User-supplied input is reflected in the response without proper encoding.',
                                'url': action,
                                'evidence': f'Payload "{payload[:80]}" was reflected in response',
                                'recommendation': 'Encode all user-supplied output using context-appropriate encoding. Implement a strict Content-Security-Policy. Use frameworks that auto-escape output.'
                            })
                        break
            except Exception:
                continue

    # Test URL parameters
    for url in urls[:15]:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        if not params:
            continue

        for param in list(params.keys())[:3]:
            for payload in XSS_PAYLOADS[:2]:
                test_params = {k: v[0] for k, v in params.items()}
                test_params[param] = payload
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

                try:
                    resp = session.get(test_url, timeout=8)
                    for indicator in XSS_INDICATORS:
                        if indicator.lower() in resp.text.lower():
                            key = url + param
                            if key not in seen:
                                seen.add(key)
                                vulnerabilities.append({
                                    'vuln_type': 'xss',
                                    'severity': 'high',
                                    'title': 'Reflected XSS in URL Parameter',
                                    'description': f'XSS payload reflected via parameter "{param}" at {url}.',
                                    'url': test_url,
                                    'evidence': f'Payload "{payload[:80]}" reflected in response',
                                    'recommendation': 'Apply output encoding to all URL parameters before rendering in HTML.'
                                })
                            break
                except Exception:
                    continue

    return vulnerabilities
