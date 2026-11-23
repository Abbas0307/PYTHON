import os

search_terms = ['localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'axios', 'sendBeacon', 'console.log', 'analytics', 'telemetry']

found = {term: [] for term in search_terms}

for root, _, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.js', '.mjs', '.html')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                for line_no, line in enumerate(fh, 1):
                    for term in search_terms:
                        if term in line:
                            found[term].append((path, line_no, line.strip()))

for term, occurrences in found.items():
    print(f'=== Search: "{term}" ({len(occurrences)} matches) ===')
    for p, lno, text in occurrences:
        print(f'  {p}:{lno} -> {text}')
