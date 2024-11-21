# ClaudePS Extension

A Chrome extension that enhances interaction with the Claude AI interface (claude.ai). This extension provides advanced features for managing conversations, executing scripts, and improving the overall Claude experience.

## Features

- Enhanced Claude.ai interface with custom styling
- Script execution and management capabilities
- Conversation analysis and retrieval
- Document download and management
- Project search functionality
- Customizable settings through options page
- Command execution system with aliases
- Floating window interface
- Real-time status management

## Installation

### For Users

#### Installing from GitHub Release

1. Go to the [Releases](https://github.com/yourusername/claude-extension/releases) page
2. Download the latest `claude-extension-v*.zip` file
3. Unzip the downloaded file
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right corner
6. Click "Load unpacked" and select the unzipped directory

Note: When installing from GitHub, Chrome may warn about developer mode extensions. This is normal for extensions not distributed through the Chrome Web Store.

#### Updating the Extension

1. Return to the [Releases](https://github.com/yourusername/claude-extension/releases) page periodically
2. If a new version is available, download and install it following the same steps
3. After installing a new version, you may need to reload the extension or restart Chrome

### For Developers

1. Clone the repository:

```bash
git clone https://github.com/yourusername/claude-extension.git
cd claude-extension
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
# For production build
npm run build

# For development build with debugging
npm run build:debug

# For development with watch mode
npm run watch:debug
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory in the project folder

## Development

The project uses TypeScript and is built with Webpack. Key scripts:

- `npm run build`: Production build
- `npm run build:debug`: Development build with source maps
- `npm run watch:debug`: Development build with watch mode
- `npm run analyze`: TypeScript analysis for specific files
- `npm run package`: Create distribution package

## Distribution

### Creating a New Release

1. Update version numbers:

   ```bash
   # In src/manifest.json
   {
     "version": "1.0.x"
   }

   # In package.json
   {
     "version": "1.0.x"
   }
   ```

2. Create the distribution package:

   ```bash
   npm run package
   ```

   This will:

   - Clean the dist directory
   - Create a production build
   - Generate `claude-extension-v1.0.x.zip` in the project root
   - Extract the version number from manifest.json
   - Display instructions for creating a GitHub release

3. Create and push a git tag:

   ```bash
   git tag v1.0.x
   git push origin v1.0.x
   ```

4. Create a GitHub Release:
   - Go to your repository's Releases page
   - Click "Draft a new release"
   - Select the tag you just pushed
   - Title the release (e.g., "v1.0.x")
   - Add release notes describing the changes
   - Upload the generated `claude-extension-v1.0.x.zip` file
   - Publish the release

### Future Enhancements

Consider implementing these features to improve the update experience:

1. Add a version check feature that periodically checks the GitHub Releases API
2. Implement in-extension notifications for new versions
3. Add one-click update functionality from within the extension
4. Include a changelog viewer in the extension options

## Project Structure

- `src/`: Source code
  - `services/`: Core service implementations
  - `ui/components/`: UI components
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `tests/`: Test files
- `lib/`: Third-party libraries
- `dist/`: Built extension files
- `scripts/`: Build and distribution scripts

## License

MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
