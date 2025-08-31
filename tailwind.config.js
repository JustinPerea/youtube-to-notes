/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Kyoto Scribe Brand Colors - Harmonized Palette
        'kyoto-pink': '#F2C2C1',        // Refined from #F7CAC9 for better harmony
        'digital-lavender': '#D4D4F4',   // Enhanced from #E6E6FA (increased saturation)
        'warm-tan': '#E8B882',           // Refined from #D4A574 for smoother transitions
        'cream': '#F8F3E8',              // Refined from #FFF8E7 for better glass morphism
        'deep-violet': '#7B52D4',        // Refined from #6B46C1 for better balance
        'coral-accent': '#FF9B9B',       // Softened from #FF6B6B (reduced intensity)
        'mint-fresh': '#6EC5BC',         // Refined from #4ECDC4 for better harmony
        'sunrise-gold': '#F4E4A6',       // Toned down from #FFD93D (major fix)
        'charcoal': '#334145',           // Refined from #2D3436 for better contrast
        'silver-mist': '#B2BEC3',        // Maintained - works well
        'pearl': '#F5F5F7',              // Maintained - good neutral
        
        // Temperature Bridge Colors (new additions)
        'warm-bridge': '#E8D5C4',        // Soft beige - connects warm/cool
        'cool-bridge': '#D5E8E8',        // Soft sage - neutral bridge
        'cool-neutral': '#E8F0F2',       // Cool neutral for glass surfaces
        
        // Glass Morphism Optimized Colors
        'glass-warm': '#F8F3E8',         // Warm background for glass
        'glass-cool': '#E8F0F2',         // Cool background for glass
        'glass-text': '#334145',         // Optimized text contrast
        
        // Shadcn UI Colors (maintained for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'glass-lg': '20px',
        'glass-md': '12px',
        'glass-sm': '8px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(59, 130, 246, 0.8)" },
        },
        "fadeInUp": {
          "from": { opacity: 0, transform: "translateY(30px)" },
          "to": { opacity: 1, transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "calc(200px + 100%) 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fadeInUp": "fadeInUp 0.6s ease-out",
        "shimmer": "shimmer 2s infinite",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
