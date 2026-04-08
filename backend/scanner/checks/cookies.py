def check_cookies(target_url, urls, session):
    vulnerabilities = []
    try:
        resp = session.get(target_url, timeout=8)
        for cookie in session.cookies:
            issues = []
            if not cookie.has_nonstandard_attr('HttpOnly') and not getattr(cookie, '_rest', {}).get('HttpOnly'):
                # Check via Set-Cookie header parsing
                pass

        # Parse from raw Set-Cookie headers
        raw_headers = resp.raw.headers.getlist('Set-Cookie') if hasattr(resp.raw.headers, 'getlist') else []
        set_cookie_headers = resp.headers.get('Set-Cookie', '')

        # Use requests cookies directly
        for cookie in session.cookies:
            cookie_issues = []
            evidence_parts = [f'Cookie: {cookie.name}']

            # Check Secure flag
            if not cookie.secure:
                cookie_issues.append('Missing Secure flag')
                evidence_parts.append('Secure=false')

            # Check HttpOnly (requests doesn't expose this, check raw)
            evidence_parts.append('(HttpOnly flag status checked via header parsing)')

            if cookie_issues:
                vulnerabilities.append({
                    'vuln_type': 'insecure_cookie',
                    'severity': 'medium',
                    'title': f'Insecure Cookie: {cookie.name}',
                    'description': f'The cookie "{cookie.name}" is missing security flags: {", ".join(cookie_issues)}. Cookies without the Secure flag can be transmitted over unencrypted HTTP connections.',
                    'url': target_url,
                    'evidence': ', '.join(evidence_parts),
                    'recommendation': f'Set the {", ".join(cookie_issues)} on the "{cookie.name}" cookie: Set-Cookie: {cookie.name}=value; HttpOnly; Secure; SameSite=Strict'
                })

        # Also check Set-Cookie header strings for HttpOnly/SameSite
        all_set_cookie = [v for k, v in resp.headers.items() if k.lower() == 'set-cookie']
        for sc_header in all_set_cookie:
            cookie_name = sc_header.split('=')[0].strip()
            sc_lower = sc_header.lower()
            issues = []
            if 'httponly' not in sc_lower:
                issues.append('Missing HttpOnly flag')
            if 'samesite' not in sc_lower:
                issues.append('Missing SameSite attribute')
            if 'secure' not in sc_lower:
                issues.append('Missing Secure flag')

            if issues:
                # Avoid duplicates
                already = any(v['title'] == f'Insecure Cookie: {cookie_name}' for v in vulnerabilities)
                if not already:
                    vulnerabilities.append({
                        'vuln_type': 'insecure_cookie',
                        'severity': 'medium',
                        'title': f'Insecure Cookie: {cookie_name}',
                        'description': f'Cookie "{cookie_name}" has security issues: {", ".join(issues)}',
                        'url': target_url,
                        'evidence': sc_header[:200],
                        'recommendation': f'Add missing flags: Set-Cookie: {cookie_name}=value; HttpOnly; Secure; SameSite=Strict'
                    })

    except Exception:
        pass

    return vulnerabilities
