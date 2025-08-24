import * as vscode from "vscode";

export interface AvatarConfig {
  useGitHubAvatars: boolean;
  avatarStyle: "anime" | "gaming" | "minimal" | "geometric";
}

export class AvatarUtils {
  // Updated DiceBear API URLs (v7.x format)
  private static readonly AVATAR_COLLECTIONS = {
    anime: [
      // Avataaars style - great for anime-like characters
      "https://api.dicebear.com/7.x/avataaars/svg?seed=anime1&backgroundColor=ffb3ba,ffdfba,ffffba,baffc9,bae1ff",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=anime2&backgroundColor=ffb3ba,ffdfba,ffffba,baffc9,bae1ff",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=anime3&backgroundColor=ffb3ba,ffdfba,ffffba,baffc9,bae1ff",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=anime4&backgroundColor=ffb3ba,ffdfba,ffffba,baffc9,bae1ff",
      // Big Smile style - cheerful anime-like
      "https://api.dicebear.com/7.x/big-smile/svg?seed=smile1&backgroundColor=ff6b35,4ecdc4,45b7d1,96ceb4",
      "https://api.dicebear.com/7.x/big-smile/svg?seed=smile2&backgroundColor=ff6b35,4ecdc4,45b7d1,96ceb4",
      "https://api.dicebear.com/7.x/big-smile/svg?seed=smile3&backgroundColor=ff6b35,4ecdc4,45b7d1,96ceb4",
      "https://api.dicebear.com/7.x/big-smile/svg?seed=smile4&backgroundColor=ff6b35,4ecdc4,45b7d1,96ceb4",
    ],
    gaming: [
      // Pixel Art style - perfect for gaming
      "https://api.dicebear.com/7.x/pixel-art/svg?seed=gaming1&backgroundColor=1a1a2e,16213e,0f3460,533483",
      "https://api.dicebear.com/7.x/pixel-art/svg?seed=gaming2&backgroundColor=1a1a2e,16213e,0f3460,533483",
      "https://api.dicebear.com/7.x/pixel-art/svg?seed=gaming3&backgroundColor=1a1a2e,16213e,0f3460,533483",
      "https://api.dicebear.com/7.x/pixel-art/svg?seed=gaming4&backgroundColor=1a1a2e,16213e,0f3460,533483",
      // Bottts style - robot gaming characters
      "https://api.dicebear.com/7.x/bottts/svg?seed=bot1&backgroundColor=1a1a2e,16213e,0f3460",
      "https://api.dicebear.com/7.x/bottts/svg?seed=bot2&backgroundColor=1a1a2e,16213e,0f3460",
      "https://api.dicebear.com/7.x/bottts/svg?seed=bot3&backgroundColor=1a1a2e,16213e,0f3460",
      "https://api.dicebear.com/7.x/bottts/svg?seed=bot4&backgroundColor=1a1a2e,16213e,0f3460",
    ],
    minimal: [
      // Initials style - clean and simple
      "https://api.dicebear.com/7.x/initials/svg?seed=minimal1&backgroundColor=667eea,764ba2,f093fb,f5576c",
      "https://api.dicebear.com/7.x/initials/svg?seed=minimal2&backgroundColor=667eea,764ba2,f093fb,f5576c",
      "https://api.dicebear.com/7.x/initials/svg?seed=minimal3&backgroundColor=667eea,764ba2,f093fb,f5576c",
      // Identicon style - geometric patterns
      "https://api.dicebear.com/7.x/identicon/svg?seed=ident1&backgroundColor=4facfe,00f2fe,43e97b,38f9d7",
      "https://api.dicebear.com/7.x/identicon/svg?seed=ident2&backgroundColor=4facfe,00f2fe,43e97b,38f9d7",
      "https://api.dicebear.com/7.x/identicon/svg?seed=ident3&backgroundColor=4facfe,00f2fe,43e97b,38f9d7",
    ],
    geometric: [
      // Shapes style - modern geometric
      "https://api.dicebear.com/7.x/shapes/svg?seed=geo1&backgroundColor=ff9a9e,fecfef,a8edea,fed6e3",
      "https://api.dicebear.com/7.x/shapes/svg?seed=geo2&backgroundColor=ff9a9e,fecfef,a8edea,fed6e3",
      "https://api.dicebear.com/7.x/shapes/svg?seed=geo3&backgroundColor=ff9a9e,fecfef,a8edea,fed6e3",
      "https://api.dicebear.com/7.x/shapes/svg?seed=geo4&backgroundColor=ff9a9e,fecfef,a8edea,fed6e3",
      // Rings style - abstract geometric
      "https://api.dicebear.com/7.x/rings/svg?seed=ring1&backgroundColor=ffd93d,6c5ce7,fd79a8,00b894",
      "https://api.dicebear.com/7.x/rings/svg?seed=ring2&backgroundColor=ffd93d,6c5ce7,fd79a8,00b894",
    ],
  };

  // Custom Dragon Ball Z inspired colors
  private static readonly DBZ_COLORS = [
    "#FF6B35", // Goku Orange
    "#4ECDC4", // Vegeta Teal
    "#45B7D1", // Gohan Blue
    "#96CEB4", // Piccolo Green
    "#FFEAA7", // Krillin Yellow
    "#DDA0DD", // Frieza Purple
    "#F39C12", // Super Saiyan Gold
    "#E74C3C", // Majin Pink
    "#00D2FF", // Kamehameha Blue
    "#FF416C", // Rose Black Pink
  ];

  // Pokemon inspired colors
  private static readonly POKEMON_COLORS = [
    "#FF6B6B", // Charmander Red
    "#4ECDC4", // Squirtle Blue
    "#A8E6CF", // Bulbasaur Green
    "#FFD93D", // Pikachu Yellow
    "#FF8E53", // Charizard Orange
    "#6C5CE7", // Gengar Purple
    "#FD79A8", // Jigglypuff Pink
    "#00B894", // Scyther Green
    "#E17055", // Growlithe Orange
    "#74B9FF", // Psyduck Blue
  ];

  // God of War / Gaming inspired colors
  private static readonly GAMING_COLORS = [
    "#1a1a2e", // Kratos Dark
    "#16213e", // Norse Blue
    "#0f3460", // Deep Ocean
    "#533483", // Royal Purple
    "#7209b7", // Electric Purple
    "#2C3E50", // Dark Slate
    "#34495E", // Midnight
    "#8B0000", // Dark Red (God of War)
    "#191970", // Midnight Blue
    "#2F4F4F", // Dark Slate Gray
  ];

  static getAvatarUrl(authorName: string, authorEmail: string): string {
    const config = this.getAvatarConfig();

    if (config.useGitHubAvatars) {
      const githubUsername = this.extractGithubUsername(
        authorEmail,
        authorName
      );
      if (githubUsername) {
        return this.getGithubAvatarWithFallback(githubUsername, authorName);
      }
    }

    return this.getCustomAvatar(authorName, config.avatarStyle);
  }

  private static getAvatarConfig(): AvatarConfig {
    const config = vscode.workspace.getConfiguration("gitBlameInline");
    return {
      useGitHubAvatars: config.get("useGitHubAvatars", false),
      avatarStyle: config.get("avatarStyle", "anime"),
    };
  }

  private static extractGithubUsername(
    email: string,
    name: string
  ): string | null {
    // Try to extract GitHub username from email patterns
    if (email.includes("@users.noreply.github.com")) {
      const match = email.match(/^(.+)@users\.noreply\.github\.com$/);
      if (match) {
        return match[1].replace(/^\d+-/, ""); // Remove ID prefix if present
      }
    }

    // Check for GitHub email pattern (username+id@users.noreply.github.com)
    if (email.includes("+") && email.includes("@users.noreply.github.com")) {
      const match = email.match(
        /^(\d+\+)?([^+@]+)\+?\d*@users\.noreply\.github\.com$/
      );
      if (match) {
        return match[2];
      }
    }

    // If email doesn't help, try to use the name if it looks like a username
    if (name && /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes(" ")) {
      return name;
    }

    return null;
  }

  private static getGithubAvatarWithFallback(
    username: string,
    fallbackName: string
  ): string {
    const githubUrl = `https://github.com/${username}.png?size=60`;
    const fallbackUrl = this.getCustomAvatar(fallbackName, "anime");

    return `${githubUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}'`;
  }

  private static getCustomAvatar(name: string, style: string): string {
    const hash = this.hashString(name);

    // Try using DiceBear API first, with custom SVG fallback
    const diceBearUrl = this.getDiceBearAvatar(name, style, hash);
    if (diceBearUrl) {
      const customFallback = this.createCustomSVGAvatar(name, style, hash);
      return `${diceBearUrl}" onerror="this.onerror=null; this.src='${customFallback}'`;
    }

    // Fallback to custom SVG avatar
    return this.createCustomSVGAvatar(name, style, hash);
  }

  private static getDiceBearAvatar(
    name: string,
    style: string,
    hash: number
  ): string | null {
    const collections =
      this.AVATAR_COLLECTIONS[style as keyof typeof this.AVATAR_COLLECTIONS];
    if (!collections || collections.length === 0) {
      return null;
    }

    // Pick a consistent avatar from the collection based on name hash
    const selectedAvatar = collections[hash % collections.length];

    // Customize the seed based on the person's name for consistency
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return selectedAvatar.replace(/seed=[^&]*/, `seed=${cleanName}`);
  }

  private static createCustomSVGAvatar(
    name: string,
    style: string,
    hash: number
  ): string {
    switch (style) {
      case "anime":
        return this.createAnimeStyleAvatar(name, hash);
      case "gaming":
        return this.createGamingStyleAvatar(name, hash);
      case "minimal":
        return this.createMinimalAvatar(name, hash);
      case "geometric":
        return this.createGeometricAvatar(name, hash);
      default:
        return this.createAnimeStyleAvatar(name, hash);
    }
  }

  private static createAnimeStyleAvatar(name: string, hash: number): string {
    const colors = [...this.DBZ_COLORS, ...this.POKEMON_COLORS];
    const bgColor = colors[hash % colors.length];
    const initials = this.getInitials(name);

    return this.createSVGAvatar(initials, bgColor, "#FFFFFF", "anime");
  }

  private static createGamingStyleAvatar(name: string, hash: number): string {
    const colors = this.GAMING_COLORS;
    const bgColor = colors[hash % colors.length];
    const initials = this.getInitials(name);

    return this.createSVGAvatar(initials, bgColor, "#00ff41", "gaming");
  }

  private static createMinimalAvatar(name: string, hash: number): string {
    const minimalColors = [
      "#667eea",
      "#764ba2",
      "#f093fb",
      "#f5576c",
      "#4facfe",
      "#00f2fe",
    ];
    const bgColor = minimalColors[hash % minimalColors.length];
    const initials = this.getInitials(name);

    return this.createSVGAvatar(initials, bgColor, "#FFFFFF", "minimal");
  }

  private static createGeometricAvatar(name: string, hash: number): string {
    const geoColors = [
      "#ff9a9e",
      "#fecfef",
      "#a8edea",
      "#fed6e3",
      "#ffd93d",
      "#6c5ce7",
    ];
    const bgColor = geoColors[hash % geoColors.length];
    const initials = this.getInitials(name);

    return this.createSVGAvatar(initials, bgColor, "#2c3e50", "geometric");
  }

  private static createSVGAvatar(
    initials: string,
    bgColor: string,
    textColor: string,
    style: string
  ): string {
    let additionalElements = "";
    let gradientDef = "";

    // Add style-specific decorations and gradients
    switch (style) {
      case "anime":
        gradientDef = `
          <defs>
            <linearGradient id="animeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${this.lightenColor(
                bgColor,
                20
              )};stop-opacity:1" />
            </linearGradient>
          </defs>
        `;
        additionalElements = `
          <circle cx="18" cy="22" r="1.5" fill="${textColor}" opacity="0.4"/>
          <circle cx="42" cy="22" r="1.5" fill="${textColor}" opacity="0.4"/>
          <path d="M25 45 Q30 48 35 45" stroke="${textColor}" stroke-width="1.5" fill="none" opacity="0.3"/>
        `;
        bgColor = "url(#animeGrad)";
        break;

      case "gaming":
        gradientDef = `
          <defs>
            <linearGradient id="gamingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${this.darkenColor(
                bgColor,
                30
              )};stop-opacity:1" />
            </linearGradient>
          </defs>
        `;
        additionalElements = `
          <rect x="3" y="3" width="3" height="3" fill="${textColor}" opacity="0.6" rx="0.5"/>
          <rect x="54" y="3" width="3" height="3" fill="${textColor}" opacity="0.6" rx="0.5"/>
          <rect x="3" y="54" width="3" height="3" fill="${textColor}" opacity="0.6" rx="0.5"/>
          <rect x="54" y="54" width="3" height="3" fill="${textColor}" opacity="0.6" rx="0.5"/>
          <rect x="28" y="5" width="4" height="2" fill="${textColor}" opacity="0.4" rx="1"/>
        `;
        bgColor = "url(#gamingGrad)";
        break;

      case "geometric":
        gradientDef = `
          <defs>
            <linearGradient id="geoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${this.lightenColor(
                bgColor,
                15
              )};stop-opacity:1" />
            </linearGradient>
          </defs>
        `;
        additionalElements = `
          <polygon points="30,8 36,18 24,18" fill="${textColor}" opacity="0.15"/>
          <polygon points="30,52 36,42 24,42" fill="${textColor}" opacity="0.15"/>
          <circle cx="12" cy="30" r="3" fill="${textColor}" opacity="0.1"/>
          <circle cx="48" cy="30" r="3" fill="${textColor}" opacity="0.1"/>
        `;
        bgColor = "url(#geoGrad)";
        break;

      case "minimal":
      default:
        gradientDef = `
          <defs>
            <linearGradient id="minimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:${this.lightenColor(
                bgColor,
                10
              )};stop-opacity:0.9" />
            </linearGradient>
          </defs>
        `;
        bgColor = "url(#minimalGrad)";
        break;
    }

    const svg = `
      <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        ${gradientDef}
        <rect width="60" height="60" rx="30" fill="${bgColor}"/>
        ${additionalElements}
        <text x="30" y="38" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" 
              font-size="18" font-weight="600" fill="${textColor}">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }

  private static lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  private static darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)
      )
        .toString(16)
        .slice(1)
    );
  }

  private static getInitials(name: string): string {
    if (!name) return "??";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    } else {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Method to get avatar URL for webview (with proper error handling)
  static getAvatarUrlForWebview(
    authorName: string,
    authorEmail: string,
    size: number = 60
  ): string {
    const config = this.getAvatarConfig();

    if (config.useGitHubAvatars) {
      const githubUsername = this.extractGithubUsername(
        authorEmail,
        authorName
      );
      if (githubUsername) {
        return `https://github.com/${githubUsername}.png?size=${size}`;
      }
    }

    return this.getCustomAvatar(authorName, config.avatarStyle);
  }

  static getAvatarFallback(authorName: string): string {
    const config = this.getAvatarConfig();
    return this.createCustomSVGAvatar(
      authorName,
      config.avatarStyle,
      this.hashString(authorName)
    );
  }
}
