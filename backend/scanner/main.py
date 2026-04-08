import sys
import json
import argparse
import time
from urllib.parse import urlparse

from crawler import Crawler
from checks.headers import check_headers
from checks.cookies import check_cookies
from checks.sqli import check_sqli
from checks.xss import check_xss
from checks.csrf import check_csrf
from checks.open_redirect import check_open_redirect
from checks.directory_listing import check_directory_listing
from checks.sensitive_files import check_sensitive_files
from checks.clickjacking import check_clickjacking
from owasp_mapper import map_to_owasp

def emit(obj):
    """Print a JSON line to stdout (NDJSON)."""
    print(json.dumps(obj), flush=True)

def emit_progress(progress, message, urls_crawled=0):
    emit({"type": "progress", "progress": progress, "message": message, "urls_crawled": urls_crawled})

def emit_vulnerability(vuln):
    owasp = map_to_owasp(vuln['vuln_type'])
    vuln['owasp_category'] = owasp['category']
    vuln['owasp_id'] = owasp['id']
    emit({"type": "vulnerability", **vuln})

def main():
    parser = argparse.ArgumentParser(description='Web Vulnerability Scanner')
    parser.add_argument('--url', required=True, help='Target URL to scan')
    parser.add_argument('--scan-id', required=True, help='Scan ID from backend')
    args = parser.parse_args()

    target_url = args.url
    if not target_url.startswith(('http://', 'https://')):
        target_url = 'http://' + target_url

    emit_progress(2, f'Starting scan for {target_url}')

    # Phase 1: Crawl
    emit_progress(5, 'Crawling website...')
    crawler = Crawler(target_url, max_urls=30, timeout=8)
    urls = crawler.crawl()
    emit_progress(20, f'Crawled {len(urls)} URLs', urls_crawled=len(urls))

    all_vulns = []
    checks = [
        ('Security Headers', check_headers, 25, 35),
        ('Cookie Security', check_cookies, 35, 42),
        ('Clickjacking', check_clickjacking, 42, 48),
        ('Sensitive Files', check_sensitive_files, 48, 55),
        ('Directory Listing', check_directory_listing, 55, 62),
        ('Open Redirect', check_open_redirect, 62, 68),
        ('CSRF Detection', check_csrf, 68, 75),
        ('XSS Detection', check_xss, 75, 87),
        ('SQL Injection', check_sqli, 87, 97),
    ]

    for check_name, check_fn, prog_start, prog_end in checks:
        emit_progress(prog_start, f'Running {check_name} checks...')
        try:
            vulns = check_fn(target_url, urls, crawler.session)
            for v in vulns:
                emit_vulnerability(v)
                all_vulns.append(v)
        except Exception as e:
            emit({"type": "progress", "progress": prog_start, "message": f"{check_name} check failed: {str(e)}", "urls_crawled": len(urls)})
        emit_progress(prog_end, f'{check_name} complete. Found {len([v for v in all_vulns])} issues so far.')

    # Summary
    summary = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0, 'total': len(all_vulns)}
    owasp_mapping = {}
    for v in all_vulns:
        sev = v.get('severity', 'info')
        summary[sev] = summary.get(sev, 0) + 1
        owasp_id = map_to_owasp(v['vuln_type'])['id']
        if owasp_id not in owasp_mapping:
            owasp_mapping[owasp_id] = []
        owasp_mapping[owasp_id].append(v['vuln_type'])

    emit({"type": "summary", "summary": summary, "owasp_mapping": owasp_mapping})
    emit_progress(100, f'Scan complete. Found {len(all_vulns)} vulnerabilities.', urls_crawled=len(urls))

if __name__ == '__main__':
    main()
