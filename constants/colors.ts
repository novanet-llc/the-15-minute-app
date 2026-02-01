/**
 * This file contains all the color definitions used throughout the app.
 * Keeping them in one place makes it easier to manage and maintain the design system.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#262626',
        background: '#FEFEFE',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ffffff',
        background: '#262626',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
    },
    // Landing/Starting Screen specifically requested colors
    landing: {
        buttonBackground: '#E6D5B7',
        buttonText: '#262626',
        dividerLight: '#ccc',
        dividerDark: '#444',
    },
    calendar: {
        orange: '#FF4500',
        beige: '#E6D5B7',
        dark: '#262626',
    },
    text: {
        light: '#FFFFFF',
        dark: '#262626',
    },
    background: {
        light: '#FEFEFE',
        dark: '#262626',
        darkGrey: '#59555C'
    }
};
