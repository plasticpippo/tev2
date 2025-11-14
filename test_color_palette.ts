import { availableColors, getContrastingTextColor } from './frontend/utils/color';

// Test the color palette functionality
console.log('Testing color palette functionality...\n');

console.log('Available colors:', availableColors.length);
console.log('First 10 colors:', availableColors.slice(0, 10));

// Test contrasting text colors for a few background colors
const testColors = ['bg-slate-700', 'bg-yellow-300', 'bg-red-600', 'bg-cyan-400'];
testColors.forEach(color => {
    const textColor = getContrastingTextColor(color);
    console.log(`Background: ${color} -> Text: ${textColor}`);
});

console.log('\nColor palette test completed.');