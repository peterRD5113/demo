import os
import re

files = [
    'desktop/src/main/ipc/handlers/authHandlers.ts',
    'desktop/src/main/ipc/handlers/documentHandlers.ts',
    'desktop/src/main/ipc/handlers/projectHandlers.ts',
    'desktop/src/main/ipc/handlers/riskHandlers.ts',
    'desktop/src/main/middleware/authMiddleware.ts'
]

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 替換導入路徑
        if 'handlers' in file_path:
            content = content.replace("from '@main/services'", "from '../../services'")
        else:  # middleware
            content = content.replace("from '@main/services'", "from '../services'")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'Fixed: {file_path}')
    else:
        print(f'Not found: {file_path}')
