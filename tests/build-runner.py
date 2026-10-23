import os, re
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'index.html')).read()
src = src.replace('src="src/', 'src="../src/').replace('href="styles/', 'href="../styles/')
for name, script in [('runner.html', 'suite.js'), ('balance.html', 'balance.js')]:
    out = src.replace('</body>', f'<script>localStorage.clear();</script>\n  <script src="{script}"></script>\n</body>')
    out = out.replace('<script src="../src/core/constants.js"></script>', '<script>localStorage.clear(); sessionStorage.setItem("meadowvale_play", "test-world");</script>\n  <script src="../src/core/constants.js"></script>', 1)
    open(os.path.join(here, name), 'w').write(out)
print('runner.html and balance.html generated')
