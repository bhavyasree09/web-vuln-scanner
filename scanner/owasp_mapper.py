OWASP_MAPPING = {
    # Injection
    'sql_injection': {'id': 'A03:2021', 'category': 'Injection'},
    'xss': {'id': 'A03:2021', 'category': 'Injection'},

    # Security Misconfiguration
    'missing_csp': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'missing_hsts': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'missing_xfo': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'missing_xcto': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'missing_referrer_policy': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'missing_permissions_policy': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
    'directory_listing': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},

    # Broken Access Control
    'open_redirect': {'id': 'A01:2021', 'category': 'Broken Access Control'},
    'sensitive_file_exposure': {'id': 'A01:2021', 'category': 'Broken Access Control'},

    # Cryptographic Failures
    'insecure_cookie': {'id': 'A02:2021', 'category': 'Cryptographic Failures'},

    # CSRF
    'csrf': {'id': 'A01:2021', 'category': 'Broken Access Control'},

    # Clickjacking
    'clickjacking': {'id': 'A05:2021', 'category': 'Security Misconfiguration'},
}

def map_to_owasp(vuln_type):
    return OWASP_MAPPING.get(vuln_type, {'id': 'A05:2021', 'category': 'Security Misconfiguration'})
