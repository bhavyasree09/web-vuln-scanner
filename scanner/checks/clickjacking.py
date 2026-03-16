def check_clickjacking(target_url, urls, session):
    vulnerabilities = []
    try:
        resp = session.get(target_url, timeout=8)
        headers = {k.lower(): v for k, v in resp.headers.items()}

        has_xfo = 'x-frame-options' in headers
        csp = headers.get('content-security-policy', '')
        has_frame_ancestors = 'frame-ancestors' in csp.lower()

        if not has_xfo and not has_frame_ancestors:
            vulnerabilities.append({
                'vuln_type': 'clickjacking',
                'severity': 'medium',
                'title': 'Clickjacking Vulnerability Detected',
                'description': 'The page can be embedded in an iframe on any third-party site. Attackers can use this to trick users into clicking elements on the page without their knowledge (clickjacking).',
                'url': target_url,
                'evidence': 'Neither X-Frame-Options header nor CSP frame-ancestors directive is set.',
                'recommendation': 'Add X-Frame-Options: DENY header, or a CSP header with frame-ancestors \'none\' or frame-ancestors \'self\''
            })
    except Exception:
        pass
    return vulnerabilities
