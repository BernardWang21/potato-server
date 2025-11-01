import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**10. .gitignore**
```
# Dependencies
node_modules/

# Production
dist/
build/

# Logs
*.log
npm-debug.log*

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
