# Hollywood Animal Calculator

<img width="500" height="500" alt="callon84 github io_Hollywood-Animal-Calculator_" src="https://github.com/user-attachments/assets/b37c7be5-765b-414a-be0e-97bdeffecf09" />

A web tool for [Hollywood Animal](https://store.steampowered.com/app/2886410/Hollywood_Animal/) that helps players generate scripts, analyze tag synergies, and find the best advertisers for their movies.

## Credits

- **Original Tool:** [callon84](https://github.com/callon84/Hollywood-Animal-Calculator)
- **Distribution Calculator Math:** aalbertinib's Hollywood Animal Master
- **React Refactor:** [chmccc](https://github.com/chmccc)

## Features

### Synergy Calculator
- Analyze compatibility between story elements (genres, settings, themes, characters)
- Visual Tag Browser with collapsible categories for easy selection
- Real-time score delta previews showing how each tag affects Art/Commercial scores
- Pin and save script configurations for later reference

### Script Generator
- Generate optimized script combinations based on target scores
- Lock specific tags you want to include
- Exclude tags you don't own or want to avoid
- Persistent exclusions saved to browser storage

### Advertisers & Distribution
- Find the best advertisers for your movie's target demographics
- Holiday release timing recommendations
- Distribution calculator for box office estimates
- Seamless transfer from Synergy/Generator tabs

### Save File Integration
- Import your Hollywood Animal save file to filter tags to only those you've researched
- Supports both file upload and paste options
- Data stays local in your browser - nothing uploaded to servers

### Quality of Life
- Multi-language support (English, Spanish, French, German, Japanese, Chinese, Russian, Ukrainian, Belarusian, Portuguese)
- Dual input modes: dropdown selectors or visual Tag Browser
- Export/import pinned scripts as JSON
- Modern, responsive UI

## Usage

Visit the live tool: **https://chmccc.github.io/Hollywood-Animal-Calculator/**

> Tip: Use `Ctrl + F5` to hard refresh and ensure you have the latest version.

### Importing Your Save File

Your Hollywood Animal save file location:
- **Windows:** `C:\Users\<username>\AppData\LocalLow\Weappy\Hollywood Animal\Saves\Profiles\0\save.json`

## Development

This project uses React + Vite.

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This is a fork of the original Hollywood Animal Calculator. Per GPL-3.0 requirements, this derivative work maintains the same license and includes prominent notice of modifications.
