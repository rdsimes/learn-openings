# Learn Openings

An interactive chess opening trainer that helps you learn and practice chess openings through visual demonstration and interactive testing.

## 🎯 Features

- **Interactive Chess Board** - Visual demonstration of opening moves
- **Opening Library** - Curated collection of popular chess openings
- **Test Mode** - Practice openings with immediate feedback
- **Speech Integration** - Audio announcements of moves and openings
- **Clean Interface** - Modern, responsive design

## 🚀 Live Demo

Visit the live application: [Learn Openings on GitHub Pages](https://yourusername.github.io/repository-name)

## 📚 Available Openings

- **🇮🇹 Italian Game** - Classical attacking opening
- **🇪🇸 Ruy Lopez** - One of the oldest chess openings
- **👑 Queen's Gambit** - Popular queenside opening
- **🔥 Sicilian Defense** - Sharp defensive system
- **🎭 Vienna Game** - Aggressive kingside development
- **🏰 Jobava London** - Modern system opening

## 🎮 How to Use

1. **Select an Opening** - Click on any opening category to expand it
2. **Choose a Line** - Select a specific variation from the expanded list
3. **Play Opening** - Watch the moves being demonstrated automatically
4. **Test Mode** - Practice the opening moves yourself with guided feedback
5. **Flip Board** - Change perspective between white and black

### Test Mode Features
- ✅ Immediate feedback on correct/incorrect moves
- 📊 Progress tracking ("X moves to go")
- 🎉 Completion celebration
- ❌ Error correction with hints

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, ES6 JavaScript
- **Chess Engine**: Chess.js library
- **Board Visualization**: Chessboard.js
- **Testing**: Vitest framework
- **Architecture**: Modern ES modules with dependency injection

## 🚀 GitHub Pages Deployment

### Prerequisites
- GitHub account
- Git installed locally

### Deployment Steps

1. **Clone/Fork this repository**
   ```bash
   git clone https://github.com/yourusername/learn-openings.git
   cd learn-openings
   ```

2. **Push to your GitHub repository**
   ```bash
   git remote set-url origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select "Deploy from a branch"
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

4. **Access your app**
   - Your app will be available at: `https://yourusername.github.io/your-repo-name`
   - Initial deployment may take a few minutes

### GitHub Pages Compatibility ✅

This application is perfectly suited for GitHub Pages because:
- Static HTML/CSS/JS files only
- No server-side dependencies
- CDN-hosted external libraries
- Modern ES modules support
- No build process required

## 💻 Local Development

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/learn-openings.git
cd learn-openings

# Install dependencies (for testing only)
npm install

# Start local server
npm start

# Run tests
npm test
```

### Project Structure
```
learn-openings/
├── index.html              # Main application page
├── chess.js               # Application entry point
├── openingManager.js      # Opening management logic
├── chessBoardManager.js   # Chess board interactions
├── chessUIManager.js      # UI state management
├── domUtils.js           # DOM manipulation utilities
├── config.js             # Configuration management
├── book/                 # Opening book PGN files
│   ├── italian-game.pgn
│   ├── ruy-lopez.pgn
│   └── ...
├── img/                  # Chess piece images
└── tests/               # Test files
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test openingManager.spec.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Openings

1. Create a new PGN file in the `book/` directory
2. Update `openingBook.js` to include the new opening
3. Add the opening to the HTML menu structure
4. Test the new opening works correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Chess.js](https://github.com/jhlywa/chess.js) - Chess engine library
- [Chessboard.js](https://chessboardjs.com/) - Interactive chess board
- [jQuery](https://jquery.com/) - DOM manipulation
- Chess piece images from Wikimedia Commons

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the existing documentation
- Review the test files for usage examples

---

**Happy learning! ♟️**
