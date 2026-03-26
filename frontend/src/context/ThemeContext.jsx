import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Locked Theme for Sanatan Swabhiman Samiti
    const [themeMode, setThemeMode] = useState('samiti');
    const [primaryColor, setPrimaryColor] = useState('#E65100'); // Saffron Dark
    const [fontSize, setFontSize] = useState('normal');
    const [fontFamily, setFontFamily] = useState("'Outfit', sans-serif"); // Clean modern font
    const [borderRadius, setBorderRadius] = useState('16px');

    // Apply styles
    useEffect(() => {
        const root = document.documentElement;

        // Force Samiti Theme Class
        document.body.className = 'samiti-theme';

        // Apply CSS Variables
        root.style.setProperty('--primary-blue', primaryColor); // Overridden by CSS class but kept for sync
        // We might want to generate lighter/darker shades here for interaction, 
        // but for now let's just set the main brand color.

        // Font Size Scaling
        let scale = 16;
        if (fontSize === 'large') scale = 18;
        if (fontSize === 'xl') scale = 20;
        root.style.fontSize = `${scale}px`;

        // Font Family
        root.style.setProperty('--font-main', fontFamily);

        // Border Radius
        root.style.setProperty('--radius-md', borderRadius);

        // Persist - No longer needed as theme is fixed
        // localStorage.setItem('themeMode', themeMode);
        // localStorage.setItem('primaryColor', primaryColor);
        // localStorage.setItem('fontSize', fontSize);
        // localStorage.setItem('fontFamily', fontFamily);
        // localStorage.setItem('borderRadius', borderRadius);

    }, [themeMode, primaryColor, fontSize, fontFamily, borderRadius]);

    // No palettes - Single Branding
    const colorPalettes = [];

    const fontOptions = [];

    return (
        <ThemeContext.Provider value={{
            themeMode, setThemeMode,
            primaryColor, setPrimaryColor,
            fontSize, setFontSize,
            fontFamily, setFontFamily,
            borderRadius, setBorderRadius,
            colorPalettes,
            fontOptions
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
