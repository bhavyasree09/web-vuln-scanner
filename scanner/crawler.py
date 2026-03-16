import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import time

class Crawler:
    def __init__(self, base_url, max_urls=30, timeout=8, delay=0.3):
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc
        self.max_urls = max_urls
        self.timeout = timeout
        self.delay = delay
        self.visited = set()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WebVulnScanner/1.0 (Security Research Tool)'
        })
        self.session.verify = False
        self.forms = []
        self.links = []

    def is_internal(self, url):
        parsed = urlparse(url)
        return parsed.netloc == '' or parsed.netloc == self.base_domain

    def normalize_url(self, url, base):
        url = url.strip()
        if url.startswith(('#', 'mailto:', 'javascript:', 'tel:')):
            return None
        return urljoin(base, url)

    def crawl(self):
        queue = deque([self.base_url])
        self.visited.add(self.base_url)

        while queue and len(self.visited) < self.max_urls:
            url = queue.popleft()
            try:
                resp = self.session.get(url, timeout=self.timeout, allow_redirects=True)
                content_type = resp.headers.get('Content-Type', '')
                if 'text/html' not in content_type:
                    continue

                soup = BeautifulSoup(resp.text, 'lxml')

                # Collect forms
                for form in soup.find_all('form'):
                    form_data = {
                        'url': url,
                        'action': urljoin(url, form.get('action', '')),
                        'method': form.get('method', 'get').lower(),
                        'inputs': []
                    }
                    for inp in form.find_all(['input', 'textarea', 'select']):
                        input_name = inp.get('name')
                        if input_name:
                            form_data['inputs'].append({
                                'name': input_name,
                                'type': inp.get('type', 'text'),
                                'value': inp.get('value', '')
                            })
                    self.forms.append(form_data)

                # Collect links
                for tag in soup.find_all(['a', 'link'], href=True):
                    href = self.normalize_url(tag['href'], url)
                    if href and self.is_internal(href) and href not in self.visited:
                        self.visited.add(href)
                        queue.append(href)
                        self.links.append(href)

                time.sleep(self.delay)
            except Exception:
                continue

        return list(self.visited)
