from bs4 import BeautifulSoup

CSRF_TOKEN_NAMES = [
    'csrf', '_csrf', 'csrf_token', '_token', 'authenticity_token',
    'csrfmiddlewaretoken', 'requestverificationtoken', '_csrftoken',
    'anti_csrf', 'xsrf', 'xsrf_token', '__requestverificationtoken'
]

def has_csrf_token(form):
    """Check if a form has a CSRF token field."""
    for inp in form.get('inputs', []):
        name = inp.get('name', '').lower()
        for token_name in CSRF_TOKEN_NAMES:
            if token_name in name:
                return True
    return False

def check_csrf(target_url, urls, session):
    vulnerabilities = []
    seen = set()

    check_urls = [target_url] + list(urls)[:10]

    for url in check_urls:
        try:
            resp = session.get(url, timeout=8)
            soup = BeautifulSoup(resp.text, 'lxml')

            for form in soup.find_all('form'):
                method = form.get('method', 'get').lower()
                if method != 'post':
                    continue  # CSRF primarily affects state-changing POST forms

                action = form.get('action', url)

                # Build form data representation
                inputs = []
                for inp in form.find_all(['input', 'textarea', 'select']):
                    input_name = inp.get('name')
                    if input_name:
                        inputs.append({'name': input_name, 'type': inp.get('type', 'text'), 'value': inp.get('value', '')})

                form_data = {'url': url, 'action': action, 'method': method, 'inputs': inputs}

                if not has_csrf_token(form_data):
                    key = url + str(action)
                    if key not in seen:
                        seen.add(key)
                        vulnerabilities.append({
                            'vuln_type': 'csrf',
                            'severity': 'high',
                            'title': 'Missing CSRF Protection on Form',
                            'description': f'A POST form at "{url}" does not appear to have a CSRF token. Without CSRF protection, attackers can trick authenticated users into submitting unintended requests.',
                            'url': url,
                            'evidence': f'Form action: {action} — No CSRF token field detected among inputs: {[i["name"] for i in inputs]}',
                            'recommendation': 'Implement CSRF tokens for all state-changing forms. Use frameworks\'s built-in CSRF protection (e.g., Django\'s {% csrf_token %}, Express CSRF middleware).'
                        })
        except Exception:
            continue

    return vulnerabilities
