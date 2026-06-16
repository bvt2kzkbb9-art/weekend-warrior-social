# CLOUDINARY INTEGRATION GUIDE

## Cloud Name
```
dxanfwb3l
```

## Upload Presets

```
Preset 1: wws_avatar
├─ Format: Auto (WebP)
├─ Quality: Auto
├─ Folder: avatars
└─ Responsive: Yes

Preset 2: wws_challenge
├─ Format: Auto (WebP)
├─ Quality: 85
├─ Folder: challenges
├─ Width: 1200
├─ Height: 675
└─ Crop: Fill

Preset 3: wws_mission
├─ Format: Auto (WebP)
├─ Quality: Auto
├─ Folder: missions
├─ Width: 300
├─ Height: 300
└─ Crop: Fill

Preset 4: wws_achievement
├─ Format: Auto (WebP)
├─ Quality: Auto
├─ Folder: achievements
├─ Width: 200
├─ Height: 200
└─ Crop: Fill

Preset 5: wws_rank
├─ Format: Auto (WebP)
├─ Quality: Auto
├─ Folder: ranks
├─ Width: 300
├─ Height: 300
└─ Crop: Fill

Preset 6: wws_background
├─ Format: Auto (WebP)
├─ Quality: 90
├─ Folder: backgrounds
├─ Width: 1920
├─ Height: 1080
└─ Crop: Fill

Preset 7: wws_post
├─ Format: Auto (WebP)
├─ Quality: 85
├─ Folder: posts
├─ Width: 800
├─ Height: 600
└─ Crop: Fill
```

## URL Pattern

```
https://res.cloudinary.com/dxanfwb3l/image/upload/
  [transformations]
  /[folder]/[filename]

Example:
https://res.cloudinary.com/dxanfwb3l/image/upload/
  w_1200,h_675,c_fill,q_auto,f_auto
  /challenges/lowca-hydry
```

## Responsive Images

```html
<img 
  src="https://res.cloudinary.com/dxanfwb3l/image/upload/
       w_1200,h_675,c_fill,q_auto,f_auto
       /challenges/lowca-hydry"
  srcset="
    https://res.cloudinary.com/dxanfwb3l/image/upload/
    w_600,h_337,c_fill,q_auto,f_auto
    /challenges/lowca-hydry 600w,
    
    https://res.cloudinary.com/dxanfwb3l/image/upload/
    w_1200,h_675,c_fill,q_auto,f_auto
    /challenges/lowca-hydry 1200w
  "
  sizes="(max-width: 600px) 100vw, 1200px"
  alt="Łowca Hydry"
/>
```

## Lazy Loading

```html
<img
  src="placeholder.svg"
  data-src="https://res.cloudinary.com/dxanfwb3l/..."
  loading="lazy"
  alt="Challenge"
/>
```

## Transform Examples

### Avatar (44x44)
```
w_88,h_88,c_fill,q_auto,f_webp/avatars/
```

### Challenge (1200x675)
```
w_1200,h_675,c_fill,q_auto,f_webp/challenges/
```

### Mission Icon (300x300)
```
w_300,h_300,c_fill,q_auto,f_webp/missions/
```

### Achievement Badge (200x200)
```
w_200,h_200,c_fill,q_auto,f_webp/achievements/
```

### Rank Medal (300x300)
```
w_300,h_300,c_fill,q_auto,f_webp/ranks/
```

### Post Image (800x600)
```
w_800,h_600,c_fill,q_auto,f_webp/posts/
```

### Background (1920x1080)
```
w_1920,h_1080,c_fill,q_auto,f_webp/backgrounds/
```

## File Naming Convention

```
challenges/
├─ lowca-hydry.jpg
├─ slayer-dragon.jpg
├─ king-arena.jpg
└─ ...

missions/
├─ first-login.jpg
├─ comment-5.jpg
├─ post-3.jpg
└─ ...

achievements/
├─ warrior-badge.svg
├─ champion-badge.svg
├─ elite-badge.svg
└─ ...

ranks/
├─ rookie.png
├─ warrior.png
├─ legend.png
└─ ...

backgrounds/
├─ arena-bg.jpg
├─ kroniki-bg.jpg
├─ misje-bg.jpg
└─ ...

posts/
├─ user-post-1.jpg
├─ user-post-2.jpg
└─ ...
```

## JavaScript Helper

```javascript
const CLOUDINARY = {
  cloud: 'dxanfwb3l',
  baseUrl: 'https://res.cloudinary.com/dxanfwb3l/image/upload/',
  
  challenge: (filename, width = 1200, height = 675) => {
    return `${CLOUDINARY.baseUrl}w_${width},h_${height},c_fill,q_auto,f_webp/challenges/${filename}`;
  },
  
  mission: (filename) => {
    return `${CLOUDINARY.baseUrl}w_300,h_300,c_fill,q_auto,f_webp/missions/${filename}`;
  },
  
  achievement: (filename) => {
    return `${CLOUDINARY.baseUrl}w_200,h_200,c_fill,q_auto,f_webp/achievements/${filename}`;
  },
  
  rank: (filename) => {
    return `${CLOUDINARY.baseUrl}w_300,h_300,c_fill,q_auto,f_webp/ranks/${filename}`;
  },
  
  avatar: (filename) => {
    return `${CLOUDINARY.baseUrl}w_88,h_88,c_fill,q_auto,f_webp/avatars/${filename}`;
  },
  
  post: (filename) => {
    return `${CLOUDINARY.baseUrl}w_800,h_600,c_fill,q_auto,f_webp/posts/${filename}`;
  },
  
  background: (filename) => {
    return `${CLOUDINARY.baseUrl}w_1920,h_1080,c_fill,q_auto,f_webp/backgrounds/${filename}`;
  }
};

// Usage
console.log(CLOUDINARY.challenge('lowca-hydry'));
// → https://res.cloudinary.com/dxanfwb3l/image/upload/w_1200,h_675,c_fill,q_auto,f_webp/challenges/lowca-hydry
```

## Folder Structure to Create in Cloudinary

```
dxanfwb3l/
├─ avatars/
├─ challenges/
├─ missions/
├─ achievements/
├─ ranks/
├─ backgrounds/
├─ posts/
└─ icons/
```

