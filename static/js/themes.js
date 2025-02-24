const ChessThemes = {
    themes: {
        default: {
            name: 'Royal Gold',
            light: '#F0D9B5',
            dark: '#B58863',
            accent: '#FFD700'
        },
        coral: {
            name: 'Coral Reef',
            light: '#84DCC6',
            dark: '#4B778D',
            accent: '#FF8A5B'
        },
        emerald: {
            name: 'Emerald Forest',
            light: '#C8E6C9',
            dark: '#2E7D32',
            accent: '#81C784'
        },
        sunset: {
            name: 'Desert Sunset',
            light: '#FFE0B2',
            dark: '#FF7043',
            accent: '#FFB74D'
        },
        galaxy: {
            name: 'Galaxy Night',
            light: '#B39DDB',
            dark: '#311B92',
            accent: '#7C4DFF'
        },
        ruby: {
            name: 'Ruby Dynasty',
            light: '#FFCDD2',
            dark: '#C62828',
            accent: '#EF5350'
        },
        ocean: {
            name: 'Deep Ocean',
            light: '#B3E5FC',
            dark: '#0277BD',
            accent: '#4FC3F7'
        },
        neon: {
            name: 'Neon Pulse',
            light: '#E1BEE7',
            dark: '#6A1B9A',
            accent: '#E040FB'
        }
    },

    getThemeNames() {
        return Object.keys(this.themes);
    },

    getTheme(name) {
        return this.themes[name] || this.themes.default;
    }
};