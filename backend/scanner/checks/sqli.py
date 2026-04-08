SQLI_PAYLOADS = [
    ("'", ["sql syntax", "mysql_num_rows", "ora-", "unclosed quotation", "microsoft ole db", "odbc microsoft", "sqlite_", "pg_query", "postgresql"]),
    ("' OR '1'='1", ["sql syntax", "you have an error", "warning: mysql", "unclosed quotation", "ora-"]),
    (" OR 1=1--", ["sql syntax", "you have an error", "warning: mysql", "unclosed quotation"]),
    ("'; DROP TABLE users--", ["sql syntax", "you have an error", "warning: mysql"]),
    ("1' AND '1'='2", ["sql syntax", "you have an error", "warning: mysql"]),
]

def check_sqli(target_url, urls, session):
    vulnerabilities = []
    seen_urls = set()

    # Get forms from crawler
    try:
        from crawler import Crawler
        crawler = Crawler(target_url, max_urls=5)
        crawler.crawl()
        forms = crawler.forms
    except Exception:
        forms = []

    # Test form inputs
    for form in forms[:10]:
        action = form.get('action', target_url)
        method = form.get('method', 'get')
        inputs = form.get('inputs', [])

        if not inputs:
            continue

        for payload, indicators in SQLI_PAYLOADS[:2]:
            form_data = {}
            for inp in inputs:
                form_data[inp['name']] = payload if inp['type'] not in ('submit', 'hidden', 'checkbox') else inp.get('value', '')

            try:
                if method == 'post':
                    resp = session.post(action, data=form_data, timeout=8)
                else:
                    resp = session.get(action, params=form_data, timeout=8)

                resp_lower = resp.text.lower()
                for indicator in indicators:
                    if indicator in resp_lower:
                        key = action + payload
                        if key not in seen_urls:
                            seen_urls.add(key)
                            vulnerabilities.append({
                                'vuln_type': 'sql_injection',
                                'severity': 'critical',
                                'title': 'SQL Injection Vulnerability Detected',
                                'description': f'A SQL injection vulnerability was detected in a form at {action}. The application appears to be including user input directly in SQL queries without proper sanitization.',
                                'url': action,
                                'evidence': f'Payload "{payload}" triggered SQL error indicator: "{indicator}"',
                                'recommendation': 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries. Implement input validation and output encoding.'
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
            for payload, indicators in SQLI_PAYLOADS[:2]:
                test_params = {k: v[0] for k, v in params.items()}
                test_params[param] = payload
                test_url = urlunparse(parsed._replace(query=urlencode(test_params)))

                try:
                    resp = session.get(test_url, timeout=8)
                    resp_lower = resp.text.lower()
                    for indicator in indicators:
                        if indicator in resp_lower:
                            key = url + param
                            if key not in seen_urls:
                                seen_urls.add(key)
                                vulnerabilities.append({
                                    'vuln_type': 'sql_injection',
                                    'severity': 'critical',
                                    'title': 'SQL Injection in URL Parameter',
                                    'description': f'SQL injection detected in URL parameter "{param}" at {url}.',
                                    'url': test_url,
                                    'evidence': f'Payload "{payload}" triggered: "{indicator}"',
                                    'recommendation': 'Sanitize and validate all URL parameters. Use parameterized queries.'
                                })
                            break
                except Exception:
                    continue

    return vulnerabilities
