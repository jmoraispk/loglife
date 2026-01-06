// Configure Mermaid for dark theme with white text
document.addEventListener('DOMContentLoaded', function() {
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#3e4451',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#a0a8b8',
                lineColor: '#a0a8b8',
                secondaryColor: '#2a2d3a',
                tertiaryColor: '#1e2029',
                textColor: '#ffffff',
                background: '#2a2d3a',
                mainBkg: '#3e4451',
                secondBkg: '#2a2d3a',
                tertiaryBkg: '#1e2029',
                primaryBorderColor: '#a0a8b8',
                secondaryBorderColor: '#7f8497',
                tertiaryBorderColor: '#5f6477',
                primaryTextColor: '#ffffff',
                secondaryTextColor: '#ffffff',
                tertiaryTextColor: '#ffffff',
                lineColor: '#a0a8b8',
                textColor: '#ffffff',
                fontFamily: 'Roboto, sans-serif'
            }
        });
    }
});

